/* Authored quiet gestures for the six original city residents. These actors
 * remain anchored: a frontal idle sheet is never treated as walking art. */
'use strict';
const NpcGesturesV1 = {
  source: __NPC_GESTURES_URI__, image: null,
  ready() {
    if (!this.image) { this.image = new Image(); this.image.src = this.source; }
    return this.image.complete && this.image.naturalWidth > 0;
  },
  frame(pose) {
    if (['gesture', 'work'].includes(pose.state) && pose.gesturePhase > .18 && pose.gesturePhase < .86) return 3;
    if (pose.blink) return 2;
    return pose.state === 'look' && pose.dir !== 'down' ? 1 : 0;
  },
  render(row, n, x, y, pose) {
    if (!this.ready()) return false;
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.image, this.frame(pose) * 112, row * 140, 112, 140, Math.round(x - 28), Math.round(y - 57), 56, 70);
    ctx.restore(); return true;
  }
};
for (const [row, id] of ['ema', 'child', 'merchant', 'archivist', 'street', 'brdg'].entries()) {
  NpcLifeV1.registerAppearance('city/' + id, {ready: () => NpcGesturesV1.ready(), walk: false, directional: false,
    render: (n, x, y, pose) => NpcGesturesV1.render(row, n, x, y, pose)});
}
