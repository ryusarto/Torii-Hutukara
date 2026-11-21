// Cast sprites complement the existing character poses. Delayed releases come
// from the original combat events, so a cancelled move never creates a hit.
const HeroAttackFX = {
  heroes:['franco','ryuchi','alt','katana','synth','percussion'],
  combos:{franco:[0,24,25],ryuchi:[4,26,27],katana:[12,28,29],synth:[16,30,31],percussion:[20,32,33]},
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
  sync(){
    if(this.game===G && this.area===G?.area)return;
    this.game=G;this.area=G?.area;this.events.length=0;this.clock=0;
  },
  advance(dt){
    this.sync();
    if(!G || (mode!=='walk' && mode!=='action') || menuOpen || !Number.isFinite(dt) || dt<=0)return;
    this.clock+=dt;
    for(let i=this.events.length-1;i>=0;i--){
      const event=this.events[i];
      if(this.clock-event.start>=event.duration)this.events.splice(i,1);
    }
  },
  emit(row,x,y,direction,duration,scale=1,sword=false,yOffset=-15){
    if(!G || !Number.isFinite(x) || !Number.isFinite(y))return;
    this.sync();this.prepare();
    if(this.events.length>=24)this.events.shift();
    this.events.push({row,x,y,angle:Math.atan2(direction[1],direction[0]),start:this.clock,duration,scale,sword,yOffset});
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
      const elapsed=Math.max(0,this.clock-event.start);
      const frame=G.options10?.reducedMotion?4:Math.min(9,Math.floor(elapsed/event.duration*10));
      this.drawCell(event.row,frame,event.x*T-cam.x,event.y*T-cam.y+event.yOffset,event.angle,event.scale,event.sword);
    }
  },
  drawProjectile(shot){
    this.prepare();
    const frame=G?.options10?.reducedMotion?4:Math.floor(this.clock*20)%10;
    // Both arrow10 and the coop archer mark arrow. The only other allied
    // projectile factory is Ryuchi's three-way skill in the base game.
    return this.drawCell(shot.arrow?37:38,frame,shot.x*T-cam.x,shot.y*T-cam.y,Math.atan2(shot.vy,shot.vx),shot.piercing?1.22:1);
  },
  cast(hero,action,seat,body){
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
    const duration=action===0?Math.min(.26,Math.max(.15,body.cool||.2)):[0,.32,.36,.52][action];
    const sword=hero==='ryuchi' && action===0 && stage===0;
    const facing=radial?[1,0]:direction;
    const offset=sword ? .48 : 0;
    this.emit(row,actor.x+offset*direction[0],actor.y+offset*direction[1],facing,duration,[1,1.12,1.24,1.52][action],sword);
  },
  follower(hero,ally,target){
    const row=this.heroes.indexOf(hero)*4;
    if(row<0 || !ally || !target)return;
    this.emit(row,ally.x,ally.y,[target.x-ally.x,target.y-ally.y],.2,.78,hero==='ryuchi');
  },
  accepted(previous,seat,key,action){
    return function(...args){
      const hero=seat===0?G?.active:C3.coop.member;
      const body=seat===0?act:C3.coop;
      const before=body[key]||0;
      const result=previous.apply(this,args);
      if((body[key]||0)>before)HeroAttackFX.cast(seat===0?hero:C3.coop.member,action,seat,body);
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

const heroEffectBase=effect10;
effect10=function(type,x,y,direction,duration,size,...rest){
  const result=heroEffectBase.apply(this,arguments);
  const rows={counter:34,drumBreak:39,synthFilter:40,synthPad:41};
  const row=type==='drumCounter' && duration<.6?35:rows[type];
  if(row!==undefined)HeroAttackFX.emit(row,x,y,direction,Math.min(.4,duration),Math.min(1.48,size||1));
  return result;
};
const heroTraceBase=traceSpecial11;
traceSpecial11=function(kind,x,y,ex,ey,color,life){
  const result=heroTraceBase.apply(this,arguments);
  if(kind==='rain')HeroAttackFX.emit(36,x,y,[1,0],.32,1.05,false,-4);
  if(kind==='chain'){
    const row=G.active==='synth'?19:7;
    HeroAttackFX.emit(row,ex,ey,[ex-x,ey-y],.32,.68);
  }
  return result;
};
const heroFXUpdate=update;
update=function(dt){HeroAttackFX.advance(dt);return heroFXUpdate.apply(this,arguments)};
const heroFXLayer=drawCombatLayer;
drawCombatLayer=function(){
  HeroAttackFX.draw();
  // Existing warning geometry and actual projectiles stay on top of cast art.
  return heroFXLayer.apply(this,arguments);
};
