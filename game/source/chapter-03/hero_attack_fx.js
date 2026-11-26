// Cast sprites complement the existing character poses. Delayed releases come
// from the original combat events, so a cancelled move never creates a hit.
const HeroAttackFX = {
  heroes:['franco','ryuchi','alt','katana','synth','percussion'],
  v3Sources:__HERO_ATTACK_V3_ATLASES__,v3Manifest:__HERO_ATTACK_V3_MANIFEST__,v3Images:{},
  v3Stats:{draws:0,projectiles:0,contacts:0},externalSource:null,
  withSource(hero,perform){
    const previous=this.externalSource;this.externalSource=hero;
    try{return HeroLegacyFX.withActor(hero,perform)}finally{this.externalSource=previous}
  },
  v3Ready(hero){
    if(!this.v3Sources[hero])return false;let im=this.v3Images[hero];
    if(!im){im=new Image();this.v3Images[hero]=im;im.src=this.v3Sources[hero]}
    return im.complete&&im.naturalWidth===1024&&im.naturalHeight===768;
  },
  v3Reduced(){return !!G?.options10?.reducedMotion || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches},
  v3Stamp(hero,clip,frame,x,y,width=64,height=width,angle=0,alpha=1){
    if(!this.v3Ready(hero))return false;const c=this.v3Manifest.cell;
    ctx.save();try{ctx.translate(Math.round(x),Math.round(y));ctx.rotate(angle);ctx.globalAlpha*=alpha;ctx.imageSmoothingEnabled=false;
      ctx.drawImage(this.v3Images[hero],Math.min(7,Math.max(0,frame|0))*c,Math.max(0,Math.min(5,clip|0))*c,c,c,-width/2,-height/2,width,height);
    }finally{ctx.restore()}this.v3Stats.draws++;return true;
  },
  v3Bass(event,phase){
    const origin={x:event.x*T-cam.x,y:event.y*T-cam.y+event.yOffset},hits=(event.art.hits||[]).slice(0,6),t=this.v3Reduced()?.48:phase;
    for(let i=0;i<Math.max(1,hits.length);i++){
      const hit=hits[i],angle=hit?Math.atan2(hit.y-event.y,hit.x-event.x):event.angle;
      const end=hit?this.contactPoint(hit,angle+Math.PI,t):{x:origin.x+Math.cos(angle)*37,y:origin.y+Math.sin(angle)*37};
      const travel=this.v3Reduced()?1:Math.min(1,t/.68),q=travel*travel*(3-2*travel);
      const x=origin.x+(end.x-origin.x)*q,y=origin.y+(end.y-origin.y)*q;
      this.v3Stamp('franco',5,this.v3Reduced()?3:Math.min(7,Math.floor(t*8)),x,y,62,36,angle,.96);
    }return true;
  },
  drawV3(event,phase){
    let art=event.art;
    if(!art){
      const legacy=event.row,hero=legacy===36?'alt':this.heroes[Math.min(5,Math.floor(legacy/4))];
      art={hero,clip:legacy===36?5:legacy%4===0?0:legacy%4+2,gesture:legacy===36?'floor':'strike'};
    }
    if(!this.v3Sources[art.hero])return false;
    // While decoding, the existing body pose communicates the accepted action.
    // Never fall through to ornament-heavy V1/V2 artwork for a V3-assigned hero.
    if(!this.v3Ready(art.hero))return true;
    if(art.gesture==='bass')return this.v3Bass(event,phase);
    const reduced=this.v3Reduced(),t=reduced?.43:phase,clip=art.clip||0;
    const frame=reduced?3:Math.min(7,Math.floor((art.startPhase||0)*8+t*(1-(art.startPhase||0))*8));
    const body=art.anchor,attached=body&&(body===G?G.active:C3.coop.member)===art.hero;
    let x=(attached?body.x:event.x)*T-cam.x,y=(attached?body.y:event.y)*T-cam.y+event.yOffset,angle=event.angle;
    let width=clip<3?64:78,height=clip<3?48:56;
    const floor=art.floor||art.floorWidth||['field','pulse','floor'].includes(art.gesture);
    if(floor){width=Math.min(86,art.floorWidth||78);height=width*.52;angle=0}
    if(art.gesture==='impact'){
      width=38;height=30;this.v3Stats.contacts++;
      if(art.edgeHit){const point=this.contactPoint(art.edgeHit,event.angle+Math.PI,t);x=point.x;y=point.y}
    }else if(art.gesture==='path'&&art.end){
      const travel=art.live?1:t;x+=(art.end.x-event.x)*T*travel;y+=(art.end.y-event.y)*T*travel;width=76;height=40;
    }else if(art.gesture==='link'&&art.end){
      const q=Math.min(1,t/.65);x+=(art.end.x-event.x)*T*q;y+=(art.end.y-event.y)*T*q;width=68;height=38;
    }else if(!floor){
      // Same generated phase, same direction: no procedural contour or weapon copy.
      const reach=clip<3?34:18;x+=Math.cos(angle)*reach;y+=Math.sin(angle)*reach;
    }
    if(art.accent){width=44;height=28}
    const alpha=art.gesture==='impact'?.98:floor?.88:.96;
    this.v3Stamp(art.hero,clip,frame,x,y,width,height,angle,alpha);return true;
  },
  combos:{franco:[0,24,25],ryuchi:[4,26,27],katana:[12,28,29],synth:[16,30,31],percussion:[20,32,33]},
  capture:null,enemyEdges:new Map(),events:[],game:null,area:null,clock:0,
  ready(hero){return this.v3Ready(hero)},
  sync(){
    if(this.game===G && this.area===G?.area)return;
    this.game=G;this.area=G?.area;this.events.length=0;this.clock=0;
  },
  advance(dt){
    this.sync();
    if(!G || (mode!=='walk' && mode!=='action') || menuOpen || !Number.isFinite(dt) || dt<=0)return;
    if(mode==='action'){
      this.ready(G.active);
      if(C3.coopActive())this.ready(C3.coopMember());
    }
    this.clock+=dt;
    for(let i=this.events.length-1;i>=0;i--){
      const event=this.events[i];
      if(this.clock-event.start>=event.duration)this.events.splice(i,1);
    }
  },
  emit(row,x,y,direction,duration,scale=1,sword=false,yOffset=-15,art=null){
    if(!G || !Number.isFinite(x) || !Number.isFinite(y))return;
    this.sync();
    if(art)this.ready(art.hero);
    if(this.events.length>=24)this.events.shift();
    const event={row,x,y,angle:Math.atan2(direction[1],direction[0]),start:this.clock,duration,scale,sword,yOffset,art};
    this.events.push(event);
    return event;
  },
  enemyEdge(target,angle){
    // Measure the contour of the enemy's actual hurt frame once per species.
    // Only sixteen radial distances survive the readback; no per-frame mask or canvas.
    const art=EnemyArtV1,key=art.key(target.type,target),entry=art.manifest.enemies[key];
    const height=entry?.height||60,shoulder=height*.39;
    let radii=this.enemyEdges.get(key);
    const image=entry && art.image(key);
    if(!radii && image?.complete && image.naturalWidth){
      const cell=art.manifest.cell,[px,py]=art.manifest.pivot,cy=py-cell*.39;
      const canvas=document.createElement('canvas');canvas.width=canvas.height=cell;
      const c=canvas.getContext('2d',{willReadFrequently:true});
      c.drawImage(image,cell,cell,cell,cell,0,0,cell,cell);
      const data=c.getImageData(0,0,cell,cell).data;
      radii=[];
      for(let i=0;i<16;i++){
        const a=i*Math.PI/8,ux=Math.cos(a),uy=Math.sin(a);
        let radius=0,run=0;
        for(let r=cell;r>=0;r--){
          const x=Math.round(px+ux*r),y=Math.round(cy+uy*r);
          const solid=x>=0 && x<cell && y>=0 && y<cell && data[4*(x+y*cell)+3]>135;
          run=solid?run+1:0;
          if(run===3){radius=(r+2)*height/cell;break}
        }
        radii.push(radius || height*.19);
      }
      this.enemyEdges.set(key,radii);
    }
    const i=((angle/(Math.PI*2)*16)%16+16)%16,k=Math.floor(i);
    const radius=radii?radii[k]+(radii[(k+1)%16]-radii[k])*(i-k):height*.20;
    return {x:Math.cos(angle)*(radius+2),y:-shoulder+Math.sin(angle)*(radius+2)};
  },
  contactPoint(hit,angle,phase=1){
    const target=hit.target;
    if(target===bossActor || current?.enemies?.includes(target)){
      hit.lastX=target.x;hit.lastY=target.y;
    }
    const k=Math.min(1,phase/.69),settle=k*k*(3-2*k);
    const x=hit.x+(hit.lastX-hit.x)*settle,y=hit.y+(hit.lastY-hit.y)*settle;
    if(!hit.edge || hit.edgeAngle!==angle){hit.edge=this.enemyEdge(target,angle);hit.edgeAngle=angle}
    const edge=hit.edge;
    return {x:x*T-cam.x+edge.x,y:y*T-cam.y+edge.y};
  },
  trackTravel(){
    for(const event of this.events){
      if(event.art?.live && event.art.body===G && event.art.tracking){
        event.art.end={x:G.x,y:G.y};
        if(Combat10.iaiTime<=0)event.art.tracking=false;
      }
    }
  },
  draw(){
    this.sync();
    for(const event of this.events){
      // A successful counter consumes the stance early; the contact takes its place.
      if(event.art?.guard && (G.active!==event.art.guard ||
        (event.art.guard==='katana'?Combat10.guard:C3.percussionGuard)<=0))continue;
      const elapsed=Math.max(0,this.clock-event.start);
      this.drawV3(event,Math.min(.99999,elapsed/event.duration));
    }
  },
  drawProjectile(shot){
    const hero=shot.arrow?'alt':'ryuchi',a=Math.atan2(shot.vy,shot.vx),f=this.v3Reduced()?3:2+Math.floor(this.clock*15)%3;
    // Place the compact core at the authoritative projectile point, never a
    // stretched contour along the whole flight. No shot fields are changed.
    if(!this.v3Stamp(hero,3,f,shot.x*T-cam.x,shot.y*T-cam.y,shot.piercing?62:54,26,a,.98)){
      ctx.save();ctx.fillStyle=shot.arrow?'#d9c69d':'#c7dce4';ctx.fillRect(Math.round(shot.x*T-cam.x)-2,Math.round(shot.y*T-cam.y)-1,4,2);ctx.restore();
    }
    this.v3Stats.projectiles++;return true;
  },
  cast(hero,action,seat,body,capture){
    const index=this.heroes.indexOf(hero);
    if(index<0)return;
    const actor=seat===0?G:C3.coop;
    const direction=seat===0?combatDirection10():C3.coopVector();
    const combo=hero==='synth'&&seat===0?C3.synthWave:body.combo;
    const stage=Math.max(0,Math.min(2,(combo||1)-1));
    const row=action===0 && this.combos[hero]?this.combos[hero][stage]:index*4+action;
    // Only orient directional marks. Floor rings and emblems stay upright.
    const radial=action>0 && (
      ['franco','percussion','synth'].includes(hero) ||
      (action===3 && ['ryuchi','alt'].includes(hero))
    );
    let duration=action===0?Math.min(.26,Math.max(.15,body.cool||.2)):[0,.32,.36,.52][action];
    const sword=hero==='ryuchi' && action===0 && stage===0;
    const clip=action===0?stage:action+2;
    const art=this.v3Sources[hero]?{hero,clip,gesture:'strike',anchor:action===0?actor:null}:null;
    if(art){
      if(action===0)art.gesture=({franco:'pluck',ryuchi:'blade',katana:'thrust',synth:'strike',percussion:'thrust'})[hero];
      if(action>0 && ['franco','percussion'].includes(hero))art.gesture='pulse';
      if(hero==='franco' && action===3){art.gesture='bass';art.hits=capture?.hits||[]}
      if(art.gesture==='pulse')art.floor=true;
      if(hero==='synth' && action===3)art.gesture='cable';
      if(seat===0 && ((hero==='katana' && action===2) || (hero==='percussion' && action===1))){
        art.guard=hero;
        duration=hero==='katana'?Combat10.guard:C3.percussionGuard;
      }
      if(action===1 && hero==='katana' && seat===0){
        Object.assign(art,{gesture:'path',live:true,tracking:true,body:G,end:{x:actor.x,y:actor.y}});
      }else if(action===2 && hero==='ryuchi' && seat===0){
        Object.assign(art,{gesture:'path',end:{x:actor.x,y:actor.y}});
      }
    }
    // Field releases and multi-hit moves deliberately separate the smaller
    // instrument accent from the larger effect emitted where a pulse resolves.
    const accent=seat===0 && ((hero==='synth' && (action===1||action===2)) || (hero==='percussion' && action>=2));
    if(art)art.accent=accent;
    const size=accent?.57:[1,1.12,1.24,1.52][action];
    const origin=art?.gesture==='path' && capture?capture:actor;
    const facing=art?direction:(radial?[1,0]:direction);
    const offset=!art && sword ? .48 : 0;
    const yOffset=art?.floor?-2:accent?-25:action===0?-23:-17;
    // Contacts are emitted only when hitEnemy actually took HP from a target.
    // Cap sparks, never damage, in a crowded wave.
    if(art && capture && (action===0 || (action===2 && hero==='ryuchi'))){
      for(const hit of capture.hits.slice(0,3)){
        const edgeCue=clip>0 && (hero==='katana' || (clip===2 && ['synth','percussion'].includes(hero)));
        this.emit(row,hit.x,hit.y,direction,edgeCue?.22:.15,.68,false,-17,
          {hero,clip,gesture:'impact',startPhase:.5,edgeHit:edgeCue?hit:null});
      }
    }
    this.emit(row,origin.x+offset*direction[0],origin.y+offset*direction[1],facing,duration,size,sword,yOffset,art);
  },

  follower(hero,ally,target){
    const row=this.heroes.indexOf(hero)*4;
    if(row<0 || !ally || !target)return;
    const art=this.v3Sources[hero]?{hero,clip:0,gesture:hero==='ryuchi'?'blade':'strike'}:null;
    this.emit(row,ally.x,ally.y,[target.x-ally.x,target.y-ally.y],.2,.78,hero==='ryuchi',-22,art);
  },
  accepted(previous,seat,key,action){
    return function(...args){
      const hero=seat===0?G?.active:C3.coopMember();
      const actor=seat===0?G:C3.coop;
      const body=seat===0?act:C3.coop;
      const before=body[key]||0;
      const last=HeroAttackFX.capture;
      const captured={hero,action,game:G,area:G?.area,x:actor?.x,y:actor?.y,hits:[]};
      HeroAttackFX.capture=captured;
      let result;
      try{
        const perform=()=>previous.apply(this,args);
        result=typeof HeroLegacyFX==='undefined'?perform():HeroLegacyFX.withActor(hero,perform);
      }finally{HeroAttackFX.capture=last}
      if((body[key]||0)>before && G===captured.game && G?.area===captured.area)HeroAttackFX.cast(hero,action,seat,body,captured);
      return result;
    };
  }
};
attackAction=HeroAttackFX.accepted(attackAction,0,'cool',0);
skillAction=HeroAttackFX.accepted(skillAction,0,'skill',1);
advancedSkill=HeroAttackFX.accepted(advancedSkill,0,'skillX',2);
duoAction=HeroAttackFX.accepted(duoAction,0,'duo',3);
C3.coopAttack=HeroAttackFX.accepted(C3.coopAttack,1,'cool',0);
C3.coopSkill=HeroAttackFX.accepted(C3.coopSkill,1,'skill',1);
C3.coopAdvanced=HeroAttackFX.accepted(C3.coopAdvanced,1,'advanced',2);
C3.coopSignature=HeroAttackFX.accepted(C3.coopSignature,1,'signature',3);

const heroImpactBase=hitEnemy;
hitEnemy=function(enemy,...args){
  const before=enemy?.hp,x=enemy?.x,y=enemy?.y,capture=HeroAttackFX.capture,source=HeroAttackFX.externalSource||capture?.hero;
  const result=source?HeroLegacyFX.withActor(source,()=>heroImpactBase.apply(this,arguments)):heroImpactBase.apply(this,arguments);
  if(capture && (capture.hits.length<3 || (capture.hero==='franco' && capture.action===3)) && Number.isFinite(before) && enemy.hp<before){
    capture.hits.push({x,y,target:enemy,lastX:enemy.x,lastY:enemy.y});
  }else if(!capture&&HeroAttackFX.v3Sources[source]&&Number.isFinite(before)&&enemy.hp<before){
    // Source is supplied only at the original projectile/follower/pad call.
    // Unknown/ambient callers retain their prior artwork and never borrow G.active.
    HeroAttackFX.emit(HeroAttackFX.heroes.indexOf(source)*4,x,y,[1,0],.16,.6,false,-17,
      {hero:source,clip:['alt','ryuchi','synth'].includes(source)?3:0,gesture:'impact',startPhase:.38,sourceContact:true});
  }
  return result;
};
const heroIaiStep=tickMotion10;
tickMotion10=function(dt){
  if(Combat10.iaiTime<=0 || G?.active!=='katana')return heroIaiStep.apply(this,arguments);
  // Only this branch of the movement routine resolves iai hits. Projectiles and AI
  // resolve outside it, so their damage cannot create an ink mark for the sword.
  const last=HeroAttackFX.capture,stroke={hero:'katana',action:1,hits:[]};
  HeroAttackFX.capture=stroke;
  try{return heroIaiStep.apply(this,arguments)}
  finally{
    HeroAttackFX.capture=last;
    for(const hit of stroke.hits){
      HeroAttackFX.emit(13,hit.x,hit.y,Combat10.iaiDir,.17,.72,false,-17,
        {hero:'katana',clip:3,gesture:'impact',startPhase:.40});
    }
  }
};
const heroEffectBase=effect10;
effect10=function(type,x,y,direction,duration,size,...rest){
  const result=heroEffectBase.apply(this,arguments);
  const rows={counter:34,drumBreak:39,synthFilter:40,synthPad:41};
  const row=type==='drumCounter' && duration<.6?35:rows[type];
  if(row!==undefined){
    const field=type==='synthFilter'||type==='synthPad',drum=type==='drumBreak';
    const hero=field?'synth':type==='counter'?'katana':'percussion';
    const clip=type==='counter'?2:type==='drumCounter'?3:type==='synthPad'?3:(drum && HeroAttackFX.capture?.action===3)?5:4;
    const gesture=field?'field':drum?'pulse':'impact';
    const floorWidth=field||drum?Math.min(111,(size||1)*49):0;
    HeroAttackFX.emit(row,x,y,direction,Math.min(.4,duration),Math.min(1.48,size||1),false,
      field||drum?-3:-19,{hero,clip,gesture,floorWidth,startPhase:gesture==='impact'?.45:0});
  }
  return result;
};
const heroTraceBase=traceSpecial11;
traceSpecial11=function(kind,x,y,ex,ey,color,life){
  const result=heroTraceBase.apply(this,arguments);
  if(kind==='rain')HeroAttackFX.emit(36,x,y,[1,0],.32,1.05,false,-4);
  if(kind==='chain'){
    if(G.active==='synth' && HeroAttackFX.events.filter(e=>e.art?.gesture==='link' && e.start===HeroAttackFX.clock).length>=3)return result;
    const row=G.active==='synth'?19:7;
    HeroAttackFX.emit(row,x,y,[ex-x,ey-y],.32,.63,false,-16,
      {hero:G.active,clip:5,gesture:'link',end:{x:ex,y:ey}});
  }
  return result;
};
const heroFXUpdate=update;
update=function(dt){
  HeroAttackFX.advance(dt);
  const result=heroFXUpdate.apply(this,arguments);
  if(G && (mode==='action'||mode==='walk') && !menuOpen)HeroAttackFX.trackTravel();
  return result;
};
const heroFXLayer=drawCombatLayer;
drawCombatLayer=function(){
  if(!HeroLegacyFX.worldOverlay)HeroAttackFX.draw();
  // Existing warning geometry and actual projectiles stay on top of cast art.
  return heroFXLayer.apply(this,arguments);
};

// Only presentation helpers are replaced; their gameplay records/timers remain.
const legacyHeroReadyV3=HeroLegacyFX.ready;
HeroLegacyFX.ready=function(hero){return Boolean(HeroAttackFX.v3Sources[hero])||legacyHeroReadyV3.call(this,hero)};
drawMusicianFloorCues=function(){
  if(!G)return;for(const z of C3.synthZones)if(z.area===G.area){
    const f=HeroAttackFX.v3Reduced()?1:Math.floor(HeroAttackFX.clock*3+z.phase)%2;
    HeroAttackFX.v3Stamp('synth',3,f,z.x*T-cam.x,z.y*T-cam.y-2,56,28,0,.62);
  }
};
drawSignatureCues=function(){
  if(!G)return;for(const f of Special11.traces)if(f.kind==='mark')
    HeroAttackFX.v3Stamp('alt',5,0,f.x*T-cam.x,f.y*T-cam.y,42,22,0,.6);
};
const ringOwnerBeforeV3=HeroLegacyFX.ringOwner;
HeroLegacyFX.ringOwner=function(kind){
  if(this.actor&&HeroAttackFX.v3Sources[this.actor]&&['hit','dodge'].includes(kind))return this.actor;
  return ringOwnerBeforeV3.call(this,kind);
};

const percussionPulseSourceV3=C3.percussionPulse;
C3.percussionPulse=function(...args){return HeroAttackFX.withSource('percussion',()=>percussionPulseSourceV3.apply(this,args))};
