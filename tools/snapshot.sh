#!/usr/bin/env bash
# ================================================================
# snapshot.sh — نظام لقطات المشروع (قبل/بعد أي عمل)
# Project snapshot system — take, list, inspect and restore
# ================================================================
# الاستخدام / Usage:
#   tools/snapshot.sh create "وصف اللقطة" [--keep]  # أخذ لقطة (--keep = محمية من prune)
#   tools/snapshot.sh list                           # عرض اللقطات
#   tools/snapshot.sh show    <id>                   # تفاصيل لقطة
#   tools/snapshot.sh diff    <id>                   # الفرق بين اللقطة والحالة الحالية
#   tools/snapshot.sh restore <id> [--clean]         # استرجاع (لقطة أمان تلقائية أولاً)
#   tools/snapshot.sh prune   [n]                    # إبقاء آخر n لقطة غير محمية (افتراضي 20)
#
# ملاحظات:
#   • اللقطات تُحفظ في .snapshots/ وهي مستثناة من Git.
#   • restore يُنفَّذ من نسخة مؤقتة من السكربت حتى لا يُعيد كتابة نفسه أثناء العمل.
#   • restore لا يمسّ مجلد .git إطلاقاً — تاريخ Git يبقى سليماً دائماً.
# ================================================================
set -euo pipefail

ROOT="${SNAP_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
SNAPDIR="$ROOT/.snapshots"
EXC=( --exclude=./.git --exclude=./.snapshots --exclude=./node_modules )

mkdir -p "$SNAPDIR"

die() { printf '\033[31m✗ %s\033[0m\n' "$*" >&2; exit 1; }
ok()  { printf '\033[32m✓ %s\033[0m\n' "$*"; }
inf() { printf '  %s\n' "$*"; }

_scan() {  # يطبع sha256 لكل ملف يخضع للّقطات
  ( cd "$ROOT" && find . -type f \
      -not -path './.git/*' -not -path './.snapshots/*' -not -path './node_modules/*' \
      -print0 | sort -z | xargs -0 -r sha256sum )
}

# ---------------------------------------------------------------- create
cmd_create() {
  local label="snapshot" keep=0 a
  for a in "$@"; do
    case "$a" in --keep) keep=1 ;; *) label="$a" ;; esac
  done

  local id n=1
  id="$(date -u +%Y%m%d-%H%M%S)"
  while [ -e "$SNAPDIR/$id.tar.gz" ]; do id="$(date -u +%Y%m%d-%H%M%S)-$n"; n=$((n+1)); done

  tar -czf "$SNAPDIR/$id.tar.gz" -C "$ROOT" "${EXC[@]}" . 2>/dev/null
  _scan > "$SNAPDIR/$id.sums" 2>/dev/null || true

  {
    echo "id=$id"
    echo "label=$label"
    echo "utc=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo "branch=$(git -C "$ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || echo '-')"
    echo "head=$(git -C "$ROOT" rev-parse HEAD 2>/dev/null || echo 'no-git')"
    echo "dirty_files=$(git -C "$ROOT" status --porcelain 2>/dev/null | wc -l | tr -d ' ')"
    echo "protected=$keep"
    echo "size=$(du -h "$SNAPDIR/$id.tar.gz" | cut -f1)"
    echo "files=$(wc -l < "$SNAPDIR/$id.sums" | tr -d ' ')"
  } > "$SNAPDIR/$id.meta"

  ok "اللقطة: $id — $label$([ "$keep" = 1 ] && echo '  [محمية]')" >&2
  inf "ملفات=$(wc -l < "$SNAPDIR/$id.sums" | tr -d ' ')  حجم=$(du -h "$SNAPDIR/$id.tar.gz" | cut -f1)" >&2
  echo "$id"
}

# ---------------------------------------------------------------- list
cmd_list() {
  local m found=0
  printf '%-20s %-6s %-8s %-21s %s\n' "ID" "PROT" "SIZE" "UTC" "LABEL"
  printf '%s\n' "---------------------------------------------------------------------------------------"
  for m in $(ls -1 "$SNAPDIR"/*.meta 2>/dev/null | sort); do
    found=1
    printf '%-20s %-6s %-8s %-21s %s\n' \
      "$(sed -n 's/^id=//p' "$m")" \
      "$([ "$(sed -n 's/^protected=//p' "$m")" = 1 ] && echo '🔒' || echo '-')" \
      "$(sed -n 's/^size=//p' "$m")" \
      "$(sed -n 's/^utc=//p' "$m")" \
      "$(sed -n 's/^label=//p' "$m")"
  done
  [ "$found" -eq 1 ] || inf "(لا توجد لقطات بعد)"
}

# ---------------------------------------------------------------- show
cmd_show() {
  local id="${1:?يلزم id}"
  [ -f "$SNAPDIR/$id.meta" ] || die "لا توجد لقطة: $id"
  cat "$SNAPDIR/$id.meta"
}

# ---------------------------------------------------------------- diff
cmd_diff() {
  local id="${1:?يلزم id}"
  [ -f "$SNAPDIR/$id.sums" ] || die "لا توجد بصمات للقطة: $id"
  local now; now="$(mktemp)"; _scan > "$now" 2>/dev/null || true

  local changed=0 h f cur
  while IFS= read -r line; do
    h="${line%% *}"; f="${line#*  }"
    cur="$(awk -v p="$f" '{ i=index($0,"  "); if (substr($0,i+2)==p) { print substr($0,1,i-1); exit } }' "$now")"
    if   [ -z "$cur" ];      then printf '\033[31mD\033[0m  %s\n' "$f"; changed=1
    elif [ "$cur" != "$h" ]; then printf '\033[33mM\033[0m  %s\n' "$f"; changed=1; fi
  done < "$SNAPDIR/$id.sums"

  while IFS= read -r line; do
    f="${line#*  }"
    awk -v p="$f" '{ i=index($0,"  "); if (substr($0,i+2)==p) { found=1; exit } } END { exit !found }' \
      "$SNAPDIR/$id.sums" || { printf '\033[32mA\033[0m  %s\n' "$f"; changed=1; }
  done < "$now"

  rm -f "$now"
  [ "$changed" -eq 0 ] && ok "لا فرق بين $id والحالة الحالية"
  return 0
}

# ---------------------------------------------------------------- restore
cmd_restore() {
  local id="${1:?يلزم id}" clean=0
  [ "${2:-}" = "--clean" ] && clean=1
  [ -f "$SNAPDIR/$id.tar.gz" ] || die "لا توجد لقطة: $id"

  # إعادة التنفيذ من نسخة مؤقتة: وإلا أعاد الاسترجاعُ كتابةَ هذا السكربت أثناء تشغيله
  if [ "${SNAP_REEXEC:-}" != "1" ]; then
    local runner; runner="$(mktemp)"
    cp "${BASH_SOURCE[0]}" "$runner"
    SNAP_REEXEC=1 SNAP_ROOT="$ROOT" bash "$runner" restore "$id" ${clean:+$([ "$clean" = 1 ] && echo --clean)}
    rm -f "$runner"; return 0
  fi

  inf "لقطة أمان قبل الاسترجاع…"
  local safety; safety="$(cmd_create "AUTO-SAFETY before restore of $id" 2>/dev/null)"

  # حذف ما كان داخل اللقطة فقط، ثم فك الضغط (مجلد .git لا يُمسّ)
  local f
  while IFS= read -r f; do rm -f "$ROOT/${f#./}" 2>/dev/null || true
  done < <(cut -d' ' -f3- "$SNAPDIR/$id.sums" | sed 's/^ *//')
  tar -xzf "$SNAPDIR/$id.tar.gz" -C "$ROOT"

  # ملفات أُضيفت بعد اللقطة: تُعرض، ولا تُحذف إلا مع --clean
  local extras=0
  while IFS= read -r f; do
    awk -v p="$f" '{ i=index($0,"  "); if (substr($0,i+2)==p) { found=1; exit } } END { exit !found }' \
      "$SNAPDIR/$id.sums" && continue
    extras=1
    if [ "$clean" = 1 ]; then rm -f "$ROOT/${f#./}"; printf '\033[31m-\033[0m  حُذف %s\n' "$f"
    else printf '\033[33m!\033[0m  متبقٍّ (أُضيف بعد اللقطة): %s\n' "$f"; fi
  done < <( cd "$ROOT" && find . -type f \
      -not -path './.git/*' -not -path './.snapshots/*' -not -path './node_modules/*' | sort )

  ok "تم الاسترجاع إلى: $id"
  [ "$extras" = 1 ] && [ "$clean" != 1 ] && inf "لإزالة المتبقّي: tools/snapshot.sh restore $id --clean"
  inf "لقطة الأمان: $safety"
  return 0
}

# ---------------------------------------------------------------- prune
cmd_prune() {
  local keep="${1:-20}" i=0 m id
  for m in $(ls -1 "$SNAPDIR"/*.meta 2>/dev/null | sort -r); do
    [ "$(sed -n 's/^protected=//p' "$m")" = 1 ] && continue   # المحميّة لا تُحذف ولا تُحتسب
    i=$((i+1))
    if [ "$i" -gt "$keep" ]; then
      id="$(sed -n 's/^id=//p' "$m")"
      rm -f "$SNAPDIR/$id.tar.gz" "$SNAPDIR/$id.meta" "$SNAPDIR/$id.sums"
      inf "حُذفت: $id"
    fi
  done
  ok "أُبقي على آخر $keep لقطة غير محمية (المحميّة لا تُحذف)"
}

case "${1:-}" in
  create)  shift; cmd_create "$@" ;;
  list)    shift; cmd_list "$@" ;;
  show)    shift; cmd_show "$@" ;;
  diff)    shift; cmd_diff "$@" ;;
  restore) shift; cmd_restore "$@" ;;
  prune)   shift; cmd_prune "$@" ;;
  *) sed -n '2,24p' "${BASH_SOURCE[0]}" | sed 's/^#\{1,\} \{0,1\}//' ;;
esac
