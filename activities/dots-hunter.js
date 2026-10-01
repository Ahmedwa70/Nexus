let dhState = {};

function render(runtime, data) {
  const ac = document.getElementById('activity-container');
  dhState = { words: [...data], idx: 0, score: 0 };
  ac.innerHTML = `
    <div class="activity-header">
      <div class="activity-heading">💧 صائد النقاط</div>
      <div class="activity-subheading">ى 还是 ي？</div>
    </div>
    <div class="glass-card">
      <div class="progress-bar-wrap"><div class="progress-bar-fill" id="dh-prog" style="width:0%"></div></div>
      <div class="score-display" id="dh-score">💰 0</div>
      <div class="dots-word" id="dh-word"></div>
      <div class="dots-choices" id="dh-choices">
        <div class="dots-choice" onclick="checkDH('ي')">ي</div>
        <div class="dots-choice" onclick="checkDH('ى')">ى</div>
        <div class="dots-choice" onclick="checkDH('ة')">ة</div>
      </div>
      <div id="dh-feedback" style="text-align:center;margin-top:12px;font-size:18px;direction:rtl"></div>
    </div>
  `;
  function showDHWord() {
    if (dhState.idx >= dhState.words.length) { runtime.complete(Math.round(dhState.score / dhState.words.length * 5)); return; }
    const w = dhState.words[dhState.idx];
    document.getElementById('dh-prog').style.width = (dhState.idx / dhState.words.length * 100) + '%';
    document.getElementById('dh-word').innerHTML = `${w.base}<span style="color:var(--accent-amber)">___</span>`;
    document.getElementById('dh-feedback').textContent = '';
  }
  function checkDH(letter) {
    const w = dhState.words[dhState.idx];
    const correct = letter === w.correctLetter;
    document.getElementById('dh-feedback').textContent = correct ? `✅ ${w.fullWord} — ${w.reason}` : `💡 الصحيح: ${w.fullWord}`;
    document.getElementById('dh-feedback').style.color = correct ? 'var(--accent-emerald)' : 'var(--accent-amber)';
    if (correct) { dhState.score++; runtime.reward(); }
    runtime.speak(w.fullWord);
    dhState.idx++;
    setTimeout(showDHWord, 1200);
  }
  showDHWord();
  window.checkDH = checkDH;
}

window.renderDotsHunter = render;
