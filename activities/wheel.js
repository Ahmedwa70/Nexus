// ============================================================
// wheel.js — عجلة الحظ
// البيانات: [{ arabic, chinese, emoji }]  — يُجهّزها محوّل 'wheel' في bridge.js
// عدد القطاعات = طول المصفوفة الواردة (يحكمه config.limit في activity.js).
//
// مبدأ العرض: الدوران يُطبَّق داخل اللوحة (ctx.rotate) لا على عنصرها (CSS
// transform). لولا ذلك لدار النصّ مع العجلة وانقلب رأساً على عقب. ولأن
// الدوران صار داخلياً، تُرسم الكلمات أفقيةً دائماً مهما دارت العجلة.
// ============================================================

let wheelSpinning = false;
let _wheelVocab;
let _wheelLayout = null;
let _wheelResize = null;

const WHEEL_FONT = '"Noto Sans Arabic", sans-serif';
const WHEEL_MAX_LINES = 3;
const WHEEL_COLORS = [
  '#4c1d95', '#1e40af', '#065f46', '#92400e', '#7c2d12', '#1e3a5f',
  '#2d1b69', '#0c4a6e', '#064e3b', '#451a03', '#1a1a2e', '#0a0a1a'
];

// ── المقاس: يُشتق من المساحة المتاحة، لا رقم ثابت ──────────────
function wheelSize(canvas) {
  const host = canvas.parentElement;
  const byWidth = host ? host.clientWidth - 56 : 340;
  const byHeight = window.innerHeight * 0.56;   // نترك مكاناً للعنوان والزر وبطاقة النتيجة
  return Math.round(Math.max(280, Math.min(byWidth, byHeight, 680)));
}

// ── تقسيم النص إلى سطور تتّسع في عرض الوتد ─────────────────────
// بلا تقسيم يفرض أطولُ عبارة خطاً صغيراً على كل الكلمات.
function wrapLabel(ctx, text, maxWidth) {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return [''];
  const lines = [];
  let line = words[0];
  for (let i = 1; i < words.length; i++) {
    const candidate = line + ' ' + words[i];
    if (ctx.measureText(candidate).width <= maxWidth) line = candidate;
    else { lines.push(line); line = words[i]; }
  }
  lines.push(line);
  return lines;
}

// ── حجم خط واحد لكل القطاعات: الاتساق أهم من تكبير كلمة ───────
function layoutLabels(ctx, labels, maxWidth) {
  for (let size = 40; size >= 9; size--) {
    ctx.font = 'bold ' + size + 'px ' + WHEEL_FONT;
    const wrapped = labels.map(function (t) { return wrapLabel(ctx, t, maxWidth); });
    const tooTall = wrapped.some(function (ls) { return ls.length > WHEEL_MAX_LINES; });
    const tooWide = wrapped.some(function (ls) {
      return ls.some(function (l) { return ctx.measureText(l).width > maxWidth; });
    });
    if (!tooTall && !tooWide) return { size: size, lines: wrapped };
  }
  ctx.font = 'bold 9px ' + WHEEL_FONT;
  return { size: 9, lines: labels.map(function (t) { return [String(t || '')]; }) };
}

// ── حساب الهندسة مرة واحدة لكل عرض (لا في كل إطار) ────────────
function layoutWheel(vocab) {
  const canvas = document.getElementById('wheel-canvas');
  if (!canvas || !vocab || !vocab.length) return null;

  const size = wheelSize(canvas);
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(size * dpr);
  canvas.height = Math.round(size * dpr);
  canvas.style.width = size + 'px';
  canvas.style.height = size + 'px';

  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const n = vocab.length;
  const r = size / 2 - 8;
  const hubR = Math.max(16, r * 0.14);
  const angle = (2 * Math.PI) / n;

  // كلما كثرت القطاعات ضاق الوتد، فنُبعد النص عن المركز ليتّسع
  const dFactor = n <= 8 ? 0.58 : n <= 14 ? 0.68 : 0.76;
  const d = r * dFactor;
  // tan غير معرّفة عند نصف زاوية ٩٠° (قطاعان) وتؤول إلى صفر عند ١٨٠° (قطاع واحد)،
  // فنحدّ نصف الزاوية بـ ٦٠° ونسقف العرض بقطر العجلة.
  const halfAngle = Math.min(angle / 2, Math.PI / 3);
  const maxWidth = Math.max(28, Math.min(2 * d * Math.tan(halfAngle) * 0.90, 1.7 * r));

  const fit = layoutLabels(ctx, vocab.map(function (v) { return v.arabic || ''; }), maxWidth);

  return {
    ctx: ctx, canvas: canvas, size: size, n: n, r: r, hubR: hubR,
    cx: size / 2, cy: size / 2, angle: angle, d: d,
    fontSize: fit.size, lineHeight: Math.round(fit.size * 1.18), lines: fit.lines
  };
}

// ── الرسم: يُستدعى في كل إطار أثناء الدوران ────────────────────
function paintWheel(rotDeg) {
  const L = _wheelLayout;
  if (!L) return;
  const ctx = L.ctx;
  const rot = (rotDeg || 0) * Math.PI / 180;

  ctx.clearRect(0, 0, L.size, L.size);

  for (let i = 0; i < L.n; i++) {
    const start = L.angle * i - Math.PI / 2 + rot;

    ctx.beginPath();
    ctx.moveTo(L.cx, L.cy);
    ctx.arc(L.cx, L.cy, L.r, start, start + L.angle);
    ctx.closePath();
    ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // النص أفقي دائماً: لا ctx.rotate هنا، فلا ينقلب مهما دارت العجلة
    const mid = start + L.angle / 2;
    const lx = L.cx + L.d * Math.cos(mid);
    const ly = L.cy + L.d * Math.sin(mid);
    const lines = L.lines[i];
    const top = ly - ((lines.length - 1) * L.lineHeight) / 2;

    ctx.font = 'bold ' + L.fontSize + 'px ' + WHEEL_FONT;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.65)';
    ctx.shadowBlur = 4;
    for (let k = 0; k < lines.length; k++) {
      ctx.fillText(lines[k], lx, top + k * L.lineHeight);
    }
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
  }

  ctx.beginPath();
  ctx.arc(L.cx, L.cy, L.hubR, 0, 2 * Math.PI);
  ctx.fillStyle = '#a78bfa';
  ctx.fill();
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 3;
  ctx.stroke();
}

function drawWheel(vocab) {
  _wheelLayout = layoutWheel(vocab);
  if (!_wheelLayout) return;
  const canvas = _wheelLayout.canvas;
  canvas.dataset.rotation = canvas.dataset.rotation || '0';
  paintWheel(parseFloat(canvas.dataset.rotation));
}

function render(runtime, data) {
  const ac = document.getElementById('activity-container');
  // بلا اقتطاع هنا: العدد يحدّده config.limit في activity.js عبر bridge.js.
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
    if (!canvas || !_wheelLayout) return;
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
      paintWheel(rot);                       // الدوران داخل اللوحة، والنص يبقى أفقياً
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
