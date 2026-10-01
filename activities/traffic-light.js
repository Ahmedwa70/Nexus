let tlState = {};

function render(runtime, data) {
  const ac = document.getElementById('activity-container');
  tlState = { commands: [...data], idx: 0, score: 0 };
  ac.innerHTML = `
    <div class="activity-header">
      <div class="activity-heading">🚦 إشارة الأمر والنهي</div>
      <div class="activity-subheading">绿=命令，红=禁止</div>
    </div>
    <div class="glass-card">
      <div class="score-display" id="tl-score">💰 0</div>
      <div class="progress-bar-wrap"><div class="progress-bar-fill" id="tl-prog" style="width:0%"></div></div>
      <div class="traffic-sentence" id="tl-sentence"></div>
      <div class="traffic-light-display">
        <button class="traffic-btn traffic-btn-green" onclick="checkTL('command')">🟢 أمر</button>
        <button class="traffic-btn traffic-btn-red" onclick="checkTL('negative')">🔴 نهي</button>
      </div>
      <div id="tl-feedback" style="text-align:center;color:var(--text-chinese);font-family:'Noto Sans SC';font-size:14px;margin-top:8px"></div>
    </div>
  `;
  function showTLSentence() {
    if (tlState.idx >= tlState.commands.length) { runtime.complete(Math.round(tlState.score / tlState.commands.length * 5)); return; }
    const cmd = tlState.commands[tlState.idx];
    document.getElementById('tl-sentence').textContent = cmd.arabic;
    document.getElementById('tl-prog').style.width = (tlState.idx / tlState.commands.length * 100) + '%';
    document.getElementById('tl-feedback').textContent = '';
    if (runtime.state.sound) runtime.speak(cmd.arabic);
  }
  function checkTL(chosen) {
    const cmd = tlState.commands[tlState.idx];
    const correct = cmd.type === chosen;
    document.getElementById('tl-feedback').textContent = correct ? '✅ ' + cmd.chinese : '💡 ' + cmd.chinese;
    document.getElementById('tl-feedback').style.color = correct ? 'var(--accent-emerald)' : 'var(--accent-amber)';
    if (correct) { tlState.score++; runtime.reward(); }
    tlState.idx++;
    setTimeout(showTLSentence, 900);
  }
  showTLSentence();
  window.checkTL = checkTL;
}

window.renderTrafficLight = render;
