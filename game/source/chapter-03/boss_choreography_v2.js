/* Boss presentation only. Attack clocks, collision, damage and saves remain owned
 * by the original simulation. Load after all combat/EnemyArtV1 wrappers.
 * Clips: object keyed by boss_cast, boss_charge, voice_boss_cast,
 * c3_metronome_cast, c3_silence_cast; entry {atlas,height} or {atlas,scale}.
 * Eight cells, four columns: 0..3 anticipate (hold 3), 4 releases,
 * 5..7 recover. The actual simulation event, never the atlas, releases damage.
 */
'use strict';
const BossChoreographyV2 = {
  assets: __BOSS_ANIMATION_ASSETS__, manifest: __BOSS_ANIMATION_MANIFEST__,
  images: {}, records: new WeakMap(), emissions: new WeakMap(), walks: new WeakMap(), clock: 0,
  game: null, area: null, actor: null,
  ids: new Set(['boss','voice_boss','c3_metronome','c3_silence']),
  managesLegacyTelegraph(e) { return !!e && this.ids.has(e.id); },
  cancelled(e) { return !G || !e || e !== bossActor || !(e.hp > 0) ||
    (e.id === 'c3_silence' && typeof C3 !== 'undefined' && !!C3.finalPending); },
  reduced() {
    return !!G?.options10?.reducedMotion || (typeof matchMedia === 'function' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches);
  },
  reset() {
    this.records = new WeakMap(); this.emissions = new WeakMap(); this.walks = new WeakMap(); this.clock = 0;
    this.game = G; this.area = G?.area; this.actor = bossActor;
  },
  sync() {
    if (this.game !== G || this.area !== G?.area || this.actor !== bossActor) this.reset();
    if (this.actor && this.cancelled(this.actor)) {
      this.records.delete(this.actor); this.emissions = new WeakMap();
    }
  },
  record(e) {
    this.sync();
    if (!this.records.has(e)) this.records.set(e, {serial:0, released:false, releaseAt:-Infinity, prep:null});
    return this.records.get(e);
  },
  snapshot(e) {
    if (e.id === 'voice_boss') {
      if (e.echoWarning092 > 0) return {kind:'double_wave', x:e.x, y:e.y, remaining:e.echoWarning092};
      if (e.tele09?.time > 0) return {...e.tele09, kind:e.tele09.type, remaining:e.tele09.time};
      return null;
    }
    if (e.id === 'boss' && e.wind > 0) return {
      kind:e.windKind, x:e.x, y:e.y, angle:e.facing,
      dx:e.chargeX, dy:e.chargeY, remaining:e.wind
    };
    return null;
  },
  begin(e, spec) {
    if (this.cancelled(e)) return;
    const r = this.record(e);
    r.serial++; r.released = false; r.releaseAt = -Infinity;
    r.prep = {...spec}; r.total = Math.max(.001,spec.remaining || .001);
  },
  release(e, spec) {
    if (this.cancelled(e)) return;
    const r = this.record(e);
    if (r.released) return;
    r.released = true; r.releaseAt = this.clock;
    r.execution = {...spec};
  },
  pose(e) {
    if (this.cancelled(e)) return null;
    const r = this.record(e);
    if (!r.prep) return null;
    const elapsed = this.clock - r.releaseAt;
    if (r.released) {
      if (elapsed >= .32) return e.recovery121>0 ? {frame:7,spec:r.execution} : null;
      return {frame:this.reduced()?4:Math.min(7,4+Math.floor(elapsed/.08)), spec:r.execution};
    }
    let remaining;
    if (e.id === 'boss' || e.id === 'voice_boss') remaining = this.snapshot(e)?.remaining;
    else {
      // Keep C3 preparation tied to the actual hazard, not e.wind (which ends later).
      const h = r.prep.hazard;
      remaining = h && !h.fired ? h.time-h.trigger : 0;
    }
    if (!(remaining > 0)) return null;
    const progress = Math.max(0,Math.min(1,1-remaining/r.total));
    return {frame:this.reduced()?3:Math.min(3,Math.floor(progress*4)), spec:r.prep};
  },
  observeTravel(e, before) {
    if(e.id!=='boss')return;this.sync();
    const dx=e.x-before.x,dy=e.y-before.y,distance=Math.hypot(dx,dy);
    let r=this.walks.get(e);if(!r){r={phase:0,moving:false,row:0};this.walks.set(e,r)}
    // A charge is instantaneous gameplay travel, not a walking cycle. Stun and
    // attack anticipation own their poses even when a hit displaces the body.
    r.moving=distance>.00001&&distance<.5&&!this.snapshot(e)&&!(e.stun>0);
    if(!r.moving)return;
    const entry=this.manifest.clips?.boss_walk;
    r.phase=(r.phase+distance/(entry?.strideDistance||1.8))%1;
    r.row=Math.abs(dx)>Math.abs(dy)?(dx<0?1:3):(dy<0?2:0);
  },
  walkPose(e) {
    const r=this.walks.get(e);if(!r?.moving||!['action','overlay','dialogue','rhythm'].includes(mode)||this.cancelled(e))return null;
    const frames=this.manifest.clips?.boss_walk?.frames||8;
    return {frame:this.reduced()?0:Math.min(frames-1,Math.floor(r.phase*frames)),row:r.row,walking:true};
  },
  image(key, entry) {
    const src = this.assets[entry.atlas] || this.assets[key] ||
      (typeof entry.atlas === 'string' && entry.atlas.startsWith('data:') ? entry.atlas : null);
    if (!src) return null;
    if (!this.images[key]) { const im = new Image(); im.src = src; this.images[key] = im; }
    return this.images[key];
  },
  drawActor(x,y,kind,e) {
    if (!this.managesLegacyTelegraph(e)) return false;
    let pose = this.pose(e),key;
    if(pose)key=e.id==='boss'&&pose.spec.kind==='charge'?'boss_charge':e.id+'_cast';
    else {pose=this.walkPose(e);key=e.id+'_walk';if(!pose)return false;}
    const entry = this.manifest.clips?.[key]; if (!entry) return false;
    const im = this.image(key,entry), cell = entry.cell || this.manifest.cell || 256, cols = entry.columns || this.manifest.columns || 4;
    if (!im?.complete || im.naturalWidth < cols*cell || im.naturalHeight < (entry.rows||2)*cell) return false;
    const pivot = entry.pivot || this.manifest.pivot || [128,224];
    const scale = Number.isFinite(entry.scale) ? entry.scale : (entry.height || cell)/cell;
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.drawImage(im,(pose.frame%cols)*cell,(pose.row??Math.floor(pose.frame/cols))*cell,cell,cell,
      Math.round(x-pivot[0]*scale),Math.round(y-pivot[1]*scale),cell*scale,cell*scale);
    ctx.restore(); return true;
  },
  previewCharge(e) {
    let x=e.x, y=e.y; const points=[];
    for (let i=0;i<11;i++) {
      const nx=x+e.chargeX*.38, ny=y+e.chargeY*.38;
      if (tileWalkable(current,nx,ny)) { x=nx; y=ny; }
      points.push({x,y});
    }
    return points;
  },
  geometry(h) {
    const p={x:h.x,y:h.y};
    if (h.kind==='ring' || h.kind==='rain') return {...p,kind:'disk',r:h.r};
    if (h.kind==='fan') return {...p,kind:'sector',r:h.r,angle:h.angle,arc:h.arc};
    if (h.kind==='pulse') return {...p,kind:'annulus',r:h.r,inner:h.inner};
    if (h.kind==='cross') return {...p,kind:'cross',width:h.width};
    return {...p,kind:'emitter',pattern:h.kind,phase:h.phase||1};
  },
  contains(g,x,y) {
    const dx=x-g.x,dy=y-g.y,d=Math.hypot(dx,dy);
    if (g.kind==='disk') return d<g.r;
    if (g.kind==='annulus') return d>g.inner && d<g.r;
    if (g.kind==='cross') return Math.abs(dx)<g.width || Math.abs(dy)<g.width;
    if (g.kind==='sector') return d<g.r && Math.abs(Math.atan2(Math.sin(Math.atan2(dy,dx)-g.angle),Math.cos(Math.atan2(dy,dx)-g.angle)))<g.arc;
    if (g.kind==='lanes') return [-4,0,4].some(dx=>Math.abs(x-g.x-dx)<.8);
    if (g.kind==='charge') return g.points.some(p=>Math.hypot(x-p.x,y-p.y)<1.15);
    if (g.kind==='wave') return Math.abs(d-g.r)<.55;
    return false; // Emission glyphs are NOT an area hit.
  },
  paint(g,progress=0,released=false) {
    const x=g.x*T-cam.x,y=g.y*T-cam.y;
    ctx.save();
    ctx.fillStyle=released?'#ffe1a94d':'#a639573d';
    ctx.strokeStyle=released?'#ffe6b4':'#ffc18d'; ctx.lineWidth=released?3:2;
    ctx.beginPath();
    if (g.kind==='disk') ctx.arc(x,y,g.r*T,0,Math.PI*2);
    else if (g.kind==='sector') {ctx.moveTo(x,y);ctx.arc(x,y,g.r*T,g.angle-g.arc,g.angle+g.arc);ctx.closePath();}
    else if (g.kind==='annulus' || g.kind==='wave') {
      const outer=g.kind==='wave'?g.r+.55:g.r,inner=g.kind==='wave'?Math.max(0,g.r-.55):g.inner;
      ctx.arc(x,y,outer*T,0,Math.PI*2);ctx.closePath();
      ctx.moveTo(x+inner*T,y);ctx.arc(x,y,inner*T,0,Math.PI*2,true);ctx.closePath();
    } else if (g.kind==='cross') {
      // One contour for the union: the overlap must not become a darker false hotspot.
      const l=-cam.x,r=current.w*T-cam.x,t=-cam.y,b=current.h*T-cam.y,w=g.width*T;
      ctx.moveTo(x-w,t);ctx.lineTo(x+w,t);ctx.lineTo(x+w,y-w);ctx.lineTo(r,y-w);
      ctx.lineTo(r,y+w);ctx.lineTo(x+w,y+w);ctx.lineTo(x+w,b);ctx.lineTo(x-w,b);
      ctx.lineTo(x-w,y+w);ctx.lineTo(l,y+w);ctx.lineTo(l,y-w);ctx.lineTo(x-w,y-w);ctx.closePath();
    } else if (g.kind==='lanes') {
      for(const dx of [-4,0,4]) ctx.rect(x+(dx-.8)*T,-cam.y,1.6*T,current.h*T);
    } else if (g.kind==='charge') {
      for(const p of g.points) {const px=p.x*T-cam.x,py=p.y*T-cam.y;ctx.moveTo(px+1.15*T,py);ctx.arc(px,py,1.15*T,0,Math.PI*2);}
    }
    ctx.fill('nonzero'); ctx.stroke();
    // Small musical countdown at the center; decoration never resizes the damage footprint.
    if (!released) {
      if(!this.reduced()){
        ctx.beginPath();ctx.lineWidth=3;ctx.strokeStyle='#fff2ce';
        ctx.arc(x,y,6,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.max(0,Math.min(1,progress)));ctx.stroke();
      }
      // A short score of five pips charges once, with no blinking or expanding hit area.
      for(let i=0;i<5;i++){
        ctx.fillStyle=progress>=(i+1)/5?'#fff2ce':'#b68b6d';
        ctx.fillRect(x-10+i*5,y+10,2,3);
      }
    }
    if(g.kind==='charge' && g.points.length>1 && !this.reduced()){
      ctx.strokeStyle=released?'#fff2c9':'#e6c498';ctx.lineWidth=released?3:1.5;
      if(released){
        // Trace the verified simulation samples, never interpolate the boss or damage.
        ctx.beginPath();ctx.moveTo(x,y);
        for(const p of g.points)ctx.lineTo(p.x*T-cam.x,p.y*T-cam.y);
        ctx.stroke();
      }else{
        for(const i of [2,5,8]){
          const p=g.points[i],q=g.points[Math.min(i+1,g.points.length-1)];
          const a=Math.atan2(q.y-p.y,q.x-p.x),px=p.x*T-cam.x,py=p.y*T-cam.y;
          ctx.beginPath();ctx.moveTo(px-Math.cos(a-.65)*6,py-Math.sin(a-.65)*6);
          ctx.lineTo(px,py);ctx.lineTo(px-Math.cos(a+.65)*6,py-Math.sin(a+.65)*6);ctx.stroke();
        }
      }
    }
    ctx.restore();
  },
  drawEmitter(h) {
    const phase=h.phase||1,origin=this.emissions.get(h);
    const aim=origin?.aim ?? Math.atan2(G.y-h.y,G.x-h.x);
    const angles=h.kind==='orbit' ? Array.from({length:12},(_,i)=>i*Math.PI/6+phase*.17) : [-2,-1,0,1,2].map(i=>aim+i*.16);
    ctx.save();ctx.strokeStyle=h.fired?'#ffe7b1':'#dcb77e';ctx.lineWidth=1.5;
    if(!h.fired)ctx.setLineDash([4,5]);
    // Dashed launch guides, not a filled cone/circle. Actual projectile motion stays in hostileShots.
    for(const angle of angles) {
      const length=h.kind==='orbit'?(3.7+phase*.4)*2.8:(4.4+phase*.45)*2.6;
      let end={x:h.x,y:h.y};
      for(let s=.2;s<=length;s+=.2){const x=h.x+Math.cos(angle)*s,y=h.y+Math.sin(angle)*s;if(!tileWalkable(current,x,y))break;end={x,y};}
      ctx.beginPath();ctx.moveTo(h.x*T-cam.x,h.y*T-cam.y);ctx.lineTo(end.x*T-cam.x,end.y*T-cam.y);ctx.stroke();
    }
    ctx.restore();
  },
  drawHazard(h) {
    if (!h || this.cancelled(bossActor)) return;
    if(h.kind==='chase'||h.kind==='orbit') {this.drawEmitter(h);return;}
    const span=Math.max(.001,h.max-h.trigger),progress=1-Math.max(0,h.time-h.trigger)/span;
    this.paint(this.geometry(h),progress,!!h.fired);
  },
  // Called by drawEnv after flat props and before the sorted actor pass.
  // This is the only pass for the managed ground warnings.
  drawGround() {
    this.sync();
    if(this.cancelled(bossActor)||!this.managesLegacyTelegraph(bossActor))return;
    if(bossActor.id==='c3_metronome'||bossActor.id==='c3_silence'){
      for(const h of C3.hazards)this.drawHazard(h);
    }
    this.drawLegacyBossTelegraphs();
  },
  drawLegacyBossTelegraphs() {
    const e=bossActor;if(this.cancelled(e)||!this.managesLegacyTelegraph(e))return;
    const r=this.records.get(e),spec=this.snapshot(e);
    if(e.id==='boss') {
      const s=spec || (r?.released && this.clock-r.releaseAt<.24?r.execution:null);
      if(s) {
        let g;
        if(s.kind==='charge')g={kind:'charge',x:s.x,y:s.y,points:spec?this.previewCharge(e):(s.points||[])};
        else g={kind:s.kind==='ring'?'disk':'sector',x:spec?e.x:s.x,y:spec?e.y:s.y,r:s.kind==='ring'?3.5:4.6,angle:s.angle,arc:.85};
        this.paint(g,r?1-(spec?.remaining||0)/r.total:0,!spec);
      }
    }
    if(e.id==='voice_boss') {
      const s=spec || (r?.released && this.clock-r.releaseAt<.20?r.execution:null);
      if(s?.kind==='lanes'||s?.kind==='feedback')this.paint({kind:s.kind==='lanes'?'lanes':'disk',x:s.x,y:s.y,r:2.5},r?1-(spec?.remaining||0)/r.total:0,!spec);
      if(spec?.kind==='double_wave') {
        // Two ticks announce two emissions. Do not depict a filled radius-2 danger zone.
        const x=e.x*T-cam.x,y=e.y*T-cam.y;ctx.save();ctx.strokeStyle='#ffe1a0';ctx.lineWidth=2;
        const progress=Math.max(0,Math.min(1,1-spec.remaining/(r?.total||1.15)));
        for(let i=0;i<2;i++){
          const px=x+(i?10:-10);ctx.beginPath();ctx.moveTo(px,y-5);ctx.lineTo(px,y+5);ctx.stroke();
          if(!this.reduced()){
            const fill=Math.max(0,Math.min(1,progress*2-i));
            ctx.beginPath();ctx.arc(px,y,7,-Math.PI/2,-Math.PI/2+Math.PI*2*fill);ctx.stroke();
          }
        }ctx.restore();
      }
      if(typeof rings092!=='undefined')for(const wave of rings092)if(wave.delay<=0)this.paint({kind:'wave',x:wave.x,y:wave.y,r:wave.r},1,true);
    }
  }
};
window.BossChoreographyV2=BossChoreographyV2;

const bossChoreographyUpdateV2=update;
update=function(dt,...rest){
  BossChoreographyV2.sync();
  const previousBoss=bossActor;
  const delayedWaves=mode==='action'&&previousBoss?.id==='voice_boss'&&typeof rings092!=='undefined'
    ? rings092.filter(w=>w.delay>0) : [];
  if(G&&mode==='action')BossChoreographyV2.clock+=Math.max(0,Number(dt)||0);
  const result=bossChoreographyUpdateV2.call(this,dt,...rest);
  BossChoreographyV2.sync();
  if(mode==='action'&&previousBoss===bossActor&&!BossChoreographyV2.cancelled(previousBoss)){
    // The delayed ring already belongs to the simulation. Observe its first
    // active update; do not recreate it, change delay, or anticipate its damage.
    const emitted=delayedWaves.find(w=>w.delay<=0&&rings092.includes(w));
    if(emitted){
      const spec={kind:'double_wave',x:emitted.x,y:emitted.y,remaining:.001};
      BossChoreographyV2.begin(previousBoss,spec);BossChoreographyV2.release(previousBoss,spec);
    }
  }
  return result;
};

const bossChoreographyEnemyV2=updateEnemy;
updateEnemy=function(e,dt,isBoss=false,...rest){
  const art=BossChoreographyV2;
  if(!isBoss||!art.managesLegacyTelegraph(e)||art.cancelled(e)||mode!=='action')return bossChoreographyEnemyV2.call(this,e,dt,isBoss,...rest);
  const before=art.snapshot(e),beforePosition={x:e.x,y:e.y};
  if(before&&!art.records.get(e)?.prep)art.begin(e,before);
  const trace=before?.kind==='charge'?art.previewCharge(e):null;
  const existingShots=e.id==='voice_boss'?new Set(hostileShots):null;
  const result=bossChoreographyEnemyV2.call(this,e,dt,isBoss,...rest);
  if(art.cancelled(e)) {art.sync();return result;}
  art.observeTravel(e,beforePosition);
  const after=art.snapshot(e);
  // C3 uses the actual fireHazard hook below; wind reaching zero is deliberately ignored.
  if(e.id==='boss'||e.id==='voice_boss'){
    if(before&&!after){
      const last=trace?.[trace.length-1];
      const points=last&&Math.hypot(last.x-e.x,last.y-e.y)<1e-6?trace:[];
      art.release(e,{...before,points});
    }
    if(after&&(!before||before.kind!==after.kind))art.begin(e,after);
    // Phase-II volley has no wind/tele09. Observe actual emission, without
    // inventing a preparation period or locking a target before the engine does.
    if(existingShots&&!before&&!after&&hostileShots.filter(p=>!existingShots.has(p)).length===3){
      const volley={kind:'volley',x:e.x,y:e.y,remaining:.001};
      art.begin(e,volley);art.release(e,volley);
    }
  }
  return result;
};

const bossChoreographyCastV2=C3.castPattern;
C3.castPattern=function(e,kind,...rest){
  const old=new Set(C3.hazards);
  const result=bossChoreographyCastV2.call(this,e,kind,...rest);
  const h=C3.hazards.find(h=>!old.has(h));
  if(h)BossChoreographyV2.begin(e,{kind:h.kind,x:h.x,y:h.y,hazard:h,remaining:h.time-h.trigger});
  return result;
};
const bossChoreographyFireV2=C3.fireHazard;
C3.fireHazard=function(h,e,...rest){
  const fresh=h&&!h.fired;
  const aim=fresh?Math.atan2(G.y-h.y,G.x-h.x):0;
  const result=bossChoreographyFireV2.call(this,h,e,...rest);
  if(fresh&&h.fired){
    BossChoreographyV2.emissions.set(h,{aim});
    BossChoreographyV2.release(e,{kind:h.kind,x:h.x,y:h.y});
  }
  return result;
};
const bossChoreographyHazardV2=C3.drawHazard;
C3.drawHazard=function(h,...rest){
  // Managed hazards have already been painted below the bodies by drawGround.
  if(BossChoreographyV2.managesLegacyTelegraph(bossActor))return;
  return bossChoreographyHazardV2.call(this,h,...rest);
};

const bossChoreographyActorV2=EnemyArtV1.draw;
EnemyArtV1.draw=function(x,y,kind,e,...rest){
  return BossChoreographyV2.drawActor(x,y,kind,e)||bossChoreographyActorV2.call(this,x,y,kind,e,...rest);
};
