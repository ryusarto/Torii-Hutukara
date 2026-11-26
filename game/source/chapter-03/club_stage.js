/* Contratempo · mesa de som, palco acessível e instrumentos tocados no mapa. */
const ClubStage=(()=>{
  'use strict';
  const TRACK='c3_chico_buarque',GAP=.68;
  const deck={x:8,y:5,w:12,h:4,stairs:[13,14]};
  const desk={id:'c3_phrase_stage',x:22.05,y:7.8,w:74,h:55,label:'Mesa de som · Ouvir a entrada'};
  const stations=[
    {id:'bass',event:'c3_club_bass',label:'Baixo',x:10.5,y:6.9,w:30,h:55,color:'#f0be79'},
    {id:'drums',event:'c3_club_drums',label:'Bateria',x:14,y:6.9,w:62,h:54,color:'#e3bb89'},
    {id:'guitar',event:'c3_club_guitar',label:'Guitarra',x:17.5,y:6.9,w:33,h:54,color:'#f5a394'}
  ];
  // Ataques recortados do máster de Chico Buarque. A banda responde com a faixa completa.
  const phrase=[
    {id:'bass',from:1.626,length:.28},{id:'drums',from:3.315,length:.24},
    {id:'guitar',from:2.748,length:.29},{id:'bass',from:4.445,length:.27},
    {id:'guitar',from:5.299,length:.26}
  ];
  const chairs=[[6.35,14],[8.65,14],[10.35,15.1],[12.6,15.1]];
  const rack={x:3.55,y:9.05,w:78,h:76};
  const bar={x:24.6,y:16.65,w:66,h:146,footprint:[24,11,2,6]};
  const stools=[[22.4,12.75],[22.4,14.7],[22.4,16.3]];
  const assets=__CLUB_STAGE_ASSETS__;
  const images=new Map();
  let session=null;

  const here=()=>G?.area==='contratempo'&&current?.id==='contratempo';
  const available=()=>here()&&G.c3.usinaDone&&G.c3.canalDone;
  const lookup=id=>stations.find(station=>station.id===id);
  const byId=()=>Object.create(null);

  const panel=document.createElement('aside');
  panel.id='clubStageMessage';panel.hidden=true;
  panel.setAttribute('role','status');
  $('frame').appendChild(panel);
  const style=document.createElement('style');
  style.textContent=`
    #clubStageMessage[hidden]{display:none}
    #clubStageMessage{position:absolute;z-index:5;bottom:52px;left:50%;transform:translateX(-50%);max-width:78%;width:max-content;padding:6px 9px;border:1px solid #b79571;background:#211a25ef;color:#f8dfb3;text-align:center;pointer-events:none;font:700 11px/1.25 monospace}
    #clubStageMessage[data-error=true]{color:#ffd0ba;border-color:#b37d6b}
    .mobile121 #clubStageMessage{bottom:42px}
    .mobile121.landscape121 #clubStageMessage{bottom:35px;max-width:46%}
  `;
  document.head.appendChild(style);

  function state(){
    if(session?.game!==G){
      stop(session);
      session={game:G,clock:0,count:0,heard:false,lights:byId(),preview:null,fetch:null,
        voice:null,buffer:null,finishAt:0,errorUntil:0,solvedUntil:0,feedback:''};
    }
    return session;
  }

  function image(key){
    if(!images.has(key)){
      const sprite=new Image();
      sprite.src=assets[key];
      images.set(key,sprite);
    }
    const sprite=images.get(key);
    return sprite.complete&&sprite.naturalWidth?sprite:null;
  }

  function stop(s){
    if(!s)return;
    s.fetch=null;s.preview=null;
    stopVoice(s);
  }

  function stopVoice(s){
    const source=s.voice;
    s.voice=null;
    if(source)source.stop();
  }

  function recording(){
    if(!audioEnabled||!AC||document.hidden||Music11.hidden)return Promise.resolve(null);
    const ready=AC.state==='running'?Promise.resolve():AC.resume().catch(()=>{});
    return Promise.all([decodeAlbum11(TRACK),ready]).then(([buffer])=>
      buffer?.duration>=phrase.at(-1).from+phrase.at(-1).length&&AC.state==='running'?buffer:null);
  }

  function playClip(clip,buffer){
    if(!buffer||!audioEnabled||AC.state!=='running'||Music11.hidden)return null;
    const source=AC.createBufferSource(),volume=AC.createGain(),now=AC.currentTime;
    source.buffer=buffer;volume.gain.setValueAtTime(0,now);
    volume.gain.linearRampToValueAtTime(.72,now+.008);
    volume.gain.setValueAtTime(.72,now+clip.length-.024);
    volume.gain.linearRampToValueAtTime(0,now+clip.length);
    source.connect(volume).connect(AC.destination);
    source.addEventListener('ended',()=>{source.disconnect();volume.disconnect()},{once:true});
    source.start(now,clip.from,clip.length);
    return source;
  }

  function sound(s,clip,buffer){
    stopVoice(s);
    const source=playClip(clip,buffer);
    s.voice=source;
    source?.addEventListener('ended',()=>{if(s.voice===source)s.voice=null},{once:true});
  }

  function listen(){
    if(!available()){toast('RESOLVA A USINA E O CANAL');return}
    if(mode!=='walk')return;
    const s=state();
    if(s.finishAt||s.preview)return;
    stop(s);
    const preview={index:-1,from:s.clock,pending:true,buffer:null};
    s.preview=preview;
    s.errorUntil=0;
    soundscape();
    recording().then(buffer=>{
      if(!here()||session!==s||s.preview!==preview||mode!=='walk')return;
      preview.pending=false;preview.from=s.clock;preview.buffer=buffer;s.buffer=buffer;
    });
  }

  function touch(station){
    if(!available()){toast('A BANDA AINDA ESPERA A USINA E O CANAL');return}
    if(mode!=='walk')return;
    const s=state();
    if(s.preview||s.finishAt)return;
    const expected=phrase[s.count];
    const trying=s.heard;
    const correct=trying&&expected?.id===station.id;
    const clip=correct?expected:phrase.find(piece=>piece.id===station.id);
    const wrong=trying&&!correct;
    s.lights[station.id]={until:s.clock+.55,wrong};
    if(correct){
      s.count++;
      s.feedback=s.count===phrase.length?'A banda está entrando…':'';
      if(s.count===phrase.length)s.finishAt=s.clock+clip.length+.15;
    }else if(wrong){
      s.count=0;s.errorUntil=s.clock+1.15;
      s.feedback='A entrada saiu da ordem. Tente de novo ou ouça na mesa.';
    }else if(!G.c3.clubPhraseDone)s.feedback='Ouça a entrada completa na mesa de som.';
    emitMusic(station.x*T,station.y*T-8,wrong?5:11,wrong?'red':'gold');
    const buffer=s.buffer||Music11.buffer.get(TRACK);
    if(buffer)sound(s,clip,buffer);
    else if(audioEnabled){
      const token={};
      s.fetch=token;
      soundscape();
      recording().then(loaded=>{
        if(!here()||mode!=='walk'||s!==session||s.fetch!==token)return;
        s.fetch=null;s.buffer=loaded;sound(s,clip,loaded);
      });
    }
  }

  function render(s){
    panel.hidden=mode!=='walk'||G.x<6.5||G.x>23.8||G.y>13||
      (G.c3.clubPhraseDone&&!s.preview&&!s.heard&&s.clock>s.solvedUntil);
    if(panel.hidden)return;
    const p=s.preview;
    panel.dataset.error=String(s.clock<s.errorUntil);
    let label='Ouça as cinco notas na mesa de som';
    if(p)label=p.index<0?'Preparando a entrada…':'Referência '+(p.index+1)+' de '+phrase.length+' · '+lookup(phrase[p.index].id).label;
    else if(s.feedback)label=s.feedback;
    else if(s.count)label=s.count+' de '+phrase.length+' notas · Continue no seu ritmo';
    else if(s.heard)label='Sua vez. Suba ao palco e toque os instrumentos na ordem.';
    else if(G.c3.clubPhraseDone)label='O show começou';
    if(panel.textContent!==label)panel.textContent=label;
  }

  function step(dt){
    if(!available()){
      if(session)stop(session);
      session=null;panel.hidden=true;
      return;
    }
    const s=state();
    if(mode!=='walk'){
      stop(s);panel.hidden=true;
      return;
    }
    s.clock+=dt;
    const p=s.preview;
    if(p&&!p.pending&&s.clock-p.from>=(p.index+1)*GAP){
      p.index++;
      if(p.index===phrase.length){
        stop(s);s.heard=true;
        s.feedback=s.count?'Continue a entrada de onde parou.':'';
      }else{
        const clip=phrase[p.index];
        s.lights[clip.id]={until:s.clock+.51,wrong:false};
        sound(s,clip,p.buffer);
      }
    }
    if(s.finishAt&&s.clock>=s.finishAt){
      s.finishAt=0;s.solvedUntil=s.clock+4;s.heard=false;s.count=0;
      s.feedback=G.c3.clubPhraseDone?'Entrada completa.':'';
      C3.finishClubStage(phrase.map(piece=>stations.findIndex(station=>station.id===piece.id)));
    }
    render(s);
  }

  function install(area){
    // Uma borda física fecha a frente e os lados. Os dois ladrilhos centrais são a escada.
    for(let x=deck.x;x<deck.x+deck.w;x++){
      solid(area,x,deck.y-1);
      if(!deck.stairs.includes(x))solid(area,x,deck.y+deck.h);
    }
    for(let y=deck.y-1;y<=deck.y+deck.h;y++){
      solid(area,deck.x-1,y);solid(area,deck.x+deck.w,y);
    }
    solid(area,Math.floor(desk.x),Math.floor(desk.y));
    for(const [x,y] of chairs){
      prop(area,'clubFurniture',x,y,{asset:'chair_north',w:31,h:43,worldGroundY:y});
      solid(area,Math.floor(x),Math.floor(y));
    }
    prop(area,'clubFurniture',rack.x,rack.y,{asset:'rack',w:rack.w,h:rack.h,worldGroundY:rack.y});
    rectBlock(area,2,8,3,1);
    prop(area,'clubFurniture',bar.x,bar.y,{asset:'bar_west',w:bar.w,h:bar.h,worldGroundY:bar.y});
    rectBlock(area,...bar.footprint);
    for(const [x,y] of stools)prop(area,'clubFurniture',x,y,{asset:'stool',w:26,h:30,worldGroundY:y});
    evt(area,desk.id,desk.x,desk.y,desk.label,()=>C3.openPhrase('club'));
    for(const station of stations){
      prop(area,'clubInstrument',station.x,station.y,{instrument:station.id,worldGroundY:station.y});
      evt(area,station.event,station.x,station.y,station.label,()=>touch(station));
      solid(area,Math.floor(station.x),Math.floor(station.y));
    }
  }

  function cameraX(follow){
    if(!here()||G.y>=11.5||G.x<6.5||G.x>23.8)return follow;
    const left=(deck.x-.35)*T,right=desk.x*T+desk.w/2;
    return right-left<=VW?clamp(follow,right-VW,left):follow;
  }

  function cameraY(follow){
    return here()&&G.y<13?Math.min(follow,-6):follow;
  }

  function drawGround(){
    if(!here())return;
    const x=Math.round(deck.x*T-cam.x),y=Math.round(deck.y*T-cam.y),wide=deck.w*T,deep=deck.h*T;
    ctx.save();
    const colors=['#633e33','#755041','#6c4636','#805742'];
    rect(x-3,y+deep+5,wide+6,16,'#1d1621aa');
    for(let row=0;row<deck.h*3;row++){
      const yy=y+row*(T/3);
      rect(x,yy,wide,T/3,colors[row%colors.length]);
      rect(x,yy+T/3-1,wide,1,'#23191a80');
      for(let board=0;board<deck.w;board+=2){
        const px=x+(board+(row%2))*T;
        rect(px,yy+1,1,T/3-2,'#31222677');
        rect(px+3,yy+2,T-7,1,'#a2735355');
      }
    }
    rect(x,y+deep,wide,11,'#3e2830');
    rect(x,y+deep,wide,2,'#bd895c');
    rect(x,y+deep+9,wide,2,'#221924');
    rect(x,y,3,deep,'#b68762');rect(x+wide-3,y,3,deep,'#b68762');

    const stairs=Math.round(deck.stairs[0]*T-cam.x),treads=deck.stairs.length*T;
    for(let i=0;i<4;i++){
      const yy=y+deep+i*6;
      rect(stairs-1,yy,treads+2,6,colors[(i+1)%colors.length]);
      rect(stairs,yy,treads,1,'#d39d71');rect(stairs,yy+5,treads,1,'#36242a');
    }
    ctx.restore();
  }

  function instrumentSprite(id,x,y,bounce=0){
    const station=lookup(id),sprite=image(id);
    if(!sprite)return;
    const ratio=Math.min(station.w/sprite.naturalWidth,station.h/sprite.naturalHeight);
    const w=Math.round(sprite.naturalWidth*ratio),h=Math.round(sprite.naturalHeight*ratio);
    ctx.drawImage(sprite,x-Math.round(w/2),y-h-bounce,w,h);
  }

  function drawProp(p,cx,cy){
    if(!here())return false;
    const x=Math.round(p.x*T-cx),y=Math.round(p.y*T-cy);
    if(p.type==='c3_stage'){
      const frame=image('backdrop');
      if(frame){
        const w=deck.w*T+8,h=5*T;
        ctx.drawImage(frame,x-w/2,y+T-h,w,h);
      }
      if(!available()&&!G.c3.clubPhraseDone)return true;
      const s=state(),lit=G.c3.clubPhraseDone?phrase.length:s.count;
      for(let lamp=0;lamp<Math.min(lit,3);lamp++){
        const px=x+(lamp-1)*56,top=y-54,bottom=y+29;
        ctx.save();
        const light=ctx.createLinearGradient(0,top,0,bottom);
        light.addColorStop(0,'#ffdfa85a');light.addColorStop(1,'#f5a37d05');
        ctx.fillStyle=light;ctx.beginPath();
        ctx.moveTo(px-5,top);ctx.lineTo(px+5,top);ctx.lineTo(px+27,bottom);ctx.lineTo(px-27,bottom);
        ctx.closePath();ctx.fill();ctx.restore();
      }
      for(let index=0;index<phrase.length;index++){
        const px=x+(index-(phrase.length-1)/2)*13,py=y+T-6;
        rect(px-3,py-2,7,5,'#35232b');
        rect(px-2,py-1,5,3,index<lit?'#f6c982':'#88684f');
      }
      return true;
    }
    if(p.item==='projection_console'&&p.clubSoundDesk){
      CenariosV2.sprite('projection_console',x,y-desk.h/2,desk.w,desk.h);
      const near=mode==='walk'&&Math.hypot(G.x-p.x,G.y-p.y)<1.9;
      rect(x-9,y-desk.h+10,18,2,session?.preview?'#f6cd87':near?'#aedece':'#6a9b92');
      return true;
    }
    if(p.type==='clubFurniture'){
      ctx.save();
      ctx.fillStyle='#1d141b70';ctx.beginPath();
      ctx.ellipse(x,y-1,p.w*.41,p.asset==='bar_west'?8:4,0,0,Math.PI*2);ctx.fill();
      if(p.asset==='stool')CenariosV2.sprite('club_stool',x,y-p.h/2,p.w,p.h);
      else{
        const sprite=image(p.asset);
        if(sprite){
          const scale=Math.min(p.w/sprite.naturalWidth,p.h/sprite.naturalHeight);
          const w=Math.round(sprite.naturalWidth*scale),h=Math.round(sprite.naturalHeight*scale);
          ctx.drawImage(sprite,x-Math.round(w/2),y-h,w,h);
        }
      }
      ctx.restore();return true;
    }
    if(p.type!=='clubInstrument')return false;
    const station=lookup(p.instrument),s=session,flash=s?.lights[station.id];
    const level=flash?clamp((flash.until-s.clock)/.55,0,1):0;
    const near=mode==='walk'&&available()&&Math.hypot(G.x-p.x,G.y-p.y)<1.9;
    ctx.save();
    ctx.fillStyle=level?flash.wrong?'#c5736555':station.color+'61':near?'#ffda9b38':'#21151b8c';
    ctx.beginPath();ctx.ellipse(x,y,station.w*.53,7,0,0,Math.PI*2);ctx.fill();
    instrumentSprite(station.id,x,y,G.options10?.reducedMotion?0:Math.round(level*2));
    if(near||level)rect(x-5,y+2,10,2,level&&flash.wrong?'#e99380':station.color);
    ctx.restore();
    return true;
  }

  const foreground=()=>here()&&session&&(session.preview||session.voice||session.fetch);
  const album=albumTrack11;
  albumTrack11=function(){return foreground()?null:album()};
  const ambient=soundscape;
  soundscape=function(){
    if(!foreground())return ambient();
    if(Music11.gain&&Music11.lastLevel!==0){
      const gain=Music11.gain.gain,now=AC.currentTime;
      gain.cancelScheduledValues(now);gain.setTargetAtTime(0,now,.035);Music11.lastLevel=0;
    }
  };
  addEventListener('blur',()=>stop(session));
  addEventListener('pagehide',()=>stop(session));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop(session)});

  return Object.freeze({install,listen,step,cameraX,cameraY,drawGround,drawProp,desk,stations,
    recording,playClip,instrumentSprite,motif:Object.freeze(phrase.map(Object.freeze)),
    order:phrase.map(piece=>piece.id),
    progress:()=>({heard:!!session?.heard,count:session?.count||0,preview:!!session?.preview,
      ready:!!session?.finishAt,error:!!session&&session.clock<session.errorUntil})});
})();

const clubStageUpdate=update;
update=function(dt,...args){
  const result=clubStageUpdate(dt,...args);
  ClubStage.step(Math.max(0,Math.min(.06,dt||0)));
  return result;
};

const clubStageProp=drawProp;
drawProp=function(p,cx,cy){
  if(!ClubStage.drawProp(p,cx,cy))return clubStageProp(p,cx,cy);
};
