let bgState = {};
let diceRolling = false;

function render(runtime, data) {
  const ac = document.getElementById('activity-container');
  bgState = { squares: data, position: 1, score: 0 };
  ac.innerHTML = `
    <div class="activity-header">
      <div class="activity-heading">🎲 لعبة اللوحة</div>
      <div class="activity-subheading">掷骰子，回答问题！</div>
    </div>
    <div class="glass-card">
      <div class="board-container">
        <div class="board-grid" id="board-grid"></div>
        <div id="bg-status" style="text-align:center;color:var(--text-secondary);font-family:'Noto Sans SC';margin:8px 0">当前位置: <strong id="bg-pos">1</strong></div>
        <button class="dice-btn" id="dice-btn" onclick="rollDice()">🎲</button>
      </div>
      <div id="bg-question" style="display:none;margin-top:16px" class="glass-card"></div>
    </div>
  `;
  function renderBoard() {
    const grid = document.getElementById('board-grid');
    if (!grid) return;
    const typeColors = { vocab: '#4c1d95', command: '#065f46', spelling: '#92400e', punctuation: '#1e3a5f', conjugation: '#7c2d12' };
    const squaresMap = {};
    bgState.squares.forEach(s => squaresMap[s.num] = s);
    grid.innerHTML = Array.from({length: 30}, (_, i) => {
      const n = i + 1;
      const sq = squaresMap[n];
      const isCurrent = n === bgState.position;
      return `<div class="board-square ${isCurrent ? 'current' : (n < bgState.position ? 'visited' : '')}" style="${sq ? `background:rgba(${hexToRgb(typeColors[sq.type] || '#1a1a2e')},0.3)` : ''}">
        ${n === 1 ? '🚀' : n === 30 ? '🏆' : n}
        ${sq ? `<span class="square-type">${{vocab:'📚',command:'🚦',spelling:'✏️',punctuation:'📝',conjugation:'🧗'}[sq.type] || '❓'}</span>` : ''}
      </div>`;
    }).join('');
  }
  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    return `${r},${g},${b}`;
  }
  function rollDice() {
    if (diceRolling) return;
    diceRolling = true;
    const btn = document.getElementById('dice-btn');
    btn.textContent = '🌀';
    setTimeout(() => {
      const roll = Math.floor(Math.random() * 6) + 1;
      btn.textContent = ['⚀','⚁','⚂','⚃','⚄','⚅'][roll - 1];
      bgState.position = Math.min(30, bgState.position + roll);
      document.getElementById('bg-pos').textContent = bgState.position;
      renderBoard();
      diceRolling = false;
      const sq = bgState.squares.find(s => s.num === bgState.position);
      if (sq) showBGQuestion(sq);
      if (bgState.position >= 30) setTimeout(() => runtime.complete(5), 800);
    }, 1000);
  }
  function showBGQuestion(sq) {
    const el = document.getElementById('bg-question');
    el.style.display = 'block';
    el.innerHTML = `
      <div class="ar-text" style="font-size:calc(var(--ar-size)*0.8);direction:rtl;margin-bottom:12px">${sq.question}</div>
      <input class="doctor-textarea" id="bg-answer" style="min-height:44px" placeholder="الجواب..." dir="rtl" />
      <div style="text-align:center;margin-top:10px">
        <button class="btn btn-primary" onclick="checkBGAnswer('${sq.answer}')">✅ تحقق</button>
      </div>
      <div id="bg-feedback" style="text-align:center;margin-top:8px"></div>
    `;
  }
  function checkBGAnswer(correct) {
    const val = document.getElementById('bg-answer').value.trim();
    const strip = s => s.replace(/[\u064B-\u065F]/g, '');
    const valNorm = strip(val);
    const correctNorm = strip(correct);
    const isCorrect = val && (
      valNorm === correctNorm ||
      correctNorm.split('/').some(c => valNorm === c)
    );
    document.getElementById('bg-feedback').textContent = isCorrect ? `✅ ${correct}` : `💡 ${correct}`;
    document.getElementById('bg-feedback').style.color = isCorrect ? 'var(--accent-emerald)' : 'var(--accent-amber)';
    if (isCorrect) runtime.reward();
    setTimeout(() => { document.getElementById('bg-question').style.display = 'none'; }, 1500);
  }
  renderBoard();
  window.rollDice = rollDice;
  window.checkBGAnswer = checkBGAnswer;
}

window.renderBoardGame = render;
