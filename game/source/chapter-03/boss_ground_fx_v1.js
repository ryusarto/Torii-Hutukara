/* Animated ground textures only. Original contours, collision, damage and attack
 * clocks remain owned by BossChoreographyV2 and the simulation. Load after it.
 * 4x2 atlases: preparation 0..2, release/residue 3..7; all stamps are flat.
 */
'use strict';
const BossGroundFXV1={
  assets:__BOSS_GROUND_FX_ASSETS__,manifest:__BOSS_GROUND_FX_MANIFEST__,images:{},
  clock:0,game:null,area:null,actor:null,effects:[],hazardEvents:new WeakMap(),
  waveEvents:new WeakMap(),legacyEvents:new WeakMap(),contextHazard:null,
  inPass:false,drawn:new Set(),stamps:0,maxStamps:128,
  key(e){return {boss:'pulse',voice_boss:'static',c3_metronome:'scrap',c3_silence:'void'}[e?.id];},
  valid(e=bossActor){return !!this.key(e)&&!BossChoreographyV2.cancelled(e);},
  reset(){
    this.clock=0;this.game=G;this.area=G?.area;this.actor=bossActor;this.effects=[];
    this.hazardEvents=new WeakMap();this.waveEvents=new WeakMap();this.legacyEvents=new WeakMap();
    this.contextHazard=null;this.drawn=new Set();this.stamps=0;
  },
  sync(){
    if(this.game!==G||this.area!==G?.area||this.actor!==bossActor)this.reset();
    if(!this.valid()){
      this.effects=[];this.hazardEvents=new WeakMap();this.waveEvents=new WeakMap();this.legacyEvents=new WeakMap();
      return;
    }
    for(const f of this.effects){
      const active=f.hazard?C3.hazards.includes(f.hazard):f.wave?
        (typeof rings092!=='undefined'&&rings092.includes(f.wave)):this.clock<f.activeUntil;
      if(!active&&f.endedAt===null)f.endedAt=this.clock;
    }
    this.effects=this.effects.filter(f=>f.actor===bossActor&&(f.endedAt===null||this.clock-f.endedAt<.45));
  },
  step(dt){
    this.sync();if(G&&mode==='action')this.clock+=Math.max(0,Number(dt)||0);this.sync();
  },
  image(key){
    const entry=this.manifest.clips?.[key];if(!entry)return null;
    const src=this.assets[entry.atlas]||this.assets[key]||
      (typeof entry.atlas==='string'&&entry.atlas.startsWith('data:')?entry.atlas:null);
    if(!src)return null;
    if(!this.images[key]){const im=new Image();im.src=src;this.images[key]=im;}
    return this.images[key];
  },
  copy(g){return {...g,...(g.points?{points:g.points.map(p=>({x:p.x,y:p.y}))}:{})};},
  event(e,g,extra={}){
    this.sync();if(!this.valid(e))return null;
    const f={actor:e,key:this.key(e),geometry:this.copy(g),at:this.clock,endedAt:null,
      activeUntil:this.clock,life:.45,...extra};
    this.effects.push(f);if(this.effects.length>64)this.effects.shift();return f;
  },
  muzzle(x,y){return {kind:'disk',x,y,r:.65};},
  hazardGeometry(h){
    return h.kind==='chase'||h.kind==='orbit'?this.muzzle(h.x,h.y):BossChoreographyV2.geometry(h);
  },
  legacyGeometry(e,spec){
    if(e.id==='boss'){
      if(spec.kind==='charge')return {kind:'charge',x:spec.x,y:spec.y,points:spec.points||[]};
      return {kind:spec.kind==='ring'?'disk':'sector',x:spec.x,y:spec.y,
        r:spec.kind==='ring'?3.5:4.6,angle:spec.angle,arc:.85};
    }
    if(spec.kind==='lanes')return {kind:'lanes',x:spec.x,y:spec.y};
    if(spec.kind==='feedback')return {kind:'disk',x:spec.x,y:spec.y,r:2.5};
    return this.muzzle(spec.x,spec.y); // volley/double-wave emission, not a new danger zone
  },
  frame(progress,f){
    if(BossChoreographyV2.reduced())return f?5:1;
    return f?Math.min(7,3+Math.floor(Math.max(0,this.clock-f.at)/.09)):
      Math.min(2,Math.floor(Math.max(0,Math.min(1,progress))*3));
  },
  path(g){
    const x=g.x*T-cam.x,y=g.y*T-cam.y;
    ctx.beginPath();
    if(g.kind==='disk'){ctx.arc(x,y,g.r*T,0,Math.PI*2);ctx.closePath();return true;}
    if(g.kind==='sector'){
      ctx.moveTo(x,y);ctx.arc(x,y,g.r*T,g.angle-g.arc,g.angle+g.arc);ctx.closePath();return true;
    }
    if(g.kind==='annulus'||g.kind==='wave'){
      const outer=g.kind==='wave'?g.r+.55:g.r,inner=g.kind==='wave'?Math.max(0,g.r-.55):g.inner;
      ctx.arc(x,y,outer*T,0,Math.PI*2);ctx.closePath();
      ctx.moveTo(x+inner*T,y);ctx.arc(x,y,inner*T,0,Math.PI*2,true);ctx.closePath();return true;
    }
    if(g.kind==='lanes'){
      for(const dx of [-4,0,4])ctx.rect(x+(dx-.8)*T,-cam.y,1.6*T,current.h*T);
      return true;
    }
    if(g.kind==='cross'){
      const l=-cam.x,r=current.w*T-cam.x,t=-cam.y,b=current.h*T-cam.y,w=g.width*T;
      ctx.moveTo(x-w,t);ctx.lineTo(x+w,t);ctx.lineTo(x+w,y-w);ctx.lineTo(r,y-w);
      ctx.lineTo(r,y+w);ctx.lineTo(x+w,y+w);ctx.lineTo(x+w,b);ctx.lineTo(x-w,b);
      ctx.lineTo(x-w,y+w);ctx.lineTo(l,y+w);ctx.lineTo(l,y-w);ctx.lineTo(x-w,y-w);ctx.closePath();return true;
    }
    if(g.kind==='charge'&&g.points?.length){
      for(const p of g.points){const px=p.x*T-cam.x,py=p.y*T-cam.y;
        ctx.moveTo(px+1.15*T,py);ctx.arc(px,py,1.15*T,0,Math.PI*2);ctx.closePath();}
      return true;
    }
    return false;
  },
  bounds(g){
    if(g.kind==='lanes'||g.kind==='cross')return {l:cam.x/T,t:cam.y/T,
      r:(cam.x+(typeof VW==='number'?VW:768))/T,b:(cam.y+(typeof VH==='number'?VH:432))/T};
    if(g.kind==='charge'){
      if(!g.points?.length)return null;
      return {l:Math.min(...g.points.map(p=>p.x))-1.15,r:Math.max(...g.points.map(p=>p.x))+1.15,
        t:Math.min(...g.points.map(p=>p.y))-1.15,b:Math.max(...g.points.map(p=>p.y))+1.15};
    }
    const r=g.r+(g.kind==='wave'?.55:0);
    return {l:g.x-r,r:g.x+r,t:g.y-r,b:g.y+r};
  },
  drawClipped(g,key,frame,alpha){
    const im=this.image(key),cell=this.manifest.cell||256,cols=this.manifest.columns||4;
    if(!im?.complete||im.naturalWidth<cols*cell||im.naturalHeight<2*cell)return false;
    const b=this.bounds(g);if(!b)return false;
    ctx.save();
    try{
      if(!this.path(g))return false;
      ctx.clip('nonzero');ctx.imageSmoothingEnabled=false;ctx.globalAlpha*=alpha;
      ctx.shadowColor='#20171dcc';ctx.shadowBlur=0;ctx.shadowOffsetX=1;ctx.shadowOffsetY=1;
      const sx=(frame%cols)*cell,sy=Math.floor(frame/cols)*cell;
      const stamp=(l,t,w,h)=>{
        if(this.inPass&&this.stamps>=this.maxStamps)return;
        ctx.drawImage(im,sx,sy,cell,cell,l*T-cam.x,t*T-cam.y,w*T,h*T);
        if(this.inPass)this.stamps++;
      };
      if(g.kind==='lanes'||g.kind==='cross'||g.kind==='charge'){
        // Fixed flat stamps, clipped to both geometry and visible viewport.
        const vl=cam.x/T,vt=cam.y/T,vr=(cam.x+(typeof VW==='number'?VW:768))/T,
          vb=(cam.y+(typeof VH==='number'?VH:432))/T,size=3.2;
        const l=Math.max(b.l,vl),r=Math.min(b.r,vr),t=Math.max(b.t,vt),bottom=Math.min(b.b,vb);
        let count=0;
        if(g.kind==='cross'||g.kind==='lanes'){
          const half=size/2,seen=new Set();
          const center=(x,y)=>{
            if(x+half<l||x-half>r||y+half<t||y-half>bottom||count>=this.maxStamps)return;
            const key=x+','+y;if(seen.has(key))return;seen.add(key);
            stamp(x-half,y-half,size,size);count++;
          };
          const vertical=x=>{
            if(x+half<l||x-half>r)return;
            for(let n=Math.ceil((t-half-g.y)/size);n<=Math.floor((bottom+half-g.y)/size)&&count<this.maxStamps;n++)center(x,g.y+n*size);
          };
          if(g.kind==='lanes')for(const dx of [-4,0,4])vertical(g.x+dx);
          else{
            vertical(g.x);
            for(let n=Math.ceil((l-half-g.x)/size);n<=Math.floor((r+half-g.x)/size)&&count<this.maxStamps;n++)center(g.x+n*size,g.y);
          }
        }else{
          for(let yy=Math.floor(t/size)*size;yy<bottom&&count<this.maxStamps;yy+=size){
            for(let xx=Math.floor(l/size)*size;xx<r&&count<this.maxStamps;xx+=size){
              stamp(xx,yy,size,size);count++;
            }
          }
        }
      }else stamp(b.l,b.t,b.r-b.l,b.b-b.t);
      return true;
    }finally{ctx.restore();}
  },
  drawEvent(f,g=f.geometry){
    if(!f||!this.valid(f.actor))return;
    if(this.inPass)this.drawn.add(f);
    const residue=f.endedAt===null?0:Math.max(0,this.clock-f.endedAt);
    const reduced=BossChoreographyV2.reduced();
    const alpha=f.endedAt===null?(reduced?.22:f.key==='void'?.85:.75):
      (reduced?.13:.30)*Math.max(0,1-residue/.45);
    if(alpha>0)this.drawClipped(g,f.key,this.frame(0,f),alpha);
  },
  paint(g,progress,released){
    this.sync();if(!this.valid())return;
    let f=null;
    if(this.contextHazard)f=this.hazardEvents.get(this.contextHazard);
    else if(g.kind==='wave'&&typeof rings092!=='undefined'){
      const wave=rings092.find(w=>w.delay<=0&&w.x===g.x&&w.y===g.y&&w.r===g.r);
      if(wave){
        f=this.waveEvents.get(wave);
        if(!f){f=this.event(bossActor,g,{wave});if(f)this.waveEvents.set(wave,f);}
        if(f)f.geometry=this.copy(g);
      }
    }else if(released){
      const record=BossChoreographyV2.records.get(bossActor),legacy=this.legacyEvents.get(bossActor);
      if(legacy&&record&&legacy.serial===record.serial)f=legacy.effect;
    }
    if(f)this.drawEvent(f,g);
    else if(!released)this.drawClipped(g,this.key(bossActor),this.frame(progress,null),BossChoreographyV2.reduced()?.10:.20);
  }
};
window.BossGroundFXV1=BossGroundFXV1;

const bossGroundUpdateV1=update;
update=function(dt,...rest){
  BossGroundFXV1.step(dt);
  const result=bossGroundUpdateV1.call(this,dt,...rest);BossGroundFXV1.sync();return result;
};

const bossGroundFireV1=C3.fireHazard;
C3.fireHazard=function(h,e,...rest){
  const fresh=h&&!h.fired;
  const result=bossGroundFireV1.call(this,h,e,...rest);
  if(fresh&&h.fired&&BossGroundFXV1.valid(e)){
    const f=BossGroundFXV1.event(e,BossGroundFXV1.hazardGeometry(h),{hazard:h,life:Math.max(0,h.time||0)+.45});
    if(f)BossGroundFXV1.hazardEvents.set(h,f);
  }
  return result;
};
const bossGroundReleaseV1=BossChoreographyV2.release;
BossChoreographyV2.release=function(e,spec,...rest){
  const before=this.records.get(e),wasReleased=before?.released,serial=before?.serial;
  const result=bossGroundReleaseV1.call(this,e,spec,...rest),record=this.records.get(e);
  if((e?.id==='boss'||e?.id==='voice_boss')&&record?.released&&(!wasReleased||record.serial!==serial)){
    const fx=BossGroundFXV1;fx.sync();
    const tail=e.id==='boss'?.24:spec.kind==='lanes'||spec.kind==='feedback'?.20:0;
    const effect=fx.event(e,fx.legacyGeometry(e,spec),{activeUntil:fx.clock+tail,life:tail+.45});
    if(effect)fx.legacyEvents.set(e,{serial:record.serial,effect});
  }
  return result;
};
const bossGroundPaintV1=BossChoreographyV2.paint;
BossChoreographyV2.paint=function(g,progress=0,released=false,...rest){
  const fx=BossGroundFXV1,im=released&&fx.valid()?fx.image(fx.key(bossActor)):null;
  const cell=fx.manifest.cell||256,cols=fx.manifest.columns||4;
  const dim=!!im?.complete&&im.naturalWidth>=cols*cell&&im.naturalHeight>=2*cell;
  let result;
  if(dim){
    ctx.save();ctx.globalAlpha*=.5;
    try{result=bossGroundPaintV1.call(this,g,progress,released,...rest);}finally{ctx.restore();}
  }else result=bossGroundPaintV1.call(this,g,progress,released,...rest);
  BossGroundFXV1.paint(g,progress,released);return result;
};
const bossGroundHazardV1=BossChoreographyV2.drawHazard;
BossChoreographyV2.drawHazard=function(h,...rest){
  const old=BossGroundFXV1.contextHazard;BossGroundFXV1.contextHazard=h;
  try{return bossGroundHazardV1.call(this,h,...rest);}finally{BossGroundFXV1.contextHazard=old;}
};
const bossGroundEmitterV1=BossChoreographyV2.drawEmitter;
BossChoreographyV2.drawEmitter=function(h,...rest){
  const result=bossGroundEmitterV1.call(this,h,...rest),fx=BossGroundFXV1;
  if(fx.valid()){
    const f=fx.hazardEvents.get(h),g=fx.muzzle(h.x,h.y);
    if(f)fx.drawEvent(f,g);
    else if(!h.fired){const span=Math.max(.001,h.max-h.trigger),p=1-Math.max(0,h.time-h.trigger)/span;
      fx.drawClipped(g,fx.key(bossActor),fx.frame(p,null),BossChoreographyV2.reduced()?.10:.20);}
  }
  return result;
};
const bossGroundPassV1=BossChoreographyV2.drawGround;
BossChoreographyV2.drawGround=function(...args){
  const fx=BossGroundFXV1;fx.sync();fx.inPass=true;fx.drawn=new Set();fx.stamps=0;
  try{
    const result=bossGroundPassV1.apply(this,args);fx.sync();
    // Texture-only residue: no filled danger color, border or extra paint callback.
    for(const f of fx.effects)if(!fx.drawn.has(f))fx.drawEvent(f);
    return result;
  }finally{fx.inPass=false;fx.contextHazard=null;}
};
