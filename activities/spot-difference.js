function render(runtime, data) {
  const ac = document.getElementById('activity-container');
  const pairs = data;
  let idx = 0, score = 0;
  ac.innerHTML = `
    <div class="activity-header">
      <div class="activity-heading">🔍 ابحث عن الفرق</div>
      <div class="activity-subheading">找出两句话的不同之处！</div>
    </div>
    <div class="glass-card" id="sd-card"></div>
  `;

  function loadPair() {
    if (idx >= pairs.length) { runtime.complete(Math.round(score/pairs.length*5)); return; }
    const p = pairs[idx];
    const card = document.getElementById('sd-card');
    card.innerHTML = `
      <div class="zh-text" style="text-align:center;margin-bottom:14px;font-size:15px">点击不同的词 / انقر على الكلمة المختلفة</div>
      <div class="spot-pair">
        <div class="spot-sentence" onclick="spotClick(0)">${p.sentenceA}</div>
        <div class="spot-sentence" onclick="spotClick(1)">${p.sentenceB}</div>
      </div>
      <div id="sd-feedback" style="text-align:center;margin-top:12px;font-size:18px;direction:rtl"></div>
      <div style="text-align:center;margin-top:12px">
        <button class="btn btn-outline" onclick="nextSD()">⏭️ التالي</button>
      </div>
    `;
    window.spotClick = function(which) {
      const feedback = document.getElementById('sd-feedback');
      feedback.textContent = `💡 الفرق: "${p.keyword}"`;
      feedback.style.color = 'var(--accent-amber)';
      runtime.reward(); score++;
    };
    window.nextSD = function() { idx++; loadPair(); };
  }
  loadPair();
}

window.renderSpotDifference = render;
