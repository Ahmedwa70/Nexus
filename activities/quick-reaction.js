let qrState = {};

function render(runtime, data) {
  const ac = document.getElementById('activity-container');
  const vocab = data.slice(0, 8);
  qrState = { vocab, round: 0, score: 0, current: null };
  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  ac.innerHTML = `
    <div class="activity-header">
      <div class="activity-heading">🏃 ردود فعل سريعة</div>
      <div class="activity-subheading">听声音，快速点击正确单词！</div>
    </div>
    <div class="glass-card">
      <div class="score-display" id="qr-score">💰 0</div>
      <div class="reaction-grid" id="qr-grid"></div>
      <div style="text-align:center;margin-top:16px">
        <button class="btn btn-primary" id="qr-play" onclick="playQRRound()">▶️ ابدأ الجولة</button>
      </div>
    </div>
  `;
  function playQRRound() {
    if (qrState.round >= 8) { runtime.complete(Math.round(qrState.score / 8 * 5)); return; }
    const vocab = qrState.vocab;
    const shuffled = [...vocab].sort(() => Math.random() - 0.5).slice(0, 4);
    const correct = shuffled[Math.floor(Math.random() * shuffled.length)];
    qrState.current = correct;
    document.getElementById('qr-play').style.display = 'none';
    document.getElementById('qr-grid').innerHTML = shuffled.map((w, i) => `
      <div class="reaction-cell" data-arabic="${escapeHtml(w.arabic)}" onclick="checkQR(this)">
        <div class="ar-text" style="font-size:calc(var(--ar-size)*0.7)">${escapeHtml(w.arabic)}</div>
      </div>
    `).join('');
    setTimeout(() => runtime.speak(correct.arabic), 300);
  }
  function checkQR(el, chosen) {
    if (chosen === undefined) chosen = el.dataset.arabic;
    const correct = qrState.current.arabic;
    const cells = document.querySelectorAll('.reaction-cell');
    cells.forEach(c => {
      if (c.dataset.arabic === chosen) c.classList.add(chosen === correct ? 'correct-react' : 'wrong-react');
      if (c.dataset.arabic === correct) c.classList.add('correct-react');
    });
    if (chosen === correct) { qrState.score++; runtime.reward(); }
    qrState.round++;
    setTimeout(() => { document.getElementById('qr-play').style.display = 'inline-flex'; document.getElementById('qr-grid').innerHTML = ''; }, 900);
  }
  window.playQRRound = playQRRound;
  window.checkQR = checkQR;
}

window.renderQuickReaction = render;
