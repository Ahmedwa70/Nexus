let wcState = {};

function render(runtime, data) {
  const ac = document.getElementById('activity-container');
  wcState = { steps: [...data], idx: 0, score: 0, timeBase: 12 * 60 + 30, lastRole: '' };
  ac.innerHTML = `
    <div class="activity-header">
      <div class="activity-heading">‫محادثة وي‌تشات‬ 💬</div>
      <div class="activity-subheading zh-text">微信对话练习</div>
    </div>
    <div id="wechat-container" class="chat-wrap">
      <div class="chat-hdr">
        <button class="chat-hdr-back" onclick="ActivityBridge.showHome()" aria-label="رجوع">←</button>
        <div class="chat-hdr-avatar" aria-hidden="true">👦</div>
        <div class="chat-hdr-info">
          <div class="chat-hdr-name">فَيْصَل</div>
          <div class="chat-hdr-status"><span class="chat-online-dot"></span> متصل الآن</div>
        </div>
      </div>
      <div class="chat-area" id="wc-msgs"></div>
      <div class="chat-composer" id="wc-composer">
        <div class="chat-composer-icon" aria-hidden="true">😊</div>
        <div class="chat-composer-field" id="wc-field">...</div>
        <div class="chat-composer-icon" aria-hidden="true">🎤</div>
      </div>
      <div id="wc-choices" class="chat-chips" style="display:none"></div>
    </div>
  `;

  function fmtTime() {
    var t = wcState.timeBase++;
    var h = Math.floor(t / 60) % 24;
    var m = t % 60;
    return (h < 10 ? '٠' : '') + String(h).replace(/\d/g, function(d){return '٠١٢٣٤٥٦٧٨٩'[d];}) +
           ':' + (m < 10 ? '٠' : '') + String(m).replace(/\d/g, function(d){return '٠١٢٣٤٥٦٧٨٩'[d];});
  }

  function addBubble(text, zh, isStudent) {
    var msgs = document.getElementById('wc-msgs');
    var role = isStudent ? 'student' : 'peer';
    var isGrouped = wcState.lastRole === role;
    wcState.lastRole = role;

    var row = document.createElement('div');
    row.className = 'msg-row msg-' + role + (isGrouped ? ' msg-grouped' : '');

    var avatarHTML = '<div class="msg-avatar">' + (isStudent ? '🧑‍🎓' : '👦') + '</div>';
    var metaHTML = '<span class="msg-time">' + fmtTime() + (isStudent ? ' ✓✓' : '') + '</span>';
    var zhHTML = zh ? '<div class="msg-text-zh zh-text">' + zh + '</div>' : '';

    var bubbleHTML = '<div class="msg-bubble">' +
      '<div class="msg-text-ar">' + text + '</div>' +
      zhHTML + metaHTML + '</div>';

    row.innerHTML = avatarHTML + bubbleHTML;

    msgs.appendChild(row);
    msgs.scrollTop = msgs.scrollHeight;
    return row;
  }

  function addTyping() {
    var msgs = document.getElementById('wc-msgs');
    var row = document.createElement('div');
    row.className = 'msg-row msg-peer';
    row.innerHTML = '<div class="msg-avatar">👦</div>' +
      '<div class="msg-bubble msg-typing">' +
      '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>';
    msgs.appendChild(row);
    msgs.scrollTop = msgs.scrollHeight;
    return row;
  }

  function setComposerState(state) {
    var field = document.getElementById('wc-field');
    if (state === 'typing') {
      field.textContent = 'يكتب فيصل...';
      field.className = 'chat-composer-field chat-field-typing';
    } else if (state === 'choose') {
      field.textContent = 'اختر ردّك...';
      field.className = 'chat-composer-field chat-field-ready';
    } else {
      field.textContent = 'انتهت المحادثة ✓';
      field.className = 'chat-composer-field chat-field-done';
    }
  }

  function showWcChoices(step) {
    var choicesEl = document.getElementById('wc-choices');
    setComposerState('choose');
    choicesEl.style.display = 'flex';
    choicesEl.innerHTML = step.choices.map(function(c, i) {
      return '<button class="chat-chip" onclick="pickWcChoice(' + i + ',' + step.correctIndex + ')">' + c + '</button>';
    }).join('');
  }

  function pickWcChoice(chosen, correct) {
    var step = wcState.steps[wcState.idx];
    var btns = document.querySelectorAll('.chat-chip');
    btns.forEach(function(b) { b.disabled = true; });

    if (chosen === correct) {
      btns[chosen].classList.add('chip-correct');
      wcState.score++;
      setTimeout(function() {
        document.getElementById('wc-choices').style.display = 'none';
        addBubble(step.choices[chosen], '', true);
        runtime.reward();
        wcState.idx++;
        setTimeout(runWcStep, 600);
      }, 350);
    } else {
      btns[chosen].classList.add('chip-wrong');
      setTimeout(function() { btns[chosen].classList.remove('chip-wrong'); }, 600);
    }
  }

  function runWcStep() {
    if (wcState.idx >= wcState.steps.length) {
      var totalQ = wcState.steps.filter(function(s) { return s.from === 'choices'; }).length;
      var finalStars = Math.min(5, Math.round(wcState.score / Math.max(1, totalQ) * 5));
      var msgs = document.getElementById('wc-msgs');
      var sys = document.createElement('div');
      sys.className = 'msg-system';
      sys.innerHTML = '🎉 أَحْسَنْتَ! انْتَهَتِ المُحَادَثَة<br>' +
        '<span class="msg-system-stars">' + '⭐'.repeat(finalStars) + '</span>';
      msgs.appendChild(sys);
      msgs.scrollTop = msgs.scrollHeight;
      setComposerState('done');
      runtime.reward();
      runtime.complete(finalStars, true);
      return;
    }
    var step = wcState.steps[wcState.idx];
    if (step.from === 'other') {
      setComposerState('typing');
      var typingRow = addTyping();
      setTimeout(function() {
        typingRow.remove();
        addBubble(step.text, step.chinese, false);
        if (runtime.state.sound) runtime.speak(step.text);
        wcState.idx++;
        setTimeout(runWcStep, 300);
      }, step.delay || 800);
    } else if (step.from === 'choices') {
      showWcChoices(step);
    }
  }

  runWcStep();
  window.pickWcChoice = pickWcChoice;
}

window.renderWechat = render;
