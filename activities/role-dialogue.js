// activities/role-dialogue.js — حوار الأدوار 🎭
// حوار قصير: يتكلّم الطرف الآخر، والطالب يختار الرد المناسب من ثلاثة.
// البيانات: LESSON_DATA.exercises.customRoleDialogue (انظر LESSON_SCHEMA.md).
// ============================================================
let rdState = {};

function render(runtime, data) {
  const ac = document.getElementById('activity-container');

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // ── 3) قراءة البيانات + التحقق من هيكل العنصر الواحد ──
  const validTurn = t =>
    t && typeof t.line === 'string' && t.line.trim() !== '' &&
    Array.isArray(t.options) && t.options.length >= 2 &&
    Number.isInteger(t.correct) && t.correct >= 0 && t.correct < t.options.length;

  const dialogues = (Array.isArray(data) ? data : []).filter(d =>
    d && Array.isArray(d.turns) && d.turns.filter(validTurn).length >= 3);

  if (!dialogues.length) {
    ac.innerHTML =
      '<div class="glass-card" style="text-align:center;padding:32px">' +
        '<div class="ar-text">لا تتوفر بيانات صالحة لهذا النشاط في هذا الدرس.</div>' +
      '</div>';
    return;
  }

  // تجميع الأدوار الصالحة من كل الحوارات في تسلسل واحد
  const turns = [];
  dialogues.forEach(d => {
    d.turns.filter(validTurn).forEach(t => turns.push({
      scene:   d.title   || '',
      partner: d.partner || 'صَدِيقُك',
      line:    t.line,
      zh:      t.zh || '',
      options: t.options,
      correct: t.correct
    }));
  });

  rdState = { turns, idx: 0, score: 0, opened: false };

  // ── 1) العرض في #activity-container فقط ──
  ac.innerHTML = `
    <div class="activity-header">
      <div class="activity-heading">🎭 حِوَارُ الأَدْوَار</div>
      <div class="activity-subheading">اختر الرَّدَّ المناسب!</div>
    </div>
    <div class="glass-card rd-wrap">
      <div class="progress-bar-wrap"><div class="progress-bar-fill" id="rd-prog" style="width:0%"></div></div>
      <div class="score-display" id="rd-score">💰 0</div>
      <div class="rd-scene" id="rd-scene"></div>
      <div class="rd-chat">
        <div class="rd-bubble" id="rd-bubble"></div>
      </div>
      <div class="rd-options" id="rd-opts"></div>
    </div>
  `;

  function showTurn() {
    const { turns, idx } = rdState;
    if (idx >= turns.length) { runtime.complete(Math.round(rdState.score / turns.length * 5)); return; }
    const t = turns[idx];
    document.getElementById('rd-prog').style.width = (idx / turns.length * 100) + '%';
    document.getElementById('rd-scene').textContent = t.scene;
    document.getElementById('rd-bubble').innerHTML = `
      <div class="rd-speaker">🎭 ${escapeHtml(t.partner)}</div>
      <div class="rd-line">${escapeHtml(t.line)}</div>
      ${t.zh ? `<div class="rd-zh">${escapeHtml(t.zh)}</div>` : ''}
    `;
    document.getElementById('rd-opts').innerHTML = t.options.map((o, i) => `
      <div class="rd-option" onclick="checkRd(${i})">${escapeHtml(o)}</div>
    `).join('');
    // النطق التلقائي يُفتح من الدور الثاني — عند فتح النشاط يبقى صامتاً
    if (rdState.opened && runtime.state.sound) runtime.speak(t.line);
    rdState.opened = true;
  }

  // ── 4) الإجابات: صحيحة → reward؛ خاطئة → بلا عقاب محركي ──
  function checkRd(chosen) {
    const t = rdState.turns[rdState.idx];
    const opts = document.querySelectorAll('.rd-option');
    opts.forEach((o, i) => {
      if (i === t.correct) o.classList.add('correct');
      else if (i === chosen) o.classList.add('wrong');
    });
    if (chosen === t.correct) {
      rdState.score++;
      document.getElementById('rd-score').textContent = '💰 ' + rdState.score;
      runtime.reward();
    }
    setTimeout(() => { rdState.idx++; showTurn(); }, 1200);
  }

  showTurn();
  window.checkRd = checkRd;
}

window.renderRoleDialogue = render;
