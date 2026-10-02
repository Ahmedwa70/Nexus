#!/usr/bin/env bash
# ================================================================
# test_check_activities.sh — يتحقق أن الفاحص يكشف المخالفات فعلاً
# التشغيل من جذر المشروع:  bash tools/test_check_activities.sh
# ================================================================
ROOT=/home/user/Nexus; TD=$(mktemp -d); trap 'rm -rf $TD' EXIT
pass=0; fail=0
probe() {  # اسم · كتلة الحقول · النص المتوقَّع في التقرير
  local name="$1" fields="$2" expect="$3"
  python3 - "$TD/l.js" "$fields" <<'PY'
import sys,re
src=open('/home/user/Nexus/data/lesson.js',encoding='utf-8').read()
src=src.replace("    // 9-U: Hidden Reveal", sys.argv[2]+"\n    // 9-U: Hidden Reveal",1)
open(sys.argv[1],'w',encoding='utf-8').write(src)
PY
  local out; out=$(node "$ROOT/tools/check_activities.js" "$TD/l.js" 2>&1)
  if echo "$out" | grep -qF "$expect"; then printf '  \033[32m✓\033[0m %s\n' "$name"; pass=$((pass+1))
  else printf '  \033[31m✗\033[0m %s\n     لم يُكتشف: %s\n' "$name" "$expect"; fail=$((fail+1)); fi
}

echo "اختبار أنياب الفاحص — كل حالة بيانات مكسورة عمداً:"
echo

probe "traffic-light: type غير مسموح" \
'    customTrafficLight: [{arabic:"كُلْ", type:"order", chinese:"吃"},{arabic:"لَا تَشْرَبْ", type:"negative", chinese:"别喝"}],' \
'المسموح command أو negative فقط'

probe "traffic-light: نوع واحد فقط" \
'    customTrafficLight: [{arabic:"كُلْ", type:"command", chinese:"吃"},{arabic:"اِشْرَبْ", type:"command", chinese:"喝"}],' \
'غير متوازن'

probe "dots-hunter: حرف خارج الأزرار الثلاثة" \
'    customDotsHunter: [{base:"الخُبْ", correctLetter:"ز", fullWord:"الخُبْز", reason:"ر"}],' \
'الواجهة تعرض ي · ى · ة فقط'

probe "dots-hunter: base لا يطابق الكلمة" \
'    customDotsHunter: [{base:"السَّلَ", correctLetter:"ة", fullWord:"السَّلَطَة", reason:"ر"}],' \
'base لا يطابق fullWord'

probe "conjugation-ladder: past فارغ (العيب القديم)" \
'    customConjugationLadder: [{past:"", present:"آكُلُ"}],' \
'past فارغ'

probe "punctuation: العلامة ظاهرة في النص (العيب القديم)" \
'    customPunctuation: [{text:"أَيْنَ تَأْكُلُ؟", correctMark:"؟"}],' \
'الجواب مكشوف'

probe "board-game: num خارج اللوحة" \
'    customBoardGame: [{num:45, question:"س", answer:"ج", type:"vocab"}],' \
'اللوحة 30 مربّعاً فقط'

probe "board-game: num مكرّر" \
'    customBoardGame: [{num:5, question:"س", answer:"ج", type:"vocab"},{num:5, question:"س٢", answer:"ج", type:"vocab"}],' \
'مكرّر'

probe "board-game: type غير مسموح" \
'    customBoardGame: [{num:5, question:"س", answer:"ج", type:"grammar"}],' \
'type = "grammar"'

probe "spot-difference: مفردتان لا جملتان (العيب القديم)" \
'    customSpotDifference: [{sentenceA:"السَّمَك", sentenceB:"الدَّجَاج", keyword:"ك"}],' \
'مفردات لا جُمَل'

probe "spot-difference: اختلاف في أكثر من كلمة" \
'    customSpotDifference: [{sentenceA:"آكُلُ السَّمَكَ فِي الغَدَاء", sentenceB:"أَشْرَبُ الشَّايَ فِي العَشَاء", keyword:"ك"}],' \
'المطلوب كلمة واحدة بالضبط'

probe "dots-hunter: أقل من الحدّ الأدنى (٢)" \
'    customDotsHunter: [{base:"الخِدْمَ", correctLetter:"ة", fullWord:"الخِدْمَة", reason:"ر"}],' \
'الحدّ الأدنى 2'

probe "traffic-light: أقل من الحدّ الأدنى (٤)" \
'    customTrafficLight: [{arabic:"كُلْ", type:"command", chinese:"吃"},{arabic:"لَا تَأْكُلْ", type:"negative", chinese:"别"}],' \
'الحدّ الأدنى 4'

probe "board-game: أقل من الحدّ الأدنى (٥)" \
'    customBoardGame: [{num:3,question:"س",answer:"ج",type:"vocab"},{num:7,question:"س",answer:"ج",type:"vocab"},{num:11,question:"س",answer:"ج",type:"vocab"}],' \
'الحدّ الأدنى 5'

printf '\nالنتيجة: %d نجح · %d فشل\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
