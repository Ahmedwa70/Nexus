// ============================================================
// wheel.js — عجلة الحظ
// البيانات: [{ arabic, chinese, emoji }]  — يُجهّزها محوّل 'wheel' في bridge.js
// عدد القطاعات = طول المصفوفة الواردة (يحكمه config.limit في activity.js).
// ============================================================

let wheelSpinning = false;
let _wheelVocab;
let _wheelResize = null;

const WHEEL_FONT = '"Noto Sans Arabic", sans-serif';
const WHEEL_COLORS = [
  '#4c1d95', '#1e40af', '#065f46', '#92400e', '#7c2d12', '#1e3a5f',
  '#2d1b69', '#0c4a6e', '#064e3b', '#451a03', '#1a1a2e', '#0a0a1a'
];

// ── المقاس: يُشتق من المساحة المتاحة، لا رقم ثابت ──────────────
// 340px ثابتة كانت تشغل 17.7% من شاشة 1920 — غير صالحة للعرض الصفّي.
function wheelSize(canvas) {
  const host = canvas.parentElement;
  const byWidth = host ? host.clientWidth - 56 : 340;
  const byHeight = window.innerHeight * 0.56;   // نترك مكاناً للعنوان والزر وبطاقة النتيجة
  return Math.round(Math.max(280, Math.min(byWidth, byHeight, 680)));
}

// ── حجم خط واحد يتّسع له أطول نص: الاتساق أهم من تكبير كلمة ──
function fitFontSize(ctx, labels, radius, n, padOuter, hubRadius) {
  const arc = (2 * Math.PI * radius) / n;          // سُمك القطاع عند المحيط
  const maxWidth = radius - padOuter - hubRadius - 8;
  let size = Math.max(12, Math.min(radius * 0.135, arc * 0.55, 34));
  for (;;) {
    ctx.font = 'bold ' + size + 'px ' + WHEEL_FONT;
    let widest = 0;
    for (let i = 0; i < labels.length; i++) {
      const w = ctx.measureText(labels[i]).width;
      if (w > widest) widest = w;
    }
    if (widest <= maxWidth || size <= 11) return size;
    size -= 1;
  }
}

function drawWheel(vocab) {
  const canvas = document.getElementById('wheel-canvas');
  if (!canvas) return;
  const n = vocab.length;
  if (!n) return;

  // لوحة بدقّة الشاشة: بلا هذا يظهر النص مشوّشاً على الشاشات عالية الكثافة
  const size = wheelSize(canvas);
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(size * dpr);
  canvas.height = Math.round(size * dpr);
  canvas.style.width = size + 'px';
  canvas.style.height = size + 'px';

  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 8;
  const hubR = Math.max(16, r * 0.14);
  const padOuter = Math.max(10, r * 0.09);
  const angle = (2 * Math.PI) / n;

  const labels = vocab.map(function (v) { return v.arabic || ''; });
  const fontSize = fitFontSize(ctx, labels, r, n, padOuter, hubR);

  for (let i = 0; i < n; i++) {
    const start = angle * i - Math.PI / 2;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, start + angle);
    ctx.closePath();
    ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // ── النص ──
    // كان يدور مع القطاع دائماً، فينقلب رأساً على عقب في النصف الأيسر.
    // الحل: إن وقع منتصف القطاع في النصف الأيسر، ندور نصف دورة إضافية
    // ونعكس محاذاة النص ليبقى الطرف الخارجي هو البداية.
    const mid = start + angle / 2;
    const norm = ((mid % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const flip = norm > Math.PI / 2 && norm < 3 * Math.PI / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(flip ? mid + Math.PI : mid);
    ctx.font = 'bold ' + fontSize + 'px ' + WHEEL_FONT;
    ctx.fillStyle = 'white';
    ctx.textAlign = flip ? 'left' : 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(labels[i], flip ? -(r - padOuter) : (r - padOuter), 0);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(cx, cy, hubR, 0, 2 * Math.PI);
  ctx.fillStyle = '#a78bfa';
  ctx.fill();
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 3;
  ctx.stroke();

  canvas.dataset.rotation = canvas.dataset.rotation || '0';
}

function render(runtime, data) {
  const ac = document.getElementById('activity-container');
  // بلا اقتطاع هنا: العدد يحدّده config.limit في activity.js عبر bridge.js.
  // الاقتطاع المزدوج كان يجعل limit إعداداً كاذباً.
  const vocab = _wheelVocab = data;

  ac.innerHTML = `
    <div class="activity-header">
      <div class="activity-heading">🎰 عجلة الحظ</div>
      <div class="activity-subheading">点击转动，说出单词！</div>
    </div>
    <div class="glass-card" style="text-align:center">
      <div class="wheel-pointer">▼</div>
      <canvas id="wheel-canvas"></canvas>
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

  // إعادة الرسم عند تغيّر المقاس — ومعها تنظيف المستمع عند مغادرة النشاط
  if (_wheelResize) window.removeEventListener('resize', _wheelResize);
  _wheelResize = function () {
    if (!document.getElementById('wheel-canvas')) {
      window.removeEventListener('resize', _wheelResize);
      _wheelResize = null;
      return;
    }
    drawWheel(_wheelVocab);
  };
  window.addEventListener('resize', _wheelResize);

  function spinWheel() {
    if (wheelSpinning) return;
    const canvas = document.getElementById('wheel-canvas');
    if (!canvas) return;
    const items = _wheelVocab;
    const n = items.length;
    if (!n) return;

    wheelSpinning = true;
    const currentRot = parseFloat(canvas.dataset.rotation || '0');
    const totalDeg = (5 + Math.random() * 5) * 360 + Math.random() * 360;
    const duration = 3500;
    const start = performance.now();

    function animate(now) {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 4);
      const rot = currentRot + totalDeg * ease;
      canvas.style.transform = `rotate(${rot}deg)`;
      if (t < 1) { requestAnimationFrame(animate); return; }

      canvas.dataset.rotation = rot % 360;
      wheelSpinning = false;
      const finalDeg = ((rot % 360) + 360) % 360;
      const sectorAngle = 360 / n;
      const idx = Math.floor(((360 - finalDeg) % 360) / sectorAngle) % n;
      const picked = items[idx];

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

window.renderWheel = render;
