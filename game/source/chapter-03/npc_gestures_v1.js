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

// Four Chapter 3 residents now have authored breathing/blink/hand gestures.
// Existing directional walking is retained and its source aspect ratio preserved.
const C3AmbientGesturesV2={
 source:__NPC_C3_GESTURES_URI__,image:null,
 ready(){if(!this.image){this.image=new Image();this.image.src=this.source}return this.image.complete&&this.image.naturalWidth>0},
 frame(p){
  if(p.blink)return 2;
  if(['gesture','work'].includes(p.state))return Math.min(5,Math.floor(Math.max(0,p.gesturePhase)*6));
  // A short settling motion, separated by a quiet hold; never a walking cycle.
  const phase=((p.clock||0)+(p.phaseOffset||0))%7;
  return phase>5.8?Math.min(5,Math.floor((phase-5.8)*5)):0;
 },
 render(row,n,x,y,p){
  if(p.moving||p.walking||p.dir!=='down'||!this.ready())return false;
  ctx.save();ctx.imageSmoothingEnabled=false;
  ctx.drawImage(this.image,this.frame(p)*256,row*256,256,256,Math.round(x-34),Math.round(y-82),68,82);
  ctx.restore();return true;
 }
};
for(const [row,id]of ['c3_resident','c3_resident_b','c3_canal_worker','c3_plant_operator'].entries()){
 NpcLifeV1.registerAppearance(id,{ready:()=>C3AmbientGesturesV2.ready()&&NpcLifeV1.ready(C3.images[NpcLifeV1.ambientImage({id})]),walk:true,directional:true,render:(n,x,y,p)=>C3AmbientGesturesV2.render(row,n,x,y,p)});
}
