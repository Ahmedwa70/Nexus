function render(runtime, data) {
  const ac = document.getElementById('activity-container');
  const vocab = data || [];
  if (!vocab.length) {
    ac.innerHTML = '<div class="activity-header"><div class="activity-heading">💡 غرفة مظلمة</div></div><div class="glass-card"><p style="text-align:center;color:var(--text-secondary)">لا توجد كلمات</p></div>';
    return;
  }
  let wordIdx = 0;
  const revealedWords = new Set();
  let revealed = false;
  let expandInterval = null;

  function getAr(i) { var v = vocab[i]; return v.arabic || v.ar || ''; }
  function getZh(i) { var v = vocab[i]; return v.chinese || v.zh || ''; }

  ac.innerHTML = `
    <div class="activity-header">
      <div class="activity-heading">💡 غرفة مظلمة</div>
      <div class="activity-subheading">移动鼠标/手指，发现隐藏单词！</div>
    </div>
    <div class="glass-card" style="padding:12px">
      <div class="dr-scene" id="dr-scene">
        <div class="dr-word" id="dr-word">${getAr(0)}</div>
        <div class="dr-overlay" id="dr-overlay"></div>
      </div>
      <div style="text-align:center;margin-top:14px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
        <button class="btn btn-outline" onclick="drNext(-1)">⬅️</button>
        <button class="btn btn-primary" onclick="drSpeak()">🔊 استمع</button>
        <button class="btn btn-outline" onclick="drNext(1)">➡️</button>
        <button class="btn btn-success" onclick="drFinish()">✅ انتهيت</button>
      </div>
      <div id="dr-chinese" class="zh-text" style="text-align:center;margin-top:8px">${getZh(0)}</div>
    </div>
  `;

  const scene = document.getElementById('dr-scene');
  const overlay = document.getElementById('dr-overlay');
  const wordEl = document.getElementById('dr-word');

  function updateOverlay(e) {
    const rect = scene.getBoundingClientRect();
    let mx, my;
    if (e.touches) {
      mx = ((e.touches[0].clientX - rect.left) / rect.width) * 100;
      my = ((e.touches[0].clientY - rect.top) / rect.height) * 100;
    } else {
      mx = ((e.clientX - rect.left) / rect.width) * 100;
      my = ((e.clientY - rect.top) / rect.height) * 100;
    }
    overlay.style.setProperty('--mx', mx + '%');
    overlay.style.setProperty('--my', my + '%');
    overlay.classList.add('active');
  }

  function resetOverlay() {
    if (revealed) return;
    overlay.classList.remove('active');
  }

  function handleClick(e) {
    e.preventDefault();
    if (revealed) return;
    revealed = true;
    revealedWords.add(wordIdx);
    runtime.speak(getAr(wordIdx));
    if (revealedWords.size >= vocab.length) {
      setTimeout(function() { runtime.complete(5); }, 800);
    }
    if (expandInterval) clearInterval(expandInterval);
    var maxDim = Math.max(scene.offsetWidth, scene.offsetHeight) * 1.6;
    expandInterval = setInterval(function() {
      var r = parseFloat(overlay.style.getPropertyValue('--spot-radius') || '30');
      r = Math.min(r + 35, maxDim);
      overlay.style.setProperty('--spot-radius', r + 'px');
      if (r >= maxDim) {
        clearInterval(expandInterval);
        expandInterval = null;
      }
    }, 16);
  }

  scene.addEventListener('click',      handleClick);
  scene.addEventListener('touchstart', handleClick, { passive: false });
  scene.addEventListener('mousemove',  updateOverlay);
  scene.addEventListener('touchmove',  updateOverlay, { passive: true });
  scene.addEventListener('mouseleave', resetOverlay);
  scene.addEventListener('touchend',   resetOverlay);

  const hintEl = document.createElement('div');
  hintEl.style.cssText = 'position:absolute;bottom:8px;left:50%;transform:translateX(-50%);color:rgba(255,210,80,0.85);font-size:13px;font-family:"Noto Sans SC",sans-serif;pointer-events:none;animation:hint-pulse 2s ease-in-out infinite;z-index:3';
  hintEl.textContent = '点击显示 / اضغط للكشف';
  scene.style.position = 'relative';
  scene.appendChild(hintEl);

  function cleanup() {
    if (expandInterval) { clearInterval(expandInterval); expandInterval = null; }
    scene.removeEventListener('mousemove',  updateOverlay);
    scene.removeEventListener('touchmove',  updateOverlay);
    scene.removeEventListener('mouseleave', resetOverlay);
    scene.removeEventListener('touchend',   resetOverlay);
    scene.removeEventListener('click',      handleClick);
    scene.removeEventListener('touchstart', handleClick);
  }
  window.drCleanup = cleanup;

  window.drNext = function(dir) {
    revealed = false;
    wordIdx = (wordIdx + dir + vocab.length) % vocab.length;
    wordEl.textContent = getAr(wordIdx);
    document.getElementById('dr-chinese').textContent = getZh(wordIdx);
    overlay.classList.remove('active');
    overlay.style.setProperty('--spot-radius', '100px');
  };
  window.drSpeak = function() { runtime.speak(getAr(wordIdx)); };
  window.drFinish = function() { runtime.complete(Math.max(1, Math.round(revealedWords.size / vocab.length * 5))); };

}

window.renderDarkRoom = render;