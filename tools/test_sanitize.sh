#!/usr/bin/env bash
# ================================================================
# test_sanitize.sh — اختبارات سلوك sanitize_lesson.js
# التشغيل: tools/test_sanitize.sh
# ================================================================
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TD="$(mktemp -d)"; trap 'rm -rf "$TD"' EXIT
pass=0; fail=0

ok()   { printf '  \033[32m✓\033[0m %s\n' "$1"; pass=$((pass+1)); }
no()   { printf '  \033[31m✗\033[0m %s\n' "$1"; printf '      متوقَّع: %s\n      فعلي  : %s\n' "$2" "$3"; fail=$((fail+1)); }
head_(){ printf '\n\033[1m%s\033[0m\n' "$1"; }

run() { node "$ROOT/sanitize_lesson.js" "$@" >/dev/null 2>&1; echo $?; }

# ── ح1: ملف مرفوض (دالة خارج LESSON_DATA) + يحتاج تنظيفاً ─────────
head_ "ح1 — ملف يُرفض ويحتاج تنظيفاً في آن واحد (الحالة المدمِّرة)"
F="$TD/reject.js"
printf '```js\nfunction helper(){}\nconst LESSON_DATA = { meta: {} };\n```\n' > "$F"
ORIG="$(cat "$F")"
CODE="$(run "$F")"
[ "$CODE" = "1" ] && ok "يخرج بـ exit=1 (رفض)" || no "exit code" "1" "$CODE"
if [ "$(cat "$F")" = "$ORIG" ]; then ok "الملف الأصلي لم يُمسّ"
else no "سلامة الملف الأصلي" "غير معدَّل" "كُتب فوقه"; fi
ls "$TD"/reject.js.bak-* >/dev/null 2>&1 \
  && no "لا نسخة احتياطية عند الرفض" "لا توجد (الملف أصلاً سليم)" "أُنشئت نسخة بلا داعٍ" \
  || ok "لا نسخة احتياطية زائدة عند الرفض"

# ── ح2: ملف نظيف يحتاج تنظيفاً — كتابة في المكان ─────────────────
head_ "ح2 — تنظيف ناجح في المكان"
F2="$TD/clean.js"
printf '```js\nconst LESSON_DATA = { meta: { title: "x" } };\n```\n' > "$F2"
ORIG2="$(cat "$F2")"
CODE2="$(run "$F2")"
[ "$CODE2" = "0" ] && ok "يخرج بـ exit=0" || no "exit code" "0" "$CODE2"
if grep -q '```' "$F2"; then no 'أُزيلت علامات code block' 'بلا علامات' 'ما زالت موجودة'; else ok 'أُزيلت علامات code block'; fi
BK=$(ls "$TD"/clean.js.bak-* 2>/dev/null | head -1)
if [ -n "$BK" ]; then
  ok "أُنشئت نسخة احتياطية: $(basename "$BK")"
  [ "$(cat "$BK")" = "$ORIG2" ] && ok "النسخة الاحتياطية تطابق الأصل" || no "محتوى النسخة" "الأصل" "مختلف"
else
  no "نسخة احتياطية قبل الكتابة في المكان" "موجودة" "مفقودة"
fi

# ── ح3: مخرَج منفصل — لا نسخة احتياطية (لا كتابة فوق شيء) ────────
head_ "ح3 — مخرَج منفصل (مسار خط الإنتاج)"
F3="$TD/in.js"; O3="$TD/out.js"
printf '```js\nconst LESSON_DATA = { meta: {} };\n```\n' > "$F3"
ORIG3="$(cat "$F3")"
CODE3="$(run "$F3" "$O3")"
[ "$CODE3" = "0" ] && ok "يخرج بـ exit=0" || no "exit code" "0" "$CODE3"
[ "$(cat "$F3")" = "$ORIG3" ] && ok "ملف المدخل لم يُمسّ" || no "سلامة المدخل" "غير معدَّل" "تغيّر"
[ -f "$O3" ] && ok "أُنشئ ملف المخرَج" || no "ملف المخرَج" "موجود" "مفقود"
ls "$TD"/in.js.bak-* >/dev/null 2>&1 && no "لا نسخة احتياطية" "لا توجد" "أُنشئت" || ok "لا نسخة احتياطية (لا كتابة فوق شيء)"

# ── ح4: ملف نظيف أصلاً — المخرَج يُكتب رغم عدم وجود تعديلات ───────
head_ "ح4 — ملف نظيف أصلاً (خط الإنتاج يتطلب وجود المخرَج)"
F4="$TD/already.js"; O4="$TD/already_out.js"
printf 'const LESSON_DATA = { meta: {} };\n' > "$F4"
CODE4="$(run "$F4" "$O4")"
[ "$CODE4" = "0" ] && ok "يخرج بـ exit=0" || no "exit code" "0" "$CODE4"
[ -f "$O4" ] && ok "المخرَج مكتوب رغم عدم وجود تعديلات" || no "المخرَج" "موجود" "مفقود"
ls "$TD"/already.js.bak-* >/dev/null 2>&1 && no "لا نسخة احتياطية" "لا توجد" "أُنشئت بلا تغيير" || ok "لا نسخة احتياطية (لا تغيير)"

# ── ح5: import statement — رفض آخر ───────────────────────────────
head_ "ح5 — import statement (رفض)"
F5="$TD/imp.js"
printf 'import x from "y";\nconst LESSON_DATA = { meta: {} };\n' > "$F5"
ORIG5="$(cat "$F5")"
CODE5="$(run "$F5")"
[ "$CODE5" = "1" ] && ok "يخرج بـ exit=1" || no "exit code" "1" "$CODE5"
[ "$(cat "$F5")" = "$ORIG5" ] && ok "الملف الأصلي لم يُمسّ" || no "سلامة الملف" "غير معدَّل" "كُتب فوقه"

printf '\n\033[1mالنتيجة: %d نجح · %d فشل\033[0m\n\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
