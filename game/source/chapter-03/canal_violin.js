/* Canal Suspenso · a passarela física só existe depois da nota completa. */
const CanalViolin=(()=>{
  'use strict';
  const AREA='sky_canal',MARK={x:14,y:12},DECK={x:17,y:10,w:7,h:5};
  const HOLD=2.4,DECAY=.65;
  // Si bemol do máster de Veracidade (3,858–3,980 s), com a emenda do loop no próprio recorte.
  const RECORDING='__CANAL_VIOLIN_WAV__',LOOP_START=1180/24000;
  const keysForNote=['e','E','Enter','f','F'];
  const panel=document.createElement('aside');
  panel.id='canalViolin';panel.hidden=true;
  panel.innerHTML='<div id="canalViolinHint" role="status"></div><progress id="canalViolinMeter" max="1" value="0" aria-label="Formação da passarela"></progress>';
  $('frame').appendChild(panel);
  const style=document.createElement('style');
  style.textContent=`
    #canalViolin[hidden]{display:none}
    #frame:has(#canalViolin:not([hidden])) #prompt{visibility:hidden}
    #canalViolin{position:absolute;z-index:5;bottom:17px;left:50%;transform:translateX(-50%);width:max-content;max-width:76%;padding:6px 9px;border:1px solid #9b8b6a;background:#18252be8;color:#e6f2d7;text-align:center;pointer-events:none;font:700 11px/1.25 monospace}
    #canalViolin progress{display:block;width:100%;height:6px;margin-top:5px;accent-color:#a0dabe}
    .mobile121.landscape121 #canalViolin{max-width:50%}
  `;
  document.head.appendChild(style);
  let session=null,recording=null;

  const here=()=>G?.area===AREA&&current?.id===AREA;
  const near=body=>!!body&&Math.hypot(body.x-MARK.x,body.y-MARK.y)<1.9;
  const hasViolin=()=>here()&&G.flags.violin11&&!G.c3.canalPath;
  function state(){
    if(session?.game!==G){
      clear();
      session={game:G,value:0,input:null,voice:null};
    }
    return session;
  }

  function takeInput(){
    const touch=[...Input121.pointers].find(([,state])=>state.action==='interact');
    if(near(G)&&touch)return {kind:'touch',id:touch[0]};
    const key=keysForNote.find(key=>keys[key]);
    if(near(G)&&key)return {kind:'key',id:key};
    const pad=C3.pad.pads.find((pad,seat)=>seat<=1&&C3.padEdge(pad,0)&&
      (seat===0?near(G):C3.coopActive()&&near(C3.coop)));
    return pad?{kind:'pad',id:pad.index,seat:C3.pad.pads.indexOf(pad)}:null;
  }

  function held(input){
    if(!input||!Input121.focused||document.hidden)return false;
    if(input.kind==='touch')return near(G)&&Input121.pointers.get(input.id)?.action==='interact';
    if(input.kind==='key')return near(G)&&!!keys[input.id];
    const pad=C3.pad.pads[input.seat];
    return pad?.index===input.id&&C3.padPressed(pad,0)&&
      (input.seat===0?near(G):C3.coopActive()&&near(C3.coop));
  }

  function prepareVoice(){
    if(!audioEnabled||!AC||Music11.hidden)return null;
    if(!recording){
      recording={buffer:null};
      const bytes=Uint8Array.from(atob(RECORDING),char=>char.charCodeAt(0));
      AC.decodeAudioData(bytes.buffer).then(buffer=>{recording.buffer=buffer},()=>{});
    }
    return recording.buffer;
  }

  function startVoice(s,buffer){
    if(s.voice||!buffer||AC.state!=='running')return;
    const now=AC.currentTime,source=AC.createBufferSource(),volume=AC.createGain();
    source.buffer=buffer;source.loop=true;source.loopStart=LOOP_START;source.loopEnd=buffer.duration;
    volume.gain.setValueAtTime(0,now);
    volume.gain.linearRampToValueAtTime(.28,now+.027);
    source.connect(volume).connect(AC.destination);
    source.onended=()=>{source.disconnect();volume.disconnect()};
    s.voice={source,volume};
    source.start(now);
  }

  function stopVoice(s){
    const voice=s?.voice;
    if(!voice)return;
    s.voice=null;
    const now=AC.currentTime;
    voice.volume.gain.cancelScheduledValues(now);
    voice.volume.gain.setTargetAtTime(0,now,.016);
    voice.source.stop(now+.075);
  }

  function clear(){
    stopVoice(session);session=null;panel.hidden=true;
  }

  function instruction(){
    if(Input121.mobile&&!C3.pad.pads.length)return 'Segure Ação para tocar o violino';
    if(C3.pad.pads.length)return 'Segure o botão de interação para tocar o violino';
    return 'Segure '+(window.ToriiInterface6?.KeyMap?.label('interact')||'E')+' para tocar o violino';
  }

  function begin(){
    if(!here()||mode!=='walk')return;
    if(!G.flags.violin11)return talk([{who:'narrator',t:'A passarela existe em várias camadas ao mesmo tempo. O Violino das Vozes pode separá-las.'}]);
    if(G.c3.canalPath)return toast('PASSARELA · FIRME');
    const s=state(),input=takeInput();
    if(!s.input&&input)s.input=input;
    refresh(s);
  }

  function finish(){
    G.c3.canalPath=true;
    C3.applyWorld();
    routeCache.key='';save(true);updateHUD();
    emitMusic(20*T,12*T,26,'green');
  }

  function refresh(s){
    panel.hidden=mode!=='walk'||!near(G)&&!s.input&&s.value===0;
    if(panel.hidden)return;
    const hint=$('canalViolinHint'),meter=$('canalViolinMeter');
    let text=instruction();
    if(G.c3.canalPath)text='Passarela firme. Solte para continuar.';
    else if(s.input)text='Sustente a nota até firmar a passarela';
    else if(s.value>0)text='A interferência voltou. Sustente a nota outra vez.';
    if(hint.textContent!==text)hint.textContent=text;
    meter.value=s.value;
  }

  function step(dt){
    if(!here()||!G.flags.violin11||G.c3.canalPath&&session?.game!==G){
      if(session)clear();
      return;
    }
    const s=state();
    if(mode!=='walk'||!held(s.input))interrupt();
    const buffer=mode==='walk'&&(near(G)||s.input)?prepareVoice():null;
    if(!audioEnabled)stopVoice(s);
    if(s.input)startVoice(s,buffer);
    if(G.c3.canalPath&&!s.input&&mode==='walk'){
      clear();
      C3.scene('C3_009',()=>save(true));
      return;
    }
    if(mode==='walk'&&!G.c3.canalPath){
      if(s.input){
        s.value=Math.min(1,s.value+dt/HOLD);
        if(s.value>=1)finish();
      }else s.value=Math.max(0,s.value-dt/DECAY);
    }
    refresh(s);
  }

  function cameraX(follow){
    if(!here()||!near(G)||!G.flags.violin11)return follow;
    if(!['walk','dialogue'].includes(mode))return follow;
    const eastBank=(DECK.x+DECK.w+.75)*T;
    return clamp(Math.max(follow,eastBank-VW),0,current.w*T-VW);
  }

  function draw(){
    const value=session?.value;
    if(!value||!hasViolin())return;
    const reduced=G.options10?.reducedMotion;
    const left=Math.round(DECK.x*T-cam.x),top=Math.round(DECK.y*T-cam.y);
    ctx.save();
    // Primeiro aparece o contorno. Em seguida a nota limpa a interferência da margem próxima à distante.
    ctx.globalAlpha*=.18+value*.54;
    ctx.strokeStyle='#a0ddc1';ctx.lineWidth=1;ctx.setLineDash(reduced?[]:[5,4]);
    ctx.strokeRect(left,top,DECK.w*T,DECK.h*T);
    ctx.setLineDash([]);
    ctx.restore();
    for(let x=0;x<DECK.w;x++)for(let y=0;y<DECK.h;y++){
      const solid=clamp((value*8-x-Math.abs(y-2)*.21)/1.52,0,1);
      if(!solid)continue;
      const sx=left+x*T,sy=top+y*T;
      ctx.save();ctx.globalAlpha*=solid;
      drawTile('c3_bridge',sx,sy+(reduced?0:Math.round((1-solid)*6)),DECK.x+x,DECK.y+y);
      if(solid<.96){
        ctx.fillStyle='#b8e8d2';ctx.fillRect(sx+2,sy+3,T-4,1);
        ctx.fillRect(sx+T-2,sy+6,1,T-10);
      }
      ctx.restore();
    }
  }

  const foreground=()=>!!(session?.input&&here()&&mode==='walk');
  const album=albumTrack11;
  albumTrack11=function(){return foreground()?null:album()};
  const ambient=soundscape;
  soundscape=function(){
    if(!foreground())return ambient();
    if(Music11.gain&&Music11.lastLevel!==0){
      const gain=Music11.gain.gain,now=AC.currentTime;
      gain.cancelScheduledValues(now);gain.setTargetAtTime(0,now,.05);Music11.lastLevel=0;
    }
  };
  function interrupt(){
    if(session){session.input=null;stopVoice(session)}
  }
  addEventListener('blur',interrupt);
  addEventListener('pagehide',interrupt);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)interrupt()});

  return Object.freeze({begin,step,draw,cameraX,
    progress:()=>({holding:!!session?.input,value:session?.value||0,complete:!!G?.c3?.canalPath})});
})();

const canalViolinUpdate=update;
update=function(dt,...args){
  const result=canalViolinUpdate(dt,...args);
  CanalViolin.step(Math.max(0,Math.min(.06,dt||0)));
  return result;
};
