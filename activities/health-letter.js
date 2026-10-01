function render(runtime, data) {
  const ac = document.getElementById('activity-container');
  ac.innerHTML = `
    <div class="activity-header">
      <div class="activity-heading">📝 رسالة صحية</div>
      <div class="activity-subheading">写一封关于健康的信！</div>
    </div>
    <div class="glass-card">
      <div class="zh-text" style="margin-bottom:14px;font-size:15px;text-align:center">写5个关于日常习惯的句子</div>
      <textarea class="doctor-textarea" id="letter-text" rows="8" placeholder="اكتب رسالة صحية (5 جمل على الأقل)...
مثال: أستيقظ مبكراً كل يوم..."></textarea>
      <div style="display:flex;gap:10px;justify-content:center;margin-top:12px">
        <button class="btn btn-primary" onclick="analyzeLetter()">📊 تحليل الرسالة</button>
      </div>
      <div id="letter-stats" style="display:none;margin-top:16px"></div>
    </div>
  `;
  window.analyzeLetter = analyzeLetter;
}

function analyzeLetter() {
  const text = document.getElementById('letter-text').value.trim();
  if (!text) return;
  const sentences = text.split(/[.!؟،\n]/).filter(s => s.trim().length > 5);
  const verbCount = (text.match(/أ|ي|ن|ت[َُِ]?[A-Za-zأ-ي]/g) || []).length;
  const punctCount = (text.match(/[.!؟،]/g) || []).length;
  const wordCount = text.split(/\s+/).filter(w => w.length > 1).length;
  const score = Math.min(5, Math.floor(sentences.length / 2) + (punctCount > 2 ? 1 : 0));

  document.getElementById('letter-stats').style.display = 'block';
  document.getElementById('letter-stats').innerHTML = `
    <div class="health-stats">
      <div class="health-stat">📝 ${sentences.length} جملة</div>
      <div class="health-stat">📖 ${wordCount} كلمة</div>
      <div class="health-stat">✏️ ${punctCount} علامات</div>
      <div class="health-stat">⭐ ${score}/5</div>
    </div>
    <div style="text-align:center;margin-top:12px;font-size:22px;color:var(--accent-amber)">${'⭐'.repeat(score)}${'☆'.repeat(5-score)}</div>
    <div style="text-align:center;margin-top:8px;color:var(--accent-emerald);direction:rtl">${sentences.length >= 5 ? '🌟 ممتاز! 太棒了！' : '💡 أضف المزيد من الجمل'}</div>
  `;
  runtime.reward(1 + score / 4);
  if (sentences.length >= 5) setTimeout(() => runtime.complete(score), 800);
}

window.renderHealthLetter = render;
