let wiState = {};

// ── تطبيع عربي قبل المقارنة ──────────────────────────────────
// الكلمة في lesson.js مشكّلة، والطالب يكتب غالباً بلا تشكيل، وقد يكتب
// «ه» بدل «ة» أو «ا» بدل «أ». فنُسقط هذه الفروق قبل المقارنة.
function wiNormalize(text) {
  return String(text == null ? '' : text)
    .replace(/[ً-ْٰـ]/g, '')   // تشكيل وتطويل
    .replace(/[أإآٱ]/g, 'ا') // أ إ آ ٱ ← ا
    .replace(/ى/g, 'ي')                   // ى ← ي
    .replace(/ة/g, 'ه')                   // ة ← ه
    .replace(/ؤ/g, 'و')                   // ؤ ← و
    .replace(/ئ/g, 'ي')                   // ئ ← ي
    .replace(/\s+/g, ' ')
    .trim();
}

function wiStripAl(text) {
  return text.replace(/^ال/, '');          // «ال» التعريف
}

// مقارنة تامة بعد التطبيع — لا تطابق جزئي.
// المنطق السابق كان يقبل أي جزء من الكلمة أو أول ثلاثة أحرف،
// فيُحتسب حرفٌ واحد إجابةً صحيحة، وتُقبل كلمة مختلفة تبدأ بنفس الأحرف.
function wiMatches(input, word) {
  const a = wiNormalize(input);
  const b = wiNormalize(word);
  if (!a || !b) return false;
  return a === b || wiStripAl(a) === wiStripAl(b);
}

function render(runtime, data) {
  const ac = document.getElementById('activity-container');
  const items = data;
  wiState = { items, idx: 0, hintIdx: 0, score: 0 };
  ac.innerHTML = `
    <div class="activity-header">
      <div class="activity-heading">🎭 مَن أنا؟</div>
      <div class="activity-subheading">根据提示猜单词！</div>
    </div>
    <div class="glass-card">
      <div class="hint-box" id="wi-hints"></div>
      <input id="wi-input" placeholder="اكتب تخمينك..." class="doctor-textarea" style="min-height:54px;direction:rtl;margin-bottom:12px" />
      <div style="display:flex;gap:10px;justify-content:center">
        <button class="btn btn-outline" onclick="nextWIHint()">💡 تلميح آخر</button>
        <button class="btn btn-primary" onclick="checkWI()">✅ تخمين</button>
      </div>
      <div id="wi-feedback" style="text-align:center;margin-top:12px;font-size:18px"></div>
    </div>
  `;
  function loadWIItem() {
    if (wiState.idx >= wiState.items.length) { runtime.complete(Math.round(wiState.score / wiState.items.length * 5)); return; }
    wiState.hintIdx = 0;
    // مدخل الدرس مولَّد آلياً، فنحتاط لغياب hints بدل الانهيار أمام الصف
    const hints = wiState.items[wiState.idx].hints;
    const first = Array.isArray(hints) && hints.length ? hints[0] : '—';
    document.getElementById('wi-hints').innerHTML = `<div class="hint-chip">💡 ${first}</div>`;
    document.getElementById('wi-input').value = '';
    document.getElementById('wi-feedback').textContent = '';
  }
  function nextWIHint() {
    const item = wiState.items[wiState.idx];
    if (!Array.isArray(item.hints)) return;
    if (wiState.hintIdx < item.hints.length - 1) {
      wiState.hintIdx++;
      document.getElementById('wi-hints').innerHTML += `<div class="hint-chip">💡 ${item.hints[wiState.hintIdx]}</div>`;
    }
  }
  function checkWI() {
    const item = wiState.items[wiState.idx];
    const input = document.getElementById('wi-input').value.trim();
    const correct = wiMatches(input, item.word);
    document.getElementById('wi-feedback').textContent = correct ? `✅ ${item.word} — ${item.chinese}` : `💡 الجواب: ${item.word}`;
    document.getElementById('wi-feedback').style.color = correct ? 'var(--accent-emerald)' : 'var(--accent-amber)';
    if (correct) { wiState.score++; runtime.reward(); }
    runtime.speak(item.word);
    setTimeout(() => { wiState.idx++; loadWIItem(); }, 1500);
  }
  loadWIItem();
  window.nextWIHint = nextWIHint;
  window.checkWI = checkWI;
}

window.renderWhoAmI = render;
