let srState = {};

function render(runtime, data) {
  const ac = document.getElementById('activity-container');
  const vocab = data;
  srState = { vocab, idx: 0, score: 0, charIdx: 0, interval: null };
  ac.innerHTML = `
    <div class="activity-header">
      <div class="activity-heading">⚡ كشف السرعة</div>
      <div class="activity-subheading">单词会逐字显示，尽快按下！</div>
    </div>
    <div class="glass-card">
      <div class="speed-display">
        <div class="speed-char" id="sr-display">?</div>
      </div>
      <div style="text-align:center;margin-bottom:20px;color:var(--text-secondary);font-family:'Noto Sans SC';font-size:14px">识别后按"我知道了"</div>
      <div style="text-align:center">
        <button class="btn btn-primary" id="sr-start" onclick="startSpeedReveal()">▶️ ابدأ</button>
        <button class="btn btn-outline" style="display:none" id="sr-know" onclick="speedKnow()">✅ عرفتُ!</button>
      </div>
      <div id="sr-result" style="text-align:center;margin-top:16px;font-size:20px;direction:rtl"></div>
    </div>
  `;
  function startSpeedReveal() {
    const vocab = srState.vocab;
    if (srState.idx >= vocab.length) { runtime.complete(5); return; }
    const word = vocab[srState.idx].arabic;
    srState.charIdx = 0;
    document.getElementById('sr-display').textContent = '';
    document.getElementById('sr-start').style.display = 'none';
    document.getElementById('sr-know').style.display = 'inline-flex';
    srState.interval = setInterval(() => {
      srState.charIdx++;
      document.getElementById('sr-display').textContent = word.substring(0, srState.charIdx);
      if (srState.charIdx >= word.length) {
        clearInterval(srState.interval);
        runtime.reward(0.3);
        srState.score++;
        runtime.speak(word);
        setTimeout(() => { srState.idx++; resetSR(); }, 1200);
      }
    }, 200);
  }
  function speedKnow() {
    clearInterval(srState.interval);
    const word = srState.vocab[srState.idx];
    document.getElementById('sr-display').textContent = word.arabic;
    document.getElementById('sr-result').textContent = word.chinese;
    runtime.reward(Math.max(0.5, (20 - srState.charIdx) / 10));
    srState.score++;
    runtime.speak(word.arabic);
    srState.idx++;
    setTimeout(resetSR, 1200);
  }
  function resetSR() {
    document.getElementById('sr-start').style.display = 'inline-flex';
    document.getElementById('sr-know').style.display = 'none';
    document.getElementById('sr-result').textContent = '';
    document.getElementById('sr-display').textContent = '?';
    if (srState.idx >= srState.vocab.length) runtime.complete(5);
  }
  window.startSpeedReveal = startSpeedReveal;
  window.speedKnow = speedKnow;
}

window.renderSpeedReveal = render;
