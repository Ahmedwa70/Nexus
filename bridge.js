// ============================================================
// bridge.js — Hybrid Bridge Adapter (Twin-File Pattern)
// Reads ActivityConfig + LESSON_DATA via sourceField resolution.
// Provides runtime, hub UI, state management, theme sync.
// ============================================================
(function() {
  'use strict';

  if (window.ActivityBridge) return;
  if (typeof LESSON_DATA === 'undefined') return;
  if (typeof ActivityConfig === 'undefined') return;

  // ════════════════════════════════════════════════
  // 1. SOURCE MAP — Dynamic data transformers
  // ════════════════════════════════════════════════
  function shuffleArray(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  // (2026-10-02) حُذفت محوّلات: traffic-light · dots-hunter · conjugation-ladder
  // punctuation-editor · board-game · spot-difference.
  // كانت تشتقّ بياناتها من vocab/grammar/explain أيام كان محتواها مدفوناً في
  // activity.js. وبعد أن صارت تقرأ حقولها الخاصة من lesson.js، صارت تلك
  // المحوّلات تُشوّه ما تمرّره: ثلاثة تُفرغ المصفوفة، وثلاثة تُبقي عناصرها
  // وتُفرغ حقولها — وهذا أخطر لأنه يمرّ صامتاً.
  // الآن تسقط إلى 'direct' فتصل البيانات كما كتبها الذكاء الاصطناعي.
  var SOURCE_MAP = {
    'direct': function(data, config) {
      return config.limit ? data.slice(0, config.limit) : data;
    },
    'wheel': function(vocab, config) {
      // اختيار عشوائي لا أوّل-N: وإلا بقيت آخر المفردات لا تظهر أبداً.
      // نُبدّل نسخةً لا الأصل — shuffleArray تُعدّل في مكانها.
      var pool = shuffleArray(vocab.slice());
      if (config.limit) pool = pool.slice(0, config.limit);
      return pool.map(function(v) {
        return { arabic: v.ar, chinese: v.zh, emoji: v.emoji };
      });
    },
    'memory': function(vocab, config) {
      return (config.limit ? vocab.slice(0, config.limit) : vocab).map(function(v) {
        return { emoji: v.emoji, arabic: v.ar, chinese: v.zh };
      });
    },
    'sound-match': function(vocab, config) {
      var items = config.limit ? vocab.slice(0, config.limit) : vocab;
      return items.map(function(v, i) {
        var pool = vocab.filter(function(_, j) { return j !== i; });
        var distractors = shuffleArray(pool).slice(0, 2);
        var opts = distractors.map(function(d) { return d.emoji + ' ' + d.ar; });
        var correctOpt = v.emoji + ' ' + v.ar;
        var insertAt = Math.floor(Math.random() * (opts.length + 1));
        opts.splice(insertAt, 0, correctOpt);
        return { audioText: v.ar, options: opts, correct: insertAt };
      });
    },
    'vocab-simple': function(vocab, config) {
      return (config.limit ? vocab.slice(0, config.limit) : vocab).map(function(v) {
        return { arabic: v.ar, chinese: v.zh };
      });
    },
    'vocab-single': function(vocab, config) {
      return (config.limit ? vocab.slice(0, config.limit) : vocab).map(function(v) {
        return { arabic: v.ar };
      });
    },
    'dark-room': function(vocab, config) {
      return (config.limit ? vocab.slice(0, config.limit) : vocab).map(function(v) {
        return { arabic: v.ar || v.arabic || '', chinese: v.zh || v.chinese || '' };
      });
    },
    'swipe-quiz': function(tf, config) {
      return (config.limit ? tf.slice(0, config.limit) : tf).map(function(s) {
        return { arabic: s.ar, chinese: s.zh, correct: s.correct };
      });
    },
    'speed-reveal': function(vocab, config) {
      return (config.limit ? vocab.slice(0, config.limit) : vocab).map(function(v) {
        return { arabic: v.ar, chinese: v.zh, emoji: v.emoji };
      });
    },
    'quick-reaction': function(vocab, config) {
      return (config.limit ? vocab.slice(0, config.limit) : vocab).map(function(v) {
        return { arabic: v.ar, chinese: v.zh, emoji: v.emoji };
      });
    },
    'sentence-builder': function(dialogue, config) {
      return dialogue.map(function(d) {
        return { arabic: d.ar.replace(/[.!؟,\s]+$/, ''), chinese: d.zh, grammarNote: '' };
      });
    },
    'progressive-story': function(dialogue, config) {
      return dialogue.map(function(d) {
        return { speaker: d.speaker, text: d.ar, chinese: d.zh };
      });
    },
    'hidden-reveal': function(data, config) {
      return Array.isArray(data) ? data.slice(0, config.limit || data.length) : [];
    }
  };

  // ════════════════════════════════════════════════
  // 2. RESOLVE DATA
  // ════════════════════════════════════════════════
  function resolveData(config) {
    if (config.sourceField === 'custom' && config.data)
      return config.data;

    var parts = config.sourceField.split('.');
    var data = LESSON_DATA;
    for (var i = 0; i < parts.length; i++) {
      data = data[parts[i]];
      if (!data) {
        if (config.data) return config.data;
        return [];
      }
    }
    if (!Array.isArray(data)) {
      if (config.data) return config.data;
      return [];
    }
    var transformer = SOURCE_MAP[config.type] || SOURCE_MAP['direct'];
    return transformer(data, config);
  }

  // ════════════════════════════════════════════════
  // 3. RENDERERS MAP
  // ════════════════════════════════════════════════
  // Renderers are loaded on demand by ActivityCenterLoader.  Keep names here
  // instead of capturing undefined globals when bridge.js is first evaluated.
  var RENDERER_NAMES = {
    1: 'renderWheel', 2: 'renderMemory', 3: 'renderTapChoice',
    4: 'renderSoundMatch', 5: 'renderHiddenReveal', 6: 'renderDarkRoom',
    7: 'renderSentenceBuilder', 8: 'renderWechat', 9: 'renderWhoAmI',
    10: 'renderSwipeQuiz', 11: 'renderTrafficLight', 12: 'renderSpeedReveal',
    13: 'renderQuickReaction', 14: 'renderMiniMaze', 15: 'renderDotsHunter',
    16: 'renderConjugationLadder', 17: 'renderPunctuationEditor',
    18: 'renderYoungDoctor', 19: 'renderHealthLetter', 20: 'renderBoardGame',
    21: 'renderSpotDifference', 22: 'renderProgressiveStory'
  };

  function getRenderer(id) {
    var rendererName = RENDERER_NAMES[id];
    return rendererName && typeof window[rendererName] === 'function'
      ? window[rendererName]
      : null;
  }

  // ════════════════════════════════════════════════
  // 4. STATE
  // ════════════════════════════════════════════════
  const State = {
    xp: 0,
    stars: 0,
    badges: [],
    activityStars: {},
    currentActivity: null,
    darkMode: document.documentElement.getAttribute('data-theme') === 'dark',
    sound: true,
    showChinese: true,
    data: null,
    initialized: false,
    loadingActivityId: null
  };

  // ════════════════════════════════════════════════
  // 5. BUILD LESSON DATA
  // ════════════════════════════════════════════════
  function buildLessonData() {
    var locks = {};
    var resolvedActivities = [];
    ActivityConfig.forEach(function(c) {
      locks[c.id] = true;
      resolvedActivities.push({
        id: c.id, type: c.type, icon: c.icon,
        titleAr: c.titleAr, titleZh: c.titleZh, xp: c.xp,
        data: resolveData(c)
      });
    });
    return {
      title: LESSON_DATA.meta ? LESSON_DATA.meta.title : 'الأنشطة',
      subtitle: '',
      activities: resolvedActivities,
      activityLocks: locks,
      dialogue: LESSON_DATA.dialogue || [],
      vocabulary: LESSON_DATA.vocab || []
    };
  }

  // ════════════════════════════════════════════════
  // 6. STATE PERSISTENCE
  // ════════════════════════════════════════════════
  function loadState() {
    try {
      var saved = JSON.parse(localStorage.getItem('act_bridge_state') || '{}');
      if (saved.xp != null) State.xp = saved.xp;
      if (saved.stars != null) State.stars = saved.stars;
      if (saved.badges) State.badges = saved.badges;
      if (saved.activityStars) State.activityStars = saved.activityStars;
    } catch(e) {}
  }
  function saveState() {
    try {
      localStorage.setItem('act_bridge_state', JSON.stringify({
        xp: State.xp, stars: State.stars, badges: State.badges,
        activityStars: State.activityStars
      }));
    } catch(e) {}
  }

  // ════════════════════════════════════════════════
  // 7. THEME SYNC
  // ════════════════════════════════════════════════
  function syncTheme() {
    // Theme state has one owner: html[data-theme].
    // The Activity Center consumes namespaced tokens from that state; it does not
    // carry a light-mode/dark-mode class or a parallel set of runtime overrides.
    State.darkMode = document.documentElement.getAttribute('data-theme') === 'dark';
  }

  // ════════════════════════════════════════════════
  // 8. CLONE SHELL TOPBAR CONTROLS
  // ════════════════════════════════════════════════
  function cloneShellControls(overlay) {
    var source = document.querySelector('.desktop-settings');
    var target = document.getElementById('act-cp-controls');
    if (!source || !target) return;
    var clone = source.cloneNode(true);
    clone.id = 'act-cp-clone';
    clone.classList.add('act-cp-clone');
    target.appendChild(clone);
  }

  // ════════════════════════════════════════════════
  // 9. UI — CREATE ACTIVITY OVERLAY
  // ════════════════════════════════════════════════
  function createUI() {
    var existing = document.getElementById('act-overlay');
    if (existing) return existing;
var overlay = document.createElement('div');
    overlay.id = 'act-overlay';
    overlay.className = '';
    overlay.innerHTML =
      '<div id="act-topbar">' +
        '<div class="act-topbar-start" id="act-topbar-start">' +
          '<button class="act-close-btn" id="act-close-btn" title="إغلاق">✕</button>' +
          '<span style="color:var(--text-secondary);margin:0 4px;opacity:0.3">|</span>' +
          '<div class="act-cp-controls" id="act-cp-controls"></div>' +
        '</div>' +
        '<h2>🎮 الأنشطة التفاعلية</h2>' +
        '<div class="act-stats">' +
          '<div class="act-stat">💰 <span id="act-xp">0</span></div>' +
          '<div class="act-stat" style="color:var(--accent-amber)">⭐ <span id="act-stars">0</span></div>' +
        '</div>' +
      '</div>' +
      '<div id="act-hub"><div id="act-hub-grid"></div></div>' +
      '<div id="activity-container"></div>' +
      '<canvas id="act-confetti"></canvas>';

    document.body.appendChild(overlay);
    cloneShellControls(overlay);
    return overlay;
  }

  // ════════════════════════════════════════════════
  // 10. HUB GRID
  // ════════════════════════════════════════════════
  function buildHub() {
    var grid = document.getElementById('act-hub-grid');
    var defs = ActivityConfig;
    var phaseNames = {1:'المرحلة الأولى',2:'المرحلة الثانية',3:'المرحلة الثالثة',4:'المرحلة الرابعة'};
    var phaseColors = {1:'act-p1',2:'act-p2',3:'act-p3',4:'act-p4'};

    var phases = {};
    defs.forEach(function(d) {
      if (!phases[d.phase]) phases[d.phase] = [];
      phases[d.phase].push(d);
    });

    var html = '';
    Object.keys(phases).sort().forEach(function(pNum) {
      var p = Number(pNum);
      html += '<div class="act-phase-title"><span></span>' + phaseNames[p] + '</div>';
      html += '<div class="act-grid">';
      phases[p].forEach(function(def) {
        var stars = State.activityStars[def.id] || 0;
        var starStr = stars > 0 ? '⭐'.repeat(stars) : '';
        html += '<div class="act-card" id="act-card-' + def.id + '" onclick="ActivityBridge.showActivity(' + def.id + ')">' +
          '<div class="act-card-icon">' + def.icon + '</div>' +
          '<div class="act-card-name">' + def.titleAr + '</div>' +
          '' +
          '<div class="act-card-stars">' + starStr + '</div>' +
          '<div class="act-phase-badge ' + phaseColors[p] + '">P' + p + '</div>' +
        '</div>';
      });
      html += '</div>';
    });
    grid.innerHTML = html;
    updateStats();
  }

  function updateStats() {
    var xpEl = document.getElementById('act-xp');
    var stEl = document.getElementById('act-stars');
    if (xpEl) xpEl.textContent = State.xp;
    if (stEl) stEl.textContent = State.stars;
  }

  // ════════════════════════════════════════════════
  // 11. SHOW / HIDE OVERLAY
  // ════════════════════════════════════════════════
  function setCloseBtnMode(mode) {
    var btn = document.getElementById('act-close-btn');
    if (!btn) return;
    if (mode === 'activity') {
      btn.innerHTML = '←';
      btn.title = 'عودة · 返回';
      btn.onclick = function() { showHome(); };
    } else {
      btn.innerHTML = '✕';
      btn.title = 'إغلاق · 关闭';
      btn.onclick = function() { hideOverlay(); };
    }
  }

  function showOverlay() {
    syncTheme();
    var o = document.getElementById('act-overlay');
    if (!o) o = createUI();
    setCloseBtnMode('hub');
    if (typeof window.drCleanup === 'function') { window.drCleanup(); window.drCleanup = null; }
    document.getElementById('activity-container').classList.remove('visible');
    document.getElementById('activity-container').style.display = 'none';
    document.getElementById('act-hub').style.display = 'block';
    o.classList.add('active');
    document.body.style.overflow = 'hidden';
    buildHub();
  }

  function hideOverlay() {
    if (typeof window.drCleanup === 'function') { window.drCleanup(); window.drCleanup = null; }
    var container = document.getElementById('activity-container');
    if (container) { container.classList.remove('visible'); container.style.display = 'none'; container.innerHTML = ''; }
    var hub = document.getElementById('act-hub');
    if (hub) hub.style.display = 'block';
    State.currentActivity = null;
    var o = document.getElementById('act-overlay');
    if (o) o.classList.remove('active');
    document.body.style.overflow = '';
  }

  // ════════════════════════════════════════════════
  // 12. LAUNCH ACTIVITY
  // ════════════════════════════════════════════════
  function isCustomActivity(config) {
    return !!(config && /^exercises\.custom/.test(config.sourceField || ''));
  }

  function showUnavailableActivity(config) {
    State.currentActivity = config.id;
    setCloseBtnMode('activity');
    document.getElementById('act-hub').style.display = 'none';

    var container = document.getElementById('activity-container');
    container.innerHTML =
      '<div class="activity-header">' +
        '<div class="activity-heading">' + config.icon + ' ' + config.titleAr + '</div>' +
        '<div class="activity-subheading">' + config.titleZh + '</div>' +
      '</div>' +
      '<div class="glass-card" style="text-align:center">' +
        '<div class="ar-text">لا تتوفر بيانات مخصصة لهذا النشاط في هذا الدرس.</div>' +
        '<div class="zh-text show" style="margin-top:8px">本课没有此活动的专属数据。</div>' +
        '<button class="btn btn-ghost" style="margin-top:18px" onclick="ActivityBridge.showHome()">← عودة <span class="zh-only">· 返回</span></button>' +
      '</div>';
    container.style.display = 'block';
    container.classList.add('visible');
  }

  function showActivity(id) {
    if (State.currentActivity || State.loadingActivityId) return;

    var config = ActivityConfig.find(function(c) { return c.id === id; });
    if (!config) return;
    var data = resolveData(config);
    if (!data || (Array.isArray(data) && data.length === 0)) {
      if (isCustomActivity(config)) showUnavailableActivity(config);
      return;
    }

    var renderer = getRenderer(id);
    if (!renderer) {
      var loader = window.ActivityCenterLoader;
      if (!loader || typeof loader.loadActivity !== 'function') {
        console.error('Activity loader is unavailable for activity ' + id);
        return;
      }

      State.loadingActivityId = id;
      var pendingCard = document.getElementById('act-card-' + id);
      var heading = document.querySelector('#act-topbar h2');
      if (pendingCard) {
        pendingCard.setAttribute('aria-busy', 'true');
        pendingCard.style.pointerEvents = 'none';
      }
      if (heading) {
        heading.dataset.activityDefaultLabel = heading.dataset.activityDefaultLabel || heading.textContent;
        heading.innerHTML = '⏳ جَارِ تَحْمِيل النَّشَاط <span class="zh-only">· 正在加载活动</span>';
      }

      loader.loadActivity(id).then(function() {
        if (pendingCard) {
          pendingCard.removeAttribute('aria-busy');
          pendingCard.style.pointerEvents = '';
        }
        if (heading) heading.innerHTML = heading.dataset.activityDefaultLabel || '🎮 الأنشطة التفاعلية';
        State.loadingActivityId = null;
        showActivity(id);
      }).catch(function(error) {
        if (pendingCard) {
          pendingCard.removeAttribute('aria-busy');
          pendingCard.style.pointerEvents = '';
          pendingCard.title = 'تعذّر تحميل النشاط. حاول مرة أخرى.';
        }
        if (heading) {
          heading.innerHTML = '⚠️ تعذّر تحميل النشاط';
          setTimeout(function() {
            heading.innerHTML = heading.dataset.activityDefaultLabel || '🎮 الأنشطة التفاعلية';
          }, 2600);
        }
        State.loadingActivityId = null;
        console.error('Activity failed to load:', error);
      });
      return;
    }

    State.currentActivity = id;
    setCloseBtnMode('activity');
    document.getElementById('act-hub').style.display = 'none';
    var container = document.getElementById('activity-container');
    container.innerHTML = '';
    container.style.display = 'block';
    container.classList.add('visible');

    var runtime = {
      state: State,
      speak: speakAr,
      reward: function() {
        var c = document.getElementById('act-confetti');
        if (c) startConfetti(c);
      },
      complete: function(stars, noExit) {
        if (stars == null) stars = 1;
        var prev = State.activityStars[id] || 0;
        if (stars > prev) {
          State.activityStars[id] = stars;
          var earned = stars - prev;
          State.stars += earned;
          State.xp += (config.xp || 10) * earned;
          if (earned >= 3) State.badges.push(id);
          saveState();
          updateStats();
        }
        if (!noExit) showHome();
      }
    };

    renderer(runtime, data);
  }

  function showHome() {
    State.currentActivity = null;
    setCloseBtnMode('hub');
    document.getElementById('activity-container').classList.remove('visible');
    document.getElementById('activity-container').style.display = 'none';
    document.getElementById('activity-container').innerHTML = '';
    document.getElementById('act-hub').style.display = 'block';
    buildHub();
  }

  // ════════════════════════════════════════════════
  // 13. CONFETTI
  // ════════════════════════════════════════════════
  var confettiParticles = [];

  function startConfetti(canvas) {
    confettiParticles = [];
    var ctx = canvas.getContext('2d');
    var W = canvas.width = window.innerWidth;
    var H = canvas.height = window.innerHeight;
    var colors = ['#0E7C7B','#38bdf8','#fbbf24','#34d399','#f87171','#f472b6'];
    for (var i = 0; i < 80; i++) {
      confettiParticles.push({
        x: Math.random() * W, y: Math.random() * H - H,
        w: Math.random() * 10 + 5, h: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 2, vy: Math.random() * 3 + 2,
        rot: Math.random() * 360, rv: (Math.random() - 0.5) * 4
      });
    }
    var frames = 0;
    function draw() {
      if (frames++ > 150) { ctx.clearRect(0,0,W,H); return; }
      ctx.clearRect(0,0,W,H);
      confettiParticles.forEach(function(p) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.rot += p.rv;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI / 180);
        ctx.fillStyle = p.color; ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
        ctx.restore();
      });
      requestAnimationFrame(draw);
    }
    draw();
  }

  // ════════════════════════════════════════════════
  // 14. TRIGGER BUTTON
  // ════════════════════════════════════════════════
  function addTrigger() {
    var existing = document.getElementById('act-trigger-btn');
    if (existing) return;
    var target = document.querySelector('.topbar-actions');
    if (!target) return;
    var btn = document.createElement('button');
    btn.id = 'act-trigger-btn';
    btn.className = 'ds-btn';
    btn.innerHTML = '🎮';
    btn.title = 'الأنشطة التفاعلية';
    btn.onclick = showOverlay;
    var group = document.createElement('div');
    group.className = 'ds-group';
    group.appendChild(btn);
    var ds = target.querySelector('.desktop-settings');
    if (ds) target.insertBefore(group, ds);
    else target.appendChild(group);
  }

  // ════════════════════════════════════════════════
  // 15. INIT
  // ════════════════════════════════════════════════
  function init() {
    if (State.initialized) return;
    window.lessonData = buildLessonData();
    State.data = window.lessonData;
    loadState();

    createUI();
    addTrigger();

    var observer = new MutationObserver(function() { syncTheme(); });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        if (document.getElementById('act-modal')) closeModal();
        else if (State.currentActivity) showHome();
        else hideOverlay();
      }
    });

    State.initialized = true;
  }

  // ════════════════════════════════════════════════
  // 16. EXPOSE PUBLIC API
  // ════════════════════════════════════════════════
  window.ActivityBridge = {
    init: init,
    showOverlay: showOverlay,
    hideOverlay: hideOverlay,
    showActivity: showActivity,
    showHome: showHome,
    buildHub: buildHub,
    syncTheme: syncTheme
  };

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', init);
  else
    init();

})();
