let memState = {};

function render(runtime, data) {
  const ac = document.getElementById('activity-container');
  const pairs = data.slice(0, 8);
  const allCards = [...pairs.map((p, i) => ({ ...p, id: i, type: 'emoji' })), ...pairs.map((p, i) => ({ ...p, id: i, type: 'word' }))];
  const shuffled = allCards.sort(() => Math.random() - 0.5);
  memState = { cards: shuffled, flipped: [], matched: new Set(), moves: 0, pairs: pairs.length };

  ac.innerHTML = `
    <div class="activity-header">
      <div class="activity-heading">🧠 بطاقات الذاكرة</div>
      <div class="activity-subheading">记忆卡片 — 找到配对！</div>
    </div>
    <div class="glass-card">
      <div style="display:flex;justify-content:space-between;margin-bottom:16px;direction:rtl">
        <div class="stat-badge">🎯 الأزواج: <span id="mem-pairs">0</span>/${pairs.length}</div>
        <div class="stat-badge">👆 المحاولات: <span id="mem-moves">0</span></div>
      </div>
      <div class="memory-grid" id="memory-grid"></div>
    </div>
  `;
  function buildMemoryGrid() {
    const grid = document.getElementById('memory-grid');
    if (!grid) return;
    grid.innerHTML = memState.cards.map((card, idx) => `
      <div class="memory-card" id="mc-${idx}" onclick="flipMemCard(${idx})">
        <div class="card-face card-front">🫙</div>
        <div class="card-face card-back">
          ${card.type === 'emoji'
            ? `<span style="font-size:30px">${card.emoji}</span>`
            : `<span class="ar-small">${card.arabic}</span><span class="zh-small">${card.chinese}</span>`}
        </div>
      </div>
    `).join('');
  }
  function flipMemCard(idx) {
    const { cards, flipped, matched } = memState;
    if (matched.has(idx) || flipped.length === 2 || flipped.includes(idx)) return;
    const el = document.getElementById(`mc-${idx}`);
    el.classList.add('flipped');
    flipped.push(idx);
    if (flipped.length === 2) {
      memState.moves++;
      document.getElementById('mem-moves').textContent = memState.moves;
      const [a, b] = flipped;
      if (cards[a].id === cards[b].id && cards[a].type !== cards[b].type) {
        matched.add(a); matched.add(b);
        document.getElementById('mc-' + a).classList.add('matched');
        document.getElementById('mc-' + b).classList.add('matched');
        document.getElementById('mem-pairs').textContent = matched.size / 2;
        memState.flipped = [];
        runtime.reward();
        if (matched.size === memState.cards.length) {
          setTimeout(() => runtime.complete(5), 500);
        }
      } else {
        setTimeout(() => {
          document.getElementById('mc-' + a)?.classList.remove('flipped');
          document.getElementById('mc-' + b)?.classList.remove('flipped');
          memState.flipped = [];
        }, 900);
      }
    }
  }
  buildMemoryGrid();
  window.flipMemCard = flipMemCard;
}

window.renderMemory = render;
