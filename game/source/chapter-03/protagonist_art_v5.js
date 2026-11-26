/* Authored 2D animation atlas integration. Visual state is local to each player.
 * Gameplay damage, cooldowns, collision and save schema are unchanged.
 * Generated resources are embedded by build_alpha.rb for offline portability.
 */
'use strict';
const ProtagonistArtV5 = {
  assets: __PROTAGONIST_ASSETS__,
  manifest: __PROTAGONIST_MANIFEST__,
  images: {}, recent: [], warmed: new Set(), players: [null, null], shots: [0, 0], game: null, area: null,
  clock: 0, locomotion: [null, null], sequences: null,
  supports(id) { return id === 'franco' || id === 'ryuchi'; },
  image(name) {
    this.recent = this.recent.filter(key => key !== name); this.recent.push(name);
    if (!this.images[name]) {
      const image = new Image();
      this.images[name] = image;
      // The same pale matte is present in the opening idle/walk sheets as in
      // the later run sheet. Decode once for all Ryuchi body states, leaving
      // opaque details, portraits and the four masked rows unchanged.
      if (name.startsWith('ryuchi_') && !name.includes('_portrait_') && !this.manifest.bakedEdgeMatte?.includes(name)) {image.edgePending = true;image.onload = () => {
        image.edgePending = false;
        if (image.naturalHeight !== 2048 || this.images[name] !== image) return;
        try {
          const canvas = document.createElement('canvas');
          canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
          const q = canvas.getContext('2d'); q.imageSmoothingEnabled = false; q.drawImage(image,0,0);
          canvas.detachedPixels = name==='ryuchi_walk' ? this.trimDetached(canvas,256,4,(row,col)=>row===1&&col%2===1) : 0;
          canvas.edgeMattePixels = this.cleanEdgeMatte(canvas,8);
          // Existing lazy-load and contact-frame consumers accept a CanvasImageSource
          // and use these image readiness fields; preserve that small contract.
          canvas.complete = true; canvas.naturalWidth = canvas.width; canvas.naturalHeight = canvas.height;
          canvas.decode = () => Promise.resolve();
          this.images[name] = canvas;
        } catch {} // Tainted images must still render through the established fallback.
      };}
      image.src = this.assets[name];
    }
    // Decode at most eight full-resolution sheets rather than all 24 on mobile.
    while (this.recent.length > 8) { const old = this.recent.shift(); delete this.images[old]; }
    return this.images[name];
  },
  trimDetached(canvas,cell,rows,select=()=>true) {
    const q=canvas.getContext('2d'),pixels=q.getImageData(0,0,canvas.width,canvas.height),data=pixels.data;
    const visited=new Uint8Array(cell*cell),stack=new Int32Array(cell*cell);let removed=0;
    for(let row=0;row<rows;row++)for(let col=0;col<canvas.width/cell;col++){
      if(!select(row,col))continue;
      visited.fill(0);let main=null;
      const index=n=>((row*cell+Math.floor(n/cell))*canvas.width+col*cell+n%cell)*4;
      for(let start=0;start<cell*cell;start++){
        if(visited[start]||data[index(start)+3]<128)continue;
        let size=0,top=cell,bottom=0,left=cell,right=0,length=1;stack[0]=start;visited[start]=1;
        while(length){const n=stack[--length],x=n%cell,y=Math.floor(n/cell);size++;
          left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
          for(const next of [x>0?n-1:-1,x<cell-1?n+1:-1,y>0?n-cell:-1,y<cell-1?n+cell:-1]){
            if(next<0||visited[next])continue;visited[next]=1;
            if(data[index(next)+3]>=128)stack[length++]=next;
          }
        }
        if(!main||size>main.size)main={size,top,bottom,left,right};
      }
      if(!main||main.size<64)continue;
      // The V7 left-facing intermediate has an isolated scrap far above the
      // head. Keep the entire body box plus an eight-source-pixel margin;
      // boots, cap logo, pale clothes and disconnected nearby fingers stay intact.
      for(let y=0;y<cell;y++)for(let x=0;x<cell;x++)if(x<main.left-8||x>main.right+8||y<main.top-8||y>main.bottom+8){
        const i=((row*cell+y)*canvas.width+col*cell+x)*4;
        if(data[i+3]){data[i]=data[i+1]=data[i+2]=data[i+3]=0;removed++}
      }
    }
    q.putImageData(pixels,0,0);return removed;
  },
  cleanEdgeMatte(canvas,rows=8) {
    const q=canvas.getContext('2d'), pixels=q.getImageData(0,0,canvas.width,canvas.height);
    const data=pixels.data, width=canvas.width, height=Math.floor(canvas.height/rows*4);
    let changed=0;
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
      const i=(y*width+x)*4,a=data[i+3],r=data[i],g=data[i+1],b=data[i+2];
      if(!a||a>=230||Math.min(r,g,b)<=75||Math.max(r,g,b)-Math.min(r,g,b)>35)continue;
      let fringe=false;
      for(let yy=Math.max(0,y-2);yy<Math.min(height,y+3)&&!fringe;yy++)
        for(let xx=Math.max(0,x-2);xx<Math.min(width,x+3);xx++)
          if(!data[(yy*width+xx)*4+3]){fringe=true;break}
      if(!fringe)continue;
      for(let c=0;c<3;c++)data[i+c]=Math.max(0,Math.min(255,Math.round((data[i+c]*255-(255-a)*255)/a)));
      changed++;
    }
    q.putImageData(pixels,0,0);return changed;
  },
  reset() { this.players = [null, null]; this.shots = [0, 0]; this.locomotion = [null, null]; this.game = G; this.area = G?.area; },
  sequence(hero, state, row) {
    if (!this.sequences) this.sequences = new Map((this.manifest.animations || []).map(a => [a.hero + '/' + a.state + '/' + a.row, a]));
    return this.sequences.get(hero + '/' + state + '/' + row);
  },
  phaseFrame(sequence, phase) {
    const count = sequence?.playFrames || 8, times = sequence?.frameDurationsMs;
    if (times?.length === count) {
      let time = phase * times.reduce((a, b) => a + b, 0);
      for (let i = 0; i < count; i++) { if (time < times[i]) return i; time -= times[i]; }
    }
    return Math.min(count - 1, Math.floor(phase * count));
  },
  advanceLocomotion(before) {
    if (!G || !activeModes10() || this.game !== G || this.area !== G.area) return;
    for (let seat = 0; seat < 2; seat++) {
      const body = seat ? C3.coop : G, hero = seat ? C3.coopMember() : G.active, old = before[seat];
      if (!old || old.hero !== hero || !this.supports(hero) || (seat && !C3.coopActive())) { this.locomotion[seat] = null; continue; }
      let motion = this.locomotion[seat];
      if (!motion || motion.hero !== hero) motion = this.locomotion[seat] = {hero, phase: 0, moving: false};
      const distance = Math.hypot(body.x - old.x, body.y - old.y);
      motion.moving = Number.isFinite(distance) && distance > .00001 && distance < 2;
      const rolling = seat ? body.dash > 0 : Combat10.dashTime > 0;
      if (!motion.moving || rolling || this.players[seat]?.elapsed < this.players[seat]?.duration) continue;
      const running = seat ? body.running : G.isRunning10, state = running ? 'run' : 'walk';
      const sequence = this.sequence(hero, state, 0);
      // The cycle length is independent of the number of authored drawings.
      // Keep foot phase when changing speed; only real travel advances it.
      const cycleMs = sequence?.cycleMs || (sequence?.frameMs || (running ? 65 : 110)) * (sequence?.playFrames || 8);
      const cycleDistance = sequence?.strideDistance || (running ? 6.1 * cycleMs / 1000 : 8 / 3.6);
      motion.phase = (motion.phase + distance / cycleDistance) % 1;
    }
  },
  mark(seat, hero, state, duration, direction) {
    if (!this.supports(hero)) return;
    this.image(hero + '_' + state);
    this.players[seat] = {hero, state, duration, elapsed: 0, direction};
  },
  playerAt(p, x, y) {
    if (!G) return -1;
    const near = (body) => Math.abs(x - (body.x * T - cam.x)) < 2 && Math.abs(y - (body.y * T - cam.y)) < 2;
    if (C3.coopActive() && p.style === C3.coopMember() && near(C3.coop)) return 1;
    if (p.style === G.active && near(G)) return 0;
    return -1;
  },
  pose(p, seat, moving) {
    const hero = p.style, c = C3.coop, record = seat >= 0 ? this.players[seat] : null;
    let state = 'idle', direction = p.dir || 'down', frame = 0;
    const playing = activeModes10(), row = (G?.flags?.masks ? 4 : 0) + Math.max(0, ['down','left','up','right'].indexOf(direction));
    const rolling = seat === 1 && c.rollHero === hero && c.dash > 0
      ? {left: c.dash, duration: c.rollDuration, direction: c.dir}
      : seat === 0 && Input121.roll?.id === hero && Combat10.dashTime > 0
        ? {left: Combat10.dashTime, duration: Input121.roll.duration, direction: G.dir} : null;
    if (rolling) {
      state = 'roll'; direction = rolling.direction;
      frame = Math.min(7, Math.floor((1 - rolling.left / rolling.duration) * 8));
    } else if (record?.hero === hero && record.elapsed < record.duration) {
      state = record.state; direction = record.direction;
      frame = Math.min(7, Math.floor(record.elapsed / record.duration * 8));
    } else if (playing && moving) {
      state = (seat === 1 ? c.running : G?.isRunning10) ? 'run' : 'walk';
      const motion = this.locomotion[seat];
      const phase = motion?.hero === hero ? motion.phase : ((seat === 1 ? c.stride || 0 : stride10) / (state === 'run' ? 3.172 : 8 / 3.6)) % 1;
      if (motion && !motion.moving) state = 'idle';
      else frame = this.phaseFrame(this.sequence(hero, state, row), phase);
    } else frame = playing ? Math.floor(this.clock / .14) % 8 : 0;
    return {hero, state, direction, frame, row: (G?.flags?.masks ? 4 : 0) + Math.max(0, ['down','left','up','right'].indexOf(direction))};
  }
};
// No decoded protagonist atlas is needed until an actor is drawn.

const protagonistUpdateV5 = update;
update = function(dt) {
  const art = ProtagonistArtV5;
  if (art.game !== G || art.area !== G?.area) art.reset();
  if (G && activeModes10()) {
    art.clock += dt;
    for (let seat = 0; seat < 2; seat++) {
      const hero = seat === 0 ? G.active : C3.coopMember(), record = art.players[seat];
      if (record && record.hero !== hero) art.players[seat] = null;
      else if (record) record.elapsed = Math.min(record.duration, record.elapsed + dt);
    }
  }
  const before = [G && {x: G.x, y: G.y, hero: G.active}, C3.coopActive() && {x: C3.coop.x, y: C3.coop.y, hero: C3.coopMember()}];
  const result = protagonistUpdateV5(dt);
  art.advanceLocomotion(before);
  return result;
};

// Only an accepted action starts its animation. A blocked button cannot restart it.
function protagonistActionV5(previous, seat, key, state, duration) {
  return function(...args) {
    const hero = seat === 0 ? G?.active : C3.coopMember();
    const body = seat === 0 ? act : C3.coop, before = body[key] || 0;
    const result = previous.apply(this, args);
    if (ProtagonistArtV5.supports(hero) && (body[key] || 0) > before) {
      let action = state;
      if (state === 'attack') {
        const combo = seat === 0 ? act.combo : body.combo;
        action = 'attack_' + Math.max(1, Math.min(3, combo || 1));
      }
      const length = typeof duration === 'function' ? duration(body) : duration;
      ProtagonistArtV5.mark(seat, hero, action, length, seat === 0 ? G.dir : body.dir);
    }
    return result;
  };
}
attackAction = protagonistActionV5(attackAction, 0, 'cool', 'attack', b => Math.max(.18, b.cool));
skillAction = protagonistActionV5(skillAction, 0, 'skill', 'skill', .42);
advancedSkill = protagonistActionV5(advancedSkill, 0, 'skillX', 'advanced', .42);
duoAction = protagonistActionV5(duoAction, 0, 'duo', 'signature', .72);
C3.coopAttack = protagonistActionV5(C3.coopAttack, 1, 'cool', 'attack', b => Math.max(.24, b.cool));
C3.coopSkill = protagonistActionV5(C3.coopSkill, 1, 'skill', 'skill', .42);
C3.coopAdvanced = protagonistActionV5(C3.coopAdvanced, 1, 'advanced', 'advanced', .42);
C3.coopSignature = protagonistActionV5(C3.coopSignature, 1, 'signature', 'signature', .72);

const protagonistDamageV5 = damageHero;
damageHero = function(...args) {
  const hero = G?.active, before = G?.hp?.[hero], direction = G?.dir;
  const result = protagonistDamageV5(...args);
  if (G && G.hp[hero] < before) ProtagonistArtV5.mark(0, hero, G.hp[hero] <= 0 ? 'defeat' : 'hurt', G.hp[hero] <= 0 ? .8 : .3, direction);
  return result;
};
const protagonistCoopDamageV5 = C3.damageCoop;
C3.damageCoop = function(...args) {
  const hero = C3.coopMember(), before = G?.hp?.[hero], direction = C3.coop.dir;
  const result = protagonistCoopDamageV5(...args);
  if (G && G.hp[hero] < before) ProtagonistArtV5.mark(1, hero, G.hp[hero] <= 0 ? 'defeat' : 'hurt', G.hp[hero] <= 0 ? .8 : .35, direction);
  return result;
};

const protagonistActorV5 = drawActor;
drawActor = function(p, x, y, moving = false) {
  const art = ProtagonistArtV5;
  if (!art.supports(p.style)) return protagonistActorV5(p, x, y, moving);
  const seat = art.playerAt(p, x, y), pose = art.pose(p, seat, moving);
  if (!art.warmed.has(p.style)) {
    art.warmed.add(p.style);
    for (const state of ['walk','run','roll']) art.image(p.style + '_' + state);
  }
  let image = art.image(pose.hero + '_' + pose.state);
  if (!image.complete || !image.naturalWidth || image.edgePending) {
    if (moving && (pose.state === 'walk' || pose.state === 'run')) {
      // Lazy web loads can leave locomotion pending for several seconds. Using
      // idle/0 here made a moving Franco slide as one frozen drawing. Prefer a
      // decoded locomotion sheet, retaining physical foot phase; otherwise the
      // established animated renderer can keep moving until this atlas arrives.
      const fallbackState = pose.state === 'run' ? 'walk' : 'run';
      const fallback = art.images[pose.hero + '_' + fallbackState];
      if (!fallback?.complete || !fallback.naturalWidth || fallback.edgePending)
        return protagonistActorV5(p, x, y, moving);
      image = fallback;
      pose.state = fallbackState;
      const motion = art.locomotion[seat];
      const phase = motion?.hero === pose.hero ? motion.phase :
        ((seat === 1 ? C3.coop.stride || 0 : stride10) / (fallbackState === 'run' ? 3.172 : 8 / 3.6)) % 1;
      pose.frame = art.phaseFrame(art.sequence(pose.hero, fallbackState, pose.row), phase);
    } else {
      image = art.image(pose.hero + '_idle'); pose.frame = 0;
    }
  }
  if (!image?.complete || !image.naturalWidth || image.edgePending) return protagonistActorV5(p, x, y, moving);
  ctx.save(); ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#10152344'; ctx.beginPath(); ctx.ellipse(x, y + 10, 12, 3, 0, 0, Math.PI * 2); ctx.fill();
  const hit = seat === 1 ? C3.coop.hit : seat === 0 ? act.hit : 0;
  if (hit > 0 && !G?.options10?.reducedMotion && Math.floor(tick * 24) % 2 === 0) ctx.globalAlpha = .48;
  // Uniform square scale. Pivot (128,224) lands at the same ground point as legacy actors.
  const bodyFrame = HeroAttackBody.frame(art, pose, seat, image, x, y);
  ctx.drawImage(...bodyFrame.source, ...bodyFrame.destination);
  ctx.restore();
};

const protagonistPortraitV5 = portraitURI10;
portraitURI10 = function(id) {
  return ProtagonistArtV5.supports(id) ? ProtagonistArtV5.assets[id + '_portrait_' + (G?.flags?.masks ? 'masked' : 'unmasked') + '_neutral'] : protagonistPortraitV5(id);
};
const protagonistDialogueV5 = advanceDialogue;
advanceDialogue = function(...args) {
  const line = mode === 'dialogue' ? dialogueQueue[0] : null;
  const result = protagonistDialogueV5(...args);
  if (mode === 'dialogue' && line && ProtagonistArtV5.supports(line.who)) {
    const expression = ['neutral','speaking','happy','surprised','determined','angry','hurt','sad'].includes(line.expression) ? line.expression : 'speaking';
    $('portrait').src = ProtagonistArtV5.assets[line.who + '_portrait_' + (G?.flags?.masks ? 'masked' : 'unmasked') + '_' + expression];
  }
  return result;
};
