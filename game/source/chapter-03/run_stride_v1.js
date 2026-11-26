// Directional running sheets. Every frame represents a physical phase of a two-step cycle.
// Read simulation positions after movement resolution so walls and pauses cannot advance the feet.
'use strict';
const RunStrideV1 = (() => {
  const assets = __RUN_STRIDE_ASSETS__;
  const manifest = __RUN_STRIDE_MANIFEST__;
  const directions = ['down', 'left', 'up', 'right'];
  const sheets = new Map();
  const states = new Map();
  const split = __ARCHER_SPLIT_MANIFEST__;
  const layerCache = new Map();
  let currentGame, currentArea;

  function resetWorld() {
    if (G === currentGame && G?.area === currentArea) return;
    currentGame = G;
    currentArea = G?.area;
    states.clear();
  }
  function memberPositions() {
    if (!G) return [];
    const positions = [{hero:G.active, seat:0, body:G}];
    const coop = C3.coopActive();
    const partner = coop && C3.coopMember();
    const following = partyMembers().filter(hero => hero !== G.active);
    for (let i = 0; i < following.length; i++) {
      const hero = following[i];
      positions.push({hero, seat:hero === partner ? 1 : -1, body:hero === partner ? C3.coop : getFollower(i)});
    }
    return positions;
  }
  function capture() {
    resetWorld();
    if (!G || !activeModes10()) return null;
    return {
      game:G, area:G.area,
      members:new Map(memberPositions().map(({hero,seat,body}) => [hero,{seat,x:body.x,y:body.y,
        ready:seat!==1 || (C3.coop.game===G && C3.coop.area===G.area && Input121.wasCoop)}]))
    };
  }
  function movementDirection(dx,dy,previous,facing) {
    const ax=Math.abs(dx),ay=Math.abs(dy),tolerance=Math.max(ax,ay)*.08;
    if(ax>ay+tolerance)return dx<0?'left':'right';
    if(ay>ax+tolerance)return dy<0?'up':'down';
    // Equal diagonal deltas differ by floating-point noise. Keep the current
    // valid facing until one real axis dominates, including when a wall slides.
    const agrees=dir=>(dir==='left'&&dx<0)||(dir==='right'&&dx>0)||(dir==='up'&&dy<0)||(dir==='down'&&dy>0);
    if(agrees(previous))return previous;
    if(agrees(facing))return facing;
    return dy<0?'up':'down';
  }
  function advance(before) {
    resetWorld();
    if (!before || before.game !== G || before.area !== G?.area || !activeModes10()) return;
    const present = new Set();
    for (const {hero,seat,body} of memberPositions()) {
      const config = manifest.heroes[hero];
      if (!config) continue;
      present.add(hero);
      const old = before.members.get(hero);
      // A newly connected/loaded P2 is placed by input sync after capture. That
      // root reposition is not a footstep, even when it is shorter than a tile.
      const distance = old?.seat === seat && old.ready ? Math.hypot(body.x-old.x,body.y-old.y) : 0;
      let state = states.get(hero);
      if (!state || state.seat !== seat) {
        state = {seat,phase:0,lastPose:null};
        states.set(hero,state);
      }
      state.x = body.x;
      state.y = body.y;
      // Ignore a warp, co-op tether snap, or a dash. None is a running step.
      state.moving = distance > .00001 && distance < 1.3;
      const rolling = seat === 0 ? Combat10.dashTime > 0 || Combat10.iaiTime > 0 : seat === 1 && C3.coop.dash > 0;
      if (state.moving && !rolling) {
        const dx=body.x-old.x,dy=body.y-old.y;
        state.moveDir = movementDirection(dx,dy,state.moveDir,body.dir || G.dir);
        const running = seat===1 ? C3.coop.running : G.isRunning10;
        const cycle = running ? (config.strideDistance || 3.172) : 8 / 3.6;
        state.phase = (state.phase + distance / cycle) % 1;
        // The opening walk and lazy run fallback must use this exact spatial
        // phase too. Actions keep their own records and never restart a step.
        if(seat>=0 && ProtagonistArtV5.supports(hero)){
          const motion=ProtagonistArtV5.locomotion[seat];
          if(motion?.hero===hero)motion.phase=state.phase;
        }
      }
    }
    for (const hero of states.keys()) if (!present.has(hero)) states.delete(hero);
  }
  // The authored unmasked Ryuchi sheet retained a pale generation matte in
  // semi-transparent edge RGB. Undo only that neutral fringe at decode time:
  // silhouette alpha, opaque art, and all four masked rows stay byte-identical.
  // This is deliberately not a global white-key (the cap/coat have pale details).
  function removeRyuchiEdgeMatte(canvas, meta) {
    if (meta.rows !== 8) return 0;
    const q = canvas.getContext('2d'), pixels = q.getImageData(0,0,canvas.width,canvas.height);
    const data = pixels.data, width = canvas.width, height = 4 * (canvas.height / meta.rows);
    let changed = 0;
    for (let y=0;y<height;y++) for (let x=0;x<width;x++) {
      const i=(y*width+x)*4, a=data[i+3], r=data[i], g=data[i+1], b=data[i+2];
      if (!a || a>=230 || Math.min(r,g,b)<=75 || Math.max(r,g,b)-Math.min(r,g,b)>35) continue;
      let fringe=false;
      for (let yy=Math.max(0,y-2);yy<Math.min(height,y+3)&&!fringe;yy++)
        for (let xx=Math.max(0,x-2);xx<Math.min(width,x+3);xx++)
          if (!data[(yy*width+xx)*4+3]) {fringe=true;break;}
      if (!fringe) continue;
      for (let c=0;c<3;c++) data[i+c]=Math.max(0,Math.min(255,Math.round((data[i+c]*255-(255-a)*255)/a)));
      changed++;
    }
    q.putImageData(pixels,0,0);
    return changed;
  }
  function image(hero) {
    if (sheets.has(hero)) return sheets.get(hero);
    const meta = manifest.heroes[hero];
    const record = {bitmap:null,cell:Math.round(meta.cell*(meta.scale || 88/256))};
    sheets.set(hero,record);
    // Keep only display-sized decoded pixels while the game is running. Even a
    // six-member party never needs to retain six full-resolution 4K sheets.
    record.ready = new Promise(resolve => {
      const original = new Image();
      original.onload = () => {
        if (original.naturalWidth !== meta.cell*meta.frames || original.naturalHeight !== meta.cell*meta.rows) {
          record.failed = true;
          resolve(false);
          return;
        }
        const canvas = document.createElement('canvas');
        canvas.width = record.cell*meta.frames;
        canvas.height = record.cell*meta.rows;
        const q = canvas.getContext('2d');
        if (!q) { record.failed = true; resolve(false); return; }
        q.imageSmoothingEnabled = false;
        q.drawImage(original,0,0,canvas.width,canvas.height);
        if (hero === 'ryuchi') {
          try {record.edgeMattePixels = removeRyuchiEdgeMatte(canvas,meta)}
          catch {record.edgeMattePixels = 0} // Readback restrictions must not block loading.
        }
        record.bitmap = canvas;
        resolve(true);
      };
      original.onerror = () => { record.failed = true; resolve(false); };
      original.src = assets[hero];
    });
    return record;
  }
  function artFor(hero) {
    if (ProtagonistArtV5.supports(hero)) return ProtagonistArtV5;
    return MusicianArtV1.supports(hero) ? MusicianArtV1 : NinjaArcherArtV1;
  }
  // Each compact mask traces actual trouser/boot pixels of this exact pose.
  // The complement includes the hand, bow, quiver and hanging skull below the belt.
  function archerLayer(key,frame,row,source,lower) {
    const id=key+'/'+row+'/'+frame;
    if(layerCache.has(id)) return layerCache.get(id);
    const mask=split.sheets[key]?.[row]?.[frame];
    if(!mask)return null;
    const tile=document.createElement('canvas');
    tile.width=tile.height=88;
    tile.dataset.archerPose=id;
    const q=tile.getContext('2d');
    if(!q)return null;
    const bytes=atob(mask.spans),step=split.pixelStep,scale=88/256;
    q.scale(scale,scale);
    const path=new Path2D();
    if(!lower)path.rect(0,0,256,256);
    for(let n=0;n<bytes.length;n+=3)
      path.rect(bytes.charCodeAt(n+1)*step,bytes.charCodeAt(n)*step,bytes.charCodeAt(n+2)*step,step);
    q.clip(path,lower?'nonzero':'evenodd');
    q.imageSmoothingEnabled=false;
    q.drawImage(...source,0,0,256,256);
    const layer={tile,join:mask.join};
    layerCache.set(id,layer);
    return layer;
  }
  function archerPair(p,x,y,state,running) {
    const art=NinjaArcherArtV1,pose=art.pose(p,state.seat,true);
    if(!['attack_1','attack_2','attack_3','skill','advanced','signature'].includes(pose.state))return null;
    const attack=art.image('alt_'+pose.state);
    if(!attack?.complete || !attack.naturalWidth)return null;
    const original=[attack,pose.frame*256,pose.row*256,256,256];
    const body=typeof HeroAttackBody!=='undefined' ?
      HeroAttackBody.frame(art,pose,state.seat,attack,x,y) : {source:original,contact:false};
    const [,sx,sy]=body.source;
    const upper=archerLayer(body.contact?'contact':pose.state,sx/256,sy/256,body.source,false);
    let lower,registration;
    const row=directions.indexOf(state.moveDir);
    if(row<0)return null;
    if(running){
      const sheet=image('alt'),col=Math.floor(state.phase*manifest.heroes.alt.frames);
      if(!sheet.bitmap)return null;
      const c=sheet.cell;
      lower=archerLayer('run',col,row,[sheet.bitmap,col*c,row*c,c,c],true);
      registration=manifest.heroes.alt.registration?.[row]?.[col];
    }else{
      const walk=art.image('alt_walk'),col=Math.floor(state.phase*8);
      if(!walk?.complete || !walk.naturalWidth)return null;
      lower=archerLayer('walk',col,row,[walk,col*256,row*256,256,256],true);
      registration=manifest.heroes.alt.walkRegistration?.[row]?.[col];
    }
    if(!lower || !upper)return null;
    const offset=body.destination;
    return {lower,upper,registration,dx:offset?offset[0]-Math.round(x-44):0,dy:offset?offset[1]-Math.round(y+11-77):0};
  }
  function drawArcher(pair,x,y,state) {
    const scale=88/256;
    // Both authored layers receive the same root translation. Their measured
    // waist join and the independently aimed weapon remain unchanged.
    const offset=pair.registration?.offset||[0,0];
    const left=Math.round(x-44+offset[0]*scale),top=Math.round(y+11-77+offset[1]*scale);
    // Register the action waist onto the pelvis of the independently moving legs.
    const dx=Math.round((pair.lower.join[0]-pair.upper.join[0])*scale);
    const dy=Math.round((pair.lower.join[1]-pair.upper.join[1])*scale);
    ctx.save();
    try{
      ctx.imageSmoothingEnabled=false;
      ctx.fillStyle='#10152344';ctx.beginPath();ctx.ellipse(x,y+10,12,3,0,0,2*Math.PI);ctx.fill();
      const hit=state.seat===1?C3.coop.hit:act.hit;
      if(hit>0 && !G.options10?.reducedMotion && Math.floor(tick*24)%2===0)ctx.globalAlpha*=.48;
      ctx.drawImage(pair.lower.tile,left,top);
      ctx.drawImage(pair.upper.tile,left+dx+pair.dx,top+dy+pair.dy);
    }finally{ctx.restore();}
  }
  function placement(config,entry,x,y,size=88) {
    const scale=Number.isFinite(entry?.scale)&&entry.scale>0?entry.scale:1;
    const offset=entry?.offset||[0,0],base=size/config.cell,drawSize=Math.round(size*scale),pixel=drawSize/config.cell;
    return [Math.round(x+(offset[0]||0)*base-config.pivot[0]*pixel),
      Math.round(y+11+(offset[1]||0)*base-config.pivot[1]*pixel),drawSize,drawSize];
  }
  function maskedRow(hero,art,p,row) {
    const config=manifest.heroes[hero];
    return row+(art===MusicianArtV1&&config.rows>4&&art.variant(hero,p.musicianVariant)==='masked'?4:0);
  }
  function nativeMotion(p,x,y,moving,previous,state) {
    const art=artFor(p.style),original=art.pose,draw=ctx.drawImage,config=manifest.heroes[p.style];
    // Scope the common clock to this actor draw; other NPCs and contact/action
    // consumers retain their established pose methods and precedence.
    art.pose=function(actor,seat,isMoving){
      let pose=original.call(this,actor,seat,isMoving);
      if(actor.style!==p.style || seat!==state.seat)return pose;
      if(!activeModes10()&&['overlay','dialogue','rhythm'].includes(mode)&&pose.state==='idle'&&state.nativePose){
        const frozen={...state.nativePose};
        if(art===ProtagonistArtV5){
          const row=directions.indexOf(frozen.direction)+(G.flags.masks?4:0);
          // The pedestal equips masks inside a dialogue callback. Keep the
          // physical step frozen, but never retain the pre-equipment atlas row.
          if(row!==frozen.row){
            frozen.row=row;
            frozen.frame=art.phaseFrame(art.sequence(p.style,frozen.state,row),state.phase);
            const frameMap=config[frozen.state==='walk'?'walkFrameMap':'fallbackRunFrameMap']?.[row];
            if(frameMap?.length)frozen.frame=frameMap[Math.min(frameMap.length-1,Math.floor(state.phase*frameMap.length))];
          }
        }
        state.nativePose={...frozen};return frozen;
      }
      if(!['walk','run'].includes(pose.state)){if(activeModes10())state.nativePose=null;return pose;}
      const direction=state.moveDir || pose.direction;
      pose.direction=direction;
      pose.row=directions.indexOf(direction)+(art===ProtagonistArtV5&&G.flags.masks?4:0);
      const sequence=art===ProtagonistArtV5?art.sequence(p.style,pose.state,pose.row):null;
      pose.frame=art===ProtagonistArtV5?art.phaseFrame(sequence,state.phase):Math.min(7,Math.floor(state.phase*8));
      const mapRow=maskedRow(p.style,art,p,pose.row),frameMap=config[pose.state==='walk'?'walkFrameMap':'fallbackRunFrameMap']?.[mapRow];
      if(frameMap?.length)pose.frame=frameMap[Math.min(frameMap.length-1,Math.floor(state.phase*frameMap.length))];
      state.nativePose={...pose};
      return pose;
    };
    ctx.drawImage=function(image,...args){
      if(args.length===8)for(const [motion,field]of [['walk','walkRegistration'],['run','fallbackRunRegistration'],['idle','idleRegistration']]){
        const key=art===MusicianArtV1?art.key(p.style,art.variant(p.style,p.musicianVariant),motion):p.style+'_'+motion;
        if(image!==art.images[key])continue;
        const row=maskedRow(p.style,art,p,args[1]/256),frameMap=config[motion==='walk'?'walkFrameMap':motion==='run'?'fallbackRunFrameMap':'idleFrameMap']?.[row];
        if(frameMap?.length&&motion!=='idle')args[0]=frameMap[Math.min(frameMap.length-1,Math.floor(state.phase*frameMap.length))]*256;
        const frame=args[0]/256,registration=config[field]?.[row]?.[frame];
        if(registration)args.splice(4,4,...placement(config,registration,x,y));
        break;
      }
      return draw.call(this,image,...args);
    };
    try{return previous(p,x,y,moving)}finally{art.pose=original;ctx.drawImage=draw}

  }
  function render(p,x,y,moving,previous) {
    const hero = p.style, config = manifest.heroes[hero];
    if (!G || !config || p.musicianNpc) return previous(p,x,y,moving);
    resetWorld();
    const state = states.get(hero);
    if (!state || Math.abs(x-(state.x*T-cam.x))>2 || Math.abs(y-(state.y*T-cam.y))>2)
      return previous(p,x,y,moving);
    const allyCast = state.seat < 0 && typeof HeroAttackBody !== 'undefined' && HeroAttackBody.followerCast;
    if (G.hp?.[hero] <= 0 || (allyCast?.hero === hero && allyCast.game === G && allyCast.area === G.area &&
        HeroAttackFX.clock-allyCast.started < allyCast.duration)) {
      state.lastPose = null;
      return previous(p,x,y,moving);
    }
    const running = state.seat === 1 ? C3.coop.running : G.isRunning10;
    const active = activeModes10();
    // Legacy party drawing passes the leader's lastStep flag even for P2.
    // A matched body has its own post-collision movement sample. An airborne
    // fall is drawn by CloudWorld's outer transform and uses its still pose.
    if (typeof CloudWorldV1 !== 'undefined' && CloudWorldV1.fall?.hero === hero)
      return previous(p,x,y,false);
    if(active && state.seat>=0)moving=state.moving;
    if(hero==='alt' && state.seat>=0){
      const frozen = !active && ['overlay','dialogue','rhythm'].includes(mode);
      const pair=frozen ? state.archerPair :
        active && moving && state.moving ? archerPair(p,x,y,state,running) : null;
      state.archerPair=pair;
      if(pair){state.lastPose=null;return drawArcher(pair,x,y,state);}
    }
    const freeze = !active && (mode==='overlay' || mode==='dialogue' || mode==='rhythm') && state.lastPose;
    if (!freeze && (!active || !running || !moving || !state.moving)) {
      state.lastPose = null;
      return nativeMotion(p,x,y,running && active && !state.moving ? false : moving,previous,state);
    }
    const art = artFor(hero);
    let pose = freeze || art.pose(p,state.seat,true);
    if (pose.state !== 'run') {
      state.lastPose = null;
      return previous(p,x,y,moving);
    }
    const masked = config.rows>4 && (art===MusicianArtV1 ? art.variant(hero,p.musicianVariant)==='masked' : G.flags.masks);
    const directionName = freeze ? state.lastPose.direction : state.moveDir || pose.direction;
    const direction = Math.max(0,directions.indexOf(directionName));
    const row = direction + (masked ? 4 : 0);
    // Some authored variants have a better established gait in the canonical
    // body atlas. Select that exact row intentionally, retaining the shared
    // spatial phase and the unmasked V8 sheet; this is not a decode failure.
    if(config.nativeRunRows?.includes(row)){
      state.lastPose=null;
      return nativeMotion(p,x,y,moving,previous,state);
    }
    const sheet = image(hero);
    if (!sheet.bitmap) return nativeMotion(p,x,y,moving,previous,state);
    const frame = freeze ? state.lastPose.frame : Math.min(config.frames-1,Math.floor(state.phase*config.frames));
    if (!freeze) state.lastPose = {state:'run',direction:directionName,frame};
    const size = sheet.cell;
    ctx.save();
    try {
      ctx.imageSmoothingEnabled = false;
      if (art!==MusicianArtV1) {
        ctx.fillStyle='#10152344';
        ctx.beginPath();ctx.ellipse(x,y+10,12,3,0,0,Math.PI*2);ctx.fill();
      }
      const hit = state.seat === 1 ? C3.coop.hit : state.seat === 0 ? act.hit : 0;
      if (hit>0 && !G.options10?.reducedMotion && Math.floor(tick*24)%2===0) ctx.globalAlpha*=.48;
      const registration=config.registration?.[row]?.[frame];
      ctx.drawImage(sheet.bitmap,frame*size,row*size,size,size,...placement(config,registration,x,y,size));
    } finally {ctx.restore();}
  }
  function retry(hero) {
    const record = sheets.get(hero);
    if (record && !record.bitmap && record.failed) sheets.delete(hero);
    return image(hero);
  }
  return {manifest,image,retry,capture,advance,render,placement,snapshot:()=>[...states].map(([hero,state])=>({hero,...state}))};
})();
window.RunStrideV1=RunStrideV1;

const strideUpdateV1=update;
update=function(dt,...args) {
  const before=RunStrideV1.capture();
  const result=strideUpdateV1.call(this,dt,...args);
  RunStrideV1.advance(before);
  return result;
};
const strideDrawV1=drawActor;
drawActor=function(p,x,y,moving=false) {
  return RunStrideV1.render(p,x,y,moving,strideDrawV1);
};
