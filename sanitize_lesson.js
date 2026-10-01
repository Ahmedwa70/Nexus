#!/usr/bin/env node
// ================================================================
// sanitize_lesson.js
// الغرض: تنظيف الـ output الخام من AI قبل التحقق والنشر
//
// التشغيل:
//   node sanitize_lesson.js lesson_raw.js              ← يُعدّل الملف في مكانه
//   node sanitize_lesson.js lesson_raw.js lesson.js    ← يكتب ملفاً جديداً
//
// Pipeline الكامل:
//   node sanitize_lesson.js lesson_raw.js lesson.js
//   node validate_lesson.js lesson.js
//   → إذا نجح: انسخ lesson.js إلى مكانه النهائي
// ================================================================

'use strict';

const fs   = require('fs');
const path = require('path');

// ── مسارات الملفات ───────────────────────────────────────────────
const INPUT  = path.resolve(process.argv[2] || './lesson_raw.js');
const OUTPUT = path.resolve(process.argv[3] || process.argv[2] || './lesson_raw.js');

// ── قراءة الملف ──────────────────────────────────────────────────
let raw;
try {
    raw = fs.readFileSync(INPUT, 'utf8');
} catch (e) {
    console.error('❌ لا يمكن قراءة الملف:', INPUT);
    process.exit(1);
}

// ================================================================
// سجل التعديلات
// ================================================================
const fixes   = [];   // ما تم إصلاحه
const refused = [];   // ما يجب رفضه — لا يمكن إصلاحه آلياً

function fixed(msg)   { fixes.push('  ✅ ' + msg); }
function refused_(msg){ refused.push('  ❌ ' + msg); }

// ================================================================
// STEP 1 — إزالة Markdown code block markers
// ================================================================
// الحالة الأولى: يبدأ بـ ```js أو ```javascript أو ``` فقط
// AI يُضيف هذه عند الكتابة في chat interface
// ================================================================
let text = raw;

// البداية: ```js\n أو ```javascript\n أو ```\n
const startMatch = text.match(/^(`{3,})(js|javascript|JS)?\s*\n/);
if (startMatch) {
    text = text.slice(startMatch[0].length);
    fixed('أُزيلت علامة البداية: ' + startMatch[0].trim());
}

// النهاية: \n``` أو \n```\n أو ``` في آخر سطر
const endMatch = text.match(/\n?`{3,}\s*$/);
if (endMatch) {
    text = text.slice(0, text.length - endMatch[0].length);
    fixed('أُزيلت علامة النهاية: ```');
}

// ================================================================
// STEP 2 — إزالة export statements
// ================================================================
// AI أحياناً يُضيف export default أو module.exports
// كلاهما يكسر LESSON_DATA كـ global variable في المتصفح
// ================================================================

// export default LESSON_DATA; (بنهاية السطر)
if (/^export\s+default\s+LESSON_DATA\s*;?\s*$/m.test(text)) {
    text = text.replace(/^export\s+default\s+LESSON_DATA\s*;?\s*$/m, '');
    fixed('أُزيل: export default LESSON_DATA');
}

// export default { ... } أو export default LESSON_DATA
if (/^export\s+default\s+/m.test(text)) {
    text = text.replace(/^export\s+default\s+/m, '');
    fixed('أُزيل: export default (generic)');
}

// module.exports = LESSON_DATA; أو module.exports = {...}
if (/^module\.exports\s*=/m.test(text)) {
    text = text.replace(/^module\.exports\s*=\s*LESSON_DATA\s*;?\s*$/m, '');
    text = text.replace(/^module\.exports\s*=\s*$/m, '');
    fixed('أُزيل: module.exports');
}

// ================================================================
// STEP 3 — إضافة const إذا كان مفقوداً
// ================================================================
// AI أحياناً يكتب: LESSON_DATA = { ... }
// بدون const — يُسبب ReferenceError في strict mode
// ================================================================

const trimmedStart = text.trimStart();
if (/^LESSON_DATA\s*=/.test(trimmedStart) && !trimmedStart.startsWith('const') && !trimmedStart.startsWith('let') && !trimmedStart.startsWith('var')) {
    text = text.replace(/^(\s*)LESSON_DATA\s*=/, '$1const LESSON_DATA =');
    fixed('أُضيف: const أمام LESSON_DATA');
}

// ================================================================
// STEP 4 — تنظيف whitespace زائد
// ================================================================
// إزالة BOM إذا وُجد (Byte Order Mark — يظهر أحياناً في نسخ Windows)
// إزالة أسطر فارغة زائدة في البداية والنهاية
// ================================================================

// BOM
if (text.charCodeAt(0) === 0xFEFF) {
    text = text.slice(1);
    fixed('أُزيل: BOM (Byte Order Mark)');
}

// أسطر فارغة زائدة في البداية
const leadingNewlines = text.match(/^\n+/);
if (leadingNewlines && leadingNewlines[0].length > 0) {
    text = text.replace(/^\n+/, '');
    fixed('أُزيلت: أسطر فارغة زائدة في البداية');
}

// أسطر فارغة متكررة (أكثر من سطرين متتاليين) → سطران فقط
if (/\n{4,}/.test(text)) {
    text = text.replace(/\n{4,}/g, '\n\n\n');
    fixed('قُلِّصت: أسطر فارغة متتالية أكثر من 3');
}

// مسافات trailing في نهاية الأسطر
if (/ +\n/.test(text)) {
    text = text.replace(/ +\n/g, '\n');
    fixed('أُزيلت: مسافات trailing في نهاية الأسطر');
}

// نهاية الملف: تأكد من سطر واحد فقط في النهاية
text = text.trimEnd() + '\n';

// ================================================================
// STEP 5 — REFUSE: تحذيرات لما لا يمكن إصلاحه آلياً
// ================================================================
// هذه الحالات يجب رفضها وإعادة توليدها — لا نحاول إصلاحها
// ================================================================

// تحقق من وجود LESSON_DATA أصلاً بعد التنظيف
if (!text.includes('LESSON_DATA')) {
    refused_('LESSON_DATA غير موجود — الملف لا يحتوي lesson data');
}

// تحقق من عدم وجود functions مستقلة خارج LESSON_DATA
// (علامة على أن AI كتب كوداً إضافياً بدلاً من بيانات فقط)
const functionOutside = text.match(/^function\s+\w+\s*\(/m);
if (functionOutside) {
    refused_('وُجدت function خارج LESSON_DATA: ' + functionOutside[0] + ' — يجب مراجعة يدوية');
}

// تحقق من import statements
if (/^import\s+/m.test(text)) {
    refused_('وُجد import statement — يجب حذفه يدوياً');
}

// ================================================================
// STEP 6 — كتابة الملف الناتج
// ================================================================

const hasChanges  = fixes.length > 0;
const hasRefusals = refused.length > 0;

console.log('\n' + '═'.repeat(60));
console.log('  LESSON SANITIZER');
console.log('  Input:  ' + INPUT);
console.log('  Output: ' + OUTPUT);
console.log('═'.repeat(60));

if (fixes.length > 0) {
    console.log('\n  الإصلاحات التلقائية (' + fixes.length + '):');
    fixes.forEach(f => console.log(f));
}

if (refused.length > 0) {
    console.log('\n  تحذيرات تحتاج مراجعة يدوية (' + refused.length + '):');
    refused.forEach(r => console.log(r));
}

if (!hasChanges && !hasRefusals) {
    console.log('\n  ✅ الملف نظيف — لا تعديلات مطلوبة');
}

// نكتب الملف حتى لو لم تكن هناك تعديلات (للـ pipeline)
try {
    fs.writeFileSync(OUTPUT, text, 'utf8');
    console.log('\n  💾 الملف الناتج: ' + OUTPUT);
} catch (e) {
    console.error('  ❌ فشل الكتابة:', e.message);
    process.exit(1);
}

console.log('═'.repeat(60));

// exit code:
// 0 = نظيف أو تم إصلاحه بنجاح → يمكن المتابعة للـ validate
// 1 = يوجد ما يحتاج مراجعة يدوية → يجب التوقف
if (hasRefusals) {
    console.log('\n  ⚠️  يوجد ' + refused.length + ' تحذير يحتاج مراجعة يدوية قبل المتابعة\n');
    process.exit(1);
} else {
    console.log('\n  ✅ جاهز للـ validate → node validate_lesson.js ' + OUTPUT + '\n');
    process.exit(0);
}
