// The same old flash factory serves fighters, enemies, scenery and boss deaths.
// Keep attribution on the flash itself so a later switch or coop cast cannot
// choose which player's geometry survives the draw.
const HeroLegacyFX = {
  actor: null,
  worldOverlay: false,
  // All allied spell geometry is submitted before the map draws the actors.
  // Their own transparent sprites become the mask (including both coop seats),
  // with no offscreen textures, guessed hitboxes or per-character clipping.
  drawGround() {
    if (!G) return;
    drawMusicianFloorCues();
    drawHeroRings(true);
    drawEquipmentCues();
    drawSignatureCues();
    drawHeroSwipe();
    drawCoopWeaponCue();
    HeroAttackFX.draw();
    drawAlliedProjectiles();
    drawVfx(0, true);
  },
  drawOverlay() {
    this.worldOverlay = true;
    try { drawCombatLayer(); }
    finally { this.worldOverlay = false; }
  },
  withActor(hero, emit) {
    const previous = this.actor;
    this.actor = hero;
    try { return emit(); }
    finally { this.actor = previous; }
  },
  ready(hero) {
    return Boolean(hero && HeroAttackFX.ready(hero));
  },
  ringOwner(kind) {
    return ['strike', 'pulse', 'duo'].includes(kind) ? this.actor : null;
  },
  effectOwner(type) {
    switch (type) {
      // Reactive attacks and zone beats can happen after their caster switches.
      case 'drumBreak': case 'drumCounter': case 'drumFinish': case 'drumBeat':
        return 'percussion';
      case 'synthWave': case 'synthFilter': case 'synthPad':
        return 'synth';
      case 'counter': case 'katanaA': case 'katanaB': case 'iai': case 'guard':
        return 'katana';
      case 'thrust':
        return this.actor; // Katana P1 or Ryuchi P2.
      default:
        return null; // Includes bow, dash and unowned feedback.
    }
  }
};
