// activity.js — Activity Configuration (Twin-File Pattern)
// Defines 22 interactive activity configs with sourceField mapping.
// Does NOT contain lesson content — only configuration.
// (2026-10-02) أُخرج آخر محتوى درس كان مدفوناً هنا في ستة أنشطة:
// 11 و15 و16 و17 و20 و21. كلها تقرأ الآن من lesson.js كبقية الأنشطة.
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
  { id:11, type:"traffic-light",        icon:"🚦", titleAr:"إشارة الأمر والنهي", titleZh:"命令禁止",     difficulty:3, phase:3, xp:30, sourceField:"exercises.customTrafficLight" },

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
  { id:15, type:"dots-hunter",          icon:"💧", titleAr:"صائد النقاط",        titleZh:"点猎手",       difficulty:4, phase:4, xp:40, sourceField:"exercises.customDotsHunter" },

  // ── 16. conjugation-ladder ──
  { id:16, type:"conjugation-ladder",   icon:"🧗", titleAr:"سلّم التصريف",       titleZh:"变位阶梯",     difficulty:4, phase:4, xp:40, sourceField:"exercises.customConjugationLadder" },

  // ── 17. punctuation-editor ──
  { id:17, type:"punctuation-editor",   icon:"✏️", titleAr:"المحرر الصحفي",      titleZh:"标点编辑",     difficulty:4, phase:4, xp:40, sourceField:"exercises.customPunctuation" },

  // ── 18. young-doctor ──
  { id:18, type:"young-doctor",         icon:"👨‍⚕️", titleAr:"الطبيب الصغير",   titleZh:"小医生",     difficulty:4, phase:4, xp:40, sourceField:"exercises.customYoungDoctor" },

  // ── 19. health-letter ──
  { id:19, type:"health-letter",        icon:"📝", titleAr:"رسالة صحية",         titleZh:"健康信件",     difficulty:4, phase:4, xp:40, sourceField:"exercises.customHealthLetter" },

  // ── 20. board-game ──
  { id:20, type:"board-game",           icon:"🎲", titleAr:"لعبة اللوحة",        titleZh:"棋盘游戏",     difficulty:5, phase:4, xp:50, sourceField:"exercises.customBoardGame" },

  // ── 21. spot-difference ──
  { id:21, type:"spot-difference",      icon:"🔍", titleAr:"ابحث عن الفرق",      titleZh:"找不同",       difficulty:3, phase:4, xp:30, sourceField:"exercises.customSpotDifference" },

  // ── 22. progressive-story ──
  { id:22, type:"progressive-story",    icon:"📖", titleAr:"قصة تدريجية",        titleZh:"逐步故事",     difficulty:2, phase:4, xp:20, sourceField:"dialogue" }
];
