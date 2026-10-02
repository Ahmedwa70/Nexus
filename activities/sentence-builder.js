// ============================================================
// sentence-builder.js — بناء الجملة
// البيانات: [{ arabic, chinese }] — يُجهّزها محوّل 'sentence-builder' في
// bridge.js: يقطّع سطور الحوار المركّبة، ويجرّدها من الترقيم، وينتقي ما طوله
// ٣–٦ كلمات، ويرتّبها تصاعدياً. فالبطاقات تصل هنا نظيفة ومتدرّجة.
//
// الخلط: Fisher–Yates لا sort(() => Math.random() - 0.5). الأخيرة منحازة
// بشدّة — قياساً على جملة من خمس كلمات تُعيد الترتيب الأصلي ٩.٤٪ من المرّات
// بدل ٠.٨٣٪، وتُبقي الكلمة الأولى في موضعها ١.٦ ضعف ما ينبغي، فيجتاز الطالب
// التمرين بالضغط من اليمين إلى اليسار بلا تفكير.
//
// التغذية الراجعة عند الخطأ: محسوبة من المحرّك (كم كلمة في موضعها الصحيح).
// كان الحقل grammarNote يُعرض وهو فارغ دائماً، فلا يرى المخطئ إلا «💡».
//
// وكان صندوق الملاحظة نفسه مصنّفاً zh-text، و‍.zh-text مخفيّ افتراضياً
// (display:none ما لم يُضَف show) والصفحة تبدأ بـ html.hide-zh — فالملاحظة
// لم تكن تظهر في أي حالة. أُخرج الصندوق من نظام الصينية: تغذية راجعة
// بيداغوجية يجب أن يراها الطالب دائماً. أمّا المطالبة الصينية #sb-chinese
// فتبقى تحت زرّ «中» بيد المعلّم، مع إضافة show لتظهر فعلاً عند تشغيله.
// ============================================================

let sbState = {};

// خلط عادل، مع ضمان ألّا تظهر الجملة مرتَّبة سلفاً (ما لم تكن كلمة واحدة)
function sbShuffle(words) {
  const a = words.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

function sbShuffleDistinct(words) {
  if (words.length < 2) return words.slice();
  const original = words.join(' ');
  let out;
  for (let tries = 0; tries < 12; tries++) {
    out = sbShuffle(words);
    if (out.join(' ') !== original) return out;
  }
  // جملة كل كلماتها متطابقة: لا ترتيب مختلف ممكن
  return out;
}

// صيغة العدد مع المعدود «كلمة» — الرسالة تُعرض أمام طلاب لغة، فالخطأ النحوي
// فيها يُعلّم خطأً. العربية: ١ مفرد · ٢ مثنّى · ٣–١٠ جمع · ١١+ مفرد منصوب.
function sbCountPhrase(n) {
  if (n === 0) return 'لا كلمة';
  if (n === 1) return 'كلمة واحدة';
  if (n === 2) return 'كلمتان';
  if (n <= 10) return n + ' كلمات';
  return n + ' كلمة';
}

function render(runtime, data) {
  const ac = document.getElementById('activity-container');
  sbState = { sentences: [...data], idx: 0, score: 0, built: [] };
  ac.innerHTML = `
    <div class="activity-header">
      <div class="activity-heading">✍️ بناء الجملة</div>
      <div class="activity-subheading">点击单词，排列句子！</div>
    </div>
    <div class="glass-card">
      <div class="score-display" id="sb-score">💰 0</div>
      <div id="sb-chinese" class="zh-text show" style="text-align:center;font-size:18px;margin-bottom:16px"></div>
      <div class="sentence-target" id="sb-target">
        <span style="color:var(--text-secondary);font-size:14px;font-family:'Noto Sans SC'">点击单词放在这里...</span>
      </div>
      <div class="word-bank" id="sb-bank"></div>
      <div style="display:flex;gap:10px;justify-content:center;margin-top:16px">
        <button class="btn btn-outline" onclick="clearSB()">🗑️ مسح</button>
        <button class="btn btn-primary" onclick="checkSB()">✅ تحقق</button>
      </div>
      <div id="sb-note" style="text-align:center;margin-top:12px;font-size:15px;color:var(--accent-amber);min-height:22px"></div>
    </div>
  `;

  const PLACEHOLDER = '<span style="color:var(--text-secondary);font-size:14px;font-family:\'Noto Sans SC\'">点击单词放在这里...</span>';

  function targetEl() { return document.getElementById('sb-target'); }

  function resetTarget() {
    sbState.built = [];
    targetEl().innerHTML = PLACEHOLDER;
    document.querySelectorAll('#sb-bank .word-chip.placed')
      .forEach(function (el) { el.classList.remove('placed'); });
  }

  // البطاقات تُبنى بـ createElement لا بسلسلة HTML: الكلمة مولَّدة آلياً، وحقنها
  // داخل onclick="...'${w}'..." يكسر الصفحة إن حوت ' أو \ أو <.
  function buildBank() {
    const bank = document.getElementById('sb-bank');
    bank.innerHTML = '';
    sbState.shuffled.forEach(function (w, i) {
      const chip = document.createElement('div');
      chip.className = 'word-chip';
      chip.id = 'sb-w-' + i;
      chip.textContent = w;
      chip.addEventListener('click', function () { pickSBWord(i, w); });
      bank.appendChild(chip);
    });
  }

  function loadSBSentence() {
    if (sbState.idx >= sbState.sentences.length) {
      // القسمة على صفر لو وصل الحوار فارغاً تُنتج NaN وتكسر شريط النتيجة
      const total = sbState.sentences.length;
      runtime.complete(total ? Math.round(sbState.score / total * 5) : 0);
      return;
    }
    const s = sbState.sentences[sbState.idx];
    sbState.built = [];
    sbState.shuffled = sbShuffleDistinct(s.arabic.split(' ').filter(Boolean));
    document.getElementById('sb-chinese').textContent = s.chinese || '';
    targetEl().innerHTML = PLACEHOLDER;
    buildBank();
    document.getElementById('sb-note').textContent = '';
  }

  function pickSBWord(idx, word) {
    const el = document.getElementById('sb-w-' + idx);
    if (el && el.classList.contains('placed')) return;
    sbState.built.push({ idx: idx, word: word });
    if (el) el.classList.add('placed');
    const target = targetEl();
    const placeholder = target.querySelector('span');
    if (placeholder) placeholder.remove();
    const chip = document.createElement('div');
    chip.className = 'word-chip placed';
    chip.textContent = word;
    chip.addEventListener('click', function () {
      sbState.built = sbState.built.filter(function (x) { return x.idx !== idx; });
      const src = document.getElementById('sb-w-' + idx);
      if (src) src.classList.remove('placed');
      chip.remove();
      if (!target.children.length) target.innerHTML = PLACEHOLDER;
    });
    target.appendChild(chip);
  }

  // كم كلمة استقرّت في موضعها الصحيح — تغذية راجعة تدلّ الطالب على قُربه
  // من الجواب دون أن تكشفه.
  function placedCorrectly(built, correct) {
    let hits = 0;
    for (let i = 0; i < built.length && i < correct.length; i++) {
      if (built[i] === correct[i]) hits++;
    }
    return hits;
  }

  function checkSB() {
    const s = sbState.sentences[sbState.idx];
    const correct = s.arabic.split(' ').filter(Boolean);
    const built = sbState.built.map(function (x) { return x.word; });
    const note = document.getElementById('sb-note');

    if (built.join(' ') === correct.join(' ')) {
      sbState.score++;
      runtime.reward();
      runtime.speak(s.arabic);
      document.getElementById('sb-score').textContent = '💰 ' + sbState.score;
      note.textContent = '✅ ممتاز! 太棒了！';
      note.style.color = 'var(--accent-emerald)';
      setTimeout(function () { sbState.idx++; loadSBSentence(); }, 1200);
      return;
    }

    note.style.color = 'var(--accent-amber)';
    if (built.length < correct.length) {
      const left = correct.length - built.length;
      note.textContent = '💡 بقيت ' + sbCountPhrase(left) + ' · 还差 ' + left + ' 个词';
    } else {
      const hits = placedCorrectly(built, correct);
      const place = hits === 2 ? 'في موضعهما الصحيح'
                  : hits >= 3 ? 'في مواضعها الصحيحة'
                  : 'في موضعها الصحيح';
      note.textContent = '💡 ' + sbCountPhrase(hits) + ' ' + place +
                         ' · 位置正确 ' + hits + '/' + correct.length;
    }
  }

  // إفراغ منطقة الإجابة فقط — لا إعادة خلط. الطالب الذي يريد تصحيح ترتيبه
  // كان يُفاجأ ببطاقات بترتيب جديد كلياً.
  function clearSB() {
    resetTarget();
    document.getElementById('sb-note').textContent = '';
  }

  loadSBSentence();
  window.pickSBWord = pickSBWord;
  window.checkSB = checkSB;
  window.clearSB = clearSB;
}

window.renderSentenceBuilder = render;
