/* Authored 2D animation atlas integration. Visual state is local to each player.
 * Gameplay damage, cooldowns, collision and save schema are unchanged.
 * Generated resources are embedded by build_alpha.rb for offline portability.
 */
'use strict';
const ProtagonistArtV5 = {
  assets: __PROTAGONIST_ASSETS__,
  manifest: __PROTAGONIST_MANIFEST__,
  images: {}, recent: [], warmed: new Set(), players: [null, null], shots: [0, 0], game: null, area: null,
  clock: 0,
  supports(id) { return id === 'franco' || id === 'ryuchi'; },
  image(name) {
    this.recent = this.recent.filter(key => key !== name); this.recent.push(name);
    if (!this.images[name]) { const image = new Image(); image.src = this.assets[name]; this.images[name] = image; }
    // Decode at most eight full-resolution sheets rather than all 24 on mobile.
    while (this.recent.length > 8) { const old = this.recent.shift(); delete this.images[old]; }
    return this.images[name];
  },
  reset() { this.players = [null, null]; this.shots = [0, 0]; this.game = G; this.area = G?.area; },
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
    const playing = activeModes10();
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
      const stride = seat === 1 ? c.stride || 0 : stride10;
      frame = Math.floor(stride * (state === 'run' ? 3.2 : 3.6)) % 8;
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
  return protagonistUpdateV5(dt);
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
  if (!image.complete || !image.naturalWidth) { image = art.image(pose.hero + '_idle'); pose.frame = 0; }
  if (!image?.complete || !image.naturalWidth) return protagonistActorV5(p, x, y, moving);
  ctx.save(); ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#10152344'; ctx.beginPath(); ctx.ellipse(x, y + 10, 12, 3, 0, 0, Math.PI * 2); ctx.fill();
  const hit = seat === 1 ? C3.coop.hit : seat === 0 ? act.hit : 0;
  if (hit > 0 && !G?.options10?.reducedMotion && Math.floor(tick * 24) % 2 === 0) ctx.globalAlpha = .48;
  // Uniform square scale. Pivot (128,224) lands at the same ground point as legacy actors.
  ctx.drawImage(image, pose.frame * 256, pose.row * 256, 256, 256, Math.round(x - 44), Math.round(y + 11 - 77), 88, 88);
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
