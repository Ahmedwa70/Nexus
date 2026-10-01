// ============================================================
// validators.js — Runtime Validation Layer
// Centralized contract enforcement between activity.js and renderers
// ============================================================

'use strict';

const VALIDATORS = {};

// ── Helpers ──

function isString(v) { return typeof v === 'string'; }
function isNumber(v) { return typeof v === 'number' && !isNaN(v); }
function isArray(v) { return Array.isArray(v); }
function isBoolean(v) { return typeof v === 'boolean'; }

function check(ok, code, message) {
  return ok ? null : { code, message };
}

function hard(errors, code, msg) {
  errors.push({ severity: 'error', code, message: msg });
}

function soft(warnings, code, msg) {
  warnings.push({ severity: 'warning', code, message: msg });
}

function validateArray(errors, warnings, data, label) {
  if (!isArray(data)) {
    hard(errors, 'DATA_NOT_ARRAY', `"${label}" is not an array (got ${typeof data})`);
    return false;
  }
  return true;
}

function validateString(errors, warnings, item, field, index, isRequired) {
  const val = item[field];
  if (val == null) {
    if (isRequired) hard(errors, 'MISSING_FIELD', `Item #${index} missing required field: "${field}"`);
    else soft(warnings, 'MISSING_OPTIONAL', `Item #${index} missing optional field: "${field}"`);
    return false;
  }
  if (!isString(val)) {
    hard(errors, 'WRONG_TYPE', `Item #${index} field "${field}" should be string, got ${typeof val}`);
    return false;
  }
  if (val.length === 0) {
    soft(warnings, 'EMPTY_STRING', `Item #${index} field "${field}" is empty`);
    return false;
  }
  return true;
}

function validateArrayField(errors, warnings, item, field, index, minLen) {
  const val = item[field];
  if (val == null) {
    hard(errors, 'MISSING_FIELD', `Item #${index} missing required field: "${field}"`);
    return false;
  }
  if (!isArray(val)) {
    hard(errors, 'WRONG_TYPE', `Item #${index} field "${field}" should be array, got ${typeof val}`);
    return false;
  }
  if (val.length < minLen) {
    hard(errors, 'ARRAY_TOO_SHORT', `Item #${index} field "${field}" has ${val.length} items, minimum ${minLen}`);
    return false;
  }
  val.forEach((v, vi) => {
    if (!isString(v)) hard(errors, 'ARRAY_ELEM_TYPE', `Item #${index} field "${field}[${vi}]" should be string, got ${typeof v}`);
  });
  return true;
}

function validateNumber(errors, warnings, item, field, index, isRequired) {
  const val = item[field];
  if (val == null) {
    if (isRequired) hard(errors, 'MISSING_FIELD', `Item #${index} missing required field: "${field}"`);
    else soft(warnings, 'MISSING_OPTIONAL', `Item #${index} missing optional field: "${field}"`);
    return false;
  }
  if (!isNumber(val)) {
    hard(errors, 'WRONG_TYPE', `Item #${index} field "${field}" should be number, got ${typeof val}`);
    return false;
  }
  return true;
}

function validateEnum(errors, warnings, val, allowed, field, index) {
  if (!allowed.includes(val)) {
    hard(errors, 'INVALID_ENUM', `Item #${index} field "${field}" = "${val}", expected one of: ${allowed.join(', ')}`);
    return false;
  }
  return true;
}

// ── INDIVIDUAL VALIDATORS ──

VALIDATORS['wheel'] = function (data) {
  const errors = [], warnings = [];
  if (!validateArray(errors, warnings, data, 'wheel data')) return { valid: false, errors, warnings };
  if (data.length < 1) { hard(errors, 'EMPTY_DATA', 'wheel data is empty (need at least 1 item)'); return { valid: false, errors, warnings }; }
  data.forEach((item, i) => {
    validateString(errors, warnings, item, 'arabic', i, true);
    validateString(errors, warnings, item, 'chinese', i, true);
    if (item.emoji == null) soft(warnings, 'MISSING_OPTIONAL', `wheel Item #${i} missing optional field: "emoji" (will use default ✨)`);
  });
  return { valid: errors.length === 0, errors, warnings };
};

VALIDATORS['memory'] = function (data) {
  const errors = [], warnings = [];
  if (!validateArray(errors, warnings, data, 'memory data')) return { valid: false, errors, warnings };
  if (data.length < 1) { hard(errors, 'EMPTY_DATA', 'memory data is empty (need at least 1 pair)'); return { valid: false, errors, warnings }; }
  data.forEach((item, i) => {
    const hasEmoji = validateString(errors, warnings, item, 'emoji', i, true);
    if (hasEmoji && isString(item.emoji) && item.emoji.trim().length === 0) {
      soft(warnings, 'EMPTY_EMOJI', `memory Item #${i} "emoji" is empty/whitespace — card face will render blank`);
    }
    validateString(errors, warnings, item, 'arabic', i, true);
    validateString(errors, warnings, item, 'chinese', i, true);
  });
  return { valid: errors.length === 0, errors, warnings };
};

VALIDATORS['tap-choice'] = function (data) {
  const errors = [], warnings = [];
  if (!validateArray(errors, warnings, data, 'tap-choice data')) return { valid: false, errors, warnings };
  data.forEach((item, i) => {
    validateString(errors, warnings, item, 'question', i, true);
    if (!validateArrayField(errors, warnings, item, 'options', i, 2)) return;
    const correct = item.correct;
    if (correct == null) { hard(errors, 'MISSING_FIELD', `tap-choice Item #${i} missing required field: "correct"`); return; }
    if (!isNumber(correct)) { hard(errors, 'WRONG_TYPE', `tap-choice Item #${i} field "correct" should be number, got ${typeof correct}`); return; }
    if (correct < 0 || correct >= item.options.length) {
      hard(errors, 'INVALID_INDEX', `tap-choice Item #${i} correct index ${correct} out of bounds (0-${item.options.length - 1})`);
    }
  });
  return { valid: errors.length === 0, errors, warnings };
};

VALIDATORS['sound-match'] = function (data) {
  const errors = [], warnings = [];
  if (!validateArray(errors, warnings, data, 'sound-match data')) return { valid: false, errors, warnings };
  data.forEach((item, i) => {
    validateString(errors, warnings, item, 'audioText', i, true);
    if (!validateArrayField(errors, warnings, item, 'options', i, 1)) return;
    const correct = item.correct;
    if (correct == null) { hard(errors, 'MISSING_FIELD', `sound-match Item #${i} missing required field: "correct"`); return; }
    if (!isNumber(correct)) { hard(errors, 'WRONG_TYPE', `sound-match Item #${i} field "correct" should be number, got ${typeof correct}`); return; }
    if (correct < 0 || correct >= item.options.length) {
      hard(errors, 'INVALID_INDEX', `sound-match Item #${i} correct index ${correct} out of bounds (0-${item.options.length - 1})`);
    }
    item.options.forEach((opt, oi) => {
      if (!isString(opt)) hard(errors, 'ARRAY_ELEM_TYPE', `sound-match Item #${i} options[${oi}] should be string, got ${typeof opt}`);
      else if (opt.trim().length === 0) soft(warnings, 'EMPTY_OPTION', `sound-match Item #${i} options[${oi}] is empty`);
      else if (!opt.includes(' ')) soft(warnings, 'OPTION_NO_SPACE', `sound-match Item #${i} options[${oi}] has no space — renderer extracts first token as emoji, label will be empty`);
    });
  });
  return { valid: errors.length === 0, errors, warnings };
};

VALIDATORS['hidden-reveal'] = function (data) {
  const errors = [], warnings = [];
  if (!validateArray(errors, warnings, data, 'hidden-reveal data')) return { valid: false, errors, warnings };
  data.forEach((item, i) => {
    validateString(errors, warnings, item, 'coveredImage', i, true);
    validateString(errors, warnings, item, 'word', i, true);
    validateString(errors, warnings, item, 'chinese', i, true);
    if (!validateArrayField(errors, warnings, item, 'hints', i, 1)) return;
  });
  return { valid: errors.length === 0, errors, warnings };
};

VALIDATORS['dark-room'] = function (data) {
  const errors = [], warnings = [];
  if (!validateArray(errors, warnings, data, 'dark-room data')) return { valid: false, errors, warnings };
  if (data.length < 1) { hard(errors, 'EMPTY_DATA', 'dark-room data is empty (need at least 1 item)'); return { valid: false, errors, warnings }; }
  data.forEach((item, i) => {
    validateString(errors, warnings, item, 'arabic', i, true);
    validateString(errors, warnings, item, 'chinese', i, true);
  });
  return { valid: errors.length === 0, errors, warnings };
};

VALIDATORS['sentence-builder'] = function (data) {
  const errors = [], warnings = [];
  if (!validateArray(errors, warnings, data, 'sentence-builder data')) return { valid: false, errors, warnings };
  data.forEach((item, i) => {
    const hasAr = validateString(errors, warnings, item, 'arabic', i, true);
    if (hasAr && item.arabic.split(' ').length < 1) {
      hard(errors, 'ARABIC_NO_WORDS', `sentence-builder Item #${i} "arabic" has no words (split by space)`);
    }
    validateString(errors, warnings, item, 'chinese', i, true);
    if (item.grammarNote == null) soft(warnings, 'MISSING_OPTIONAL', `sentence-builder Item #${i} missing optional field: "grammarNote"`);
    else if (!isString(item.grammarNote)) hard(errors, 'WRONG_TYPE', `sentence-builder Item #${i} field "grammarNote" should be string, got ${typeof item.grammarNote}`);
  });
  return { valid: errors.length === 0, errors, warnings };
};

VALIDATORS['wechat'] = function (data) {
  const errors = [], warnings = [];
  if (!validateArray(errors, warnings, data, 'wechat data')) return { valid: false, errors, warnings };
  if (data.length < 1) { hard(errors, 'EMPTY_DATA', 'wechat data is empty'); return { valid: false, errors, warnings }; }
  data.forEach((item, i) => {
    if (!validateString(errors, warnings, item, 'from', i, true)) return;
    if (item.from !== 'other' && item.from !== 'choices') {
      hard(errors, 'INVALID_ENUM', `wechat Item #${i} "from" = "${item.from}", expected "other" or "choices"`);
      return;
    }
    if (item.from === 'other') {
      validateString(errors, warnings, item, 'text', i, true);
      if (item.chinese == null) soft(warnings, 'MISSING_OPTIONAL', `wechat Item #${i} missing optional field: "chinese"`);
      if (item.delay != null && !isNumber(item.delay)) {
        hard(errors, 'WRONG_TYPE', `wechat Item #${i} field "delay" should be number, got ${typeof item.delay}`);
      }
    }
    if (item.from === 'choices') {
      if (!validateArrayField(errors, warnings, item, 'choices', i, 1)) return;
      const ci = item.correctIndex;
      if (ci == null) { hard(errors, 'MISSING_FIELD', `wechat Item #${i} missing required field: "correctIndex"`); return; }
      if (!isNumber(ci)) { hard(errors, 'WRONG_TYPE', `wechat Item #${i} field "correctIndex" should be number, got ${typeof ci}`); return; }
      if (ci < 0 || ci >= item.choices.length) {
        hard(errors, 'INVALID_INDEX', `wechat Item #${i} correctIndex ${ci} out of bounds (0-${item.choices.length - 1})`);
      }
    }
  });
  return { valid: errors.length === 0, errors, warnings };
};

VALIDATORS['who-am-i'] = function (data) {
  const errors = [], warnings = [];
  if (!validateArray(errors, warnings, data, 'who-am-i data')) return { valid: false, errors, warnings };
  data.forEach((item, i) => {
    validateString(errors, warnings, item, 'word', i, true);
    validateString(errors, warnings, item, 'chinese', i, true);
    if (!validateArrayField(errors, warnings, item, 'hints', i, 1)) return;
  });
  return { valid: errors.length === 0, errors, warnings };
};

VALIDATORS['swipe-quiz'] = function (data) {
  const errors = [], warnings = [];
  if (!validateArray(errors, warnings, data, 'swipe-quiz data')) return { valid: false, errors, warnings };
  data.forEach((item, i) => {
    validateString(errors, warnings, item, 'arabic', i, true);
    validateString(errors, warnings, item, 'chinese', i, true);
    if (!isBoolean(item.correct)) {
      soft(warnings, 'MISSING_OPTIONAL', `swipe-quiz Item #${i} "correct" missing or not boolean — renderer treats undefined as false (always wrong)`);
    }
  });
  return { valid: errors.length === 0, errors, warnings };
};

VALIDATORS['traffic-light'] = function (data) {
  const errors = [], warnings = [];
  if (!validateArray(errors, warnings, data, 'traffic-light data')) return { valid: false, errors, warnings };
  data.forEach((item, i) => {
    validateString(errors, warnings, item, 'arabic', i, true);
    validateString(errors, warnings, item, 'type', i, true);
    if (isString(item.type)) validateEnum(errors, warnings, item.type, ['command', 'negative'], 'type', i);
    validateString(errors, warnings, item, 'chinese', i, true);
  });
  return { valid: errors.length === 0, errors, warnings };
};

VALIDATORS['speed-reveal'] = function (data) {
  const errors = [], warnings = [];
  if (!validateArray(errors, warnings, data, 'speed-reveal data')) return { valid: false, errors, warnings };
  data.forEach((item, i) => {
    const hasAr = validateString(errors, warnings, item, 'arabic', i, true);
    if (hasAr && item.arabic.length < 1) {
      hard(errors, 'EMPTY_STRING', `speed-reveal Item #${i} "arabic" is empty (need at least 1 char)`);
    }
    validateString(errors, warnings, item, 'chinese', i, true);
  });
  return { valid: errors.length === 0, errors, warnings };
};

VALIDATORS['quick-reaction'] = function (data) {
  const errors = [], warnings = [];
  if (!validateArray(errors, warnings, data, 'quick-reaction data')) return { valid: false, errors, warnings };
  if (data.length < 4) { hard(errors, 'INSUFFICIENT_DATA', 'quick-reaction needs at least 4 items (renderer shows 4 random options per round)'); return { valid: false, errors, warnings }; }
  data.forEach((item, i) => {
    validateString(errors, warnings, item, 'arabic', i, true);
  });
  return { valid: errors.length === 0, errors, warnings };
};

VALIDATORS['mini-maze'] = function (data) {
  const errors = [], warnings = [];
  if (!validateArray(errors, warnings, data, 'mini-maze data')) return { valid: false, errors, warnings };
  data.forEach((item, i) => {
    validateString(errors, warnings, item, 'question', i, true);
    if (!validateArrayField(errors, warnings, item, 'options', i, 2)) return;
    const correct = item.correct;
    if (correct == null) { hard(errors, 'MISSING_FIELD', `mini-maze Item #${i} missing required field: "correct"`); return; }
    if (!isNumber(correct)) { hard(errors, 'WRONG_TYPE', `mini-maze Item #${i} field "correct" should be number, got ${typeof correct}`); return; }
    if (correct < 0 || correct >= item.options.length) {
      hard(errors, 'INVALID_INDEX', `mini-maze Item #${i} correct index ${correct} out of bounds (0-${item.options.length - 1})`);
    }
  });
  return { valid: errors.length === 0, errors, warnings };
};

VALIDATORS['dots-hunter'] = function (data) {
  const errors = [], warnings = [];
  if (!validateArray(errors, warnings, data, 'dots-hunter data')) return { valid: false, errors, warnings };
  data.forEach((item, i) => {
    const hasBase = validateString(errors, warnings, item, 'base', i, true);
    if (hasBase && isString(item.base)) {
      const underscoreCount = (item.base.match(/_/g) || []).length;
      if (underscoreCount === 0) {
        hard(errors, 'MISSING_UNDERSCORE', `dots-hunter Item #${i} "base" lacks '_' placeholder — renderer cannot show gap position`);
      } else if (underscoreCount > 1) {
        hard(errors, 'MULTIPLE_UNDERSCORES', `dots-hunter Item #${i} "base" has ${underscoreCount} underscores — exactly 1 required`);
      }
    }
    const hasCL = validateString(errors, warnings, item, 'correctLetter', i, true);
    if (hasCL) validateEnum(errors, warnings, item.correctLetter, ['ي', 'ى', 'ة'], 'correctLetter', i);
    validateString(errors, warnings, item, 'fullWord', i, true);
    validateString(errors, warnings, item, 'reason', i, true);
    if (hasBase && hasCL && isString(item.base) && isString(item.fullWord)) {
      const expected = item.base.replace('_', item.correctLetter);
      const normalizedExpected = expected.replace(/[\u064B-\u065F]/g, '');
      const normalizedFull = item.fullWord.replace(/[\u064B-\u065F]/g, '');
      const ne = normalizedExpected.replace(/_/g, '');
      const nf = normalizedFull.replace(/_/g, '');
      if (ne !== nf) {
        soft(warnings, 'BASE_LETTER_MISMATCH', `dots-hunter Item #${i} base + correctLetter does not match fullWord ("${expected}" vs "${item.fullWord}")`);
      }
    }
  });
  return { valid: errors.length === 0, errors, warnings };
};

VALIDATORS['conjugation-ladder'] = function (data) {
  const errors = [], warnings = [];
  if (!validateArray(errors, warnings, data, 'conjugation-ladder data')) return { valid: false, errors, warnings };
  data.forEach((item, i) => {
    validateString(errors, warnings, item, 'past', i, true);
    validateString(errors, warnings, item, 'present', i, true);
  });
  return { valid: errors.length === 0, errors, warnings };
};

VALIDATORS['punctuation-editor'] = function (data) {
  const errors = [], warnings = [];
  if (!validateArray(errors, warnings, data, 'punctuation-editor data')) return { valid: false, errors, warnings };
  data.forEach((item, i) => {
    validateString(errors, warnings, item, 'text', i, true);
    const hasMark = validateString(errors, warnings, item, 'correctMark', i, true);
    if (hasMark) validateEnum(errors, warnings, item.correctMark, ['.', ',', '؟', '!', '،', '؛'], 'correctMark', i);
  });
  return { valid: errors.length === 0, errors, warnings };
};

VALIDATORS['young-doctor'] = function (data) {
  const errors = [], warnings = [];
  if (!validateArray(errors, warnings, data, 'young-doctor data')) return { valid: false, errors, warnings };
  data.forEach((item, i) => {
    validateString(errors, warnings, item, 'name', i, true);
    validateString(errors, warnings, item, 'problems', i, true);
    if (item.age == null) soft(warnings, 'MISSING_OPTIONAL', `young-doctor Item #${i} missing optional field: "age"`);
    else if (!isNumber(item.age) && !isString(item.age)) {
      hard(errors, 'WRONG_TYPE', `young-doctor Item #${i} field "age" should be number or string, got ${typeof item.age}`);
    }
    if (!validateArrayField(errors, warnings, item, 'expectedTips', i, 1)) return;
  });
  return { valid: errors.length === 0, errors, warnings };
};

VALIDATORS['health-letter'] = function (data) {
  const errors = [], warnings = [];
  if (!validateArray(errors, warnings, data, 'health-letter data')) return { valid: false, errors, warnings };
  return { valid: true, errors, warnings };
};

VALIDATORS['board-game'] = function (data) {
  const errors = [], warnings = [];
  if (!validateArray(errors, warnings, data, 'board-game data')) return { valid: false, errors, warnings };
  data.forEach((item, i) => {
    validateNumber(errors, warnings, item, 'num', i, true);
    validateString(errors, warnings, item, 'question', i, true);
    validateString(errors, warnings, item, 'answer', i, true);
    const hasType = validateString(errors, warnings, item, 'type', i, true);
    if (hasType) validateEnum(errors, warnings, item.type, ['vocab', 'command', 'spelling', 'punctuation', 'conjugation'], 'type', i);
  });
  return { valid: errors.length === 0, errors, warnings };
};

VALIDATORS['spot-difference'] = function (data) {
  const errors = [], warnings = [];
  if (!validateArray(errors, warnings, data, 'spot-difference data')) return { valid: false, errors, warnings };
  data.forEach((item, i) => {
    validateString(errors, warnings, item, 'sentenceA', i, true);
    validateString(errors, warnings, item, 'sentenceB', i, true);
    validateString(errors, warnings, item, 'keyword', i, true);
  });
  return { valid: errors.length === 0, errors, warnings };
};

VALIDATORS['progressive-story'] = function (data) {
  const errors = [], warnings = [];
  if (!validateArray(errors, warnings, data, 'progressive-story data')) return { valid: false, errors, warnings };
  data.forEach((item, i) => {
    validateString(errors, warnings, item, 'speaker', i, true);
    validateString(errors, warnings, item, 'text', i, true);
    validateString(errors, warnings, item, 'chinese', i, true);
  });
  return { valid: errors.length === 0, errors, warnings };
};

// ── MAIN VALIDATION FUNCTION ──

function validateActivityData(type, data) {
  const validator = VALIDATORS[type];
  if (!validator) {
    return {
      valid: false,
      errors: [{ severity: 'error', code: 'UNKNOWN_TYPE', message: `No validator registered for activity type: "${type}"` }],
      warnings: []
    };
  }
  return validator(data);
}

// ── ERROR FORMATTING ──

function formatValidationMessage(type, result) {
  const lines = [];
  if (result.errors.length > 0) {
    lines.push('[VALIDATION ERROR]');
    lines.push('Activity: ' + type);
    result.errors.forEach(e => {
      lines.push('  ✖ ' + e.message);
    });
  }
  if (result.warnings.length > 0) {
    lines.push('[VALIDATION WARNING]');
    lines.push('Activity: ' + type);
    result.warnings.forEach(w => {
      lines.push('  ⚠ ' + w.message);
    });
  }
  return lines.join('\n');
}

// ── SOURCE TEXT VALIDATORS (pre-runtime) ──

function validateSourceText(sourceText) {
  const errors = [];
  const warnings = [];

  if (sourceText.startsWith('```') || sourceText.startsWith('~~~')) {
    hard(errors, 'MARKDOWN_FENCE', 'File starts with markdown code fence (``` or ~~~). This will crash: first backticks create empty tagged template, TypeError: "" is not a function.');
  }

  if (!/const\s+LESSON_DATA\s*=\s*\{/.test(sourceText)) {
    hard(errors, 'LESSON_DATA_MISSING', 'Twin-File lesson data must declare const LESSON_DATA = {...}.');
  }

  if (/const\s+lessonData\s*=/.test(sourceText)) {
    hard(errors, 'LEGACY_LESSON_DATA_NAME', 'Use LESSON_DATA, not the legacy lessonData identifier.');
  }

  const activitiesMatch = sourceText.match(/\bactivities\s*:\s*\[([\s\S]*?)\]/);
  if (!activitiesMatch) {
    hard(errors, 'ACTIVITIES_MISSING', 'Twin-File lessons must include activities: [].');
  } else if (activitiesMatch[1].trim() !== '') {
    hard(errors, 'ACTIVITIES_NOT_EMPTY', 'Twin-File lessons keep activities: [] empty; activity data is resolved by activity.js and bridge.js.');
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ── TWIN-FILE LESSON VALIDATION (post-load, pre-render) ──

function validateLessonStructure(data) {
  const errors = [];
  const warnings = [];

  if (!data || typeof data !== 'object') {
    hard(errors, 'DATA_NOT_OBJECT', 'LESSON_DATA is not defined or not an object.');
    return { valid: false, errors, warnings };
  }

  if (!Array.isArray(data.activities)) {
    hard(errors, 'ACTIVITIES_MISSING', 'LESSON_DATA.activities is missing or not an array. Twin-File requires activities: [].');
  } else if (data.activities.length !== 0) {
    hard(errors, 'ACTIVITIES_NOT_EMPTY', 'LESSON_DATA.activities must remain empty in Twin-File; activity data belongs to activity.js and bridge.js.');
  }

  return { valid: errors.length === 0, errors, warnings };
}

// ── RESOLVED ACTIVITY PAYLOAD VALIDATION ──
// These validators remain useful for the 22 runtime activity payloads produced
// by bridge.js. They intentionally do not validate LESSON_DATA.activities.


const ACTIVITY_REQUIRED_FIELDS = ['id', 'type', 'titleAr', 'titleZh', 'icon', 'data'];
const EXPECTED_ACTIVITY_COUNT = 22;

function validateActivityEntry(entry, index) {
  const errors = [];
  const warnings = [];

  if (!entry || typeof entry !== 'object') {
    hard(errors, 'NULL_ENTRY', 'Activity #' + (index + 1) + ' is null or not an object');
    return { valid: false, errors, warnings };
  }

  ACTIVITY_REQUIRED_FIELDS.forEach(function(field) {
    if (entry[field] == null) {
      hard(errors, 'MISSING_FIELD', 'Activity #' + (index + 1) + ' ("' + (entry.id || '?') + '") missing required field: "' + field + '"');
    }
  });

  if (!Array.isArray(entry.data)) {
    hard(errors, 'DATA_NOT_ARRAY', 'Activity #' + (index + 1) + ' ("' + (entry.id || '?') + '") data is not an array');
  }

  return { valid: errors.length === 0, errors, warnings };
}

function validateActivitiesCompleteness(activities) {
  const errors = [];
  const warnings = [];

  if (!Array.isArray(activities)) {
    hard(errors, 'NOT_ARRAY', 'activities is not an array');
    return { valid: false, errors, warnings };
  }

  if (activities.length !== EXPECTED_ACTIVITY_COUNT) {
    hard(errors, 'INCOMPLETE_COUNT', 'Expected ' + EXPECTED_ACTIVITY_COUNT + ' activities, got ' + activities.length + '. Generation may be truncated or incomplete.');
  }

  const seenIds = {};
  activities.forEach(function(entry, i) {
    const result = validateActivityEntry(entry, i);
    result.errors.forEach(function(e) { errors.push(e); });
    result.warnings.forEach(function(w) { warnings.push(w); });

    if (entry && entry.id) {
      if (seenIds[entry.id]) {
        hard(errors, 'DUPLICATE_ID', 'Duplicate activity ID: "' + entry.id + '" at index ' + i);
      }
      seenIds[entry.id] = true;
    }
  });

  return { valid: errors.length === 0, errors, warnings };
}
