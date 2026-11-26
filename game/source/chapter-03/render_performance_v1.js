/* Skip only tree raster work whose full authored/wind envelope is outside the
 * viewport. No animation, visibility density or simulation clock is reduced. */
(function(){
'use strict';
const previousTree=drawTree;
const api={enabled:true,visited:0,skipped:0,
 reset(){this.visited=this.skipped=0},
 outsideTree(x,y,large){
  // The current canopy pass clips to 196×240 / 90×116; the maximum wind
  // shear adds fewer than four pixels. Trunks and all legacy fallbacks end
  // at y+9. Padding keeps partially visible edge pixels in the original pass.
  const radius=large?112:56,height=large?244:120;
  if(!(x+radius<0||x-radius>VW||y+16<0||y-height>VH))return false;
  // Custom transforms, shadows or filters may move/expand that envelope.
  // Keep the original renderer in these uncommon contexts.
  if(ctx.globalCompositeOperation!=='source-over'||ctx.filter!=='none'||ctx.shadowBlur||ctx.shadowOffsetX||ctx.shadowOffsetY)return false;
  const m=ctx.getTransform();
  return m.a===1&&m.b===0&&m.c===0&&m.d===1&&m.e===0&&m.f===0;
 }
};
drawTree=function(x,y,large=false,v=.4){
 api.visited++;
 if(api.enabled&&api.outsideTree(x,y,large)){api.skipped++;return}
 return previousTree.apply(this,arguments);
};
window.RenderPerformanceV1=api;
})();
