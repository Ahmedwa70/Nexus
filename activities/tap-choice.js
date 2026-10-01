let tqState = {};

function render(runtime, data) {
  const ac = document.getElementById('activity-container');
  tqState = { questions: [...data], idx: 0, score: 0 };
  ac.innerHTML = `
    <div class="activity-header">
      <div class="activity-heading">👆 اختيار سريع</div>
      <div class="activity-subheading">快速选择答案！</div>
    </div>
    <div class="glass-card">
      <div class="progress-bar-wrap"><div class="progress-bar-fill" id="tq-prog" style="width:0%"></div></div>
      <div class="score-display" id="tq-score">💰 0</div>
      <div id="tap-q" class="tap-question"></div>
      <div id="tap-opts" class="tap-options"></div>
    </div>
  `;
  function showTapQuestion() {
    const { questions, idx } = tqState;
    if (idx >= questions.length) { runtime.complete(Math.round(tqState.score / questions.length * 5)); return; }
    const q = questions[idx];
    document.getElementById('tq-prog').style.width = (idx / questions.length * 100) + '%';
    document.getElementById('tap-q').textContent = q.question;
    document.getElementById('tap-opts').innerHTML = q.options.map((o, i) => `
      <div class="tap-option" onclick="checkTap(${i})">${o}</div>
    `).join('');
    if (runtime.state.sound) runtime.speak(q.question);
  }
  function checkTap(chosen) {
    const q = tqState.questions[tqState.idx];
    const opts = document.querySelectorAll('.tap-option');
    opts.forEach((o, i) => {
      if (i === q.correct) o.classList.add('correct');
      else if (i === chosen) o.classList.add('wrong');
    });
    if (chosen === q.correct) { tqState.score++; runtime.reward(); }
    setTimeout(() => { tqState.idx++; showTapQuestion(); }, 1000);
  }
  showTapQuestion();
  window.checkTap = checkTap;
}

window.renderTapChoice = render;
