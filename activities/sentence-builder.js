let sbState = {};

function render(runtime, data) {
  const ac = document.getElementById('activity-container');
  sbState = { sentences: [...data], idx: 0, score: 0, built: [] };
  ac.innerHTML = `
    <div class="activity-header">
      <div class="activity-heading">✍️ بناء الجملة</div>
      <div class="activity-subheading">点击单词，排列句子！</div>
    </div>
    <div class="glass-card">
      <div class="score-display" id="sb-score">💰 0</div>
      <div id="sb-chinese" class="zh-text" style="text-align:center;font-size:18px;margin-bottom:16px"></div>
      <div class="sentence-target" id="sb-target">
        <span style="color:var(--text-secondary);font-size:14px;font-family:'Noto Sans SC'">点击单词放在这里...</span>
      </div>
      <div class="word-bank" id="sb-bank"></div>
      <div style="display:flex;gap:10px;justify-content:center;margin-top:16px">
        <button class="btn btn-outline" onclick="clearSB()">🗑️ مسح</button>
        <button class="btn btn-primary" onclick="checkSB()">✅ تحقق</button>
      </div>
      <div id="sb-note" class="zh-text" style="text-align:center;margin-top:12px;font-size:13px;color:var(--accent-amber)"></div>
    </div>
  `;
  function loadSBSentence() {
    if (sbState.idx >= sbState.sentences.length) { runtime.complete(Math.round(sbState.score / sbState.sentences.length * 5)); return; }
    const s = sbState.sentences[sbState.idx];
    sbState.built = [];
    const words = s.arabic.split(' ').sort(() => Math.random() - 0.5);
    sbState.shuffled = words;
    document.getElementById('sb-chinese').textContent = s.chinese;
    document.getElementById('sb-target').innerHTML = '<span style="color:var(--text-secondary);font-size:14px;font-family:\'Noto Sans SC\'">点击单词放在这里...</span>';
    document.getElementById('sb-bank').innerHTML = words.map((w, i) => `<div class="word-chip" id="sb-w-${i}" onclick="pickSBWord(${i}, '${w}')">${w}</div>`).join('');
    document.getElementById('sb-note').textContent = '';
  }
  function pickSBWord(idx, word) {
    const el = document.getElementById('sb-w-' + idx);
    if (el && el.classList.contains('placed')) return;
    sbState.built.push({ idx, word });
    if (el) el.classList.add('placed');
    const target = document.getElementById('sb-target');
    const placeholder = target.querySelector('span');
    if (placeholder) placeholder.remove();
    const chip = document.createElement('div');
    chip.className = 'word-chip placed';
    chip.textContent = word;
    chip.onclick = () => { sbState.built = sbState.built.filter(x => x.idx !== idx); const src = document.getElementById('sb-w-' + idx); if(src) src.classList.remove('placed'); chip.remove(); if(!target.children.length) target.innerHTML = '<span style="color:var(--text-secondary);font-size:14px;font-family:\'Noto Sans SC\'">点击单词放在这里...</span>'; };
    target.appendChild(chip);
  }
  function checkSB() {
    const s = sbState.sentences[sbState.idx];
    const correct = s.arabic.split(' ');
    const built = sbState.built.map(x => x.word);
    if (built.join(' ') === correct.join(' ') || built.join('') === correct.join('')) {
      sbState.score++;
      runtime.reward();
      document.getElementById('sb-note').textContent = '✅ ممتاز! 太棒了！';
      document.getElementById('sb-note').style.color = 'var(--accent-emerald)';
      setTimeout(() => { sbState.idx++; loadSBSentence(); }, 1200);
    } else {
      document.getElementById('sb-note').textContent = '💡 ' + s.grammarNote;
      document.getElementById('sb-note').style.color = 'var(--accent-amber)';
    }
  }
  function clearSB() { sbState.built = []; loadSBSentence(); }
  loadSBSentence();
  window.pickSBWord = pickSBWord;
  window.checkSB = checkSB;
  window.clearSB = clearSB;
}

window.renderSentenceBuilder = render;
