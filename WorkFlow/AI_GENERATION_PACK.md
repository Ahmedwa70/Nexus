# AI_GENERATION_PACK — حزمة توليد الدروس للذكاء الاصطناعي (Twin-File Pattern)
> `LESSON_SCHEMA.md` + `activity.js` + `bridge.js` — أدوات الإنتاج التفاعلي

## الملفات المطلوبة للتوليد

| الملف | الوظيفة |
|-------|---------|
| `LESSON_SCHEMA.md` | الميثاق الكامل — هيكل `lesson.js` وقواعده (الأقسام 1–9, 9-U اختياري, 10) |
| `data/lesson.js` (قالب) | ملف البيانات المستهدف — يُملأ بالقسم 1–10، القسم 11 فارغ |
| `validators.js` | فحص البنية — يتأكد من صحة الأقسام 1–10 |
| `activity.js` | **ثابت على السيرفر** — ActivityConfig مع sourceField لـ 22 لعبة |
| `bridge.js` | **ثابت على السيرفر** — يحل البيانات ديناميكياً عبر SOURCE_MAP |
| `activities/*.js` | 22 محرك لعبة — مجمد، لا يُعدّل |
| `css/activities.css` | أنماط زجاجية للألعاب — مجمد، لا يُعدّل |

## ملفات الصدفة (مجمدة، لا تُعدّل)
- `الدرس.html` — القالب الرئيسي للصفحة
- `activity.js` — تكوين الأنشطة (مستقر على السيرفر)
- `js/app.js` — تطبيق الدرس الأساسي
- `css/style.css` — أنماط الصدفة

## 🏗️ معمارية التوأم الرقمي المنفصل

```
data/lesson.js (1-10)   activity.js (ActivityConfig)
       ↕                       ↕
    LESSON_DATA  ←───  bridge.js  ───→  22 Renderers
                        (SOURCE_MAP)
```

- **`data/lesson.js`**: بيانات أكاديمية نقيّة فقط — vocab, dialogue, exercises, إلخ
- **`activity.js`**: تكوين الأنشطة — sourceField يحدد مصدر البيانات لكل لعبة
- **`bridge.js`**: يقرأ ActivityConfig → يسحب البيانات من LESSON_DATA → يحولها → يرسلها للعبة

## بروتوكول التوليد (دقيقتان لدرس جديد)

### الخطوة 1: تجهيز المحتوى
- استخرج 12–25 كلمة مفردات (مشكولة، مترجمة، إيموجي)
- رتب أول 4 كلمات vocab لتكون مناسبة لـ selectWords
- استخرج 6–12 سطر حوار متسلسل
- استخرج 3–5 أخطاء شائعة لـ smartFeedback
- تأكد من أن **vocab.length ≥ 12** و **dialogue.length ≥ 6**

### الخطوة 2: توليد lesson.js
- املأ الأقسام 1–10 حسب قواعد `LESSON_SCHEMA.md`
- **القسم 9-U (اختياري)**: إذا أردت تخصيص لعبة مخصصة، أضف الحقل تحت `exercises` (راجع `LESSON_SCHEMA.md` §9-U)
- **القسم 11: `activities: []` — فارغ إلزامياً، لا تُضف أي عناصر**
- راجع شروط TWIN-1 إلى TWIN-4 في بداية الميثاق

### الخطوة 3: التحقق
```bash
node validate_lesson.js data/lesson.js     # فحص البنية — صفر أخطاء مطلوب
node sanitize_lesson.js data/lesson.js      # تنظيف إن لزم
```

### الخطوة 4: النشر
- انسخ `data/lesson.js` فقط إلى السيرفر
- كل الملفات الأخرى (activity.js, bridge.js, html, js/, css/, activities/) تبقى ثابتة
- أعد تحميل الصفحة — الأنشطة الـ 22 تشتغل تلقائياً بدون أي بيانات في lesson.js

## لماذا لم يعد القسم 11 يحتوي أنشطة؟

```js
// قبل T5 (قديماً): activities: [22 كائناً ضخماً — ~555 سطراً]
// بعد T5 (التوأم):  activities: []  ←  فارغ
```

الألعاب الـ 22 تسحب بياناتها حياً عبر sourceField:
- `sourceField: "vocab"` → wheel, memory, dark-room, speed-reveal, quick-reaction, sound-match
- `sourceField: "dialogue"` → sentence-builder, progressive-story
- `sourceField: "exercises.mcq"` → tap-choice, mini-maze
- `sourceField: "exercises.trueFalse"` → swipe-quiz
- `sourceField: "exercises.*"` / `"grammar"` / `"vocab"` / `"explain"` → الألعاب المخصصة الـ 11 تسحب بياناتها ديناميكياً:
  - `exercises.customHiddenReveal` → hidden-reveal (id:5)
  - `exercises.customWechat` → wechat (id:8)
  - `exercises.customWhoAmI` → who-am-i (id:9)
  - `grammar` (محول تلقائي) → traffic-light (id:11), conjugation-ladder (id:16)
  - `vocab` (محول تلقائي) → dots-hunter (id:15), spot-difference (id:21)
  - `exercises.mcq` (محول تلقائي) → punctuation-editor (id:17)
  - `exercises.customYoungDoctor` → young-doctor (id:18)
  - `exercises.customHealthLetter` → health-letter (id:19)
  - `explain` (محول تلقائي) → board-game (id:20)

> **الخلاصة**: الـ AI مسؤول عن جودة الأقسام 1–10، ويمكنه اختيارياً تخصيص محتوى الألعاب عبر القسم 9-U (ضمن `exercises`). إذا غابت الحقول 9-U → الأنشطة تعمل تلقائياً بالبيانات الاحتياطية في `activity.js`.
> راجع `CUSTOM_ACTIVITIES_DYNAMIC_PROPOSAL.md` لتفاصيل transformers والـ SOURCE_MAP.
