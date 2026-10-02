#!/usr/bin/env node
// ================================================================
// test_who_am_i.js — اختبار منطق تصحيح نشاط «مَن أنا؟»
// التشغيل من جذر المشروع:  node tools/test_who_am_i.js
// ================================================================
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(root,'activities/who-am-i.js'),'utf8');
eval(src.slice(0, src.indexOf('function render')));   // دوال التطبيع فقط

const cases = [
  ['الخَيْمَة','الخَيْمَة','مطابقة تماماً',true],
  ['الخَيْمَة','الخيمة','بلا تشكيل',true],
  ['الخَيْمَة','خيمة','بلا «ال»',true],
  ['الخَيْمَة','الخيمه','«ه» بدل «ة»',true],
  ['الخَيْمَة','  الخيمة  ','مسافات زائدة',true],
  ['الخَيْمَة','الخ','ثلاثة أحرف',false],
  ['الخَيْمَة','الخس','كلمة خاطئة بنفس البداية',false],
  ['الخَيْمَة','الخميس','كلمة خاطئة أخرى',false],
  ['الخَيْمَة','ا','حرف واحد',false],
  ['الخَيْمَة','ة','حرف واحد',false],
  ['الخَيْمَة','الشاطئ','كلمة أخرى تماماً',false],
  ['الخَيْمَة','','فارغ',false],
  ['الشَّاطِئ','الشاطي','همزة متطرفة ← ي',true],
  ['الطَّبِيعَة','الطبيعه','ة ← ه',true],
  ['الهَوَاء النَّقِيّ','الهواء النقي','عبارة بكلمتين',true],
  ['الهَوَاء النَّقِيّ','الهواء','نصف العبارة',false],
  ['يُفَضِّل','يفضل','فعل بلا تشكيل',true],
  ['أُفَضِّلُ','افضل','همزة قطع ← ا',true],
];
let bad=0;
console.log('الكلمة'.padEnd(20)+'المُدخَل'.padEnd(18)+'الوصف'.padEnd(30)+'يجب'.padEnd(7)+'النظام');
console.log('─'.repeat(88));
for(const [word,input,desc,should] of cases){
  const got = wiMatches(input, word);
  const ok = got===should; if(!ok) bad++;
  console.log(word.padEnd(20)+(input||'(فارغ)').padEnd(18)+desc.padEnd(30)+(should?'صحيح':'خطأ').padEnd(7)+(got?'صحيح':'خطأ')+(ok?'  ✅':'  ❌'));
}
console.log('\nأحكام خاطئة: '+bad+' من '+cases.length+(bad?'  ❌':'  ✅'));
process.exit(bad?1:0);
