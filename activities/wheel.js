let wheelSpinning = false;
let _wheelVocab;

function render(runtime, data) {
  const ac = document.getElementById('activity-container');
  const vocab = _wheelVocab = data.slice(0, 12);
  ac.innerHTML = `
    <div class="activity-header">
      <div class="activity-heading">🎰 عجلة الحظ</div>
      <div class="activity-subheading">点击转动，说出单词！</div>
    </div>
    <div class="glass-card" style="text-align:center">
      <div class="wheel-pointer">▼</div>
      <canvas id="wheel-canvas" width="340" height="340"></canvas>
      <br>
      <button class="btn btn-primary" style="margin-top:16px" onclick="spinWheel()">🎰 أدِّر العجلة</button>
    </div>
    <div id="wheel-result" style="display:none" class="glass-card wheel-result">
      <div id="wheel-word" class="ar-text" style="font-size:calc(var(--ar-size)*1.4);text-align:center"></div>
      <div id="wheel-chinese" class="zh-text" style="text-align:center"></div>
      <div id="wheel-emoji" style="font-size:50px;text-align:center;margin:12px 0"></div>
      <p style="color:var(--text-secondary);font-family:'Noto Sans SC';font-size:14px;margin-bottom:12px">用这个单词说一句话！/ اصنع جملة بهذه الكلمة!</p>
      <button class="btn btn-primary" onclick="spinWheel()">🔄 دوِّر مرة أخرى</button>
    </div>
  `;
  drawWheel(vocab);
  function spinWheel() {
    if (wheelSpinning) return;
    wheelSpinning = true;
    const canvas = document.getElementById('wheel-canvas');
    const vocab = _wheelVocab;
    const N = vocab.length;
    const currentRot = parseFloat(canvas.dataset.rotation || '0');
    const spins = 5 + Math.random() * 5;
    const extra = Math.random() * 360;
    const totalDeg = spins * 360 + extra;
    const duration = 3500;
    const start = performance.now();

    function animate(now) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - t, 4);
      const rot = currentRot + totalDeg * ease;
      canvas.style.transform = `rotate(${rot}deg)`;
      if (t < 1) { requestAnimationFrame(animate); return; }

      canvas.dataset.rotation = rot % 360;
      wheelSpinning = false;
      const finalDeg = ((rot % 360) + 360) % 360;
      const sectorAngle = 360 / N;
      const idx = Math.floor(((360 - finalDeg) % 360) / sectorAngle) % N;
      const picked = vocab[idx];

      const result = document.getElementById('wheel-result');
      result.style.display = 'block';
      document.getElementById('wheel-word').textContent = picked.arabic;
      document.getElementById('wheel-chinese').textContent = picked.chinese;
      document.getElementById('wheel-emoji').textContent = picked.emoji || '✨';
      runtime.speak(picked.arabic);
      runtime.reward();
    }
    requestAnimationFrame(animate);
  }
  window.spinWheel = spinWheel;
}

function drawWheel(vocab) {
  const canvas = document.getElementById('wheel-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const N = vocab.length;
  const angle = (2 * Math.PI) / N;
  const colors = ['#4c1d95','#1e40af','#065f46','#92400e','#7c2d12','#1e3a5f','#2d1b69','#0c4a6e','#064e3b','#451a03','#1a1a2e','#0a0a1a'];

  ctx.clearRect(0, 0, 340, 340);
  const cx = 170, cy = 170, r = 155;

  for (let i = 0; i < N; i++) {
    const start = angle * i - Math.PI / 2;
    const end = start + angle;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, end);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(start + angle / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = 'white';
    ctx.font = `bold ${Math.min(16, 180 / N)}px Noto Sans Arabic`;
    ctx.fillText(vocab[i].arabic, r - 14, 5);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(cx, cy, 22, 0, 2 * Math.PI);
  ctx.fillStyle = '#a78bfa';
  ctx.fill();
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 3;
  ctx.stroke();

  canvas.dataset.rotation = canvas.dataset.rotation || '0';
}

window.renderWheel = render;
