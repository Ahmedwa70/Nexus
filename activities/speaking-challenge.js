// activities/speaking-challenge.js — تَحَدَّثْ مِثْلِي 🗣️
// تحدٍّ شفهي يقوده المعلم أمام الصف: يضغط 🔊 فيسمع الطالب النموذج،
// يتلوه صوتياً، ويقيّمه المعلم يدوياً ✔ / ✖.
// البيانات: LESSON_DATA.exercises.customSpeakingChallenge (انظر LESSON_SCHEMA.md).
// ============================================================
let scState = {};

function render(runtime, data) {
  const ac = document.getElementById('activity-container');

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // ── قراءة البيانات + التحقق من هيكل العنصر الواحد ──
  const validItem = it =>
    it && typeof it.prompt === 'string' && it.prompt.trim() !== '';

  const rounds = (Array.isArray(data) ? data : []).filter(r =>
    r && Array.isArray(r.items) && r.items.filter(validItem).length >= 3);

  if (!rounds.length) {
    ac.innerHTML =
      '<div class="glass-card" style="text-align:center;padding:32px">' +
        '<div class="ar-text">لا تتوفر بيانات صالحة لهذا النشاط في هذا الدرس.</div>' +
      '</div>';
    return;
  }

  // تجميع العناصر الصالحة من كل الجولات في تسلسل واحد
  const items = [];
  rounds.forEach(r => {
    r.items.filter(validItem).forEach(it => items.push({
      scene:   r.title || '',
      prompt:  it.prompt,
      zh:      it.zh || '',
      hint:    it.hint || ''
    }));
  });

  scState = { items, idx: 0, score: 0 };

  // ── العرض في #activity-container فقط ──
  ac.innerHTML = `
    <div class="activity-header">
      <div class="activity-heading">🗣️ تَحَدَّثْ مِثْلِي</div>
      <div class="activity-subheading">听一听，说一说！</div>
    </div>
    <div class="glass-card sc-wrap">
      <div class="sc-statusbar">
        <div class="sc-qnum" id="sc-qnum"></div>
        <div class="progress-bar-wrap"><div class="progress-bar-fill" id="sc-prog" style="width:0%"></div></div>
        <div class="score-display" id="sc-score">💰 0</div>
      </div>
      <div class="sc-scene" id="sc-scene"></div>
      <div class="sc-card">
        <button class="sc-play" id="sc-play" onclick="playSc()">🔊 اِسْتَمِعْ</button>
        <div class="sc-prompt" id="sc-prompt"><span class="sc-hint-label">اضغط السَّمَّاعة لتسمع النَّمُوذَج</span></div>
        <button class="sc-hint-btn" id="sc-hint-btn" onclick="revealScHint()">💡 أحتاج تلميحاً</button>
        <div class="sc-hint" id="sc-hint" style="display:none"></div>
      </div>
      <div class="sc-judge">
        <div class="sc-judge-label">قيِّم تلو الطالب:</div>
        <button class="sc-btn sc-btn-ok" onclick="judgeSc(true)">✔ أَحْسَنْتَ</button>
        <button class="sc-btn sc-btn-no" onclick="judgeSc(false)">✖ أعِدْ مَرَّةً أُخْرَى</button>
      </div>
    </div>
  `;

  function showItem() {
    const { items, idx } = scState;
    if (idx >= items.length) { runtime.complete(Math.round(scState.score / items.length * 5)); return; }
    const t = items[idx];
    document.getElementById('sc-prog').style.width = (idx / items.length * 100) + '%';
    document.getElementById('sc-qnum').textContent = 'الجُمْلَة ' + (idx + 1) + ' مِنْ ' + items.length;
    document.getElementById('sc-scene').textContent = t.scene;
    document.getElementById('sc-prompt').innerHTML = '<span class="sc-hint-label">اضغط السَّمَّاعة لتسمع النَّمُوذَج</span>';
    const hintBtn = document.getElementById('sc-hint-btn');
    const hintBox = document.getElementById('sc-hint');
    hintBox.style.display = 'none';
    hintBox.innerHTML = '';
    hintBtn.style.display = t.hint ? '' : 'none';
    // الفتح صامت — النطق عند الطلب فقط
  }

  // ── النطق عند الطلب فقط: 🔊 تكشف النص وتنطق في كل ضغطة ──
  function playSc() {
    const t = scState.items[scState.idx];
    if (!t) return;
    document.getElementById('sc-prompt').innerHTML = `
      <div class="sc-line">${escapeHtml(t.prompt)}</div>
      ${t.zh ? `<div class="sc-zh">${escapeHtml(t.zh)}</div>` : ''}
    `;
    if (runtime.state.sound) runtime.speak(t.prompt);
  }

  // ── الدعم التدريجي: 💡 يكشف التلميح (يدوي من المعلم) ──
  function revealScHint() {
    const t = scState.items[scState.idx];
    if (!t || !t.hint) return;
    const hintBox = document.getElementById('sc-hint');
    hintBox.innerHTML = '💡 ' + escapeHtml(t.hint);
    hintBox.style.display = '';
  }

  // ── التقييم اليدوي: ✔ يمنح نقطة، ✖ يتقدم بلا نقطة — بلا عقاب محركي ──
  function judgeSc(passed) {
    const t = scState.items[scState.idx];
    if (!t) return;
    if (passed) {
      scState.score++;
      document.getElementById('sc-score').textContent = '💰 ' + scState.score;
      runtime.reward();
    }
    setTimeout(() => { scState.idx++; showItem(); }, 900);
  }

  showItem();
  window.playSc = playSc;
  window.revealScHint = revealScHint;
  window.judgeSc = judgeSc;
}

window.renderSpeakingChallenge = render;
