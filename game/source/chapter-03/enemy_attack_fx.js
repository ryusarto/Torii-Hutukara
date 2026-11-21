// Small transparent sprite strips, drawn once in a fixed pixel-art palette.
// The simulation owns every release, hit area and travel vector.
'use strict';
const EnemyAttackFX = (() => {
  const cell = 40, frames = 8, strips = new Map();
  const palettes = {
    drum: ['#532f36','#c17d4e','#f8d998'],
    radio: ['#392f50','#cd7184','#f9dda3'],
    iron: ['#57382d','#d68c42','#fce8a2'],
    void: ['#39314c','#977db5','#f3dae5'],
    ghost: ['#2f3546','#68a9b5','#e0f1d8']
  };
  // Each attack has an instrument or motion silhouette visible during the cast.
  const bosses = {
    boss: {ring:'gong', fan:'claws', charge:'lance'},
    voice_boss: {lanes:'faders', feedback:'speaker', double_wave:'echo', volley:'bolts'},
    c3_metronome: {ring:'gear', cross:'pistons', fan:'ratchet', pulse:'pendulum'},
    c3_silence: {ring:'eclipse', cross:'fracture', fan:'feathers', pulse:'aperture',
      rain:'shards', chase:'comet', orbit:'satellites'}
  };
  const bossPalette = {boss:'drum', voice_boss:'radio', c3_metronome:'iron', c3_silence:'void'};
  const residents = {
    hush:['claws','void'], whisper:['wisp','ghost'], compasso:['pendulum','drum'],
    espelho:['mirror','ghost'], abafador:['bell','void'], c3_drone:['pistons','iron'],
    c3_echo:['fracture','radio']
  };
  const count = n => Array.from({length:n}, (_,i)=>i);
  function paint(q, shape, colors, f) {
    const [dark, mid, light] = colors;
    const t=f/7, open=f<4?2+f:9-(f-4), turn=t*1.1, pi=Math.PI;
    function polygon(points, fill=mid) {
      q.beginPath();
      points.forEach(([x,y],i)=>i?q.lineTo(Math.round(x),Math.round(y)):q.moveTo(Math.round(x),Math.round(y)));
      q.closePath(); q.fillStyle=fill; q.fill(); q.strokeStyle=dark; q.lineWidth=1; q.stroke();
    }
    function arc(x,y,r,start,end,ink,width=1) {
      q.beginPath();q.arc(x,y,r,start,end);q.strokeStyle=ink;q.lineWidth=width;q.stroke();
    }
    function bar(x,y,w,h,color) {q.fillStyle=color;q.fillRect(Math.round(x),Math.round(y),w,h);}
    function rotate(a,fn) {q.save();q.rotate(a);try{fn();}finally{q.restore();}}
    function tooth(r,wide=3) {
      polygon([[r-4,-wide],[r+2,-wide],[r+4,0],[r+2,wide],[r-4,wide]]);
      bar(r,-1,3,1,light);
    }
    function splinter(x,y,length) {
      polygon([[x-length,y+2],[x,y-2],[x+3,y],[x,y+2]]);
      bar(x,y-1,2,1,light);
    }
    function ring(r, inner=true) {
      arc(0,0,r,0,2*pi,dark,4);arc(0,0,r,0,2*pi,mid,2);
      arc(0,0,r,2.8+turn,4.3+turn,light,2);
      if(inner)arc(0,0,Math.max(1,r-3),.5,2.9,light);
    }
    switch(shape) {
      case 'gong':
        ring(6+open); ring(3+Math.floor(open/2),false);bar(-1,-1,3,3,light);break;
      case 'claws':
        for(const i of [-1,0,1])rotate(i*.31+turn*.45,()=>polygon([[-9,i*2],[2,-4-open/2],[10+open/2,-5],[4,0],[-6,4]],i?mid:light));break;
      case 'lance':
        for(const i of [-1,1])splinter(-3-open/2,i*5,7);
        polygon([[-14,1],[4,-3],[1,-6],[10+open,0],[1,5],[4,2]],light);break;
      case 'faders':
        for(const i of [-1,0,1]){const y=Math.round(Math.sin(turn*3+i*2)*6);bar(i*7-1,-13,3,26,dark);bar(i*7,-12,1,24,mid);bar(i*7-3,y,7,3,light);}break;
      case 'speaker':
        polygon([[-11,-12],[8,-10],[11,12],[-10,12]]);ring(4+open/2);bar(-6,-10,4,1,light);break;
      case 'echo':
        for(const i of [-1,1]){arc(i*4,0,5+open, i<0?1.9:-1.3,i<0?4.3:1.3,mid,3);arc(i*4,0,3+open/2,i<0?1.9:-1.3,i<0?4.3:1.3,light,2);}break;
      case 'bolts':
        for(const i of [-1,0,1])rotate(i*.36,()=>splinter(3+open,i*4,13));break;
      case 'gear':
        for(const i of count(8))rotate(turn+i*pi/4,()=>tooth(10+open/3,2));
        ring(8);ring(3,false);break;
      case 'pistons':
        for(const i of count(4))rotate(i*pi/2,()=>{bar(0,-1,8+open,3,dark);bar(2,0,6+open,1,light);tooth(6+open);});break;
      case 'ratchet':
        for(const i of [-1,0,1])rotate(i*.52+turn/2,()=>{bar(1,-1,9,2,light);tooth(8+open/2,3);});ring(3,false);break;
      case 'pendulum':
        polygon([[-9,12],[-2,-12],[2,-12],[9,12]]);
        rotate((t-.45)*1.6,()=>{bar(-1,-12,2,20,light);polygon([[-4,5],[0,1],[4,5],[0,11]],light);});break;
      case 'eclipse':
        ring(7+open/2);for(const i of count(3))rotate(turn+i*2*pi/3,()=>polygon([[6,0],[9,-5],[15,-3],[11,0],[9,4]],light));break;
      case 'fracture':
        for(const i of count(4))rotate(i*pi/2+.32,()=>polygon([[0,0],[4,-3],[6,0],[9+open,-3],[7,3],[5,2]],i%2?light:mid));break;
      case 'feathers':
        for(const i of [-2,-1,0,1,2])rotate(i*(.16+open*.025),()=>polygon([[-4,2],[5,-2],[9+open,-3],[7,1],[2,3]],i%2?mid:light));break;
      case 'aperture':
        for(const i of count(6))rotate(turn+i*pi/3,()=>polygon([[3+open/2,0],[8,-5],[13,-4],[14,2],[10,6]],i%2?mid:light));break;
      case 'shards':
        for(const i of [-1,0,1]){const y=(f*2+(i+1)*6)%16-8;
          polygon([[i*8,y-6],[i*8+3,y-2],[i*8+1,y+7],[i*8-2,y]],i?mid:light);}break;
      case 'comet': case 'wisp':
        for(const i of [-1,1])splinter(-3,i*(2+open/4),6+(i+1)*2);
        rotate(shape==='wisp'?turn*.6:0,()=>{polygon([[-9,2],[-2,-5],[4,-4],[7,0],[3,5],[-2,4]]);bar(0,-2,3,3,light);});
        arc(1,0,6+f*.4,-1+turn,1+turn,light);break;
      case 'satellites':
        ring(4,false);for(const i of count(6))rotate(turn+i*pi/3,()=>{arc(0,0,9+open/2,-.34,0,mid,2);bar(9+open/2,-1,3,3,light);});break;
      case 'mirror':
        for(const i of [-1,1])rotate(i*turn/2,()=>polygon([[i*2,-8],[i*(6+open/2),-12],[i*(7+open/2),3],[i*2,9]],i<0?light:mid));break;
      case 'baffle':
        for(const i of [-1,0,1]){const reach=3+Math.round((1+Math.sin(i*1.8+turn*3))*2);bar(i*4-1,-reach,3,reach*2+1,mid);bar(i*4-1,-reach,2,2,light);}break;
      case 'bell':
        polygon([[-9-open/3,7],[-6,2],[-5,-6],[0,-11],[5,-7],[7,2],[9+open/3,7]]);
        bar(-8,5,16,2,light);bar(-4+f,7+f%3,3,3,mid);break;
    }
  }
  function atlas(shape,palette) {
    const key=palette+'/'+shape;
    if(strips.has(key))return strips.get(key);
    const sheet=document.createElement('canvas');sheet.width=cell*frames;sheet.height=cell;
    const q=sheet.getContext('2d');
    for(let f=0;f<frames;f++){
      q.save();q.translate(cell*(f+.5),cell/2);paint(q,shape,palettes[palette],f);q.restore();
    }
    strips.set(key,sheet);return sheet;
  }
  function stamp(shape,palette,frame,x,y,size,angle=0) {
    const sheet=atlas(shape,palette);
    ctx.save();
    try {
      ctx.translate(Math.round(x),Math.round(y));ctx.rotate(angle);ctx.imageSmoothingEnabled=false;
      ctx.drawImage(sheet,frame*cell,0,cell,cell,-size/2,-size/2,size,size);
    } finally {ctx.restore();}
  }
  let normal = new WeakMap(), shotStyle = new WeakMap(), world, area;
  function sync() {
    if(world!==G||area!==G?.area){normal=new WeakMap();shotStyle=new WeakMap();world=G;area=G?.area;}
  }
  function observe(e,dt,isBoss,base,args,self) {
    if(!e||!G)return base.apply(self,args);
    sync();
    const shots=hostileShots.length, wind=e.wind||0, cd=e.cd||0, mirror=e.retaliate>0;
    const result=base.apply(self,args);
    if(isBoss&&e.id==='voice_boss')for(let i=shots;i<hostileShots.length;i++)shotStyle.set(hostileShots[i],'volley');
    if(!isBoss&&residents[e.type]&&e.hp>0&&mode==='action'){
      const now=EnemyArtV1.clock;
      if(e.wind>0&&wind<=0)normal.set(e,{start:now,duration:e.wind,mirror:e.retaliate>0,angle:Math.atan2(G.y-e.y,G.x-e.x)});
      const impact=wind>0&&!(e.wind>0)||e.type==='espelho'&&cd<=dt&&e.cd>dt;
      if(impact&&!(e.stun>0))normal.set(e,{release:now,mirror,angle:Math.atan2(G.y-e.y,G.x-e.x)});
    }
    return result;
  }
  function actor(x,y,e) {
    if(!e||!(e.hp>0)||!G)return;
    const reduced=BossChoreographyV2.reduced();
    if(bosses[e.id]){
      const pose=BossChoreographyV2.pose(e);
      const shape=bosses[e.id][pose?.spec.kind];
      if(!shape)return;
      const angle=pose.spec.angle??e.facing??0;
      const directional=['lance','claws','feathers','ratchet','bolts'].includes(shape);
      stamp(shape,bossPalette[e.id],pose.frame,x+Math.cos(angle)*12,y-30+Math.sin(angle)*7,50,directional?angle:0);
      return;
    }
    if(e.type==='abafador'){
      // Three damper vanes follow the existing mute-radius contour of 3.2 tiles.
      const phase=reduced?0:EnemyArtV1.clock*.35;
      for(const i of [0,1,2]){
        const a=phase+i*2*Math.PI/3;
        stamp('baffle','void',reduced?2:Math.floor(EnemyArtV1.clock*6)%frames,
          x+Math.cos(a)*3.2*T,y+6+Math.sin(a)*3.2*T*.55,16,a);
      }
    }
    const r=normal.get(e),style=residents[e.type];
    if(!style||!r||e.stun>0)return;
    let frame;
    if(e.wind>0&&r.duration)frame=reduced?2:Math.min(3,Math.floor(4*Math.max(0,1-e.wind/r.duration)));
    else if(r.release!=null&&EnemyArtV1.clock-r.release<.26)
      frame=reduced?5:Math.min(7,4+Math.floor((EnemyArtV1.clock-r.release)/.065));
    else return;
    const shape=e.type==='espelho'&&r.mirror?'echo':style[0],angle=r.angle;
    // Gather at the hand during windup, thrust into the strike, then recoil.
    const reach=[6,6,5,4,16,20,13,7][frame];
    stamp(shape,style[1],frame,x+Math.cos(angle)*reach,y-16+Math.sin(angle)*reach,30,shape==='claws'?angle:0);
  }
  function ground(g,progress,released) {
    const e=bossActor, palette=bossPalette[e?.id];
    if(!palette||BossChoreographyV2.cancelled(e))return;
    const h=BossGroundFXV1.contextHazard,record=BossChoreographyV2.records.get(e);
    const kind=h?.kind||(g.kind==='wave'?'double_wave':(released?record?.execution:record?.prep)?.kind);
    const shape=bosses[e.id][kind];
    if(!shape)return;
    // Ground details stay inside the already telegraphed hit geometry. Wave marks
    // follow the simulated radius, including the delayed second wave.
    let f=BossChoreographyV2.pose(e)?.frame??(released?6:Math.floor(Math.min(1,progress)*3));
    if(BossChoreographyV2.reduced())f=released?5:2;
    const phase=f/7, tile=T, size=g.kind==='lanes'||g.kind==='cross'?22:18;
    const mark=(wx,wy,angle=0)=>{
      const x=wx*tile-cam.x,y=wy*tile-cam.y;
      if(x>=-size&&x<=VW+size&&y>=-size&&y<=VH+size)stamp(shape,palette,f,x,y,size,angle);
    };
    ctx.save();
    try {
      if(!BossGroundFXV1.path(g))return;
      ctx.clip('nonzero');ctx.globalAlpha*=released?.85:.55;
      if(g.kind==='charge'){
        for(const i of [2,5,8]){const p=g.points[i],q=g.points[i+1];if(p&&q)mark(p.x,p.y,Math.atan2(q.y-p.y,q.x-p.x));}
      }else if(g.kind==='lanes'){
        for(const dx of [-4,0,4])for(const dy of [-3,0,3])mark(g.x+dx,g.y+dy+phase);
      }else if(g.kind==='cross'){
        for(const d of [-4,-2,2,4]){mark(g.x+d,g.y);mark(g.x,g.y+d,Math.PI/2);}
      }else if(g.kind==='sector'){
        const reach=g.r*(.32+phase*.55);
        for(const a of [-.7,0,.7]){const angle=g.angle+a*g.arc;mark(g.x+reach*Math.cos(angle),g.y+reach*Math.sin(angle),angle);}
      }else if(kind==='rain'){
        mark(g.x,g.y-.28+phase*.55,Math.PI/12);
      }else{
        const radius=g.kind==='wave'?g.r:g.kind==='annulus'?g.inner+(g.r-g.inner)*(.2+phase*.65):g.r*(.23+phase*.6);
        for(let i=0;i<6;i++){const a=i*Math.PI/3+phase*.45;mark(g.x+Math.cos(a)*radius,g.y+Math.sin(a)*radius,a);}
      }
    }finally{ctx.restore();}
  }
  function projectile(p,base,self) {
    if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y))return base.call(self,p);
    const style=shotStyle.get(p),isC3=p.type==='c3_shot';
    const inherited=isC3&&base.call(self,p);
    if(inherited&&!style)return true;
    const angle=Math.atan2(p.vy,p.vx),x=p.x*T-cam.x,y=p.y*T-cam.y;
    const frame=BossChoreographyV2.reduced()?2:Math.floor(Math.max(0,p.time||0)*13)%frames;
    // The bolt body stays on the hit point. The extra C3 flourish trails it.
    const trail=inherited?7:0;
    stamp(style==='orbit'?'satellites':style==='chase'?'comet':style==='volley'?'bolts':'wisp',
      isC3?'void':style==='volley'?'radio':'ghost',frame,x-trail*Math.cos(angle),y-trail*Math.sin(angle),inherited?17:22,angle);
    return true;
  }
  function tagHazard(h,mark) {
    if(!h||!['chase','orbit'].includes(h.kind))return;
    for(let i=mark;i<hostileShots.length;i++)shotStyle.set(hostileShots[i],h.kind);
  }
  return {atlas,bosses,actor,ground,observe,projectile,tagHazard};
})();
window.EnemyAttackFX=EnemyAttackFX;
const enemyFxCreature=drawCreature;
drawCreature=function(x,y,kind,e,...rest){
  const result=enemyFxCreature.call(this,x,y,kind,e,...rest);EnemyAttackFX.actor(x,y,e);return result;
};
const enemyFxUpdateEnemy=updateEnemy;
updateEnemy=function(e,dt,isBoss=false,...rest){
  return EnemyAttackFX.observe(e,dt,isBoss,enemyFxUpdateEnemy,arguments,this);
};
const enemyFxProjectile=BossGroundFXV1.drawProjectile;
BossGroundFXV1.drawProjectile=function(p){return EnemyAttackFX.projectile(p,enemyFxProjectile,this);};
const enemyFxHazard=C3.fireHazard;
C3.fireHazard=function(h,...rest){
  const mark=hostileShots.length,result=enemyFxHazard.call(this,h,...rest);EnemyAttackFX.tagHazard(h,mark);return result;
};

const enemyFxGround=BossChoreographyV2.paint;
BossChoreographyV2.paint=function(g,progress=0,released=false,...rest){
  const result=enemyFxGround.call(this,g,progress,released,...rest);
  EnemyAttackFX.ground(g,progress,released);return result;
};
