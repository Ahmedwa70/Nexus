function render(runtime, data) {
  const ac = document.getElementById('activity-container');
  const pairs = data;
  ac.innerHTML = `
    <div class="activity-header">
      <div class="activity-heading">🧗 سلّم التصريف</div>
      <div class="activity-subheading">填写现在时态！</div>
    </div>
    <div class="glass-card">
      <div class="ladder-container" id="ladder"></div>
      <div style="text-align:center;margin-top:16px">
        <button class="btn btn-primary" onclick="checkLadder()">✅ تحقق من الكل</button>
      </div>
      <div id="ladder-score" style="text-align:center;margin-top:12px;font-size:18px"></div>
    </div>
  `;
  const ladder = document.getElementById('ladder');
  ladder.innerHTML = pairs.map((p, i) => `
    <div class="ladder-step" id="ls-${i}">
      <span class="step-num">${i + 1}</span>
      <span class="step-past ar-text" style="font-size:calc(var(--ar-size)*0.8)">${p.past}</span>
      <span class="step-arrow">→</span>
      <input class="step-input" id="li-${i}" placeholder="المضارع..." autocomplete="off" dir="rtl" />
    </div>
  `).join('');
  function checkLadder() {
    let correct = 0;
    pairs.forEach((p, i) => {
      const input = document.getElementById('li-' + i);
      const step = document.getElementById('ls-' + i);
      const val = input.value.trim();
      if (val === p.present || val.replace(/[\u064B-\u065F]/g, '') === p.present.replace(/[\u064B-\u065F]/g, '')) {
        step.classList.add('completed'); step.classList.remove('active'); correct++; runtime.reward();
      } else {
        step.classList.add('active'); step.classList.remove('completed');
        input.value = ''; input.placeholder = p.present;
      }
    });
    document.getElementById('ladder-score').textContent = `${correct}/${pairs.length} ✅`;
    document.getElementById('ladder-score').style.color = correct === pairs.length ? 'var(--accent-emerald)' : 'var(--accent-amber)';
    if (correct === pairs.length) setTimeout(() => runtime.complete(5), 600);
  }
  window.checkLadder = checkLadder;
}

window.renderConjugationLadder = render;
