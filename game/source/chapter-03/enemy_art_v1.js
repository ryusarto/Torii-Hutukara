/* Discrete enemy poses; cosmetics never mutate actors, damage, saves or timing. */
'use strict';
const EnemyArtV1 = {
  assets: __ENEMY_ART_ASSETS__, manifest: __ENEMY_ART_MANIFEST__, images: {},
  records: new WeakMap(), game: null, area: null, clock: 0,
  supports(key) { return Object.hasOwn(this.manifest.enemies, key); },
  key(kind, entity) {
    if (entity && ['boss','voice_boss','c3_metronome','c3_silence'].includes(entity.id)) return entity.id;
    const key = this.supports(entity?.type) ? entity.type : kind;
    if (typeof C3 !== 'undefined' && C3.AREAS.includes(G?.area) && this.supports(key + '_c3')) return key + '_c3';
    return key;
  },
  image(key) {
    if (!this.images[key] && this.assets[key]) {
      const image = new Image(); image.src = this.assets[key]; this.images[key] = image;
    }
    return this.images[key];
  },
  reset() { this.records = new WeakMap(); this.game = G; this.area = G?.area; this.clock = 0; },
  pose(entity) {
    if (!entity) return 0;
    if (this.game !== G || this.area !== G?.area) this.reset();
    let r = this.records.get(entity);
    if (!r) { r = {preparing:false, strikeUntil:0}; this.records.set(entity,r); }
    const preparing = entity.wind > 0 || entity.tele09 > 0 || entity.retaliate > 0 || entity.echoWarning092 > 0;
    if (r.preparing && !preparing && mode === 'action') r.strikeUntil = this.clock + .22;
    r.preparing = preparing;
    if (entity.flash > 0 || entity.stun > 0) return 3;
    if (preparing) return 1;
    if (r.strikeUntil > this.clock) return 2;
    return 0;
  },
  draw(x, y, kind, entity) {
    const key = this.key(kind,entity), entry = this.manifest.enemies[key];
    if (!entry) return false;
    const image = this.image(key);
    if (!image?.complete || !image.naturalWidth) return false;
    const pose = this.pose(entity), cell = this.manifest.cell, [px,py] = this.manifest.pivot;
    const scale = entry.height / cell;
    ctx.save(); ctx.imageSmoothingEnabled = false;
    if (entity?.emerge091 > 0) ctx.globalAlpha *= Math.max(.1,1-entity.emerge091);
    ctx.drawImage(image,(pose%2)*cell,Math.floor(pose/2)*cell,cell,cell,
      Math.round(x-px*scale),Math.round(y-py*scale),Math.round(cell*scale),Math.round(cell*scale));
    ctx.restore(); return true;
  }
};
const enemyArtUpdateV1 = update;
update = function(dt) {
  if (EnemyArtV1.game !== G || EnemyArtV1.area !== G?.area) EnemyArtV1.reset();
  if (G && ['walk','action'].includes(mode)) EnemyArtV1.clock += Math.max(0,Math.min(dt,.1));
  return enemyArtUpdateV1(dt);
};
