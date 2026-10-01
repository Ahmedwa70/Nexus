let wiState = {};

function render(runtime, data) {
  const ac = document.getElementById('activity-container');
  const items = data;
  wiState = { items, idx: 0, hintIdx: 0, score: 0 };
  ac.innerHTML = `
    <div class="activity-header">
      <div class="activity-heading">🎭 مَن أنا؟</div>
      <div class="activity-subheading">根据提示猜单词！</div>
    </div>
    <div class="glass-card">
      <div class="hint-box" id="wi-hints"></div>
      <input id="wi-input" placeholder="اكتب تخمينك..." class="doctor-textarea" style="min-height:54px;direction:rtl;margin-bottom:12px" />
      <div style="display:flex;gap:10px;justify-content:center">
        <button class="btn btn-outline" onclick="nextWIHint()">💡 تلميح آخر</button>
        <button class="btn btn-primary" onclick="checkWI()">✅ تخمين</button>
      </div>
      <div id="wi-feedback" style="text-align:center;margin-top:12px;font-size:18px"></div>
    </div>
  `;
  function loadWIItem() {
    if (wiState.idx >= wiState.items.length) { runtime.complete(Math.round(wiState.score / wiState.items.length * 5)); return; }
    wiState.hintIdx = 0;
    document.getElementById('wi-hints').innerHTML = `<div class="hint-chip">💡 ${wiState.items[wiState.idx].hints[0]}</div>`;
    document.getElementById('wi-input').value = '';
    document.getElementById('wi-feedback').textContent = '';
  }
  function nextWIHint() {
    const item = wiState.items[wiState.idx];
    if (wiState.hintIdx < item.hints.length - 1) {
      wiState.hintIdx++;
      document.getElementById('wi-hints').innerHTML += `<div class="hint-chip">💡 ${item.hints[wiState.hintIdx]}</div>`;
    }
  }
  function checkWI() {
    const item = wiState.items[wiState.idx];
    const input = document.getElementById('wi-input').value.trim();
    const correct = input && (item.word.includes(input) || input.includes(item.word.substring(0, 3)));
    document.getElementById('wi-feedback').textContent = correct ? `✅ ${item.word} — ${item.chinese}` : `💡 الجواب: ${item.word}`;
    document.getElementById('wi-feedback').style.color = correct ? 'var(--accent-emerald)' : 'var(--accent-amber)';
    if (correct) { wiState.score++; runtime.reward(); }
    runtime.speak(item.word);
    setTimeout(() => { wiState.idx++; loadWIItem(); }, 1500);
  }
  loadWIItem();
  window.nextWIHint = nextWIHint;
  window.checkWI = checkWI;
}

window.renderWhoAmI = render;
