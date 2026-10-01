// activity.js — Activity Configuration (Twin-File Pattern)
// Defines 22 interactive activity configs with sourceField mapping.
// Does NOT contain lesson content — only configuration.
// ============================================================
const ActivityConfig = [

  // ════════════════════════════════════════════
  // P1 — Phase 1: Vocabulary & Listening (id:1–6)
  // ════════════════════════════════════════════

  // ── 1. wheel ──
  { id:1,  type:"wheel",                icon:"🎰", titleAr:"عجلة الحظ",          titleZh:"幸运转盘",     difficulty:1, phase:1, xp:10, sourceField:"vocab",       limit:12 },

  // ── 2. memory ──
  { id:2,  type:"memory",               icon:"🧠", titleAr:"بطاقات الذاكرة",      titleZh:"记忆卡片",     difficulty:1, phase:1, xp:10, sourceField:"vocab",       limit:8 },

  // ── 3. tap-choice ──
  { id:3,  type:"tap-choice",           icon:"👆", titleAr:"اختيار سريع",        titleZh:"快速选择",     difficulty:1, phase:1, xp:10, sourceField:"exercises.mcq" },

  // ── 4. sound-match ──
  { id:4,  type:"sound-match",          icon:"🔊", titleAr:"تطابق الصوت",        titleZh:"声音匹配",     difficulty:1, phase:1, xp:10, sourceField:"vocab",       limit:5 },

  // ── 5. hidden-reveal ──
  { id:5,  type:"hidden-reveal",        icon:"🔦", titleAr:"الكشف المخفي",       titleZh:"隐藏揭示",     difficulty:1, phase:1, xp:10, sourceField:"exercises.customHiddenReveal" },

  // ── 6. dark-room ──
  { id:6,  type:"dark-room",            icon:"💡", titleAr:"غرفة مظلمة",         titleZh:"暗室探索",     difficulty:2, phase:1, xp:20, sourceField:"vocab",       limit:6 },

  // ════════════════════════════════════════════
  // P2 — Phase 2: Grammar & Conversation (id:7–10)
  // ════════════════════════════════════════════

  // ── 7. sentence-builder ──
  { id:7,  type:"sentence-builder",     icon:"✍️", titleAr:"بناء الجملة",        titleZh:"句子构建",     difficulty:2, phase:2, xp:20, sourceField:"dialogue" },

  // ── 8. wechat ──
  { id:8,  type:"wechat",               icon:"💬", titleAr:"محادثة وي‌تشات",    titleZh:"微信对话",     difficulty:2, phase:2, xp:20, sourceField:"exercises.customWechat" },

  // ── 9. who-am-i ──
  { id:9,  type:"who-am-i",             icon:"🎭", titleAr:"مَن أنا؟",           titleZh:"我是谁？",     difficulty:2, phase:2, xp:20, sourceField:"exercises.customWhoAmI" },

  // ── 10. swipe-quiz ──
  { id:10, type:"swipe-quiz",           icon:"↔️", titleAr:"تمرير الصح/الخطأ",   titleZh:"左右滑动",     difficulty:2, phase:2, xp:20, sourceField:"exercises.trueFalse" },

  // ════════════════════════════════════════════
  // P3 — Phase 3: Conjugation & Quick Games (id:11–14)
  // ════════════════════════════════════════════

  // ── 11. traffic-light ──
  { id:11, type:"traffic-light",        icon:"🚦", titleAr:"إشارة الأمر والنهي", titleZh:"命令禁止",     difficulty:3, phase:3, xp:30, sourceField:"custom",
    data:[
      { arabic:"اِحْمِل الخَيْمَة", type:"command", chinese:"带上帐篷！（命令）" },
      { arabic:"لَا تُشْعِل النَّارَ فِي الغَابَة", type:"negative", chinese:"别在森林里生火！（禁止）" },
      { arabic:"اصْطَد السَّمَكَ", type:"command", chinese:"去钓鱼！（命令）" },
      { arabic:"لَا تَذْهَب بَعِيداً عَنِ المُخَيَّم", type:"negative", chinese:"别走远离营地！（禁止）" },
      { arabic:"اِمْشِ فِي الطَّبِيعَة", type:"command", chinese:"在大自然中散步！（命令）" },
      { arabic:"لَا تَتْرُك القُمَامَةَ فِي البَرّ", type:"negative", chinese:"别在野外留垃圾！（禁止）" }
    ]},

  // ── 12. speed-reveal ──
  { id:12, type:"speed-reveal",         icon:"⚡", titleAr:"كشف السرعة",         titleZh:"速度揭示",     difficulty:3, phase:3, xp:30, sourceField:"vocab",       limit:6 },

  // ── 13. quick-reaction ──
  { id:13, type:"quick-reaction",       icon:"🏃", titleAr:"ردود فعل سريعة",    titleZh:"快速反应",     difficulty:3, phase:3, xp:30, sourceField:"vocab",       limit:8 },

  // ── 14. mini-maze ──
  { id:14, type:"mini-maze",            icon:"🧭", titleAr:"متاهة صغيرة",        titleZh:"小迷宫",       difficulty:3, phase:3, xp:30, sourceField:"exercises.mcq" },

  // ════════════════════════════════════════════
  // P4 — Phase 4: Production & Assessment (id:15–22)
  // ════════════════════════════════════════════

  // ── 15. dots-hunter ──
  { id:15, type:"dots-hunter",          icon:"💧", titleAr:"صائد النقاط",        titleZh:"点猎手",       difficulty:4, phase:4, xp:40, sourceField:"custom",
    data:[
      { base:"الخَيْمَ_", correctLetter:"ة", fullWord:"الخَيْمَة", reason:"الخَيْمَة = اِسْم مُؤَنَّث يَنْتَهِي بِالتَّاء الْمَرْبُوطَة" },
      { base:"الطَّبِيعَ_", correctLetter:"ة", fullWord:"الطَّبِيعَة", reason:"الطَّبِيعَة = اِسْم مُؤَنَّث يَنْتَهِي بِالتَّاء الْمَرْبُوطَة" },
      { base:"الغَابَ_", correctLetter:"ة", fullWord:"الغَابَة", reason:"الغَابَة = اِسْم مُؤَنَّث يَنْتَهِي بِالتَّاء الْمَرْبُوطَة" },
      { base:"العُطْلَ_", correctLetter:"ة", fullWord:"العُطْلَة", reason:"العُطْلَة = اِسْم مُؤَنَّث يَنْتَهِي بِالتَّاء الْمَرْبُوطَة" }
    ]},

  // ── 16. conjugation-ladder ──
  { id:16, type:"conjugation-ladder",   icon:"🧗", titleAr:"سلّم التصريف",       titleZh:"变位阶梯",     difficulty:4, phase:4, xp:40, sourceField:"custom",
    data:[
      { past:"فَضَّلَ", present:"يُفَضِّلُ" },
      { past:"فَضَّلْتُ", present:"أُفَضِّلُ" },
      { past:"فَضَّلْتَ", present:"تُفَضِّلُ" },
      { past:"فَضَّلْتِ", present:"تُفَضِّلِينَ" },
      { past:"فَضَّلَتْ", present:"تُفَضِّلُ" }
    ]},

  // ── 17. punctuation-editor ──
  { id:17, type:"punctuation-editor",   icon:"✏️", titleAr:"المحرر الصحفي",      titleZh:"标点编辑",     difficulty:4, phase:4, xp:40, sourceField:"custom",
    data:[
      { text:"أُفَضِّلُ التَّخْيِيمَ عَلَى الشَّاطِئ", correctMark:"." },
      { text:"أَيْنَ تُفَضِّلُ التَّخْيِيم", correctMark:"؟" },
      { text:"هَلْ تُحِبِّينَ التَّخْيِيم", correctMark:"؟" },
      { text:"مَا أَجْمَلَ الطَّبِيعَة", correctMark:"!" },
      { text:"نَحْمِلُ الطَّعَامَ مِنَ البَيْت", correctMark:"." }
    ]},

  // ── 18. young-doctor ──
  { id:18, type:"young-doctor",         icon:"👨‍⚕️", titleAr:"الطبيب الصغير",   titleZh:"小医生",     difficulty:4, phase:4, xp:40, sourceField:"exercises.customYoungDoctor" },

  // ── 19. health-letter ──
  { id:19, type:"health-letter",        icon:"📝", titleAr:"رسالة صحية",         titleZh:"健康信件",     difficulty:4, phase:4, xp:40, sourceField:"exercises.customHealthLetter" },

  // ── 20. board-game ──
  { id:20, type:"board-game",           icon:"🎲", titleAr:"لعبة اللوحة",        titleZh:"棋盘游戏",     difficulty:5, phase:4, xp:50, sourceField:"custom",
    data:[
      { num:3,  question:"مَا مَعْنَى التَّخْيِيم؟", answer:"الإِقَامَة فِي خَيْمَة فِي البَرّ", type:"vocab" },
      { num:7,  question:"أَيْنَ تُفَضِّلُ لَيْلَى التَّخْيِيم؟", answer:"عَلَى شَاطِئِ البَحْر", type:"vocab" },
      { num:10, question:"هَاتِ جَمْع خَيْمَة", answer:"خِيَام", type:"spelling" },
      { num:14, question:"اخْتَر العَلَامَة: أَيْنَ تُفَضِّلُ التَّخْيِيم__", answer:"؟", type:"punctuation" },
      { num:18, question:"صَرِّف الفِعْل فَضَّلَ مَع الضَّمِير هِيَ", answer:"تُفَضِّلُ", type:"conjugation" },
      { num:22, question:"مَاذَا تَفْعَلُ لَيْلَى فِي المُخَيَّم؟", answer:"تَصْطَادُ السَّمَكَ وَتَمْشِي", type:"vocab" },
      { num:25, question:"مَا عَكْس البَرّ؟", answer:"البَحْر", type:"vocab" },
      { num:29, question:"مَاذَا يَحْمِلُ النَّاسُ إِلَى المُخَيَّم؟", answer:"الطَّعَام", type:"vocab" }
    ]},

  // ── 21. spot-difference ──
  { id:21, type:"spot-difference",      icon:"🔍", titleAr:"ابحث عن الفرق",      titleZh:"找不同",       difficulty:3, phase:4, xp:30, sourceField:"custom",
    data:[
      { sentenceA:"لَيْلَى تُفَضِّلُ التَّخْيِيمَ عَلَى الشَّاطِئ", sentenceB:"لَيْلَى تُفَضِّلُ التَّخْيِيمَ فِي الغَابَة", keyword:"الشَّاطِئ ≠ الغَابَة" },
      { sentenceA:"سَامِي يَصْطَادُ السَّمَكَ فِي البَحْر", sentenceB:"سَامِي يَصْطَادُ السَّمَكَ فِي النَّهْر", keyword:"البَحْر ≠ النَّهْر" },
      { sentenceA:"نَحْمِلُ الطَّعَامَ مِنَ البَيْت", sentenceB:"نَحْمِلُ الطَّعَامَ مِنَ السُّوق", keyword:"البَيْت ≠ السُّوق" },
      { sentenceA:"المُخَيَّمُ بَيْنَ الجِبَال", sentenceB:"المُخَيَّمُ عَلَى الشَّاطِئ", keyword:"الجِبَال ≠ الشَّاطِئ" }
    ]},

  // ── 22. progressive-story ──
  { id:22, type:"progressive-story",    icon:"📖", titleAr:"قصة تدريجية",        titleZh:"逐步故事",     difficulty:2, phase:4, xp:20, sourceField:"dialogue" }
];
