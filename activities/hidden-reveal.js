let hrState = {};

function render(runtime, data) {
  const ac = document.getElementById('activity-container');
  hrState = { items: [...data], idx: 0, hintsShown: 0 };
  ac.innerHTML = `
    <div class="activity-header">
      <div class="activity-heading">🔦 الكشف المخفي</div>
      <div class="activity-subheading">猜猜这是什么？</div>
    </div>
    <div class="glass-card">
      <div class="reveal-container">
        <div id="hr-emoji" class="reveal-emoji"></div>
      </div>
      <div id="hr-hints" style="text-align:center;margin-bottom:16px"></div>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
        <button class="btn btn-outline" onclick="showHint()">💡 تلميح</button>
        <button class="btn btn-primary" onclick="revealHR()">👁️ اكشف</button>
        <button class="btn btn-outline" onclick="nextHR()">⏭️ التالي</button>
      </div>
      <div id="hr-result" style="display:none;text-align:center;margin-top:16px">
        <div class="ar-text" id="hr-word" style="font-size:calc(var(--ar-size)*1.2);text-align:center"></div>
        <div class="zh-text" id="hr-zh" style="text-align:center"></div>
      </div>
    </div>
  `;
  function loadHRItem() {
    if (hrState.idx >= hrState.items.length) { runtime.complete(5); return; }
    const item = hrState.items[hrState.idx];
    hrState.hintsShown = 0;
    document.getElementById('hr-emoji').textContent = item.coveredImage;
    document.getElementById('hr-emoji').classList.remove('revealed');
    document.getElementById('hr-hints').innerHTML = '';
    document.getElementById('hr-result').style.display = 'none';
  }
  function showHint() {
    const item = hrState.items[hrState.idx];
    if (hrState.hintsShown >= item.hints.length) return;
    const hint = item.hints[hrState.hintsShown++];
    const hintsEl = document.getElementById('hr-hints');
    hintsEl.innerHTML += `<span class="hint-chip">💡 ${hint}</span>`;
  }
  function revealHR() {
    const item = hrState.items[hrState.idx];
    document.getElementById('hr-emoji').classList.add('revealed');
    document.getElementById('hr-result').style.display = 'block';
    document.getElementById('hr-word').textContent = item.word;
    document.getElementById('hr-zh').textContent = item.chinese;
    runtime.speak(item.word);
    runtime.reward();
  }
  function nextHR() {
    hrState.idx++;
    loadHRItem();
  }
  loadHRItem();
  window.showHint = showHint;
  window.revealHR = revealHR;
  window.nextHR = nextHR;
}

window.renderHiddenReveal = render;
