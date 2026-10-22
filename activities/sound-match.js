let smState = {};

function render(runtime, data) {
  const ac = document.getElementById('activity-container');
  smState = { questions: [...data], idx: 0, score: 0 };
  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  ac.innerHTML = `
    <div class="activity-header">
      <div class="activity-heading">🔊 تطابق الصوت</div>
      <div class="activity-subheading">听音选择！</div>
    </div>
    <div class="glass-card">
      <div class="score-display" id="sm-score">💰 0</div>
      <button class="sound-btn" id="sm-play" onclick="playCurrentSound()">🔊</button>
      <p style="text-align:center;color:var(--text-secondary);margin-bottom:20px;font-family:'Noto Sans SC';font-size:14px">点击喇叭听读音，然后选择</p>
      <div id="sm-opts" class="sound-options"></div>
    </div>
  `;
  function showSoundQuestion() {
    const { questions, idx } = smState;
    if (idx >= questions.length) { runtime.complete(Math.round(smState.score / questions.length * 5)); return; }
    const q = questions[idx];
    document.getElementById('sm-opts').innerHTML = q.options.map((o, i) => `
      <div class="sound-option" onclick="checkSound(${i})">
        <span class="option-emoji">${escapeHtml(o.split(' ')[0])}</span>
        ${escapeHtml(o.split(' ').slice(1).join(' '))}
      </div>
    `).join('');
    // التشغيل التلقائي يستأنف بعد السؤال الأول — عند فتح النشاط يبقى صامتاً
    if (smState.opened) setTimeout(() => playCurrentSound(), 400);
    smState.opened = true;
  }
  function playCurrentSound() {
    const q = smState.questions[smState.idx];
    if (q) runtime.speak(q.audioText);
  }
  function checkSound(chosen) {
    const q = smState.questions[smState.idx];
    const opts = document.querySelectorAll('.sound-option');
    opts.forEach((o, i) => {
      o.style.borderColor = i === q.correct ? 'var(--accent-emerald)' : (i === chosen ? 'var(--accent-amber)' : '');
      o.style.background = i === q.correct ? 'rgba(52,211,153,0.1)' : '';
    });
    if (chosen === q.correct) { smState.score++; runtime.reward(); }
    setTimeout(() => { smState.idx++; showSoundQuestion(); }, 1000);
  }
  showSoundQuestion();
  window.playCurrentSound = playCurrentSound;
  window.checkSound = checkSound;
}

window.renderSoundMatch = render;
