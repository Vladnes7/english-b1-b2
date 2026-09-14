
/* ================= ОБЩИЙ ВОПРОС С ВАРИАНТАМИ =================
   q: {counter, dir, prompt(html), hint, options:[строки с фуриганой], right, explain(html), onAnswer(ok)} */
function askChoice(box, q, next){
  const opts = shuffle([q.right, ...[...new Set(q.wrong.filter(x=>x!==q.right))].slice(0,3)]);
  box.innerHTML = '<div class="card">'+
    '<div class="counter">'+q.counter+'</div><div class="dir">'+q.dir+'</div>'+
    '<div class="'+(q.cls||'big')+'">'+q.prompt+'</div>'+(q.hint?'<div class="hint">'+q.hint+'</div>':'')+
    '<div class="opts">'+opts.map((o,i)=>'<button class="opt" data-i="'+i+'">'+(q.plainOpts?esc(o):rb(o))+'</button>').join('')+'</div>'+
    '<div class="feedback" id="chFb" aria-live="polite"></div><div class="explain" id="chEx"></div>'+
    '<div class="actions"><button class="btn primary" id="chNext" hidden>Дальше ›</button></div></div>';
  const btns = box.querySelectorAll('.opt');
  btns.forEach(b=>b.onclick=()=>{
    const chosen = opts[+b.dataset.i], ok = chosen===q.right;
    btns.forEach(x=>{ x.disabled=true; if(opts[+x.dataset.i]===q.right) x.classList.add('ok'); });
    if(!ok) b.classList.add('no');
    const fb=box.querySelector('#chFb'); fb.textContent = ok ? 'Верно!' : 'Не совсем. Правильный ответ отмечен зелёным.'; fb.className='feedback '+(ok?'good':'bad');
    if(q.explain) box.querySelector('#chEx').innerHTML = q.explain;
    q.onAnswer && q.onAnswer(ok); bump();
    const n=box.querySelector('#chNext'); n.hidden=false; n.focus(); n.onclick=next;
  });
}
function finishCard(box, title, c, t, again){
  if(c===t && t>0) confetti();
  box.innerHTML='<div class="card result"><div class="dir">'+title+'</div><div class="score">'+c+' / '+t+'</div>'+
    '<div class="hint">'+(c===t?'Без единой ошибки!':'Слова с ошибками уже ждут во вкладке «Повторить».')+'</div>'+
    '<div class="actions"><button class="btn primary" id="again">Ещё раз</button></div></div>';
  box.querySelector('#again').onclick=again;
}

// Зелёная вспышка на кнопке «Знаю / Не знаю» — подтверждает нажатие, в том числе на телефоне
function flashBtn(b){ if(!b) return; b.classList.remove('flash'); void b.offsetWidth; b.classList.add('flash'); setTimeout(()=>b.classList.remove('flash'),450); }

/* ================= КАРТОЧКИ ================= */
let fc={items:[],idx:0,known:new Set(),src:'words'};
function flipReset(el){ if(!el||!el.classList.contains('flipped')) return; el.style.transition='none'; el.classList.remove('flipped'); void el.offsetWidth; el.style.transition=''; }
function initFlash(){
  fc.items = fc.src==='words' ? curWords().slice() : curPhrases().slice();
  fc.idx=0; fc.known=new Set();
  const box=$('flashcards');
  box.innerHTML='<div class="chips" style="justify-content:center"><button class="chip" data-src="words">Слова</button><button class="chip" data-src="phrases">Фразы</button></div>'+
    '<div class="fc-wrap"><div class="fc-card" id="fcCard" tabindex="0" role="button" aria-label="Перевернуть карточку">'+
    '<div class="fc-face" id="fcFront"></div><div class="fc-face fc-back" id="fcBack"></div></div></div>'+
    '<p class="help" style="text-align:center;margin-top:10px">Нажми на карточку, чтобы перевернуть</p>'+
    '<div class="fc-nav"><button class="iconbtn" id="fcPrev" aria-label="Назад">‹</button><span class="fc-counter" id="fcCounter"></span><button class="iconbtn" id="fcNext" aria-label="Вперёд">›</button></div>'+
    '<div class="actions"><button class="btn know" id="fcKnow">Знаю</button><button class="btn know" id="fcSkip">Не знаю</button><button class="btn" id="fcShuf">Перемешать</button></div>'+
    '<p class="help" id="fcStatus" style="text-align:center;margin-top:10px"></p>';
  box.querySelectorAll('[data-src]').forEach(b=>{ b.classList.toggle('active',b.dataset.src===fc.src); b.onclick=()=>{ fc.src=b.dataset.src; initFlash(); }; });
  const card=$('fcCard');
  card.onclick=()=>card.classList.toggle('flipped');
  card.onkeydown=e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); card.classList.toggle('flipped'); } };
  $('fcPrev').onclick=()=>{ if(fc.idx>0){ fc.idx--; renderFlash(); } };
  $('fcNext').onclick=()=>{ if(fc.idx<fc.items.length-1){ fc.idx++; renderFlash(); } };
  $('fcShuf').onclick=()=>{ fc.items=shuffle(fc.items); fc.idx=0; renderFlash(); };
  $('fcKnow').onclick=()=>{ flashBtn($('fcKnow')); markCard(true); };
  $('fcSkip').onclick=()=>{ flashBtn($('fcSkip')); markCard(false); };
  renderFlash();
}
function renderFlash(){
  flipReset($('fcCard'));
  const w=fc.items[fc.idx];
  if(fc.src==='words'){
    $('fcFront').innerHTML='<div class="fc-word">'+rb(display(w))+'</div><div style="margin-top:6px">'+tagHTML(w.t)+'</div>';
    $('fcBack').innerHTML='<div class="fc-ru">'+esc(w.ru)+'</div>'+(w.d?'<div class="help jp">'+rb(w.d)+'</div>':'')+
      '<div class="fc-ex">'+sentHTML(w.ex)+'</div><div class="fc-exru">'+esc(w.exru)+'</div>';
  } else {
    $('fcFront').innerHTML='<div class="fc-word" style="font-size:clamp(22px,4vw,32px)">'+rb(w.jp)+'</div><div style="margin-top:8px"><span class="reg reg-'+w.reg+'">'+({f:'вежливо',c:'с друзьями',n:'нейтрально'}[w.reg])+'</span></div>';
    $('fcBack').innerHTML='<div class="fc-ru">'+esc(w.ru)+'</div>'+(w.note?'<div class="note" style="margin-top:10px">'+esc(w.note)+'</div>':'');
  }
  $('fcCounter').textContent=(fc.idx+1)+' / '+fc.items.length;
  $('fcPrev').disabled=fc.idx===0; $('fcNext').disabled=fc.idx===fc.items.length-1;
  $('fcStatus').textContent = fc.known.size ? 'Знаешь: '+fc.known.size+' из '+fc.items.length : '';
}
function markCard(ok){
  const w=fc.items[fc.idx];
  if(ok){ fc.known.add(fc.idx); if(fc.src==='words') srsRight(w.jp); } else { fc.known.delete(fc.idx); if(fc.src==='words') srsWrong(w.jp); }
  bump();
  if(fc.idx<fc.items.length-1){ fc.idx++; renderFlash(); }
  else $('fcStatus').textContent='Готово! Знаешь '+fc.known.size+' из '+fc.items.length+'.';
}

/* ================= ПАРЫ ================= */
let ms={src:'words'};
function startMatch(){
  const pool = ms.src==='words' ? curWords() : curPhrases();
  const items = pick(pool, Math.min(6,pool.length));
  ms = {src:ms.src, left:shuffle(items.map((w,i)=>({id:'j'+i,pair:i,html:rb(ms.src==='words'?display(w):w.jp)}))),
        right:shuffle(items.map((w,i)=>({id:'r'+i,pair:i,html:esc(w.ru)}))), sel:null, done:new Set(), errors:0, wrong:null, lock:false, total:items.length};
  renderMatch();
}
function renderMatch(){
  const box=$('match');
  let html='<div class="chips" style="justify-content:center"><button class="chip '+(ms.src==='words'?'active':'')+'" data-src="words">Слова</button><button class="chip '+(ms.src==='phrases'?'active':'')+'" data-src="phrases">Фразы</button></div>';
  if(ms.done.size===ms.total){
    if(ms.errors===0) confetti();
    box.innerHTML=html+'<div class="card result"><div class="score">'+ms.total+' / '+ms.total+'</div><div class="hint">Все пары собраны. Ошибок: '+ms.errors+'</div><div class="actions"><button class="btn primary" id="mAgain">Новый раунд</button></div></div>';
    $('mAgain').onclick=startMatch; wireSrc(); return;
  }
  html+='<p class="help" style="text-align:center;margin-bottom:12px">Соедини японское с переводом. Собрано: '+ms.done.size+' / '+ms.total+' · ошибок: '+ms.errors+'</p><div class="match-grid">';
  for(let i=0;i<ms.left.length;i++){
    [ms.left[i], ms.right[i]].forEach((it,side)=>{
      const done=ms.done.has(it.pair), sel=ms.sel&&ms.sel.id===it.id, no=ms.wrong&&ms.wrong.includes(it.id);
      html+='<button class="match-btn '+(side===0?'jpside ':'')+(done?'ok ':'')+(sel?'sel ':'')+(no?'no':'')+'" data-id="'+it.id+'" data-pair="'+it.pair+'" data-side="'+side+'" '+(done?'disabled':'')+'>'+it.html+'</button>';
    });
  }
  html+='</div><div class="actions"><button class="btn" id="mNew">Новый раунд</button></div>';
  box.innerHTML=html; wireSrc();
  $('mNew').onclick=startMatch;
  box.querySelectorAll('.match-btn:not([disabled])').forEach(b=>b.onclick=()=>{
    if(ms.lock) return;
    const it={id:b.dataset.id,pair:+b.dataset.pair,side:b.dataset.side};
    if(!ms.sel||ms.sel.side===it.side){ ms.sel = ms.sel&&ms.sel.id===it.id ? null : it; renderMatch(); return; }
    if(ms.sel.pair===it.pair){ ms.done.add(it.pair); ms.sel=null; bump(); renderMatch(); }
    else { ms.errors++; ms.wrong=[ms.sel.id,it.id]; ms.lock=true; renderMatch(); setTimeout(()=>{ ms.wrong=null; ms.sel=null; ms.lock=false; renderMatch(); },700); }
  });
  function wireSrc(){ box.querySelectorAll('[data-src]').forEach(b=>b.onclick=()=>{ ms.src=b.dataset.src; startMatch(); }); }
}

/* ================= ПРОПУСКИ ================= */
let gp=null;
function startGaps(){ gp={items:shuffle(curWords().filter(w=>gapAnswer(w.ex))), idx:0, c:0}; nextGap(); }
function nextGap(){
  const box=$('gaps');
  if(gp.idx>=gp.items.length){ drillHit('gaps',true); return finishCard(box,'Пропуски пройдены',gp.c,gp.items.length,startGaps); }
  const w=gp.items[gp.idx], ans=gapAnswer(w.ex);
  const same = ALL_WORDS.filter(x=>x.jp!==w.jp && x.t===w.t && gapAnswer(x.ex) && gapAnswer(x.ex)!==ans);
  const pool = same.length>=3 ? same : ALL_WORDS.filter(x=>x.jp!==w.jp && gapAnswer(x.ex) && gapAnswer(x.ex)!==ans);
  const wrong=[...new Set(shuffle(pool).map(x=>gapAnswer(x.ex)))];
  askChoice(box,{counter:(gp.idx+1)+' / '+gp.items.length+' · верно: '+gp.c, dir:'Какое слово пропущено?', cls:'sent', prompt:sentHTML(w.ex,true), hint:esc(w.exru),
    right:ans, wrong, explain:'<span class="jp">'+sentHTML(w.ex)+'</span><br>'+esc(kanjiOnly(ans))+' — '+esc(w.ru)+' '+tagHTML(w.t),
    onAnswer:ok=>{ if(ok){gp.c++; srsRight(w.jp);} else srsWrong(w.jp); }}, ()=>{ gp.idx++; nextGap(); });
}

/* ================= КАНДЗИ: прочитай слово ================= */
let kj=null;
function startKanji(){
  const pool = shuffle(wordsUpTo().filter(w=>HAS_KANJI.test(w.jp)));
  const own = pool.filter(w=>curLessonIdx().includes(w.li));
  kj={items:(own.length?own:pool).slice(0,15), all:pool, idx:0, c:0};
  nextKanji();
}
function nextKanji(){
  const box=$('kanji');
  if(kj.idx>=kj.items.length) return finishCard(box,'Чтение кандзи',kj.c,kj.items.length,startKanji);
  const w=kj.items[kj.idx], right=kana(w.jp);
  const byLen = shuffle(ALL_WORDS.filter(x=>HAS_KANJI.test(x.jp) && kana(x.jp)!==right)).sort((a,b)=>Math.abs(kana(a.jp).length-right.length)-Math.abs(kana(b.jp).length-right.length));
  askChoice(box,{counter:(kj.idx+1)+' / '+kj.items.length+' · верно: '+kj.c, dir:'Как читается это слово? Фуригана спрятана.', prompt:'<span lang="ja">'+esc(kanjiOnly(display(w)))+'</span>',
    hint:esc(w.ru), right, wrong:[...new Set(byLen.slice(0,6).map(x=>kana(x.jp)))], plainOpts:true,
    explain:'<span class="jp" style="font-size:24px">'+rb(w.jp)+'</span> — '+esc(w.ru)+'<br><span class="jp">'+sentHTML(w.ex)+'</span>',
    onAnswer:ok=>{ drillHit('kanji',ok); if(ok){kj.c++; srsRight(w.jp);} else srsWrong(w.jp); }}, ()=>{ kj.idx++; nextKanji(); });
}

/* ================= ЧАСТИЦЫ ================= */
let pt=null;
function startParticles(){
  const mnn = LESSONS[maxLesson()].mnn;
  pt={items:shuffle(DATA.pdrill.filter(x=>x.l<=mnn)).slice(0,15), idx:0, c:0, mnn};
  nextParticle();
}
function nextParticle(){
  const box=$('particles');
  if(pt.idx>=pt.items.length) return finishCard(box,'Частицы',pt.c,pt.items.length,startParticles);
  const x=pt.items[pt.idx], right=gapAnswer(x.s);
  askChoice(box,{counter:(pt.idx+1)+' / '+pt.items.length+' · верно: '+pt.c+' · частицы уроков 1–'+pt.mnn, dir:'Вставь частицу', cls:'sent', prompt:sentHTML(x.s,true), hint:esc(x.ru),
    right, wrong:x.o.filter(o=>o!==right), explain:'<span class="jp">'+sentHTML(x.s)+'</span><br>'+esc(x.why),
    onAnswer:ok=>{ drillHit('particles',ok); if(ok) pt.c++; }}, ()=>{ pt.idx++; nextParticle(); });
}

/* ================= ФОРМЫ ================= */
const FORM_SETS = {
  mix:{label:'Всё вперемешку'},
  dict:{label:'ます → словарная', verbs:['dict']},
  masu:{label:'словарная → ます', verbs:['masu'], fromDict:true},
  nai:{label:'ない-форма', verbs:['nai']},
  te:{label:'て-форма', verbs:['te']},
  ta:{label:'た-форма', verbs:['ta']},
  polite:{label:'ません・ました', verbs:['masen','mashita','masendeshita']},
  iadj:{label:'い-прил.: было / не', adj:'i'},
  naadj:{label:'な-прил.: было / не', adj:'na'}
};
let fm={set:'mix'};
function startForms(){
  const words = ALL_WORDS; // тренируем все глаголы и прилагательные сайта
  const qs=[];
  const set=FORM_SETS[fm.set];
  const verbForms = set.verbs || (fm.set==='mix' ? ['dict','nai','te','ta','masen','mashita'] : []);
  const adjTypes = set.adj ? [set.adj] : (fm.set==='mix' ? ['i','na'] : []);
  words.filter(w=>w.d).forEach(w=>verbForms.forEach(f=>qs.push({w,f,from:(set.fromDict?'dict':'masu')})));
  words.filter(w=>adjTypes.includes(w.t)).forEach(w=>Object.keys(AFORMS).forEach(f=>qs.push({w,f})));
  fm={set:fm.set, items:shuffle(qs).slice(0,15), idx:0, c:0};
  nextForm();
}
function nextForm(){
  const box=$('forms');
  const chips='<div class="chips" style="justify-content:center">'+Object.keys(FORM_SETS).map(k=>'<button class="chip '+(fm.set===k?'active':'')+'" data-set="'+k+'">'+FORM_SETS[k].label+'</button>').join('')+'</div>';
  const wrap=document.createElement('div');
  if(fm.idx>=fm.items.length){ finishCard(wrap,'Формы',fm.c,fm.items.length,startForms); }
  else {
    const {w,f,from}=fm.items[fm.idx];
    const isAdj = !w.d;
    const src = isAdj ? display(w) : conjV(w, from);
    const right = isAdj ? conjA(w.jp,w.t,f) : conjV(w,f);
    const label = isAdj ? AFORMS[f].label : VFORMS[f].label;
    const wrong = shuffle(wrongForms(w,f));
    askChoice(wrap,{counter:(fm.idx+1)+' / '+fm.items.length+' · верно: '+fm.c, dir:'Поставь в форму: <b style="color:var(--sakura)">'+label+'</b>',
      prompt:rb(src), hint:tagHTML(w.t)+' '+esc(w.ru), right, wrong,
      explain:'<span class="jp" style="font-size:22px">'+rb(src)+' → '+rb(right)+'</span><br>'+ruleText(w,f),
      onAnswer:ok=>{ drillHit('forms',ok); if(ok) fm.c++; }}, ()=>{ fm.idx++; nextForm(); });
  }
  box.innerHTML=chips+'<p class="help" style="text-align:center;margin-bottom:12px">Тренируются все глаголы и прилагательные сайта. Теория — «Грамматика → Глаголы: формы».</p>';
  box.appendChild(wrap);
  box.querySelectorAll('[data-set]').forEach(b=>b.onclick=()=>{ fm.set=b.dataset.set; startForms(); });
}

/* ================= ВЕЖЛИВО ↔ ПРОСТО ================= */
let pl=null;
function startPolite(){ pl={items:shuffle(DATA.polite).map(x=>({...x, dir:Math.random()<.65?'p2c':'c2p'})), idx:0, c:0}; nextPolite(); }
function nextPolite(){
  const box=$('polite');
  if(pl.idx>=pl.items.length) return finishCard(box,'Вежливая и простая речь',pl.c,pl.items.length,startPolite);
  const x=pl.items[pl.idx];
  const p2c = x.dir==='p2c';
  const others = shuffle(DATA.polite.filter(y=>y.p!==x.p)).slice(0,1).map(y=>y.p);
  askChoice(box,{counter:(pl.idx+1)+' / '+pl.items.length+' · верно: '+pl.c,
    dir: p2c ? 'Как сказать это <b>другу</b> (простая форма)?' : 'Как сказать это <b>вежливо</b> (です・ます)?',
    cls:'sent', prompt:rb(p2c?x.p:x.c), hint:esc(x.ru),
    right: p2c?x.c:x.p,
    wrong: p2c ? [...x.w, x.p] : [x.c, ...others, ...x.w.slice(0,1)],
    explain:'<span class="jp">'+rb(x.p)+'</span><br><span class="jp">'+rb(x.c)+'</span><br>'+esc(x.why),
    onAnswer:ok=>{ drillHit('polite',ok); if(ok) pl.c++; }}, ()=>{ pl.idx++; nextPolite(); });
}

/* ================= ТЕСТ И ПОВТОРЕНИЕ ================= */
function accepted(w){ return w.ru.replace(/\([^)]*\)/g,',').split(/[,;]/).map(norm).filter(Boolean); }
function quizRun(boxId, items, onDone){
  const box=$(boxId); let idx=0, c=0;
  const step=()=>{
    if(idx>=items.length) return onDone(c, items.length);
    const it=items[idx], counter=(idx+1)+' / '+items.length+' · верно: '+c;
    const answer=ok=>{ if(ok){ c++; srsRight(it.jp); } else srsWrong(it.jp); };
    if(it.dir==='ru2jp'){
      const same=ALL_WORDS.filter(x=>x.jp!==it.jp && x.t===it.t);
      askChoice(box,{counter, dir:'Выбери слово на японском', cls:'sent', prompt:esc(it.ru), hint:tagHTML(it.t), right:display(it),
        wrong:shuffle(same.length>=3?same:ALL_WORDS.filter(x=>x.jp!==it.jp)).map(display),
        explain:'<span class="jp" style="font-size:22px">'+rb(display(it))+'</span> — '+esc(kana(it.jp))+'<br><span class="jp">'+sentHTML(it.ex)+'</span>',
        onAnswer:answer}, ()=>{ idx++; step(); });
      return;
    }
    box.innerHTML='<div class="card"><div class="counter">'+counter+'</div><div class="dir">Напиши перевод по-русски</div>'+
      '<div class="big">'+rb(display(it))+'</div><div class="hint">'+tagHTML(it.t)+'</div>'+
      '<input type="text" id="qIn" autocomplete="off" aria-label="Перевод" placeholder="Перевод…">'+
      '<div class="actions"><button class="btn primary" id="qGo">Проверить</button><button class="btn know" id="qSkip">Не знаю</button></div>'+
      '<div class="feedback" id="qFb" aria-live="polite"></div><div class="explain" id="qEx"></div></div>';
    const inp=box.querySelector('#qIn'); inp.focus(); let done=false;
    const fin=(ok,skipped)=>{
      done=true; inp.disabled=true; answer(ok); bump();
      box.querySelector('#qFb').textContent = ok ? 'Верно!' : (skipped?'Правильно: ':'Не совсем. Правильно: ')+it.ru;
      box.querySelector('#qFb').className='feedback '+(ok?'good':'bad');
      box.querySelector('#qEx').innerHTML='<span class="jp">'+sentHTML(it.ex)+'</span><br>'+esc(it.exru);
      box.querySelector('#qGo').textContent='Дальше ›'; box.querySelector('#qGo').focus();
    };
    const submit=()=>{ if(done){ idx++; step(); return; } const v=norm(inp.value); if(!v) return; fin(accepted(it).some(a=>a===v || (v.length>=4 && a.startsWith(v))), false); };
    box.querySelector('#qGo').onclick=submit; box.querySelector('#qSkip').onclick=()=>{ flashBtn(box.querySelector('#qSkip')); if(!done) fin(false,true); else { idx++; step(); } };
    inp.onkeydown=e=>{ if(e.key==='Enter') submit(); };
  };
  step();
}
function startTest(){
  const items = shuffle(curWords()).map(w=>({...w, dir:Math.random()<.5?'jp2ru':'ru2jp'}));
  quizRun('test', items, (c,t)=>{
    const e=entry();
    if(e.type==='lesson') lessonState(e.li).score={c,t}; else (store.reviews['r'+(cur+1)] ||= {}).score={c,t};
    store.history.push({d:today(), day:cur+1, c, t}); store.history=store.history.slice(-60); save();
    finishCard($('test'),'Тест · день '+(cur+1),c,t,startTest); renderProgress();
  });
}
function startReview(){
  const due=dueList(), box=$('review');
  if(!due.length){
    box.innerHTML='<div class="card result"><div class="big" lang="ja">お疲[つか]れさま！</div><div class="hint">Сейчас повторять нечего. Слова попадают сюда после ошибок в тесте, карточках, пропусках и кандзи — и возвращаются через 1, 3 и 7 дней.</div><div class="actions"><button class="btn primary" id="goTest">Пройти тест дня</button></div></div>';
    box.querySelector('.big').innerHTML=rb('お疲[つか]れさま！');
    $('goTest').onclick=()=>setMode('test'); return;
  }
  quizRun('review', shuffle(due.map(jp=>({...WORDMAP[jp], dir:Math.random()<.5?'jp2ru':'ru2jp'}))), (c,t)=>finishCard(box,'Повторение',c,t,startReview));
}

/* ================= ПРОГРЕСС ================= */
function renderStats(){
  const learned=Object.values(store.lessons).reduce((s,l)=>s+(l.learned?l.learned.length:0),0);
  const last=store.history[store.history.length-1];
  const pct=k=>{ const d=store.drill[k]; return d&&d.t ? Math.round(d.c/d.t*100)+'%' : '—'; };
  const cnt=k=>{ const d=store.drill[k]; return d&&d.t ? d.t+' ответов' : 'ещё не было'; };
  let html='<div style="max-width:980px;margin:0 auto"><div class="stat-grid">'+
    '<div class="stat-card"><div class="k">Выучено слов</div><div class="v" style="color:var(--good)">'+learned+'</div><div class="s">из '+TOTAL_WORDS+'</div></div>'+
    '<div class="stat-card"><div class="k">Серия</div><div class="v">'+streakNow()+'</div><div class="s">дней подряд</div></div>'+
    '<div class="stat-card"><div class="k">Ждут повторения</div><div class="v" style="color:var(--bad)">'+dueList().length+'</div><div class="s">слов сегодня</div></div>'+
    '<div class="stat-card"><div class="k">Последний тест</div><div class="v">'+(last?last.c+'/'+last.t:'—')+'</div><div class="s">'+(last?'день '+last.day:'ещё не было')+'</div></div></div>'+
    '<div class="stat-grid">'+[['particles','Частицы'],['forms','Формы'],['kanji','Кандзи'],['polite','Вежливо ↔ просто']].map(k=>'<div class="stat-card"><div class="k">'+k[1]+'</div><div class="v" style="font-size:28px">'+pct(k[0])+'</div><div class="s">'+cnt(k[0])+'</div></div>').join('')+'</div>';
  const cells=[], now=new Date(), off=(now.getDay()+6)%7;
  for(let i=77+off;i>=0;i--){ const d=new Date(now); d.setDate(d.getDate()-i); const ds=iso(d), n=store.act[ds]||0; cells.push('<div class="hm'+(n?' hm'+(n<5?1:n<20?2:3):'')+'" title="'+ds+': '+n+'"></div>'); }
  html+='<div class="stat-block"><h3>Календарь занятий за 12 недель</h3><div class="heatmap">'+cells.join('')+'</div></div>';
  const hist=store.history.slice(-8).reverse();
  html+='<div class="stat-block"><h3>Результаты тестов</h3>'+(hist.length?hist.map(h=>'<div style="display:flex;align-items:center;gap:10px;margin:6px 0"><span class="help" style="min-width:140px">'+h.d+' · день '+h.day+'</span><div style="flex:1;background:var(--surface-3);border-radius:5px;height:10px;overflow:hidden"><div style="height:100%;width:'+Math.round(h.c/h.t*100)+'%;background:var(--sakura)"></div></div><b>'+h.c+'/'+h.t+'</b></div>').join(''):'<p class="help">Пройди первый тест — результаты появятся здесь.</p>')+'</div>';
  html+='<div class="actions"><button class="btn" id="expBtn">Скачать прогресс</button><label class="btn" style="display:inline-flex;align-items:center">Загрузить прогресс<input type="file" id="impFile" accept=".json" hidden></label></div></div>';
  $('stats').innerHTML=html;
  $('expBtn').onclick=()=>{ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([JSON.stringify(store)],{type:'application/json'})); a.download='nihongo-progress.json'; a.click(); URL.revokeObjectURL(a.href); };
  $('impFile').onchange=()=>{ const f=$('impFile').files[0]; if(!f) return; const r=new FileReader();
    r.onload=()=>{ try{ const o=JSON.parse(r.result); if(!o.lessons) throw 0; store=o; save(); location.reload(); }catch(e){ showFatal('Не удалось прочитать файл прогресса — нужен файл, скачанный кнопкой «Скачать прогресс».'); } };
    r.readAsText(f); };
}

/* ================= НАВИГАЦИЯ ================= */
const PANELS=['learn','grammar','flashcards','match','gaps','kanji','particles','forms','polite','test','review','stats'];
const PRACTICE=['flashcards','match','gaps','kanji','particles','forms','polite'];
function renderPanel(m){
  ({learn:renderLearn, grammar:renderGrammar, flashcards:initFlash, match:startMatch, gaps:startGaps, kanji:startKanji,
    particles:startParticles, forms:startForms, polite:startPolite, test:startTest, review:startReview, stats:renderStats})[m]();
}
function setMode(m){
  mode=m; popup.classList.remove('show');
  const g = PRACTICE.includes(m) ? 'practice' : m;
  if(g==='practice') lastPractice=m;
  document.querySelectorAll('#mainTabs button').forEach(b=>{ const on=b.dataset.tab===g; b.classList.toggle('active',on); b.setAttribute('aria-current',on?'page':'false'); });
  $('subTabs').style.display = g==='practice' ? 'flex' : 'none';
  document.querySelectorAll('#subTabs button').forEach(b=>b.classList.toggle('active', b.dataset.mode===m));
  PANELS.forEach(id=>{ $(id).style.display = id===m ? 'block' : 'none'; });
  renderPanel(m);
  const el=$(m); el.classList.remove('slide-in'); void el.offsetWidth; el.classList.add('slide-in');
}
document.querySelectorAll('#mainTabs button').forEach(b=>b.onclick=()=>setMode(b.dataset.tab==='practice'?lastPractice:b.dataset.tab));
document.querySelectorAll('#subTabs button').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
function gotoDay(n){ cur=n; store.lastDay=cur; save(); renderHeader(); renderProgress(); setMode(mode==='stats'||mode==='review'?mode:(isReviewDay()&&mode==='learn'?'learn':mode)); }
$('prev').onclick=()=>{ if(cur>0) gotoDay(cur-1); };
$('next').onclick=()=>{ if(cur<SCHED.length-1) gotoDay(cur+1); };
const barEl=$('bar');
addEventListener('scroll',()=>{ barEl.classList.toggle('stuck', barEl.getBoundingClientRect().top<=0 && scrollY>200); },{passive:true});

/* ================= СТАРТ ================= */
function showFatal(msg){
  let b=$('errBanner');
  if(!b){ b=document.createElement('div'); b.id='errBanner'; b.setAttribute('role','alert');
    b.style.cssText='position:fixed;bottom:12px;left:12px;right:12px;z-index:3000;background:#7a2233;color:#fff;padding:12px 48px 12px 16px;border-radius:12px;font:14px/1.5 system-ui,sans-serif';
    const x=document.createElement('button'); x.textContent='✕'; x.setAttribute('aria-label','Закрыть');
    x.style.cssText='position:absolute;right:8px;top:6px;width:36px;height:36px;background:none;border:0;color:#fff;font-size:16px;cursor:pointer'; x.onclick=()=>b.remove();
    const t=document.createElement('span'); t.id='errText'; b.append(t,x); document.body.appendChild(b); }
  $('errText').textContent=msg;
}
addEventListener('error', ev=>showFatal('Ошибка: '+(ev.message||'неизвестная')));
$('footer').textContent = 'Японский N5 по «Минна но Нихонго» · '+LESSONS.length+' уроков, '+TOTAL_WORDS+' слов, '+LESSONS.reduce((s,L)=>s+L.phrases.length,0)+' фраз · прогресс хранится в этом браузере.';
applyFuri(); renderHeader(); renderStreak(); updateBadge(); setMode('learn');
