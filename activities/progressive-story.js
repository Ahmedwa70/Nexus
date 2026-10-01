function render(runtime, data) {
  const ac = document.getElementById('activity-container');
  const dialogue = data;
  let idx = 0;
  ac.innerHTML = `
    <div class="activity-header">
      <div class="activity-heading">📖 قصة تدريجية</div>
      <div class="activity-subheading">逐步阅读，回答问题！</div>
    </div>
    <div class="glass-card">
      <div id="ps-content"></div>
      <div style="text-align:center;margin-top:16px">
        <button class="btn btn-primary" id="ps-next" onclick="nextStoryStep()">📖 اقرأ التالي</button>
      </div>
    </div>
  `;

  function addParagraph() {
    if (idx >= dialogue.length) { runtime.complete(5); return; }
    const content = document.getElementById('ps-content');
    const d = dialogue[idx];
    const p = document.createElement('div');
    p.className = 'story-paragraph';
    p.innerHTML = `<strong style="color:var(--accent-purple)">${d.speaker}:</strong> <span class="ar-text" style="display:inline;font-size:calc(var(--ar-size)*0.85)">${d.text}</span><span class="zh-text">${d.chinese}</span>`;
    content.appendChild(p);
    if (runtime.state.sound) runtime.speak(d.text);
    idx++;
  }

  window.nextStoryStep = function() {
    for (let i = 0; i < 2 && idx < dialogue.length; i++) addParagraph();
    if (idx >= dialogue.length) document.getElementById('ps-next').textContent = '🏆 انتهى';
  };
  addParagraph();
}

window.renderProgressiveStory = render;
