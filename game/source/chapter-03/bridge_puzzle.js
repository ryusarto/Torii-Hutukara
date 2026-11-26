/* Ponte das Frequências · tocada na clareira, com passagem e recompensa legadas. */
const BridgePuzzle=(()=>{
  'use strict';
  const track='nunca_imaginei';
  // Quatro ataques do master de Nunca Imaginei, entre 2:04 e 2:05.
  const phrase=[
    {note:1,start:124.510,end:124.656},
    {note:2,start:124.665,end:124.834},
    {note:3,start:124.840,end:125.022},
    {note:2,start:125.027,end:125.215}
  ];
  const sequence=phrase.map(clip=>clip.note);
  const exampleGap=.64;
  const marker={id:'bridge',kind:'marker',x:30,y:21,label:'Marco · Ouvir o exemplo'};
  const stations=[
    {id:'bridge_log',kind:'log',note:1,x:27.75,y:18.75,label:'Tronco oco',pitch:493.883,duration:.28,voice:'triangle'},
    {id:'bridge_stone',kind:'stone',note:2,x:27.75,y:21.25,label:'Pedra rachada',pitch:554.365,duration:.39,voice:'sine'},
    {id:'bridge_bell',kind:'bell',note:3,x:27.75,y:23.75,label:'Sino de madeira',pitch:622.254,duration:.50,voice:'triangle'}
  ];
  const byNote=note=>stations[note-1];
  const frame=$('frame'),panel=document.createElement('aside'),style=document.createElement('style');
  panel.hidden=true;
  panel.id='bridgeMessage';
  panel.setAttribute('role','status');
  panel.setAttribute('aria-live','polite');
  frame.appendChild(panel);
  style.textContent=`
    #bridgeMessage[hidden]{display:none}
    #bridgeMessage{position:absolute;z-index:5;bottom:54px;left:50%;transform:translateX(-50%);max-width:76%;padding:6px 9px;border:1px solid #b78d5b;background:#1c1b25ed;color:#ffe3b3;text-align:center;pointer-events:none;border-radius:5px;font:700 11px/1.2 monospace}
    #bridgeMessage[data-error="true"]{color:#ffd2bf;border-color:#925b55}
    .mobile121 #bridgeMessage{bottom:47px}
    .mobile121.landscape121 #bridgeMessage{bottom:10px;max-width:45%}
  `;
  document.head.appendChild(style);
  let session=null;
  const full=Object.freeze(Array.from({length:4},()=>Object.freeze({progress:1,direction:0})));
  const empty=()=>({progress:0,direction:0,wait:0});
  function state(){
    if(session?.game===G)return session;
    stopPlayback(session);
    session={game:G,heard:false,count:0,clock:0,feedback:'',segments:sequence.map(empty),lights:[0,0,0],resetting:0,playback:null,source:null,pendingClip:null,quietUntil:0,solvedAt:-Infinity};
    return session;
  }
  function forest(){
    return !!G&&G.area==='forest'&&current?.id==='forest';
  }
  function stopPlayback(s){
    if(!s)return;
    s.playback=null;s.pendingClip=null;s.quietUntil=0;
    stopClip(s);
  }
  function stopClip(s){
    const source=s.source;
    s.source=null;
    if(source){try{source.stop()}catch{}}
  }
  const isResetting=s=>s.resetting>0||s.segments.some(part=>part.direction<0);
  async function getRecording(){
    if(!audioEnabled||!AC||Music11.hidden)return null;
    const ready=AC.state==='running'?Promise.resolve():AC.resume().catch(()=>{});
    const [buffer]=await Promise.all([decodeAlbum11(track),ready]);
    return buffer?.duration>=phrase.at(-1).end&&AC.state==='running'?buffer:null;
  }
  function playClip(s,clip,buffer){
    stopClip(s);
    if(!audioEnabled||!AC||Music11.hidden)return;
    if(buffer){
      try{
        const source=AC.createBufferSource(),gain=AC.createGain(),now=AC.currentTime,length=clip.end-clip.start;
        source.buffer=buffer;source.connect(gain);gain.connect(AC.destination);
        gain.gain.setValueAtTime(0,now);
        gain.gain.linearRampToValueAtTime(.78,now+.009);
        gain.gain.setValueAtTime(.78,now+length-.016);
        gain.gain.linearRampToValueAtTime(0,now+length);
        source.onended=()=>{source.disconnect();gain.disconnect();if(s.source===source)s.source=null};
        s.source=source;source.start(now,clip.start,length);
        return;
      }catch{stopClip(s)}
    }
    const station=byNote(clip.note);
    s.quietUntil=s.clock+station.duration;
    playTone(station.pitch,station.duration,station.voice,.105);
  }
  async function playExample(s){
    stopPlayback(s);
    s.heard=true;
    s.feedback='';
    const p={pending:true,buffer:null,from:s.clock,index:-1};
    s.playback=p;
    soundscape();
    const buffer=await getRecording();
    if(s.playback!==p||s.game!==G||!allowed())return;
    p.pending=false;p.buffer=buffer;p.from=s.clock;
  }
  async function playStation(s,clip){
    if(!audioEnabled||!AC||Music11.hidden)return;
    const request={};
    s.pendingClip=request;
    soundscape();
    const buffer=await getRecording();
    if(s.pendingClip!==request||s.game!==G||!allowed())return;
    s.pendingClip=null;
    playClip(s,clip,buffer);
  }
  function allowed(){
    return forest()&&mode==='walk'&&!!G.flags.bass;
  }
  function listen(){
    if(!forest()||mode!=='walk')return;
    if(!G.flags.bass){
      talk([{who:'narrator',t:'O marco vibra na beira do rio. O Baixo de Raiz poderia responder ao som.'}]);
      return;
    }
    const s=state();
    if(isResetting(s)||s.count===sequence.length&&!G.flags.bridge)return;
    playExample(s);
  }
  function touch(station){
    if(!allowed())return;
    const s=state(),matches=station.note===sequence[s.count];
    stopPlayback(s);
    s.lights[station.note-1]=1;
    playStation(s,matches?phrase[s.count]:phrase.find(clip=>clip.note===station.note));
    if(G.flags.bridge||isResetting(s)||s.count===sequence.length)return;
    if(matches){
      s.segments[s.count++].direction=1;
      s.feedback=s.count===sequence.length?'A última parte está encaixando…':'';
      return;
    }
    const count=s.count;
    for(let i=0;i<count;i++){
      const part=s.segments[i];
      part.direction=-1;part.wait=(count-1-i)*.105;
    }
    s.count=0;s.resetting=.25+Math.max(0,count-1)*.105;
    s.feedback=count?'A ponte se desfez. Comece de novo.':'Ouça a ordem no marco da margem.';
  }
  function finish(s){
    if(G.flags.bridge)return;
    G.flags.bridge=true;s.solvedAt=s.clock;s.feedback='Ponte concluída';
    G.resonance=clamp(G.resonance+30,0,100);G.shards+=4;
    routeCache.key='';save(true);updateHUD();
    toast('PONTE ABERTA · +30 RESSONÂNCIA · +4 FRAGMENTOS');
  }
  function renderPanel(s){
    panel.hidden=!forest()||!G.flags.bass||!['walk','action'].includes(mode)||G.x<23||G.x>38||G.y<15||G.y>28||
      (G.flags.bridge&&s.clock-s.solvedAt>3&&!s.playback);
    if(panel.hidden)return;
    const p=s.playback;
    panel.dataset.error=String(isResetting(s));
    const label=p?.pending||p&&p.index<0?'Preparando o exemplo…':p?
      `Exemplo ${p.index+1} de ${phrase.length} · ${byNote(phrase[p.index].note).label}`:
      G.flags.bridge?'Ponte concluída':s.feedback||
      (s.count?`${s.count} de ${phrase.length} notas encaixadas`:'Ouça o exemplo no marco');
    if(panel.textContent!==label)panel.textContent=label;
  }
  function step(dt){
    if(!forest()){
      stopPlayback(session);panel.hidden=true;return;
    }
    const s=state();
    if(mode!=='walk'){stopPlayback(s);renderPanel(s);return}
    const reduced=!!G.options10?.reducedMotion;
    s.clock+=dt;
    s.lights=s.lights.map(v=>Math.max(0,v-dt*1.9));
    for(const p of s.segments){
      if(p.wait>0){p.wait=Math.max(0,p.wait-dt);continue}
      if(!p.direction)continue;
      const time=p.direction>0?(reduced?.16:.48):(reduced?.12:.25);
      p.progress=clamp(p.progress+p.direction*dt/time,0,1);
      if(p.progress===0||p.progress===1)p.direction=0;
    }
    s.resetting=Math.max(0,s.resetting-dt);
    if(s.count===sequence.length&&s.segments.every(p=>p.progress===1))finish(s);
    const p=s.playback;
    if(p&&!p.pending&&s.clock-p.from>=exampleGap*(p.index+1)){
      p.index++;
      if(p.index===phrase.length){
        stopPlayback(s);
        if(!G.flags.bridge&&!s.count)s.feedback='Sua vez. Toque os objetos na ordem do exemplo.';
      }else{
        const clip=phrase[p.index];
        s.lights.fill(0);
        s.lights[clip.note-1]=1;
        playClip(s,clip,p.buffer);
      }
    }
    renderPanel(s);
  }
  function drawGround(){
    if(!forest())return;
    const x=Math.round(32*T-cam.x),y=Math.round(19*T-cam.y);
    if(x+4*T<0||y+5*T<0||x>VW||y>VH)return;
    const s=state();
    BridgeArt.draw(ctx,{x,y,w:4*T,h:5*T,segments:G.flags.bridge?full:s.segments,time:s.clock,
      complete:G.flags.bridge,reducedMotion:!!G.options10?.reducedMotion});
  }
  function drawStation(p,cx,cy){
    const s=state();
    BridgeArt.drawStation(ctx,{x:Math.round(p.x*T-cx),y:Math.round(p.y*T-cy),kind:p.bridgeKind,
      active:p.bridgeKind==='marker'?Number(!!s.playback):s.lights[p.note-1],
      near:mode==='walk'&&Math.hypot(G.x-p.x,G.y-p.y)<1.9,time:s.clock,
      reducedMotion:!!G.options10?.reducedMotion});
  }
  function install(area){
    // Os três instrumentos formam uma fileira no mesmo piso, antes do rio.
    path(area,[[27,18],[27,24]],1,'forestpath');
    path(area,[[27,21],[30,21]],1,'forestpath');
    const clearings=[marker,...stations];
    area.props=area.props.filter(p=>{
      if(p.type==='bridgeMarker'||p.type==='signpost'&&p.text==='PONTE')return false;
      if(p.type!=='tree'||!clearings.some(node=>{
        const dx=p.x+.5-node.x,dy=p.y+.5-node.y;
        return Math.hypot(dx,dy)<1.65||Math.abs(dx)<1.95&&dy>0&&dy<3.55;
      }))return true;
      unsolid(area,p.x,p.y);return false;
    });
    const e=area.events.find(e=>e.id===marker.id);
    e.label=marker.label;e.doit=listen;
    for(const node of clearings){
      prop(area,'frequencyStation',node.x,node.y,{bridgeKind:node.kind,note:node.note,worldGroundY:node.y});
      if(node.note)evt(area,node.id,node.x,node.y,node.label,()=>touch(node));
    }
  }
  // A gravação em primeiro plano ocupa o mesmo lugar da trilha ambiente.
  const foreground=()=>forest()&&session&&(session.playback||session.pendingClip||session.source||session.quietUntil>session.clock);
  const previousTrack=albumTrack11;
  albumTrack11=function(){return foreground()?null:previousTrack()};
  const previousSoundscape=soundscape;
  soundscape=function(){
    if(!foreground())return previousSoundscape();
    if(Music11.gain&&Music11.lastLevel!==0){
      const gain=Music11.gain.gain,now=AC.currentTime;
      gain.cancelScheduledValues(now);gain.setTargetAtTime(0,now,.025);Music11.lastLevel=0;
    }
  };
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopPlayback(session)});
  addEventListener('pagehide',()=>stopPlayback(session));

  return Object.freeze({drawGround,drawStation,install,step,sequence,stations,
    progress:()=>({heard:state().heard,notes:state().count,resetting:isResetting(state()),
      segments:state().segments.map(part=>part.progress),playingRecording:!!state().source})});
})();
const bridgeBuildMaps=buildMaps;
buildMaps=function(...args){const result=bridgeBuildMaps(...args);BridgePuzzle.install(areas.forest);return result};
const bridgeUpdate=update;
update=function(dt,...args){const result=bridgeUpdate(dt,...args);BridgePuzzle.step(dt);return result};
const bridgeProp=drawProp;
drawProp=function(p,cx,cy){if(p.type==='frequencyStation')return BridgePuzzle.drawStation(p,cx,cy);return bridgeProp(p,cx,cy)};
const bridgeObjective=objectiveData;
objectiveData=function(){
  const goal=bridgeObjective();
  return G?.area==='forest'&&G.flags.bass&&!G.flags.bridge?
    {...goal,text:'Reúna as quatro notas da ponte.',hint:'Ouça o marco na margem e reproduza a frase nos objetos.'}:goal;
};
