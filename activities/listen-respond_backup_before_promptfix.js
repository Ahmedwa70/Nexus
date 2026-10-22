// activities/listen-respond.js — اِسْمَعْ وَأَجِبْ 🎙️
// مقياس استماع: يضغط الطالب 🔊 فيسمع السؤال ويظهر نصه، ثم يختار الرد المناسب.
// البيانات: LESSON_DATA.exercises.customListenRespond (انظر LESSON_SCHEMA.md).
// ============================================================
let lrState = {};

function render(runtime, data) {
  const ac = document.getElementById('activity-container');

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // ── قراءة البيانات + التحقق من هيكل العنصر الواحد ──
  const validItem = it =>
    it && typeof it.prompt === 'string' && it.prompt.trim() !== '' &&
    Array.isArray(it.options) && it.options.length >= 2 &&
    Number.isInteger(it.correct) && it.correct >= 0 && it.correct < it.options.length;

  const rounds = (Array.isArray(data) ? data : []).filter(r =>
    r && Array.isArray(r.items) && r.items.filter(validItem).length >= 3);

  if (!rounds.length) {
    ac.innerHTML =
      '<div class="glass-card" style="text-align:center;padding:32px">' +
        '<div class="ar-text">لا تتوفر بيانات صالحة لهذا النشاط في هذا الدرس.</div>' +
      '</div>';
    return;
  }

  // تجميع الأسئلة الصالحة من كل الجولات في تسلسل واحد
  const items = [];
  rounds.forEach(r => {
    r.items.filter(validItem).forEach(it => items.push({
      scene:   r.title || '',
      prompt:  it.prompt,
      zh:      it.zh || '',
      options: it.options,
      correct: it.correct
    }));
  });

  lrState = { items, idx: 0, score: 0, opened: false };

  // ── العرض في #activity-container فقط ──
  ac.innerHTML = `
    <div class="activity-header">
      <div class="activity-heading">🎙️ اِسْمَعْ وَأَجِبْ</div>
      <div class="activity-subheading">听一听，选择正确的回答！</div>
    </div>
    <div class="glass-card lr-wrap">
      <div class="lr-statusbar">
        <div class="lr-qnum" id="lr-qnum"></div>
        <div class="progress-bar-wrap"><div class="progress-bar-fill" id="lr-prog" style="width:0%"></div></div>
        <div class="score-display" id="lr-score">💰 0</div>
      </div>
      <div class="lr-scene" id="lr-scene"></div>
      <div class="lr-listen">
        <button class="lr-play" id="lr-play" onclick="playLr()">🔊 اِسْتَمِعْ</button>
        <div class="lr-prompt" id="lr-prompt"><span class="lr-hint">اضغط السَّمَّاعة لتسمع السُّؤال</span></div>
      </div>
      <div class="lr-options" id="lr-opts"></div>
    </div>
  `;

  function showItem() {
    const { items, idx } = lrState;
    if (idx >= items.length) { runtime.complete(Math.round(lrState.score / items.length * 5)); return; }
    const t = items[idx];
    document.getElementById('lr-prog').style.width = (idx / items.length * 100) + '%';
    document.getElementById('lr-qnum').textContent = 'السؤال ' + (idx + 1) + ' مِنْ ' + items.length;
    document.getElementById('lr-scene').textContent = t.scene;
    document.getElementById('lr-prompt').innerHTML = '<span class="lr-hint">اضغط السَّمَّاعة لتسمع السُّؤال</span>';
    document.getElementById('lr-opts').innerHTML = t.options.map((o, i) => `
      <div class="lr-option" onclick="checkLr(${i})">${escapeHtml(o)}</div>
    `).join('');
    // النطق التلقائي يُفتح من السؤال الثاني — عند فتح النشاط يبقى صامتاً
    if (lrState.opened && runtime.state.sound) runtime.speak(t.prompt);
    lrState.opened = true;
  }

  // ── النطق عند الطلب فقط: 🔊 تكشف النص وتنطق في كل ضغطة ──
  function playLr() {
    const t = lrState.items[lrState.idx];
    if (!t) return;
    document.getElementById('lr-prompt').innerHTML = `
      <div class="lr-line">${escapeHtml(t.prompt)}</div>
      ${t.zh ? `<div class="lr-zh">${escapeHtml(t.zh)}</div>` : ''}
    `;
    if (runtime.state.sound) runtime.speak(t.prompt);
  }

  // ── الإجابات: صحيحة → reward؛ خاطئة → بلا عقاب محركي ──
  function checkLr(chosen) {
    const t = lrState.items[lrState.idx];
    const opts = document.querySelectorAll('.lr-option');
    opts.forEach((o, i) => {
      if (i === t.correct) o.classList.add('correct');
      else if (i === chosen) o.classList.add('wrong');
    });
    if (chosen === t.correct) {
      lrState.score++;
      document.getElementById('lr-score').textContent = '💰 ' + lrState.score;
      runtime.reward();
    }
    setTimeout(() => { lrState.idx++; showItem(); }, 1200);
  }

  showItem();
  window.checkLr = checkLr;
  window.playLr = playLr;
}

window.renderListenRespond = render;
