// ================================================================
// *** 1. INIT - بدء التشغيل - 初始化
// ================================================================
document.documentElement.setAttribute('data-theme', 'light');
let currentIndex = 0;
let speedQs = [];

loadLesson(LESSON_DATA);
hideSplashScreen();

// ================================================================
// *** 2. BRANDING - العلامة التجارية - 品牌更新
// ================================================================
function updateBrandingDynamics(data) {
    const icon = data.meta.brandIcon || '📚';
    const fullTitle = data.meta.pageTitle || data.title || 'درس عربي';

    // 1. تحديث الـ Favicon (تبويب المتصفح)
    const svgFavicon = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${encodeURIComponent(icon)}</text></svg>`;
    const fav = document.getElementById('dynamicFavicon');
    const apple = document.getElementById('dynamicAppleIcon');
    if (fav) fav.setAttribute('href', svgFavicon);
    if (apple) apple.setAttribute('href', svgFavicon);

    // 2. تحديث Open Graph / Twitter للمشاركة
    const ogTitle = document.getElementById('ogTitle');
    const twTitle = document.getElementById('twitterTitle');
    if (ogTitle) ogTitle.setAttribute('content', fullTitle);
    if (twTitle) twTitle.setAttribute('content', fullTitle);

    // 3. تحديث Splash Screen
    const splashIcon = document.getElementById('splashIcon');
    const splashTitle = document.getElementById('splashTitle');
    const splashSubtitle = document.getElementById('splashSubtitle');
    if (splashIcon) splashIcon.textContent = icon;
    if (splashTitle) splashTitle.textContent = (data.meta.brandPrefix || 'درس') + ' ' + (data.meta.brandTitle || '');
    if (splashSubtitle) {
        // استخراج الجزء الصيني من pageTitle (بعد علامة |)
        const parts = (fullTitle || '').split('|');
        splashSubtitle.textContent = parts.length > 1 ? parts[1].trim() : '加载中...';
    }
}

// ================================================================
// *** 3. SPLASH SCREEN - شاشة البداية - 启动画面
// ================================================================
function hideSplashScreen() {
    const splash = document.getElementById('splashScreen');
    if (!splash) return;

    window.addEventListener('load', () => {
        setTimeout(() => {
            splash.classList.add('fade-out');
            setTimeout(() => splash.remove(), 600);
        }, 800);
    });
}

// ================================================================
// *** 4. LESSON LOADER - تحميل الدرس - 加载课程
// ================================================================
// ================================================================
// *** VALIDATION - التحقق من بيانات الدرس قبل التحميل
// ================================================================
function validateLesson(data) {
    const errors = [], warnings = [];

    function e(code, path, msg) { errors.push({ code, path, msg }); }
    function w(code, path, msg) { warnings.push({ code, path, msg }); }

    // ── P1: top-level ─────────────────────────────────────────────
    if (!data || typeof data !== 'object') {
        e('V-001', 'LESSON_DATA', 'LESSON_DATA غير موجود أو ليس object');
        return { valid: false, errors, warnings };
    }

    const sections = ['meta','hook','thinking','vocab','dialogue',
                      'dialogueScenes','explain','grammarMeta','grammar','exercises'];
    sections.forEach(k => {
        if (data[k] === undefined || data[k] === null)
            e('V-002', k, `القسم مفقود: ${k}`);
    });

    // ── P2: crash-critical arrays ─────────────────────────────────
    ['vocab','dialogue','thinking','explain','grammar'].forEach(k => {
        if (data[k] !== undefined && !Array.isArray(data[k]))
            e('V-010', k, `${k} يجب أن يكون array`);
    });
    if (data.hook && !Array.isArray(data.hook.compare))
        e('V-011', 'hook.compare', 'hook.compare يجب أن يكون array');
    if (data.grammarMeta && !data.grammarMeta.title)
        e('V-012', 'grammarMeta.title', 'grammarMeta.title مفقود — يُسبب crash');

    // ── P3: exercises existence ───────────────────────────────────
    if (data.exercises && typeof data.exercises === 'object') {
        const required = ['mcq','fillBlanks','dragWords','orderWords','correctError',
                          'rewrite','guidedWriting','listeningExercise','speedChallenge',
                          'multiStep','paragraph','contextAnalysis','scenario',
                          'dialogueFill','visualChoice','patternFill','sentenceTransform','challenge'];
        required.forEach(k => {
            if (data.exercises[k] === undefined || data.exercises[k] === null)
                e('V-020', `exercises.${k}`, `exercises.${k} مفقود — يُسبب crash في getExercisesHTML()`);
        });

        // exercise-specific
        if (data.exercises.paragraph && typeof data.exercises.paragraph.sentence === 'string') {
            const blanks  = (data.exercises.paragraph.sentence.match(/___/g) || []).length;
            const answers = Array.isArray(data.exercises.paragraph.answers)
                            ? data.exercises.paragraph.answers.length : 0;
            if (blanks !== answers)
                e('V-030', 'exercises.paragraph', `paragraph: ${blanks} فراغ لكن ${answers} إجابة`);
        }
        if (data.exercises.challenge && typeof data.exercises.challenge.sentence === 'string') {
            const blanks  = (data.exercises.challenge.sentence.match(/___/g) || []).length;
            const answers = Array.isArray(data.exercises.challenge.answers)
                            ? data.exercises.challenge.answers.length : 0;
            if (blanks !== answers)
                e('V-031', 'exercises.challenge', `challenge: ${blanks} فراغ لكن ${answers} إجابة`);
        }
        if (data.exercises.multiStep && typeof data.exercises.multiStep.story !== 'object')
            e('V-032', 'exercises.multiStep.story', 'multiStep.story يجب object {ar,zh}');
        if (Array.isArray(data.exercises.orderWords) === false && data.exercises.orderWords !== undefined)
            e('V-033', 'exercises.orderWords', 'orderWords يجب array وليس object');

        // warnings فقط
        if (Array.isArray(data.exercises.dragWords) && Array.isArray(data.exercises.dragZones)) {
            const cats    = new Set(data.exercises.dragWords.map(x => x.cat));
            const accepts = new Set(data.exercises.dragZones.map(x => x.accept));
            cats.forEach(c => { if (!accepts.has(c)) w('V-040', 'dragWords/dragZones', `cat "${c}" لا يطابق أي dragZone`); });
        }
        if (Array.isArray(data.exercises.dialogueFill?.lines)) {
            data.exercises.dialogueFill.lines.forEach((l, i) => {
                if (typeof l.text !== 'string')
                    e('V-041', `dialogueFill.lines[${i}].text`, 'text يجب string — يُسبب crash في .includes()');
            });
        }
    }

    // ── P4: minimum counts (warnings) ────────────────────────────
    if (Array.isArray(data.vocab) && data.vocab.length < 8)
        w('V-050', 'vocab', `vocab يحتوي ${data.vocab.length} كلمات — يجب ≥ 8 لعمل speedQs و selectWords`);
    if (Array.isArray(data.dialogue) && data.dialogue.length < 2)
        w('V-051', 'dialogue', `dialogue يحتوي ${data.dialogue.length} سطور — يجب ≥ 2 لعمل renderSpeaking`);

    return { valid: errors.length === 0, errors, warnings };
}

function loadLesson(data) {

    // VALIDATION: تحقق من البيانات قبل أي render
    const validation = validateLesson(data);
    if (!validation.valid) {
        console.error('❌ Lesson validation failed:');
        validation.errors.forEach(err =>
            console.error(`  [${err.code}] ${err.path}: ${err.msg}`)
        );
        throw new Error(
            `الدرس يحتوي ${validation.errors.length} خطأ يمنع التحميل:\n` +
            validation.errors.map(e => `• [${e.code}] ${e.path}: ${e.msg}`).join('\n')
        );
    }
    if (validation.warnings.length > 0) {
        console.warn('⚠️ Lesson warnings:');
        validation.warnings.forEach(w =>
            console.warn(`  [${w.code}] ${w.path}: ${w.msg}`)
        );
    }

    // CF-3 FIX: يجب أن تُستدعى أولاً قبل أي شيء آخر
    initSpeedQs();

    document.getElementById('pageTitle').innerText = data.meta.pageTitle;
    document.getElementById('brandIcon').innerText = data.meta.brandIcon;
    document.getElementById('brandPrefix').innerText = data.meta.brandPrefix + " ";
    document.getElementById('brandTitle').innerText = data.meta.brandTitle;

    // ✨ تحديث الـ favicon والـ splash والـ meta tags
    updateBrandingDynamics(data);

    renderHook(data.hook);

    renderThinking(data.thinking);
    setupDeferredVocab(data.vocab);
    setupDeferredReading(data.dialogue, data.dialogueScenes);
    setupDeferredExplain(data.explain);
    setupDeferredGrammar(data.grammar);

    document.getElementById('grammarTitle').innerText = data.grammarMeta.title;
    document.getElementById('grammarSubtitle').innerText = data.grammarMeta.subtitle;

    // The exercises shell stays in the DOM, but its expensive content is
    // built only when the learner approaches it or navigates to it directly.
    setupDeferredExercises();

    renderSpeaking();
}

// ================================================================
// *** 5. RENDER FUNCTIONS - بناء المحتوى - 渲染函数
// ================================================================
function renderHook(data) {
    document.getElementById('hookEmojis').innerText = data.emojis;
    document.getElementById('hookTitle').innerText = data.title_ar;
    document.getElementById('hookSubtitle').innerText = data.title_zh;
    const taglineParts = (data.tagline || '').split(/(?=[一-鿿])/);
    if (taglineParts.length > 1) {
        const arPart = taglineParts[0].replace(/\s*·\s*$/, '');
        const zhPart = taglineParts.slice(1).join('');
        document.getElementById('hookTagline').innerHTML = arPart + ' <span class="zh-only">· ' + zhPart + '</span>';
    } else {
        document.getElementById('hookTagline').innerText = data.tagline;
    }

    const grid = document.getElementById('compareGrid');
    grid.innerHTML = "";

    data.compare.forEach(item => {
        const div = document.createElement('div');
        div.className = `compare-card ${item.type}`;

        div.innerHTML = `
            <span class="compare-emoji">${item.emoji}</span>
            <div class="compare-title ar-text">${item.ar}</div>
            <div class="compare-zh">${item.zh}</div>
        `;

        grid.appendChild(div);
    });
}
// The #reading shell and its controls remain in the DOM.  Its visual scenes
// and dialogue lines are built only when the learner reaches the section.
// Declarations omit later assignments because loadLesson() can run early.
var readingLoaded;
var readingBuilding;
var readingObserver;
var deferredReadingDialogue;
var deferredReadingScenes;

function ensureReadingBuilt() {
    if (readingLoaded || readingBuilding) return readingLoaded;
    if (!deferredReadingDialogue || !deferredReadingScenes ||
        !document.getElementById('dialogueBox') || !document.getElementById('dialogueScenesContainer')) return false;

    readingBuilding = true;
    try {
        renderDialogueScenes(deferredReadingScenes);
        renderDialogue(deferredReadingDialogue);
        readingLoaded = true;
        if (readingObserver) {
            readingObserver.disconnect();
            readingObserver = null;
        }
        return true;
    } catch (error) {
        console.error('Failed to build reading:', error);
        return false;
    } finally {
        readingBuilding = false;
    }
}

function setupDeferredReading(dialogue, scenes) {
    deferredReadingDialogue = dialogue;
    deferredReadingScenes = scenes;
    const section = document.getElementById('reading');
    if (!section || readingLoaded) return;

    // Support an initial direct URL such as lesson.html#reading.
    if (window.location.hash === '#reading') {
        ensureReadingBuilt();
        return;
    }

    if ('IntersectionObserver' in window) {
        readingObserver = new IntersectionObserver(entries => {
            if (entries.some(entry => entry.isIntersecting)) ensureReadingBuilt();
        }, { rootMargin: '0px' });
        readingObserver.observe(section);
    } else {
        // Small compatibility fallback for older local browsers.
        const checkProximity = () => {
            if (section.getBoundingClientRect().top <= window.innerHeight) {
                window.removeEventListener('scroll', checkProximity);
                ensureReadingBuilt();
            }
        };
        window.addEventListener('scroll', checkProximity, { passive: true });
        checkProximity();
    }

    window.addEventListener('hashchange', () => {
        if (window.location.hash === '#reading') ensureReadingBuilt();
    });
}

function renderDialogueScenes(scenes) {

    const container = document.getElementById('dialogueScenesContainer');
    if (!container) return;

    container.innerHTML = "";

    scenes.forEach((scene, index) => {

        const div = document.createElement('div');
        div.className = 'scene-img';

        // gradient
        div.style.background = scene.gradient;

        div.innerHTML = `
            ${scene.emoji}
            <div class="scene-label">
                ${scene.label_ar} <span class="zh-only">· ${scene.label_zh}</span>
            </div>
        `;

        container.appendChild(div);
    });
}
function renderDialogue(dialogue) {

    const container = document.getElementById('dialogueBox');
    if (!container) return;

    container.innerHTML = "";

    dialogue.forEach((line, index) => {

        const div = document.createElement('div');

        div.className = `dial-line ${line.role}`;

        if (index === 0) div.classList.add("revealed");

        div.innerHTML = `
      <span class="speaker ${line.role}">${line.speaker}</span>
      <div class="ar-text">${line.ar}</div>
      <div class="zh-text">${line.zh}</div>
    `;

        // Newly built dialogue translation must reflect the current toggle state.
        const zhText = div.querySelector('.zh-text');
        if (zhText && document.getElementById('translateToggleBtn')?.classList.contains('active')) {
            zhText.classList.add('show');
        }

        container.appendChild(div);
    });
}

// ================================================================
// *** 6. UI CONTROLS - تحكمات الواجهة - 界面控制
// ================================================================

// ===== Font control - التحكم بالخط - 字体控制 =====

function increaseArabicFont() { changeFont('ar', 2) }
function decreaseArabicFont() { changeFont('ar', -2) }
function increaseChineseFont() { changeFont('zh', 2) }
function decreaseChineseFont() { changeFont('zh', -2) }

// ===== Translation toggle =====
let transShown = false;
function toggleTranslation() {
    transShown = !transShown;
    document.querySelectorAll('.zh-text').forEach(el => {
        if (transShown) el.classList.add('show');
        else el.classList.remove('show');
    });
    const btn = document.getElementById('transBtn');
    if (btn) btn.classList.toggle('active', transShown);
}

// ===== Theme =====
// A theme switch is a state change, not a component interaction.  The short
// guard freezes visual transitions only while CSS variables are recalculated,
// then restores every hover/focus/feedback transition on the next paint.
const ThemeTransition = {
    releaseFrame: 0,

    apply(isDark) {
        const root = document.documentElement;
        root.classList.add('theme-switching');

        if (isDark) {
            root.setAttribute('data-theme', 'dark');
        } else {
            root.removeAttribute('data-theme');
        }

        if (this.releaseFrame) {
            cancelAnimationFrame(this.releaseFrame);
        }

        requestAnimationFrame(() => {
            this.releaseFrame = requestAnimationFrame(() => {
                root.classList.remove('theme-switching');
                this.releaseFrame = 0;
            });
        });
    }
};

function toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const nextIsDark = !isDark;
    ThemeTransition.apply(nextIsDark);

    const btn = document.getElementById('themeBtn');
    if (btn) btn.textContent = nextIsDark ? '☀️' : '🌙';
}

// ===== Focus mode =====
let focusMode = false;
function toggleFocus() {
    focusMode = !focusMode;
    document.body.classList.toggle('focus-mode', focusMode);
    const btn = document.getElementById('focusBtn');
    if (btn) btn.classList.toggle('active', focusMode);
    // عند الإطفاء اليدوي، أوقف نظام التركيز التلقائي مؤقتاً
    if (!focusMode && AutoFocus.enabled) {
        AutoFocus.deactivate(true);
    }
}

// ================================================================
// *** 7. AUTO FOCUS - التركيز التلقائي - 自动专注
// ================================================================
const AutoFocus = {
    enabled: false,          // معطّل افتراضياً
    idleDelay: 30000,        // 30 ثانية
    idleTimer: null,
    isActive: false,         // هل الوضع مفعّل حالياً؟
    suppressedUntil: 0,      // إيقاف مؤقت بعد إلغاء يدوي
    // نسبة "نافذة القراءة" من ارتفاع الشاشة (35% = شريط مريح للعين في الوسط)
    readingWindowHeight: 0.35,

    init() {
        // إنشاء overlay التركيز (مخفي افتراضياً)
        this.createOverlay();

        // الأحداث التي تعتبر "تفاعلاً" مع الصفحة
        const interactionEvents = ['mousedown', 'keydown', 'touchstart', 'click'];
        interactionEvents.forEach(evt => {
            window.addEventListener(evt, () => this.onActivity(), { passive: true });
        });

        // mousemove يلغي الوضع (تفاعل صريح)
        window.addEventListener('mousemove', () => this.onActivity(), { passive: true });

        // التمرير لا يلغي الوضع (الطالب يقرأ ويمرر طبيعياً)
        // فقط نُحدّث موضع نافذة التركيز إذا تغير حجم الشاشة
        window.addEventListener('resize', () => {
            if (this.isActive) this.updateOverlayPosition();
        }, { passive: true });

        // ابدأ العد من اللحظة الأولى
        this.resetTimer();
    },

    // ✨ إنشاء overlay مكوّن من شريطين (أعلى وأسفل) يغطيان الجزء غير المركّز
    createOverlay() {
        if (document.getElementById('autoFocusOverlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'autoFocusOverlay';
        overlay.className = 'auto-focus-overlay';
        overlay.setAttribute('aria-hidden', 'true');
        overlay.innerHTML = `
            <div class="afo-mask afo-mask-top"></div>
            <div class="afo-mask afo-mask-bottom"></div>
        `;
        document.body.appendChild(overlay);
        this.overlay = overlay;
    },

    // تحديث ارتفاع الشريط العلوي والسفلي حسب حجم الشاشة
    updateOverlayPosition() {
        if (!this.overlay) return;
        const viewportH = window.innerHeight;
        const windowH = viewportH * this.readingWindowHeight;
        const gapTop = (viewportH - windowH) / 2;
        const gapBottom = (viewportH - windowH) / 2;

        const topMask = this.overlay.querySelector('.afo-mask-top');
        const bottomMask = this.overlay.querySelector('.afo-mask-bottom');
        if (topMask) topMask.style.height = gapTop + 'px';
        if (bottomMask) {
            bottomMask.style.height = gapBottom + 'px';
            bottomMask.style.top = (gapTop + windowH) + 'px';
        }
    },

    onActivity() {
        // إذا كان الوضع مفعلاً، أطفئه فوراً
        if (this.isActive) {
            this.deactivate();
        }
        // أعد ضبط الميقاتي
        this.resetTimer();
    },

    resetTimer() {
        clearTimeout(this.idleTimer);
        if (!this.enabled) return;
        // إذا كان المستخدم قد أوقف الميزة يدوياً مؤخراً، احترم ذلك
        if (Date.now() < this.suppressedUntil) return;
        // إذا كان الوضع اليدوي مفعلاً، لا حاجة للأتوماتيكي
        if (focusMode) return;

        this.idleTimer = setTimeout(() => this.activate(), this.idleDelay);
    },

    activate() {
        // لا تفعّل إذا كان الوضع اليدوي مفعلاً، أو الإعدادات مفتوحة
        if (focusMode) return;
        const settingsOpen = document.getElementById('settingsModal');
        if (settingsOpen && settingsOpen.style.display !== 'none' && settingsOpen.style.display !== '') return;

        this.isActive = true;
        document.body.classList.add('auto-focus-active');
        this.updateOverlayPosition();

        // أظهر إشعاراً خفيفاً
        this.showIndicator();
    },

    deactivate(silent = false) {
        if (!this.isActive && !silent) return;
        this.isActive = false;
        document.body.classList.remove('auto-focus-active');
        this.hideIndicator();
    },

    showIndicator() {
        let indicator = document.getElementById('autoFocusIndicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'autoFocusIndicator';
            indicator.className = 'auto-focus-indicator';
            indicator.innerHTML = `
                <span class="afi-icon">🎯</span>
                <div class="afi-text">
                    <div class="afi-ar">وَضْع التَّرْكِيز</div>
                    <div class="afi-zh">专注模式已启动</div>
                </div>
            `;
            document.body.appendChild(indicator);
        }
        // إعادة تشغيل الأنيميشن
        indicator.classList.remove('show');
        void indicator.offsetWidth; // إجبار reflow
        indicator.classList.add('show');
    },

    hideIndicator() {
        const indicator = document.getElementById('autoFocusIndicator');
        if (indicator) indicator.classList.remove('show');
    },

    // إيقاف مؤقت لمدة دقيقتين بعد الإطفاء اليدوي (احترام لرغبة المستخدم)
    suppress(durationMs = 120000) {
        this.suppressedUntil = Date.now() + durationMs;
        this.deactivate(true);
        clearTimeout(this.idleTimer);
    },

    // ✨ زر التبديل من الـ topbar (تفعيل/إلغاء كامل)
    toggleEnabled() {
        const newState = !this.enabled;
        this.setEnabled(newState);

        // ملاحظات بصرية على الزر
        const btn = document.getElementById('autoFocusToggleBtn');
        if (btn) {
            btn.classList.toggle('active', newState);
            btn.setAttribute('aria-pressed', newState ? 'true' : 'false');
        }

        // مزامنة toggle الإعدادات
        const settingsToggle = document.getElementById('settingsAutoFocusToggle');
        if (settingsToggle) settingsToggle.checked = newState;

        // عرض إشعار قصير بالحالة الجديدة (toast)
        this.showToast(newState);
    },

    // toast صغير يخبر المستخدم بحالة الزر
    showToast(enabled) {
        let toast = document.getElementById('autoFocusToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'autoFocusToast';
            toast.className = 'auto-focus-toast';
            document.body.appendChild(toast);
        }
        toast.innerHTML = enabled
            ? `<span class="aft-icon">✅</span><div class="aft-text"><div class="aft-ar">تَمَّ تَفْعِيل التَّرْكِيز التِّلْقَائِيّ</div><div class="aft-zh">自动专注已启用</div></div>`
            : `<span class="aft-icon">⏸️</span><div class="aft-text"><div class="aft-ar">تَمَّ إِلْغَاء التَّرْكِيز التِّلْقَائِيّ</div><div class="aft-zh">自动专注已停用</div></div>`;
        toast.classList.remove('show');
        void toast.offsetWidth;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2200);
    },

    // تفعيل/إطفاء كامل (من الإعدادات أو الزر)
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.deactivate(true);
            clearTimeout(this.idleTimer);
        } else {
            this.resetTimer();
        }
        try { localStorage.setItem('autoFocusEnabled', enabled ? '1' : '0'); } catch (e) { }

        // مزامنة الزر في الـ topbar
        const btn = document.getElementById('autoFocusToggleBtn');
        if (btn) {
            btn.classList.toggle('active', enabled);
            btn.setAttribute('aria-pressed', enabled ? 'true' : 'false');
        }
    }
};

// تحميل الإعداد المحفوظ + بدء النظام
try {
    const saved = localStorage.getItem('autoFocusEnabled');
    if (saved !== null) AutoFocus.enabled = (saved === '1');
} catch (e) { }

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => AutoFocus.init());
} else {
    AutoFocus.init();
}

// ================================================================
// *** 8. NAVIGATION - التنقل بين الأقسام - 章节导航
// ================================================================
const sections = document.querySelectorAll('.section');
const stages = ['hook', 'thinking', 'vocab', 'reading', 'explain', 'grammar', 'exercises', 'speaking', 'review'];
let currentStageIndex = 0;

window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const total = document.body.scrollHeight - window.innerHeight;
    const progressWrap = document.getElementById('progressBar');
    if (progressWrap) progressWrap.style.width = (scrollTop / total * 100) + '%';
});

function updateStepper(index) {
    if (index < 0 || index >= stages.length) return;
    const currentSection = document.getElementById(stages[index]);
    if (!currentSection) return;

    currentStageIndex = index;
    const name = currentSection.dataset.stageName || 'المُقَدِّمَة';
    const icon = currentSection.dataset.stageIcon || '🎬';

    // Update Desktop Stepper
    const stepItems = document.querySelectorAll('.stepper-desktop .step-item');
    const stepLines = document.querySelectorAll('.stepper-desktop .step-line');

    stepItems.forEach((item, i) => {
        item.classList.remove('completed', 'current', 'upcoming');
        if (i < index) item.classList.add('completed');
        else if (i === index) item.classList.add('current');
        else item.classList.add('upcoming');
    });

    stepLines.forEach((line, i) => {
        if (i < index) line.classList.add('completed');
        else line.classList.remove('completed');
    });

    // Update Mobile Stepper
    const mobileIcon = document.getElementById('mobileStageIcon');
    const mobileName = document.getElementById('mobileStageName');

    if (mobileIcon) mobileIcon.textContent = icon;
    if (mobileName) mobileName.textContent = name;

    const mobileDots = document.querySelectorAll('.mobile-stage-dots .mobile-dot');
    mobileDots.forEach((dot, i) => {
        dot.classList.toggle('current', i === index);
    });

    const prevBtn = document.getElementById('mobilePrevBtn');
    const nextBtn = document.getElementById('mobileNextBtn');
    if (prevBtn) prevBtn.disabled = (index === 0);
    if (nextBtn) nextBtn.disabled = (index === stages.length - 1);

    const tbIcon = document.getElementById('tbIcon');
    if (tbIcon) tbIcon.textContent = icon;
    const tbName = document.getElementById('tbName');
    if (tbName) tbName.textContent = name;
}

let stepperUpdateTimer = null;
function debouncedUpdateStepper(index) {
    clearTimeout(stepperUpdateTimer);
    stepperUpdateTimer = setTimeout(() => {
        updateStepper(index);
    }, 150);
}

function goToStage(index) {
    if (index < 0 || index >= stages.length) return;

    // Build deferred content before calculating its scroll position.
    if (stages[index] === 'vocab') ensureVocabBuilt();
    if (stages[index] === 'reading') ensureReadingBuilt();
    if (stages[index] === 'explain') ensureExplainBuilt();
    if (stages[index] === 'grammar') ensureGrammarBuilt();
    if (stages[index] === 'exercises') ensureExercisesBuilt();

    updateStepper(index); // Immediate update for responsive feel
    const target = document.getElementById(stages[index]);
    if (target) {
        const isMobile = window.innerWidth <= 900;
        const topOffset = isMobile ? 114 : 124;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - topOffset - 20;
        window.scrollTo({ top: targetPosition, behavior: 'smooth' });
    }
}

// Keyboard support
document.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('[role="button"]')) {
        e.target.closest('[role="button"]').click();
    }
});

const currentSectionTitle = document.getElementById('currentSectionTitle');
if (currentSectionTitle) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const name = entry.target.dataset.stageName;
                const icon = entry.target.dataset.stageIcon;
                const index = stages.indexOf(entry.target.id);

                if (index !== -1) debouncedUpdateStepper(index);

                if (name && icon) {
                    const newText = icon + ' ' + name;
                    if (currentSectionTitle.textContent !== newText) {
                        currentSectionTitle.classList.add('fade');
                        setTimeout(() => {
                            currentSectionTitle.textContent = newText;
                            currentSectionTitle.classList.remove('fade');
                        }, 200);
                    }
                }
            }
        });
    }, { rootMargin: '-20% 0px -70% 0px' });

    sections.forEach(s => observer.observe(s));
}

// ================================================================
// *** 9. DIALOGUE - الحوار - 对话交互
// ================================================================
document.querySelectorAll('.dial-line').forEach(l => {
    l.addEventListener('click', () => {
        document.querySelectorAll('.dial-line').forEach(x => x.classList.remove('highlighted'));
        l.classList.add('highlighted');
        const ar = l.querySelector('.ar-text').textContent;
        speakAr(ar);
    });
});

// ================================================================
// *** 10. EXERCISE INTERACTIONS - تفاعل التمارين - 练习交互
// ================================================================

// ===== Vocab =====
function flipVocab(card) { card.classList.toggle('flipped') }
function revealAllVocab() { document.querySelectorAll('.vocab-card').forEach(c => c.classList.add('revealed')) }

// ===== Score tracker =====
let correctCount = 0, wrongCount = 0;

// ===== MCQ =====
function mcq(el, isCorrect) {
    if (el.dataset.answered) return;
    el.dataset.answered = '1';
    el.classList.add(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) { correctCount++; setTimeout(() => el.dataset.answered = '', 2000) }
    else { wrongCount++; setTimeout(() => { el.classList.remove('wrong'); delete el.dataset.answered }, 1500) }
}

// ===== TF =====
function tf(btn, isCorrect) {
    const parent = btn.parentElement;
    if (parent.dataset.answered) return;
    parent.dataset.answered = '1';
    btn.classList.add(isCorrect ? 'correct' : 'wrong');
    if (isCorrect) correctCount++; else wrongCount++;
}

// ===== Fill =====
function checkFill(btn) {
    const ex = btn.closest('.exercise');
    const inputs = ex.querySelectorAll('.fill-input[data-answer]');
    const fb = ex.querySelector('.feedback');
    let all = true;
    inputs.forEach(i => {
        const expected = i.dataset.answer.trim();
        const got = i.value.trim();
        const strip = s => s.replace(/[\u064B-\u0652\u0670]/g, '').trim();
        if (strip(got) === strip(expected)) { i.classList.add('correct'); i.classList.remove('wrong') }
        else { i.classList.add('wrong'); i.classList.remove('correct'); all = false }
    });
    fb.className = 'feedback show ' + (all ? 'success' : 'error');
    fb.innerHTML = all ? '✅ رَائِع! <span class="zh-only">· 太棒了！</span>' : '❌ حَاوِلْ مَرَّة أُخْرَى <span class="zh-only">· 再试一次</span>';
    if (all) correctCount++; else wrongCount++;
}

// ===== Drag and drop classification =====
// CF-2 FIX: event delegation بدلاً من querySelectorAll المباشر
// السبب: .drag-item و .drag-zone لا توجد في DOM عند تحميل الـ script
// بل تُنشأ لاحقاً بواسطة buildDragExercise() — delegation يحل هذه المشكلة
let draggedEl = null;
function initDragClassification() {
    const container = document.getElementById('exercisesContainer');
    if (!container) return;

    container.addEventListener('dragstart', e => {
        const item = e.target.closest('.drag-item');
        if (!item) return;
        draggedEl = item;
        item.classList.add('dragging');
    });

    container.addEventListener('dragend', e => {
        const item = e.target.closest('.drag-item');
        if (!item) return;
        item.classList.remove('dragging');
        draggedEl = null;
    });

    container.addEventListener('dragover', e => {
        const zone = e.target.closest('.drag-zone');
        if (!zone) return;
        e.preventDefault();
        zone.classList.add('hover-over');
    });

    container.addEventListener('dragleave', e => {
        const zone = e.target.closest('.drag-zone');
        if (!zone) return;
        // تجنب إلغاء hover عند التحرك داخل الـ zone نفسها
        if (zone.contains(e.relatedTarget)) return;
        zone.classList.remove('hover-over');
    });

    container.addEventListener('drop', e => {
        const zone = e.target.closest('.drag-zone');
        if (!zone) return;
        e.preventDefault();
        zone.classList.remove('hover-over');
        if (!draggedEl) return;
        if (draggedEl.dataset.cat === zone.dataset.accept) {
            zone.appendChild(draggedEl);
            draggedEl.classList.add('drag-dropped');
            correctCount++;
        } else {
            draggedEl.style.animation = 'shake .4s';
            setTimeout(() => { if (draggedEl) draggedEl.style.animation = ''; }, 400);
            wrongCount++;
        }
    });
}

// ===== Matching =====
let matchSel = null;
function matchPick(el, key) {
    if (el.classList.contains('matched')) return;
    if (!matchSel) { matchSel = { el, key }; el.classList.add('selected'); return }
    if (matchSel.el === el) { el.classList.remove('selected'); matchSel = null; return }
    if (matchSel.key === key) {
        matchSel.el.classList.remove('selected'); matchSel.el.classList.add('matched');
        el.classList.add('matched');
        correctCount++;
    } else {
        var firstEl = matchSel.el;
        var secondEl = el;
        firstEl.classList.remove('selected');
        firstEl.classList.add('wrong'); secondEl.classList.add('wrong');
        setTimeout(() => {
            firstEl.classList.remove('wrong'); secondEl.classList.remove('wrong');
        }, 200);
        setTimeout(() => {
            firstEl.classList.add('wrong'); secondEl.classList.add('wrong');
        }, 400);
        setTimeout(() => {
            firstEl.classList.remove('wrong'); secondEl.classList.remove('wrong');
        }, 600);
        wrongCount++;
    }
    matchSel = null;
}

// ===== Tap select =====
function tapSelect(el, isPlace) {
    if (el.dataset.picked) return;
    el.dataset.picked = '1';
    if (isPlace) { el.classList.add('tap-correct'); correctCount++ }
    else { el.classList.add('tap-wrong'); wrongCount++ }
}

// ===== Sentence order =====
// CF-1 FIX: pool لا يوجد في DOM هنا — يُنشأ لاحقاً بواسطة buildOrderExercise
// نُعرّف دالة تُستدعى بعد inject بدلاً من قراءة getElementById مباشرة
let dragEl = null;
function initOrderPool() {
    const pool = document.getElementById('orderPool');
    if (!pool) return;

    pool.addEventListener('dragstart', e => {
        dragEl = e.target;
        e.target.classList.add('is-dragging');
    });
    pool.addEventListener('dragend', e => {
        e.target.classList.remove('is-dragging');
    });
    pool.addEventListener('dragover', e => {
        e.preventDefault();
        if (!dragEl) return;
        const after = getDragAfter(pool, e.clientX);
        if (!after) pool.appendChild(dragEl);
        else pool.insertBefore(dragEl, after);
    });
}
function getDragAfter(c, x) {
    const items = [...c.querySelectorAll('.order-word:not(.is-dragging)')];
    return items.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = x - box.left - box.width / 2;
        if (offset < 0 && offset > closest.offset) return { offset, element: child };
        return closest;
    }, { offset: -Infinity }).element;
}

// ===== Chip builder =====
function chipPick(el) {
    const out = document.getElementById('builderOut');
    if (out.textContent === '...') out.textContent = '';
    out.textContent = (out.textContent + ' ' + el.textContent).trim();
    el.classList.add('selected');
    setTimeout(() => el.classList.remove('selected'), 500);
}
function clearBuilder() { document.getElementById('builderOut').textContent = '...' }

// ===== Speech =====
function speakAr(text) {
    if (!('speechSynthesis' in window)) {
        alert('متصفحك لا يدعم تشغيل الصوت');
        return;
    }
    const trySpeak = () => {
        const voices = window.speechSynthesis.getVoices();
        const u = new SpeechSynthesisUtterance(text);
        const arVoice = voices.find(v => v.lang.startsWith('ar'));
        if (arVoice) u.voice = arVoice;
        u.lang = 'ar-SA';
        u.rate = 0.85;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
    };
    if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = trySpeak;
    } else {
        trySpeak();
    }
}

function playAudio(element, text) {
    const icon = element.querySelector('.speaker-icon');
    if (icon) icon.textContent = '🔈';
    setTimeout(() => { if (icon) icon.textContent = '🔊'; }, 1500);
    speakAr(text);
}

// ===== Speed challenge =====
// CF-3 FIX: كان IIFE خارج أي try/catch — crash هنا يوقف كامل app.js
// الحل: let مع قيمة افتراضية، تُملأ من initSpeedQs() التي تُستدعى من loadLesson
function initSpeedQs() {
    try {
        if (!LESSON_DATA.vocab || LESSON_DATA.vocab.length < 2) return;
        const vocab = LESSON_DATA.vocab.slice(0, 8);
        speedQs = vocab.map((item, i) => {
            const wrong = LESSON_DATA.vocab
                .filter((_, j) => j !== i)
                .slice(0, 3)
                .map(v => v.ar || '---');
            const opts = [item.ar, ...wrong].sort(() => Math.random() - 0.5);
            return {
                q: '"' + (item.zh || '?') + '" = ؟',
                opts: opts,
                ans: opts.indexOf(item.ar)
            };
        });
    } catch (e) {
        console.warn('initSpeedQs failed:', e.message);
        speedQs = [];
    }
}

let speedIdx = 0, speedScore = 0, speedTimer = null;
function startSpeed() {
    // CF-4 FIX: منع تكرار الـ timer إذا ضغط الطالب Start أكثر من مرة
    if (speedTimer) clearInterval(speedTimer);
    speedIdx = 0; speedScore = 0; let t = 30;
    document.getElementById('speedTimer').textContent = t + ' ث';
    document.getElementById('speedScore').innerHTML = 'النَّتِيجَة <span class="zh-only">· 分数</span>: ٠';
    showSpeedQ();
    speedTimer = setInterval(() => {
        t--;
        document.getElementById('speedTimer').textContent = t + ' ث';
        if (t <= 0) { clearInterval(speedTimer); endSpeed() }
    }, 1000);
}
function showSpeedQ() {
    if (!speedQs.length) {
        document.getElementById('speedQuestion').textContent = 'لا توجد مفردات كافية';
        return;
    }
    const q = speedQs[speedIdx % speedQs.length];
    document.getElementById('speedQuestion').textContent = q.q;
    const opts = document.getElementById('speedOpts');
    opts.innerHTML = '';
    q.opts.forEach((o, i) => {
        const b = document.createElement('button');
        b.className = 'mcq-opt';
        b.innerHTML = '<span class="ar-text">' + o + '</span>';
        b.onclick = () => {
            if (i === q.ans) { speedScore++; correctCount++ } else { wrongCount++ }
            document.getElementById('speedScore').innerHTML = 'النَّتِيجَة <span class="zh-only">· 分数</span>: ' + speedScore;
            speedIdx++; showSpeedQ();
        };
        opts.appendChild(b);
    });
}
function endSpeed() {
    document.getElementById('speedQuestion').innerHTML = '⏱️ اِنْتَهَى الوَقْت! النَّتِيجَة النِّهَائِيَّة: <strong>' + speedScore + '</strong>';
    document.getElementById('speedOpts').innerHTML = '';
}

// ================================================================
// *** 11. SCORE - النتيجة - 得分
// ================================================================
function calcScore() {
    const total = correctCount + wrongCount;
    const pct = total === 0 ? 0 : Math.round(correctCount / total * 100);
    // Convert to Arabic-Indic numerals
    const arPct = pct.toString().replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
    document.getElementById('scoreCircle').textContent = arPct + '٪';
    let stars = '☆☆☆☆☆', title = '!حَاوِلْ مَرَّة أُخْرَى', msg = 'اِسْتَمِرَّ فِي التَّدْرِيب <span class="zh-only">· 继续练习！</span>';
    if (pct >= 90) { stars = '★★★★★'; title = '!مُمْتَاز'; msg = 'رَائِع جِدّاً <span class="zh-only">· 完美！</span>' }
    else if (pct >= 75) { stars = '★★★★☆'; title = '!رَائِع'; msg = 'عَمَلٌ جَيِّد <span class="zh-only">· 干得好！</span>' }
    else if (pct >= 60) { stars = '★★★☆☆'; title = '!جَيِّد'; msg = 'أَحْسَنْتَ <span class="zh-only">· 不错！</span>' }
    else if (pct >= 40) { stars = '★★☆☆☆'; title = '!لَا بَأْس'; msg = 'حَاوِلْ أَكْثَر <span class="zh-only">· 还可以</span>' }
    else if (total > 0) { stars = '★☆☆☆☆'; title = 'حَاوِلْ أَكْثَر'; msg = 'تَدَرَّبْ أَكْثَر <span class="zh-only">· 多试试</span>' }
    document.getElementById('starsDisplay').textContent = stars;
    document.getElementById('scoreTitle').textContent = title;
    const arCorrect = correctCount.toString().replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
    const arWrong = wrongCount.toString().replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
    document.getElementById('scoreMsg').innerHTML = msg + ' (' + arCorrect + ' صَحِيح · ' + arWrong + ' خَطَأ)';
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    updateStepper(0);
});


// ================================================================
// *** 12. SETTINGS - الإعدادات - 设置
// ================================================================
window.openSettingsModal = function () {
    const modal = document.getElementById('settingsModal');
    if (!modal) return;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // مزامنة Toggle Switches
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const themeToggle = document.getElementById('settingsThemeToggle');
    if (themeToggle) themeToggle.checked = isDark;

    const focusToggle = document.getElementById('settingsFocusToggle');
    if (focusToggle) {
        // الـ toggle يعكس الوضع اليدوي فقط (focusMode)، ليس التلقائي
        focusToggle.checked = focusMode;
    }

    const transToggle = document.getElementById('settingsTransToggle');
    if (transToggle) {
        transToggle.checked = TranslationSystem.isActive;
    }
};



window.closeSettingsModal = function () {
    const modal = document.getElementById('settingsModal');
    if (!modal) return;
    modal.style.display = 'none';
    document.body.style.overflow = '';
};

// ربط الأحداث بعد تحميل DOM
window.addEventListener('load', function () {
    // ربط زر الترس
    const openBtn = document.getElementById('openSettingsBtn');
    if (openBtn) {
        openBtn.onclick = function (e) {
            e.preventDefault();
            e.stopPropagation();
            window.openSettingsModal();
        };
    }

    // ربط Toggle Theme
    const themeToggle = document.getElementById('settingsThemeToggle');
    if (themeToggle) {
        themeToggle.onchange = function () {
            if (typeof toggleTheme === 'function') toggleTheme();
        };
    }

    // ربط Toggle Focus
    const focusToggle = document.getElementById('settingsFocusToggle');
    if (focusToggle) {
        focusToggle.onchange = function () {
            // عند الإطفاء اليدوي، أوقف التركيز التلقائي مؤقتاً (دقيقتين) كي لا يعود فوراً
            if (focusMode && !focusToggle.checked) {
                AutoFocus.suppress(120000);
            }
            if (typeof toggleFocus === 'function') toggleFocus();
        };
    }

    // ربط Toggle Auto Focus (التركيز التلقائي)
    const autoFocusToggle = document.getElementById('settingsAutoFocusToggle');
    if (autoFocusToggle) {
        // مزامنة الحالة المحفوظة مع الـ checkbox
        autoFocusToggle.checked = AutoFocus.enabled;
        autoFocusToggle.onchange = function () {
            AutoFocus.setEnabled(autoFocusToggle.checked);
        };
    }

    // ربط Toggle Translation
    const transToggle = document.getElementById('settingsTransToggle');
    if (transToggle) {
        transToggle.onchange = function () {
            TranslationSystem.setActive(transToggle.checked);
        };
    }

    // ربط أزرار حجم الخط العربي مع معاينة حية
    let arPreviewSize = 22;
    const arPreview = document.querySelector('.ar-preview');

    const arDecrease = document.getElementById('arFontDecrease');
    if (arDecrease) {
        arDecrease.onclick = function () {
            if (typeof decreaseArabicFont === 'function') decreaseArabicFont();
            arPreviewSize = Math.max(14, arPreviewSize - 2);
            if (arPreview) arPreview.style.fontSize = arPreviewSize + 'px';
        };
    }

    const arIncrease = document.getElementById('arFontIncrease');
    if (arIncrease) {
        arIncrease.onclick = function () {
            if (typeof increaseArabicFont === 'function') increaseArabicFont();
            arPreviewSize = Math.min(40, arPreviewSize + 2);
            if (arPreview) arPreview.style.fontSize = arPreviewSize + 'px';
        };
    }

    // ربط أزرار حجم الخط الصيني مع معاينة حية
    let cnPreviewSize = 18;
    const cnPreview = document.querySelector('.cn-preview');

    const cnDecrease = document.getElementById('cnFontDecrease');
    if (cnDecrease) {
        cnDecrease.onclick = function () {
            if (typeof decreaseChineseFont === 'function') decreaseChineseFont();
            cnPreviewSize = Math.max(12, cnPreviewSize - 2);
            if (cnPreview) cnPreview.style.fontSize = cnPreviewSize + 'px';
        };
    }

    const cnIncrease = document.getElementById('cnFontIncrease');
    if (cnIncrease) {
        cnIncrease.onclick = function () {
            if (typeof increaseChineseFont === 'function') increaseChineseFont();
            cnPreviewSize = Math.min(36, cnPreviewSize + 2);
            if (cnPreview) cnPreview.style.fontSize = cnPreviewSize + 'px';
        };
    }

    // إغلاق بـ ESC
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('settingsModal');
            if (modal && modal.style.display === 'flex') {
                window.closeSettingsModal();
            }
        }
    });

    console.log('✅ Settings Modal ready');
});

// ================================================================
// *** 13. PRONUNCIATION - النطق - 发音系统
// ================================================================
window.preferredArabicVoice = null;

function loadArabicVoices() {
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return;

    const arabicVoices = voices.filter(v =>
        v.lang.startsWith('ar') || v.name.toLowerCase().includes('arabic')
    );

    if (arabicVoices.length === 0) return;

    // البحث عن صوت رجل عربي
    const malePreferences = ['Majed', 'Tarik', 'Naayf', 'Hamed', 'male'];
    let bestVoice = null;

    for (const pref of malePreferences) {
        bestVoice = arabicVoices.find(v =>
            v.name.toLowerCase().includes(pref.toLowerCase())
        );
        if (bestVoice) break;
    }

    // تجنّب الأصوات النسائية
    if (!bestVoice) {
        const femaleNames = ['hoda', 'salma', 'maryam', 'female'];
        bestVoice = arabicVoices.find(v =>
            !femaleNames.some(f => v.name.toLowerCase().includes(f))
        );
    }

    if (!bestVoice) bestVoice = arabicVoices[0];

    window.preferredArabicVoice = bestVoice;
    console.log('✅ Arabic voice selected:', bestVoice.name);
}

loadArabicVoices();
if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadArabicVoices;
}
setTimeout(loadArabicVoices, 1000);

window.speakVocabWord = function (buttonElement, text) {
    if (!text) return;

    // إيقاف أي نطق سابق
    window.speechSynthesis.cancel();

    // إضافة تأثير بصري
    if (buttonElement) {
        buttonElement.classList.add('speaking');
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.85;
    utterance.pitch = 0.95;
    utterance.volume = 1.0;

    if (window.preferredArabicVoice) {
        utterance.voice = window.preferredArabicVoice;
    }

    utterance.onend = function () {
        if (buttonElement) buttonElement.classList.remove('speaking');
    };

    utterance.onerror = function () {
        if (buttonElement) buttonElement.classList.remove('speaking');
    };

    window.speechSynthesis.speak(utterance);
};

(function () {
    'use strict';

    // ---- Avoid double-init ----
    if (window.__vapInitialized) return;
    window.__vapInitialized = true;

    // ---- Config: per-word seconds used for the seek slider/timer.
    //      (Web Speech API does not expose precise duration, so we use a
    //      stable per-word slot that matches typical pronunciation pacing.) ----
    var SECONDS_PER_WORD = 2.2;

    // ---- State ----
    var playlist = [];          // [{ card, ar }]
    var currentIndex = 0;
    var isPlaying = false;
    var isPaused = false;
    var currentUtterance = null;
    var tickTimer = null;
    var elapsedInWord = 0;      // seconds accumulated in the current word
    var seeking = false;
    var lastTickAt = 0;

    // ---- DOM refs (resolved on init) ----
    var elPlayer, elPlayBtn, elStopBtn, elSlider, elCurTime, elTotalTime, elCurIdx, elTotalIdx;

    function $(sel) { return document.querySelector(sel); }

    function fmtTime(sec) {
        sec = Math.max(0, Math.floor(sec));
        var m = Math.floor(sec / 60);
        var s = sec % 60;
        return m + ':' + (s < 10 ? '0' + s : s);
    }

    function buildPlaylist() {
        playlist = [];
        var cards = document.querySelectorAll('#vocabGrid .vocab-card');
        cards.forEach(function (card) {
            var arEl = card.querySelector('.vocab-ar');
            var ar = arEl ? arEl.textContent.trim() : '';
            if (ar) playlist.push({ card: card, ar: ar });
        });
    }

    function totalSeconds() {
        return playlist.length * SECONDS_PER_WORD;
    }

    function globalElapsed() {
        return currentIndex * SECONDS_PER_WORD + elapsedInWord;
    }

    function updateProgressUI() {
        if (!elSlider) return;
        var total = totalSeconds();
        var elapsed = Math.min(globalElapsed(), total);
        if (!seeking) {
            elSlider.value = String(Math.floor(elapsed));
        }
        var pct = total > 0 ? (elapsed / total) * 100 : 0;
        elSlider.style.setProperty('--vap-progress', pct + '%');
        elCurTime.textContent = fmtTime(elapsed);
        elTotalTime.textContent = fmtTime(total);
        elCurIdx.textContent = String(Math.min(currentIndex + (isPlaying || isPaused ? 1 : 0), playlist.length));
        elTotalIdx.textContent = String(playlist.length);
    }

    function clearHighlights() {
        document.querySelectorAll('.vocab-card.active-speaking').forEach(function (c) {
            c.classList.remove('active-speaking');
        });
    }

    function highlightWord(index) {
        clearHighlights();
        var item = playlist[index];
        if (!item) return;
        item.card.classList.add('active-speaking');
        // Smooth auto-scroll if out of view
        var rect = item.card.getBoundingClientRect();
        var inView = rect.top >= 80 && rect.bottom <= (window.innerHeight - 40);
        if (!inView) {
            try {
                item.card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } catch (e) {
                item.card.scrollIntoView();
            }
        }
    }

    function startTick() {
        stopTick();
        lastTickAt = performance.now();
        tickTimer = setInterval(function () {
            if (!isPlaying || isPaused) return;
            var now = performance.now();
            var dt = (now - lastTickAt) / 1000;
            lastTickAt = now;
            elapsedInWord = Math.min(elapsedInWord + dt, SECONDS_PER_WORD);
            updateProgressUI();
        }, 100);
    }

    function stopTick() {
        if (tickTimer) { clearInterval(tickTimer); tickTimer = null; }
    }

    function speakAt(index) {
        if (index < 0 || index >= playlist.length) { finishAll(); return; }
        currentIndex = index;
        elapsedInWord = 0;

        if (!('speechSynthesis' in window)) return;

        try { window.speechSynthesis.cancel(); } catch (e) { }

        var item = playlist[index];
        var u = new SpeechSynthesisUtterance(item.ar);
        u.lang = 'ar-SA';
        u.rate = 0.85;
        u.pitch = 0.95;
        u.volume = 1.0;
        if (window.preferredArabicVoice) {
            u.voice = window.preferredArabicVoice;
        }
        u.onend = function () {
            if (currentUtterance !== u) return; // stale
            // advance
            elapsedInWord = SECONDS_PER_WORD;
            updateProgressUI();
            if (!isPlaying) return;
            if (currentIndex + 1 >= playlist.length) {
                finishAll();
            } else {
                speakAt(currentIndex + 1);
                highlightWord(currentIndex);
            }
        };
        u.onerror = function () {
            if (currentUtterance !== u) return;
            // try to continue
            if (isPlaying && currentIndex + 1 < playlist.length) {
                speakAt(currentIndex + 1);
                highlightWord(currentIndex);
            } else {
                finishAll();
            }
        };

        currentUtterance = u;
        highlightWord(index);
        window.speechSynthesis.speak(u);
        updateProgressUI();
    }

    function play() {
        buildPlaylist();
        if (playlist.length === 0) return;

        if (isPaused && currentUtterance) {
            // resume from pause
            isPaused = false;
            isPlaying = true;
            try { window.speechSynthesis.resume(); } catch (e) { }
            elPlayer.classList.add('is-playing');
            lastTickAt = performance.now();
            startTick();
            return;
        }

        isPlaying = true;
        isPaused = false;
        elPlayer.classList.add('is-playing');
        if (currentIndex >= playlist.length) currentIndex = 0;
        startTick();
        speakAt(currentIndex);
    }

    function pause() {
        if (!isPlaying) return;
        isPaused = true;
        isPlaying = false;
        try { window.speechSynthesis.pause(); } catch (e) { }
        elPlayer.classList.remove('is-playing');
    }

    function stop() {
        isPlaying = false;
        isPaused = false;
        currentUtterance = null;
        try { window.speechSynthesis.cancel(); } catch (e) { }
        stopTick();
        currentIndex = 0;
        elapsedInWord = 0;
        clearHighlights();
        elPlayer.classList.remove('is-playing');
        updateProgressUI();
    }

    function finishAll() {
        isPlaying = false;
        isPaused = false;
        currentUtterance = null;
        stopTick();
        elPlayer.classList.remove('is-playing');
        // leave last card briefly highlighted, then clear
        setTimeout(clearHighlights, 600);
        currentIndex = playlist.length; // counter shows total
        elapsedInWord = 0;
        updateProgressUI();
        // reset index for next play
        setTimeout(function () { currentIndex = 0; updateProgressUI(); }, 800);
    }

    function seekTo(globalSec) {
        buildPlaylist();
        if (playlist.length === 0) return;
        var idx = Math.floor(globalSec / SECONDS_PER_WORD);
        if (idx < 0) idx = 0;
        if (idx >= playlist.length) idx = playlist.length - 1;
        var wasPlaying = isPlaying || isPaused;
        try { window.speechSynthesis.cancel(); } catch (e) { }
        currentUtterance = null;
        currentIndex = idx;
        elapsedInWord = 0;
        if (wasPlaying) {
            isPlaying = true;
            isPaused = false;
            elPlayer.classList.add('is-playing');
            startTick();
            speakAt(currentIndex);
        } else {
            highlightWord(currentIndex);
            updateProgressUI();
        }
    }

    // The cards can be deferred. Refresh the fixed player UI when they are
    // injected, while playback itself continues to rebuild its playlist on demand.
    window.refreshVocabAudioPlayer = function () {
        buildPlaylist();
        currentIndex = 0;
        elapsedInWord = 0;
        if (!elSlider) return;
        elSlider.max = String(Math.max(1, Math.floor(totalSeconds())));
        updateProgressUI();
    };

    function init() {
        elPlayer = document.getElementById('vocabAudioPlayer');
        if (!elPlayer) return;
        elPlayBtn = document.getElementById('vapPlayBtn');
        elStopBtn = document.getElementById('vapStopBtn');
        elSlider = document.getElementById('vapSlider');
        elCurTime = document.getElementById('vapCurTime');
        elTotalTime = document.getElementById('vapTotalTime');
        elCurIdx = document.getElementById('vapCurIdx');
        elTotalIdx = document.getElementById('vapTotal');

        // ---- Play-button icon: render exactly ONE SVG based on state ----
        var ICON_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
        var ICON_PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>';
        function renderPlayIcon() {
            var playing = elPlayer.classList.contains('is-playing');
            var nextLabel = playing ? 'إيقاف مؤقت' : 'تشغيل';
            // innerHTML REPLACE (never append) → guarantees a single icon
            elPlayBtn.innerHTML = playing ? ICON_PAUSE : ICON_PLAY;
            elPlayBtn.setAttribute('aria-label', nextLabel);
        }
        renderPlayIcon();
        // Keep the icon in sync with every is-playing toggle without
        // touching play/pause/stop/seek logic.
        try {
            new MutationObserver(renderPlayIcon).observe(elPlayer, {
                attributes: true,
                attributeFilter: ['class']
            });
        } catch (e) { /* no-op */ }

        buildPlaylist();
        elSlider.max = String(Math.max(1, Math.floor(totalSeconds())));
        updateProgressUI();

        elPlayBtn.addEventListener('click', function () {
            if (isPlaying) { pause(); } else { play(); }
        });
        elStopBtn.addEventListener('click', stop);

        elSlider.addEventListener('input', function () {
            seeking = true;
            var v = parseFloat(elSlider.value) || 0;
            var pct = totalSeconds() > 0 ? (v / totalSeconds()) * 100 : 0;
            elSlider.style.setProperty('--vap-progress', pct + '%');
            elCurTime.textContent = fmtTime(v);
        });
        elSlider.addEventListener('change', function () {
            var v = parseFloat(elSlider.value) || 0;
            seeking = false;
            seekTo(v);
        });

        // Cleanup on page hide
        window.addEventListener('beforeunload', function () {
            try { window.speechSynthesis.cancel(); } catch (e) { }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

// ================================================================
// *** 14. THEME & TRANSLATION - السمة والترجمة - 主题与翻译
// ================================================================
const ThemeSystem = {
    init() {
        const saved = localStorage.getItem("theme");
        if (saved === "dark") {
            document.documentElement.setAttribute("data-theme", "dark");
        }
        this.updateIcon();
    },

    toggle() {
        const isDark = document.documentElement.getAttribute("data-theme") === "dark";
        const nextIsDark = !isDark;

        ThemeTransition.apply(nextIsDark);
        localStorage.setItem("theme", nextIsDark ? "dark" : "light");
        this.updateIcon();
    },

    updateIcon() {
        const btn = document.getElementById("themeToggleBtn");
        if (!btn) return;

        const isDark = document.documentElement.getAttribute("data-theme") === "dark";

        // If dark → show sun
        btn.textContent = isDark ? "☀️" : "🌙";
    }
};

function changeFont(type, delta) {
    const root = document.documentElement;

    if (type === "ar") {
        let size = parseInt(getComputedStyle(root).getPropertyValue('--ar-font'));
        root.style.setProperty('--ar-font', (size + delta) + 'px');
    }

    if (type === "zh") {
        let size = parseInt(getComputedStyle(root).getPropertyValue('--zh-font'));
        root.style.setProperty('--zh-font', (size + delta) + 'px');
    }
}

function toggleZH() {
    document.querySelectorAll(".zh-text").forEach(el => {
        el.classList.toggle("show");
    });
}

function wrapZh(text) {
    if (!text) return '';
    return text.replace(/(\s*[·=]\s*)?([一-鿿　-〿＀-￯（）！？，。、：；""'']+)/g, function(m, sep, zh) {
        return '<span class="zh-only">' + (sep || '') + zh + '</span>';
    });
}

const TranslationSystem = {
    isActive: false,
    toggle() {
        this.setActive(!this.isActive);
    },
    setActive(state) {
        this.isActive = state;
        document.documentElement.classList.toggle('hide-zh', !state);
        document.querySelectorAll('.zh-text').forEach(el => {
            if (el.closest('.match-item')) return;
            el.classList.toggle('show', state);
        });
        this.updateUI();
    },
    updateUI() {
        const btn = document.getElementById("translateToggleBtn");
        if (btn) btn.classList.toggle("active", this.isActive);
        const settingsToggle = document.getElementById('settingsTransToggle');
        if (settingsToggle) settingsToggle.checked = this.isActive;
    }
};
document.addEventListener("DOMContentLoaded", () => {
    ThemeSystem.init();
    TranslationSystem.updateUI();
});

// ================================================================
// *** 15. DIALOGUE CONTROLS - تحكم الحوار - 对话控制
// ================================================================
function revealNextLine() {
    const lines = document.querySelectorAll('.dial-line');
    if (currentIndex < lines.length) {
        lines[currentIndex].classList.add('revealed');
        currentIndex++;
    }
}

function playRevealedDialogue() {
    const btn = document.getElementById('playDialogueBtn');
    if (!btn) return;

    // pause
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused && dialoguePlaying) {
        window.speechSynthesis.pause();
        btn.innerHTML = '▶️ استمع';
        return;
    }
    // resume
    if (window.speechSynthesis.paused && dialoguePlaying) {
        window.speechSynthesis.resume();
        btn.innerHTML = '🔊 استمع';
        return;
    }

    // start fresh
    dialoguePlaying = false;
    window.speechSynthesis.cancel();
    clearDialogueHighlights();
    dialoguePlaying = true;
    speakDialogueLine(0);
    btn.innerHTML = '🔊 استمع';
}

var dialoguePlayIndex = 0;
var dialogueUtterance = null;
var dialoguePlaying = false;

function clearDialogueHighlights() {
    document.querySelectorAll('.dial-line.active-speaking').forEach(function (el) {
        el.classList.remove('active-speaking');
    });
}

function highlightDialogueLine(index) {
    clearDialogueHighlights();
    var lines = document.querySelectorAll('.dial-line');
    if (lines[index]) {
        lines[index].classList.add('active-speaking');
        var rect = lines[index].getBoundingClientRect();
        if (rect.top < 80 || rect.bottom > window.innerHeight - 40) {
            lines[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}

function speakDialogueLine(index) {
    if (!dialoguePlaying) return;

    var lines = document.querySelectorAll('.dial-line');
    if (index < 0 || index >= lines.length) {
        dialoguePlaying = false;
        var b = document.getElementById('playDialogueBtn');
        if (b) b.innerHTML = '🔊 استمع';
        clearDialogueHighlights();
        return;
    }

    dialoguePlayIndex = index;
    var arEl = lines[index].querySelector('.ar-text');
    var text = arEl ? arEl.textContent.trim() : '';
    if (!text) {
        speakDialogueLine(index + 1);
        return;
    }

    if (!('speechSynthesis' in window)) return;
    try { window.speechSynthesis.cancel(); } catch (e) { }

    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'ar-SA';
    u.rate = 0.85;
    if (window.preferredArabicVoice) {
        u.voice = window.preferredArabicVoice;
    } else {
        var voices = window.speechSynthesis.getVoices();
        var arVoice = voices.find(function (v) { return v.lang.startsWith('ar'); });
        if (arVoice) u.voice = arVoice;
    }

    u.onend = function () {
        if (dialogueUtterance !== u || !dialoguePlaying) return;
        speakDialogueLine(index + 1);
    };
    u.onerror = function () {
        if (dialogueUtterance !== u || !dialoguePlaying) return;
        speakDialogueLine(index + 1);
    };

    dialogueUtterance = u;
    highlightDialogueLine(index);
    window.speechSynthesis.speak(u);
}

function resetDialogue() {
    const lines = document.querySelectorAll('.dial-line');
    lines.forEach(line => line.classList.remove('revealed'));
    currentIndex = 0;
    if (lines.length > 0) {
        lines[0].classList.add('revealed');
        currentIndex = 1;
    }
}

function revealAllDialogue() {
    const lines = document.querySelectorAll('.dial-line');
    lines.forEach(line => line.classList.add('revealed'));
    currentIndex = lines.length;
}
// ================================================================
// *** 16. RENDER FUNCTIONS (cont.) - بقية دوال البناء - 渲染函数续
// ================================================================
// Keep the #vocab shell and player in the DOM, but defer its card payload
// until the learner approaches it or navigates to it directly.
// Declarations intentionally omit later assignments: loadLesson() may run
// before this region is evaluated, and must retain the state it registers.
var vocabLoaded;
var vocabBuilding;
var vocabObserver;
var deferredVocabData;

function ensureVocabBuilt() {
    if (vocabLoaded || vocabBuilding) return vocabLoaded;
    if (!deferredVocabData || !document.getElementById('vocabGrid')) return false;

    vocabBuilding = true;
    try {
        renderVocab(deferredVocabData);
        vocabLoaded = true;
        if (typeof window.refreshVocabAudioPlayer === 'function') {
            window.refreshVocabAudioPlayer();
        }
        if (vocabObserver) {
            vocabObserver.disconnect();
            vocabObserver = null;
        }
        return true;
    } catch (error) {
        console.error('Failed to build vocabulary:', error);
        return false;
    } finally {
        vocabBuilding = false;
    }
}

function setupDeferredVocab(vocab) {
    deferredVocabData = vocab;
    const section = document.getElementById('vocab');
    if (!section || vocabLoaded) return;

    // Support an initial direct URL such as lesson.html#vocab.
    if (window.location.hash === '#vocab') {
        ensureVocabBuilt();
        return;
    }

    if ('IntersectionObserver' in window) {
        vocabObserver = new IntersectionObserver(entries => {
            if (entries.some(entry => entry.isIntersecting)) ensureVocabBuilt();
        }, { rootMargin: '0px' });
        vocabObserver.observe(section);
    } else {
        // Small compatibility fallback for older local browsers.
        const checkProximity = () => {
            if (section.getBoundingClientRect().top <= window.innerHeight + 360) {
                window.removeEventListener('scroll', checkProximity);
                ensureVocabBuilt();
            }
        };
        window.addEventListener('scroll', checkProximity, { passive: true });
        checkProximity();
    }

    window.addEventListener('hashchange', () => {
        if (window.location.hash === '#vocab') ensureVocabBuilt();
    });
}

function renderVocab(vocab) {

    const container = document.getElementById('vocabGrid');
    if (!container) return;

    container.innerHTML = "";

    vocab.forEach(item => {

        const card = document.createElement('div');
        card.className = 'vocab-card';

        card.innerHTML = `
    <div class="vocab-emoji">${item.emoji}</div>
    <div class="vocab-ar">${item.ar}</div>
    <div class="vocab-zh-hidden">${item.zh}</div>
    <div class="vocab-tag">${wrapZh(item.type)}</div>
    <button class="vocab-speak-btn" 
            onclick="event.stopPropagation(); speakVocabWord(this, '${safeAttr(item.ar)}')" 
            aria-label="نطق الكلمة">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 10v4h4l5 5V5L7 10H3zm13.5 2c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
        </svg>
    </button>
`;

        card.onclick = function () {
            card.classList.toggle('flipped');
        };

        container.appendChild(card);
    });
}
function renderThinking(thinking) {

    const container = document.getElementById('thinkingGrid');
    if (!container) return;

    container.innerHTML = "";

    thinking.forEach((q, index) => {

        const div = document.createElement('div');
        div.className = 'q-card';

        div.innerHTML = `
            <span class="q-number">${toArabicNumber(index + 1)}</span>
            <span class="q-emoji">${q.emoji}</span>
            <div class="ar-text">${q.ar}</div>
            <div class="zh-text">${q.zh}</div>
        `;

        container.appendChild(div);
    });
}
// Keep the #explain shell in the DOM, but defer its detail blocks until the
// learner reaches the section or navigates to it directly.
// Declarations omit later assignments because loadLesson() can run early.
var explainLoaded;
var explainBuilding;
var explainObserver;
var deferredExplainData;

function ensureExplainBuilt() {
    if (explainLoaded || explainBuilding) return explainLoaded;
    if (!deferredExplainData || !document.getElementById('explainContainer')) return false;

    explainBuilding = true;
    try {
        renderExplain(deferredExplainData);
        explainLoaded = true;
        if (explainObserver) {
            explainObserver.disconnect();
            explainObserver = null;
        }
        return true;
    } catch (error) {
        console.error('Failed to build explanation:', error);
        return false;
    } finally {
        explainBuilding = false;
    }
}

function setupDeferredExplain(explain) {
    deferredExplainData = explain;
    const section = document.getElementById('explain');
    if (!section || explainLoaded) return;

    // Support an initial direct URL such as lesson.html#explain.
    if (window.location.hash === '#explain') {
        ensureExplainBuilt();
        return;
    }

    if ('IntersectionObserver' in window) {
        explainObserver = new IntersectionObserver(entries => {
            if (entries.some(entry => entry.isIntersecting)) ensureExplainBuilt();
        }, { rootMargin: '0px' });
        explainObserver.observe(section);
    } else {
        // Small compatibility fallback for older local browsers.
        const checkProximity = () => {
            if (section.getBoundingClientRect().top <= window.innerHeight) {
                window.removeEventListener('scroll', checkProximity);
                ensureExplainBuilt();
            }
        };
        window.addEventListener('scroll', checkProximity, { passive: true });
        checkProximity();
    }

    window.addEventListener('hashchange', () => {
        if (window.location.hash === '#explain') ensureExplainBuilt();
    });
}

function renderExplain(explain) {

    const container = document.getElementById('explainContainer');
    if (!container) return;

    container.innerHTML = "";

    explain.forEach(item => {

        const div = document.createElement('div');
        div.className = 'explain-block';

        div.innerHTML = `
            <span class="explain-label">${wrapZh(item.label)}</span>
            <div class="ar-text">${item.ar}</div>
            <div class="zh-text">${item.zh}</div>

            ${item.note ? `<div class="explain-note">${wrapZh(item.note)}</div>` : ''}
        `;

        // Newly built translation text must reflect the current toggle state.
        const zhText = div.querySelector('.zh-text');
        if (zhText && document.getElementById('translateToggleBtn')?.classList.contains('active')) {
            zhText.classList.add('show');
        }

        container.appendChild(div);
    });
}
// Keep the #grammar shell and heading in the DOM, but defer its formulas and
// conjugation grid until the learner reaches the section or navigates to it.
// Declarations omit later assignments because loadLesson() can run early.
var grammarLoaded;
var grammarBuilding;
var grammarObserver;
var deferredGrammarData;

function ensureGrammarBuilt() {
    if (grammarLoaded || grammarBuilding) return grammarLoaded;
    if (!deferredGrammarData || !document.getElementById('grammarContainer')) return false;

    grammarBuilding = true;
    try {
        renderGrammar(deferredGrammarData);
        grammarLoaded = true;
        if (grammarObserver) {
            grammarObserver.disconnect();
            grammarObserver = null;
        }
        return true;
    } catch (error) {
        console.error('Failed to build grammar:', error);
        return false;
    } finally {
        grammarBuilding = false;
    }
}

function setupDeferredGrammar(grammar) {
    deferredGrammarData = grammar;
    const section = document.getElementById('grammar');
    if (!section || grammarLoaded) return;

    // Support an initial direct URL such as lesson.html#grammar.
    if (window.location.hash === '#grammar') {
        ensureGrammarBuilt();
        return;
    }

    if ('IntersectionObserver' in window) {
        grammarObserver = new IntersectionObserver(entries => {
            if (entries.some(entry => entry.isIntersecting)) ensureGrammarBuilt();
        }, { rootMargin: '0px' });
        grammarObserver.observe(section);
    } else {
        // Small compatibility fallback for older local browsers.
        const checkProximity = () => {
            if (section.getBoundingClientRect().top <= window.innerHeight) {
                window.removeEventListener('scroll', checkProximity);
                ensureGrammarBuilt();
            }
        };
        window.addEventListener('scroll', checkProximity, { passive: true });
        checkProximity();
    }

    window.addEventListener('hashchange', () => {
        if (window.location.hash === '#grammar') ensureGrammarBuilt();
    });
}

function renderGrammar(grammar) {

    const container = document.getElementById('grammarContainer');
    if (!container) return;

    container.innerHTML = "";

    grammar.forEach(item => {

        // 🟡 1. إذا فيه جدول (مثل الأرقام)
        if (item.items && Array.isArray(item.items)) {

            const title = document.createElement('h3');
            title.className = 'grammar-title';
            title.innerHTML = wrapZh(item.title || "");

            container.appendChild(title);

            const grid = document.createElement('div');
            grid.className = 'conjugation-grid';

            item.items.forEach(row => {

                const card = document.createElement('div');
                card.className = 'conj-card';

                card.innerHTML = `
                    <div class="conj-pronoun">${row.pronoun || ""}</div>
                    <div class="conj-verb">${row.verb || ""}</div>
                    <div class="conj-zh">${row.zh || ""}</div>
                `;

                grid.appendChild(card);
            });

            container.appendChild(grid);
        }

        // 🟢 2. إذا فيه ar → يعتبر شرح
        else if (item.ar) {

            const div = document.createElement('div');
            div.className = 'formula-box';

            div.innerHTML = `
                <div class="grammar-formula-title">
                    ${wrapZh(item.title || "")}
                </div>
                <div class="formula">
                    ${(() => {
                        const words = item.ar.split(' ');
                        return words.map((word, i) => {
                            const hasQ = word.endsWith('؟') || word.endsWith('?');
                            const clean = hasQ ? word.slice(0, -1) : word;
                            const qMark = hasQ ? '<span class="q-mark">؟</span>' : '';
                            return `
                                <span class="word-card">${clean}</span>${qMark}
                                ${i < words.length - 1 ? '<span class="word-plus">+</span>' : ''}
                            `;
                        }).join('');
                    })()}
                </div>
                <div class="zh-text show grammar-formula-zh">
                    ${item.zh || ""}
                </div>
            `;

            container.appendChild(div);
        }

        // 🔴 3. fallback (لو البيانات غريبة)
        else {

            console.warn("⚠️ عنصر غير معروف في grammar:", item);

            const div = document.createElement('div');
            div.innerHTML = `<pre>${JSON.stringify(item, null, 2)}</pre>`;
            container.appendChild(div);
        }

    });
}
// ================================================================
// *** 17. EXERCISE BUILDERS - بناء التمارين - 练习生成
// ================================================================
// The section itself is always present for navigation and accessibility.  Only
// its large exercise payload is deferred, then built exactly once.
var exercisesLoaded = false;
var exercisesBuilding = false;
var exercisesObserver = null;

function updateExercisesHeading() {
    const count = countExercises();
    const arabicCount = toArabicNumber(count);
    const title = document.getElementById('exercisesTitle');
    const subtitle = document.getElementById('exercisesSubtitle');

    if (title) title.innerText = `التَّدْرِيبَات · ${arabicCount} تَمْرِيناً`;
    if (subtitle) subtitle.innerText = `${count}个练习 · 密集练习`;
}

function ensureExercisesBuilt() {
    if (exercisesLoaded || exercisesBuilding) return exercisesLoaded;
    if (!document.getElementById('exercisesContainer')) return false;

    exercisesBuilding = true;
    try {
        renderExercises();
        exercisesLoaded = true;
        updateExercisesHeading();
        if (exercisesObserver) {
            exercisesObserver.disconnect();
            exercisesObserver = null;
        }
        return true;
    } catch (error) {
        console.error('Failed to build exercises:', error);
        return false;
    } finally {
        exercisesBuilding = false;
    }
}

function setupDeferredExercises() {
    const section = document.getElementById('exercises');
    if (!section || exercisesLoaded) return;

    // Support an initial direct URL such as lesson.html#exercises.
    if (window.location.hash === '#exercises') {
        ensureExercisesBuilt();
        return;
    }

    if ('IntersectionObserver' in window) {
        exercisesObserver = new IntersectionObserver(entries => {
            if (entries.some(entry => entry.isIntersecting)) ensureExercisesBuilt();
        }, { rootMargin: '0px 0px 360px 0px' });
        exercisesObserver.observe(section);
    } else {
        // Small compatibility fallback for older local browsers.
        const checkProximity = () => {
            if (section.getBoundingClientRect().top <= window.innerHeight + 360) {
                window.removeEventListener('scroll', checkProximity);
                ensureExercisesBuilt();
            }
        };
        window.addEventListener('scroll', checkProximity, { passive: true });
        checkProximity();
    }

    window.addEventListener('hashchange', () => {
        if (window.location.hash === '#exercises') ensureExercisesBuilt();
    });
}

function renderExercises() {

    const container = document.getElementById('exercisesContainer');
    if (!container) return;

    if (LESSON_DATA.exercisesHTML) {
        container.innerHTML = LESSON_DATA.exercisesHTML;
        initDragClassification();
        initOrderPool();
        return;
    }

    container.innerHTML = getExercisesHTML();
    // CF-2 FIX: تُستدعى بعد inject لأن .drag-item تُنشأ هنا
    initDragClassification();
    // CF-1 FIX: تُستدعى بعد inject لأن #orderPool تُنشأ هنا
    initOrderPool();
}

// EH: safeExercise — يعزل كل تمرين عن الآخر
// فشل تمرين واحد لا يوقف الباقين — يُظهر placeholder بدلاً من crash
function safeExercise(label, builderFn) {
    try {
        const result = builderFn();
        return (typeof result === 'string') ? result : '';
    } catch (err) {
        console.warn('\u26a0\ufe0f Exercise skipped [' + label + ']:', err.message);
        return '';
    }
}

function getExercisesHTML() {
    let n = 0;
    let h = '';

    // MCQ (يتكرر تلقائياً)
    h += safeExercise('mcq', () =>
        LESSON_DATA.exercises.mcq.map(item => buildMCQExercise(++n, item)).join('\n'));

    // True/False
    h += safeExercise('trueFalse', () => buildTrueFalseExercise(++n));

    // Fill Blanks
    h += safeExercise('fillBlanks', () => buildFillBlanksExercise(++n));

    // Drag Words
    h += safeExercise('dragWords', () => buildDragExercise(++n));

    // Order Words
    h += safeExercise('orderWords', () => buildOrderExercise(++n));

    // Match
    h += safeExercise('match', () => buildMatchExercise(++n));

    // Select Words
    h += safeExercise('selectWords', () => buildSelectWordsExercise(++n));

    // Correct Error
    h += safeExercise('correctError', () => buildCorrectErrorExercise(++n));

    // Rewrite
    h += safeExercise('rewrite', () => buildRewriteExercise(++n));

    // Guided Writing
    h += safeExercise('guidedWriting', () => buildGuidedWritingExercise(++n));

    // Listening
    h += safeExercise('listening', () => buildListeningExercise(++n));

    // Speed Challenge
    h += safeExercise('speedChallenge', () => buildSpeedChallengeExercise(++n));

    // Multi-step
    h += safeExercise('multiStep', () => buildMultiStepExercise(++n));

    // Paragraph
    h += safeExercise('paragraph', () => buildParagraphExercise(++n));

    // Context Analysis
    h += safeExercise('contextAnalysis', () => buildContextAnalysisExercise(++n));

    // Scenario
    h += safeExercise('scenario', () => buildScenarioExercise(++n));

    // Dialogue
    h += safeExercise('dialogueFill', () => buildDialogueExercise(++n));

    // Visual Choice
    h += safeExercise('visualChoice', () => buildVisualChoiceExercise(++n));

    // Conjugation
    h += safeExercise('patternFill', () => buildConjugationExercise(++n));

    // Sentence Transformation
    h += safeExercise('sentenceTransform', () => buildSentenceTransformExercise(++n));

    // Challenge
    h += safeExercise('challenge', () => buildChallengeExercise(++n));

    return h;
}

function buildMatchExercise(num) {
    const vocab = LESSON_DATA.vocab;
    const items = vocab.slice(0, 5);
    const letters = ['a', 'b', 'c', 'd', 'e'];

    const leftCol = items.map((v, i) =>
        `<div class="match-item" onclick="matchPick(this,'${letters[i]}')"><span class="ar-text">${v.ar}</span></div>`
    ).join('\n');

    // الجانب الأيمن بترتيب مختلف
    const shuffled = [items[2], items[0], items[4], items[3], items[1]];
    const shuffledLetters = ['c', 'a', 'e', 'd', 'b'];
    const rightCol = shuffled.map((v, i) =>
        `<div class="match-item" onclick="matchPick(this,'${shuffledLetters[i]}')"><span class="zh-text show">${v.zh}</span></div>`
    ).join('\n');

    return `
<div class="exercise">
  <div class="ex-header"><div class="ex-num">${toArabicNumber(num)}</div><div>
    <div class="ex-title">طَابِقْ بَيْنَ العَرَبِيَّة وَالصِّينِيَّة</div>
    <div class="ex-instruction">配对阿拉伯语和中文</div>
  </div></div>
  <div class="match-grid">
    <div class="match-col" id="matchLeft">${leftCol}</div>
    <div class="match-col" id="matchRight">${rightCol}</div>
  </div>
</div>`;
}

function buildSelectWordsExercise(num) {
    const vocab = LESSON_DATA.vocab;
    const correct = vocab.slice(0, 4);
    const wrong = vocab.slice(4, 8).map(v => ({ ar: v.ar, isCorrect: false }));

    const all = [
        ...correct.map(v => ({ ar: v.ar, isCorrect: true })),
        ...wrong.map(v => ({ ar: v.ar, isCorrect: false }))
    ];

    const chips = all.map(item =>
        `        <span class="chip" onclick="tapSelect(this,${item.isCorrect})">${item.ar}</span>`
    ).join('\n    ');

    return `
<div class="exercise">
  <div class="ex-header"><div class="ex-num">${toArabicNumber(num)}</div><div>
    <div class="ex-title">اِخْتَرِ الكَلِمَات الصَّحِيحَة — ${LESSON_DATA.exercises.selectWords?.title_ar || ""}</div>
    <div class="ex-instruction">${LESSON_DATA.exercises.selectWords?.title_zh || "点击选择正确的词语"}</div>
  </div></div>
  <div class="chip-grid">
    ${chips}
  </div>
</div>`;
}

function buildTrueFalseExercise(num) {
    const items = LESSON_DATA.exercises.trueFalse || [];

    const rows = items.map(item => `
    <div class="tf-item">
      <div class="tf-statement">
        <span class="ar-text">${item.ar}</span>
        <div class="zh-text">${item.zh}</div>
      </div>
      <div class="tf-btns">
        <button class="tf-btn" onclick="tf(this,${item.correct})">✓ صَحِيح</button>
        <button class="tf-btn" onclick="tf(this,${!item.correct})">✗ خَطَأ</button>
      </div>
    </div>`).join('\n');

    return `
<div class="exercise">
  <div class="ex-header"><div class="ex-num">${toArabicNumber(num)}</div><div>
    <div class="ex-title">صَحِيح أَمْ خَطَأ</div>
    <div class="ex-instruction">判断正误</div>
  </div></div>
  <div class="tf-grid">${rows}</div>
</div>`;
}

function buildListeningExercise(num) {
    const listening = LESSON_DATA.exercises.listeningExercise;
    const line = { ar: listening.text };
    const opts = listening.options;

    const letters = ['أ', 'ب', 'ج'];
    const options = opts.map((o, i) =>
        `<div class="mcq-opt" onclick="mcq(this,${o.correct})"><span class="mcq-letter">${letters[i]}</span><span class="ar-text">${o.ar}</span></div>`
    ).join('\n');

    return `
<div class="exercise">
  <div class="ex-header"><div class="ex-num">${toArabicNumber(num)}</div><div>
    <div class="ex-title">اِسْتِمَاع وَاخْتِيَار</div>
    <div class="ex-instruction">听力练习 🔊</div>
  </div></div>
  <div class="exercise-speaker" onclick="playAudio(this,'${line.ar}')">
    <div class="speaker-icon exercise-speaker-icon">🔊</div>
    <div class="exercise-speaker-hint">اِضْغَطْ لِلاسْتِمَاع <span class="zh-only">· 点击播放</span></div>
  </div>
  <div class="mcq-options">${options}</div>
</div>`;
}

function buildConjugationExercise(num) {
    const data = LESSON_DATA.exercises.patternFill;

    const rows = data.lines.map(line =>
        `<div class="fill-sentence">${line.pronoun} <input class="fill-input" data-answer="${line.verb}"> ${line.suffix}</div>`
    ).join('\n');

    return `
<div class="exercise">
  <div class="ex-header"><div class="ex-num">${toArabicNumber(num)}</div><div>
    <div class="ex-title">تَدْرِيبٌ عَلَى النَّمَط</div>
    <div class="ex-instruction">${data.instruction || '句型操练 — 动词变位'}</div>
  </div></div>
  ${rows}
  <button class="check-btn" onclick="checkFill(this)">✓ تَحَقَّقْ <span class="zh-only">· 检查</span></button>
  <div class="feedback"></div>
</div>`;
}

function buildDialogueExercise(num) {
    const lines = LESSON_DATA.exercises.dialogueFill.lines;

    const rows = lines.map(line => {
        const cls = line.text.includes('___') ? 'fill-input fill-input-wide' : '';
        const html = line.text.replace('___',
            `<input class="${cls}" data-answer="${line.answer}">`);
        return `<div class="fill-sentence"><span class="ar-text" style="font-weight:600">${line.speaker}:</span> ${html}</div>`;
    }).join('\n');

    return `
<div class="exercise">
  <div class="ex-header"><div class="ex-num">${toArabicNumber(num)}</div><div>
    <div class="ex-title">أَكْمِلِ الحِوَار</div>
    <div class="ex-instruction">完成对话</div>
  </div></div>
  ${rows}
  <button class="check-btn" onclick="checkFill(this)">✓ تَحَقَّقْ <span class="zh-only">· 检查</span></button>
  <div class="feedback"></div>
</div>`;
}

function buildMCQExercise(num, data) {
    const letters = ['أ', 'ب', 'ج', 'د'];
    const options = data.options.map((opt, i) =>
        `<div class="mcq-opt" onclick="mcq(this,${i === data.correct})"><span class="mcq-letter">${letters[i]}</span><span class="ar-text">${opt}</span></div>`
    ).join('\n');

    return `
<div class="exercise">
  <div class="ex-header"><div class="ex-num">${toArabicNumber(num)}</div><div>
    <div class="ex-title">اِخْتَرِ الإِجَابَة الصَّحِيحَة</div>
    <div class="ex-instruction">选择正确答案</div>
  </div></div>
  ${data.question ? `<div class="fill-sentence">${data.question}</div>` : ''}
  <div class="mcq-options">${options}</div>
</div>`;
}

function buildFillBlanksExercise(num) {
    const items = LESSON_DATA.exercises.fillBlanks;

    const rows = items.map(item => {
        const parts = item.sentence.split('___');
        return `<div class="fill-sentence">${parts[0]}<input class="fill-input" data-answer="${item.answer}">${parts[1] || ''}</div>`;
    }).join('\n');

    return `
<div class="exercise">
  <div class="ex-header"><div class="ex-num">${toArabicNumber(num)}</div><div>
    <div class="ex-title">اِمْلَأِ الفَرَاغ</div>
    <div class="ex-instruction">填空</div>
  </div></div>
  ${rows}
  <button class="check-btn" onclick="checkFill(this)">✓ تَحَقَّقْ <span class="zh-only">· 检查</span></button>
  <div class="feedback"></div>
</div>`;
}

function buildDragExercise(num) {
    const items = LESSON_DATA.exercises.dragWords;

    const dragItems = items.map(item =>
        `<div class="drag-item" draggable="true" data-cat="${item.cat}">${item.ar}</div>`
    ).join('\n');

    return `
<div class="exercise">
  <div class="ex-header"><div class="ex-num">${toArabicNumber(num)}</div><div>
    <div class="ex-title">صَنِّفِ الكَلِمَات</div>
    <div class="ex-instruction">分类 — 拖动单词到正确的类别</div>
  </div></div>
  <div class="drag-source" id="dragSource">
    ${dragItems}
  </div>
    <div class="drag-container">
    ${(LESSON_DATA.exercises.dragZones || []).map(zone =>
        `<div class="drag-zone" data-accept="${zone.accept}"><div class="drag-zone-title">${zone.emoji} ${zone.ar} · ${zone.zh}</div></div>`
    ).join('\n')}
  </div>
</div>`;
}

function buildOrderExercise(num) {
    const words = LESSON_DATA.exercises.orderWords;
    const target = LESSON_DATA.exercises.orderTarget;

    const wordItems = words.map(w =>
        `<div class="order-word" draggable="true">${w}</div>`
    ).join('\n');

    return `
<div class="exercise">
  <div class="ex-header"><div class="ex-num">${toArabicNumber(num)}</div><div>
    <div class="ex-title">رَتِّبِ الجُمْلَة</div>
    <div class="ex-instruction">排序句子</div>
  </div></div>
  <div class="order-target">الهَدَف: <em class="ar-text order-target-em">${target}</em></div>
  <div class="order-container" id="orderPool">
    ${wordItems}
  </div>
  <div class="order-hint">💡 اُسْحَبْ لِلتَّرْتِيب <span class="zh-only">· 拖动排序</span></div>
</div>`;
}

function buildCorrectErrorExercise(num) {
    const data = LESSON_DATA.exercises.correctError;
    const letters = ['أ', 'ب', 'ج', 'د'];

    const options = data.options.map((opt, i) =>
        `<div class="mcq-opt" onclick="mcq(this,${opt.correct})"><span class="mcq-letter">${letters[i]}</span><span class="ar-text">${opt.ar}</span></div>`
    ).join('\n');

    return `
<div class="exercise">
  <div class="ex-header"><div class="ex-num">${toArabicNumber(num)}</div><div>
    <div class="ex-title">صَحِّحِ الخَطَأ</div>
    <div class="ex-instruction">改错 — 找出错误的词</div>
  </div></div>
  <div class="fill-sentence">${data.sentence}</div>
  <div class="mcq-options">${options}</div>
</div>`;
}

function buildRewriteExercise(num) {
    const data = LESSON_DATA.exercises.rewrite;
    const parts = data.sentence.split('___');

    return `
<div class="exercise">
  <div class="ex-header"><div class="ex-num">${toArabicNumber(num)}</div><div>
    <div class="ex-title">أَعِدْ كِتَابَة الجُمْلَة</div>
    <div class="ex-instruction">${data.instruction || "أَعِدْ كِتَابَة الجُمْلَة"}</div>
  </div></div>
  <div class="fill-sentence">${parts[0]}<input class="fill-input" data-answer="${data.answer}">${parts[1] || ''}</div>
  <button class="check-btn" onclick="checkFill(this)">✓ تَحَقَّقْ <span class="zh-only">· 检查</span></button>
  <div class="feedback"></div>
</div>`;
}

function buildParagraphExercise(num) {
    const data = LESSON_DATA.exercises.paragraph;
    const parts = data.sentence.split('___');

    let sentence = '';
    parts.forEach((part, i) => {
        sentence += part;
        if (i < data.answers.length) {
            sentence += `<input class="fill-input" data-answer="${data.answers[i]}">`;
        }
    });

    return `
<div class="exercise">
  <div class="ex-header"><div class="ex-num">${toArabicNumber(num)}</div><div>
    <div class="ex-title">أَكْمِلِ الفِقْرَة</div>
    <div class="ex-instruction">段落填空</div>
  </div></div>
  <div class="fill-sentence">${sentence}</div>
  <button class="check-btn" onclick="checkFill(this)">✓ تَحَقَّقْ <span class="zh-only">· 检查</span></button>
  <div class="feedback"></div>
</div>`;
}

function buildContextAnalysisExercise(num) {
    const data = LESSON_DATA.exercises.contextAnalysis;
    const letters = ['أ', 'ب', 'ج'];

    const options = data.options.map((opt, i) =>
        `<div class="mcq-opt" onclick="mcq(this,${opt.correct})"><span class="mcq-letter">${letters[i]}</span><span class="ar-text">${opt.ar}</span></div>`
    ).join('\n');

    const parts = data.question.split(' · ');
    const questionAr = parts[0] || data.question;
    const questionZh = parts[1] || '';

    return `
<div class="exercise">
  <div class="ex-header"><div class="ex-num">${toArabicNumber(num)}</div><div>
    <div class="ex-title">تَحْلِيل السِّيَاق</div>
    <div class="ex-instruction">情境分析</div>
  </div></div>
  <div class="exercise-context-box">
    <div class="ar-text">${(data.dialogue || '').replace(/\n/g, '<br>')}</div>
  </div>
  <div class="ex-q-card" style="margin-top:14px">
    <div class="ex-q-top">
      <span class="ex-q-badge">❓</span>
      <span class="ex-q-ar">${questionAr}</span>
      <span class="ex-q-zh zh-text">${questionZh}</span>
    </div>
  </div>
  <div class="mcq-options">${options}</div>
</div>`;
}

function buildScenarioExercise(num) {
    const data = LESSON_DATA.exercises.scenario;
    const letters = ['أ', 'ب', 'ج'];

    const options = data.options.map((opt, i) =>
        `<div class="mcq-opt" onclick="mcq(this,${opt.correct})"><span class="mcq-letter">${letters[i]}</span><span class="ar-text">${opt.ar}</span></div>`
    ).join('\n');

    return `
<div class="exercise">
  <div class="ex-header"><div class="ex-num">${toArabicNumber(num)}</div><div>
    <div class="ex-title">سِينَارِيو</div>
    <div class="ex-instruction">情景对话</div>
  </div></div>
    <div class="exercise-scenario-box">
    <div class="ar-text" style="margin-bottom:8px">📋 المَوْقِف <span class="zh-only">· 场景</span></div>
    <div class="ar-text">${data.setup_ar || data.question}</div>
    <div class="zh-text show" style="margin-top:4px">${data.setup_zh || ""}</div>
    <div style="border-top:1px dashed rgba(102,126,234,.3);margin:12px 0"></div>
    <div class="ar-text">❓ ${data.question}</div>
  </div>
  <div class="mcq-options">${options}</div>
</div>`;
}

function buildVisualChoiceExercise(num) {
    const data = LESSON_DATA.exercises.visualChoice;
    const letters = ['أ', 'ب', 'ج'];

    const options = data.options.map((opt, i) =>
        `<div class="mcq-opt" onclick="mcq(this,${opt.correct})"><span class="mcq-letter">${letters[i]}</span><span class="ar-text">${opt.ar}</span></div>`
    ).join('\n');

    return `
<div class="exercise">
  <div class="ex-header"><div class="ex-num">${toArabicNumber(num)}</div><div>
    <div class="ex-title">اِخْتَرْ مِنَ الصُّورَة</div>
    <div class="ex-instruction">视觉推理</div>
  </div></div>
  <div class="visual-emoji">${data.emoji}</div>
  <div class="mcq-options">${options}</div>
</div>`;
}

function buildChallengeExercise(num) {
    const data = LESSON_DATA.exercises.challenge;
    const parts = data.sentence.split('___');

    let sentence = '';
    parts.forEach((part, i) => {
        sentence += part;
        if (i < data.answers.length) {
            sentence += `<input class="fill-input" data-answer="${data.answers[i]}">`;
        }
    });

    return `
<div class="exercise exercise-challenge">
  <div class="ex-header">
    <div class="ex-num ex-num-challenge">${toArabicNumber(num)}</div>
    <div><div class="ex-title">🏆 التَّحَدِّي الكَبِير</div><div class="ex-instruction">终极挑战</div></div>
  </div>
  <div class="zh-text show exercise-context-box">${data.zh}</div>
  <div class="fill-sentence">${sentence}</div>
  <button class="check-btn" onclick="checkFill(this)">✓ تَحَقَّقْ <span class="zh-only">· 检查</span></button>
  <div class="feedback"></div>
</div>`;
}

function buildMultiStepExercise(num) {
    const data = LESSON_DATA.exercises.multiStep;
    const letters = ['أ', 'ب', 'ج'];
    let questions = '';

    data.questions.forEach((q, qi) => {
        const qNum = toArabicNumber(qi + 1);
        questions += `
  <div class="ex-q-card">
    <div class="ex-q-top">
      <span class="ex-q-badge">س${qNum}</span>
      <span class="ex-q-ar">${q.ar}</span>
      <span class="ex-q-zh zh-text">${q.zh}</span>
    </div>
  </div>`;
        questions += `<div class="mcq-options">`;
        q.options.forEach((opt, i) => {
            questions += `<div class="mcq-opt" onclick="mcq(this,${opt.correct})"><span class="mcq-letter">${letters[i]}</span><span class="ar-text">${opt.ar}</span></div>`;
        });
        questions += `</div>`;
    });

    return `
<div class="exercise">
  <div class="ex-header"><div class="ex-num">${toArabicNumber(num)}</div><div>
    <div class="ex-title">${data.title}</div><div class="ex-instruction">${data.instruction}</div>
  </div></div>
  <div class="exercise-story-box">
    <div class="ar-text">${data.story.ar}</div>
    <div class="zh-text">${data.story.zh}</div>
  </div>
  ${questions}
</div>`;
}

function buildGuidedWritingExercise(num) {
    const data = LESSON_DATA.exercises.guidedWriting;

    const rows = data.sentences.map(s =>
        `<div class="fill-sentence">${s.prefix} <input class="fill-input fill-input-wide" placeholder="${s.placeholder}"></div>`
    ).join('\n');

    return `
<div class="exercise">
  <div class="ex-header"><div class="ex-num">${toArabicNumber(num)}</div><div>
    <div class="ex-title">${data.title}</div><div class="ex-instruction">${data.instruction}</div>
  </div></div>
  ${rows}
</div>`;
}

function buildSentenceTransformExercise(num) {
    const data = LESSON_DATA.exercises.sentenceTransform;

    return `
<div class="exercise">
  <div class="ex-header"><div class="ex-num">${toArabicNumber(num)}</div><div>
    <div class="ex-title">${data.title}</div><div class="ex-instruction">${data.instruction}</div>
  </div></div>
  <div class="fill-sentence">${data.sentence}</div>
  <button class="check-btn" onclick="checkFill(this)">✓ تَحَقَّقْ <span class="zh-only">· 检查</span></button>
  <div class="feedback"></div>
</div>`;
}

function buildSpeedChallengeExercise(num) {
    const data = LESSON_DATA.exercises.speedChallenge;

    return `
<div class="exercise">
  <div class="ex-header"><div class="ex-num">${toArabicNumber(num)}</div><div>
    <div class="ex-title">${data.title}</div><div class="ex-instruction">${data.instruction}</div>
  </div></div>
  <div class="speed-controls">
    <button class="btn btn-primary" onclick="startSpeed()">▶ ابْدَأْ <span class="zh-only">· 开始</span></button>
    <div id="speedTimer" class="speed-timer">٣٠ ث</div>
    <div id="speedScore" class="speed-score">النَّتِيجَة: ٠</div>
  </div>
  <div id="speedQuestion" class="speed-question">اِضْغَطْ لِلْبَدْء</div>
  <div id="speedOpts" class="speed-options"></div>
</div>`;
}

function countExercises() {
    const container = document.getElementById('exercisesContainer');
    if (!container) return 0;
    const matches = container.querySelectorAll('.exercise');
    return matches.length;
}

// ================================================================
// *** 18. UTILITIES - أدوات مساعدة - 实用工具
// ================================================================
function toArabicNumber(num) {
    return num.toString().replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]);
}

// HP-2 FIX: تهريب النص داخل onclick attributes لمنع كسر HTML
// apostrophe ' داخل string تكسر: onclick="speakAr('كلمة'مكسورة')"
function safeAttr(str) {
    if (!str) return '';
    return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

// ================================================================
// *** 19. SPEAKING - المحادثة - 口语
// ================================================================
function showTip(ar, zh) {
    const el = document.getElementById('speakTipModal');
    if (el) {
        el.querySelector('.tt-modal-ar').textContent = ar;
        el.querySelector('.tt-modal-zh').textContent = zh;
        el.style.display = 'flex';
    }
}
function closeSpeakTip() {
    const el = document.getElementById('speakTipModal');
    if (el) el.style.display = 'none';
}

function renderSpeaking() {
    const container = document.getElementById('speakingContainer');
    if (!container) return;

    const vocab = LESSON_DATA.vocab;
    const dialogue = LESSON_DATA.dialogue;

    // HP-1 FIX: dialogue[1] يُستخدم مباشرة — crash إذا كان أقل من سطرين
    if (!dialogue || dialogue.length < 2) {
        container.innerHTML = '';
        return;
    }

    // Level 1: استخراج ذكي — يتخطى التحيات ويختار أول جملة رئيسية
    const mainLine = dialogue.find((d, i) => i > 1 && d.ar && !d.ar.includes('السَّلَام')) || dialogue[2] || dialogue[1];
    const level1Text = mainLine.ar;
    const level1Zh = mainLine.zh;

    // Level 2: كلمات البناء — اختيار ذكي يمكن من تكوين جمل صحيحة
    const chipIndices = [0, 1, 2, 3, 4, 5, 9, 13, 14];
    const chipWords = chipIndices.map(i =>
        `<span class="chip" onclick="chipPick(this)">${vocab[i]?.ar || ''}</span>`
    ).filter(w => w).join('\n    ');

    container.innerHTML = `
<div class="speak-level">
  <div class="speak-level-title">🟢 المُسْتَوَى ١ <span class="speak-badge easy">مُوَجَّه <span class="zh-only">· 引导</span></span></div>
  <div class="speak-level-instruction">اِقْرَأْ بِصَوْت عَالٍ <span class="zh-only">· 朗读</span>：</div>
  <div class="ar-text speak-level-ar">${level1Text}</div>
  <div class="zh-text">${level1Zh}</div>
  <button class="btn btn-primary speak-btn" onclick="speakAr('${safeAttr(level1Text)}')">🔊 اِسْتَمِعْ <span class="zh-only">· 听</span></button>
</div>

<div class="speak-level">
  <div class="speak-level-title">🟡 المُسْتَوَى ٢ <span class="speak-badge mid">شِبْه مُوَجَّه <span class="zh-only">· 半引导</span></span></div>
  <div class="speak-level-instruction">اِبْنِ الجُمْلَة <span class="zh-only">· 组句</span>：</div>
  <div id="chipArea" class="speak-chip-area">${chipWords}</div>
  <div class="builder-output" id="builderOut">...</div>
  <button class="btn btn-ghost speak-btn" onclick="clearBuilder()">🔄 مَسْح <span class="zh-only">· 清除</span></button>
</div>

<div class="speak-level">
  <div class="speak-level-title">🔴 المُسْتَوَى ٣ <span class="speak-badge hard">حُرّ <span class="zh-only">· 自由</span></span></div>
  <div class="speak-level-instruction">تَحَدَّثْ بِحُرِّيَّة <span class="zh-only">· 自由发言</span> — اِخْتَرْ مُسْتَوَى الثِّقَة：</div>
  <div class="speak-level-btns">
    <button class="btn btn-ghost" onclick="showTip('ابدأ بالفكرة الرئيسية ثم اشرحها', '从主要想法开始，然后解释它')">😊 وَاثِق</button>
<button class="btn btn-ghost" onclick="showTip('استخدم جملة بسيطة عن الموضوع', '用关于主题的简单句子')">🤔 عَادِيّ</button>
<button class="btn btn-ghost" onclick="showTip('جرب كلمات منفصلة عن الموضوع', '尝试与主题相关的单词')">😅 خَجُول</button>
  </div>
  <div class="speak-level-hint">💡 تلميح: الْفِكْرَة → الشَّرْح → الْخُلَاصَة</div>
</div>`;
}
// ================================================================
// *** 20. TEACHER TOOLS - أدوات المعلم - 教师工具
// ================================================================
const TeacherTools = {
    // الحالة
    panelOpen: false,
    presenterMode: false,
    answersHidden: false,
    timerInterval: null,
    timerSeconds: 0,
    flashcards: [],
    fcIndex: 0,
    fcFlipped: false,
    boardCtx: null,
    boardColor: '#1a1a2e',
    boardSize: 4,
    boardDrawing: false,

    init() {
        // اضبط رقم عشوائي عند البدء
        const numStudentsKey = 'teacherStudentCount';
        // يبقى الزر حاضراً حتى لو لم يضبط المعلم العدد
    },

    // ============ Panel Toggle ============
    togglePanel() {
        this.panelOpen = !this.panelOpen;
        document.getElementById('teacherToolbar').classList.toggle('open', this.panelOpen);
        // أبرز زر الـ topbar
        const topBtn = document.getElementById('teacherToolsBtn');
        if (topBtn) topBtn.classList.toggle('panel-open', this.panelOpen);
    },

    // ============ Presenter Mode (وضع العرض) ============
    togglePresenter() {
        this.presenterMode = !this.presenterMode;
        document.body.classList.toggle('presenter-mode', this.presenterMode);
        // أبرز زر العرض في اللوحة
        document.querySelectorAll('.tt-quick-btn').forEach(b => {
            if (b.getAttribute('onclick') && b.getAttribute('onclick').includes('togglePresenter')) {
                b.classList.toggle('active', this.presenterMode);
            }
        });
        this.toast(this.presenterMode ? '📺 وَضْع العَرْض مُفَعَّل' : '📺 وَضْع العَرْض مُغْلَق',
            this.presenterMode ? '演示模式已启用' : '演示模式已停用');
    },

    // ============ Board Fullscreen (تكبير السبورة) ============
    toggleBoardFullscreen() {
        const card = document.getElementById('boardCardEl');
        const btn = document.getElementById('boardFsBtn');
        if (!card) return;
        const isFs = card.classList.toggle('fullscreen');
        if (btn) btn.classList.toggle('active', isFs);
        // إعادة حساب أبعاد الكانفاس بعد تغيير الحجم
        setTimeout(() => {
            const canvas = document.getElementById('boardCanvas');
            if (canvas && this.boardCtx) {
                // احفظ المحتوى الحالي
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = canvas.width;
                tempCanvas.height = canvas.height;
                tempCanvas.getContext('2d').drawImage(canvas, 0, 0);
                // غيّر الأبعاد
                const rect = canvas.getBoundingClientRect();
                canvas.width = rect.width;
                canvas.height = rect.height;
                this.boardCtx = canvas.getContext('2d');
                this.boardCtx.lineCap = 'round';
                this.boardCtx.lineJoin = 'round';
                // أعد رسم المحتوى مقاساً
                this.boardCtx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
            }
        }, 320);
    },

    // ============ Hide/Show Answers (إخفاء الإجابات) ============
    toggleAnswers() {
        this.answersHidden = !this.answersHidden;
        document.body.classList.toggle('answers-hidden', this.answersHidden);
        const icon = document.getElementById('ttHideIcon');
        const hideBtn = document.getElementById('ttHideBtn');
        const badge = document.getElementById('answersHiddenBadge');

        if (this.answersHidden) {
            if (icon) icon.textContent = '👁️';
            if (hideBtn) hideBtn.classList.add('active');
            if (badge) badge.classList.add('show');
            this.toast('🙈 الإِجَابَات مُخْفَاة', '答案已隐藏');
        } else {
            if (icon) icon.textContent = '🙈';
            if (hideBtn) hideBtn.classList.remove('active');
            if (badge) badge.classList.remove('show');
            this.toast('👁️ الإِجَابَات ظَاهِرَة', '答案已显示');
        }
    },

    // ============ Timer (عداد الوقت) ============
    startTimer(seconds) {
        this.stopTimer();
        this.timerSeconds = seconds;
        this.updateTimerDisplay();
        const display = document.getElementById('ttTimerDisplay');
        if (display) display.classList.add('running');

        this.timerInterval = setInterval(() => {
            this.timerSeconds--;
            this.updateTimerDisplay();
            if (this.timerSeconds <= 0) {
                this.stopTimer();
                this.timerEndAlert();
            }
        }, 1000);
    },

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        const display = document.getElementById('ttTimerDisplay');
        if (display) display.classList.remove('running', 'warning');
    },

    updateTimerDisplay() {
        const display = document.getElementById('ttTimerDisplay');
        if (!display) return;
        const m = Math.floor(this.timerSeconds / 60);
        const s = this.timerSeconds % 60;
        const arabicNum = (n) => {
            const padded = String(n).padStart(2, '0');
            return padded.replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
        };
        display.textContent = `${arabicNum(m)}:${arabicNum(s)}`;
        // تحذير في آخر 10 ثوانٍ
        if (this.timerSeconds <= 10 && this.timerSeconds > 0) {
            display.classList.add('warning');
        }
    },

    timerEndAlert() {
        const display = document.getElementById('ttTimerDisplay');
        if (display) {
            display.textContent = '⏰';
            display.classList.add('finished');
        }
        // صوت تنبيه بسيط (Web Audio API)
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            [800, 1000, 800].forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain); gain.connect(ctx.destination);
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.2);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.2 + 0.15);
                osc.start(ctx.currentTime + i * 0.2);
                osc.stop(ctx.currentTime + i * 0.2 + 0.15);
            });
        } catch (e) { }

        this.toast('⏰ اِنْتَهَى الوَقْت!', '时间到！');
        setTimeout(() => {
            if (display) display.classList.remove('finished');
            display.textContent = '٠٠:٠٠';
        }, 3000);
    },

    // ============ Flashcards (بطاقات المراجعة) ============
    openFlashcards() {
        // اجمع المفردات من lesson.js
        if (typeof LESSON_DATA !== 'undefined' && Array.isArray(LESSON_DATA.vocab)) {
            this.flashcards = LESSON_DATA.vocab;
        } else {
            this.toast('⚠️ لَا تُوجَد مُفْرَدَات', '没有单词');
            return;
        }
        this.fcIndex = 0;
        this.fcFlipped = false;
        this.renderFlashcard();
        document.getElementById('flashcardsModal').classList.add('show');
    },

    closeFlashcards() {
        document.getElementById('flashcardsModal').classList.remove('show');
    },

    renderFlashcard() {
        const card = this.flashcards[this.fcIndex];
        if (!card) return;
        const fc = document.getElementById('flashcardContent');
        if (fc) fc.classList.toggle('flipped', this.fcFlipped);
        document.getElementById('fcEmoji').textContent = card.emoji || '📚';
        document.getElementById('fcAr').textContent = card.ar || '';
        document.getElementById('fcZh').textContent = card.zh || '';
        const arNum = (n) => String(n).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
        document.getElementById('fcCurrent').textContent = arNum(this.fcIndex + 1);
        document.getElementById('fcTotal').textContent = arNum(this.flashcards.length);
    },

    flipCard() {
        this.fcFlipped = !this.fcFlipped;
        const fc = document.getElementById('flashcardContent');
        if (fc) fc.classList.toggle('flipped', this.fcFlipped);
    },

    nextCard() {
        if (this.fcIndex < this.flashcards.length - 1) {
            this.fcIndex++;
            this.fcFlipped = false;
            this.renderFlashcard();
        }
    },

    prevCard() {
        if (this.fcIndex > 0) {
            this.fcIndex--;
            this.fcFlipped = false;
            this.renderFlashcard();
        }
    },

    speakCard() {
        const card = this.flashcards[this.fcIndex];
        if (card && card.ar && typeof speakAr === 'function') {
            speakAr(card.ar);
        }
    },

    // ============ Whiteboard (سبورة سريعة) ============
    openBoard() {
        document.getElementById('boardModal').classList.add('show');
        // ابدأ الكانفاس
        setTimeout(() => this.initBoard(), 100);
    },

    closeBoard() {
        document.getElementById('boardModal').classList.remove('show');
    },

    initBoard() {
        const canvas = document.getElementById('boardCanvas');
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        this.boardCtx = canvas.getContext('2d');
        this.boardCtx.lineCap = 'round';
        this.boardCtx.lineJoin = 'round';

        // أحداث الفأرة
        const startDraw = (e) => {
            this.boardDrawing = true;
            const pos = this.boardGetPos(e, canvas);
            this.boardCtx.beginPath();
            this.boardCtx.moveTo(pos.x, pos.y);
        };
        const draw = (e) => {
            if (!this.boardDrawing) return;
            e.preventDefault();
            const pos = this.boardGetPos(e, canvas);
            this.boardCtx.lineWidth = this.boardSize;
            this.boardCtx.strokeStyle = this.boardColor;
            this.boardCtx.lineTo(pos.x, pos.y);
            this.boardCtx.stroke();
        };
        const stopDraw = () => { this.boardDrawing = false; };

        canvas.onmousedown = startDraw;
        canvas.onmousemove = draw;
        canvas.onmouseup = stopDraw;
        canvas.onmouseleave = stopDraw;
        canvas.ontouchstart = startDraw;
        canvas.ontouchmove = draw;
        canvas.ontouchend = stopDraw;
    },

    boardGetPos(e, canvas) {
        const rect = canvas.getBoundingClientRect();
        const evt = e.touches ? e.touches[0] : e;
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    },

    boardSetColor(color) { this.boardColor = color; },
    boardClear() {
        if (this.boardCtx) {
            const canvas = document.getElementById('boardCanvas');
            this.boardCtx.clearRect(0, 0, canvas.width, canvas.height);
        }
    },

    // ============ Random Student (طالب عشوائي) ============
    randomStudent() {
        // اطلب عدد الطلاب أول مرة فقط
        let count = parseInt(localStorage.getItem('teacherStudentCount') || '0');
        if (!count) {
            const zhPart = TranslationSystem.isActive ? ' · 学生人数？' : '';
            const input = prompt('كَمْ عَدَد الطُّلَّاب؟' + zhPart, '20');
            count = parseInt(input);
            if (!count || count < 1) return;
            localStorage.setItem('teacherStudentCount', count);
        }
        document.getElementById('randomStudentModal').classList.add('show');
        this.spinRandom();
    },

    spinRandom() {
        const count = parseInt(localStorage.getItem('teacherStudentCount') || '20');
        const display = document.getElementById('rsNumber');
        if (!display) return;

        // تأثير تدوير
        let i = 0;
        const spinInterval = setInterval(() => {
            const random = Math.floor(Math.random() * count) + 1;
            display.textContent = String(random).replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
            i++;
            if (i > 15) {
                clearInterval(spinInterval);
                display.classList.remove('spinning');
                display.classList.add('chosen');
                setTimeout(() => display.classList.remove('chosen'), 1000);
            }
        }, 80);
        display.classList.add('spinning');
    },

    // ============ Toast Helper ============
    toast(arText, zhText) {
        let toast = document.getElementById('teacherToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'teacherToast';
            toast.className = 'teacher-toast';
            document.body.appendChild(toast);
        }
        toast.innerHTML = `<div class="tch-ar">${arText}</div><div class="tch-zh">${zhText}</div>`;
        toast.classList.remove('show');
        void toast.offsetWidth;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2200);
    }
};

// تشغيل
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => TeacherTools.init());
} else {
    TeacherTools.init();
}

// ================================================================
// *** 22. SMART FEEDBACK - التغذية الراجعة - 智能反馈
// ================================================================
const SmartFeedback = {
    commonMistakes: LESSON_DATA.smartFeedback || {},

    // تحليل ذكي للإجابة
    analyzeMistake(input, expected, exerciseEl) {
        const inputClean = input.replace(/[\u064B-\u0652\u0670]/g, '').trim();
        const expectedClean = expected.replace(/[\u064B-\u0652\u0670]/g, '').trim();

        // إذا كان الإدخال يطابق خطأً شائعاً
        for (const [wrong, info] of Object.entries(this.commonMistakes)) {
            const wrongClean = wrong.replace(/[\u064B-\u0652\u0670]/g, '').trim();
            const correctClean = info.correct.replace(/[\u064B-\u0652\u0670]/g, '').trim();

            if (inputClean === wrongClean && expectedClean === correctClean) {
                return info;
            }
        }

        // إذا كان الإدخال قريباً جداً (فرق حرف واحد)
        if (this.editDistance(inputClean, expectedClean) === 1) {
            return {
                ar: `💡 قَرِيب جِدّاً! الإِجَابَة الصَّحِيحَة: <strong>${expected}</strong>`,
                zh: `💡 很接近！正确答案：<strong>${expected}</strong>`
            };
        }

        return null;
    },

    // مقياس Levenshtein بسيط
    editDistance(a, b) {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;
        const matrix = [];
        for (let i = 0; i <= b.length; i++) matrix[i] = [i];
        for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) matrix[i][j] = matrix[i - 1][j - 1];
                else matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
            }
        }
        return matrix[b.length][a.length];
    },

    // إنشاء عنصر التغذية الراجعة الذكية
    showSmartHint(exerciseEl, hint) {
        let hintEl = exerciseEl.querySelector('.smart-hint');
        if (!hintEl) {
            hintEl = document.createElement('div');
            hintEl.className = 'smart-hint';
            const fb = exerciseEl.querySelector('.feedback');
            if (fb) fb.parentNode.insertBefore(hintEl, fb.nextSibling);
            else exerciseEl.appendChild(hintEl);
        }
        hintEl.innerHTML = `
            <div class="sh-ar">${hint.ar}</div>
            <div class="sh-zh">${hint.zh}</div>
        `;
        hintEl.classList.add('show');
    },

    hideSmartHint(exerciseEl) {
        const hintEl = exerciseEl.querySelector('.smart-hint');
        if (hintEl) hintEl.classList.remove('show');
    }
};

// ✨ نُغلِّف checkFill الأصلية لإضافة التغذية الراجعة الذكية بدون كسر السلوك
(function () {
    if (typeof checkFill !== 'function') return;
    const originalCheckFill = checkFill;
    window.checkFill = function (btn) {
        const ex = btn.closest('.exercise');
        const inputs = ex.querySelectorAll('.fill-input[data-answer]');

        // افحص أول خطأ ذكي قبل الفحص الأصلي
        let hint = null;
        inputs.forEach(input => {
            const expected = input.dataset.answer.trim();
            const got = input.value.trim();
            var strip2 = s => s.replace(/[\u064B-\u0652\u0670]/g, '').trim();
            if (got && strip2(got) !== strip2(expected)) {
                const found = SmartFeedback.analyzeMistake(got, expected, ex);
                if (found && !hint) hint = found;
            }
        });

        // نفّذ الفحص الأصلي
        originalCheckFill.call(this, btn);

        // أظهر/أخفِ التلميح
        if (hint) {
            SmartFeedback.showSmartHint(ex, hint);
        } else {
            SmartFeedback.hideSmartHint(ex);
        }
    };
})();
