#!/usr/bin/env node
// ================================================================
// check_activities.js — فحص تقاطعي بين activity.js و lesson.js
//
// التشغيل:  node tools/check_activities.js [مسار lesson.js]
//
// الغرض: المدقّق الرسمي (validate_lesson.js) يفحص lesson.js معزولاً،
// ولا يعرف activity.js إطلاقاً. فدرسٌ ينقصه حقل نشاط يمرّ عنده
// «ممتازاً»، ثم يفتح النشاط فارغاً أمام الصف.
// هذه الأداة تسدّ تلك الفجوة: تتحقق أن كل نشاط من الـ22 يجد بياناته،
// وأن تلك البيانات تحترم قيود واجهته.
//
// الخروج: 0 سليم · 1 يوجد نشاط معطّل
// ================================================================
'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const TARGET = path.resolve(process.argv[2] || path.join(ROOT, 'data/lesson.js'));

function loadConst(file, name) {
  const raw = fs.readFileSync(file, 'utf8');
  const m = raw.match(new RegExp('const\\s+' + name + '\\s*=\\s*([\\s\\S]*)'));
  if (!m) throw new Error(`لم يُعثر على ${name} في ${file}`);
  return eval('(' + m[1].replace(/;\s*$/, '') + ')');
}

let LESSON, CONFIG;
try {
  LESSON = loadConst(TARGET, 'LESSON_DATA');
  CONFIG = loadConst(path.join(ROOT, 'activity.js'), 'ActivityConfig');
} catch (e) {
  console.error('❌ ' + e.message);
  process.exit(1);
}

// ── أدوات ────────────────────────────────────────────────────────
const strip = t => String(t == null ? '' : t).replace(/[ً-ْٰـ]/g, '');
const norm  = t => strip(t).replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');
const bare  = w => norm(w).replace(/^ال/, '');
const get   = (o, p) => p.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);

const problems = [];
const notes = [];
function bad(id, name, msg)  { problems.push({ id, name, msg }); }
function warn(id, name, msg) { notes.push({ id, name, msg }); }

const VOCAB = new Set((LESSON.vocab || []).map(v => bare(v.ar)));

// ── فاحصو القيود — مشتقّون من شيفرة كل نشاط، لا من التخمين ───────
const RULES = {
  'traffic-light': (d, id, n) => {
    d.forEach((x, i) => {
      if (!['command', 'negative'].includes(x.type))
        bad(id, n, `العنصر #${i + 1}: type = "${x.type}" — المسموح command أو negative فقط`);
      if (!x.arabic) bad(id, n, `العنصر #${i + 1}: arabic مفقود`);
      if (!x.chinese) warn(id, n, `العنصر #${i + 1}: chinese مفقود`);
    });
    const c = d.filter(x => x.type === 'command').length;
    const g = d.filter(x => x.type === 'negative').length;
    if (c === 0 || g === 0) bad(id, n, `غير متوازن: ${c} أمر و${g} نهي — يلزم نوعان`);
    else if (Math.abs(c - g) > 1) warn(id, n, `توازن ضعيف: ${c} أمر مقابل ${g} نهي`);
  },

  'dots-hunter': (d, id, n) => {
    const ALLOWED = ['ي', 'ى', 'ة'];          // أزرار الواجهة الثلاثة
    d.forEach((x, i) => {
      if (!ALLOWED.includes(x.correctLetter))
        bad(id, n, `العنصر #${i + 1}: correctLetter = "${x.correctLetter}" — الواجهة تعرض ي · ى · ة فقط، فاللغز بلا إجابة`);
      if (!x.fullWord) { bad(id, n, `العنصر #${i + 1}: fullWord مفقود`); return; }
      if (x.base !== x.fullWord.slice(0, -1))
        bad(id, n, `العنصر #${i + 1}: base لا يطابق fullWord ناقصةَ حرفها الأخير ("${x.base}" مقابل "${x.fullWord.slice(0, -1)}")`);
      if (x.fullWord.slice(-1) !== x.correctLetter)
        bad(id, n, `العنصر #${i + 1}: آخر حرف في fullWord ("${x.fullWord.slice(-1)}") يخالف correctLetter ("${x.correctLetter}")`);
      if (!x.reason) warn(id, n, `العنصر #${i + 1}: reason مفقود`);
      if (!VOCAB.has(bare(x.fullWord))) warn(id, n, `"${x.fullWord}" ليست من vocab الدرس`);
    });
  },

  'conjugation-ladder': (d, id, n) => {
    d.forEach((x, i) => {
      if (!x.past || !String(x.past).trim())
        bad(id, n, `الزوج #${i + 1}: past فارغ — الواجهة تعرضه ويبقى السلّم بلا درجة`);
      if (!x.present || !String(x.present).trim())
        bad(id, n, `الزوج #${i + 1}: present فارغ — لا إجابة للتمرين`);
      if (x.past && x.present && strip(x.past) === strip(x.present))
        warn(id, n, `الزوج #${i + 1}: الماضي والمضارع متطابقان`);
    });
  },

  'punctuation-editor': (d, id, n) => {
    const ALLOWED = ['.', '؟', '!', '،', '؛', ','];   // رموز الواجهة
    d.forEach((x, i) => {
      if (!ALLOWED.includes(x.correctMark))
        bad(id, n, `الجملة #${i + 1}: correctMark = "${x.correctMark}" غير معروض في الواجهة`);
      if (!x.text) { bad(id, n, `الجملة #${i + 1}: text مفقود`); return; }
      // العيب القاتل: العلامة ظاهرة داخل النص فالجواب مكشوف
      if (/[.؟!،؛,]/.test(x.text))
        bad(id, n, `الجملة #${i + 1}: النص يحتوي علامة ترقيم فالجواب مكشوف — "${x.text}"`);
    });
    const marks = new Set(d.map(x => x.correctMark));
    if (marks.size < 2) warn(id, n, `كل الجمل تطلب العلامة نفسها (${[...marks]}) — نوِّعها`);
  },

  'board-game': (d, id, n) => {
    const TYPES = ['vocab', 'command', 'spelling', 'punctuation', 'conjugation'];
    const seen = new Set();
    let prev = 0;
    d.forEach((x, i) => {
      if (!Number.isInteger(x.num) || x.num < 1 || x.num > 30)
        bad(id, n, `المربّع #${i + 1}: num = ${x.num} — اللوحة 30 مربّعاً فقط`);
      if (seen.has(x.num)) bad(id, n, `المربّع #${i + 1}: num ${x.num} مكرّر`);
      seen.add(x.num);
      if (x.num <= prev) warn(id, n, `المربّع #${i + 1}: num ${x.num} ليس تصاعدياً`);
      prev = x.num;
      if (!TYPES.includes(x.type))
        bad(id, n, `المربّع #${i + 1}: type = "${x.type}" — المسموح ${TYPES.join(' · ')}`);
      if (!x.question) bad(id, n, `المربّع #${i + 1}: question مفقود`);
      else if (x.question.length > 70) warn(id, n, `المربّع #${i + 1}: السؤال طويل (${x.question.length} حرفاً)`);
      if (!x.answer) bad(id, n, `المربّع #${i + 1}: answer مفقود`);
      else if (/[ً-ْ]/.test(x.answer)) warn(id, n, `المربّع #${i + 1}: answer مشكّلة — الإجابات بلا تشكيل`);
    });
    if (d.some(x => x.num === 1)) warn(id, n, 'المربّع 1 نقطة البداية — لن يُسأل عنه');
  },

  'spot-difference': (d, id, n) => {
    d.forEach((x, i) => {
      if (!x.sentenceA || !x.sentenceB) { bad(id, n, `الزوج #${i + 1}: جملة ناقصة`); return; }
      const A = x.sentenceA.trim().split(/\s+/);
      const B = x.sentenceB.trim().split(/\s+/);
      if (A.length < 3 || B.length < 3)
        bad(id, n, `الزوج #${i + 1}: مفردات لا جُمَل ("${x.sentenceA}" / "${x.sentenceB}")`);
      if (A.length !== B.length) {
        bad(id, n, `الزوج #${i + 1}: الجملتان مختلفتا الطول (${A.length} و${B.length} كلمة) — يجب اختلاف كلمة واحدة فقط`);
        return;
      }
      const diff = A.filter((w, k) => norm(w) !== norm(B[k])).length;
      if (diff !== 1)
        bad(id, n, `الزوج #${i + 1}: الاختلاف في ${diff} كلمة — المطلوب كلمة واحدة بالضبط`);
      if (!x.keyword) warn(id, n, `الزوج #${i + 1}: keyword مفقود`);
    });
  },

  'who-am-i': (d, id, n) => {
    d.forEach((x, i) => {
      if (!x.word) { bad(id, n, `اللغز #${i + 1}: word مفقود`); return; }
      if (!VOCAB.has(bare(x.word))) bad(id, n, `اللغز #${i + 1}: "${x.word}" ليست من vocab الدرس`);
      if (!Array.isArray(x.hints) || x.hints.length !== 3)
        bad(id, n, `اللغز #${i + 1}: يلزم ثلاثة تلميحات (الموجود ${(x.hints || []).length})`);
      const root = bare(x.word);
      const stem = root.length > 3 ? root.slice(0, 3) : root;
      (x.hints || []).forEach(h => {
        const leak = norm(h).split(/\s+/).some(t => {
          const tt = t.replace(/^ال/, '').replace(/^[وفبكل]/, '');
          return tt.includes(root) || (root.length > 3 && tt.includes(stem) && tt.length >= stem.length);
        });
        if (leak) bad(id, n, `اللغز #${i + 1}: تلميح يحمل الكلمة أو جذرها — "${h}"`);
      });
      if (!x.chinese) warn(id, n, `اللغز #${i + 1}: chinese مفقود`);
    });
  },

  'wechat': (d, id, n) => {
    if (!d.some(x => x.from === 'choices')) bad(id, n, 'لا يوجد أي سؤال اختيار (from: "choices")');
    d.forEach((x, i) => {
      if (x.from === 'choices') {
        if (!Array.isArray(x.choices) || x.choices.length < 2) bad(id, n, `الخطوة #${i + 1}: تحتاج خيارين على الأقل`);
        if (typeof x.correctIndex !== 'number' || x.correctIndex < 0 || x.correctIndex >= (x.choices || []).length)
          bad(id, n, `الخطوة #${i + 1}: correctIndex خارج نطاق الخيارات`);
      } else if (x.from === 'other') {
        if (!x.text) bad(id, n, `الخطوة #${i + 1}: text مفقود`);
      } else bad(id, n, `الخطوة #${i + 1}: from = "${x.from}" — المسموح other أو choices`);
    });
  },

  'hidden-reveal': (d, id, n) => {
    d.forEach((x, i) => {
      if (!x.word) bad(id, n, `العنصر #${i + 1}: word مفقود`);
      if (!Array.isArray(x.hints) || !x.hints.length) bad(id, n, `العنصر #${i + 1}: hints مفقودة`);
    });
  },

  'young-doctor': (d, id, n) => {
    d.forEach((x, i) => {
      if (!x.name) bad(id, n, `المريض #${i + 1}: name مفقود`);
      if (x.age == null) warn(id, n, `المريض #${i + 1}: age مفقود`);
      if (!x.problems) bad(id, n, `المريض #${i + 1}: problems مفقود`);
      if (!Array.isArray(x.expectedTips) || !x.expectedTips.length)
        bad(id, n, `المريض #${i + 1}: expectedTips مفقودة`);
    });
  },
};

// ── الفحص ────────────────────────────────────────────────────────
const line = '─'.repeat(78);
console.log('\n' + '═'.repeat(78));
console.log('  🔗 الفحص التقاطعي — activity.js ↔ ' + path.basename(TARGET));
console.log('  الدرس: ' + ((LESSON.meta && LESSON.meta.title) || '—'));
console.log('═'.repeat(78) + '\n');
console.log('  ID  النشاط               المصدر                              الحالة');
console.log('  ' + line);

let okCount = 0;
CONFIG.forEach(c => {
  const name = c.titleAr || c.type;
  const value = get(LESSON, c.sourceField);
  let status;

  if (value === undefined) {
    bad(c.id, name, `الحقل "${c.sourceField}" غير موجود في الدرس`);
    status = '🔴 الحقل مفقود';
  } else if (!Array.isArray(value)) {
    bad(c.id, name, `"${c.sourceField}" ليس مصفوفة (${typeof value})`);
    status = '🔴 نوع خاطئ';
  } else if (value.length === 0) {
    bad(c.id, name, `"${c.sourceField}" مصفوفة فارغة`);
    status = '🔴 فارغ';
  } else {
    const before = problems.length;
    if (RULES[c.type]) RULES[c.type](value, c.id, name);
    status = problems.length === before ? `✅ ${value.length} عنصراً` : '⚠️ مخالفة قيد';
    if (problems.length === before) okCount++;
  }

  console.log('  ' + String(c.id).padStart(2) + '  ' +
    (c.titleAr || c.type).padEnd(20) + ' ' +
    c.sourceField.padEnd(35) + ' ' + status);
});

console.log('  ' + line + '\n');

if (problems.length) {
  console.log('  🔴 أخطاء تمنع عمل النشاط (' + problems.length + ')');
  console.log('  ' + line);
  let last = null;
  problems.forEach(p => {
    if (p.id !== last) { console.log(`\n  ❌ [${p.id}] ${p.name}`); last = p.id; }
    console.log('       • ' + p.msg);
  });
  console.log('');
}

if (notes.length) {
  console.log('  🟡 ملاحظات جودة (' + notes.length + ')');
  console.log('  ' + line);
  notes.slice(0, 12).forEach(p => console.log(`  ⚠️  [${p.id}] ${p.name}: ${p.msg}`));
  if (notes.length > 12) console.log(`  ... و${notes.length - 12} ملاحظة أخرى`);
  console.log('');
}

console.log('═'.repeat(78));
if (problems.length === 0) {
  console.log(`\n  ✅ الأنشطة الـ${CONFIG.length} كلها تجد بياناتها وتحترم قيود واجهاتها\n`);
} else {
  const broken = new Set(problems.map(p => p.id)).size;
  console.log(`\n  ⛔ ${broken} نشاطاً من ${CONFIG.length} لن يعمل كما ينبغي`);
  console.log(`     أصلح الدرس ثم أعِد التشغيل — لا تنشره هكذا\n`);
}
console.log('═'.repeat(78) + '\n');

process.exit(problems.length ? 1 : 0);
