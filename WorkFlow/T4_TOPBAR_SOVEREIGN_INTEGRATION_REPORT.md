# T4 — Topbar Sovereign Integration Report
## توحيد عقود البيانات وجسر الأنشطة التفاعلية (الخطوة 1)

---

## 🏛 الفلسفة المعمارية

اعتماد **المصدر الموحد للحقيقة (Single Source of Truth)** — ملف `data/lesson.js` يضم الدرس والأنشطة معاً كبيانات JSON نقية. لا وجود لملف `activity.js` مستقل. طبقة الجسر `bridge.js` تتولى قراءة `activities` من `LESSON_DATA` وحقن واجهة التحكم في الشريط العلوي للصدفة.

---

## ✅ المنجزات

### 1. تحديث `LESSON_SCHEMA.md`
- إضافة **القسم 11 — `activities`** بعد `smartFeedback`
- توثيق حقل `activities: []` مع الحقول الإلزامية: `id`, `type`, `titleAr`, `titleZh`, `icon`, `xp`, `data`
- توثيق أنواع البيانات الـ 22 وجدول محتوى `data` لكل نوع
- تحديث قائمة التحقق (القسم 10 → القسم 11 إن وُجد)

### 2. تحديث `data/lesson.js`
- إضافة حقل `activities: []` فارغ في نهاية الكائن، جاهز لاستقبال كتل التوليد
- الحقل تحت التعليق الترقيمي `*** 11. ACTIVITIES ***`

### 3. إنشاء `bridge.js`
- IIFE Namespace آمن (يحرس نفسه بـ `window.ActivityBridge`)
- حقن زر 🎮 ديناميكياً في `.topbar-actions` (بجوار `.desktop-settings`) بدون لمس shell
- الزر يستخدم كلاس `settings-btn` (متطابق بصرياً مع أزرار الصدفة)
- عند النقر: إنشاء `#act-overlay` وإظهاره كطبقة فوقية كاملة
- زر إغلاق ✕ في `#act-topbar` يخفي الطبقة
- CSS محقون داخلياً (لا تعديل على `css/style.css`)

### 4. توثيق التتبع
- هذا الملف — `WorkFlow/T4_TOPBAR_SOVEREIGN_INTEGRATION_REPORT.md`

---

## 📂 هيكل الملفات المؤثرة

| الملف | الحالة | التغيير |
|-------|--------|---------|
| `LESSON_SCHEMA.md` | مُعدَّل | إضافة القسم 11 + تحديث المراجع |
| `data/lesson.js` | مُعدَّل | إضافة `activities: []` |
| `bridge.js` | **جديد** | جسر حقن وتحكم |
| `الدرس.html` | مُعدَّل | إضافة `<script src="bridge.js">` |
| `WorkFlow/T4_TOPBAR_SOVEREIGN_INTEGRATION_REPORT.md` | **جديد** | هذا الملف |

---

## 🔜 الخطوة التالية

نقل ملفات الـ Renderers الـ 22 (من `Activity_Gold_Version/`) إلى مسار `activities/` وربطها مع `bridge.js` عبر خريطة المعرفات.
