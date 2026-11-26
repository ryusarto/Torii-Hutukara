/* Ponte das Frequências. Arte procedural no Canvas em pixels lógicos.
 * A área de passagem é dividida em quatro módulos, crescentes de oeste a leste.
 * A origem da ponte é o canto da água e a das estações é o centro no chão. */
const BridgeArt = (() => {
  'use strict';
  const colors = {
    deep: '#35251f',
    shadow: '#543825',
    bark: '#63452d',
    edge: '#a57548',
    shine: '#c89a62',
    rope: '#be9b6c',
    moss: '#65734b',
    mossDark: '#454e35',
    gold: '#ffe0a0',
    foam: '#a3c9b0',
    water: '#519a99'
  };
  const boards = ['#986b46', '#875939', '#a5754c', '#96603f', '#8f6443'];

  const sprites=__BRIDGE_SPRITES__;
  const images=new Map();
  const files=Object.keys(sprites.files||{});
  let primed=false;
  function image(file) {
    if(!file)return null;
    if(!images.has(file)){
      const img=new Image();
      img.src=sprites.files[file];
      images.set(file,img);
    }
    const img=images.get(file);
    return img.complete&&img.naturalWidth>0?img:null;
  }

  function drawDeck(ctx,x,y,w,h,progress,direction) {
    const art=sprites.bridge;
    if(!art)return false;
    const frames=direction<0?art.desmonte:art.montagem;
    const phase=direction<0?1-progress:progress;
    const stage=Math.min(frames.length-1,Math.floor(phase*frames.length));
    const file=progress===1||direction<0&&progress>.92?art.stable:frames[stage];
    const img=image(file);
    if(!img)return false;
    const [left,top,deckW,deckH]=art.deckRect;
    const sx=w/deckW,sy=h/deckH;
    ctx.drawImage(img,Math.round(x-left*sx),Math.round(y-top*sy),Math.round(img.naturalWidth*sx),Math.round(img.naturalHeight*sy));
    return true;
  }

  function drawObject(ctx,x,y,kind,active,time,reducedMotion) {
    const names={log:'tronco',stone:'pedra',bell:'sino',marker:'marco'};
    const art=sprites.stations?.[names[kind]],img=image(art?.file);
    if(!img)return false;
    const [px,py]=art.pivot;
    shadeFoot(ctx,x,y,kind==='stone'?14:17);
    const recoil=reducedMotion?0:Math.round(Math.sin(time*32)*active);
    const left=x-px+(kind==='bell'?recoil:0),top=y-py-(kind==='log'?Math.abs(recoil):0);
    ctx.drawImage(img,left,top);
    if(active>.12)fade(ctx,active*.36,()=>{
      ctx.globalCompositeOperation='lighter';
      ctx.drawImage(img,left,top);
    });
    return true;
  }

  function rect(ctx, x, y, w, h, color) {
    if (w <= 0 || h <= 0) return;
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function shape(ctx, x, y, points, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(Math.round(x + points[0][0]), Math.round(y + points[0][1]));
    for (const [px, py] of points.slice(1)) ctx.lineTo(Math.round(x + px), Math.round(y + py));
    ctx.closePath();
    ctx.fill();
  }

  function fade(ctx, alpha, draw) {
    ctx.save();
    ctx.globalAlpha *= Math.max(0, Math.min(1, alpha));
    draw();
    ctx.restore();
  }

  function ripple(ctx, x, y, size, alpha) {
    fade(ctx, alpha, () => {
      rect(ctx, x - size + 4, y - 3, size * 2 - 8, 1, colors.water);
      rect(ctx, x - size, y - 1, 5, 1, colors.foam);
      rect(ctx, x + size - 5, y - 1, 5, 1, colors.foam);
      rect(ctx, x - size + 2, y + 2, 6, 1, colors.water);
      rect(ctx, x + size - 8, y + 2, 6, 1, colors.water);
      rect(ctx, x - size + 7, y + 4, size * 2 - 14, 1, colors.foam);
    });
  }

  function support(ctx, x, y, w, p, movement) {
    const extend = Math.round(w * Math.min(1, p * 2.6));
    const sinking = movement < 0 ? 1 - p : 0;
    const lift = Math.round(6 * sinking + 6 * Math.max(0, .65 - p));
    if (extend < 1) return;
    const wood = [colors.deep, colors.shadow, colors.edge];
    for (const offset of [0, 9, 18]) {
      const length = Math.max(0, extend - (offset % 7));
      rect(ctx, x, y + lift + offset, length, 4, wood[offset / 9]);
      rect(ctx, x + 3, y + lift + offset, Math.max(0, length - 7), 1, colors.bark);
      rect(ctx, x + length - 2, y + lift + offset + 2, 2, 3, colors.rope);
    }
  }

  function plank(ctx, x, y, w, height, row, index, p, movement) {
    const tone = boards[(row * 3 + index * 2) % boards.length];
    const slide = Math.round((1 - p) * (movement < 0 ? 9 : 6));
    const drift = Math.round((1 - p) * ((row % 3) - 1) * (movement < 0 ? 5 : 2));
    const xx = x + drift;
    const yy = y + slide;
    fade(ctx, .28 + .72 * p, () => {
      rect(ctx, xx, yy, w, height + 1, colors.deep);
      rect(ctx, xx, yy + 1, w, Math.max(1, height - 1), tone);
      rect(ctx, xx + (row % 2), yy + 1, w - 1, 1, colors.shine);
      rect(ctx, xx + 2 + (row * 3 + index) % 6, yy + 3, w * .26, 1, colors.edge);
      rect(ctx, xx + w * .49, yy + height - 2, w * .38, 1, colors.shadow);
      rect(ctx, xx + w * .60, yy + height - 3, 3, 1, colors.edge);
      rect(ctx, xx + 2, yy + 3, 2, 2, colors.deep);
      rect(ctx, xx + w - 4, yy + 3, 2, 2, colors.deep);
      rect(ctx, xx + 2, yy + 3, 1, 1, colors.rope);
      rect(ctx, xx + w - 4, yy + 3, 1, 1, colors.rope);
      if ((row + index * 2) % 4 === 0) {
        rect(ctx, xx + w - 7, yy + height - 1, 5, 2, colors.mossDark);
        rect(ctx, xx + w - 6, yy + height - 1, 3, 1, colors.moss);
      }
    });
  }

  function edge(ctx, x, y, w, index, p) {
    const growth = Math.ceil(w * p);
    rect(ctx, x, y, growth, 4, colors.deep);
    rect(ctx, x, y, growth, 2, colors.edge);
    rect(ctx, x, y + 3, growth, 1, colors.bark);
    for (const k of [.15, .77]) {
      const pin = Math.round(w * k);
      if (growth <= pin) continue;
      rect(ctx, x + pin, y, 2, 4, colors.shadow);
      rect(ctx, x + pin, y, 1, 3, colors.rope);
    }
    if ((index & 1) === 1 && growth > 10) rect(ctx, x + 7, y + 1, 5, 2, colors.mossDark);
  }

  function sparkle(ctx, x, y, alpha, size) {
    fade(ctx, alpha, () => {
      rect(ctx, x, y - size, 1, size * 2 + 1, colors.gold);
      rect(ctx, x - size, y, size * 2 + 1, 1, colors.gold);
      rect(ctx, x, y, 1, 1, '#fff1ce');
    });
  }

  function draw(ctx, visual) {
    const {x, y, w, h, segments, time, complete, reducedMotion} = visual;
    const width = w / segments.length;
    if(!primed){primed=true;files.forEach(image)}

    let hasMotion = false;
    ctx.save();
    ctx.imageSmoothingEnabled = false;

    // The submerged roots and wake belong to the water layer, below all deck pieces.
    segments.forEach(({progress, direction}, index) => {
      if (progress <= 0) return;
      const sx = x + width * index;
      const p = reducedMotion ? Number(progress > 0) : progress;
      if (direction) hasMotion = true;
      if (direction && !reducedMotion) {
        const reach = 8 + Math.round((direction < 0 ? 1 - p : p) * 13);
        const glow = .62 * Math.sin(p * Math.PI);
        ripple(ctx, sx + width * .53, y + 14, reach, glow);
        ripple(ctx, sx + width * .70, y + h + 5, reach + 4, glow);
        ripple(ctx, sx + width * .52, y + h * .54, reach * .72, glow * .8);
        for (let i = 0; i < 5; i++) {
          const scatter = direction < 0 ? 1 - p : p;
          const dropX = sx + 5 + ((i * 11 + index * 3) % 20) + (i - 2) * scatter * 3;
          const dropY = y + h * (i % 2 ? .83 : .22) + (direction < 0 ? scatter * 9 : -10 * Math.sin(scatter * Math.PI));
          fade(ctx, glow * .85, () => rect(ctx, dropX, dropY, i % 2 ? 2 : 1, 1, colors.foam));
        }
      }
      fade(ctx, .46 * p, () => rect(ctx, sx + 1, y + 7, width, h + 2, '#162628'));
      for (const offset of [3, h * .31, h * .59, h - 18]) support(ctx, sx, y + offset, width, p, direction);
    });

    segments.forEach(({progress, direction}, index) => {
      if (progress <= 0) return;
      const sx = x + width * index;
      const p = reducedMotion ? 1 : progress;
      if (!drawDeck(ctx,sx,y,width,h,p,direction)) {
        const rowCount = 12;
        for (let row = 0; row < rowCount; row++) {
          // A plank next to the center settles slightly before the outer planks.
          // On loss the outer boards depart first and expose the roots below.
          const stagger = Math.abs(row - 5.5) * .029 + (row % 3) * .022;
          const local = Math.max(0, Math.min(1, (p - .26 - stagger) / (.50 - stagger)));
          if (local <= 0) continue;
          const top = Math.round(h * row / rowCount);
          const bottom = Math.round(h * (row + 1) / rowCount);
          plank(ctx, sx, y + top, width, bottom - top, row, index, local, direction);
        }
        const bind = Math.max(0, (p - .46) / .54);
        if (bind > 0) {
          edge(ctx, sx, y, width, index, bind);
          edge(ctx, sx, y + h - 4, width, index, bind);
        }
      }
      if (direction > 0 && !reducedMotion && p > .68 && p < .99) {
        const glint = Math.sin(((p - .68) / .31) * Math.PI);
        sparkle(ctx, sx + width - 4, y + 5, glint, 2);
        sparkle(ctx, sx + width - 5, y + h - 5, glint * .85, 2);
        if (index === segments.length - 1) {
          sparkle(ctx, sx + width * .48, y + h * .35, glint * .85, 3);
          sparkle(ctx, sx + width * .85, y + h * .68, glint * .62, 2);
        }
      }
    });

    if ((complete || hasMotion) && !reducedMotion) {
      // Small reflected pixels drift beside the deck; the lane stays readable.
      const wave = Math.floor(time * 5) % 12;
      fade(ctx, .17, () => {
        rect(ctx, x + 9 + wave, y + h + 7, 7, 1, colors.foam);
        if (complete) rect(ctx, x + w - 16 - wave, y - 6, 9, 1, colors.foam);
      });
    }
    ctx.restore();
  }

  function log(ctx, x, y, active) {
    shadeFoot(ctx, x, y, 17);
    shape(ctx, x, y, [[-17,-10],[-12,-20],[-1,-23],[11,-21],[18,-15],[19,-7],[13,-2],[-9,0],[-16,-4]], colors.deep);
    shape(ctx, x, y, [[-15,-12],[-10,-19],[1,-21],[11,-19],[16,-16],[10,-9],[-13,-7]], colors.edge);
    shape(ctx, x, y, [[-15,-11],[-4,-13],[11,-11],[13,-6],[7,-3],[-12,-3],[-16,-7]], colors.bark);
    rect(ctx, x - 11, y - 17, 14, 1, colors.shine);
    rect(ctx, x - 8, y - 14, 12, 2, colors.shadow);
    rect(ctx, x - 9, y - 7, 13, 1, colors.edge);
    rect(ctx, x - 13, y - 16, 5, 3, colors.mossDark);
    rect(ctx, x - 12, y - 17, 5, 2, colors.moss);
    shape(ctx, x, y, [[9,-19],[15,-18],[19,-14],[20,-7],[16,-3],[11,-3],[7,-7],[7,-14]], colors.shine);
    shape(ctx, x, y, [[10,-16],[15,-16],[17,-13],[17,-7],[15,-5],[11,-5],[9,-8],[9,-13]], colors.shadow);
    shape(ctx, x, y, [[11,-13],[15,-13],[16,-11],[16,-8],[14,-7],[11,-8],[10,-11]], active > .2 ? colors.gold : colors.deep);
  }

  function stone(ctx, x, y, active) {
    shadeFoot(ctx, x, y, 16);
    shape(ctx, x, y, [[-15,-4],[-13,-13],[-8,-31],[-3,-40],[4,-37],[10,-28],[15,-9],[13,-2],[2,1],[-9,0]], '#2c3b39');
    shape(ctx, x, y, [[-12,-7],[-8,-23],[-3,-37],[3,-35],[8,-28],[12,-13],[11,-5],[1,-2]], '#708277');
    shape(ctx, x, y, [[-12,-7],[-7,-25],[-3,-35],[-2,-20],[1,-4],[-8,-2]], '#52685e');
    shape(ctx, x, y, [[4,-32],[8,-23],[11,-10],[8,-6],[3,-17]], '#9aaa8e');
    rect(ctx, x - 11, y - 5, 8, 2, colors.mossDark);
    rect(ctx, x - 9, y - 6, 5, 1, colors.moss);
    const split = active > .12 ? '#afd9a1' : '#3f594e';
    for (const [dx, dy, width, height] of [[1,-26,1,5],[0,-21,2,2],[-1,-19,2,5],[0,-14,4,2],[2,-12,2,5],[1,-7,3,2]]) {
      rect(ctx, x + dx, y + dy, width, height, split);
    }
  }

  function bell(ctx, x, y, active, time, reducedMotion) {
    shadeFoot(ctx, x, y, 17);
    shape(ctx, x, y, [[-15,0],[-16,-8],[-15,-26],[-13,-38],[-9,-41],[-7,-37],[-1,-40],[11,-39],[15,-34],[14,-28],[10,-30],[8,-33],[-8,-31],[-10,-17],[-8,-3],[-11,1]], colors.deep);
    shape(ctx, x, y, [[-14,-3],[-13,-28],[-11,-38],[-8,-36],[-1,-38],[10,-37],[12,-33],[8,-34],[0,-33],[-10,-30],[-12,-4]], colors.edge);
    rect(ctx, x - 14, y - 15, 2, 11, colors.shadow);
    rect(ctx, x - 13, y - 29, 2, 10, colors.shine);
    rect(ctx, x - 5, y - 36, 8, 1, colors.shine);
    rect(ctx, x - 12, y - 4, 8, 2, colors.moss);
    const swing = reducedMotion ? 0 : Math.round(Math.sin(time * 23) * 3.5 * active);
    rect(ctx, x, y - 33, 2, 7, colors.rope);
    shape(ctx, x + swing, y, [[-5,-28],[4,-28],[7,-23],[8,-17],[10,-14],[10,-11],[-9,-11],[-9,-14],[-7,-17],[-7,-23]], colors.deep);
    shape(ctx, x + swing, y, [[-5,-26],[3,-26],[6,-23],[6,-17],[8,-14],[-7,-14],[-5,-18]], colors.shine);
    rect(ctx, x + swing - 2, y - 24, 6, 7, colors.edge);
    rect(ctx, x + swing - 6, y - 15, 13, 1, colors.rope);
    rect(ctx, x + swing - 1, y - 12, 3, 3, active > .2 ? colors.gold : colors.edge);
  }

  function shadeFoot(ctx, x, y, radius) {
    fade(ctx, .5, () => {
      rect(ctx, x - radius + 4, y - 4, radius * 2 - 8, 8, '#20372b');
      rect(ctx, x - radius, y - 2, radius * 2, 4, '#20372b');
    });
  }

  function marker(ctx, x, y, active) {
    shadeFoot(ctx, x, y, 18);
    shape(ctx, x, y, [[-18,0],[-16,-8],[-12,-13],[-12,-25],[-9,-34],[-4,-38],[5,-37],[10,-34],[13,-24],[12,-12],[17,-6],[18,0]], colors.deep);
    shape(ctx, x, y, [[-14,-2],[-13,-7],[-9,-13],[-9,-24],[-7,-32],[-3,-36],[4,-35],[8,-32],[10,-24],[9,-12],[14,-6],[15,-2]], colors.edge);
    shape(ctx, x, y, [[-11,-5],[-6,-16],[-6,-27],[-3,-32],[4,-32],[7,-27],[7,-14],[11,-5]], colors.shadow);
    rect(ctx, x - 10, y - 24, 2, 12, colors.shine);
    rect(ctx, x + 7, y - 24, 2, 10, colors.shine);
    rect(ctx, x - 12, y - 7, 6, 3, colors.mossDark);
    rect(ctx, x + 7, y - 6, 7, 3, colors.moss);
    const light = active > .12 ? colors.gold : colors.rope;
    rect(ctx, x - 3, y - 26, 7, 1, light);
    rect(ctx, x - 5, y - 24, 1, 9, light);
    rect(ctx, x + 5, y - 24, 1, 9, light);
    rect(ctx, x - 3, y - 14, 7, 1, light);
    rect(ctx, x - 2, y - 22, 5, 5, active > .12 ? colors.gold : colors.bark);
    rect(ctx, x + 1, y - 21, 1, 3, colors.deep);
  }

  function drawStation(ctx, visual) {
    const {x, y, kind, active, near, time, reducedMotion} = visual;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (!drawObject(ctx,x,y,kind,active,time,reducedMotion)) {
      if (kind === 'log') log(ctx, x, y, active);
      if (kind === 'stone') stone(ctx, x, y, active);
      if (kind === 'bell') bell(ctx, x, y, active, time, reducedMotion);
      if (kind === 'marker') marker(ctx, x, y, active);
    }
    // Luz alinhada ao chão e ao sprite, sem plaquetas flutuantes.
    const shimmer=reducedMotion?0:(1+Math.sin(time*2.6+x*.04))*.13;
    const glow=Math.min(1,(near?.62:.25)+shimmer+active*.64);
    fade(ctx,glow,()=>{
      rect(ctx,x-14,y+2,7,1,colors.shine);
      rect(ctx,x+8,y+2,7,1,colors.shine);
      rect(ctx,x-7,y+4,15,1,colors.gold);
      if(active>.24){
        rect(ctx,x-18,y-1,6,1,colors.gold);
        rect(ctx,x+13,y-1,6,1,colors.gold);
      }
    });
    if(active>0&&!reducedMotion){
      ripple(ctx,x,y+4,12+Math.round(8*(1-active)),active*.65);
      sparkle(ctx,x+13,y-4-Math.round(14*(1-active)),active,2);
    }
    ctx.restore();
  }

  return Object.freeze({draw, drawStation, ready:()=>files.length>0&&files.map(image).every(Boolean)});
})();
