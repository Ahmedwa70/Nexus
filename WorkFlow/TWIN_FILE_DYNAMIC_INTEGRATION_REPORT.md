# TWIN-FILE DYNAMIC INTEGRATION REPORT

**State**: ✅ 100% FINISHED & CLOSED  
**Date**: 2026-06-17  
**Task**: استبدال `activities: []` المضمنة في `data/lesson.js` بنظام ربط ديناميكي (Twin-File Pattern)

---

## Architecture Change

```
Before:                    After:
data/lesson.js             data/lesson.js (pure data JSON, no activities)
└─ activities: [...]   →   └─ activities: [] (placeholder)
                           activity.js (NEW)
                           └─ const ActivityConfig = [...] (22 items, sourceField)
                           bridge.js (rewritten)
                           └─ reads ActivityConfig → resolveData() → LESSON_DATA
```

## Files Changed

### New: `activity.js`
- Contains `const ActivityConfig = [...]` — 22 activity configurations
- Each entry has: `id`, `type`, `icon`, `titleAr`, `titleZh`, `difficulty`, `phase`, `xp`, `sourceField`
- Optional: `limit` (subset data), `data` (for `sourceField: "custom"`)

### Modified: `bridge.js` (rewritten)
- **Removed**: `ACT_DEFS` constant, `const activities = LESSON_DATA.activities`, enrichment loop
- **Added**: `SOURCE_MAP` — 8 transformers for dynamic data resolution
- **Added**: `resolveData(config)` — traverses `LESSON_DATA` by dot-path + applies transformer
- **buildHub()**: now reads directly from `ActivityConfig` instead of `activities.find()` lookups
- **showActivity()**: uses `resolveData(config)` instead of `act.data`
- **buildLessonData()**: builds resolved activities array from `ActivityConfig`

### Modified: `data/lesson.js`
- **Removed**: Section 11 `activities: [...]` (entire 22-item array, ~555 lines removed)
- **Kept**: `activities: []` as empty placeholder (preserves object shape for validators)
- **Result**: pure lesson data JSON — `meta`, `hook`, `thinking`, `vocab`, `dialogue`, `explain`, `grammar`, `exercises`, `smartFeedback`

### Modified: `الدرس.html`
- **Added**: `<script src="activity.js">` between `data/lesson.js` and `js/app.js`
- New load order: `lesson.js` → **`activity.js`** → `app.js` → `validators.js` → `activities/*.js` → `bridge.js`

## SourceField Mapping (22 activities)

### Dynamic (resolved from LESSON_DATA): 11 games

| id | type | sourceField | transformer | limit |
|----|------|-------------|-------------|-------|
| 1 | wheel | `vocab` | `T_wheel` → `{arabic, chinese, emoji}` | 12 |
| 2 | memory | `vocab` | `T_memory` → `{emoji, arabic, chinese}` | 8 |
| 3 | tap-choice | `exercises.mcq` | `T_mcq` (direct passthrough) | — |
| 4 | sound-match | `vocab` | `T_soundMatch` → `{audioText, options, correct}` | 5 |
| 6 | dark-room | `vocab` | `T_vocabSimple` → `{arabic, chinese}` | 6 |
| 7 | sentence-builder | `dialogue` | `T_sentenceBuilder` → `{arabic, chinese, grammarNote}` | — |
| 10 | swipe-quiz | `exercises.trueFalse` | `T_trueFalse` (direct passthrough) | — |
| 12 | speed-reveal | `vocab` | `T_vocabSimple` → `{arabic, chinese}` | 6 |
| 13 | quick-reaction | `vocab` | `T_vocabSingle` → `{arabic}` | 8 |
| 14 | mini-maze | `exercises.mcq` | `T_mcq` (direct passthrough) | — |
| 22 | progressive-story | `dialogue` | `T_progressiveStory` → `{speaker, text, chinese}` | — |

### Custom (data inlined in ActivityConfig): 11 games

| id | type | reason |
|----|------|--------|
| 5 | hidden-reveal | needs curated hints |
| 8 | wechat | complex branching choices |
| 9 | who-am-i | needs curated hints |
| 11 | traffic-light | commands vs negatives classification |
| 15 | dots-hunter | unique spelling exercise format |
| 16 | conjugation-ladder | past/present pairs not derivable |
| 17 | punctuation-editor | punctuation categorization |
| 18 | young-doctor | creative scenario data |
| 19 | health-letter | creative writing prompt |
| 20 | board-game | custom Q&A table |
| 21 | spot-difference | pair comparison data |

## SOURCE_MAP Transformers

All transformers are in `bridge.js` under the `SOURCE_MAP` object:

- **`direct`**: passthrough (respects `config.limit`)
- **`T_wheel`**: maps `vocab[i].ar/zh/emoji` → `{arabic, chinese, emoji}`
- **`T_memory`**: same as wheel but different field order
- **`T_soundMatch`**: generates 3-option multiple choice from vocab with random distractors
- **`T_vocabSimple`**: maps `vocab[i].ar/zh` → `{arabic, chinese}`
- **`T_vocabSingle`**: maps `vocab[i].ar` → `{arabic}`
- **`T_sentenceBuilder`**: maps `dialogue[i].ar/zh` → `{arabic, chinese, grammarNote:''}`
- **`T_progressiveStory`**: maps `dialogue[i].speaker/ar/zh` → `{speaker, text, chinese}`

## Key Design Decisions

1. **فصل البيانات عن التكوين**: `data/lesson.js` = بيانات فقط. `activity.js` = تكوين الأنشطة فقط.
2. **sourceField pattern**: كل لعبة تعرف أين تجد بياناتها في `LESSON_DATA` عبر مسار نقطي.
3. **limit mechanism**: للحد من كمية البيانات المأخوذة (خاصة للمفردات).
4. **Fallback "custom"**: للألعاب التي تحتاج بيانات خاصة غير موجودة في `LESSON_DATA`.
5. **حافظ التوافق**: `window.lessonData` لا يزال يُصدّر نفس الشكل (`activities`, `dialogue`, `vocabulary`, etc.)

## Verification

- ✅ Script order correct: `lesson.js` → `activity.js` → `app.js` → `validators.js` → `activities/*.js` → `bridge.js`
- ✅ No references to `ACT_DEFS` or `LESSON_DATA.activities` in bridge.js
- ✅ `ActivityConfig` has 22 entries (all 22 games)
- ✅ `data/lesson.js` ends at line 627, `activities: []` placeholder only
- ✅ `SOURCE_MAP` has 8 transformers covering all dynamic sourceFields
- ✅ All renderers remain unchanged (`activities/*.js`)
- ✅ XP, stars, hub UI, state persistence, theme sync, confetti preserved

## File Sizes

| File | Before | After | Delta |
|------|--------|-------|-------|
| `data/lesson.js` | 1180 lines | 627 lines | **-553 lines** |
| `activity.js` | — | 266 lines | **+266 lines** (NEW) |
| `bridge.js` | 473 lines | 437 lines | -36 lines (rewritten) |
| `الدرس.html` | 27 script tags | 28 script tags | **+1 tag** |

## Future Enhancements

- إضافة `filterType` و `filterCat` لتصفية المفردات حسب النوع (اسم/فعل/صفة)
- إمكانية إضافة `shuffle: true` لخلط البيانات عشوائياً
- إعادة توليد `AI_GENERATION_PACK.md` ليعكس الـ Twin-File Pattern
- توليد دليل درس جديد يقرأ `ActivityConfig` بدلاً من `activities` المضمنة
