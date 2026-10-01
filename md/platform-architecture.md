# خطة تطوير منصة تعليم العربية

> تحليل معماري — من ثلاثة مشاريع متفرقة إلى منصة واحدة
> التاريخ: 2026-08-24

---

## المرحلة 1 — تحليل

### ١. هيكل المشاريع الثلاثة

#### ✏️ Arabic Stroke Engine
- **الإحصائيات:** 15 حرف · SVG Mask Reveal · 0 تبعيات
- محرك رسم حروف بتقنية SVG mask + median path
- كل حرف = ملف HTML مستقل + عقد JSON مضمّن
- وضعان: Online (ES modules) و Offline (IIFE مستقل)
- أدوات إنتاج Python/MJS لاستخراج بيانات الخط

#### 🏫 Classroom Lesson
- **الإحصائيات:** P1–P7 مراحل · Activity Engine · 0 تبعيات
- درس صفي كامل: صوت ← شكل ← كتابة ← كلمات ← تمييز ← تقييم
- تحكم المعلم بـ Space/Arrows، كشف تدريجي
- محرك أنشطة عام (command-dispatch + undo + events)
- نظام تصميم ناضج: CSS tokens + ترميز لوني للحروف

#### 📖 Reading Lesson
- **الإحصائيات:** 22 نشاط · Twin-File Pattern · 9 مراحل · Google Fonts فقط
- درس قراءة متكامل: مقدمة ← مفردات ← حوار ← قواعد ← تدريبات ← محادثة ← مراجعة
- 22 نوع نشاط تفاعلي (من wheel إلى board-game إلى progressive-story)
- بنية Twin-File: بيانات الدرس منفصلة عن تعريفات الأنشطة، يربطها bridge.js
- واجهة مرئية مختلفة تماماً: glass-morphism + ألوان بنفسجية/وردية

---

### ٢. ما يُدمج وما يبقى مستقلاً

| العنصر | Classroom | Reading | Stroke | الحكم |
|---|---|---|---|---|
| نظام التصميم (ألوان، خطوط، tokens) | navy/teal/gold، Noto محلي | بنفسجي/وردي، Google Fonts | teal/gold مصغّر | **توحيد** |
| بنية البيانات (الدرس) | LESSON_01 — letters[] + strokeGuides[] | LESSON_DATA — 10 sections | JSON contracts مستقلة | **إبقاء منفصل** مع schema مشترك |
| محرك الأنشطة | ActivityEngine (command-dispatch) | bridge.js + 22 ملف نشاط | — | **توحيد** تحت ActivityEngine |
| الصوت | AudioManager — MP3 + TTS fallback | TTS فقط (SpeechSynthesis) | — | **توحيد** AudioManager |
| التنقل / Phase System | goToPhase(0-6) + keyboard | goToStage(0-8) + stepper | — | **إبقاء منفصل** — سياق مختلف |
| محرك الكتابة | — | — | offline-character-runtime.js | **مستقل** — يُضمّن عند الحاجة |
| Dark/Light theme | localStorage + data-theme | data-theme toggle | dark فقط | **توحيد** |
| الخطوط | Noto Sans/Naskh Arabic — محلي | Noto Sans Arabic + SC — Google | Noto Sans Arabic — محلي | **توحيد** محلي |

---

### ٣. نقاط التكرار

- **تكرار — نظام الخطوط:** Noto Sans Arabic محمّل في ثلاثة أماكن بطرق مختلفة (محلي × 2، Google Fonts × 1). يجب مجلد خطوط واحد مشترك.
- **تكرار — Theme Toggle:** كود تبديل الوضع المظلم/الفاتح مكرر بمنطق مختلف. يكفي ملف واحد مشترك (50 سطراً).
- **تكرار — CSS Reset + Variables:** كل مشروع يعرّف --bg, --text, --radius من الصفر. يجب ملف tokens.css واحد يرث منه الجميع.
- **تعارض — الهوية البصرية:** Classroom = navy/gold كلاسيكي. Reading = بنفسجي/glass-morphism حديث. لا يبدوان من نفس المنتج. يجب توحيد اللغة البصرية.

---

### ٤. Core Platform المناسب

بناءً على التحليل: **Classroom Lesson System** هو النواة الأنسب لبناء المنصة عليها — لأنه:

- يملك نظام التصميم الأكثر نضجاً (CSS tokens كاملة، ترميز لوني، fluid typography)
- يملك محرك أنشطة عام (ActivityEngine) قابل للتوسيع
- يملك AudioManager مع fallback حقيقي
- بالكامل offline-first — متسق مع فلسفة المشروع
- الأقرب لمتطلبات الاستخدام الصفي (تحكم المعلم، projector-first)

Reading Lesson تُدمج **أنشطتها** (22 نشاطاً) تحت ActivityEngine، وتُوحّد هويتها البصرية. Stroke Engine يبقى **مكتبة مستقلة** تُستدعى عبر embed.

---

## المرحلة 2 — المعمارية

### ٥. هيكل المجلدات المقترح

```
fusaha-platform/
├── shared/                          ← الطبقة المشتركة
│   ├── tokens.css                   ← CSS variables موحدة
│   ├── reset.css                    ← CSS reset + base
│   ├── theme.js                     ← dark/light toggle
│   ├── audio-manager.js             ← MP3 + TTS fallback
│   └── fonts/                       ← Noto Sans/Naskh Arabic
│
├── engine/                          ← محركات قابلة للتضمين
│   ├── activity-engine/             ← command-dispatch core
│   │   ├── core.js
│   │   └── definitions/             ← 22+ نوع نشاط
│   │       ├── auditory-identify.js
│   │       ├── board-game.js
│   │       ├── ...
│   │       └── index.js
│   └── stroke-engine/               ← Arabic Stroke (مستقل)
│       ├── runtime.js               ← offline-character-runtime
│       ├── contracts/               ← JSON per character
│       └── tools/                   ← production scripts
│
├── lessons/                         ← بيانات الدروس
│   ├── classroom/
│   │   ├── lesson-01.js             ← LESSON_01 data
│   │   └── lesson-02.js
│   └── reading/
│       ├── lesson-health.js         ← LESSON_DATA
│       └── lesson-family.js
│
├── apps/                            ← التطبيقات (كل واحد = HTML مستقل)
│   ├── classroom/
│   │   ├── index.html
│   │   ├── app.js                   ← P1-P7 state machine
│   │   └── style.css                ← @import shared/tokens
│   ├── reading/
│   │   ├── index.html
│   │   ├── app.js
│   │   ├── bridge.js
│   │   └── style.css
│   └── activities-hub/              ← صفحة الأنشطة المستقلة
│       └── index.html
│
├── assets/
│   ├── audio/
│   └── articulation/
│
├── landing/                         ← الصفحة الرئيسية
│   └── index.html
│
└── md/                              ← التوثيق
    └── Governance/
```

---

### ٦. مخطط المعمارية

```
┌─────────────────────────────────────────────────────────┐
│  ENTRY        │  Landing Page        │  Activities Hub   │
│               │  fusaha.com          │  22+ نشاط         │
├───────────────┼──────────────────────┼───────────────────┤
│               │          ▼           │         ▼         │
├───────────────┼──────────────────────┼───────────────────┤
│  APPS         │  Classroom App       │  Reading App      │
│               │  P1-P7 · Teacher HUD │  9 Stages · Twin  │
├───────────────┼──────────────────────┴───────────────────┤
│               │          ▼                               │
├───────────────┼──────────────────────────────────────────┤
│  ENGINES      │  Activity Engine  │ Stroke Engine │Audio │
│               │  cmd-dispatch     │ SVG mask 15ch │MP3+  │
├───────────────┼──────────────────────────────────────────┤
│               │          ▼                               │
├───────────────┼──────────────────────────────────────────┤
│  SHARED       │  Design Tokens │ Fonts │ Lesson Data │   │
│               │  tokens.css    │ Noto  │ JSON/JS     │   │
└───────────────┴──────────────────────────────────────────┘
```

#### المبادئ المعمارية

- **لا bundler، لا framework.** كل تطبيق = HTML مستقل يحمّل ما يحتاجه بـ script tags. نفس الفلسفة الحالية.
- **Shared = ملفات مشتركة بالمسار النسبي.** لا npm، لا node_modules. كل تطبيق يستورد من `../../shared/`.
- **Stroke Engine = مكتبة مغلقة.** يُستدعى بـ `<script src="../../engine/stroke-engine/runtime.js">` + عقد JSON. لا يعرف شيئاً عن الدرس.
- **الأنشطة = ملفات منفصلة.** كل نشاط = ملف JS واحد يسجّل نفسه في ActivityEngine. إضافة نشاط جديد = ملف جديد فقط.
- **بيانات الدرس = ملف واحد لكل درس.** لا قاعدة بيانات. ملف JS يُصدّر كائناً واحداً. المعلم يضع ملف الدرس ويفتح الصفحة.

---

### ٧. ربط Stroke Engine داخل الدروس

أبسط طريقة وأكثرها أماناً — **تضمين كمكوّن مستقل:**

- التطبيق يحمّل `runtime.js` + عقد الحرف المطلوب
- يوفر عنصر `<div id="stroke-stage">` بالأبعاد المناسبة
- يستدعي `window.ArabicStrokeRuntime.init(containerEl)`
- يتحكم بالتشغيل/الإيقاف عبر API بسيط: `play()`, `pause()`, `reset()`, `setSpeed()`

لا iframe، لا تعقيد. الـ runtime يعمل داخل نفس الصفحة مباشرةً.

---

## المرحلة 3 — خطة التنفيذ

### ٨. خطة 30 يوم

#### الأسبوع 1 (أيام 1–7) — توحيد Design System ⬤
استخراج tokens.css من Classroom → تطبيقه على Reading.
توحيد الخطوط في مجلد واحد. توحيد theme.js.
**النتيجة:** المشروعان يبدوان من نفس المنتج.

#### الأسبوع 2 (أيام 8–14) — هيكلة المجلدات + Activity Engine توحيد ○
إنشاء الهيكل الجديد (fusaha-platform/).
نقل الملفات المشتركة.
ترحيل أنشطة Reading الـ 22 لتعمل تحت ActivityEngine.
**النتيجة:** كل نشاط = ملف واحد مستقل.

#### الأسبوع 3 (أيام 15–21) — دمج Stroke Engine + Activities Hub ○
تضمين Stroke Engine في P4 Classroom.
بناء صفحة Activities Hub.
ربط الأنشطة بصفحة اختيار موحّدة.
**النتيجة:** الأنشطة تُفتح من مكان واحد.

#### الأسبوع 4 (أيام 22–30) — Landing Page + Polish ○
بناء الصفحة الرئيسية (fusaha.com).
اختبار المسار الكامل: Landing → Lesson → Activities.
إصلاح الـ responsive issues.
**النتيجة:** منتج واحد قابل للعرض.

---

### ٩. أول ٥ خطوات تنفيذية

1. **استخراج tokens.css من Classroom** — نسخ جميع CSS variables من `style.css :root` إلى ملف `shared/tokens.css` مستقل. يشمل: ألوان الخلفية، ألوان النص، ألوان الحروف الأربعة، الخطوط، المسافات، الأحجام. ثم استبدال `:root` في Classroom بـ `@import`.

2. **توحيد مجلد الخطوط** — نقل خطوط Noto من `Classroom/assets/fonts/` إلى `shared/fonts/`. تحويل Reading من Google Fonts إلى التحميل المحلي. تحديث جميع مسارات `@font-face`.

3. **تطبيق tokens.css على Reading** — استبدال ألوان Reading (البنفسجي/الوردي) بنظام الألوان الموحّد. الحفاظ على glass-morphism كخيار تصميمي لكن بألوان متسقة. تعديل `style.css` و `activities.css`.

4. **استخراج theme.js + AudioManager** — نقل كود تبديل الثيم إلى `shared/theme.js` (50 سطراً). نقل AudioManager إلى `shared/audio-manager.js`. كلاهما يعملان بنفس الطريقة في المشروعين.

5. **إنشاء هيكل المجلدات** — إنشاء الشجرة الجديدة (`fusaha-platform/`) ونقل الملفات مع الحفاظ على المسارات النسبية. التحقق من أن كلا التطبيقين يعملان بعد النقل بدون أي تعديل على المنطق.

---

### ١٠. 🔴 لا تلمس هذه الأشياء

> **ممنوع التعديل — لتجنب كسر النظام:**

- **بيانات الحروف** — `LESSON_01.letters[]` و `strokeGuides[]` و JSON contracts في Stroke Engine. أي تعديل يكسر الدروس الحالية.
- **منطق P1-P7 في app.js** — الـ state machine تعمل. لا تُعاد كتابتها، فقط تُستخرج منها الأجزاء المشتركة.
- **Stroke Engine runtime.js** — المحرك مستقر. لا يُعدّل أبداً ضمن هذه الخطة. يُستخدم كما هو.
- **22 ملف نشاط في Reading** — تُنقل كما هي. التوحيد يكون في الطبقة التي تستدعيها، لا في المنطق الداخلي لكل نشاط.
- **بنية Twin-File في Reading** — `bridge.js` و `SOURCE_MAP` لا يُعادان كتابتهما. يُلفّان بمحوّل (adapter) فقط.
- **QD-18 / QD-19** — قرارات الحوكمة سارية. لا تُرفع أعلام التأجيل ضمن هذه الخطة.

---

### ١١. ملخص القرار

| | |
|---|---|
| **الاستراتيجية** | Improve → Integrate → Polish |
| **النواة** | Classroom Design System + Activity Engine |
| **الأولوية الأولى** | توحيد الهوية البصرية (الأسبوع الأول) |
| **المبدأ** | لا إعادة كتابة — نقل + ربط + توحيد المظهر |
| **النتيجة بعد 30 يوماً** | منصة واحدة بهوية موحدة، 3 تطبيقات تعمل، 22+ نشاط، 15 حرف مرسوم |
