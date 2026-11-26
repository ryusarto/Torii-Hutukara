// Cast sprites complement the existing character poses. Delayed releases come
// from the original combat events, so a cancelled move never creates a hit.
const HeroAttackFX = {
  heroes:['franco','ryuchi','alt','katana','synth','percussion'],
  combos:{franco:[0,24,25],ryuchi:[4,26,27],katana:[12,28,29],synth:[16,30,31],percussion:[20,32,33]},
  v2Sources:__HERO_ATTACK_V2_ATLASES__,
  v2Images:{},capture:null,
  bassSource:__FRANCO_BASS_PULSE__,bass:null,enemyEdges:new Map(),
  atlasSource:__HERO_ATTACK_ATLAS__,
  swordSource:__RYUCHI_SWORD_ATLAS__,
  atlas:null, sword:null, events:[], game:null, area:null, clock:0,
  prepare(){
    if(this.atlas)return;
    this.atlas=new Image();
    this.atlas.src=this.atlasSource;
    this.sword=new Image();
    this.sword.src=this.swordSource;
  },
  ready(hero){
    if(!this.v2Sources[hero])return false;
    if(hero==='franco' && !this.bass){this.bass=new Image();this.bass.src=this.bassSource}
    let image=this.v2Images[hero];
    if(!image){image=new Image();this.v2Images[hero]=image;image.src=this.v2Sources[hero]}
    return image.complete && image.naturalWidth===768 && image.naturalHeight===768;
  },
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
    this.sync();this.prepare();
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
  bassWave(x,y,angle,wave,phase,alpha,contact=0,note=false){
    if(alpha<=0)return;
    const strip=this.bass,atlas=this.v2Images.franco;
    const hasStrip=strip?.complete && strip.naturalWidth===1024 && strip.naturalHeight===48;
    const hasAtlas=atlas?.complete && atlas.naturalWidth===768;
    ctx.save();
    try{
      ctx.translate(x,y);ctx.rotate(angle);
      ctx.globalAlpha*=alpha;ctx.imageSmoothingEnabled=false;
      if(contact>0){
        ctx.beginPath();
        for(let ray=0;ray<3;ray++){
          const a=Math.PI+(ray-1)*.82,r=2+3*(1-contact);
          ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);
          ctx.lineTo(Math.cos(a)*(r+3+4*contact),Math.sin(a)*(r+3+4*contact));
        }
        ctx.strokeStyle='#542a20';ctx.lineWidth=3.1;ctx.stroke();
        ctx.strokeStyle='#fff4c4';ctx.lineWidth=1.5;ctx.stroke();
      }
      if(note && hasAtlas){
        ctx.drawImage(atlas,3*128+87,5*128+31,26,20,-wave*.58,-8-4*phase,9,7);
      }
      // A high-contrast string follows the bitmap phase. Its one-pixel dark edge
      // stays readable against sunlit grass; it never fills the space around it.
      const beat=Math.sin(phase*Math.PI),peak=1.0+1.6*beat;
      ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();
      ctx.moveTo(-wave,0);ctx.lineTo(-wave*.68,0);ctx.lineTo(-wave*.54,-peak);
      ctx.lineTo(-wave*.42,peak*.75);ctx.lineTo(-wave*.28,0);ctx.lineTo(0,0);
      ctx.strokeStyle='#41251c';ctx.lineWidth=3.7;ctx.stroke();
      ctx.strokeStyle='#ffcb74';ctx.lineWidth=2.1;ctx.stroke();
      ctx.strokeStyle='#fff6d3';ctx.lineWidth=1;ctx.stroke();
      const height=Math.max(13,wave*.53);
      if(hasStrip){
        const frame=Math.min(7,Math.floor(phase*8));
        ctx.drawImage(strip,frame*128,0,128,48,-wave,-height/2,wave,height);
      }else if(hasAtlas){
        // The cropped fallback contains only vibrating cord, excluding the peg.
        const c=Math.min(5,Math.floor(phase*6));
        ctx.drawImage(atlas,c*128+39,51,62,26,-wave,-height/2,wave,height);
      }else{
        ctx.strokeStyle='#f3be65';ctx.lineWidth=1.2;
        ctx.beginPath();ctx.moveTo(-wave,0);ctx.lineTo(-wave*.6,0);ctx.lineTo(-wave*.48,-3);
        ctx.lineTo(-wave*.36,2);ctx.lineTo(-wave*.22,0);ctx.lineTo(0,0);ctx.stroke();
      }
    }finally{ctx.restore()}
  },
  drawBass(event,phase){
    const reduced=!!G?.options10?.reducedMotion;
    // Only targets that lost HP can attract the chord. An unsuccessful chord
    // only vibrates close to the instrument. The animation never tests collision.
    const originX=event.x*T-cam.x,originY=event.y*T-cam.y+event.yOffset;
    const hits=event.art.hits,length=hits.length||1;
    for(let i=0;i<length;i++){
      const end=hits[i];
      const bearing=end?Math.atan2(end.y-event.y,end.x-event.x):event.angle;
      // Aim at the facing edge of the real hurt sprite rather than its feet/pivot.
      const point=end?this.contactPoint(end,bearing+Math.PI,phase):null;
      const dx=point?point.x-originX:Math.cos(event.angle)*39;
      const dy=point?point.y-originY:Math.sin(event.angle)*39;
      const distance=Math.max(.1,Math.hypot(dx,dy)),angle=Math.atan2(dy,dx);
      const ux=dx/distance,uy=dy/distance;
      const hand=Math.min(17,distance*.35),opacity=Math.max(.65,1-i*.045);
      if(reduced){
        // Two stationary cues crossfade. The first stays at the strings and the
        // second, when present, stays at the confirmed target throughout contact.
        const attack=end?Math.max(0,1-phase*1.7):1-phase;
        if(i===0)this.bassWave(originX+ux*(hand+8),originY+uy*(hand+8),angle,15,.36,attack*.84);
        const arrival=Math.min(1,Math.max(0,(phase-.32)/.33),(1-phase)/.18);
        if(end && arrival>0)this.bassWave(originX+dx,originY+dy,angle,15,.65,arrival*opacity*.9,.72);
        continue;
      }
      const delay=Math.min(.17,i*.038);
      if(phase<delay)continue;
      const t=Math.min(1,(phase-delay)/(1-delay));
      const surge=Math.min(1,Math.max(0,(t-.015)/.68));
      const travel=surge*surge*(3-2*surge);
      const recoil=t<.22?3*Math.sin(Math.PI*t/.22):0;
      const front=hand+(distance-hand)*travel-recoil;
      const wave=Math.max(10,Math.min(35,front-hand+16,18+17*Math.sin(Math.PI*t)));
      const alpha=Math.min(.97,.78+t*3,(1-t)*6)*opacity;
      const contact=end && t>=.66?Math.max(0,1-(t-.66)/.34):0;
      this.bassWave(originX+ux*front,originY+uy*front,angle,wave,t,alpha,contact,t>.29 && t<.79);
    }
    return true;
  },
  drawV2(event,phase){
    const {art}=event,hero=art.hero,clip=art.clip;
    if(art.gesture==='bass')return this.drawBass(event,phase);
    if(!this.ready(hero))return false;
    const image=this.v2Images[hero],reduced=!!G?.options10?.reducedMotion;
    const t=reduced?.45:phase, eased=1-(1-t)*(1-t);
    const gesture=art.gesture || 'strike';
    const isImpact=gesture==='impact';
    const forward=clip<3 || (hero==='ryuchi' && clip!==5) || (hero==='katana' && clip!==4);
    const groundRadius=art.floorWidth || 0;
    const ground=!!(groundRadius || art.floor);
    let width=Math.min(ground?80:84,groundRadius || (isImpact?23:clip<3?49:clip===5?58:51)*event.scale);
    let height=ground?width*.36:width;
    let angle=forward?event.angle:0;
    let reach=0,across=0;
    const body=art.anchor;
    const attached=body && (body===G?G.active:C3.coop.member)===hero;
    let x=(attached?body.x:event.x)*T-cam.x, y=(attached?body.y:event.y)*T-cam.y+event.yOffset;
    let sx=1,sy=1;
    const direction=event.angle;
    const dx=Math.cos(direction),dy=Math.sin(direction);
    if(gesture==='cable'){
      // Launch the cable from the keys towards the field and keep the torso readable.
      angle=direction;reach=12+12*eased;width=41+.17*41*eased;height=32;
    }else if(gesture==='blade'){
      // Wielding hand is the rotation centre. Returning swings take the opposite arc.
      const sign=clip===1?-1:1;
      angle+=clip===2?0:sign*(-.85+1.40*eased);
      reach=5+6*eased;
    }else if(gesture==='pluck'){
      reach=5+7*eased;across=Math.sin(t*Math.PI*3)*2*(1-t);
      sy=.80+.20*Math.sin(t*Math.PI);
    }else if(gesture==='thrust'){
      reach=7+9*eased;
    }else if(gesture==='field'){
      const closing=clip===4;
      sx=sy=closing?1.10-.42*eased:.70+.30*eased;
    }else if(gesture==='pulse'){
      sx=sy=.62+.38*eased;
    }else if(gesture==='path' && art.end){
      // Ryuchi changes position in the accepted action; the ink of Katana's iai
      // follows positions sampled after actual movement in update, including walls.
      const travel=art.live?1:eased;
      x+=(art.end.x-event.x)*T*travel;y+=(art.end.y-event.y)*T*travel;
    }else if(gesture==='link' && art.end){
      const length=Math.hypot(art.end.x-event.x,art.end.y-event.y)*T;
      if(hero==='synth'){
        // Render along the confirmed connection, with a clear gap around the keys.
        // The travelling end stops at the target even when it is close to the player.
        angle=direction;const gap=Math.min(17,length*.35);
        const front=gap+(length-gap)*eased;
        width=Math.max(1,Math.min(64,front-gap));height=Math.min(30,Math.max(8,width*.55));
        reach=front-width;
      }else{
        x+=(art.end.x-event.x)*T*eased;y+=(art.end.y-event.y)*T*eased;
      }
    }else if(!isImpact && forward){
      reach=7;
    }
    x+=dx*reach-dy*across;y+=dy*reach+dx*across;
    if(art.edgeHit){
      // The upper/outward side stays visible when two fighters overlap the near shoulder.
      const side=direction+(dy>.4?-.67:.67)*(dx>=0?-1:1);
      const contact=this.contactPoint(art.edgeHit,side);
      x=contact.x;y=contact.y;
      angle=direction+(clip===1?-.70:.50);
      width=clip===1?23:28;height=hero==='percussion'?14:12;
    }
    const frame=Math.min(5,Math.floor((art.startPhase||0)*6+t*(1-(art.startPhase||0))*6));
    const directedCable=gesture==='cable' || (gesture==='link' && hero==='synth');
    const pivot=(forward || directedCable) && !isImpact?7:64;
    const draw=(px,py,rotation,alpha,frameIndex)=>{
      ctx.save();
      try{
        ctx.globalAlpha*=alpha;
        ctx.translate(Math.round(px),Math.round(py));ctx.rotate(rotation);ctx.scale(sx,sy);
        ctx.imageSmoothingEnabled=false;
        if(art.edgeHit){
          // Two tapered slivers amplify the authored motif at native pixel size.
          const tone=hero==='katana'?'#f1d3f7':hero==='synth'?'#9cf5d7':'#ffcd8d';
          const bend=hero==='synth'?3:hero==='percussion'?-3:1;
          ctx.beginPath();ctx.moveTo(-width*.40,2);ctx.lineTo(0,bend);ctx.lineTo(width*.40,-2);
          if(clip===2){ctx.moveTo(width*.02,4);ctx.lineTo(width*.36,2)}
          ctx.strokeStyle='#37283a';ctx.lineWidth=3.1;ctx.stroke();
          ctx.strokeStyle=tone;ctx.lineWidth=1.45;ctx.stroke();
        }
        if(isImpact){
          // A small detail from the authored contact, centred exactly on the struck target.
          ctx.drawImage(image,frameIndex*128+44,clip*128+44,48,40,-width/2,-height/2,width,height);
        }else if(hero==='percussion' && ground){
          // Project the animated drum skin onto the ground without its rim/stand.
          ctx.drawImage(image,frameIndex*128+33,clip*128+38,59,53,-width/2,-height/2,width,height);
        }else{
          ctx.drawImage(image,frameIndex*128,clip*128,128,128,-width*pivot/128,-height/2,width,height);
        }
      }finally{ctx.restore()}
    };
    if(hero==='katana' && gesture==='path' && !reduced && t>.35 && art.end){
      const gap=Math.min(20,Math.hypot(art.end.x-event.x,art.end.y-event.y)*T*.5);
      if(gap>1)draw(x-dx*gap,y-dy*gap,angle,.30*(1-t),Math.max(0,frame-2));
    }
    const alpha=Math.min(ground?.64:isImpact?.88:.91,(1-t)*2.8+.06);
    draw(x,y,angle,alpha,frame);
    return true;
  },
  trackTravel(){
    for(const event of this.events){
      if(event.art?.live && event.art.body===G && event.art.tracking){
        event.art.end={x:G.x,y:G.y};
        if(Combat10.iaiTime<=0)event.art.tracking=false;
      }
    }
  },
  drawCell(row,frame,x,y,angle,scale,sword=false){
    const blade=sword && this.sword?.complete && this.sword.naturalWidth>0;
    const image=blade?this.sword:this.atlas;
    if(!image?.complete || !image.naturalWidth)return false;
    const cell=blade?128:96;
    const col=blade?Math.min(3,Math.floor(frame*.4)):Math.floor(row/24)*10+frame;
    const sy=blade?0:row%24*cell;
    const size=blade?83*scale:cell*scale;
    ctx.save();
    ctx.translate(Math.round(x),Math.round(y));ctx.rotate(angle);
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(image,col*cell,sy,cell,cell,-size/2,-size/2,size,size);
    ctx.restore();
    return true;
  },
  draw(){
    this.sync();
    for(const event of this.events){
      // A successful counter consumes the stance early; the contact takes its place.
      if(event.art?.guard && (G.active!==event.art.guard ||
        (event.art.guard==='katana'?Combat10.guard:C3.percussionGuard)<=0))continue;
      const elapsed=Math.max(0,this.clock-event.start);
      if(event.art && this.drawV2(event,Math.min(.99999,elapsed/event.duration)))continue;
      const frame=G.options10?.reducedMotion?4:Math.min(9,Math.floor(elapsed/event.duration*10));
      this.drawCell(event.row,frame,event.x*T-cam.x,event.y*T-cam.y+event.yOffset,event.angle,event.scale,event.sword);
    }
  },
  drawProjectile(shot){
    this.prepare();
    if(!shot.arrow && this.ready('ryuchi')){
      // Isolate the centre blade of the three-way release for each real shot.
      const frame=G?.options10?.reducedMotion?2:1+Math.floor(this.clock*18)%3;
      ctx.save();
      try{
        ctx.translate(Math.round(shot.x*T-cam.x),Math.round(shot.y*T-cam.y));
        ctx.rotate(Math.atan2(shot.vy,shot.vx));ctx.imageSmoothingEnabled=false;
        ctx.drawImage(this.v2Images.ryuchi,frame*128+39,3*128+57,65,14,-13,-3,26,6);
      }finally{ctx.restore()}
      return true;
    }
    const frame=G?.options10?.reducedMotion?4:Math.floor(this.clock*20)%10;
    // Both arrow10 and the coop archer mark arrow. The only other allied
    // projectile factory is Ryuchi's three-way skill in the base game.
    return this.drawCell(shot.arrow?37:38,frame,shot.x*T-cam.x,shot.y*T-cam.y,Math.atan2(shot.vy,shot.vx),shot.piercing?1.22:1);
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
    const art=this.v2Sources[hero]?{hero,clip,gesture:'strike',anchor:action===0?actor:null}:null;
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
    const art=this.v2Sources[hero]?{hero,clip:0,gesture:hero==='ryuchi'?'blade':'strike'}:null;
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
  const before=enemy?.hp,x=enemy?.x,y=enemy?.y;
  const result=heroImpactBase.apply(this,arguments);
  const capture=HeroAttackFX.capture;
  if(capture && (capture.hits.length<3 || (capture.hero==='franco' && capture.action===3)) && Number.isFinite(before) && enemy.hp<before){
    capture.hits.push({x,y,target:enemy,lastX:enemy.x,lastY:enemy.y});
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
