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
  images: {}, recent: [], players: [null, null], game: null, area: null, clock: 0,
  supports(id) { return Object.prototype.hasOwnProperty.call(this.heroes, id); },
  variant(id, override) {
    return ['masked','unmasked'].includes(override) ? override : this.variants[id] || 'unmasked';
  },
  setVariant(id, variant) {
    if (!this.supports(id) || !['masked','unmasked'].includes(variant)) return false;
    this.variants[id] = variant;
    return true;
  },
  key(id, variant, state) { return this.heroes[id] + '_' + variant + '_' + state; },
  image(key) {
    if (!this.assets[key]) return null;
    this.recent = this.recent.filter(item => item !== key); this.recent.push(key);
    if (!this.images[key]) {
      const image = new Image(); image.src = this.assets[key]; this.images[key] = image;
    }
    while (this.recent.length > 8) { const old = this.recent.shift(); delete this.images[old]; }
    return this.images[key];
  },
  reset() { this.players = [null, null]; this.game = G; this.area = G?.area; },
  sync() {
    if (this.game !== G || this.area !== G?.area) this.reset();
    for (let seat = 0; seat < 2; seat++) {
      const hero = seat === 0 ? G?.active : C3.coopMember();
      const record = this.players[seat];
      if (record && (record.hero !== hero || (record.state === 'defeat' && G?.hp?.[record.hero] > 0)))
        this.players[seat] = null;
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
    this.image(this.key(hero, this.variant(hero), state));
    this.players[seat] = {hero, state, duration: Math.max(.05, Number(duration) || .3),
      elapsed: 0, direction: this.directions.includes(direction) ? direction : 'down'};
  },
  playerAt(p, x, y) {
    if (!G || p.musicianNpc) return -1;
    const near = body => Math.abs(x - (body.x * T - cam.x)) < 2 && Math.abs(y - (body.y * T - cam.y)) < 2;
    if (C3.coopActive() && p.style === C3.coopMember() && near(C3.coop)) return 1;
    return p.style === G.active && near(G) ? 0 : -1;
  },
  pose(p, seat, moving) {
    const hero = p.style, c = C3.coop, playing = activeModes10();
    const record = seat >= 0 ? this.players[seat] : null;
    let state = 'idle', direction = p.dir || 'down', frame = 0;
    const roll = seat === 1 && c.rollHero === hero && c.dash > 0
      ? {left: c.dash, duration: c.rollDuration, direction: c.dir}
      : seat === 0 && Input121.roll?.id === hero && Combat10.dashTime > 0
        ? {left: Combat10.dashTime, duration: Input121.roll.duration, direction: G.dir} : null;
    if (roll) {
      state = 'roll'; direction = roll.direction;
      frame = Math.min(7, Math.max(0, Math.floor((1 - roll.left / Math.max(.01, roll.duration)) * 8)));
    } else if (record?.hero === hero && (record.elapsed < record.duration || record.state === 'defeat')) {
      state = record.state; direction = record.direction;
      frame = Math.min(7, Math.floor(record.elapsed / record.duration * 8));
    } else if (p.musicianState === 'performance') {
      state = 'performance'; frame = playing ? Math.floor(this.clock / .085) % 8 : 0;
    } else if (playing && moving && !p.musicianNpc) {
      state = (seat === 1 ? c.running : G?.isRunning10) ? 'run' : 'walk';
      const stride = seat === 1 ? c.stride || 0 : stride10;
      frame = Math.floor(stride * (state === 'run' ? 3.2 : 3.6)) % 8;
    } else frame = playing ? Math.floor(this.clock / .12) % 8 : 0;
    direction = this.directions.includes(direction) ? direction : 'down';
    return {hero, variant: this.variant(hero, p.musicianVariant), state, direction, frame,
      row: this.directions.indexOf(direction)};
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
  let image = art.image(art.key(pose.hero, pose.variant, pose.state));
  if (!image?.complete || !image.naturalWidth) {
    image = art.image(art.key(pose.hero, pose.variant, 'idle')); pose.frame = 0;
  }
  if (!image?.complete || !image.naturalWidth) return musicianActorV1(p, x, y, moving);
  ctx.save(); ctx.imageSmoothingEnabled = false;
  const seat = art.playerAt(p, x, y), hit = seat === 1 ? C3.coop.hit : seat === 0 ? act.hit : 0;
  if (hit > 0 && !G?.options10?.reducedMotion && Math.floor(tick * 24) % 2 === 0) ctx.globalAlpha = .48;
  // Uniform square draw: (128,224) meets the legacy ground point at (x,y+11).
  ctx.drawImage(image, pose.frame * 256, pose.row * 256, 256, 256,
    Math.round(x - 44), Math.round(y + 11 - 77), 88, 88);
  ctx.restore();
};

const musicianNpcV1 = drawDetailedNPC;
drawDetailedNPC = function(n, x, y) {
  const hero = n.id === 'c3_synth_npc' ? 'synth' : n.id === 'c3_percussion_npc' ? 'percussion' : null;
  if (!hero) return musicianNpcV1(n, x, y);
  const pose = typeof c3NpcPose === 'function' ? c3NpcPose(n) : {dir: n.dir || 'down'};
  const image = MusicianArtV1.image(MusicianArtV1.key(hero, MusicianArtV1.variant(hero), 'idle'));
  if (!image?.complete || !image.naturalWidth) return musicianNpcV1(n, x, y);
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
