// Проверка собранного nihongo/index.html: синтаксис скрипта + целостность данных + движок спряжения.
const fs = require('fs'), vm = require('vm');
const html = fs.readFileSync(process.argv[2], 'utf8');
const data = JSON.parse(html.match(/<script id="data" type="application\/json">([\s\S]*?)<\/script>/)[1]);
const app = html.match(/<script>\n([\s\S]*?)<\/script>\n<\/body>/)[1];
new vm.Script(app); // синтаксис
const errs = [];
// выдёргиваем чистые функции из app1 (до раздела ХРАНИЛИЩЕ)
const pure = app.slice(app.indexOf('/* ================= ФУРИГАНА'), app.indexOf('/* ================= ХРАНИЛИЩЕ'));
const ctx = {}; vm.createContext(ctx);
vm.runInContext(pure + ';this.api={rb,kana,kanjiOnly,gapAnswer,toRu,conjV,conjA,wrongForms,ruleText,AFORMS,VFORMS};', ctx);
const A = ctx.api;
const seen = new Set();
data.lessons.forEach(L => {
  L.words.forEach(w => {
    const id = 'L' + L.mnn + ' ' + w.jp;
    if (seen.has(w.jp)) errs.push('дубль: ' + id); seen.add(w.jp);
    if (!A.gapAnswer(w.ex)) errs.push('нет {пропуска}: ' + id);
    for (const s of [w.jp, w.ex, w.d || '']) if (/[\[\]]/.test(A.kana(s))) errs.push('скобки без кандзи: ' + id + ' → ' + s);
    if (/^v/.test(w.t)) {
      if (!w.d) errs.push('нет словарной формы: ' + id);
      else {
        const m = A.conjV(w, 'masu');
        if (m !== w.jp) errs.push('ます не совпало: ' + id + ' → ' + m);
        for (const f of Object.keys(A.VFORMS)) { const x = A.conjV(w, f); if (!x || /undefined/.test(x)) errs.push('форма ' + f + ': ' + id); }
        for (const f of ['dict','nai','te','ta']) if (A.wrongForms(w, f).length < 3) errs.push('мало ошибок-вариантов ' + f + ': ' + id);
      }
    }
    if (w.t === 'i' || w.t === 'na') for (const f of Object.keys(A.AFORMS)) if (A.wrongForms(w, f).length < 3) errs.push('мало вариантов adj ' + f + ': ' + id);
  });
  L.phrases.forEach(p => { if (!['f','c','n'].includes(p.reg)) errs.push('reg: ' + p.jp); });
});
data.pdrill.forEach(x => { const a = A.gapAnswer(x.s); if (!x.o.includes(a)) errs.push('частица не в вариантах: ' + x.s); });
data.polite.forEach(x => { if (x.w.includes(x.c)) errs.push('верный среди неверных: ' + x.p); });
const W = n => data.lessons.flatMap(L => L.words).find(w => w.d === n);
const show = (n, f) => A.kana(A.conjV(W(n), f));
console.log('Слов:', seen.size, '| глаголов:', data.lessons.flatMap(L=>L.words).filter(w=>w.d).length);
console.log('て:', ['書[か]く','行[い]く','飲[の]む','帰[かえ]る','貸[か]す','買[か]う','来[く]る','勉強[べんきょう]する','食[た]べる'].map(n => show(n,'te')).join(' '));
console.log('ない:', ['ある','買[か]う','来[く]る','する','見[み]る'].map(n => show(n,'nai')).join(' '));
console.log('いい:', ['neg','past','pnegp'].map(f=>A.conjA('いい','i',f)).join(' '), '| 静か:', A.conjA('静[しず]か','na','pastp'));
console.log('wrong 書く te:', A.wrongForms(W('書[か]く'),'te').map(A.kana).join(' '));
console.log('Поливанов:', ['先生[せんせい]','学生[がくせい]','こんにちは','新聞[しんぶん]','コーヒー','一緒[いっしょ]に','会社員[かいしゃいん]'].map(A.toRu).join(' | '));
console.log(errs.length ? 'ОШИБКИ:\n' + errs.join('\n') : 'Ошибок в данных нет');
