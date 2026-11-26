/* A Última Frequência · três lacunas na entrada do Contratempo. */
const FinalEchoes=(()=>{
  'use strict';
  const AREA='silence_core',GAP=.62;
  const motif=ClubStage.motif,missing=Object.freeze([1,3,4]);
  const memory={id:'final_memory',x:17.5,y:16.85,label:'Memória do Contratempo · Ouvir a frase'};
  const echoes=[
    {id:'final_bass',instrument:'bass',label:'Eco do Baixo',x:14.15,y:13.2,color:'#eac18c'},
    {id:'final_drums',instrument:'drums',label:'Eco da Bateria',x:17.5,y:13.2,color:'#b5e5cf'},
    {id:'final_guitar',instrument:'guitar',label:'Eco da Guitarra',x:20.85,y:13.2,color:'#ebb1cd'}
  ];
  const titles={bass:'Baixo',drums:'Bateria',guitar:'Guitarra'};
  let session=null;

  const panel=document.createElement('aside');
  panel.id='finalEchoes';panel.hidden=true;
  panel.innerHTML='<ol id="finalEchoNotes" aria-label="Frase do Contratempo"></ol><p id="finalEchoSignal" role="status"></p>';
  $('frame').appendChild(panel);
  const cells=motif.map(()=>{
    const item=document.createElement('li');
    $('finalEchoNotes').appendChild(item);
    return item;
  });

  const here=()=>G?.area===AREA&&current?.id===AREA;
  const recovered=()=>G?.c3?.finalRecovered;
  const active=()=>here()&&!G.c3.silenceDone&&Number.isInteger(recovered());
  const near=point=>Math.hypot(G.x-point.x,G.y-point.y)<1.9;

  function stopVoice(s){
    const voice=s.voice;
    s.voice=null;
    if(voice)voice.stop();
  }

  function stop(s){
    if(!s)return;
    stopVoice(s);
    s.run=null;s.fetch=null;
  }

  function play(s,clip,buffer){
    stopVoice(s);
    const voice=ClubStage.playClip(clip,buffer);
    s.voice=voice;
    voice?.addEventListener('ended',()=>{if(s.voice===voice)s.voice=null},{once:true});
  }

  function addEvents(){
    if(current.events.some(event=>event.id===memory.id))return;
    evt(current,memory.id,memory.x,memory.y,memory.label,listen);
    for(const echo of echoes)evt(current,echo.id,echo.x,echo.y,echo.label,()=>answer(echo));
  }

  function state(){
    if(session?.game!==G||session.area!==current){
      stop(session);
      session={game:G,area:current,clock:0,buffer:null,voice:null,run:null,
        fetch:null,heard:false,flash:null,feedback:'',settleAt:0,renderKey:''};
      C3.finalPending=true;
      addEvents();
    }
    return session;
  }

  function begin(){
    if(!here()||G.c3.silenceDone)return;
    if(active()){state();return}
    if(bossActor?.id!=='c3_silence')return;
    const x=bossActor.x,y=bossActor.y;
    G.c3.finalRecovered=0;
    bossActor=null;battle=null;C3.hazards.length=0;C3.synthZones.length=0;
    hostileShots=[];projectiles=[];combatFX.length=0;attackHeld=false;
    releaseAll121();
    mode='walk';$('actionHUD').classList.add('hidden');
    state();routeCache.key='';updateHUD();save(true);soundscape();
    emitMusic(x*T,y*T,24,'green');screenShake=.36;
    talk([
      {who:'silence',t:'Se eu tirar uma nota, vocês vão parar outra vez.'},
      {who:'ryuchi',t:'É a entrada do Contratempo. Ouça a memória e use os ecos para preencher as três lacunas.'}
    ]);
  }

  function runPhrase(s,kind){
    stop(s);
    const run={kind,index:-1,start:s.clock,pending:true,buffer:null};
    s.run=run;
    ClubStage.recording().then(buffer=>{
      if(!active()||mode!=='walk'||s!==session||s.run!==run)return;
      run.pending=false;run.start=s.clock;run.buffer=buffer;s.buffer=buffer;
    });
  }

  function listen(){
    if(!active()||mode!=='walk')return;
    const s=state();
    if(s.run||recovered()>=missing.length)return;
    s.feedback='';
    runPhrase(s,'memory');
  }

  function answer(echo){
    if(!active()||mode!=='walk')return;
    const s=state(),count=recovered();
    if(s.run||count>=missing.length)return;
    const index=missing[count],wanted=motif[index],matches=echo.instrument===wanted.id;
    const clip=matches?wanted:motif.find(piece=>piece.id===echo.instrument);
    s.flash={instrument:echo.instrument,wrong:!matches,until:s.clock+.6};
    s.feedback=matches?'Nota '+(index+1)+' recuperada.':'Esse eco não encaixa na nota '+(index+1)+'.';
    if(matches){
      G.c3.finalRecovered=count+1;
      if(count+1===missing.length)s.settleAt=s.clock+clip.length+.23;
      save(true);
    }
    emitMusic(echo.x*T,echo.y*T-8,matches?14:5,matches?'green':'red');
    if(s.buffer)play(s,clip,s.buffer);
    else if(audioEnabled){
      const token={};
      s.fetch=token;
      ClubStage.recording().then(buffer=>{
        if(!active()||mode!=='walk'||s!==session||s.fetch!==token)return;
        s.fetch=null;s.buffer=buffer;play(s,clip,buffer);
      });
    }
  }

  function render(s){
    panel.hidden=mode!=='walk';
    if(panel.hidden)return;
    const run=s.run,step=run?.index??-1,count=recovered();
    const key=[count,run?.kind,step,s.feedback,s.heard].join('|');
    if(s.renderKey===key)return;
    s.renderKey=key;
    const currentHole=missing[count],showFull=run?.kind==='memory';
    cells.forEach((cell,index)=>{
      const hole=missing.indexOf(index),filled=hole<0||hole<count;
      const label=filled||showFull&&step===index?titles[motif[index].id]:'…';
      cell.textContent=label;
      cell.dataset.state=step===index?'playing':index===currentHole?'next':filled?'filled':'empty';
      cell.setAttribute('aria-label','Nota '+(index+1)+' · '+(label==='…'?'lacuna':label));
    });
    let text=s.feedback||'Ouça a memória do Contratempo.';
    if(run)text=run.pending?'Preparando a gravação…':run.kind==='memory'?
      'Memória do Contratempo · '+(step+1)+' de '+motif.length:'A frase voltou inteira.';
    else if(count===missing.length)text='A última frequência está voltando…';
    else if(s.heard&&!s.feedback)text='Toque o eco que falta na nota '+(currentHole+1)+'.';
    $('finalEchoSignal').textContent=text;
  }

  function step(dt){
    if(!active()){
      if(session){
        stop(session);
        if(!G?.c3?.silenceDone&&Number.isInteger(recovered()))C3.finalPending=false;
      }
      session=null;panel.hidden=true;
      return;
    }
    const s=state();
    if(mode!=='walk'||document.hidden||!Input121.focused){stop(s);panel.hidden=true;return}
    s.clock+=dt;
    const run=s.run;
    if(run&&!run.pending&&s.clock-run.start>=(run.index+1)*GAP){
      run.index++;
      if(run.index===motif.length){
        stop(s);
        if(run.kind==='complete'){
          panel.hidden=true;
          current.events=current.events.filter(event=>event.id!==memory.id&&!echoes.some(echo=>echo.id===event.id));
          C3.resolveSilence();
          return;
        }
        s.heard=true;s.feedback='';
      }else{
        const clip=motif[run.index];
        s.flash={instrument:clip.id,wrong:false,until:s.clock+.48};
        play(s,clip,run.buffer);
      }
    }else if(!run&&recovered()===missing.length&&s.clock>=s.settleAt)runPhrase(s,'complete');
    render(s);
  }

  function drawGround(){
    if(!active())return;
    const s=state(),count=recovered();
    const x=Math.round(memory.x*T-cam.x),y=Math.round(memory.y*T-cam.y);
    const targetX=Math.round(17.5*T-cam.x),targetY=Math.round(10.55*T-cam.y);
    ctx.save();
    ctx.strokeStyle=near(memory)?'#edc6a6':'#ad8eb7';
    ctx.fillStyle='#9d77ac33';ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(x,y,25,12,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.strokeStyle='#ead4bc95';ctx.beginPath();ctx.ellipse(x,y,16,6,0,0,Math.PI*2);ctx.stroke();
    for(let index=0;index<missing.length;index++){
      const sx=targetX+(index-1)*29;
      ctx.strokeStyle=index<count?'#b6ead6':'#9a788e';
      ctx.fillStyle=index<count?'#a8e1c96b':'#9a788e24';
      ctx.beginPath();ctx.ellipse(sx,targetY,10,6,0,0,Math.PI*2);ctx.fill();ctx.stroke();
      if(index<count){
        ctx.strokeStyle='#afdacc88';ctx.lineWidth=2;
        ctx.beginPath();ctx.moveTo(sx,targetY+5);ctx.lineTo(x,y-13);ctx.stroke();
      }
    }
    if(s.run?.kind==='complete'){
      const phase=Math.max(0,s.clock-s.run.start)%GAP/GAP;
      const radius=24+(G.options10?.reducedMotion?0:phase*18);
      ctx.strokeStyle='#edc9e4';ctx.globalAlpha=.35*(1-phase);
      ctx.beginPath();ctx.ellipse(x,y,radius,radius*.45,0,0,Math.PI*2);ctx.stroke();
      ctx.globalAlpha=1;
    }
    for(const echo of echoes){
      const sx=Math.round(echo.x*T-cam.x),sy=Math.round(echo.y*T-cam.y);
      const flash=s.flash?.instrument===echo.instrument&&s.flash.until>s.clock;
      ctx.lineWidth=flash||near(echo)?2:1;
      ctx.strokeStyle=flash&&s.flash.wrong?'#e99394':echo.color;
      ctx.fillStyle=flash?'#c8a2c85c':'#6a526653';
      ctx.beginPath();ctx.ellipse(sx,sy,22,9,0,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.globalAlpha=flash||near(echo)?1:.76;
      ClubStage.instrumentSprite(echo.instrument,sx,sy-2);
      ctx.globalAlpha=1;
    }
    ctx.restore();
  }

  const album=albumTrack11;
  albumTrack11=function(){return active()?null:album()};
  const ambient=soundscape;
  soundscape=function(){if(!active())return ambient();if(Music11.source)stopAlbum11(.35)};
  addEventListener('blur',()=>stop(session));
  addEventListener('pagehide',()=>stop(session));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop(session)});

  const style=document.createElement('style');
  style.textContent=`
    #finalEchoes[hidden]{display:none}
    #finalEchoes{position:absolute;z-index:5;bottom:54px;left:50%;transform:translateX(-50%);width:min(330px,80%);pointer-events:none}
    #finalEchoNotes{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:3px;list-style:none;padding:0;margin:0}
    #finalEchoNotes li{background:#231a30ef;border:1px solid #896e8f;text-align:center;padding:5px 1px;color:#e8cbd8;font:700 10px/1.15 monospace}
    #finalEchoNotes li[data-state=empty],#finalEchoNotes li[data-state=next]{border-style:dashed}
    #finalEchoNotes li[data-state=next]{border-color:#f4bf9e;color:#ffdab9}
    #finalEchoNotes li[data-state=filled]{color:#d8f0db;border-color:#8da998}
    #finalEchoNotes li[data-state=playing]{color:#261e23;background:#f1c99e;border-color:#ffe8bd}
    #finalEchoSignal{margin:3px 0 0;padding:5px 6px;text-align:center;background:#231a30ef;color:#f6e1cc;font:700 10px/1.2 monospace}
    .mobile121 #finalEchoes{bottom:38px}
    .mobile121.landscape121 #finalEchoes{bottom:27px;max-width:47%}
  `;
  document.head.appendChild(style);

  return Object.freeze({begin,step,drawGround,active,memory,echoes,missing,
    progress:()=>({active:active(),count:recovered(),hearing:!!session?.run,heard:!!session?.heard})});
})();

const finalEchoesUpdate=update;
update=function(dt,...args){
  const result=finalEchoesUpdate(dt,...args);
  FinalEchoes.step(Math.max(0,Math.min(.06,dt||0)));
  return result;
};

const finalEchoesCombatReady=combatReady10;
combatReady10=function(){return !FinalEchoes.active()&&finalEchoesCombatReady()};
const finalEchoesEngage=engage;
engage=function(){if(!FinalEchoes.active())return finalEchoesEngage()};
