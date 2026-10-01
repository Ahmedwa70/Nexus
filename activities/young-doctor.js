let ydState = {};

function render(runtime, data) {
  const ac = document.getElementById('activity-container');
  ydState = { patients: [...data], idx: 0, score: 0 };
  ac.innerHTML = `
    <div class="activity-header">
      <div class="activity-heading">👨‍⚕️ الطبيب الصغير</div>
      <div class="activity-subheading">给病人写建议！</div>
    </div>
    <div class="glass-card">
      <div id="yd-patient" class="patient-card"></div>
      <textarea class="doctor-textarea" id="yd-tips" placeholder="اكتب 3 نصائح بصيغة الأمر أو النهي..."></textarea>
      <div style="display:flex;gap:10px;justify-content:center;margin-top:12px">
        <button class="btn btn-primary" onclick="checkYD()">✅ أرسل النصيحة</button>
        <button class="btn btn-outline" onclick="nextYD()">⏭️ مريض آخر</button>
      </div>
      <div id="yd-feedback" style="text-align:center;margin-top:12px;direction:rtl"></div>
    </div>
  `;
  function loadYDPatient() {
    if (ydState.idx >= ydState.patients.length) { runtime.complete(5); return; }
    const p = ydState.patients[ydState.idx];
    document.getElementById('yd-patient').innerHTML = `
      <div class="patient-name">👤 ${p.name} (${p.age} سنوات)</div>
      <div class="patient-problem">🔍 ${p.problems}</div>
    `;
    document.getElementById('yd-tips').value = '';
    document.getElementById('yd-feedback').textContent = '';
  }
  function checkYD() {
    const p = ydState.patients[ydState.idx];
    const text = document.getElementById('yd-tips').value.trim();
    const lines = text.split('\n').filter(l => l.trim().length > 3);
    const score = Math.min(3, lines.length);
    if (score >= 2) {
      document.getElementById('yd-feedback').innerHTML = `<span style="color:var(--accent-emerald)">✅ ممتاز! ${score} نصائح</span><br>${p.expectedTips.map(t=>`<span class="hint-chip">${t}</span>`).join(' ')}`;
      runtime.reward(1 + score / 5);
      ydState.score++;
    } else {
      document.getElementById('yd-feedback').innerHTML = `<span style="color:var(--accent-amber)">💡 اكتب ${3 - score} نصائح أكثر</span>`;
    }
  }
  function nextYD() { ydState.idx++; loadYDPatient(); }
  loadYDPatient();
  window.checkYD = checkYD;
  window.nextYD = nextYD;
}

window.renderYoungDoctor = render;
