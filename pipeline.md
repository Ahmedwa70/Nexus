# Pipeline — dark-room Activity Rewrite

## Overview
Full replacement of Canvas-based rendering with DOM/CSS for the `dark-room` activity in the Arabic lesson app. All changes are scoped to `lesson v0.6_Arabic Claude_now_opencode/`.

---

## Files Modified

| File | Lines | Change |
|------|-------|--------|
| `activities/dark-room.js` | ~315 | Canvas → DOM/CSS rewrite |
| `css/activities.css` | ~340 | Added ~60 lines of dark-room CSS |
| `bridge.js` | 547 | Added `SOURCE_MAP['dark-room']` entry (line 60) |

---

## Change Log (chronological)

### 1. dark-room.js — Full rewrite (Canvas → DOM/CSS)
**What**: Replaced `<canvas>` with `<div>`-based DOM elements.  
**Why**: Canvas cannot do CSS `mix-blend-mode`, text selection, or responsive layout.  
**Key structural changes**:
- `guess()` → `handleChoice()`
- Render: `div.dark-room-container > div.dark-room-word` × N
- Overlay: `div.dark-room-overlay` with `radial-gradient` background
- Event: `canvas.onpointermove` → `container.onpointermove` (throttled)

### 2. Spotlight mechanism — logic inverse (3 iterations)
| Iteration | Center | Text color | Problem |
|-----------|--------|------------|---------|
| 1 | Solid white circle | (any) | Text invisible in center |
| 2 | Transparent (CSS gradient) | White | `mix-blend-mode: difference` made text invisible against overlay |
| 3 ✅ | **Transparent center** | **Black** | Text fully visible inside spotlight, invisible outside — correct behavior |

**Final formula**: `radial-gradient(circle 100px at Xpx Ypx, transparent 50%, rgba(0,0,0,0.97) 65%)`

### 3. Z-index layering
- `overlay` → `z-index: 1`
- `wordEl` → `z-index: 2`
- Words sit **above** the overlay so pointer events reach them

### 4. Font size
- `body .dark-room-word { font-size: 32px !important; }`
- Increased from 24px → 32px for Arabic readability

### 5. Animation speed
- Pointer-move throttle: 100ms → **50ms**
- Smoother spotlight tracking on fast mouse movement

### 6. Reveal persistence on mouseleave
- Last spotlight position is **retained** (no reset to center)
- Student can continue reading the last-revealed word

### 7. Removed `runtime.reward()`
- Deleted the sole call inside the guess handler
- `reward()` is a legacy no-op API; removing it makes code honest

### 8. CSS gradient refinement
- Hard stop at **50%** → soft blur to **65%**
- Crisp readable center with smooth falloff to darkness

### 9. `bridge.js` — SOURCE_MAP entry
```js
'dark-room': function(vocab, config) {
  return (config.limit ? vocab.slice(0, config.limit) : vocab).map(function(v) {
    return { arabic: v.ar || v.arabic || '', chinese: v.zh || v.chinese || '' };
  });
},
```

### 10. `runtime.speak()` integration
- Clicking a revealed word → `runtime.speak(arabicText)`
- Click handler on each `wordEl`
- Students can hear pronunciation on demand

### 11. CSS hardening with `!important`
- All dark-room CSS rules use `!important`
- Ensures precedence without restructuring stylesheet load order

### 12. `DARK_ROOM_ANALYSIS.md` — Architecture report
- Written to `WorkFlow/DARK_ROOM_ANALYSIS.md`
- Covers: architecture, data flow, design decisions, lesson system integration

---

## Current State ✅
- All planned changes are implemented
- Files are syntactically valid
- No runtime testing performed yet (requires lesson server environment)

## Not Yet Done
- Live testing with a real lesson JSON load
- End-to-end validation of the spotlight UX on actual Arabic text
