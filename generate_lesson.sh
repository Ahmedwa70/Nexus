#!/bin/bash
# ================================================================
# generate_lesson.sh — Arabic Interactive Lessons
# الاستخدام:
#   ./generate_lesson.sh
# ================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

# ── المسارات ─────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
RAW="$SCRIPT_DIR/data/lesson_raw.js"
CLEAN="$SCRIPT_DIR/data/lesson_clean.js"
FINAL="$SCRIPT_DIR/data/lesson.js"
BACKUP="$SCRIPT_DIR/data/lesson_backup.js"
SANITIZE="$SCRIPT_DIR/sanitize_lesson.js"
VALIDATE="$SCRIPT_DIR/validate_lesson.js"
CROSSCHECK="$SCRIPT_DIR/tools/check_activities.js"
PUBLISH_TMP="$SCRIPT_DIR/data/.lesson.js.tmp.$$"

cleanup() {
    rm -f "$CLEAN" "$PUBLISH_TMP"
}
trap cleanup EXIT

line() { echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; }

clear
line
echo -e "  ${BOLD}📚 Arabic Interactive Lessons — Lesson Publisher${NC}"
echo -e "  نشر درس جديد | $(date '+%Y-%m-%d %H:%M')"
line
echo ""

# ── التحقق من Node.js ─────────────────────────────────────────────
if ! command -v node &> /dev/null; then
    echo -e "  ${RED}❌ Node.js غير مثبّت${NC}"
    echo -e "  ${YELLOW}→ حمّل Node.js من: https://nodejs.org${NC}"
    echo ""
    exit 1
fi

# ── التحقق من الملفات ────────────────────────────────────────────
if [ ! -f "$RAW" ]; then
    echo -e "  ${RED}❌ الملف غير موجود: data/lesson_raw.js${NC}"
    echo ""
    echo -e "  ${YELLOW}→ احفظ ملف الدرس الجديد باسم lesson_raw.js داخل مجلد data/${NC}"
    echo ""
    exit 1
fi

if [ ! -f "$SANITIZE" ]; then
    echo -e "  ${RED}❌ ملف مفقود: sanitize_lesson.js${NC}"
    exit 1
fi

if [ ! -f "$VALIDATE" ]; then
    echo -e "  ${RED}❌ ملف مفقود: validate_lesson.js${NC}"
    exit 1
fi

if [ ! -f "$CROSSCHECK" ]; then
    echo -e "  ${RED}❌ ملف مفقود: tools/check_activities.js — لا يمكن تجاوز الفحص التقاطعي${NC}"
    exit 1
fi

if [ ! -f "$FINAL" ]; then
    echo -e "  ${RED}❌ الدرس الحالي غير موجود: data/lesson.js${NC}"
    exit 1
fi

echo -e "  ${BOLD}المدخل:${NC}  data/lesson_raw.js"
echo -e "  ${BOLD}الناتج:${NC}  data/lesson.js"
echo ""

# ── STEP 1: Sanitize ──────────────────────────────────────────────
echo -e "  ${BOLD}[1/4]${NC} 🧹 تنظيف الملف..."
echo ""

node "$SANITIZE" "$RAW" "$CLEAN"
SANITIZE_EXIT=$?
echo ""

if [ $SANITIZE_EXIT -ne 0 ]; then
    line
    echo -e "  ${RED}${BOLD}⛔ توقف — الملف يحتاج مراجعة يدوية${NC}"
    echo -e "  ${YELLOW}→ افتح data/lesson_raw.js وأصلح المشاكل أعلاه${NC}"
    echo ""
    rm -f "$CLEAN"
    exit 1
fi

# ── STEP 2: Validate ──────────────────────────────────────────────
echo -e "  ${BOLD}[2/4]${NC} ✅ التحقق من البنية والمحتوى..."
echo ""

node "$VALIDATE" "$CLEAN"
VALIDATE_EXIT=$?
echo ""

if [ $VALIDATE_EXIT -ne 0 ]; then
    line
    echo -e "  ${RED}${BOLD}⛔ توقف — الدرس يحتوي أخطاء تمنع النشر${NC}"
    echo -e "  ${YELLOW}→ أعِد توليد الدرس بعد تصحيح الأخطاء أعلاه${NC}"
    echo ""
    rm -f "$CLEAN"
    exit 1
fi

# ── STEP 3: Cross-check activities ───────────────────────────────
# المدقّق يفحص lesson.js معزولاً ولا يعرف activity.js. فدرسٌ ينقصه
# حقل نشاط يمرّ عنده «ممتازاً» ثم يفتح النشاط فارغاً أمام الصف.
echo -e "  ${BOLD}[3/4]${NC} 🔗 الفحص التقاطعي للأنشطة الـ25..."
echo ""

node "$CROSSCHECK" "$CLEAN"
CROSS_EXIT=$?
echo ""
if [ $CROSS_EXIT -ne 0 ]; then
    line
    echo -e "  ${RED}${BOLD}⛔ توقف — أنشطة لن تعمل بهذا الدرس${NC}"
    echo -e "  ${YELLOW}→ أضف الحقول الناقصة إلى data/lesson_raw.js ثم أعِد التشغيل${NC}"
    echo ""
    exit 1
fi

# ── STEP 4: Publish ───────────────────────────────────────────────
echo -e "  ${BOLD}[4/4]${NC} 📤 نشر الدرس..."
echo ""

if ! cp "$FINAL" "$BACKUP"; then
    line
    echo -e "  ${RED}❌ فشل إنشاء النسخة الاحتياطية — لم يتغير الدرس الحالي${NC}"
    echo ""
    exit 1
fi
echo -e "  💾 نسخة احتياطية: data/lesson_backup.js"

if ! cp "$CLEAN" "$PUBLISH_TMP"; then
    line
    echo -e "  ${RED}❌ فشل تجهيز الملف المؤهل — لم يتغير الدرس الحالي${NC}"
    echo ""
    exit 1
fi

if ! mv -f "$PUBLISH_TMP" "$FINAL"; then
    line
    echo -e "  ${RED}❌ فشل تثبيت الملف — بقي الدرس الحالي دون تغيير${NC}"
    echo ""
    exit 1
fi

# ── النجاح ────────────────────────────────────────────────────────
line
echo ""
echo -e "  ${GREEN}${BOLD}🎉 تم النشر بنجاح!${NC}"
echo ""
echo -e "  ${GREEN}✅ الدرس جاهز في:${NC} data/lesson.js"
echo ""
echo -e "  ${YELLOW}→ افتح الدرس.html في المتصفح${NC}"
echo ""
line
echo ""
exit 0
