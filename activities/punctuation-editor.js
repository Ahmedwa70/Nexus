let peState = {};

function render(runtime, data) {
  const ac = document.getElementById('activity-container');
  peState = { sentences: [...data], idx: 0, score: 0 };
  ac.innerHTML = `
    <div class="activity-header">
      <div class="activity-heading">✏️ المحرر الصحفي</div>
      <div class="activity-subheading">选择正确的标点符号！</div>
    </div>
    <div class="glass-card">
      <div class="progress-bar-wrap"><div class="progress-bar-fill" id="pe-prog" style="width:0%"></div></div>
      <div class="score-display" id="pe-score">💰 0</div>
      <div id="pe-sentence" class="punct-sentence"></div>
      <div id="pe-choices" class="punct-choices">
        ${['.',',','؟','!','،','؛'].map(m=>`<button class="punct-btn" onclick="checkPE('${m}')">${m}</button>`).join('')}
      </div>
      <div id="pe-feedback" style="text-align:center;margin-top:12px;font-size:18px"></div>
    </div>
  `;
  function showPESentence() {
    if (peState.idx >= peState.sentences.length) { runtime.complete(Math.round(peState.score / peState.sentences.length * 5)); return; }
    const s = peState.sentences[peState.idx];
    document.getElementById('pe-prog').style.width = (peState.idx / peState.sentences.length * 100) + '%';
    document.getElementById('pe-sentence').innerHTML = `${s.text}<span class="punct-blank"></span>`;
    document.getElementById('pe-feedback').textContent = '';
  }
  function checkPE(mark) {
    const s = peState.sentences[peState.idx];
    const correct = mark === s.correctMark;
    document.getElementById('pe-feedback').textContent = correct ? `✅ ${s.correctMark}` : `💡 الصحيح: ${s.correctMark}`;
    document.getElementById('pe-feedback').style.color = correct ? 'var(--accent-emerald)' : 'var(--accent-amber)';
    document.querySelector('.punct-blank').textContent = s.correctMark;
    if (correct) { peState.score++; runtime.reward(); }
    peState.idx++;
    setTimeout(showPESentence, 1000);
  }
  showPESentence();
  window.checkPE = checkPE;
}

window.renderPunctuationEditor = render;
