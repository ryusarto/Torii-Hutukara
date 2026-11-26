/* Drawn chibi animation for synth/percussion only.
 * Visual records are per player; gameplay values and save schema are untouched.
 * Sources are injected by build_alpha.rb after ninja_archer_art_v1.js.
 */
'use strict';
const MusicianArtV1 = {
  assets: __MUSICIAN_ASSETS__,
  manifest: __MUSICIAN_MANIFEST__,
  heroes: {synth: 'franco_sintetizador', percussion: 'ryuchi_percussionista'},
  variants: {synth: 'unmasked', percussion: 'unmasked'},
  states: ['idle','walk','run','roll','attack_1','attack_2','attack_3','skill','advanced','signature','hurt','defeat','performance'],
  directions: ['down','left','up','right'],
  expressions: ['neutral','speaking','happy','surprised','determined','angry','hurt','sad'],
  images: {}, recent: [], players: [null, null], strides: {}, poses: {}, prepared: {}, game: null, area: null, clock: 0,
  supports(id) { return Object.prototype.hasOwnProperty.call(this.heroes, id); },
  variant(id, override) {
    return ['masked','unmasked'].includes(override) ? override : this.variants[id] || 'unmasked';
  },
  setVariant(id, variant) {
    if (!this.supports(id) || !['masked','unmasked'].includes(variant)) return false;
    const changed = this.variants[id] !== variant;
    this.variants[id] = variant;
    if (changed) for (const [key, entry] of Object.entries(this.prepared)) if (entry.hero === id) {
      const seat = key === 'player_0' ? 0 : key === 'player_1' ? 1 : -1;
      const record = seat >= 0 ? this.players[seat] : null;
      const state = record?.hero === id && (record.elapsed < record.duration || record.state === 'defeat')
        ? record.state : this.poses[key]?.state || entry.state || 'attack_1';
      this.prepare(id, seat, variant, state === 'idle' ? 'attack_1' : state);
    }
    return true;
  },
  key(id, variant, state) { return this.heroes[id] + '_' + variant + '_' + state; },
  image(key) {
    if (!this.assets[key]) return null;
    this.recent = this.recent.filter(item => item !== key); this.recent.push(key);
    if (!this.images[key]) {
      const image = new Image(); image.src = this.assets[key]; this.images[key] = image;
    }
    while (this.recent.length > 8) {
      const index = this.recent.findIndex(key => !key.endsWith('_idle'));
      if (index < 0) break;
      const [old] = this.recent.splice(index, 1); delete this.images[old];
    }
    return this.images[key];
  },
  prepare(id, seat = -1, override, state) {
    if (!G || mode === 'title' || !this.supports(id)) return null;
    const variant = this.variant(id, override), key = seat === 0 || seat === 1 ? 'player_' + seat : 'follower_' + id;
    const previous = this.prepared[key];
    if (previous?.hero === id && previous.variant === variant) return previous;
    const entry = this.prepared[key] = {hero: id, variant, state: state || 'attack_1'};
    // Only entry/selection/mask changes warm sheets. Reuse the existing LRU8;
    // never hold input, restart an action or load the full animation collection.
    for (const name of ['idle', this.states.includes(state) && state !== 'idle' ? state : 'attack_1']) {
      const image = this.image(this.key(id, variant, name));
      // Request decoding ahead of first presentation; never wait on input.
      if (typeof image?.decode === 'function') image.decode().catch(() => {});
    }
    return entry;
  },
  reset() { this.players = [null, null]; this.strides = {}; this.poses = {}; this.prepared = {}; this.game = G; this.area = G?.area; },
  rolling(seat, hero) {
    return seat === 1 ? C3.coop.rollHero === hero && C3.coop.dash > 0 :
      seat === 0 && Input121.roll?.id === hero && Combat10.dashTime > 0;
  },
  cancelForRoll(seat, hero) {
    if (this.supports(hero) && this.players[seat]?.hero === hero && this.players[seat].state !== 'defeat')
      this.players[seat] = null;
    delete this.poses['player_' + seat];
  },
  strideFrame(hero, seat, distance, running) {
    const key = seat >= 0 ? 'player_' + seat : 'follower_' + hero;
    const stride = Number(distance) || 0, rate = running ? 3.2 : 3.6;
    let previous = this.strides[key];
    if (!previous || previous.hero !== hero || stride < previous.distance)
      previous = {hero, distance: stride, phase: stride * rate % 8};
    else {
      previous.phase = (previous.phase + Math.max(0, stride - previous.distance) * rate) % 8;
      previous.distance = stride;
    }
    this.strides[key] = previous;
    return Math.floor(previous.phase);
  },
  sync() {
    if (this.game !== G || this.area !== G?.area) this.reset();
    for (let seat = 0; seat < 2; seat++) {
      const hero = seat === 0 ? G?.active : C3.coopMember();
      const record = this.players[seat], snapshot = this.poses['player_' + seat];
      if (snapshot && (snapshot.hero !== hero || (snapshot.state === 'defeat' && G?.hp?.[hero] > 0)))
        delete this.poses['player_' + seat];
      if (record && (record.hero !== hero || (record.state === 'defeat' && G?.hp?.[record.hero] > 0)))
        this.players[seat] = null;
      if (seat === 0 || C3.coopActive()) {
        if (this.prepared['player_' + seat]?.hero !== hero) this.prepare(hero, seat);
      } else delete this.prepared['player_' + seat];
      if (!this.supports(hero)) delete this.prepared['player_' + seat];
    }
  },
  advancingDefeat(record) {
    if (!G || record?.state !== 'defeat' || !(G.hp?.[record.hero] <= 0)) return false;
    if (mode === 'gameover' || mode === 'defeat') return true;
    // The existing game uses an overlay for defeat. Ordinary pause/menu overlays
    // and dialogue remain frozen; only the visible retry overlay is a defeat scene.
    const overlay = mode === 'overlay' ? $('overlay') : null;
    return !!(overlay && !overlay.classList.contains('hidden') && $('retryCheckpoint'));
  },
  mark(seat, hero, state, duration, direction) {
    this.sync();
    if (![0,1].includes(seat) || !this.supports(hero) || !this.states.includes(state)) return;
    // The body is still rolling; gameplay effects may execute, but do not replay
    // a stale cast after the roll. Fresh damage/death reactions remain visible.
    if (this.rolling(seat, hero) && !['hurt','defeat'].includes(state)) return;
    delete this.poses['player_' + seat];
    this.image(this.key(hero, this.variant(hero), state));
    this.players[seat] = {hero, state, duration: Math.max(.05, Number(duration) || .3),
      elapsed: 0, startedClock: this.clock, presentedFrame: -1, presentedClock: null, tailCancelled: false, direction: this.directions.includes(direction) ? direction : 'down'};
  },
  presentedAttack(record) { return !!record && /^attack_[123]$/.test(record.state); },
  attackVisible(record, moving) {
    if (record.elapsed < record.duration) return true;
    if (this.presentedAttack(record) && moving) record.tailCancelled = true;
    // Never start a never-seen attack after its gameplay window. A short,
    // interruptible tail can finish an already-presented accent, not queue one.
    return this.presentedAttack(record) && !record.tailCancelled && record.presentedFrame >= 0 &&
      (record.presentedFrame < 7 || record.presentedClock === this.clock) && !moving &&
      this.clock - record.startedClock <= record.duration + .1;
  },
  recordFrame(record) {
    const target = Math.min(7, Math.floor(record.elapsed / record.duration * 8));
    if (!this.presentedAttack(record)) return target;
    if (record.presentedClock === this.clock) return record.presentedFrame;
    return Math.min(target, (record.presentedFrame ?? -1) + 1);
  },
  confirmPresentation(record, seat, frame) {
    if (activeModes10() && this.players[seat] === record && this.presentedAttack(record) &&
        record.presentedClock !== this.clock) {
      record.presentedFrame = frame; record.presentedClock = this.clock;
    }
  },
  playerAt(p, x, y) {
    if (!G || p.musicianNpc) return -1;
    const near = body => Math.abs(x - (body.x * T - cam.x)) < 2 && Math.abs(y - (body.y * T - cam.y)) < 2;
    if (C3.coopActive() && p.style === C3.coopMember() && near(C3.coop)) return 1;
    return p.style === G.active && near(G) ? 0 : -1;
  },
  pose(p, seat, moving) {
    this.sync();
    const hero = p.style, c = C3.coop, playing = activeModes10();
    const record = seat >= 0 ? this.players[seat] : null;
    const poseKey = seat >= 0 ? 'player_' + seat : 'follower_' + hero;
    const snapshot = !p.musicianNpc && this.poses[poseKey];
    // Input release clears movement/roll during menus. Freeze the last rendered
    // body pose, while mask selection stays live and real defeat keeps advancing.
    if (!playing && snapshot?.hero === hero && record?.state !== 'defeat')
      return {...snapshot, variant: this.variant(hero, p.musicianVariant)};
    let state = 'idle', direction = p.dir || 'down', frame = 0;
    const roll = seat === 1 && c.rollHero === hero && c.dash > 0
      ? {left: c.dash, duration: c.rollDuration, direction: c.dir}
      : seat === 0 && Input121.roll?.id === hero && Combat10.dashTime > 0
        ? {left: Combat10.dashTime, duration: Input121.roll.duration, direction: G.dir} : null;
    const reacting = record?.hero === hero && (record.state === 'defeat' ||
      (record.state === 'hurt' && record.elapsed < record.duration));
    if (roll && !reacting) {
      state = 'roll'; direction = roll.direction;
      frame = Math.min(7, Math.max(0, Math.floor((1 - roll.left / Math.max(.01, roll.duration)) * 8)));
    } else if (record?.hero === hero && (record.state === 'defeat' || this.attackVisible(record, moving))) {
      state = record.state; direction = record.direction;
      frame = this.recordFrame(record);
    } else if (p.musicianState === 'performance') {
      state = 'performance'; frame = Math.floor(this.clock / .085) % 8;
    } else if (playing && moving && !p.musicianNpc) {
      state = (seat === 1 ? c.running : G?.isRunning10) ? 'run' : 'walk';
      const stride = seat === 1 ? c.stride || 0 : stride10;
      frame = this.strideFrame(hero, seat, stride, state === 'run');
    } else frame = Math.floor(this.clock / .12) % 8;
    direction = this.directions.includes(direction) ? direction : 'down';
    const pose = {hero, variant: this.variant(hero, p.musicianVariant), state, direction, frame,
      row: this.directions.indexOf(direction)};
    if (playing && !p.musicianNpc && !/^attack_[123]$/.test(state)) this.poses[poseKey] = pose;
    return pose;
  },
  portrait(id, expression = 'neutral') {
    if (!this.supports(id)) return null;
    if (!this.expressions.includes(expression)) expression = 'speaking';
    return this.assets[this.key(id, this.variant(id), 'portrait_' + expression)] || null;
  }
};

const musicianUpdateV1 = update;
update = function(dt) {
  const art = MusicianArtV1; art.sync();
  if (G) {
    const playing = activeModes10();
    if (playing) art.clock += dt;
    for (const record of art.players) if (record && (playing || art.advancingDefeat(record)))
      record.elapsed = Math.min(record.duration, record.elapsed + dt);
  }
  return musicianUpdateV1(dt);
};

function musicianActionV1(previous, seat, key, state, duration) {
  return function(...args) {
    MusicianArtV1.sync();
    const hero = seat === 0 ? G?.active : C3.coopMember(), body = seat === 0 ? act : C3.coop;
    const before = body[key] || 0, result = previous.apply(this, args);
    if (MusicianArtV1.supports(hero) && (body[key] || 0) > before) {
      let action = state;
      if (state === 'attack') {
        const combo = seat === 1 ? body.combo : hero === 'synth' ? C3.synthWave : act.combo;
        action = 'attack_' + Math.max(1, Math.min(3, combo || 1));
      }
      const seconds = typeof duration === 'function' ? duration(body, hero) : duration;
      MusicianArtV1.mark(seat, hero, action, seconds, seat === 0 ? G.dir : body.dir);
    }
    return result;
  };
}
attackAction = musicianActionV1(attackAction, 0, 'cool', 'attack', body => Math.max(.18, body.cool));
skillAction = musicianActionV1(skillAction, 0, 'skill', 'skill', (body, hero) => hero === 'percussion' ? .72 : .42);
advancedSkill = musicianActionV1(advancedSkill, 0, 'skillX', 'advanced', (body, hero) => hero === 'percussion' ? .62 : .48);
duoAction = musicianActionV1(duoAction, 0, 'duo', 'signature', .72);
C3.coopAttack = musicianActionV1(C3.coopAttack, 1, 'cool', 'attack', body => Math.max(.24, body.cool));
C3.coopSkill = musicianActionV1(C3.coopSkill, 1, 'skill', 'skill', .42);
C3.coopAdvanced = musicianActionV1(C3.coopAdvanced, 1, 'advanced', 'advanced', .42);
C3.coopSignature = musicianActionV1(C3.coopSignature, 1, 'signature', 'signature', .72);

const musicianStartRollV1 = typeof startRoll121 === 'function' ? startRoll121 : null;
if (musicianStartRollV1) startRoll121 = function(...args) {
  const hero = G?.active, result = musicianStartRollV1.apply(this, args);
  if (result) MusicianArtV1.cancelForRoll(0, hero);
  return result;
};
const musicianCoopRollV1 = C3.coopDodge;
if (typeof musicianCoopRollV1 === 'function') C3.coopDodge = function(...args) {
  const hero = C3.coopMember(), result = musicianCoopRollV1.apply(this, args);
  if (result) MusicianArtV1.cancelForRoll(1, hero);
  return result;
};

const musicianDamageV1 = damageHero;
damageHero = function(...args) {
  const hero = G?.active, before = G?.hp?.[hero], direction = G?.dir;
  const guard = hero === 'percussion' ? C3.percussionGuard : 0, result = musicianDamageV1(...args);
  if (G && G.hp[hero] < before) MusicianArtV1.mark(0, hero, G.hp[hero] <= 0 ? 'defeat' : 'hurt', G.hp[hero] <= 0 ? .8 : .35, direction);
  else if (hero === 'percussion' && guard > 0 && C3.percussionGuard === 0)
    MusicianArtV1.mark(0, hero, 'attack_3', .35, direction);
  return result;
};
const musicianCoopDamageV1 = C3.damageCoop;
C3.damageCoop = function(...args) {
  const hero = C3.coopMember(), before = G?.hp?.[hero], direction = C3.coop.dir;
  const result = musicianCoopDamageV1(...args);
  if (G && G.hp[hero] < before) MusicianArtV1.mark(1, hero, G.hp[hero] <= 0 ? 'defeat' : 'hurt', G.hp[hero] <= 0 ? .8 : .35, direction);
  return result;
};

const musicianActorV1 = drawActor;
drawActor = function(p, x, y, moving = false) {
  const art = MusicianArtV1;
  if (!art.supports(p.style)) return musicianActorV1(p, x, y, moving);
  art.sync();
  const pose = art.pose(p, art.playerAt(p, x, y), moving);
  const prepared = art.prepare(pose.hero, art.playerAt(p, x, y), pose.variant);
  if (prepared) prepared.state = pose.state;
  let image = art.image(art.key(pose.hero, pose.variant, pose.state));
  const actionAtlasReady = !!(image?.complete && image.naturalWidth);
  if (!image?.complete || !image.naturalWidth) {
    image = art.image(art.key(pose.hero, pose.variant, 'idle')); pose.frame = 0;
  }
  if (!image?.complete || !image.naturalWidth) {
    globalThis.FinalAssetLoadingV1?.requireImage(image, pose.hero + ' · idle'); return;
  }
  ctx.save(); ctx.imageSmoothingEnabled = false;
  const seat = art.playerAt(p, x, y), hit = seat === 1 ? C3.coop.hit : seat === 0 ? act.hit : 0;
  if (hit > 0 && !G?.options10?.reducedMotion && Math.floor(tick * 24) % 2 === 0) ctx.globalAlpha = .48;
  // Confirm only a successful action-atlas draw, not a pose query or idle fallback.
  const drawRecord = seat >= 0 ? art.players[seat] : null;
  try {
    const bodyFrame = HeroAttackBody.frame(art, pose, seat, image, x, y);
    ctx.drawImage(...bodyFrame.source, ...bodyFrame.destination);
    if (!bodyFrame.contact && actionAtlasReady && drawRecord?.hero === pose.hero && drawRecord.state === pose.state)
      art.confirmPresentation(drawRecord, seat, pose.frame);
    if (activeModes10() && !p.musicianNpc) {
      const poseKey = seat >= 0 ? 'player_' + seat : 'follower_' + pose.hero;
      art.poses[poseKey] = {...pose, state: actionAtlasReady ? pose.state : 'idle'};
    }
  } finally { ctx.restore(); }
};

const musicianNpcV1 = drawDetailedNPC;
drawDetailedNPC = function(n, x, y) {
  const hero = n.id === 'c3_synth_npc' ? 'synth' : n.id === 'c3_percussion_npc' ? 'percussion' : null;
  if (!hero) return musicianNpcV1(n, x, y);
  const prepared = MusicianArtV1.prepare(hero);
  if (prepared) prepared.state = n.musicianState || 'idle';
  const pose = typeof c3NpcPose === 'function' ? c3NpcPose(n) : {dir: n.dir || 'down'};
  const image = MusicianArtV1.image(MusicianArtV1.key(hero, MusicianArtV1.variant(hero), 'idle'));
  if (!image?.complete || !image.naturalWidth) {
    globalThis.FinalAssetLoadingV1?.requireImage(image, hero + ' · idle'); return;
  }
  return drawActor({style: hero, dir: pose.dir, musicianState: n.musicianState, musicianNpc: true}, x, y, false);
};

const musicianPortraitV1 = portraitURI10;
portraitURI10 = function(id) { return MusicianArtV1.portrait(id, 'neutral') || musicianPortraitV1(id); };
const musicianDialogueV1 = advanceDialogue;
advanceDialogue = function(...args) {
  const line = mode === 'dialogue' ? dialogueQueue[0] : null, result = musicianDialogueV1(...args);
  if (mode === 'dialogue' && line && MusicianArtV1.supports(line.who)) {
    const portrait = MusicianArtV1.portrait(line.who, line.expression || 'speaking');
    if (portrait) $('portrait').src = portrait;
  }
  return result;
};
