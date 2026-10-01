# 🔍 تقرير فحص الأنشطة التفاعلية — Activity Audit Report

> **التاريخ:** 2026-09-17  
> **النطاق:** جميع الأنشطة الـ 22 في صفحة الأنشطة التفاعلية  
> **الحالة:** فحص تشخيصي — بدون تعديل على الكود

---

## 📊 ملخص سريع

| الحالة | العدد | النسبة |
|--------|-------|--------|
| ✅ تعمل بشكل صحيح | 13 | 59% |
| 🔴 معطلة (تعرض undefined) | 3 | 14% |
| 🟡 تعمل ببيانات خاطئة | 6 | 27% |

---

## 🗂️ جدول حالة كل نشاط

```
 #  | النشاط               | sourceField                  | الحالة | المشكلة
----|-----------------------|------------------------------|--------|--------
 1  | عجلة الحظ             | vocab                        | ✅ OK  | —
 2  | بطاقات الذاكرة        | vocab                        | ✅ OK  | —
 3  | اختيار سريع (MCQ)     | exercises.mcq                | ✅ OK  | —
 4  | تطابق الصوت           | vocab                        | ✅ OK  | —
 5  | الكشف المخفي          | exercises.customHiddenReveal | ✅ OK* | بيانات مخصصة غير متوفرة (بالتصميم)
 6  | غرفة مظلمة            | vocab                        | ✅ OK  | —
 7  | بناء الجملة           | dialogue                     | ✅ OK  | —
 8  | محادثة ويتشات         | exercises.customWechat       | ✅ OK* | بيانات مخصصة غير متوفرة (بالتصميم)
 9  | مَن أنا؟              | exercises.customWhoAmI       | ✅ OK* | بيانات مخصصة غير متوفرة (بالتصميم)
 10 | تمرير الصح/الخطأ      | exercises.trueFalse          | 🔴 BUG | يعرض "undefined"
 11 | إشارة الأمر والنهي    | grammar                      | 🟡     | بيانات تلقائية ضعيفة (عنصران فقط)
 12 | كشف السرعة            | vocab                        | 🔴 BUG | يعرض "undefined"
 13 | ردود فعل سريعة        | vocab                        | 🔴 BUG | يعرض "undefined"
 14 | متاهة صغيرة           | exercises.mcq                | ✅ OK  | —
 15 | صائد النقاط           | vocab                        | 🟡     | بيانات تلقائية بدل المخصصة
 16 | سلم التصريف           | grammar                      | 🟡     | عمود "الماضي" فارغ دائماً
 17 | محرر الترقيم          | exercises.mcq                | 🟡     | تخمين تلقائي للعلامات بدل البيانات المخصصة
 18 | الطبيب الصغير         | exercises.customYoungDoctor  | ✅ OK* | بيانات مخصصة غير متوفرة (بالتصميم)
 19 | رسالة صحية            | exercises.customHealthLetter | ✅ OK* | بيانات مخصصة غير متوفرة (بالتصميم)
 20 | لعبة اللوحة           | explain                      | 🟡     | أسئلة تلقائية ضعيفة الجودة
 21 | اكتشف الفرق           | vocab                        | 🟡     | مقارنة كلمات مفردة بدل جمل
 22 | القصة التدريجية       | dialogue                     | ✅ OK  | —
```

---

## 🔴 السبب الجذري الأول — "undefined" في 3 أنشطة

### المشكلة

الأنشطة `swipe-quiz` و `speed-reveal` و `quick-reaction` تعرض كلمة **"undefined"** بدل النص العربي/الصيني.

### السبب

**عدم تطابق أسماء الحقول** بين البيانات والعارض (Renderer):

| المكوّن | الحقل المستخدم | الحقل الموجود في البيانات |
|---------|---------------|--------------------------|
| `swipe-quiz.js` (سطر 29-30) | `item.arabic` / `item.chinese` | `item.ar` / `item.zh` |
| `speed-reveal.js` (سطر 27, 47-48) | `word.arabic` / `word.chinese` | `word.ar` / `word.zh` |
| `quick-reaction.js` (سطر 28-29, 32) | `w.arabic` / `correct.arabic` | `w.ar` / `w.zh` |

السبب التقني: هذه الأنشطة الثلاثة **ليس لها transform في `SOURCE_MAP`** داخل `bridge.js`. عندما لا يوجد transform مخصص، يُستخدم `SOURCE_MAP['direct']` الذي يمرر البيانات كما هي بدون إعادة تسمية الحقول.

بينما الأنشطة التي تعمل (مثل `wheel`، `memory`، `dark-room`) لديها transform يحوّل `ar` → `arabic` و `zh` → `chinese`.

### كيفية الإصلاح

**إضافة 3 transforms في `SOURCE_MAP` داخل `bridge.js`** (بدون تعديل أي ملف آخر):

```js
// في bridge.js → داخل SOURCE_MAP

'swipe-quiz': function(tf, config) {
  return (config.limit ? tf.slice(0, config.limit) : tf).map(function(s) {
    return { arabic: s.ar, chinese: s.zh, correct: s.correct };
  });
},

'speed-reveal': function(vocab, config) {
  return (config.limit ? vocab.slice(0, config.limit) : vocab).map(function(v) {
    return { arabic: v.ar, chinese: v.zh, emoji: v.emoji };
  });
},

'quick-reaction': function(vocab, config) {
  return (config.limit ? vocab.slice(0, config.limit) : vocab).map(function(v) {
    return { arabic: v.ar, chinese: v.zh, emoji: v.emoji };
  });
},
```

**الملف المتأثر:** `bridge.js` فقط (سطر 24 → داخل كائن `SOURCE_MAP`)  
**لا يتأثر:** `activity.js` / `lesson.js` / `app.js` / أي ملف CSS / أي renderer

---

## 🟡 السبب الجذري الثاني — بيانات مخصصة مُتجاهلة في 6 أنشطة

### المشكلة

6 أنشطة تحتوي بيانات مخصصة (`config.data`) في `activity.js`، لكنها لا تُستخدم أبداً.

### السبب

في `bridge.js` → `resolveData()` (سطر 160-179):

```js
function resolveData(config) {
  // 1. إذا sourceField === 'custom' → يستخدم config.data ✅
  // 2. إذا sourceField يشير لبيانات موجودة → يستخدمها ويتجاهل config.data ⚠️
  // 3. إذا sourceField يشير لبيانات غير موجودة → يستخدم config.data كـ fallback
}
```

**المنطق الحالي:** `config.data` هو **fallback فقط** — يُستخدم فقط عندما لا توجد بيانات في `sourceField`. لكن بما أن `sourceField` يشير دائماً لبيانات موجودة (`vocab`، `grammar`، `explain`، `exercises.mcq`)، فالبيانات المخصصة تُتجاهل ويتم توليد بيانات تلقائية بدلاً منها.

### تفصيل الأنشطة المتأثرة

| النشاط | ما يحدث حالياً | ما يجب أن يحدث |
|--------|---------------|----------------|
| **إشارة الأمر والنهي** (traffic-light) | يولّد عنصرين فقط من grammar patterns (كلاهما "command") | يجب أن يعرض 6 عناصر مخصصة (command + negative) |
| **صائد النقاط** (dots-hunter) | يبحث تلقائياً عن كلمات تنتهي بـ ة في vocab | يجب أن يعرض 4 كلمات مخصصة مع أسباب |
| **سلم التصريف** (conjugation-ladder) | عمود "الماضي" فارغ دائماً (`past: ''`) | يجب أن يعرض أزواج ماضي/مضارع مخصصة |
| **محرر الترقيم** (punctuation-editor) | يخمّن علامات الترقيم من أسئلة MCQ | يجب أن يعرض 5 جمل مخصصة مع علاماتها الصحيحة |
| **لعبة اللوحة** (board-game) | يقطع نصوص الشرح ويضيف ؟ في نهايتها | يجب أن يعرض 8 أسئلة مخصصة مع أرقام مربعات |
| **اكتشف الفرق** (spot-difference) | يقارن كلمات vocab المتجاورة (كلمة vs كلمة) | يجب أن يعرض 4 أزواج جمل مخصصة بفروق واضحة |

### كيفية الإصلاح

**خياران (لا يكسران المعمارية):**

#### الخيار أ — تغيير `sourceField` إلى `"custom"` (الأبسط)
في `activity.js`، للأنشطة الستة التي تحتوي `config.data`:
```js
// قبل:
{ type: "traffic-light", sourceField: "grammar", data: [...] }
// بعد:
{ type: "traffic-light", sourceField: "custom", data: [...] }
```
**الملف المتأثر:** `activity.js` فقط (6 أسطر)

#### الخيار ب — تعديل أولوية `resolveData()` (أعمق)
في `bridge.js`، جعل `config.data` يأخذ الأولوية على البيانات التلقائية:
```js
function resolveData(config) {
  if (config.data && config.data.length > 0)
    return config.data;                        // ← الأولوية لـ config.data
  if (config.sourceField === 'custom')
    return [];
  // ... باقي المنطق الحالي
}
```
**الملف المتأثر:** `bridge.js` فقط (سطر 160-162)

#### التوصية: **الخيار أ** — أقل خطراً، لا يغيّر منطق `resolveData()` الذي تعتمد عليه 16 نشاطاً آخر.

---

## ⚠️ ملاحظة مهمة

البيانات المخصصة (`config.data`) في `activity.js` مكتوبة **لدرس الشقة** (المُسْتَأْجِر، غُرْفَة، شَقَّة) وليس لدرس التخييم الحالي. حتى بعد إصلاح المنطق، يجب تحديث هذه البيانات لتتوافق مع موضوع الدرس الحالي — أو تركها فارغة (`data: null`) ليولّدها النظام تلقائياً.

---

## 📋 خطة التنفيذ المقترحة (بالأولوية)

### الأولوية 1 — إصلاح فوري (3 أنشطة معطلة) ✅ تم
- [x] إضافة transforms لـ `swipe-quiz` و `speed-reveal` و `quick-reaction` في `bridge.js`
- **الملف:** `bridge.js` فقط
- **الخطر:** صفر — إضافة فقط، لا تعديل على كود موجود

### الأولوية 2 — إصلاح جودة البيانات (6 أنشطة ضعيفة) ✅ تم
- [x] تغيير `sourceField` إلى `"custom"` للأنشطة ذات البيانات المخصصة في `activity.js`
- [x] تحديث البيانات المخصصة لتتوافق مع موضوع الدرس الحالي (التخييم)
- **الملفات:** `activity.js` فقط
- **الخطر:** منخفض — لا يؤثر على بقية الأنشطة

---

## 🏗️ الملفات المعنية (لا يجب المساس بغيرها)

| الملف | الدور | التعديل المطلوب |
|-------|-------|----------------|
| `bridge.js` | تحويل البيانات | إضافة 3 transforms في SOURCE_MAP |
| `activity.js` | إعدادات الأنشطة | تغيير sourceField لـ 6 أنشطة |
| `lesson.js` | بيانات الدرس | ❌ لا تعديل |
| `app.js` | المحرك الرئيسي | ❌ لا تعديل |
| `activities/*.js` | عارضات الأنشطة | ❌ لا تعديل |
| `css/*` | الأنماط | ❌ لا تعديل |
