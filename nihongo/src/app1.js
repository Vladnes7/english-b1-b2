/* ================= ДАННЫЕ ================= */
const DATA = JSON.parse(document.getElementById('data').textContent);
const LESSONS = DATA.lessons;
const TOTAL_WORDS = LESSONS.reduce((s,L)=>s+L.words.length,0);
const ALL_WORDS = LESSONS.flatMap((L,li)=>L.words.map(w=>({...w, li})));
const WORDMAP = {}; ALL_WORDS.forEach(w=>{ WORDMAP[w.jp]=w; });

// Расписание: после каждых 3 уроков — день повторения.
const SCHED = [];
for(let i=0;i<LESSONS.length;i++){
  SCHED.push({type:'lesson', li:i});
  if((i+1)%3===0) SCHED.push({type:'review', from:[i-2,i-1,i]});
}

/* ================= ФУРИГАНА =================
   В данных кандзи пишутся как 食[た]べる: чтение в квадратных скобках сразу после кандзи. */
const KANJI = '[\\u3400-\\u9fff\\uf900-\\ufaff々〆ヶ]';
const RUBY_RE = new RegExp('('+KANJI+'+)\\[([^\\]]+)\\]','g');
const HAS_KANJI = new RegExp(KANJI);
function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function rb(s){ return esc(s).replace(RUBY_RE,'<ruby>$1<rt>$2</rt></ruby>'); }
function rbHTML(s){ return String(s).replace(RUBY_RE,'<ruby>$1<rt>$2</rt></ruby>'); } // для своих html-текстов
function kana(s){ return String(s).replace(RUBY_RE,'$2').replace(/[{}]/g,''); }
function kanjiOnly(s){ return String(s).replace(RUBY_RE,'$1').replace(/[{}]/g,''); }
function jpSpan(s){ return '<span class="jp">'+rb(s)+'</span>'; }
// Предложение с выделенным {словом}; blank=true — вместо слова пропуск
function sentHTML(s, blank){
  return String(s).split(/(\{[^}]*\})/).map(p=>{
    if(p[0]!=='{') return rb(p);
    return blank ? '<span class="gap">？</span>' : '<mark>'+rb(p.slice(1,-1))+'</mark>';
  }).join('');
}
function gapAnswer(s){ const m = String(s).match(/\{([^}]*)\}/); return m ? m[1] : null; }

/* ================= КИРИЛЛИЦА (Поливанов) ================= */
const KANA_RU = {
 'きゃ':'кя','きゅ':'кю','きょ':'кё','しゃ':'ся','しゅ':'сю','しょ':'сё','ちゃ':'тя','ちゅ':'тю','ちょ':'тё',
 'にゃ':'ня','にゅ':'ню','にょ':'нё','ひゃ':'хя','ひゅ':'хю','ひょ':'хё','みゃ':'мя','みゅ':'мю','みょ':'мё',
 'りゃ':'ря','りゅ':'рю','りょ':'рё','ぎゃ':'гя','ぎゅ':'гю','ぎょ':'гё','じゃ':'дзя','じゅ':'дзю','じょ':'дзё',
 'びゃ':'бя','びゅ':'бю','びょ':'бё','ぴゃ':'пя','ぴゅ':'пю','ぴょ':'пё',
 'てぃ':'ти','でぃ':'ди','ふぁ':'фа','ふぃ':'фи','ふぇ':'фэ','ふぉ':'фо','うぃ':'уи','うぇ':'уэ','じぇ':'дзэ','しぇ':'сэ','ちぇ':'тэ',
 'あ':'а','い':'и','う':'у','え':'э','お':'о','か':'ка','き':'ки','く':'ку','け':'кэ','こ':'ко',
 'さ':'са','し':'си','す':'су','せ':'сэ','そ':'со','た':'та','ち':'ти','つ':'цу','て':'тэ','と':'то',
 'な':'на','に':'ни','ぬ':'ну','ね':'нэ','の':'но','は':'ха','ひ':'хи','ふ':'фу','へ':'хэ','ほ':'хо',
 'ま':'ма','み':'ми','む':'му','め':'мэ','も':'мо','や':'я','ゆ':'ю','よ':'ё','ら':'ра','り':'ри','る':'ру','れ':'рэ','ろ':'ро',
 'わ':'ва','を':'о','ん':'н','が':'га','ぎ':'ги','ぐ':'гу','げ':'гэ','ご':'го','ざ':'дза','じ':'дзи','ず':'дзу','ぜ':'дзэ','ぞ':'дзо',
 'だ':'да','ぢ':'дзи','づ':'дзу','で':'дэ','ど':'до','ば':'ба','び':'би','ぶ':'бу','べ':'бэ','ぼ':'бо','ぱ':'па','ぴ':'пи','ぷ':'пу','ぺ':'пэ','ぽ':'по',
 'ぁ':'а','ぃ':'и','ぅ':'у','ぇ':'э','ぉ':'о'
};
function toRu(str){
  const h = kana(str).replace(/(こんにち|こんばん)は/g,'$1わ').replace(/[ァ-ヶ]/g, c=>String.fromCharCode(c.charCodeAt(0)-0x60)).replace(/[～、。？！・「」\s]/g,' ');
  let out='';
  for(let i=0;i<h.length;i++){
    const two=h.slice(i,i+2), one=h[i];
    if(one==='っ'){ const nx=KANA_RU[h.slice(i+1,i+3)]||KANA_RU[h[i+1]]; if(nx) out+=nx[0]; continue; }
    if(one==='ー'){ out+=':'; continue; }
    if(KANA_RU[two] && two.length===2){ out+=KANA_RU[two]; i++; continue; }
    if(one==='い' && /[аэоу]$/.test(out)){ out+='й'; continue; }
    if(one==='ん'){ const nx=KANA_RU[h[i+1]]||''; out+= /^[мбп]/.test(nx)?'м':'н'; continue; }
    out += KANA_RU[one] || one;
  }
  return out.replace(/\s+/g,' ').trim();
}

/* ================= ТИПЫ СЛОВ ================= */
const TYPES = {
  v1:['гл. I гр.','Глагол I группы (う-глагол)'], v2:['гл. II гр.','Глагол II группы (る-глагол)'], v3:['гл. III гр.','Неправильный глагол: する, 来る'],
  i:['い-прил.','い-прилагательное'], na:['な-прил.','な-прилагательное: перед существительным нужно な'],
  n:['сущ.','Существительное'], pron:['мест.','Местоимение, указательное слово'], q:['вопр.','Вопросительное слово'],
  adv:['нареч.','Наречие'], conj:['связка','Союз, связка'], suf:['суфф.','Суффикс, счётное слово'], expr:['выраж.','Выражение'], other:['слово','']
};
function tagHTML(t){ const T=TYPES[t]||TYPES.other; const c = ['v1','v2','v3','i','na'].includes(t)?'t-'+t:'t-other'; return '<span class="tag '+c+'" title="'+T[1]+'">'+T[0]+'</span>'; }
function display(w){ return w.t==='na' ? w.jp+'(な)' : w.jp; }

/* ================= СПРЯЖЕНИЕ ================= */
const I_ROW={'う':'い','く':'き','ぐ':'ぎ','す':'し','つ':'ち','ぬ':'に','ぶ':'び','む':'み','る':'り'};
const A_ROW={'う':'わ','く':'か','ぐ':'が','す':'さ','つ':'た','ぬ':'な','ぶ':'ば','む':'ま','る':'ら'};
const TE_END={'う':'って','つ':'って','る':'って','む':'んで','ぶ':'んで','ぬ':'んで','く':'いて','ぐ':'いで','す':'して'};
function taOf(te){ return te.replace(/て$/,'た').replace(/で$/,'だ'); }
function gnum(w){ return w.t==='v1'?1:w.t==='v2'?2:3; }
// Основы глагола по словарной форме d и группе g (1, 2, 3)
function vbase(d,g){
  if(g===3){
    if(d.endsWith('来[く]る')){ const p=d.slice(0,-5); return {m:p+'来[き]', n:p+'来[こ]', te:p+'来[き]て'}; }
    if(d.endsWith('する')){ const p=d.slice(0,-2); return {m:p+'し', n:p+'し', te:p+'して'}; }
    return null;
  }
  const e=d.slice(-1), p=d.slice(0,-1);
  if(g===2) return {m:p, n:p, te:p+'て'};
  if(!I_ROW[e]) return null;
  const te = d.endsWith('行[い]く') ? p+'って' : p+TE_END[e];
  return {m:p+I_ROW[e], n: d==='ある' ? '' : p+A_ROW[e], te};
}
const VFORMS = {
  masu:{label:'ます-форма', f:(b,d)=>b.m+'ます'},
  masen:{label:'ません (отрицание)', f:(b,d)=>b.m+'ません'},
  mashita:{label:'ました (прошедшее)', f:(b,d)=>b.m+'ました'},
  masendeshita:{label:'ませんでした (прош. отрицание)', f:(b,d)=>b.m+'ませんでした'},
  dict:{label:'словарная форма (辞書形)', f:(b,d)=>d},
  nai:{label:'ない-форма', f:(b,d)=>b.n+'ない'},
  te:{label:'て-форма', f:(b,d)=>b.te},
  ta:{label:'た-форма', f:(b,d)=>taOf(b.te)}
};
function conjV(w, form, g){ const b=vbase(w.d, g||gnum(w)); return b ? VFORMS[form].f(b, w.d) : null; }

const AFORMS = {
  neg:{label:'отрицание (просто)'}, negp:{label:'отрицание (вежливо)'},
  past:{label:'прошедшее (просто)'}, pastp:{label:'прошедшее (вежливо)'},
  pneg:{label:'прош. отрицание (просто)'}, pnegp:{label:'прош. отрицание (вежливо)'}
};
function conjA(jp, type, form){
  if(type==='i'){
    const b = jp==='いい' ? 'よ' : jp.slice(0,-1);
    return {neg:b+'くない', negp:b+'くないです', past:b+'かった', pastp:b+'かったです', pneg:b+'くなかった', pnegp:b+'くなかったです'}[form];
  }
  return {neg:jp+'じゃ ない', negp:jp+'じゃ ありません', past:jp+'だった', pastp:jp+'でした', pneg:jp+'じゃ なかった', pnegp:jp+'じゃ ありませんでした'}[form];
}
// Правдоподобные ошибки — как если бы слово было другой группы
function wrongForms(w, form){
  const pool = new Set();
  if(w.t==='i'||w.t==='na'){
    const j=w.jp, pol=form.endsWith('p')?'です':'';
    const iEnd={neg:'くない',negp:'くない',past:'かった',pastp:'かった',pneg:'くなかった',pnegp:'くなかった'}[form];
    pool.add(conjA(j, w.t, {neg:'past',negp:'pastp',past:'neg',pastp:'negp',pneg:'past',pnegp:'pastp'}[form]));
    if(w.t==='i'){
      pool.add(conjA(j,'na',form));          // 高いじゃない, 高いでした
      pool.add(j+iEnd+pol);                  // 高いくない, 高いかった
      if(j==='いい') pool.add('い'+iEnd+pol);  // いくない
    } else {
      pool.add(j+iEnd+pol);                  // 静かくない, 静かかった
      pool.add(j+'ない'+pol);                 // 静かない
      if(j.endsWith('い')) pool.add(j.slice(0,-1)+iEnd+pol); // きれくない
      pool.add(conjA(j,'na',{neg:'pneg',negp:'pnegp',past:'pneg',pastp:'pnegp',pneg:'neg',pnegp:'negp'}[form]));
    }
  } else {
    const g = gnum(w);
    [1,2].forEach(gg=>{ if(gg!==g){ const x=conjV(w, form, gg); if(x) pool.add(x); } });
    const p = w.d.slice(0,-1), b = vbase(w.d,g);
    if(form==='te'||form==='ta'){ ['って','んで','いて','して'].forEach(x=>pool.add(p+(form==='te'?x:taOf(x)))); pool.add(b.m+(form==='te'?'て':'た')); }
    if(form==='nai'){ pool.add(b.m+'ない'); pool.add(w.d+'ない'); pool.add(p+'らない'); pool.add(p+'わない'); pool.add(p+'ない'); }
    if(form==='dict'){ ['る','う','く','む'].forEach(x=>pool.add(p+x)); pool.add(b.m+'る'); pool.add(b.m+'う'); }
    if(form.startsWith('mas')){
      const suf = VFORMS[form].f({m:''},'');
      pool.add(w.d+suf); if(b.n) pool.add(b.n+suf); pool.add(p+'い'+suf); pool.add(p+'り'+suf);
    }
  }
  const right = w.t==='i'||w.t==='na' ? conjA(w.jp,w.t,form) : conjV(w,form);
  return [...pool].filter(x=>x && x!==right && !x.includes('undefined'));
}
function ruleText(w, form){
  if(w.t==='i'){
    const base = w.jp==='いい' ? '<b>いい → よ</b> (исключение), затем ' : '';
    return 'い-прилагательное: '+base+'い → <b>くない</b> (не), <b>かった</b> (было), <b>くなかった</b> (не было). Вежливо — добавь です.';
  }
  if(w.t==='na') return 'な-прилагательное: как существительное — <b>じゃ ない / じゃ ありません</b>, <b>だった / でした</b>, <b>じゃ なかった / じゃ ありませんでした</b>.';
  const g=gnum(w), e=w.d.slice(-1);
  if(g===3) return 'III группа — запоминается: <b>する → します・しない・して・した</b>; <b>来[く]る → 来[き]ます・来[こ]ない・来[き]て・来[き]た</b>.';
  if(g===2) return 'II группа: отбрасываем <b>る</b> и добавляем окончание: ます・ない・て・た.';
  const map = {
    te:'I группа: <b>'+e+' → '+(w.d.endsWith('行[い]く')?'って (исключение 行く!)':TE_END[e])+'</b>.',
    ta:'I группа: как て-форма, но с た/だ: <b>'+e+' → '+(w.d.endsWith('行[い]く')?'った (исключение 行く!)':taOf(TE_END[e]))+'</b>.',
    nai:'I группа: <b>'+e+' → '+(w.d==='ある'?'ない (исключение ある!)':A_ROW[e]+'ない')+'</b> — звук «у» меняем на «а».',
    dict:'I группа: <b>'+I_ROW[e]+'ます → '+e+'</b> — звук «и» перед ます меняем на «у».'
  };
  return map[form] || 'I группа: <b>'+e+' → '+I_ROW[e]+'</b> + ます/ません/ました.';
}

/* ================= ХРАНИЛИЩЕ ================= */
const LS = 'nihongo_n5_progress';
const storage = (()=>{
  try{ localStorage.setItem('__nh__','1'); localStorage.removeItem('__nh__'); return localStorage; }
  catch(e){
    const mem={};
    setTimeout(()=>{ try{ showFatal('Браузер запретил сохранение — сайт работает, но прогресс не сохранится после закрытия вкладки.'); }catch(_){} },0);
    return {getItem:k=>(k in mem?mem[k]:null), setItem:(k,v)=>{mem[k]=String(v);}, removeItem:k=>{delete mem[k];}};
  }
})();
let store;
try{ store = JSON.parse(storage.getItem(LS)||'null'); }catch(e){ store=null; }
store ||= {v:1};
store.lessons ||= {}; store.reviews ||= {}; store.srs ||= {}; store.act ||= {};
store.streak ||= {count:0,last:''}; store.history ||= []; store.lastDay ||= 0;
store.drill ||= {}; if(store.furi===undefined) store.furi = true;
function save(){ try{ storage.setItem(LS, JSON.stringify(store)); }catch(e){} }
function drillHit(kind, ok){ const d = store.drill[kind] ||= {c:0,t:0}; d.t++; if(ok) d.c++; save(); }

let cur = Math.min(store.lastDay, SCHED.length-1);
let mode = 'learn', lastPractice = 'flashcards';
function entry(){ return SCHED[cur]; }
function isReviewDay(){ return entry().type==='review'; }
function lessonState(i){ return store.lessons['l'+i] ||= {learned:[], score:null}; }
function curLessonIdx(){ const e=entry(); return e.type==='review' ? e.from : [e.li]; }
function curWords(){ return curLessonIdx().flatMap(i=>LESSONS[i].words); }
function curPhrases(){ return curLessonIdx().flatMap(i=>LESSONS[i].phrases); }
function maxLesson(){ const a=curLessonIdx(); return a[a.length-1]; }
function wordsUpTo(){ return ALL_WORDS.filter(w=>w.li<=maxLesson()); }

/* ================= ДАТЫ / СЕРИЯ ================= */
function iso(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function today(){ return iso(new Date()); }
function addDays(ds,n){ const d=new Date(ds+'T12:00:00'); d.setDate(d.getDate()+n); return iso(d); }
function bump(){
  const t=today(); store.act[t]=(store.act[t]||0)+1;
  const s=store.streak; if(s.last!==t){ s.count = s.last===addDays(t,-1) ? s.count+1 : 1; s.last=t; }
  save(); renderStreak();
}
function streakNow(){ const s=store.streak; return (s.last===today()||s.last===addDays(today(),-1)) ? s.count : 0; }
function renderStreak(){ document.getElementById('streakEl').textContent = streakNow(); }

/* ================= SRS: ошибки возвращаются через 1, 3, 7 дней ================= */
const SRS_INT=[0,1,3,7];
function srsWrong(jp){ if(!WORDMAP[jp]) return; store.srs[jp]={box:0,due:today()}; save(); updateBadge(); }
function srsRight(jp){ const e=store.srs[jp]; if(!e) return; e.box++; if(e.box>=SRS_INT.length) delete store.srs[jp]; else e.due=addDays(today(),SRS_INT[e.box]); save(); updateBadge(); }
function dueList(){ const t=today(); return Object.keys(store.srs).filter(k=>store.srs[k].due<=t && WORDMAP[k]); }
function updateBadge(){ document.getElementById('srsBadge').textContent = dueList().length || ''; }

/* ================= МЕЛОЧИ ================= */
function shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){const j=(Math.random()*(i+1))|0;[a[i],a[j]]=[a[j],a[i]];} return a; }
function pick(a,n){ return shuffle(a).slice(0,n); }
function norm(s){ return String(s).toLowerCase().trim().replace(/[.,;!?«»"]/g,'').replace(/ё/g,'е').replace(/\s+/g,' '); }
function confetti(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cols=['#f4a6c1','#f5b95a','#93a0ff','#ffffff'];
  for(let i=0;i<60;i++){ const d=document.createElement('div'); d.className='conf'; d.style.left=Math.random()*100+'vw';
    d.style.background=cols[i%4]; d.style.animationDelay=(Math.random()*.5)+'s'; document.body.appendChild(d); setTimeout(()=>d.remove(),3500); }
}
const $ = id => document.getElementById(id);

/* ================= ШАПКА ================= */
function renderHeader(){
  const e=entry(), review=e.type==='review';
  $('dayNum').textContent = cur+1;
  if(review){
    $('dayTopic').textContent = 'Повторение';
    $('daySub').textContent = 'уроки '+LESSONS[e.from[0]].mnn+'–'+LESSONS[e.from[2]].mnn+' учебника';
  } else {
    $('dayTopic').textContent = LESSONS[e.li].topic;
    $('daySub').textContent = 'Минна но Нихонго, урок '+LESSONS[e.li].mnn+' · 第'+LESSONS[e.li].mnn+'課';
  }
  $('prev').disabled = cur===0; $('next').disabled = cur===SCHED.length-1;
  const L = review ? null : LESSONS[e.li];
  $('heroCard').innerHTML = review
    ? '<b>День '+(cur+1)+' · повторение</b><br>'+curWords().length+' слов из трёх уроков. Карточки, пары и большой тест — проверь, что закрепилось.'
    : '<b>Урок '+L.mnn+' · '+esc(L.topic)+'</b><br>'+L.words.length+' слов с примерами, '+L.phrases.length+' фраз и '+((DATA.grammar[L.mnn]||[]).length)+' тем грамматики. Прогресс сохраняется сам.';
}
function renderProgress(){
  const e=entry(); let pct=0;
  if(e.type==='lesson'){ const st=lessonState(e.li); pct=Math.round(st.learned.length/LESSONS[e.li].words.length*100); }
  else { const sc=store.reviews['r'+(cur+1)]; pct = sc&&sc.score ? Math.round(sc.score.c/sc.score.t*100) : 0; }
  $('progBar').style.width = pct+'%';
}
function applyFuri(){
  document.documentElement.classList.toggle('nofuri', !store.furi);
  $('furiBtn').setAttribute('aria-pressed', store.furi?'true':'false');
}
$('furiBtn').onclick = ()=>{ store.furi=!store.furi; save(); applyFuri(); };

/* ================= ПОПАП СЛОВА ================= */
const popup = $('wordPopup');
function showPopup(el, w){
  let forms='';
  if(w.d){ forms = '<div class="pf">'+['dict','nai','te','ta'].map(f=>'<span>'+VFORMS[f].label.split(' (')[0]+':</span> '+rb(conjV(w,f))).join('<br>')+'</div>'; }
  else if(w.t==='i'||w.t==='na'){ forms = '<div class="pf"><span>не:</span> '+rb(conjA(w.jp,w.t,'neg'))+'<br><span>было:</span> '+rb(conjA(w.jp,w.t,'past'))+'</div>'; }
  popup.innerHTML = '<div class="pw">'+rb(display(w))+'</div>'+
    '<div class="pk">'+esc(kana(w.jp))+' · '+esc(toRu(w.jp))+'</div>'+
    '<div class="pr">'+esc(w.ru)+' '+tagHTML(w.t)+'</div>'+
    (w.note?'<div class="note">'+esc(w.note)+'</div>':'')+forms;
  const r = el.getBoundingClientRect();
  let left = r.left + scrollX; const pw = Math.min(300, innerWidth-24);
  if(left+pw > innerWidth-12) left = innerWidth-pw-12;
  popup.style.left = Math.max(12,left)+'px'; popup.style.top = (r.bottom+scrollY+6)+'px';
  popup.classList.add('show');
}
document.addEventListener('click', e=>{ if(!e.target.closest('td.w') && !e.target.closest('#wordPopup')) popup.classList.remove('show'); });
document.addEventListener('keydown', e=>{ if(e.key==='Escape') popup.classList.remove('show'); });

/* ================= СЛОВА ================= */
function renderLearn(){
  const box=$('learn'), e=entry();
  const lessons = curLessonIdx();
  let html='';
  lessons.forEach(li=>{
    const L=LESSONS[li], st=lessonState(li);
    if(lessons.length>1) html+='<h2 class="sect-title">Урок '+L.mnn+' · '+esc(L.topic)+'</h2>';
    html+='<div class="tablebox"><table><thead><tr><th class="num">№</th><th>Слово</th><th>Чтение</th><th>Тип</th><th>Перевод и пример</th><th class="chk">Знаю</th></tr></thead><tbody>';
    html+=L.words.map((w,i)=>{
      const on=st.learned.includes(i);
      return '<tr class="'+(on?'learned':'')+'">'+
        '<td class="num">'+(i+1)+'</td>'+
        '<td class="w" data-jp="'+esc(w.jp)+'" tabindex="0">'+rb(display(w))+'</td>'+
        '<td class="rd">'+esc(kana(w.jp))+'<span class="pol">'+esc(toRu(w.jp))+'</span></td>'+
        '<td class="ty">'+tagHTML(w.t)+(w.d?'<div class="jp" style="font-size:14px;margin-top:6px;color:var(--muted)">'+rb(w.d)+'</div>':'')+'</td>'+
        '<td class="tr">'+esc(w.ru)+(w.note?'<div class="note">'+esc(w.note)+'</div>':'')+
          '<div class="ex">'+sentHTML(w.ex)+'</div><div class="exru">'+esc(w.exru)+'</div></td>'+
        '<td class="chk"><input type="checkbox" aria-label="Знаю слово" data-li="'+li+'" data-i="'+i+'" '+(on?'checked':'')+'></td></tr>';
    }).join('');
    html+='</tbody></table></div>';
  });
  html+='<p class="help" style="margin-top:12px">Нажми на слово — появятся чтение и формы. <b>Розовые знаки над кандзи</b> — фуригана, чтение хираганой; её можно скрыть кнопкой «ふりがな», когда захочешь проверить себя. '+
    'У глаголов под типом — словарная форма. Группы глаголов — как в учебнике: <span class="tag t-v1">I</span> <span class="tag t-v2">II</span> <span class="tag t-v3">III</span>.</p>';
  html+='<h2 class="sect-title">Фразы урока <small>устойчивые выражения</small></h2><div class="phr-list">';
  html+=curPhrases().map(p=>'<div class="phr"><div class="jp">'+rb(p.jp)+'</div><div>'+esc(p.ru)+'</div><span class="reg reg-'+p.reg+'">'+({f:'вежливо',c:'с друзьями',n:'нейтрально'}[p.reg])+'</span>'+(p.note?'<div class="note">'+esc(p.note)+'</div>':'')+'</div>').join('');
  html+='</div>';
  box.innerHTML=html;
  box.querySelectorAll('td.w').forEach(td=>{
    const w=WORDMAP[td.dataset.jp];
    td.onclick=()=>showPopup(td,w);
    td.onkeydown=ev=>{ if(ev.key==='Enter'||ev.key===' '){ ev.preventDefault(); showPopup(td,w); } };
  });
  box.querySelectorAll('input[type=checkbox]').forEach(c=>{
    c.onchange=()=>{
      const li=+c.dataset.li, i=+c.dataset.i, st=lessonState(li);
      if(c.checked){ if(!st.learned.includes(i)) st.learned.push(i); } else st.learned=st.learned.filter(x=>x!==i);
      c.closest('tr').classList.toggle('learned', c.checked);
      save(); bump(); renderProgress();
    };
  });
  renderProgress();
}

/* ================= ГРАММАТИКА ================= */
let gramTab = 'lesson';
function gcard(g, ref){
  return '<article class="gcard"><h3>'+rbHTML(g.title)+'</h3>'+(ref?'<div class="ref">'+ref+'</div>':'')+
    '<p>'+rbHTML(g.body)+'</p>'+
    (g.ex&&g.ex.length?'<div class="gex">'+g.ex.map(x=>'<div><div class="jp">'+rb(x[0])+'</div><div class="ru">'+esc(x[1])+'</div></div>').join('')+'</div>':'')+
    (g.extra||'')+'</article>';
}
function conjTable(words, forms, labelFn){
  return '<div class="conj tablebox"><table><thead><tr><th></th>'+words.map(w=>'<th>'+esc(w.ru.split(/[,;(]/)[0])+'</th>').join('')+'</tr></thead><tbody>'+
    forms.map(f=>'<tr><td>'+labelFn(f)+'</td>'+words.map(w=>'<td>'+rb(f==='_group'?'':(w.d?conjV(w,f):conjA(w.jp,w.t,f)))+(f==='_group'?tagHTML(w.t):'')+'</td>').join('')+'</tr>').join('')+
    '</tbody></table></div>';
}
function renderGrammar(){
  const box=$('grammar');
  const tabs=[['lesson', isReviewDay()?'Уроки дня':'Урок '+LESSONS[entry().li].mnn],['particles','Частицы'],['verbs','Глаголы: формы'],['adj','Прилагательные'],['style','Вежливо и просто']];
  let html='<div class="chips" role="tablist">'+tabs.map(t=>'<button class="chip '+(gramTab===t[0]?'active':'')+'" data-g="'+t[0]+'">'+t[1]+'</button>').join('')+'</div><div class="gram">';
  if(gramTab==='lesson'){
    curLessonIdx().forEach(li=>{
      const L=LESSONS[li];
      html+='<h2 class="sect-title">Урок '+L.mnn+' · '+esc(L.topic)+'</h2>';
      html+=(DATA.grammar[L.mnn]||[]).map(g=>gcard(g,'Минна но Нихонго, урок '+L.mnn)).join('');
    });
    html+='<p class="help">Эти темы совпадают с разделом «文型・例文» (грамматика и примеры) урока в учебнике — удобно читать параллельно.</p>';
  }
  if(gramTab==='particles'){
    html+='<p class="help" style="margin-bottom:14px">Частица стоит <b>после</b> слова и показывает его роль в предложении — как падежные окончания в русском. Потренироваться — «Практика → Частицы».</p>';
    html+=DATA.particles.map(p=>gcard({title:'<span class="jp">'+p.p+'</span> — '+p.title.split(' — ').slice(1).join(' — '), body:p.body, ex:p.ex},'Минна но Нихонго: урок '+p.mnn)).join('');
  }
  if(gramTab==='verbs'){
    const sample = ['書[か]く','飲[の]む','帰[かえ]る','食[た]べる','見[み]る','する','来[く]る'].map(d=>ALL_WORDS.find(w=>w.d===d)).filter(Boolean);
    html+=gcard({title:'Три группы глаголов',body:'<b>I группа</b> (う-глаголы): перед ます звук «и» — 書きます, 飲みます. <b>II группа</b> (る-глаголы): перед ます звук «э» — 食べます, или «и» у особых глаголов — 見ます, 起きます, 借ります, います (их учебник даёт отдельным списком). <b>III группа</b> — только します и 来ます.<br>Ловушки: <b>帰る, 切る, 入る, 走る, 知る</b> похожи на II группу, но это I.'},'Минна но Нихонго: урок 14 (группы), 4 (ます)');
    html+=gcard({title:'ます-форма и словарная форма (辞書形)',body:'<b>ます-форма</b> — вежливая, её учат первой. <b>Словарная форма</b> — так глагол записан в словаре, так говорят с друзьями.<br>I: 書<b>き</b>ます → 書<b>く</b> (и → у). II: 食べ<b>ます</b> → 食べ<b>る</b>. III: します → する, 来[き]ます → 来[く]る.',extra:conjTable(sample,['_group','masu','dict'],f=>f==='_group'?'группа':VFORMS[f].label)},'Минна но Нихонго: урок 4 (ます), урок 18 (辞書形)');
    html+=gcard({title:'ない-форма',body:'Простое отрицание «не делаю». I: звук «у» → «а» + ない: 書<b>く</b> → 書<b>か</b>ない; <b>う → わ</b>ない: 買う → 買わない. II: る → ない. III: しない, 来[こ]ない. Исключение: <b>ある → ない</b>.',extra:conjTable(sample,['nai'],f=>VFORMS[f].label)},'Минна но Нихонго: урок 17');
    html+=gcard({title:'て-форма',body:'Самая нужная форма: просьбы (～てください), «сейчас делаю» (～ています) и многое другое.<br>I группа по последнему звуку: <b>う・つ・る → って</b>, <b>む・ぶ・ぬ → んで</b>, <b>く → いて</b>, <b>ぐ → いで</b>, <b>す → して</b>. Исключение: <b>行く → 行って</b>.<br>II: る → て. III: して, 来[き]て.',extra:conjTable(sample,['te'],f=>VFORMS[f].label)},'Минна но Нихонго: урок 14');
    html+=gcard({title:'た-форма',body:'Простое прошедшее «сделал». Строится точно как て-форма, только て → <b>た</b>, で → <b>だ</b>: 書いて → 書いた, 飲んで → 飲んだ.',extra:conjTable(sample,['ta'],f=>VFORMS[f].label)},'Минна но Нихонго: урок 19');
  }
  if(gramTab==='adj'){
    const ia=['高[たか]い','いい'].map(j=>WORDMAP[j]), na=['静[しず]か','きれい'].map(j=>WORDMAP[j]);
    html+=gcard({title:'い-прилагательные',body:'Изменяются сами: <b>い → くない</b> (не), <b>い → かった</b> (было), <b>い → くなかった</b> (не было). Для вежливости добавь です. Запомни: <b>いい → よくない, よかった</b>. Ошибка новичка — «高いでした»: правильно <b>高かったです</b>.',extra:conjTable(ia,Object.keys(AFORMS),f=>AFORMS[f].label)},'Минна но Нихонго: урок 8 (настоящее), урок 12 (прошедшее)');
    html+=gcard({title:'な-прилагательные',body:'Изменяются как существительные — через связку: <b>じゃ ない</b>, <b>だった / でした</b>, <b>じゃ なかった</b>. Перед существительным — <b>な</b>: 静かな 町. Ловушка: <b>きれい</b> и <b>嫌[きら]い</b> оканчиваются на い, но это な-прилагательные — «きれくない» не бывает.',extra:conjTable(na,Object.keys(AFORMS),f=>AFORMS[f].label)},'Минна но Нихонго: урок 8, урок 12');
  }
  if(gramTab==='style'){
    html+=gcard({title:'Вежливая речь (です・ます) и простая',body:'С незнакомыми, старшими, коллегами — <b>です・ます</b>. С друзьями и семьёй — <b>простая форма</b>:<br>ます → словарная форма (行きます → 行く), ません → ない, ました → た, ませんでした → なかった.<br>です: у сущ. и な-прил. → <b>だ</b> (часто опускается), у い-прил. просто убираем (高いです → 高い).<br>В простой речи か в вопросе обычно не ставят, частицы は・を часто пропадают, はい → <b>うん</b>, いいえ → <b>ううん</b>.'},'Минна но Нихонго: урок 20');
    html+='<article class="gcard"><h3>Один разговор — два стиля</h3><div class="dlg"><div class="h">С коллегой (вежливо)</div><div class="h">С другом (просто)</div>'+
      DATA.dialog.map(d=>'<div class="jp">'+rb(d[0])+'</div><div class="jp">'+rb(d[1])+'</div><div class="ru">'+esc(d[2])+'</div>').join('')+'</div></article>';
  }
  html+='</div>';
  box.innerHTML=html;
  box.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>{ gramTab=b.dataset.g; renderGrammar(); });
}
