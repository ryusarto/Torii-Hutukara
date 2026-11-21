/* Studio furniture and cinematic presentation. No quest/save state is added. */
'use strict';
const WorldPolishV1 = {
  assets: __WORLD_POLISH_ASSETS__, images: {},
  image(key) {
    if (!this.images[key]) { const image = new Image(); image.src = this.assets[key]; this.images[key] = image; }
    return this.images[key];
  },
  ready() { return Promise.all(['sofa_vertical', 'plant_potted'].map(key => this.image(key).decode())); },
  repairStudioSpawn() {
    // A pre-1.8 save may stand on tiles newly occupied by the vertical seat.
    // Repair only that changed footprint; ordinary positions stay exact.
    if (G?.area !== 'studio' || !current?.worldPolishV1 ||
        G.x < 1.7 || G.x > 5.3 || G.y < 5.7 || G.y > 12.3 || canBody121(G.x, G.y)) return false;
    const safe = safeSpawn121(G.x, G.y);
    if (!safe) return false;
    G.x = safe.x; G.y = safe.y; trail = []; resetMotion10();
    cam.x = current.w * T < VW ? (current.w * T - VW) / 2 : clamp(G.x * T - VW / 2, 0, current.w * T - VW);
    cam.y = current.h * T < VH ? (current.h * T - VH) / 2 : clamp(G.y * T - VH / 2, 0, current.h * T - VH);
    return true;
  },
  installStudio() {
    const studio = areas.studio;
    if (!studio || studio.worldPolishV1) return;
    const sofa = studio.props.find(p => p.type === 'sofa');
    if (sofa) {
      // Remove only the known old footprint, then reserve the new long seat.
      for (let y = 5; y < 9; y++) for (let x = 2; x < 6; x++) studio.blocked.delete(x + ',' + y);
      sofa.x = 2; sofa.y = 6; sofa.worldGroundY = 12;
      for (let y = 6; y < 12; y++) for (let x = 2; x < 5; x++) studio.blocked.add(x + ',' + y);
    }
    studio.worldPolishV1 = true;
    for (const key of ['sofa_vertical', 'plant_potted']) this.image(key);
  },
  draw(key, x, ground, height) {
    const image = this.image(key);
    if (!image.complete || !image.naturalWidth) return false;
    const width = height * image.naturalWidth / image.naturalHeight;
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#17101b38'; ctx.beginPath(); ctx.ellipse(x, ground - 1, width * .38, key === 'plant_potted' ? 2 : 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.drawImage(image, Math.round(x - width / 2), Math.round(ground - height), width, height);
    ctx.restore(); return true;
  }
};
const polishBuildMapsV1 = buildMaps;
buildMaps = function(...args) { const result = polishBuildMapsV1(...args); WorldPolishV1.installStudio(); return result; };
const polishSetAreaV1 = setArea;
setArea = function(...args) { const result = polishSetAreaV1(...args); WorldPolishV1.repairStudioSpawn(); return result; };
const polishDrawPropV1 = drawProp;
drawProp = function(p, cx, cy) {
  if (G?.area === 'studio') {
    if (p.type === 'sofa' && WorldPolishV1.draw('sofa_vertical', (p.x + 1.5) * T - cx, (p.y + 6) * T - cy, 142)) return;
    if (p.type === 'plant' && WorldPolishV1.draw('plant_potted', (p.x + .5) * T - cx, (p.y + 1) * T - cy, 56)) return;
  }
  return polishDrawPropV1(p, cx, cy);
};
const polishStyleV1 = document.createElement('style');
polishStyleV1.textContent = `
  #cinema {image-rendering:auto;filter:none;}
  #cinema:after {background:linear-gradient(to bottom,rgba(12,10,20,.02) 0%,rgba(12,10,20,.03) 65%,rgba(12,10,20,.18) 100%);}
`;
document.head.appendChild(polishStyleV1);
