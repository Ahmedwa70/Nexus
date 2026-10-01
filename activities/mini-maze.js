let mazeState = {};

function render(runtime, data) {
  const ac = document.getElementById('activity-container');
  const grid = [
    [0,0,0,1,0],[1,1,0,1,0],[0,0,0,0,0],[0,1,1,1,0],[0,0,0,1,2]
  ];
  mazeState = { grid, player: {r:0,c:0}, goal: {r:4,c:4}, steps: 0, score: 0, questionQueue: [...data], answered: 0 };
  ac.innerHTML = `
    <div class="activity-header">
      <div class="activity-heading">🧭 متاهة صغيرة</div>
      <div class="activity-subheading">答对问题，找到出路！</div>
    </div>
    <div class="glass-card">
      <div class="maze-container">
        <div class="maze-grid" id="maze-grid" style="grid-template-columns:repeat(5,60px)"></div>
        <div style="display:flex;gap:8px;justify-content:center;margin-top:12px">
          <button class="btn btn-outline" onclick="moveMaze(-1,0)">⬆️</button>
        </div>
        <div style="display:flex;gap:8px;justify-content:center">
          <button class="btn btn-outline" onclick="moveMaze(0,-1)">⬅️</button>
          <button class="btn btn-outline" onclick="moveMaze(1,0)">⬇️</button>
          <button class="btn btn-outline" onclick="moveMaze(0,1)">➡️</button>
        </div>
      </div>
      <div id="maze-question" style="display:none;margin-top:16px" class="glass-card"></div>
    </div>
  `;
  function renderMazeGrid() {
    const { grid, player, goal } = mazeState;
    const g = document.getElementById('maze-grid');
    if (!g) return;
    g.innerHTML = grid.map((row, r) => row.map((cell, c) => {
      const isPlayer = r === player.r && c === player.c;
      const isGoal = r === goal.r && c === goal.c;
      const cls = cell === 1 ? 'cell-wall' : (isPlayer ? 'cell-player' : (isGoal ? 'cell-goal' : 'cell-path'));
      const icon = isPlayer ? '🧑' : (isGoal ? '🏆' : (cell === 1 ? '🧱' : ''));
      return `<div class="maze-cell ${cls}">${icon}</div>`;
    }).join('')).join('');
  }
  function moveMaze(dr, dc) {
    const { grid, player } = mazeState;
    const nr = player.r + dr, nc = player.c + dc;
    if (nr < 0 || nr >= 5 || nc < 0 || nc >= 5 || grid[nr][nc] === 1) return;
    if (mazeState.questionQueue.length > 0) {
      const q = mazeState.questionQueue[mazeState.answered % mazeState.questionQueue.length];
      showMazeQuestion(q, nr, nc);
    } else {
      doMazeMove(nr, nc);
    }
  }
  function showMazeQuestion(q, nr, nc) {
    const qEl = document.getElementById('maze-question');
    qEl.style.display = 'block';
    qEl.innerHTML = `
      <div class="ar-text" style="font-size:calc(var(--ar-size)*0.8);margin-bottom:12px;direction:rtl">${q.question}</div>
      <div class="tap-options" style="grid-template-columns:repeat(2,1fr)">${q.options.map((o,i)=>`<div class="tap-option" onclick="answerMaze(${i},${q.correct},${nr},${nc})">${o}</div>`).join('')}</div>
    `;
  }
  function answerMaze(chosen, correct, nr, nc) {
    const opts = document.querySelectorAll('#maze-question .tap-option');
    opts.forEach((o,i) => { if(i===correct) o.classList.add('correct'); else if(i===chosen) o.classList.add('wrong'); });
    if (chosen === correct) { runtime.reward(); doMazeMove(nr, nc); }
    mazeState.answered++;
    setTimeout(() => { document.getElementById('maze-question').style.display = 'none'; }, 1000);
  }
  function doMazeMove(nr, nc) {
    mazeState.player = { r: nr, c: nc };
    renderMazeGrid();
    if (nr === mazeState.goal.r && nc === mazeState.goal.c) {
      setTimeout(() => runtime.complete(5), 400);
    }
  }
  renderMazeGrid();
  window.moveMaze = moveMaze;
  window.answerMaze = answerMaze;
}

window.renderMiniMaze = render;
