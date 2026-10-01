let swState = {};

function render(runtime, data) {
  const ac = document.getElementById('activity-container');
  const sentences = data.map(s => ({ ...s, correct: s.correct === true }));
  swState = { items: sentences, idx: 0, score: 0 };
  ac.innerHTML = `
    <div class="activity-header">
      <div class="activity-heading">↔️ تمرير الصح/الخطأ</div>
      <div class="activity-subheading">向右划=正确，向左划=错误</div>
    </div>
    <div class="glass-card">
      <div class="score-display" id="sw-score">💰 0</div>
      <div class="swipe-card-container" id="sw-container"></div>
      <div class="swipe-instructions">
        <span class="swipe-left">👈 خطأ</span>
        <span>اسحب البطاقة</span>
        <span class="swipe-right">صح 👉</span>
      </div>
    </div>
  `;
  function loadSwCard() {
    const container = document.getElementById('sw-container');
    if (!container) return;
    if (swState.idx >= swState.items.length) { runtime.complete(Math.round(swState.score / swState.items.length * 5)); return; }
    const item = swState.items[swState.idx];
    container.innerHTML = `
      <div class="swipe-card" id="sw-card">
        <div class="ar-text" style="text-align:center">${item.arabic}</div>
        <div class="zh-text" style="text-align:center">${item.chinese}</div>
      </div>
    `;
    const card = document.getElementById('sw-card');
    let startX = 0, dx = 0, dragging = false;
    card.addEventListener('mousedown', e => { startX = e.clientX; dragging = true; });
    card.addEventListener('mousemove', e => { if (!dragging) return; dx = e.clientX - startX; card.style.transform = `translateX(${dx}px) rotate(${dx*0.05}deg)`; card.style.opacity = 1 - Math.abs(dx)/300; });
    card.addEventListener('mouseup', () => { dragging = false; finishSwipe(dx); });
    card.addEventListener('touchstart', e => { startX = e.touches[0].clientX; dragging = true; });
    card.addEventListener('touchmove', e => { if (!dragging) return; dx = e.touches[0].clientX - startX; card.style.transform = `translateX(${dx}px) rotate(${dx*0.05}deg)`; });
    card.addEventListener('touchend', () => { dragging = false; finishSwipe(dx); });
  }
  function finishSwipe(dx) {
    if (Math.abs(dx) < 60) { const card = document.getElementById('sw-card'); if (card) { card.style.transform = ''; card.style.opacity = 1; } return; }
    const isRight = dx > 0;
    const item = swState.items[swState.idx];
    const correct = (isRight && item.correct) || (!isRight && !item.correct);
    swState.idx++;
    if (correct) { swState.score++; runtime.reward(); }
    setTimeout(loadSwCard, 200);
  }
  loadSwCard();
}

window.renderSwipeQuiz = render;
