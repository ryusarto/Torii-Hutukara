/* Usina de Retorno · monte quatro batidas da trilha a partir de cinco peças. */
const PlantSequencer=(()=>{
  'use strict';
  const TRACK='c3_type_shit',BEAT=.62;
  // Perfis de ataque medidos na gravação, um por batida. A pista funciona no mudo.
  const passages=[
    {start:16.55,profiles:['988866544','596456653','449443342','965464699']},
    {start:38.79,profiles:['666766698','998877778','549666755','998899988']},
    {start:68.84,profiles:['998865485','969778794','858978873','879997787']},
    {start:94.24,profiles:['777766697','998878877','559766655','877776679']}
  ].map(({start,profiles})=>profiles.map((profile,index)=>({from:start+index*BEAT,profile})));
  const LETTERS='ABCDE';
  let session=null,lastPassage=null;

  function choose(items){return items[Math.floor(Math.random()*items.length)]}

  function round(){
    const reference=choose(passages.filter(passage=>passage!==lastPassage));
    lastPassage=reference;
    const extra=choose(passages.filter(passage=>passage!==reference).flat());
    const pieces=[...reference,extra];
    for(let index=pieces.length-1;index>0;index--){
      const other=Math.floor(Math.random()*(index+1));
      [pieces[index],pieces[other]]=[pieces[other],pieces[index]];
    }
    return {reference,pieces,placed:reference.map(()=>null)};
  }

  const visible=s=>s&&session===s&&s.game===G&&G.area==='power_plant'&&
    mode==='overlay'&&!$('overlay').classList.contains('hidden')&&!!$('plantSequencer');
  const status=text=>{$('plantSignal').textContent=text};
  const waveform=beat=>'<span class="plant-wave" aria-hidden="true">'+
    [...beat.profile].map(level=>'<i style="--level:'+level+'"></i>').join('')+'</span>';

  function stop(s){
    if(!s)return;
    const run=s.run;
    s.run=null;
    if(run){
      for(const timer of run.timers)clearTimeout(timer);
      for(const source of run.sources)source.stop();
    }
    if(visible(s)){
      for(const pad of $('plantSequencer').querySelectorAll('.plant-live'))pad.classList.remove('plant-live');
      for(const button of [$('plantReference'),$('plantListen')])button.setAttribute('aria-pressed','false');
    }
  }

  function getRecording(){
    if(!audioEnabled||!AC||document.hidden||Music11.hidden)return Promise.resolve(null);
    const resume=AC.state==='running'?Promise.resolve():AC.resume().catch(()=>{});
    return Promise.all([decodeAlbum11(TRACK),resume]).then(([buffer])=>
      buffer?.duration>=passages.at(-1).at(-1).from+BEAT&&AC.state==='running'?buffer:null);
  }

  function schedule(s,run,steps,buffer){
    const withAudio=buffer&&audioEnabled&&AC.state==='running'&&!Music11.hidden;
    const lead=.035, now=withAudio?AC.currentTime+lead:0;
    steps.forEach(({element,beat},index)=>{
      const delay=index*BEAT;
      const from=beat.from;
      run.timers.push(setTimeout(()=>{
        if(!visible(s)||s.run!==run)return;
        for(const pad of $('plantSequencer').querySelectorAll('.plant-live'))pad.classList.remove('plant-live');
        element.classList.add('plant-live');
      },(lead+delay)*1000));
      if(!withAudio)return;
      const source=AC.createBufferSource(),gain=AC.createGain(),when=now+delay;
      source.buffer=buffer;
      gain.gain.setValueAtTime(0,when);
      gain.gain.linearRampToValueAtTime(.72,when+.006);
      gain.gain.setValueAtTime(.72,when+BEAT-.009);
      gain.gain.linearRampToValueAtTime(0,when+BEAT);
      source.connect(gain).connect(AC.destination);
      source.onended=()=>{run.sources.delete(source);source.disconnect();gain.disconnect()};
      run.sources.add(source);
      source.start(when,from,BEAT);
    });
    run.timers.push(setTimeout(()=>{if(s.run===run)stop(s)},(lead+steps.length*BEAT)*1000));
  }

  function play(s,steps,button=null){
    if(!visible(s))return;
    stop(s);
    const run={sources:new Set(),timers:[]};
    s.run=run;
    button?.setAttribute('aria-pressed','true');
    getRecording().then(buffer=>{
      if(!visible(s)||s.run!==run)return;
      schedule(s,run,steps,buffer);
    });
  }

  function paint(s){
    const full=s.placed.every(piece=>piece!==null);
    $('plantApply').disabled=!full;
    $('plantListen').disabled=!full;
    s.slots.forEach((slot,index)=>{
      const piece=s.placed[index];
      slot.disabled=piece===null;
      slot.dataset.empty=String(piece===null);
      slot.setAttribute('aria-label',piece===null?'Posição '+(index+1)+' vazia':
        'Retirar peça '+LETTERS[piece]+' da posição '+(index+1));
      slot.innerHTML=piece===null?'<span class="plant-slot-number">'+(index+1)+'</span>':
        waveform(s.pieces[piece])+'<span class="plant-index">'+(index+1)+' · '+LETTERS[piece]+'</span>';
    });
    s.buttons.forEach((button,piece)=>{
      const used=s.placed.includes(piece);
      button.dataset.used=String(used);
      button.dataset.spare=String(full&&!used);
      button.disabled=used||full;
      button.setAttribute('aria-label','Peça '+LETTERS[piece]+(used?' · encaixada':' · encaixar'));
    });
  }

  function listen(s,isReference){
    if(!visible(s))return;
    if(isReference){
      $('plantReferenceSteps').hidden=false;
      $('plantReference').setAttribute('aria-expanded','true');
    }else if(s.placed.includes(null))return;
    const beats=isReference?s.reference:s.placed.map(piece=>s.pieces[piece]);
    const row=isReference?s.cues:s.slots;
    play(s,beats.map((beat,index)=>({element:row[index],beat})),$(isReference?'plantReference':'plantListen'));
  }

  function select(s,piece){
    if(!visible(s)||s.placed.includes(piece))return;
    const index=s.placed.indexOf(null);
    if(index<0)return;
    const focused=document.activeElement===s.buttons[piece];
    s.placed[index]=piece;
    paint(s);
    if(focused)s.slots[index].focus({preventScroll:true});
    if(s.placed.includes(null))status('Peça '+LETTERS[piece]+' encaixada na posição '+(index+1)+'.');
    else {
      const spare=s.buttons.findIndex((_,candidate)=>!s.placed.includes(candidate));
      status('Peça '+LETTERS[spare]+' ficou de fora. Teste a sequência ou confirme.');
    }
    play(s,[{element:s.slots[index],beat:s.pieces[piece]}]);
  }

  function remove(s,index){
    if(!visible(s)||s.placed[index]===null)return;
    stop(s);
    const piece=s.placed[index],focused=document.activeElement===s.slots[index];
    s.placed[index]=null;
    paint(s);
    if(focused)s.buttons[piece].focus({preventScroll:true});
    status('Posição '+(index+1)+' livre. Escolha uma peça para encaixar.');
  }

  function apply(s){
    if(!visible(s)||s.placed.includes(null))return;
    if(!s.reference.every((beat,index)=>beat===s.pieces[s.placed[index]])){
      stop(s);
      status('A sequência ainda difere da referência. Toque nas peças encaixadas para trocá-las.');
      return;
    }
    closeOverlay();
    emitMusic(33*T,12*T,24,'green');
    s.finish();
  }

  function open(finish){
    stop(session);
    const s={game:G,finish,run:null,...round()};
    session=s;
    const pieces=s.pieces.map((beat,index)=>
      '<button type="button" class="plant-pad" data-plant-beat="'+index+'">'+
        waveform(beat)+'<span class="plant-index">'+LETTERS[index]+'</span></button>').join('');
    const cues=s.reference.map((beat,index)=>
      '<li class="plant-pad" aria-label="Batida '+(index+1)+'">'+waveform(beat)+'</li>').join('');
    const slots=s.placed.map((_,index)=>
      '<button type="button" class="plant-pad" data-plant-slot="'+index+'"></button>').join('');
    enterMenu10(`<section id="plantSequencer" aria-labelledby="plantTitle">
      <div class="eyebrow">USINA DE RETORNO</div>
      <h2 id="plantTitle">Sequenciador</h2>
      <p>Monte as quatro batidas da referência. Uma das cinco peças fica de fora.</p>
      <div class="plant-board">
        <button class="action" id="plantReference" aria-controls="plantReferenceSteps" aria-expanded="false" aria-pressed="false">TOCAR REFERÊNCIA</button>
        <ol class="plant-pads plant-quad" id="plantReferenceSteps" aria-label="Batidas da referência" hidden>${cues}</ol>
        <div class="plant-heading"><b>Sua sequência</b><button class="action" id="plantListen" aria-pressed="false">TESTAR SEQUÊNCIA</button></div>
        <div class="plant-pads plant-quad" role="group" aria-label="Sua sequência · toque numa peça encaixada para retirar">${slots}</div>
        <b>Peças</b>
        <div class="plant-pads" role="group" aria-label="Peças disponíveis · toque para encaixar">${pieces}</div>
      </div>
      <div id="plantSignal" role="status">Toque numa peça para encaixar. Toque na montagem para retirar.</div>
      <div class="plant-actions"><button class="action strong" id="plantApply">CONFIRMAR SEQUÊNCIA</button>
        <button class="action" id="plantClose">VOLTAR</button></div>
    </section>`,'plantSequencer');
    s.cues=Array.from($('plantReferenceSteps').children);
    s.slots=Array.from($('plantSequencer').querySelectorAll('[data-plant-slot]'));
    s.buttons=Array.from($('plantSequencer').querySelectorAll('[data-plant-beat]'));
    $('plantReference').onclick=()=>listen(s,true);
    $('plantListen').onclick=()=>listen(s,false);
    $('plantApply').onclick=()=>apply(s);
    $('plantClose').onclick=()=>closeOverlay();
    s.slots.forEach((slot,index)=>{slot.onclick=()=>remove(s,index)});
    s.buttons.forEach((button,index)=>{button.onclick=()=>select(s,index)});
    paint(s);
    soundscape();getRecording();
  }

  document.addEventListener('keydown',event=>{
    const s=session;
    if(!visible(s)||event.altKey||event.ctrlKey||event.metaKey)return;
    if(event.key==='Tab'){
      event.preventDefault();event.stopPropagation();
      C3.focusPadMenu(event.shiftKey?-1:1);
      return;
    }
    if(!/^[1-5]$/.test(event.key))return;
    event.preventDefault();event.stopPropagation();
    if(!event.repeat)select(s,Number(event.key)-1);
  },true);
  addEventListener('blur',()=>stop(session));
  addEventListener('pagehide',()=>stop(session));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop(session)});

  const close=closeOverlay;
  closeOverlay=function(...args){
    stop(session);session=null;
    return close(...args);
  };
  const track=albumTrack11;
  albumTrack11=function(){return visible(session)?null:track()};
  const ambient=soundscape;
  soundscape=function(){
    if(!visible(session))return ambient();
    if(Music11.gain&&Music11.lastLevel!==0){
      const now=AC.currentTime,gain=Music11.gain.gain;
      gain.cancelScheduledValues(now);gain.setTargetAtTime(0,now,.035);Music11.lastLevel=0;
    }
  };

  const style=document.createElement('style');
  style.textContent=`
    #plantSequencer .plant-board{display:grid;gap:7px;padding:9px;border:1px solid #8e7257;background:#222229}
    #plantSequencer .plant-board>.action{justify-self:start}
    #plantSequencer .plant-pads{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:5px;padding:0;margin:0;list-style:none}
    #plantSequencer .plant-quad{grid-template-columns:repeat(4,minmax(0,1fr))}
    #plantReferenceSteps[hidden]{display:none}
    #plantSequencer .plant-heading{display:flex;align-items:center;justify-content:space-between;gap:8px}
    #plantSequencer .plant-heading .action{margin:0}
    #plantSequencer .plant-pad{display:grid;place-content:center;justify-items:center;gap:4px;min-width:0;min-height:48px;padding:4px 2px;border:1px solid #8b765c;background:#282d30;color:#eed4a6;font:700 11px/1 monospace;box-sizing:border-box}
    #plantSequencer button{min-height:44px;touch-action:manipulation}
    #plantSequencer button:focus-visible{outline:2px solid #fff1cb;outline-offset:1px}
    #plantSequencer button.plant-pad{cursor:pointer}
    #plantSequencer .plant-pad.plant-live{border-color:#fbf1c4;background:#4b543e;color:#fff4b2}
    #plantSequencer .plant-pad[data-empty=true]{border-style:dashed;background:#20242a;color:#c5b392}
    #plantSequencer .plant-pad[data-used=true]{opacity:.42}
    #plantSequencer .plant-pad[data-spare=true]{opacity:1;border-style:dashed;color:#ead3a0}
    #plantSequencer .plant-slot-number{font-size:15px}
    #plantSequencer [data-plant-slot]:not([disabled]){border-color:#b9a379}
    #plantSequencer .plant-wave{display:flex;align-items:center;justify-content:center;gap:1px;width:100%;height:19px}
    #plantSequencer .plant-wave i{display:block;width:2px;height:calc(var(--level) * 2px);background:currentColor}
    #plantSignal{min-height:1.4em;margin:8px 0;color:#f6dbb0;line-height:1.35}
    #plantSequencer .plant-actions{display:flex;flex-wrap:wrap;gap:6px}
    @media(max-height:480px){#plantSequencer .plant-pad{min-height:44px}}
  `;
  document.head.appendChild(style);

  return Object.freeze({open});
})();
