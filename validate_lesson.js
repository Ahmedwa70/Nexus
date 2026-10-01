#!/usr/bin/env node
// ================================================================
// validate_lesson.js
// تشغيل: node validate_lesson.js
// الغرض: التحقق من lesson.js قبل نشر أي درس
// ================================================================

'use strict';

const fs   = require('fs');
const path = require('path');

// ── الملف المراد فحصه ─────────────────────────────────────────
const TARGET = path.resolve(process.argv[2] || './lesson.js');

// ── قراءة الملف ──────────────────────────────────────────────
let raw;
try {
    raw = fs.readFileSync(TARGET, 'utf8');
} catch (e) {
    console.error('❌ لا يمكن قراءة الملف:', TARGET);
    process.exit(1);
}

// ================================================================
// بنية النتيجة
// ================================================================
const result = {
    errors:   [],   // تمنع النشر
    warnings: [],   // لا تمنع لكن يجب مراجعتها
    infos:    []    // ملاحظات جودة فقط
};

function error(code, path, message, fix) {
    result.errors.push({ level: 'error', code, path, message, fix: fix || null });
}
function warn(code, path, message, fix) {
    result.warnings.push({ level: 'warning', code, path, message, fix: fix || null });
}
function info(code, path, message) {
    result.infos.push({ level: 'info', code, path, message });
}

// ================================================================
// PHASE 0 — Syntax & Existence
// ================================================================

// P0-A: ``` markers
if (/^```/.test(raw.trimStart())) {
    error('SYN-001', 'file start',
        'الملف يبدأ بـ ``` — أزل علامات code block',
        'احذف السطر الأول الذي يحتوي ```js أو ```');
}
if (/```\s*$/.test(raw.trimEnd())) {
    error('SYN-002', 'file end',
        'الملف ينتهي بـ ``` — أزل السطر الأخير');
}

// P0-B: exports
if (/^export\s+default/m.test(raw)) {
    error('SYN-003', 'file',
        'ممنوع export default — أزل هذا السطر');
}
if (/^module\.exports/m.test(raw)) {
    error('SYN-004', 'file',
        'ممنوع module.exports — أزل هذا السطر');
}

// P0-C: LESSON_DATA معرّف
if (!raw.includes('const LESSON_DATA')) {
    error('SYN-005', 'LESSON_DATA',
        'const LESSON_DATA غير موجود في الملف',
        'يجب أن يبدأ الملف بـ: const LESSON_DATA = {');
}

// P0-D: JavaScript parse — استخراج الـ object وتقييمه
let data = null;
try {
    // نستخرج محتوى الـ object فقط
    const match = raw.match(/const\s+LESSON_DATA\s*=\s*(\{[\s\S]*\})\s*;?\s*$/);
    if (!match) throw new Error('لم يُعثر على LESSON_DATA object — تحقق من صياغة const LESSON_DATA = {...}');
    // eslint-disable-next-line no-eval
    data = eval('(' + match[1] + ')');
} catch (e) {
    error('SYN-006', 'LESSON_DATA',
        'JavaScript parse error: ' + e.message);
}

// إذا فشل الـ parse لا فائدة من الاستمرار
if (!data) {
    printResults();
    process.exit(result.errors.length > 0 ? 1 : 0);
}

// ================================================================
// PHASE 1 — Top-level Structure
// ================================================================

const REQUIRED_SECTIONS = [
    'meta', 'hook', 'thinking', 'vocab', 'dialogue',
    'dialogueScenes', 'explain', 'grammarMeta', 'grammar',
    'exercisesMeta', 'exercises', 'smartFeedback'
];

REQUIRED_SECTIONS.forEach(key => {
    if (data[key] === undefined || data[key] === null) {
        error('STR-001', key, `القسم الإلزامي مفقود: ${key}`);
    }
});

// إذا exercises مفقود لا فائدة من فحص التمارين
if (!data.exercises || typeof data.exercises !== 'object' || Array.isArray(data.exercises)) {
    error('STR-002', 'exercises', 'exercises يجب أن يكون object وليس array أو null');
    printResults();
    process.exit(1);
}

// ================================================================
// PHASE 2 — Section Types & Minimums
// ================================================================

// meta
if (data.meta) {
    ['pageTitle', 'brandIcon', 'brandPrefix', 'brandTitle'].forEach(k => {
        if (!data.meta[k] && data.meta[k] !== 0) {
            warn('STR-010', `meta.${k}`, `meta.${k} فارغ أو مفقود`);
        }
    });
    if (data.meta.pageTitle && !data.meta.pageTitle.includes('|')) {
        warn('STR-011', 'meta.pageTitle',
            'meta.pageTitle يجب أن يحتوي "|" لفصل العربية عن الصينية');
    }
}

// grammarMeta
if (data.grammarMeta) {
    if (!data.grammarMeta.title) {
        error('STR-012', 'grammarMeta.title',
            'grammarMeta.title مفقود — يُسبب crash في loadLesson()',
            'أضف title للـ grammarMeta');
    }
    if (!data.grammarMeta.subtitle) {
        warn('STR-013', 'grammarMeta.subtitle', 'grammarMeta.subtitle مفقود');
    }
}

// Arrays
const ARRAY_SECTIONS = [
    { path: 'thinking',       min: 3,  max: 5,  crash: false },
    { path: 'vocab',          min: 8,  max: 35, crash: true  },
    { path: 'dialogue',       min: 2,  max: 12, crash: true  },
    { path: 'dialogueScenes', min: 2,  max: 2,  crash: false },
    { path: 'explain',        min: 4,  max: 6,  crash: false },
    { path: 'grammar',        min: 1,  max: null, crash: true },
];

ARRAY_SECTIONS.forEach(({ path: p, min, max, crash }) => {
    const val = data[p];
    if (!Array.isArray(val)) {
        const fn = crash ? error : warn;
        fn('STR-020', p, `${p} يجب أن يكون array — الآن: ${typeof val}`);
        return;
    }
    if (min && val.length < min) {
        warn('STR-021', p, `${p} يحتوي ${val.length} عناصر — الحد الأدنى: ${min}`);
    }
    if (max && val.length > max) {
        info('STR-022', p, `${p} يحتوي ${val.length} عناصر — الحد الموصى: ${max}`);
    }
});

// hook.compare
if (data.hook) {
    if (!Array.isArray(data.hook.compare)) {
        error('STR-030', 'hook.compare',
            'hook.compare يجب أن يكون array — يُسبب crash في renderHook()',
            'اجعل compare مصفوفة من عنصرين');
    } else if (data.hook.compare.length !== 2) {
        warn('STR-031', 'hook.compare',
            `hook.compare يحتوي ${data.hook.compare.length} عناصر — يجب 2 بالضبط`);
    }
}

// ================================================================
// PHASE 3 — Exercises Existence (كل exercise مطلوب)
// ================================================================

const REQUIRED_EXERCISES = [
    'mcq', 'trueFalse', 'fillBlanks', 'dragWords', 'dragZones',
    'orderWords', 'orderTarget', 'correctError', 'rewrite',
    'guidedWriting', 'listeningExercise', 'speedChallenge',
    'multiStep', 'paragraph', 'contextAnalysis', 'scenario',
    'dialogueFill', 'visualChoice', 'patternFill',
    'sentenceTransform', 'challenge', 'selectWords'
];

REQUIRED_EXERCISES.forEach(key => {
    if (data.exercises[key] === undefined || data.exercises[key] === null) {
        error('EX-000', `exercises.${key}`,
            `exercises.${key} مفقود — يُسبب crash في getExercisesHTML()`,
            `أضف exercises.${key} للدرس`);
    }
});

// ================================================================
// PHASE 4 — Per-Exercise Validation
// ================================================================
const ex = data.exercises;

// ── MCQ ──────────────────────────────────────────────────────────
if (Array.isArray(ex.mcq)) {
    if (ex.mcq.length === 0) {
        warn('EX-MCQ-001', 'exercises.mcq', 'mcq فارغ — لن تظهر أسئلة');
    }
    ex.mcq.forEach((item, i) => {
        if (!Array.isArray(item.options)) {
            error('EX-MCQ-002', `exercises.mcq[${i}].options`,
                `mcq[${i}].options يجب array`);
        } else if (item.options.length !== 4) {
            warn('EX-MCQ-003', `exercises.mcq[${i}].options`,
                `mcq[${i}].options يحتوي ${item.options.length} خيارات — يجب 4`);
        }
        if (typeof item.correct !== 'number') {
            error('EX-MCQ-004', `exercises.mcq[${i}].correct`,
                `mcq[${i}].correct يجب number — الآن: ${typeof item.correct}`);
        } else if (item.correct < 0 || item.correct >= (item.options || []).length) {
            error('EX-MCQ-005', `exercises.mcq[${i}].correct`,
                `mcq[${i}].correct = ${item.correct} خارج نطاق options`);
        }
    });
} else if (ex.mcq !== undefined) {
    error('EX-MCQ-000', 'exercises.mcq', 'mcq يجب array');
}

// ── fillBlanks ────────────────────────────────────────────────────
if (Array.isArray(ex.fillBlanks)) {
    ex.fillBlanks.forEach((item, i) => {
        if (typeof item.sentence !== 'string' || !item.sentence.includes('___')) {
            warn('EX-FILL-001', `exercises.fillBlanks[${i}].sentence`,
                `fillBlanks[${i}].sentence لا تحتوي ___ — input لن يظهر`);
        }
        if (!item.answer && item.answer !== 0) {
            warn('EX-FILL-002', `exercises.fillBlanks[${i}].answer`,
                `fillBlanks[${i}].answer مفقود — checkFill لن يعمل`);
        }
    });
}

// ── dragWords / dragZones ─────────────────────────────────────────
if (Array.isArray(ex.dragWords) && Array.isArray(ex.dragZones)) {
    const cats    = new Set(ex.dragWords.map(w => w.cat));
    const accepts = new Set(ex.dragZones.map(z => z.accept));

    cats.forEach(cat => {
        if (!accepts.has(cat)) {
            error('EX-DRG-001', 'exercises.dragWords/dragZones',
                `dragWords.cat "${cat}" لا يوجد له dragZone.accept مطابق`,
                `أضف dragZone بـ accept: "${cat}"`);
        }
        // case sensitivity check
        [...accepts].forEach(acc => {
            if (cat !== acc && cat.toLowerCase() === acc.toLowerCase()) {
                error('EX-DRG-002', 'exercises.dragWords/dragZones',
                    `"${cat}" vs "${acc}" — مختلفان في الحالة (case) — المطابقة ستفشل`);
            }
        });
    });
}

// ── orderWords ────────────────────────────────────────────────────
if (ex.orderWords !== undefined && !Array.isArray(ex.orderWords)) {
    error('EX-ORD-001', 'exercises.orderWords',
        'orderWords يجب array وليس object أو string');
}

// ── correctError ──────────────────────────────────────────────────
if (ex.correctError && typeof ex.correctError === 'object') {
    if (!Array.isArray(ex.correctError.options)) {
        error('EX-CER-001', 'exercises.correctError.options',
            'correctError.options يجب array');
    } else {
        const trues = ex.correctError.options.filter(o => o.correct === true).length;
        if (trues !== 1) {
            error('EX-CER-002', 'exercises.correctError.options',
                `correctError يجب بالضبط correct:true واحد — الآن: ${trues}`);
        }
    }
}

// ── rewrite ───────────────────────────────────────────────────────
if (ex.rewrite && typeof ex.rewrite === 'object') {
    if (typeof ex.rewrite.sentence !== 'string' || !ex.rewrite.sentence.includes('___')) {
        warn('EX-REW-001', 'exercises.rewrite.sentence',
            'rewrite.sentence لا تحتوي ___ — input لن يظهر');
    }
    if (!ex.rewrite.answer && ex.rewrite.answer !== 0) {
        warn('EX-REW-002', 'exercises.rewrite.answer',
            'rewrite.answer مفقود');
    }
}

// ── paragraph ─────────────────────────────────────────────────────
if (ex.paragraph && typeof ex.paragraph === 'object') {
    if (typeof ex.paragraph.sentence === 'string') {
        const blanks  = (ex.paragraph.sentence.match(/___/g) || []).length;
        const answers = Array.isArray(ex.paragraph.answers) ? ex.paragraph.answers.length : 0;
        if (blanks === 0) {
            warn('EX-PAR-001', 'exercises.paragraph.sentence',
                'paragraph.sentence لا تحتوي ___ — لا inputs ستظهر');
        } else if (blanks !== answers) {
            error('EX-PAR-002', 'exercises.paragraph',
                `paragraph: ${blanks} فراغ لكن ${answers} إجابة — يجب أن يتساووا`,
                'اجعل answers.length = عدد ___ في sentence');
        }
    } else {
        error('EX-PAR-003', 'exercises.paragraph.sentence',
            'paragraph.sentence يجب string');
    }
}

// ── challenge ─────────────────────────────────────────────────────
if (ex.challenge && typeof ex.challenge === 'object') {
    if (typeof ex.challenge.sentence === 'string') {
        const blanks  = (ex.challenge.sentence.match(/___/g) || []).length;
        const answers = Array.isArray(ex.challenge.answers) ? ex.challenge.answers.length : 0;
        if (blanks === 0) {
            warn('EX-CHL-001', 'exercises.challenge.sentence',
                'challenge.sentence لا تحتوي ___ — لا inputs ستظهر');
        } else if (blanks !== answers) {
            error('EX-CHL-002', 'exercises.challenge',
                `challenge: ${blanks} فراغ لكن ${answers} إجابة — يجب أن يتساووا`);
        }
    } else {
        error('EX-CHL-003', 'exercises.challenge.sentence',
            'challenge.sentence يجب string');
    }
}

// ── dialogueFill ──────────────────────────────────────────────────
if (ex.dialogueFill && Array.isArray(ex.dialogueFill.lines)) {
    ex.dialogueFill.lines.forEach((line, i) => {
        if (typeof line.text !== 'string') {
            error('EX-DFL-001', `exercises.dialogueFill.lines[${i}].text`,
                `dialogueFill.lines[${i}].text يجب string — يُسبب crash في .includes()`);
            return;
        }
        const count = (line.text.match(/___/g) || []).length;
        if (count === 0) {
            warn('EX-DFL-002', `exercises.dialogueFill.lines[${i}]`,
                `dialogueFill.lines[${i}] لا تحتوي ___ — input لن يظهر`);
        }
        if (count > 1) {
            warn('EX-DFL-003', `exercises.dialogueFill.lines[${i}]`,
                `dialogueFill.lines[${i}] تحتوي ${count} فراغات — فقط الأول يعمل`);
        }
    });
} else if (ex.dialogueFill && !Array.isArray(ex.dialogueFill.lines)) {
    error('EX-DFL-000', 'exercises.dialogueFill.lines',
        'dialogueFill.lines يجب array');
}

// ── multiStep ─────────────────────────────────────────────────────
if (ex.multiStep && typeof ex.multiStep === 'object') {
    const story = ex.multiStep.story;
    if (!story) {
        error('EX-MST-001', 'exercises.multiStep.story',
            'multiStep.story مفقود');
    } else if (typeof story !== 'object' || Array.isArray(story)) {
        error('EX-MST-002', 'exercises.multiStep.story',
            `multiStep.story يجب object {ar, zh} — الآن: ${typeof story}`,
            'اجعل story: { ar: "...", zh: "..." }');
    } else {
        if (!story.ar) warn('EX-MST-003', 'exercises.multiStep.story.ar', 'story.ar مفقود');
        if (!story.zh) warn('EX-MST-004', 'exercises.multiStep.story.zh', 'story.zh مفقود');
    }
    if (!Array.isArray(ex.multiStep.questions)) {
        error('EX-MST-005', 'exercises.multiStep.questions',
            'multiStep.questions يجب array');
    }
}

// ── listeningExercise ─────────────────────────────────────────────
if (ex.listeningExercise && typeof ex.listeningExercise === 'object') {
    if (!ex.listeningExercise.text) {
        warn('EX-LST-001', 'exercises.listeningExercise.text',
            'listeningExercise.text مفقود');
    }
    if (!Array.isArray(ex.listeningExercise.options)) {
        error('EX-LST-002', 'exercises.listeningExercise.options',
            'listeningExercise.options يجب array');
    } else {
        const trues = ex.listeningExercise.options.filter(o => o.correct === true).length;
        if (trues !== 1) {
            error('EX-LST-003', 'exercises.listeningExercise.options',
                `listeningExercise يجب بالضبط correct:true واحد — الآن: ${trues}`);
        }
    }
}

// ── visualChoice ──────────────────────────────────────────────────
if (ex.visualChoice && typeof ex.visualChoice === 'object') {
    if (!Array.isArray(ex.visualChoice.options)) {
        error('EX-VIS-001', 'exercises.visualChoice.options',
            'visualChoice.options يجب array');
    } else {
        const trues = ex.visualChoice.options.filter(o => o.correct === true).length;
        if (trues !== 1) {
            error('EX-VIS-002', 'exercises.visualChoice.options',
                `visualChoice يجب بالضبط correct:true واحد — الآن: ${trues}`);
        }
    }
}

// ── scenario ──────────────────────────────────────────────────────
if (ex.scenario && typeof ex.scenario === 'object') {
    if (!ex.scenario.question) {
        warn('EX-SCN-001', 'exercises.scenario.question',
            'scenario.question مفقود');
    }
    if (!Array.isArray(ex.scenario.options)) {
        error('EX-SCN-002', 'exercises.scenario.options',
            'scenario.options يجب array');
    } else {
        const trues = ex.scenario.options.filter(o => o.correct === true).length;
        if (trues !== 1) {
            error('EX-SCN-003', 'exercises.scenario.options',
                `scenario يجب بالضبط correct:true واحد — الآن: ${trues}`);
        }
    }
}

// ── patternFill ───────────────────────────────────────────────────
if (ex.patternFill && typeof ex.patternFill === 'object') {
    if (!Array.isArray(ex.patternFill.lines) || ex.patternFill.lines.length === 0) {
        error('EX-PTF-001', 'exercises.patternFill.lines',
            'patternFill.lines يجب array غير فارغة');
    }
}

// ── sentenceTransform ─────────────────────────────────────────────
if (ex.sentenceTransform && typeof ex.sentenceTransform === 'object') {
    if (typeof ex.sentenceTransform.sentence !== 'string') {
        error('EX-STR-001', 'exercises.sentenceTransform.sentence',
            'sentenceTransform.sentence يجب string');
    } else if (!ex.sentenceTransform.sentence.includes('data-answer')) {
        error('EX-STR-002', 'exercises.sentenceTransform.sentence',
            'sentenceTransform.sentence لا تحتوي data-answer — هل نسيت backtick syntax؟',
            'استخدم backtick `...` وليس "..." لـ sentence');
    }
}

// ── guidedWriting ─────────────────────────────────────────────────
if (ex.guidedWriting && typeof ex.guidedWriting === 'object') {
    if (!Array.isArray(ex.guidedWriting.sentences) || ex.guidedWriting.sentences.length === 0) {
        error('EX-GWR-001', 'exercises.guidedWriting.sentences',
            'guidedWriting.sentences يجب array غير فارغة');
    }
}

// ── contextAnalysis ───────────────────────────────────────────────
if (ex.contextAnalysis && typeof ex.contextAnalysis === 'object') {
    if (!ex.contextAnalysis.question) {
        warn('EX-CTX-001', 'exercises.contextAnalysis.question',
            'contextAnalysis.question مفقود');
    }
    if (!Array.isArray(ex.contextAnalysis.options)) {
        error('EX-CTX-002', 'exercises.contextAnalysis.options',
            'contextAnalysis.options يجب array');
    }
}

// ================================================================
// PHASE 5 — Semantic Quality
// ================================================================

// vocab emoji uniqueness
if (Array.isArray(data.vocab)) {
    const seen = new Map();
    data.vocab.forEach((v, i) => {
        if (Array.isArray(v.emoji)) {
            warn('SEM-001', `vocab[${i}].emoji`,
                `vocab[${i}].emoji يجب string وليس array`);
        }
        if (typeof v.emoji === 'string') {
            if (seen.has(v.emoji)) {
                info('SEM-002', `vocab[${i}].emoji`,
                    `emoji "${v.emoji}" مكرر (أُستخدم في vocab[${seen.get(v.emoji)}] أيضاً)`);
            } else {
                seen.set(v.emoji, i);
            }
        }
    });
}

// answer fields: تحذير إذا تحتوي تشكيل
const DIACRITICS = /[\u064B-\u0652\u0670]/;
const answerFields = [
    { val: ex.rewrite?.answer,           path: 'exercises.rewrite.answer' },
    ...(Array.isArray(ex.fillBlanks) ? ex.fillBlanks.map((f,i) => ({
        val: f.answer, path: `exercises.fillBlanks[${i}].answer`
    })) : []),
    ...(Array.isArray(ex.paragraph?.answers) ? ex.paragraph.answers.map((a,i) => ({
        val: a, path: `exercises.paragraph.answers[${i}]`
    })) : []),
    ...(Array.isArray(ex.challenge?.answers) ? ex.challenge.answers.map((a,i) => ({
        val: a, path: `exercises.challenge.answers[${i}]`
    })) : []),
    ...(Array.isArray(ex.dialogueFill?.lines) ? ex.dialogueFill.lines.map((l,i) => ({
        val: l.answer, path: `exercises.dialogueFill.lines[${i}].answer`
    })) : []),
];
answerFields.forEach(({ val, path: p }) => {
    if (typeof val === 'string' && DIACRITICS.test(val)) {
        info('SEM-010', p,
            `الإجابة "${val}" تحتوي تشكيل — checkFill يتجاهله تلقائياً لكن يُفضَّل حذفه`);
    }
});

// ================================================================
// PRINT RESULTS — Lesson Health Report
// ================================================================
function printResults() {
    const L = '═'.repeat(65);
    const l = '─'.repeat(65);

    // ── حساب ملخص الصحة ─────────────────────────────────────────

    // تمارين متأثرة (من الـ warnings و errors)
    const EX_KEYS = ['mcq','trueFalse','fillBlanks','dragWords','orderWords',
                     'correctError','rewrite','guidedWriting','listeningExercise',
                     'speedChallenge','multiStep','paragraph','contextAnalysis',
                     'scenario','dialogueFill','visualChoice','patternFill',
                     'sentenceTransform','challenge','selectWords','match'];
    const affectedEx = new Set();
    [...result.errors, ...result.warnings].forEach(item => {
        EX_KEYS.forEach(k => {
            if (item.path && item.path.includes(k)) affectedEx.add(k);
        });
    });
    const healthyEx   = EX_KEYS.length - affectedEx.size;
    const totalEx     = EX_KEYS.length;

    // مخاطر AI Generation
    const AI_RISK_CODES = ['SYN-001','SYN-002','SYN-003','SYN-005',
                           'EX-DRG-001','EX-DRG-002','EX-PAR-002',
                           'EX-CHL-002','EX-STR-002'];
    const aiRisks = [...result.errors, ...result.warnings]
        .filter(i => AI_RISK_CODES.includes(i.code));

    // حالة النشر
    const canPublish  = result.errors.length === 0;
    const publishIcon = canPublish ? '✅' : '⛔';
    const publishText = canPublish
        ? 'صالح للنشر'
        : `مرفوض — ${result.errors.length} خطأ يجب إصلاحه`;

    // ── Header ───────────────────────────────────────────────────
    console.log('\n' + L);
    console.log('  📋 LESSON HEALTH REPORT');
    console.log('  ' + path.basename(TARGET));
    console.log(L);

    // ── Health Summary ───────────────────────────────────────────
    console.log('');
    console.log('  ┌─ HEALTH SUMMARY ─────────────────────────────────────────┐');
    console.log(`  │  ${publishIcon}  حالة النشر    : ${publishText.padEnd(40)}│`);
    console.log(`  │  ❌  أخطاء حرجة   : ${String(result.errors.length).padEnd(3)} (تمنع النشر)                       │`);
    console.log(`  │  ⚠️   تحذيرات      : ${String(result.warnings.length).padEnd(3)} (تمارين مكسورة صامتة)              │`);
    console.log(`  │  ℹ️   ملاحظات جودة : ${String(result.infos.length).padEnd(3)} (لا تأثير على runtime)              │`);
    console.log(`  │  🎯  صحة التمارين : ${healthyEx}/${totalEx} تمرين سليم                         │`);
    console.log(`  │  🤖  مخاطر AI     : ${String(aiRisks.length).padEnd(3)} نمط خطأ مكتشف                     │`);
    console.log('  └──────────────────────────────────────────────────────────┘');
    console.log('');

    // ── إذا كل شيء سليم ─────────────────────────────────────────
    if (result.errors.length === 0 && result.warnings.length === 0 && result.infos.length === 0) {
        console.log('  🎉 الدرس ممتاز — لا توجد أي مشاكل');
        console.log('');
        console.log(L + '\n');
        return;
    }

    // ── CRITICAL Errors ──────────────────────────────────────────
    if (result.errors.length > 0) {
        console.log(l);
        console.log(`  🔴 CRITICAL — أخطاء تمنع النشر (${result.errors.length})`);
        console.log(l);
        result.errors.forEach(e => {
            console.log(`\n  ❌ ${e.message}`);
            console.log(`     المسار: ${e.path}`);
            console.log(`     الكود:  [${e.code}]`);
            if (e.fix) console.log(`     💡 الإصلاح: ${e.fix}`);
        });
        console.log('');
    }

    // ── Warnings ─────────────────────────────────────────────────
    if (result.warnings.length > 0) {
        console.log(l);
        console.log(`  🟡 WARNING — تمارين مكسورة صامتة (${result.warnings.length})`);
        console.log(l);
        result.warnings.forEach(w => {
            console.log(`\n  ⚠️  ${w.message}`);
            console.log(`     المسار: ${w.path}`);
            if (w.fix) console.log(`     💡 الإصلاح: ${w.fix}`);
        });
        console.log('');
    }

    // ── Quality Infos (مختصرة) ────────────────────────────────────
    if (result.infos.length > 0) {
        console.log(l);
        console.log(`  🟢 QUALITY — ملاحظات جودة (${result.infos.length})`);
        console.log(l);
        // نعرض أول 3 فقط — إذا أكثر نُلخّص
        const shown = result.infos.slice(0, 3);
        shown.forEach(n => {
            console.log(`  ℹ️  ${n.message}`);
        });
        if (result.infos.length > 3) {
            console.log(`  ... و ${result.infos.length - 3} ملاحظة أخرى (لا تؤثر على runtime)`);
        }
        console.log('');
    }

    // ── Exercise Health Detail ────────────────────────────────────
    if (affectedEx.size > 0) {
        console.log(l);
        console.log('  🎯 التمارين المتأثرة');
        console.log(l);
        affectedEx.forEach(ex => {
            const exErrors   = result.errors.filter(i => i.path && i.path.includes(ex)).length;
            const exWarnings = result.warnings.filter(i => i.path && i.path.includes(ex)).length;
            const icon = exErrors > 0 ? '❌' : '⚠️ ';
            console.log(`  ${icon} ${ex.padEnd(20)} ${exErrors > 0 ? exErrors + ' خطأ' : ''} ${exWarnings > 0 ? exWarnings + ' تحذير' : ''}`);
        });
        console.log('');
    }

    // ── AI Generation Risks ───────────────────────────────────────
    if (aiRisks.length > 0) {
        console.log(l);
        console.log('  🤖 مخاطر AI Generation المكتشفة');
        console.log(l);
        aiRisks.forEach(r => {
            console.log(`  ⚡ [${r.code}] ${r.message}`);
        });
        console.log('');
        console.log('  💡 هذه الأنماط تظهر عادةً من AI output مباشر');
        console.log('     شغّل: node sanitize_lesson.js لإصلاح ما يمكن إصلاحه تلقائياً');
        console.log('');
    }

    // ── Final Status ─────────────────────────────────────────────
    console.log(L);
    if (!canPublish) {
        console.log(`\n  ⛔ النتيجة النهائية: الدرس غير صالح للنشر`);
        console.log(`     أصلح ${result.errors.length} خطأ ثم أعِد التشغيل`);
    } else if (result.warnings.length > 0) {
        console.log(`\n  ✅ النتيجة النهائية: صالح للنشر مع ${result.warnings.length} تحذير`);
        console.log('     التحذيرات لا تمنع النشر لكن يُنصح بمراجعتها');
    } else {
        console.log('\n  ✅ النتيجة النهائية: الدرس صالح للنشر');
    }
    console.log('\n' + L + '\n');
}

printResults();
process.exit(result.errors.length > 0 ? 1 : 0);
