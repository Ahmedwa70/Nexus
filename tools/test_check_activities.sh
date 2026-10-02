#!/usr/bin/env bash
# ================================================================
# test_check_activities.sh — يتحقق أن الفاحص يكشف المخالفات فعلاً
# التشغيل من جذر المشروع:  bash tools/test_check_activities.sh
#
# يبني درساً صناعياً مستقلاً لكل حالة، فلا يتأثر بالدرس المُركَّب
# حالياً في data/lesson.js.
# ================================================================
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TD="$(mktemp -d)"; trap 'rm -rf "$TD"' EXIT
pass=0; fail=0

# يبني lesson.js صناعياً: الحقل المختبَر فقط، والباقي حدٌّ أدنى سليم
build() {
python3 - "$TD/l.js" "$1" <<'PY'
import sys
field = sys.argv[2]
tpl = '''const LESSON_DATA = {
  meta: { title: "اختبار" },
  vocab: [
    { ar: "الخِدْمَة", zh: "服务", emoji: "🛎️", type: "اِسْم · 名词" },
    { ar: "القَمِيص", zh: "衬衫", emoji: "👕", type: "اِسْم · 名词" },
    { ar: "المُشْتَرِي", zh: "买家", emoji: "🧑", type: "اِسْم · 名词" },
    { ar: "البِطَاقَة", zh: "卡片", emoji: "🏷️", type: "اِسْم · 名词" }
  ],
  dialogue: [{ speaker: "أ", ar: "الخِدْمَة وَالبِطَاقَة وَالقَمِيص وَالمُشْتَرِي", zh: "x" }],
  explain: [{ label: "①", ar: "القُبَّعَة وَالغَالِي", zh: "x" }],
  grammar: [{ type: "conjugation", items: [{ pronoun: "أَنَا", verb: "أَشْتَرِي", zh: "x" }] }],
  exercises: {
    mcq: [{ question: "س", options: ["أ","ب"], correct: 0 }],
    trueFalse: [{ ar: "ج", zh: "x", correct: true }],
FIELD
  },
  activities: []
};'''
open(sys.argv[1], 'w', encoding='utf-8').write(tpl.replace('FIELD', field))
PY
}

probe() {   # الاسم · كتلة الحقل · النص المتوقَّع في التقرير
  build "$2"
  local out; out="$(node "$ROOT/tools/check_activities.js" "$TD/l.js" 2>&1)"
  if echo "$out" | grep -qF "$3"; then
    printf '  \033[32m✓\033[0m %s\n' "$1"; pass=$((pass+1))
  else
    printf '  \033[31m✗\033[0m %s\n     لم يُكتشف: %s\n' "$1" "$3"; fail=$((fail+1))
  fi
}

echo
echo "اختبار أنياب الفاحص — كل حالة بيانات مكسورة عمداً:"
echo

# ── traffic-light ──
probe "traffic-light: type غير مسموح" \
'    customTrafficLight: [{arabic:"كُلْ",type:"order",chinese:"吃"},{arabic:"لَا تَشْرَبْ",type:"negative",chinese:"别"},{arabic:"خُذْ",type:"command",chinese:"拿"},{arabic:"لَا تَنْسَ",type:"negative",chinese:"别忘"}],' \
'المسموح command أو negative فقط'

probe "traffic-light: نوع واحد فقط" \
'    customTrafficLight: [{arabic:"كُلْ",type:"command",chinese:"吃"},{arabic:"خُذْ",type:"command",chinese:"拿"},{arabic:"ضَعْ",type:"command",chinese:"放"},{arabic:"قِفْ",type:"command",chinese:"停"}],' \
'غير متوازن'

probe "traffic-light: أقل من الحدّ الأدنى (٤)" \
'    customTrafficLight: [{arabic:"كُلْ",type:"command",chinese:"吃"},{arabic:"لَا تَأْكُلْ",type:"negative",chinese:"别"}],' \
'الحدّ الأدنى 4'

# ── dots-hunter ──
probe "dots-hunter: حرف خارج الأزرار الثلاثة" \
'    customDotsHunter: [{base:"القَمِي",correctLetter:"ص",fullWord:"القَمِيص",reason:"ر"},{base:"الخِدْمَ",correctLetter:"ة",fullWord:"الخِدْمَة",reason:"ر"}],' \
'الواجهة تعرض ي · ى · ة فقط'

probe "dots-hunter: base لا يطابق الكلمة" \
'    customDotsHunter: [{base:"الغَالِي",correctLetter:"ي",fullWord:"الغَالِي",reason:"ر"},{base:"الخِدْمَ",correctLetter:"ة",fullWord:"الخِدْمَة",reason:"ر"}],' \
'base لا يطابق fullWord'

probe "dots-hunter: كلمة مخترعة ليست في الدرس" \
'    customDotsHunter: [{base:"قِسْمَ",correctLetter:"ة",fullWord:"قِسْمَة",reason:"ر"},{base:"الخِدْمَ",correctLetter:"ة",fullWord:"الخِدْمَة",reason:"ر"}],' \
'كلمة مخترعة'

probe "dots-hunter: أقل من الحدّ الأدنى (٢)" \
'    customDotsHunter: [{base:"الخِدْمَ",correctLetter:"ة",fullWord:"الخِدْمَة",reason:"ر"}],' \
'الحدّ الأدنى 2'

probe "dots-hunter: كلمة من نصّ الدرس خارج vocab مقبولة" \
'    customDotsHunter: [{base:"الخِدْمَ",correctLetter:"ة",fullWord:"الخِدْمَة",reason:"ر"},{base:"القُبَّعَ",correctLetter:"ة",fullWord:"القُبَّعَة",reason:"ر"},{base:"البِطَاقَ",correctLetter:"ة",fullWord:"البِطَاقَة",reason:"ر"},{base:"المُشْتَرِ",correctLetter:"ي",fullWord:"المُشْتَرِي",reason:"ر"}],' \
'صائد النقاط          exercises.customDotsHunter          ✅'

# ── conjugation-ladder ──
probe "conjugation: past فارغ (العيب القديم)" \
'    customConjugationLadder: [{past:"",present:"أَشْتَرِي"},{past:"اِشْتَرَى",present:"يَشْتَرِي"},{past:"اِشْتَرَيْنَا",present:"نَشْتَرِي"}],' \
'past فارغ'

# ── punctuation ──
probe "punctuation: العلامة ظاهرة في النص (العيب القديم)" \
'    customPunctuation: [{text:"بِكَمِ القَمِيصُ؟",correctMark:"؟"},{text:"هَذَا قَمِيص",correctMark:"."},{text:"مَا أَجْمَلَهُ",correctMark:"!"}],' \
'الجواب مكشوف'

# ── board-game ──
probe "board-game: num خارج اللوحة" \
'    customBoardGame: [{num:45,question:"س",answer:"ج",type:"vocab"},{num:3,question:"س",answer:"ج",type:"vocab"},{num:7,question:"س",answer:"ج",type:"vocab"},{num:11,question:"س",answer:"ج",type:"vocab"},{num:15,question:"س",answer:"ج",type:"vocab"}],' \
'اللوحة 30 مربّعاً فقط'

probe "board-game: num مكرّر" \
'    customBoardGame: [{num:5,question:"س",answer:"ج",type:"vocab"},{num:5,question:"س",answer:"ج",type:"vocab"},{num:9,question:"س",answer:"ج",type:"vocab"},{num:13,question:"س",answer:"ج",type:"vocab"},{num:17,question:"س",answer:"ج",type:"vocab"}],' \
'مكرّر'

probe "board-game: type غير مسموح" \
'    customBoardGame: [{num:3,question:"س",answer:"ج",type:"grammar"},{num:7,question:"س",answer:"ج",type:"vocab"},{num:11,question:"س",answer:"ج",type:"vocab"},{num:15,question:"س",answer:"ج",type:"vocab"},{num:19,question:"س",answer:"ج",type:"vocab"}],' \
'type = "grammar"'

probe "board-game: إجابة بالصينية" \
'    customBoardGame: [{num:3,question:"س",answer:"衬衫",type:"vocab"},{num:7,question:"س",answer:"ج",type:"vocab"},{num:11,question:"س",answer:"ج",type:"vocab"},{num:15,question:"س",answer:"ج",type:"vocab"},{num:19,question:"س",answer:"ج",type:"vocab"}],' \
'بالصينية'

probe "board-game: علامة ترقيم مقبولة لنوع punctuation" \
'    customBoardGame: [{num:3,question:"س",answer:"؟",type:"punctuation"},{num:7,question:"س",answer:"ج",type:"vocab"},{num:11,question:"س",answer:"ج",type:"vocab"},{num:15,question:"س",answer:"ج",type:"vocab"},{num:19,question:"س",answer:"ج",type:"vocab"}],' \
'لعبة اللوحة          exercises.customBoardGame           ✅'

probe "board-game: أقل من الحدّ الأدنى (٥)" \
'    customBoardGame: [{num:3,question:"س",answer:"ج",type:"vocab"},{num:7,question:"س",answer:"ج",type:"vocab"},{num:11,question:"س",answer:"ج",type:"vocab"}],' \
'الحدّ الأدنى 5'

# ── spot-difference ──
probe "spot-difference: مفردتان لا جملتان (العيب القديم)" \
'    customSpotDifference: [{sentenceA:"القَمِيص",sentenceB:"الثَّوْب",keyword:"ك"},{sentenceA:"أَشْتَرِي القَمِيصَ الأَزْرَقَ",sentenceB:"أَشْتَرِي القَمِيصَ الأَحْمَرَ",keyword:"ك"},{sentenceA:"البَائِعُ فِي المَحَل",sentenceB:"المُشْتَرِي فِي المَحَل",keyword:"ك"}],' \
'مفردات لا جُمَل'

probe "spot-difference: اختلاف في أكثر من كلمة" \
'    customSpotDifference: [{sentenceA:"أَشْتَرِي القَمِيصَ الأَزْرَقَ",sentenceB:"أَبِيعُ الثَّوْبَ الأَحْمَرَ",keyword:"ك"},{sentenceA:"البَائِعُ فِي المَحَل",sentenceB:"المُشْتَرِي فِي المَحَل",keyword:"ك"},{sentenceA:"هَذَا قَمِيصٌ أَزْرَق",sentenceB:"هَذَا قَمِيصٌ أَحْمَر",keyword:"ك"}],' \
'المطلوب كلمة واحدة بالضبط'

# ── who-am-i ──
probe "who-am-i: تلميح يحمل جذر الكلمة" \
'    customWhoAmI: [{word:"القَمِيص",chinese:"衬衫",hints:["القَمِيصُ شَيْءٌ نَلْبَسُهُ","لَهُ أَكْمَام","مِنْ قُمَاش"]},{word:"الخِدْمَة",chinese:"服务",hints:["أ","ب","ج"]},{word:"البِطَاقَة",chinese:"卡",hints:["أ","ب","ج"]}],' \
'تلميح يحمل الكلمة أو جذرها'

probe "who-am-i: كلمة من خارج vocab" \
'    customWhoAmI: [{word:"السَّيَّارَة",chinese:"车",hints:["أ","ب","ج"]},{word:"الخِدْمَة",chinese:"服务",hints:["أ","ب","ج"]},{word:"البِطَاقَة",chinese:"卡",hints:["أ","ب","ج"]}],' \
'ليست من vocab الدرس'

printf '\n'
if [ "$fail" -eq 0 ]; then printf '\033[32mالنتيجة: %d نجح · %d فشل\033[0m\n\n' "$pass" "$fail"
else printf '\033[31mالنتيجة: %d نجح · %d فشل\033[0m\n\n' "$pass" "$fail"; fi
[ "$fail" -eq 0 ]
