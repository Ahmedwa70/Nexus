# 📐 LESSON_SCHEMA — قانون بناء ملف `lesson.js` (Twin-File Pattern)
> النسخة: 2.0 | متوافق مع: `app.js` v1 + `activity.js` v1 + `bridge.js` v2  
> القاعدة الذهبية: **لا تفكر — فقط امْلأ القالب (الأقسام 1–10 فقط، القسم 11 مجمّد)**

---

## 🔴 CRITICAL RUNTIME SHIELD — درع الحماية الإلزامي

> خرق أي بند هنا يسبب **انهياراً فورياً للمنصة (Crash)**. الـ AI يخطئها كثيراً — التزم بها حرفياً.

```
🔴 CRITICAL-1: ممنوع استخدام قوالب النصوص البرمجية للتأطير (No Markdown Wrappers)
   ✅ صحيح:  const LESSON_DATA = {  (السطر الأول مباشرة)
   ❌ خطأ:   ```js\nconst LESSON_DATA = {

🔴 CRITICAL-2: شرط الحاصرة المائلة (Backticks Code Constraint)
   ✅ صحيح:  sentence: `نص <input class="fill-input" data-answer="كلمة">`,
   ❌ خطأ:   sentence: "نص <input class=\"fill-input\" data-answer=\"كلمة\">",
   القاعدة: أي حقل يحتوي HTML (خاصة sentenceTransform.sentence) → backtick `...` حصراً

🔴 CRITICAL-3: تطابق حالات الأحرف الصارم (Case-Sensitivity Class)
   ✅ صحيح:  dragWords cat: "active"  ←→  dragZones accept: "active"
   ❌ خطأ:   dragWords cat: "Active"  ←→  dragZones accept: "active"  ← لن يعمل

🔴 CRITICAL-4: حظر حشو الأنشطة التفاعلية (Section 11 Absolute Lock)
   ✅ صحيح:  activities: []  (فارغ إلزامياً وثابتاً)
   ❌ خطأ:   activities: [{...}]  أي عنصر داخل المصفوفة
   السبب: Twin-File Architecture — الأنشطة تُدار عبر activity.js + bridge.js

🔴 CRITICAL-5: فصل اللغات في حقول التمارين (Language Separation in Exercise Fields)
   القاعدة: حقل ar يحتوي عربي فقط — ممنوع خلط ترجمة صينية داخله
   ✅ صحيح:  { ar: "مُهَنْدِس", correct: true }
   ❌ خطأ:   { ar: "مُهَنْدِس · 工程师", correct: true }
   الاستثناء الوحيد: حقل question في contextAnalysis يستخدم " · " كفاصل (يُقسم برمجياً)
```

---

## 🔷 TWIN-FILE DYNAMIC — شروط فولاذية للألعاب الديناميكية (Twin-Engine Constraints)

> منذ T5، انتقلت المنصة لمعمارية **التوأم الرقمي المنفصل**: `data/lesson.js` (بيانات نقيّة 10 أقسام) ← `activity.js` (`ActivityConfig` مع `sourceField`) ← `bridge.js` (SOURCE_MAP + resolveData يحلان ديناميكياً).
> الألعاب الـ 22 أصبحت "توأماً صامتاً" مستقراً على السيرفر. **أي خلل في الأقسام 1–10 يكسر الألعاب صامتاً بدون أي error في الكونسول.**

```
🔷 TWIN-1 — حد كفاية المفردات (vocab)
   القاعدة: vocab ≥ 12 كلمة مشكولة ومترجمة — لتغذية عجلة الحظ وبطاقات الذاكرة حياً
   ✅ vocab.length ≥ 12 → wheel, memory, sound-match, dark-room, speed-reveal, quick-reaction تمتلئ تلقائياً
   ❌ vocab.length < 12 → ألعاب المفردات تظهر فارغة أو ناقصة صامتاً

🔷 TWIN-2 — حد كفاية الحوار (dialogue)
   القاعدة: dialogue ≥ 6 أسطر متسلسلة حقيقية (ويفضل ≤ 12)
   ✅ dialogue.length ≥ 6 → sentence-builder, progressive-story تسحب سطورها حياً
   ❌ dialogue.length < 6 → builder والقصة يظهران بصفحات قليلة جداً

🔷 TWIN-3 — جودة تمارين السحب والفقرة (blanks ←→ answers)
   القاعدة: عدد ___ في paragraph.sentence و challenge.sentence = عدد عناصر answers[] بالضبط
   │ paragraph: sentence يحتوي X فراغات → answers.length = X
   │ challenge: sentence يحتوي Y فراغات → answers.length = Y
   │ fillBlanks: كل sentence تحتوي ___ واحد → answer واحد
   ✅ تطابق تام → الإدخال يقبل الإجابات
   ❌ عدم تطابق → data-answer="undefined" — التمرين ميت صامتاً

🔷 TWIN-4 — الفهرسة التلقائية لتمرين الكلمات (selectWords)
   القاعدة: vocab[0..3] = الخيارات الصحيحة، vocab[4..7] = الخيارات الخاطئة
   ✅ رتّب أول 4 كلمات في vocab بعناية — هي ما يُختبر عليه التمرين
   ✅ vocab[4..7] كلمات مشتتة من نفس المجال لكنها خاطئة
   ❌ vocab[0..3] تحتوي كلمات عشوائية → selectWords يختبر خطأ
```

> ⚠️ ملحق: جودة ألعاب التمارين (mcq/trueFalse) — تأكد أن mcq[].correct ضمن 0-3 وأن trueFalse[].correct = true|false — أي خطأ هنا يظهر سؤالاً غير قابل للإجابة.

بعد تطبيق هذه الشروط، راجع يدوياً أن جميع العلاقات (RELATIONSHIP-1 إلى 5) محققة.

---

## ⚠️ قواعد صارمة قبل البدء

```
❌ لا تخترع مفاتيح جديدة لم تكن في القالب
❌ لا تحذف أي مفتاح حتى لو بدا غير ضروري
❌ لا تغير ترتيب الأقسام (1 → 10)
❌ لا تغير اسم المتغير الرئيسي: LESSON_DATA
❌ لا تضف import / export / module.exports
❌ لا تحذف التعليقات الترقيمية بين الأقسام: // *** 1. META ... *** — احتفظ بها كما هي في القالب
❌ لا تكرر أي إيموجي في vocab — كل إيموجي يُستخدم مرة واحدة فقط
❌ لا تضف `\`\`\`js أو \`\`\` في البداية أو النهاية — الملف الناتج يجب أن يكون JS خالصاً فقط
❌ لا تستخدم `"..."` (double quotes) لأي نص يحتوي على علامات اقتباس مزدوجة `"` بداخله — استخدم backticks `` ` `` بدلاً منها
✅ جميع الإجابات (answer / answers / data-answer) تُكتب بدون تشكيل — النظام يقارن بدون حركات تلقائياً
✅ فقط استبدل القيم النصية والبيانات داخل القالب
✅ vocab.emoji = نص (string) وليس مصفوفة (array) — "🏠" أو "🏠 🔑"
✅ أي خاصية `zh:` تحتوي على `"` داخلها → استخدم backticks `` `zh: "نص"` `` وليس `"zh: "نص""`
```

---

## 🔗 علاقات حرجة — Silent Failures إذا خُولفت

> هذه العلاقات لا تسبب crash لكن تُنتج تمارين مكسورة صامتة بدون أي error.

```
RELATIONSHIP-1: dragWords.cat  ←→  dragZones.accept
  القاعدة: كل قيمة cat في dragWords يجب أن تكون موجودة بالضبط في accept بـ dragZones
  ✅ صحيح:  dragWords: [{cat:"active"}]  +  dragZones: [{accept:"active"}]
  ❌ خطأ:   dragWords: [{cat:"Active"}]  +  dragZones: [{accept:"active"}]  ← case مختلف
  ❌ خطأ:   dragWords: [{cat:"quiet"}]   +  dragZones لا تحتوي accept:"quiet"
  النتيجة عند الخطأ: الكلمات لا تُقبَل في أي zone — التمرين ميت صامتاً

RELATIONSHIP-2: paragraph.sentence  ←→  paragraph.answers
  القاعدة: عدد ___ في sentence يجب = عدد عناصر answers بالضبط
  ✅ صحيح:  sentence: "أنا ___ في ___."   answers: ["طالب", "المدرسة"]
  ❌ خطأ:   sentence: "أنا ___ في ___."   answers: ["طالب"]  ← فراغ بدون إجابة
  النتيجة عند الخطأ: input الثاني data-answer="undefined" — لا يُقبل أي إجابة

RELATIONSHIP-3: challenge.sentence  ←→  challenge.answers
  نفس قاعدة RELATIONSHIP-2 تماماً

RELATIONSHIP-4: vocab[0..3]  ←→  selectWords (correct)
  القاعدة: أول 4 كلمات في vocab = الخيارات الصحيحة في تمرين selectWords
  القاعدة: vocab[4..7] = الخيارات الخاطئة في تمرين selectWords
  ✅ رتّب vocab بحيث أول 4 كلمات هي الكلمات التي يُختبر عليها التمرين
  ❌ لا تضع كلمات عشوائية في أول 4 مواضع إذا كانت لا تناسب موضوع selectWords

RELATIONSHIP-5: dialogueFill.lines  ←→  dialogue
  القاعدة: أسطر dialogueFill يجب أن تُؤخذ من حوار الدرس الفعلي
  ❌ لا تخترع جملاً جديدة — هذا يُربك الطالب
```

---

## 🏗️ هيكل الملف الكامل (بالترتيب الإلزامي)

```
LESSON_DATA = {
  meta          → القسم 1
  hook          → القسم 2
  thinking      → القسم 3
  vocab         → القسم 4
  dialogue      → القسم 5
  dialogueScenes → القسم 6  ← يقرأها app.js مباشرة
  explain       → القسم 7
  grammarMeta   → القسم 8-أ
  grammar       → القسم 8-ب
  exercisesMeta → القسم 9-أ
  exercises     → القسم 9-ب (A → T بالترتيب الإلزامي)
  smartFeedback → القسم 10
  activities    → القسم 11 (مجمّد — فارغ إلزامياً — تُدار عبر activity.js + bridge.js)
}
```

---

## 📋 القسم 1 — `meta`

```js
meta: {
  title:       STRING,   // العنوان العربي المشكّل للدرس
  pageTitle:   STRING,   // "عنوان-عربي | عنوان-صيني" (يجب وجود "|")
  brandPrefix: STRING,   // دائماً = "درس"
  brandTitle:  STRING,   // الكلمة الرئيسية للدرس (بدون "درس")
  brandIcon:   EMOJI     // إيموجي واحد يمثل موضوع الدرس
}
```

**مثال:**
```js
meta: {
  title: "أَنْوَاعُ التَّرْوِيح",
  pageTitle: "أَنْوَاعُ التَّرْوِيح-محادثة | 娱乐活动的种类",
  brandPrefix: "درس",
  brandTitle: "التَّرْوِيح",
  brandIcon: "🌿"
}
```

---

## 📋 القسم 2 — `hook`

```js
hook: {
  emojis:   STRING,   // 4-6 إيموجي مفصولة بمسافات
  title_ar: STRING,   // سؤال تحفيزي بالعربية
  title_zh: STRING,   // ترجمة السؤال بالصينية
  tagline:  STRING,   // "📚 الوِحْدَة X · الدَّرْس Y · 第X单元 · 第Y课"

  compare: [           // عنصران بالضبط (2 items)
    {
      emoji: EMOJI,
      ar:    STRING,
      zh:    STRING,
      type:  STRING    // كلمة حرة: "active" | "quiet" | "reading" | etc.
    },
    { ... }            // نفس البنية
  ]
}
```

**قواعد `compare`:**
- عدد العناصر: **2 بالضبط** (يعرضها app.js في شبكة عمودين)
- `type` تُستخدم كـ CSS class — استخدم كلمة إنجليزية بسيطة بلا مسافات

---

## 📋 القسم 3 — `thinking`

```js
thinking: [   // 3 إلى 5 أسئلة
  {
    ar:    STRING,   // سؤال تفكير بالعربية
    zh:    STRING,   // ترجمته بالصينية
    emoji: EMOJI
  },
  ...
]
```

---

## 📋 القسم 4 — `vocab`

```js
vocab: [   // 15 إلى 35 مفردة
  {
    ar:    STRING,   // الكلمة العربية المشكّلة
    zh:    STRING,   // المعنى بالصينية
    emoji: STRING,   // إيموجي واحد، أو اثنان فقط عند الضرورة
    type:  STRING    // نوع الكلمة بالعربية والصينية: "اِسْم · 名词"
  },
  ...
]
```

**قيم `type` المسموح بها:**
```
"اِسْم · 名词"
"اِسْم جَمْع · 名词复数"
"فِعْل · 动词"
"فِعْل مَصْدَر · 动名词"
"صِفَة · 形容词"
"ظَرْف · 副词"
"حَرْف · 介词"
```
### ⚠️ قانون الإيموجي في المفردات — اقرأه قبل أي شيء:
```
RULE 1 — الأصل: إيموجي واحد فقط لكل كلمة
  emoji: "🏠"

RULE 2 — الاستثناء: إيموجي ثانٍ فقط إذا كان المعنى لا يتضح من الأول وحده
  emoji: "🏠 🔑"

RULE 3 — ❌ ممنوع منعاً باتاً:
  - ثلاثة إيموجي أو أكثر
  - تكرار نفس الإيموجي على كلمتين مختلفتين
  - استخدام مصفوفة (array) — الصيغة الصحيحة: نص بمسافة "🏠 🔑"

RULE 4 — اختبار قبل الإرسال:
  اقرأ كل emoji من أول مفردة إلى آخرها —
  إذا رأيت نفس الإيموجي مرتين → أصلح الثانية فوراً
```
---

## 📋 القسم 5 — `dialogue`

```js
dialogue: [   // 6 إلى 12 سطراً
  {
    speaker: STRING,   // الاسم بالعربية (للعرض)
    role:    STRING,   // اسم CSS class أو معرّف (حروف إنجليزية أو عربية)
    ar:      STRING,   // الجملة العربية الكاملة
    zh:      STRING    // الترجمة الصينية
  },
  ...
]
```

> 🧠 **ذكاء تلقائي**: السطران الأولان عادة تحية (السلام عليكم / وعليكم السلام).  
> النظام في `renderSpeaking` يتخطاهما تلقائياً ويستخدم أول جملة رئيسية في تدريب الاستماع (المستوى 1).  
> تأكد أن الجملة المحورية للدرس (مثلاً: "أُرِيدُ شَقَّةً مِنْ فَضْلِك") تكون بعد التحيات مباشرة.

---

## 📋 القسم 6 — `dialogueScenes`

```js
dialogueScenes: [   // مشهدان اثنان بالضبط
  {
    emoji:     EMOJI,    // إيموجي يمثل المشهد
    label_ar:  STRING,   // عنوان المشهد بالعربية
    label_zh:  STRING,   // عنوان المشهد بالصينية
    gradient:  STRING    // "linear-gradient(135deg,#color1,#color2)"
  },
  { ... }                // نفس البنية — مشهد ثانٍ
]
```

**القواعد:**
- عدد العناصر: **2 بالضبط** (app.js يعرضها بجانب بعض)
- `gradient` يجب أن يبدأ بـ `linear-gradient(...)` بالضبط
- هذه صورة خلفية ملونة للمشهد — سطر واحد فقط لكل مشهد

---

## 📋 القسم 7 — `explain`

```js
explain: [   // 4 إلى 6 نقاط شرح
  {
    label: STRING,   // "① عنوان النقطة · 中文标题"
    ar:    STRING,   // الشرح بالعربية
    zh:    STRING,   // الشرح بالصينية
    note:  STRING    // ملاحظة مميزة — تدعم \n للأسطر المتعددة
  },
  ...
]
```

**قاعدة `label`:** يجب أن يبدأ بـ ①②③... (دائرة مرقمة) ثم مسافة ثم العنوان.

---

## 📋 القسم 8 — `grammarMeta` و `grammar`

```js
grammarMeta: {
  title:    STRING,   // "القَوَاعِد · [موضوع القواعد]"
  subtitle: STRING    // "语法 — [وصف بالصينية]"
},

grammar: [
  // نوع 1: نمط جملة
  {
    type:  "pattern",
    title: STRING,   // "📐 [اسم النمط] · [بالصينية]"
    ar:    STRING,   // ⚠️ جملة حقيقية من موضوع الدرس — ممنوع المصطلحات المجردة
    zh:    STRING    // الترجمة
  },

  // نوع 2: تصريف
  {
    type:  "conjugation",
    title: STRING,
    items: [
      { pronoun: STRING, verb: STRING, zh: STRING },
      ...   // 6 أشكال: أَنَا، أَنْتَ، أَنْتِ، هُوَ، هِيَ، نَحْنُ
    ]
  }
]
```

**قيم `type` المسموح بها فقط:** `"pattern"` | `"conjugation"`

> **⚠️ قاعدة الأنماط الحقيقية:** حقل `ar` في `type: "pattern"` يجب أن يحتوي **جملة حقيقية بكلمات فعلية من موضوع الدرس**، وليس مصطلحات نحوية مجردة. الكلمات تُفصل بمسافات ويعرضها الكود كبطاقات مع `+` بينها.
> ```
> ✅ صحيح:  ar: "أُفَضِّلُ التَّخْيِيمَ عَلَى الشَّاطِئ"   (كلمات حقيقية من درس التخييم)
> ✅ صحيح:  ar: "كَمْ غُرْفَةً فِي الشَّقَّة؟"              (كلمات حقيقية من درس الشقة)
> ❌ خطأ:   ar: "أُفَضِّلُ + اسم (المَكَان / النَّشَاط)"    (مصطلحات مجردة — الطالب لا يفهمها)
> ```

---

## 📋 القسم 9 — `exercisesMeta` و `exercises`

### 9-أ: Meta
```js
exercisesMeta: {
  title:    STRING,   // دائماً = "التَّدْرِيبَات"
  subtitle: STRING    // وصف بالصينية
}
```

### 9-ب: التمارين (A → T بالترتيب الإلزامي)

#### A — اختيار من متعدد `mcq`
```js
mcq: [   // 3 أسئلة بالضبط
  {
    question: STRING,
    options:  [STRING, String, STRING, STRING],   // 4 خيارات بالضبط
    correct:  NUMBER   // index 0-3
  },
  ...
]
```

#### B — صواب وخطأ `trueFalse`
```js
trueFalse: [   // 4 إلى 6 جمل
  {
    ar:      STRING,
    zh:      STRING,
    correct: BOOLEAN   // true | false فقط
  },
  ...
]
```

#### C — ملء الفراغات `fillBlanks`
```js
fillBlanks: [   // 3 جمل
  {
    sentence: STRING,   // الجملة مع "_" مكان الفراغ
    answer:   STRING    // الإجابة الصحيحة
  },
  ...
]
```

#### D — سحب الكلمات `dragWords`
```js
dragWords: [   // 4 إلى 8 كلمات
  {
    ar:  STRING,
    cat: STRING   // تصنيف مثل: "active" | "quiet" | "positive" | "negative"
  },
  ...
]
```

**تحذير:** يجب أن تكون هناك فئتان مختلفتان (`cat`) على الأقل.

#### D2 — مناطق التصنيف `dragZones`
\`\`\`js
dragZones: [   // عنصران اثنان بالضبط — يجب أن تطابق dragWords
  {
    accept: STRING,   // نفس قيمة cat في dragWords
    emoji:  EMOJI,    // إيموجي يمثل الفئة
    ar:     STRING,   // اسم الفئة بالعربية
    zh:     STRING    // اسم الفئة بالصينية
  },
  { ... }            // الفئة الثانية
]
\`\`\`

#### E — ترتيب الكلمات `orderWords` + `orderTarget`
```js
orderWords:  [STRING, STRING, STRING, STRING],   // 4 كلمات مختلطة
orderTarget: STRING   // الجملة الصحيحة مرتبة
```

**تحذير:** `orderWords` و`orderTarget` مفتاحان منفصلان في جذر `exercises` (ليس كـ object).

#### تمرين تلقائي — مطابقة (بدون بيانات)
يُولّد `app.js` تلقائياً تمرين **طَابِقْ بَيْنَ العَرَبِيَّة وَالصِّينِيَّة** (مطابقة) من أول 5 كلمات في `vocab` — لا حاجة لكتابة بيانات في `lesson.js`.


#### F — تصحيح الخطأ `correctError`
```js
correctError: {
  sentence: STRING,
  options: [
    { ar: STRING, correct: BOOLEAN },
    { ar: STRING, correct: BOOLEAN },
    { ar: STRING, correct: BOOLEAN },
    { ar: STRING, correct: BOOLEAN }   // 4 خيارات، واحد فقط correct: true
  ]
}
```

#### G — إعادة الصياغة `rewrite`
```js
rewrite: {
  sentence:    STRING,   // الجملة الأصلية ← الجملة الناقصة مع ___
  answer:      STRING,   // الإجابة الصحيحة (بدون تشكيل)
  instruction: STRING    // التعليمات بالصينية: "用「هُوَ」改写"
}
```

#### H — كتابة موجهة `guidedWriting`
```js
guidedWriting: {
  title:       STRING,
  instruction: STRING,
  sentences: [   // 3 جمل
    { prefix: STRING, placeholder: STRING },
    ...
  ]
}
```

#### I — الاستماع `listeningExercise`
```js
listeningExercise: {
  text:    STRING,   // النص الصحيح الذي "يُقرأ"
  options: [
    { ar: STRING, correct: BOOLEAN },
    { ar: STRING, correct: BOOLEAN },
    { ar: STRING, correct: BOOLEAN }   // 3 خيارات، واحد فقط correct: true
  ]
}
```

#### J — تحدي السرعة `speedChallenge`
```js
speedChallenge: {
  title:       STRING,   // "⚡ تَحَدِّي السُّرْعَة"
  instruction: STRING    // "速度挑战 — 30 ثانية"
}
```

#### K — تفكير متعدد الخطوات `multiStep`
```js
multiStep: {
  title:       STRING,
  instruction: STRING,
  story: {
    ar: STRING,
    zh: STRING
  },
  questions: [   // 2 سؤال
    {
      ar:      STRING,
      zh:      STRING,
      options: [
        { ar: STRING, correct: BOOLEAN },
        { ar: STRING, correct: BOOLEAN },
        { ar: STRING, correct: BOOLEAN }
      ]
    },
    ...
  ]
}
```

#### L — كتابة فقرة `paragraph`
```js
paragraph: {
  sentence: STRING,   // جملة مع فراغات بـ "_"
  answers:  [STRING, STRING, STRING]   // الإجابات بالترتيب
}
```

#### M — تحليل السياق `contextAnalysis`
```js
contextAnalysis: {
  dialogue:  STRING,   // حوار قصير (استخدم \n للأسطر)
  question:  STRING,   // "عربي · 中文" (يُقسم بـ " · " في العرض)
  options: [
    { ar: STRING, correct: BOOLEAN },   // ⚠️ عربي فقط — ممنوع وضع ترجمة صينية هنا
    { ar: STRING, correct: BOOLEAN }
  ]
}
```

#### N — سيناريو `scenario`
\`\`\`js
scenario: {
  setup_ar: STRING,   // وصف الموقف بالعربية (يظهر قبل السؤال)
  setup_zh: STRING,   // وصف الموقف بالصينية (يظهر قبل السؤال)
  question: STRING,
  options: [
    { ar: STRING, correct: BOOLEAN },   // ⚠️ عربي فقط — ممنوع وضع ترجمة صينية هنا
    { ar: STRING, correct: BOOLEAN },
    { ar: STRING, correct: BOOLEAN }
  ]
}
\`\`\`
---

#### O — اختيار بصري `visualChoice`
\`\`\`js
visualChoice: {
  emoji:   EMOJI,
  options: [
    { ar: STRING, correct: BOOLEAN },
    { ar: STRING, correct: BOOLEAN },
    { ar: STRING, correct: BOOLEAN }
  ]
}
\`\`\`

#### P — تحويل الجملة `sentenceTransform`
\`\`\`js
sentenceTransform: {
  title:       STRING,
  instruction: STRING,   // نوع التحويل مثل: "陈述句 → 疑问句"
  sentence:    TEMPLATE_LITERAL,   // استخدم backticks `...` — يحتوي HTML مع data-answer="..."
  answer:      STRING
}
\`\`\`

**⚠️ تحذير قاتل (اقرأه قبل الكتابة):**
قيمة `sentence` تحتوي HTML بعلامات تنصيص مزدوجة. **يجب أن تُكتب بـ backticks ( \` )** وليس بعلامات تنصيص عادية:
```js
// ✅ صحيح — استخدم backticks:
sentence: `الجملة ← <input class="fill-input" data-answer="الإجابة" style="min-width:110px"> بقية الجملة?`,

// ❌ خطأ — double quotes تكسر الـ HTML:
sentence: "الجملة ← <input class=\"fill-input\" data-answer=\"الإجابة\" ...>"  // ← SYNTAX ERROR
```
السبب: علامات التنصيص المزدوجة داخل HTML تتعارض مع علامات تنصيص الـ JavaScript string.
الحل: استخدم backticks (`) بدلاً من " أو '.

#### Q — التحدي `challenge`
\`\`\`js
challenge: {
  zh:       STRING,   // التعليمات بالصينية
  sentence: STRING,   // جملة مع "_" مكان الفراغات
  answers:  [STRING, STRING, STRING]
}
\`\`\`

#### R — اختر الكلمات الصحيحة `selectWords`
\`\`\`js
selectWords: {
  title_ar: STRING,   // مثال: "اختر الكلمات التي تعبر عن الترفيه"
  title_zh: STRING    // مثال: "点击所有表示娱乐活动的词"
}
\`\`\`

**⚠️ ملاحظة مهمة:** `app.js` يستخدم تلقائياً أول 4 كلمات من `vocab` كخيارات صحيحة، والـ 4 التالية (index 4-7) كخيارات خاطئة. **رتّب أول 8 كلمات في `vocab` بما يتناسب مع محتوى التمرين.**

#### S — أكمل الحوار `dialogueFill`
\`\`\`js
dialogueFill: {
  lines: [
    {
      speaker: STRING,   // اسم المتحدث: "المُسْتَأْجِر"
      text:    STRING,   // الجملة مع ___ مكان الفراغ
      answer:  STRING    // الكلمة الصحيحة (بدون تشكيل)
    },
    ...
  ]
}
\`\`\`

**قاعدة:** 4 أسطر على الأقل — مأخوذة من حوار الدرس الحقيقي.

#### T — تدريب على النمط `patternFill`
\`\`\`js
patternFill: {
  title:       STRING,   // "تَصْرِيفُ الفِعْل"
  instruction: STRING,   // "动词变位"
  lines: [
    {
      pronoun: STRING,   // الضمير: "أَنَا", "أَنْتَ", "هُوَ", إلخ
      verb:    STRING,   // الفعل المصرف: "أُرِيدُ", "تُرِيدُ", إلخ
      suffix:  STRING    // تتمة الجملة بعد الفعل
    },
    ...
  ]
}
\`\`\`

**قاعدة:** 5 أسطر على الأقل — مأخوذة من تصريف الفعل الرئيسي في الدرس.

#### U — الأنشطة المخصصة الديناميكية (Custom Dynamic Activities)

> ### ⚖️ قانون القيود — اقرأه قبل أي حقل أدناه
>
> لكل حقل في هذا القسم **ثلاثة أسطر إلزامية** لا يخلو منها:
>
> | | |
> |---|---|
> | **المصدر** | من أين تُسحَب المادة بالضبط |
> | **الإجراء** | خطوات ميكانيكية تُنفَّذ، لا هدف يُجتهد فيه |
> | **عند التعذّر** | ماذا تفعل إن لم تكفِ المادة — مخرج مُعرَّف دائماً |
>
> **ولماذا:** القيد الذي يعتمد على وجود مادة بعينها في الدرس قد يكون
> **مستحيل التحقيق** في درس آخر. ونموذجٌ محاصَر بلا مخرج مُعرَّف
> يبدأ يناقش نفسه داخل الملف — فيخرج ناتج ملوَّث لا يصلح للنشر.
>
> ### 🚫 قانون نظافة المخرجات
>
> ```
> الناتج ملف lesson.js واحد نظيف — لا غير.
> ❌ ممنوع كتابة تفكيرك أو ترددك أو مقارنتك بين الخيارات
> ❌ ممنوع كتابة «ملاحظة» أو «تصحيح» أو «يجب تعديل» بعد الملف
> ❌ ممنوع اقتراح تعديل على الإسكيما داخل الناتج
> ✅ إن تعذّر شرطٌ ما: طبّق سطر «عند التعذّر» الخاص به بصمت وأكمل
> ```


هذه الحقول تُغذّي الألعاب التي **لا يمكن اشتقاق محتواها** من بقية أقسام الدرس.

> **⚠️ تصحيح (2026-10-02):** لا توجد «بيانات احتياطية في `activity.js`» لهذه الأنشطة.
> فُحِص الأمر: الأنشطة الخمسة (5، 8، 9، 18، 19) **لا يملك أيٌّ منها حقل `data`** في
> `activity.js`. فإذا غاب الحقل من `lesson.js`، يفتح النشاط على رسالة
> «لا تتوفر بيانات مخصصة لهذا النشاط في هذا الدرس» ولا يعمل إطلاقاً.
>
> لذلك: الحقل المعلَّم **🔴 مطلوب** يجب توليده مع كل درس بلا استثناء.

**⚠️ تحذير صارم — هذه الحقول تضاف إلى `exercises` (القسم 9)، وليس إلى `activities` (القسم 11). `activities: []` يظل فارغاً إلزامياً.**

##### customHiddenReveal (id:5) — 🔴 مطلوب
```js
customHiddenReveal: [   // 4-6 عناصر — مطلوب
  {
    coveredImage: EMOJI,    // إيموجي يغطّي الكلمة
    word:         STRING,   // الكلمة العربية مشكّلة
    chinese:      STRING,   // الترجمة الصينية
    hints:        [STRING, STRING, STRING]
  }
]
```
**المصدر:** `vocab` — وفضّل الأسماء المحسوسة.
```
١ · 4-6 عناصر، كلماتها من vocab ولا تتكرر
٢ · coveredImage إيموجي واحد يناسب الكلمة
٣ · ثلاثة تلميحات من العام إلى الخاص
٤ · ❌ ممنوع ذكر الكلمة أو جذرها في تلميحاتها
```
**عند التعذّر:** الحدّ الأدنى ثلاثة عناصر.


##### customWechat (id:8) — 🔴 مطلوب
```js
customWechat: [   // تسلسل حوار — مطلوب
  { from: "other",   text: STRING, chinese: STRING, delay: NUMBER },
  { from: "choices", choices: [STRING, STRING, STRING], correctIndex: NUMBER }
]
```
**قيد من الواجهة:** `from` إمّا `"other"` أو `"choices"` — لا ثالث.
`correctIndex` فهرس داخل `choices` يبدأ من الصفر.

**المصدر:** موضوع الدرس ومفرداته — الحوار مؤلَّف لا منقول.
```
١ · يبدأ بـ other، ثم choices، بالتناوب
٢ · ثلاثة أسئلة اختيار على الأقل
٣ · ثلاثة خيارات لكل سؤال: واحد صحيح واثنان خاطئان بوضوح
٤ · delay = 800 لرسائل other
٥ · لغة الحوار من مستوى الدرس
```
**عند التعذّر:** الحدّ الأدنى سؤالا اختيار مع رسالتَي other.


##### customWhoAmI (id:9) — 🔴 مطلوب
```js
customWhoAmI: [   // 4-5 ألغاز — مطلوب
  {
    word:    STRING,                    // الكلمة المقصودة، مشكّلة
    chinese: STRING,                    // معناها بالصينية
    hints:   [STRING, STRING, STRING]   // ثلاثة تلميحات بالعربية
  }
]
```

**قواعد التوليد — خمس قواعد مُلزِمة:**

```
١ · word مأخوذة من vocab الدرس حرفياً — ممنوع كلمة من خارج الدرس
٢ · ثلاثة تلميحات بالضبط، مرتّبة من العام إلى الخاص (سقالات تدريجية)
      hints[0] = الفئة أو الوظيفة العامة
      hints[1] = خاصية مميِّزة
      hints[2] = سياق من الدرس نفسه يكاد يكشفها
٣ · مفردات التلميحات من الدرس أو أبسط منها — لا كلمات أصعب من المطلوبة
٤ · ❌ ممنوع منعاً باتاً ذكر الكلمة أو جذرها داخل تلميحاتها
٥ · 4-5 ألغاز، وكلماتها مختلفة لا تتكرر
```
**المصدر:** `vocab` — وفضّل الأسماء المحسوسة.
**عند التعذّر:** مفردات الدرس مجرّدة أو ألوان يصعب وصفها بلا ذكرها
(الأَحْمَر · اللَّوْن)؟ تخطّاها واختر المحسوس. الحدّ الأدنى ثلاثة ألغاز.

**مثال على الشكل** (من درس التخييم — للتوضيح فقط، لا للنسخ):
```js
{ word: "الخَيْمَة", chinese: "帐篷", hints: [
    "أَنَا بَيْتٌ صَغِيرٌ مِنْ قُمَاش",                 // عام
    "تَنَامُ فِي دَاخِلِي لَيْلاً",                      // مميِّز
    "تَحْمِلُنِي مَعَكَ إِلَى الغَابَةِ أَوِ الشَّاطِئ"   // سياق الدرس
]}
```

> **لماذا القاعدة ٤ تقول «أو جذرها»:** التلميح الذي يحتوي الكلمة يُلغي التمرين،
> والجذر المشترك يفعل الشيء نفسه. فلو كُتب في تلميح «الخَيْمَة» لفظُ «المُخَيَّم»
> لَكَشَفَها، لأن الجذر واحد (خ-ي-م) والطالب يستنتجها فوراً.
> لذلك جاء التلميح الثالث أعلاه بـ «الغَابَة» و«الشَّاطِئ» — مفردتان من الدرس
> تَضَعان الكلمة في سياقها دون أن تلمسا جذرها.

##### customYoungDoctor (id:18) — 🔴 مطلوب
```js
customYoungDoctor: [   // 2-3 حالات — مطلوب
  { name: STRING, age: NUMBER, problems: STRING, expectedTips: [STRING, STRING, STRING] }
]
```
**كيف يعمل:** تُعرض الحالة، ويكتب الطالب **ثلاث نصائح بصيغة الأمر أو النهي**،
ثم تُعرض `expectedTips` للمقارنة. فهو تمرين **إنتاج** للأمر والنهي.

**المصدر:** موضوع الدرس ومفرداته — الحالات مؤلَّفة لا منقولة.
```
١ · 2-3 حالات
٢ · name = اسم عربي · age = رقم
٣ · problems = وصف المشكلة في سطر واحد، من موضوع الدرس
٤ · expectedTips = ثلاث نصائح، كلٌّ بصيغة أمر أو نهي صريحة
      (كُلْ · قَلِّلْ · لَا تَشْتَرِ · اِسْأَلْ)
٥ · النصائح تستعمل مفردات الدرس
```
**عند التعذّر:** الحدّ الأدنى حالتان.

> ⚠️ **ملاحظة معلومة:** عنوان النشاط ثابت في الواجهة «🧑‍⚕️ الطبيب الصغير».
> فإن كان الدرس بعيداً عن الصحة، صُغ الحالة بزاوية صحية من موضوعه
> (في درس التسوّق: مَن يُنفق كثيراً · مَن لا يسأل عن السعر).


##### customHealthLetter (id:19) — 🔴 مطلوب
```js
customHealthLetter: [   // موجّه واحد — مطلوب
  { prompt_ar: STRING, prompt_zh: STRING }
]
```
**كيف يعمل:** صندوق كتابة حرّة يحلّل ما يكتبه الطالب.

> ⚠️ **حالة الشيفرة اليوم:** النشاط لا يقرأ هذا الحقل بعد — يكفي وجوده
> غير فارغ ليفتح النشاط. والحقل مُعَدٌّ لربطه لاحقاً.

**المصدر:** موضوع الدرس.
```
١ · عنصر واحد
٢ · prompt_ar = مهمة كتابة من موضوع الدرس، في سطر واحد
٣ · prompt_zh = ترجمتها بالصينية
```
**عند التعذّر:** لا يتعذّر — موجّه واحد يُؤلَّف من أي موضوع.


##### customTrafficLight (id:11) — 🔴 مطلوب
```js
customTrafficLight: [   // 6 جُمَل — مطلوب
  { arabic: STRING, type: "command" | "negative", chinese: STRING }
]
```
**قيد من الواجهة:** `type` إمّا `"command"` أو `"negative"` — لا ثالث لهما (الزرّان 🟢 أمر · 🔴 نهي).

```
١ · ٦ جُمَل: ٣ أمر + ٣ نهي بالتساوي
٢ · الأمر  = فِعْل أَمْر صريح      (اُكْتُبْ · كُلْ · اِشْرَبْ)
٣ · النهي = لَا + مُضَارِع مَجْزُوم (لَا تَأْكُلْ · لَا تَشْرَبْ)
٤ · من مفردات الدرس وموضوعه حصراً
٥ · كل جملة ٣-٦ كلمات، مشكّلة بالكامل
٦ · chinese تُبيّن النوع: （命令）للأمر · （禁止）للنهي
```
> ❌ **خطأ شائع:** جملة خبرية مثل «أُفَضِّلُ الشَّايَ» ليست أمراً ولا نهياً — لا تضعها.

**المصدر:** مفردات الدرس وموضوعه — أنت تؤلّف الجُمَل، لا تنقلها.
**عند التعذّر:** موضوع الدرس لا يحتمل ستّ جُمَل أمر ونهي؟ أنزل إلى أربع
(٢+٢)، واستعمل أفعالاً عامة مع مفردات الدرس (خُذْ · ضَعْ · لَا تَنْسَ).
الحدّ الأدنى أربع، ولا تنزل عنه ولا تناقش.

##### customDotsHunter (id:15) — 🔴 مطلوب
```js
customDotsHunter: [   // 4-6 كلمات — مطلوب
  { base: STRING, correctLetter: "ي" | "ى" | "ة", fullWord: STRING, reason: STRING }
]
```
**قيد صارم من الواجهة:** الأزرار **ثلاثة فقط** — `ي` و `ى` و `ة`. أي حرف آخر يجعل اللغز بلا إجابة.

> **هذا تمرين إملائي**، لا تمرين مفردات. غرضه التمييز بين ثلاثة حروف
> يخلط بينها المتعلّم. فالكلمة لا يلزم أن تكون من `vocab`.

**المصدر** — كل نصّ الدرس، لا `vocab` وحدها:
```
vocab · dialogue[].ar · explain[].ar · exercises (الجُمَل والأسئلة) · grammar[].ar
```

**الإجراء** — خطوات تُنفَّذ بلا اجتهاد:
```
١ · امسح نصوص المصدر أعلاه كلمةً كلمة
٢ · اجمع كل كلمة تنتهي بـ ة أو ي أو ى، وطولها ٤ أحرف فأكثر
٣ · احذف المكرّر، واختر 4-6 كلمات — نوِّع الحروف الثلاثة ما أمكن
٤ · لكل كلمة:
      fullWord      = الكلمة كاملة مشكّلة
      correctLetter = حرفها الأخير (ة أو ي أو ى)
      base          = الكلمة بعد حذف حرفها الأخير فقط
      reason        = سبب إملائي موجز
```

**عند التعذّر:**
```
وجدت أقل من ٤ كلمات؟  اكتب ما وجدت، والحدّ الأدنى اثنتان.
وجدت أقل من اثنتين؟   ألّف كلمتين من موضوع الدرس تنتهيان بـ ة
                       (مثل: القُبَّعَة · البِطَاقَة · الخِدْمَة · السَّاعَة)
❌ لا تستعمل كلمة تنتهي بحرف آخر — اللغز يصير بلا إجابة
❌ لا تناقش الأمر في الناتج — نفّذ واستمر
```

> **مثال للشكل:** `{ base:"الخِدْمَ", correctLetter:"ة", fullWord:"الخِدْمَة", reason:"اِسْم مُؤَنَّث يَنْتَهِي بِالتَّاء المَرْبُوطَة" }`


##### customConjugationLadder (id:16) — 🔴 مطلوب
```js
customConjugationLadder: [   // 5-6 أزواج — مطلوب
  { past: STRING, present: STRING }
]
```
**كيف يعمل:** الواجهة تعرض `past` ويكتب الطالب `present`. فالحقلان **إلزاميان ومملوءان** — حقل ماضٍ فارغ يُفرغ التمرين من معناه.

```
١ · الفعل الرئيسي في الدرس نفسه (نفس فعل grammar.conjugation)
٢ · كل زوج لضمير واحد: الماضي والمضارع لنفس الضمير
      أَكَلْتُ → آكُلُ      أَكَلْتَ → تَأْكُلُ      أَكَلَ → يَأْكُلُ
٣ · 5-6 أزواج بترتيب الضمائر: أَنَا · أَنْتَ · أَنْتِ · هُوَ · هِيَ · نَحْنُ
٤ · مشكّلان بالكامل
٥ · ❌ ممنوع ترك past فارغاً أو تكرار نفس الزوج
```
**المصدر:** `grammar[].items` من نوع `conjugation` — وهو قسم مطلوب أصلاً.
**عند التعذّر:** أقلّ من خمسة ضمائر في القسم؟ اكتب زوجاً لكل ضمير متاح،
والحدّ الأدنى ثلاثة أزواج.

##### customPunctuation (id:17) — 🔴 مطلوب
```js
customPunctuation: [   // 5 جُمَل — مطلوب
  { text: STRING, correctMark: "." | "؟" | "!" | "،" | "؛" }
]
```
**قيد من الواجهة:** الرموز المعروضة ستة؛ استعمل العربية منها فقط: `.` `؟` `!` `،` `؛`

```
١ · ❌ ❌ الأهم: text يجب ألّا تحتوي العلامة أصلاً
      النص ينتهي عند آخر كلمة، والواجهة تضع مكان العلامة
      خطأ: "أَيْنَ تَأْكُلُ؟"   ✅ صواب: "أَيْنَ تَأْكُلُ"
٢ · ٥ جُمَل من موضوع الدرس ومفرداته
٣ · نوِّع: استفهام واحد على الأقل (؟)، وتعجّب واحد (!)، والباقي خبر (.)
٤ · القرينة داخل الجملة تكفي لتحديد العلامة
      استفهام → تبدأ بـ هَلْ · أَيْنَ · مَاذَا · كَمْ · مَا
      تعجّب   → مَا أَجْمَلَ · مَا أَلَذَّ
٥ · مشكّلة بالكامل
```
> **لماذا القاعدة ١:** إن بقيت العلامة في النص، رآها الطالب ونقلها — فبطل التمرين.

**المصدر:** جُمَل الدرس أو جُمَل تؤلّفها من مفرداته.
**عند التعذّر:** لم تجد جُمَلاً صالحة؟ ألّفها من `vocab`. الحدّ الأدنى ثلاث.

##### customBoardGame (id:20) — 🔴 مطلوب
```js
customBoardGame: [   // 8 مربّعات — مطلوب
  { num: NUMBER, question: STRING, answer: STRING, type: "vocab"|"command"|"spelling"|"punctuation"|"conjugation" }
]
```
**قيود من الواجهة:** اللوحة **٣٠ مربّعاً**، واللاعب يبدأ من ١ ويتقدّم بالنرد (١-٦).

```
١ · num عدد صحيح بين ٣ و٢٩، تصاعدي، بلا تكرار، موزّع على اللوحة
      مثال جيد: 3 · 7 · 10 · 14 · 18 · 22 · 25 · 29
٢ · ٨ مربّعات
٣ · question قصيرة ومكتملة، من محتوى الدرس
٤ · answer كلمة أو كلمتان — بدون تشكيل
      ولقبول أكثر من صياغة افصل بـ / مثل: "السمك/سمك"
٥ · type من الخمسة المسموحة فقط — وزّعها على أنواع الأسئلة
٦ · ❌ ممنوع سؤال يتجاوز سطراً، فالمربّع ضيّق
```
**المصدر:** كل أقسام الدرس — مفردات وحوار وشرح وقواعد وتمارين.
**عند التعذّر:** لم تبلغ ثمانية أسئلة جيدة؟ انزل إلى خمسة موزّعة على
اللوحة. جودة خمسة خيرٌ من حشو ثمانية.

##### customSpotDifference (id:21) — 🔴 مطلوب
```js
customSpotDifference: [   // 4 أزواج — مطلوب
  { sentenceA: STRING, sentenceB: STRING, keyword: STRING }
]
```
```
١ · الجملتان **جملتان كاملتان**، لا مفردتان
٢ · متطابقتان تماماً إلّا في **كلمة واحدة** فقط
٣ · keyword بالصيغة: "كلمة A ≠ كلمة B"
٤ · ٤ أزواج، من موضوع الدرس ومفرداته
٥ · الكلمتان المختلفتان من vocab الدرس ما أمكن
٦ · مشكّلتان بالكامل
```
**المصدر:** جُمَل تؤلّفها من مفردات الدرس — الزوج مصنوع لا منقول.
**عند التعذّر:** الحدّ الأدنى ثلاثة أزواج.
> **مثال للشكل:**
> ```js
> { sentenceA:"آكُلُ السَّمَكَ فِي الغَدَاء", sentenceB:"آكُلُ الدَّجَاجَ فِي الغَدَاء",
>   keyword:"السَّمَك ≠ الدَّجَاج" }
> ```

## 📋 القسم 10 — `smartFeedback`

```js
smartFeedback: {
  "الكلمة-الخاطئة-1": {
    context: STRING,   // الضمير المرتبط بالخطأ
    correct: STRING,   // الشكل الصحيح
    ar:      STRING,   // تفسير الخطأ بالعربية (يبدأ بـ 💡)
    zh:      STRING    // التفسير بالصينية (يبدأ بـ 💡)
  },
  ...   // 3 إلى 5 أخطاء شائعة متوقعة للدرس
}
```

## 📋 القسم 11 — `activities` (Twin-File — مجمّد، فارغ إلزامياً)

> 🔴 **قانون التوأم الرقمي**: هذا القسم **فارغ إلزامياً** وممنوع على الـ AI لمسه.
> تم نقل كل الأنشطة إلى `activity.js` (ActivityConfig) و `bridge.js` (SOURCE_MAP + resolveData).
> الـ AI يملأ فقط الأقسام 1–10. الأنشطة تُحلّ ديناميكياً عبر الـ Twin Engine.

```js
// ================================================================
// *** 11. ACTIVITIES (Twin-File) — انتقل إلى activity.js
// ================================================================
activities: []
```

### مسؤولية الـ AI — حدود لا تتعداها:

| الملف | مسؤولية الـ AI | الحالة |
|-------|---------------|--------|
| `data/lesson.js` | الأقسام 1–10 فقط | ✅ يملؤها الـ AI |
| `data/lesson.js` القسم 11 | ممنوع اللمس — يترك `activities: []` فارغاً | 🔴 ممنوع |
| `activity.js` | ثابت على السيرفر — لا يُعدّل | 🔴 ممنوع |
| `bridge.js` | ثابت على السيرفر — لا يُعدّل | 🔴 ممنوع |

### كيف تعمل الألعاب الـ 22 بدون بيانات في `activities`؟

```
1. activity.js يحتوي ActivityConfig مع sourceField لكل لعبة
   → wheel.sourceField = "vocab"  //  يسحب من LESSON_DATA.vocab
   → tap-choice.sourceField = "exercises.mcq"
   → progressive-story.sourceField = "dialogue"

2. bridge.js يحتوي SOURCE_MAP — محولات لكل نوع
   → T_wheel: vocab[i].ar/zh/emoji → {arabic, chinese, emoji}
   → T_sentenceBuilder: dialogue[i].ar/zh → {arabic, chinese, grammarNote}

3. عند تشغيل أي لعبة:
   → bridge.js يقرأ ActivityConfig[id].sourceField
   → يتجول في LESSON_DATA حسب المسار النقطي
   → يمرر البيانات عبر المحول (transformer)
   → يرسل الناتج إلى Renderer اللعبة

4. ألعاب Custom (id:5,8,9,11,15-21):
   → sourceField تشير إلى مسار نقطي في LESSON_DATA (exercises.custom* أو vocab أو grammar إلخ)
   → bridge.js يقرأ LESSON_data ويطبق محولات SOURCE_MAP الجديدة
   → إذا غابت البيانات في LESSON_DATA → Fallback تلقائي إلى config.data في activity.js
```

### اللائحة الكاملة — 22 sourceField:

| id | النوع | sourceField | المصدر |
|----|------|-------------|--------|
| 1 | wheel | `vocab` | `LESSON_DATA.vocab` |
| 2 | memory | `vocab` | `LESSON_DATA.vocab` |
| 3 | tap-choice | `exercises.mcq` | `LESSON_DATA.exercises.mcq` |
| 4 | sound-match | `vocab` | `LESSON_DATA.vocab` |
| 5 | hidden-reveal | `exercises.customHiddenReveal` | `LESSON_DATA.exercises.customHiddenReveal` (⚠️ لا احتياطي — الحقل مفقود = نشاط فارغ) |
| 6 | dark-room | `vocab` | `LESSON_DATA.vocab` |
| 7 | sentence-builder | `dialogue` | `LESSON_DATA.dialogue` |
| 8 | wechat | `exercises.customWechat` | `LESSON_DATA.exercises.customWechat` (⚠️ لا احتياطي — الحقل مفقود = نشاط فارغ) |
| 9 | who-am-i | `exercises.customWhoAmI` | `LESSON_DATA.exercises.customWhoAmI` (⚠️ لا احتياطي — الحقل مفقود = نشاط فارغ) |
| 10 | swipe-quiz | `exercises.trueFalse` | `LESSON_DATA.exercises.trueFalse` |
| 11 | traffic-light | `exercises.customTrafficLight` | 🔴 مطلوب — لا احتياطي |
| 12 | speed-reveal | `vocab` | `LESSON_DATA.vocab` |
| 13 | quick-reaction | `vocab` | `LESSON_DATA.vocab` |
| 14 | mini-maze | `exercises.mcq` | `LESSON_DATA.exercises.mcq` |
| 15 | dots-hunter | `exercises.customDotsHunter` | 🔴 مطلوب — لا احتياطي |
| 16 | conjugation-ladder | `exercises.customConjugationLadder` | 🔴 مطلوب — لا احتياطي |
| 17 | punctuation-editor | `exercises.customPunctuation` | 🔴 مطلوب — لا احتياطي |
| 18 | young-doctor | `exercises.customYoungDoctor` | `LESSON_DATA.exercises.customYoungDoctor` (⚠️ لا احتياطي — الحقل مفقود = نشاط فارغ) |
| 19 | health-letter | `exercises.customHealthLetter` | `LESSON_DATA.exercises.customHealthLetter` (⚠️ لا احتياطي — الحقل مفقود = نشاط فارغ) |
| 20 | board-game | `exercises.customBoardGame` | 🔴 مطلوب — لا احتياطي |
| 21 | spot-difference | `exercises.customSpotDifference` | 🔴 مطلوب — لا احتياطي |
| 22 | progressive-story | `dialogue` | `LESSON_DATA.dialogue` |

### تفاصيل transformers لكل sourceField (في `bridge.js`)

| التابع (transformer) | المخرجات |
|---------------------|----------|
| `T_direct` | passthrough — `exercises.mcq`, `exercises.trueFalse` مباشرة |
| `T_wheel` | `{arabic, chinese, emoji}` من vocab |
| `T_memory` | `{emoji, arabic, chinese}` من vocab |
| `T_soundMatch` | `{audioText, options:[emoji+word,...], correct:N}` — يولّد خيارات عشوائية |
| `T_vocabSimple` | `{arabic, chinese}` من vocab (لـ dark-room, speed-reveal) |
| `T_vocabSingle` | `{arabic}` فقط من vocab (لـ quick-reaction) |
| `T_sentenceBuilder` | `{arabic, chinese, grammarNote:''}` من dialogue |
| `T_progressiveStory` | `{speaker, text, chinese}` من dialogue |
| `T_trafficLight` | `{arabic, type:command/negative, chinese}` — يشتق من grammar patterns |
| `T_dotsHunter` | `{base, correctLetter, fullWord, reason}` — يكتشف الكلمات المنتهية بـ "ة" من vocab |
| `T_conjugationLadder` | `{past, present}` — يستخرج items من grammar.conjugation |
| `T_punctuationEditor` | `{text, correctMark}` — يحلل علامات الترقيم من mcq questions |
| `T_boardGame` | `{num, question, answer, type}` — يولد الأسئلة من explain |
| `T_spotDifference` | `{sentenceA, sentenceB, keyword}` — يقارن vocab المتجاورة |
| `T_hiddenReveal` | `{coveredImage, word, chinese, hints}` — يمرر الحقل المخصص كما هو |

> **ملاحظة**: جميع المحولات تحترم `config.limit` لاقتطاع عدد العناصر.
> راجع `TWIN_FILE_DYNAMIC_INTEGRATION_REPORT.md` للتفاصيل الكاملة.

---

## ✅ قائمة التحقق قبل الإرسال (Validation Checklist)

### 🔴 CRITICAL — crash فوري إذا فُقد

```
□ الملف يبدأ بـ const LESSON_DATA = مباشرة — لا ```js قبله
□ الملف ينتهي بـ }; — لا ``` بعده
□ لا يوجد export default أو module.exports
□ لا يوجد أي كود خارج LESSON_DATA (لا functions، لا imports)
□ sentenceTransform.sentence مكتوب بـ backticks `...` — مع data-answer="..." بداخله
□ dragWords.cat = dragZones.accept بالضبط (case-sensitive, exact match)
□ activities: [] فارغ إلزامياً — لا عناصر داخل المصفوفة (Section 11 Absolute Lock)
□ جميع الأقسام العشرة موجودة بالترتيب (القسم 11 مجمّد — activities: [] فقط)
□ exercises.mcq موجود وهو array (وليس null أو object)
□ كل exercises.* موجود — لا يوجد أي حقل بقيمة null
□ multiStep.story هو object {ar, zh} — وليس string
□ dialogueScenes هو array [] — وليس object {}
□ كل مفتاح يحتوي قائمة يجب أن يكون [] وليس {}
□ المتغير اسمه LESSON_DATA بالضبط
```

### 🟡 WARNING — تمرين مكسور صامت إذا خُولف

```
□ vocab.length ≥ 12 (TWIN-1 — ألعاب المفردات الـ 6)
□ dialogue.length ≥ 6 (TWIN-2 — ألعاب الحوار الـ 2)
□ paragraph.answers.length = عدد ___ في paragraph.sentence (TWIN-3)
□ challenge.answers.length = عدد ___ في challenge.sentence (TWIN-3)
□ vocab[0..3] صحيحة لـ selectWords، vocab[4..7] خاطئة (TWIN-4)
□ dragWords.cat يطابق dragZones.accept حرفياً (case-sensitive)
□ كل line في dialogueFill.lines يحتوي ___ واحد بالضبط
□ كل سطر في fillBlanks يحتوي ___ واحد على الأقل
□ كل تمرين فيه correct: true واحد فقط (ما عدا trueFalse)
□ mcq.correct هو رقم بين 0 و 3 (وليس 4 أو أكثر)
□ hook.compare فيه عنصران بالضبط
□ orderWords و orderTarget مفتاحان منفصلان (ليس object)
□ أول 8 كلمات vocab مناسبة لـ selectWords (أول 4 صحيحة، التالية 4 خاطئة)
□ dialogue فيه 2 سطر على الأقل
□ vocab فيه 8 كلمات على الأقل
```

### 🟢 QUALITY — جودة تعليمية

```
□ meta.pageTitle يحتوي على "|"
□ vocab: لا تكرار لأي إيموجي — كل إيموجي فريد
□ vocab.emoji: نص (string) وليس array — لا يزيد عن إيموجيَين
□ جميع الإجابات (answer/answers) بدون تشكيل
□ لا توجد trailing comma بعد آخر عنصر
□ جميع التعليقات الترقيمية الأصلية موجودة // *** 1. META ... ***
□ dialogueFill.lines مأخوذة من حوار الدرس الفعلي
□ patternFill.lines مأخوذة من تصريف الفعل الرئيسي
□ smartFeedback فيه 3 مفاتيح على الأقل
□ scenario موجود مع setup_ar و setup_zh
□ rewrite موجود مع instruction بالصينية
□ ✅ شغّل node validate_lesson.js — سيؤكد خلوّه من SyntaxError
```

### 🟣 ACTIVITIES — القسم 11 (Twin-File — مجمّد)

```
□ activities: [] — فارغ تماماً (ممنوع إضافة أي عناصر)
□ لا توجد أي بيانات أنشطة في data/lesson.js (انتقلت إلى activity.js)
□ activity.js موجود في الجذر ومستقر على السيرفر
□ bridge.js موجود في الجذر ومستقر على السيرفر
□ vocab.length ≥ 12 (TWIN-1 — vocab كافية لألعاب المفردات)
□ dialogue.length ≥ 6 (TWIN-2 — dialogue كافٍ لألعاب الحوار)
□ paragraph.sentence + challenge.sentence: عدد ___ = answers.length بالضبط (TWIN-3)
□ vocab[0..3] = صحيحة selectWords، vocab[4..7] = خاطئة (TWIN-4)
□ الحقول الأحد عشر المخصصة موجودة — customTrafficLight · customDotsHunter
   customConjugationLadder · customPunctuation · customBoardGame
   customSpotDifference · customWhoAmI · customYoungDoctor · customHealthLetter
   customHiddenReveal · customWechat
   ⚠️ أيّ غائب = نشاطه يفتح فارغاً. لا توجد بيانات احتياطية في activity.js
```

## 🤖 البرومبت الجاهز لإرساله لأي AI

```
أنت أداة لملء قالب JavaScript — لا تفكر، فقط امْلأ.

لديك:
1. قالب lesson.js (مرفق)
2. صورة الدرس الجديد

━━━ 🔴 CRITICAL RUNTIME SHIELD (خرق أي بند = Crash فوري) ━━━
⛔ لا Markdown wrappers — الملف يبدأ بـ const LESSON_DATA = وينتهي بـ };
⛔ sentenceTransform.sentence → backticks `...` دائماً، ليس "..."
⛔ dragWords.cat = dragZones.accept (case-sensitive exact match)
⛔ activities: [] فارغ إلزامياً — لا تكتب أي أنشطة (Section 11 Absolute Lock)

━━━ شروط TWIN الفولاذية ━━━
→ TWIN-1: vocab ≥ 12 (ألعاب المفردات الـ 6)
→ TWIN-2: dialogue ≥ 6 (ألعاب الحوار الـ 2)
→ TWIN-3: ___ في paragraph.sentence/challenge.sentence = answers.length
→ TWIN-4: vocab[0..3] صحيحة، vocab[4..7] خاطئة (selectWords)

━━━ العلاقات الحرجة ━━━
→ dialogueFill: كل line تحتوي ___ واحد بالضبط
→ multiStep.story = object {ar, zh} — وليس string
→ mcq[].correct ضمن 0-3، trueFalse[].correct = true|false

━━━ 🚫 نظافة المخرجات — قانون صارم ━━━
الناتج ملف lesson.js واحد نظيف، يبدأ بـ const LESSON_DATA = وينتهي بـ };
❌ ممنوع كتابة تفكيرك أو ترددك أو مقارنتك بين الخيارات داخل الناتج
❌ ممنوع «ملاحظة» أو «تصحيح» أو «يجب تعديل» قبل الملف أو بعده
❌ ممنوع اقتراح تعديل على الإسكيما — هي قانون، لا مسوّدة للنقاش
✅ تعذّر شرطٌ ما؟ لكل حقل سطر «عند التعذّر» — طبّقه بصمت وأكمل

━━━ المطلوب ━━━
- استخرج المحتوى من الصورة
- ضع المحتوى في القالب بدون أي تعديل على البنية
- ⛨ احتفظ بجميع التعليقات الترقيمية الأصلية (// *** 1. META ... *** إلخ)
- لا تخترع مفاتيح جديدة — لا تحذف أي مفتاح موجود
- الناتج: ملف lesson.js فقط، بلا شرح، بلا تعليقات إضافية

━━━ قواعد المحتوى ━━━
- emoji في vocab: string فقط "🏠" أو "🏠 🔑" — ❌ ليس array — ❌ لا تكرار
- dragZones تطابق cat في dragWords (نفس الحالة تماماً)
- selectWords: أول 4 كلمات vocab صحيحة، vocab[4..7] خاطئة
- scenario: أضف setup_ar و setup_zh
- dialogueFill: 4 أسطر من حوار الدرس الفعلي
- patternFill: 5 أسطر من تصريف الفعل الرئيسي
- rewrite: instruction بالصينية (مثل "用「هُوَ」改写")
- جميع الإجابات (answer/answers/data-answer) بدون تشكيل

━━━ حقول exercises المخصصة (داخل القسم 9) ━━━
🔴 أحد عشر حقلاً مطلوباً. غياب أيٍّ منها = نشاط معطّل، ولا يوجد احتياطي.
   راجع القسم U في LESSON_SCHEMA.md لقواعد كلٍّ منها بالتفصيل.

🔴 exercises.customTrafficLight — 6 جُمَل: { arabic, type, chinese }
   type = "command" أو "negative" فقط (لا ثالث)
   3 أمر (فِعْل أَمْر) + 3 نهي (لَا + مُضَارِع مَجْزُوم) — لا جُمَل خبرية

🔴 exercises.customDotsHunter — 4-6: { base, correctLetter, fullWord, reason }
   ⚠️ correctLetter من ثلاثة فقط: ي أو ى أو ة — الأزرار ثلاثة لا غير
   تمرين إملائي لا مفرداتي — الكلمة من أيّ نصّ في الدرس، لا من vocab وحدها
   الإجراء: امسح vocab و dialogue و explain و exercises و grammar
            → اجمع الكلمات المنتهية بـ ة أو ي أو ى (٤ أحرف فأكثر)
            → اختر 4-6، و base = الكلمة ناقصةَ حرفها الأخير
   عند التعذّر: اكتب ما وجدت (الحدّ الأدنى اثنتان)، وإن لم تجد فألّف
                كلمتين من الموضوع تنتهيان بـ ة. لا تناقش — نفّذ

🔴 exercises.customConjugationLadder — 5-6: { past, present }
   زوج لكل ضمير من الفعل الرئيسي: أَكَلْتُ → آكُلُ
   ❌ ممنوع ترك past فارغاً

🔴 exercises.customPunctuation — 5: { text, correctMark }
   ⚠️ الأهم: text بلا العلامة إطلاقاً — "أَيْنَ تَأْكُلُ" لا "أَيْنَ تَأْكُلُ؟"
   correctMark من: . ؟ ! ، ؛

🔴 exercises.customBoardGame — 8: { num, question, answer, type }
   num بين 3 و29 تصاعدي بلا تكرار · answer بلا تشكيل · سؤال سطر واحد
   type من: vocab · command · spelling · punctuation · conjugation

🔴 exercises.customSpotDifference — 4: { sentenceA, sentenceB, keyword }
   جملتان كاملتان متطابقتان إلّا في كلمة واحدة · keyword = "كلمة ≠ كلمة"

🔴 exercises.customYoungDoctor — 2-3 حالات: { name, age, problems, expectedTips[3] }
   النصائح الثلاث بصيغة أمر أو نهي صريحة، من مفردات الدرس

🔴 exercises.customHealthLetter — عنصر واحد: { prompt_ar, prompt_zh }
   مهمة كتابة من موضوع الدرس في سطر واحد

🔴 exercises.customWhoAmI — مطلوب، 4-5 ألغاز:
   { word, chinese, hints: [3 تلميحات] }
   ١ · word من vocab الدرس حرفياً
   ٢ · ثلاثة تلميحات، من العام إلى الخاص
   ٣ · مفردات التلميحات من الدرس أو أبسط
   ٤ · ❌ ممنوع ذكر الكلمة أو جذرها في تلميحاتها
   ٥ · كلمات الألغاز مختلفة لا تتكرر
   ⚠️ إن غاب هذا الحقل، يفتح نشاط «مَن أنا؟» فارغاً — لا يوجد احتياطي

━━━ الأنشطة (القسم 11 — مجمّد، فارغ إلزامياً) ━━━
🔴 ممنوع إضافة أي شيء في activities[]
→ activities: [] فارغ — هذا قانون توأمي صارم
→ الأنشطة تُدار بالكامل بواسطة activity.js + bridge.js (ثابتان على السيرفر)
→ الـ AI مسؤول عن ملء الأقسام 1–10 بجودة عالية (vocab ≥ 12، dialogue ≥ 6، إلخ)
→ شروط فولاذية: راجع TWIN-1 إلى TWIN-4 أعلاه — أي خلل في 1–10 يكسر الألعاب صامتاً

القانون: LESSON_SCHEMA.md (مرفق — القسم 11 مجمّد)
القالب: lesson.js (مرفق — activities: [] فارغ)
```

---

## 🚀 بروتوكول تسليم المنتج (Output Checklist)

قبل رفع الـ PR أو تسليم الملف، تأكد من البنود التالية:

### 🔴 CRITICAL (انهيار فوري إذا خُولف)
```
□ const LESSON_DATA = { ← السطر الأول — لا ```js قبله
□ }; ← السطر الأخير — لا ``` بعده
□ sentenceTransform.sentence → backticks `...` — وليس "..." (SyntaxError)
□ dragWords.cat = dragZones.accept (case-sensitive — لا فرق بين "Active" و "active")
□ activities: [] فارغ تماماً — (Section 11 Absolute Lock — القسم 11 مجمّد)
```

### 🔷 TWIN (ألعاب مكسورة صامتة إذا خُولفت)
```
□ vocab.length ≥ 12 (TWIN-1 — تغذية wheel, memory, sound-match وغيرها)
□ dialogue.length ≥ 6 (TWIN-2 — تغذية sentence-builder, progressive-story)
□ paragraph.sentence: عدد ___ = answers.length بالضبط (TWIN-3)
□ challenge.sentence: عدد ___ = answers.length بالضبط (TWIN-3)
□ vocab[0..3] صحيحة لـ selectWords، vocab[4..7] خاطئة (TWIN-4)
□ fillBlanks: كل sentence تحتوي ___ واحد → answer واحد
□ exercises.customWhoAmI موجود — 4-5 ألغاز، كل لغز 3 تلميحات
□ customWhoAmI[].word موجودة في vocab — ولا تلميح يحمل الكلمة أو جذرها
□ customTrafficLight موجود — 6 جُمَل، 3 أمر + 3 نهي، type صحيح
□ customDotsHunter موجود — correctLetter من ي/ى/ة فقط (الكلمة من أيّ نصّ في الدرس)
□ customConjugationLadder موجود — 5-6 أزواج، ولا past فارغ
□ customPunctuation موجود — 5 جُمَل، ولا جملة تحمل علامتها
□ customBoardGame موجود — 8 مربّعات، num بين 3 و29 تصاعدي بلا تكرار
□ customSpotDifference موجود — 4 أزواج، كل زوج يختلف بكلمة واحدة فقط
□ customYoungDoctor موجود — 2-3 حالات، كل حالة 3 نصائح أمر/نهي
□ customHealthLetter موجود — موجّه كتابة واحد
```

### 🟡 QUALITY (جودة بيداغوجية)
```
□ vocab: كل كلمة مشكولة بالكامل — emoji فريد غير مكرر — type = اسم/فعل/صفة/ظرف
□ dialogue: أسطر متسلسلة منطقياً — speaker/role متناسق — كل جملة مشكولة
□ exercises.mcq: 3 أسئلة — كل correct ضمن 0-3
□ exercises.trueFalse: 4-6 جمل — كل correct = true|false (وليس 0/1)
□ dragWords + dragZones: كل cat له accept مقابل — لا كلمات عالقة
□ multiStep.story: object {ar, zh} — وليس string
□ orderWords: كلمات مبعثرة من orderTarget — وليس من جملة أخرى
□ correctError: خيار صحيح واحد فقط — 3 خيارات خاطئة
□ rewrite: instruction بالصينية — sentence تحتوي ___
□ All answers/answer/data-answer: بدون تشكيل
```

---

*LESSON_SCHEMA v2.0 (Twin-File) — القسم 11 مجمّد — الأنشطة تُدار عبر activity.js + bridge.js — لا تعدّل هذا الملف إلا عند تغيير الميثاق | قالب الأنشطة والدروس الرشيقة v2.0 — نظام التوأم الرقمي في المتصفح جاهز للإنتاج الفعلي*
