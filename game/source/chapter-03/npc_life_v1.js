/* Local NPC acting. Cosmetic clocks/routes are never stored in G or saves.
 * Inject after the current NPC renderers, before init(). postReserve belongs
 * to postgame: do not register, move or redraw those actors here.
 */
'use strict';
const NpcLifeV1 = {
  game:null, area:null, states:new Map(), appearances:new Map(),
  radius:.26, roamRadius:.65, speed:.48,
  directions:['down','left','up','right'],
  registerAppearance(key, descriptor) {
    if(typeof key!=='string'||typeof descriptor?.render!=='function')throw new TypeError('NPC appearance requires a key and render function');
    this.appearances.set(key,descriptor);
  },
  appearance(n) {return this.appearances.get(this.area?.id+'/'+n.id)||this.appearances.get(n.id)||this.appearances.get(n.spriteKey)},
  ignored(n) {return !n||!!n.postReserve||!Number.isFinite(n.x)||!Number.isFinite(n.y)},
  enabled() {
    return !!G&&!!current&&mode==='walk'&&!(typeof battle!=='undefined'&&battle)&&
      !(typeof Input121!=='undefined'&&Input121.focused===false)&&!(typeof document!=='undefined'&&document.hidden);
  },
  reduced() {return !!G?.options10?.reducedMotion},
  hash(text) {let h=2166136261;for(const c of text)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0},
  restore() {
    for(const [n,s]of this.states){
      // A quest can relocate the same object. Only undo positions still owned
      // by this layer, never a position assigned by a story callback.
      if(Math.hypot(n.x-s.lastX,n.y-s.lastY)<.00001){n.x=s.homeX;n.y=s.homeY;}
      if(n.dir===s.lastDir){if(s.originalDir===undefined)delete n.dir;else n.dir=s.originalDir;}
    }
    this.states.clear();
  },
  reset() {this.restore();this.game=null;this.area=null;},
  sync() {
    if(this.game!==G||this.area!==current){this.restore();this.game=G;this.area=current;}
    if(!G||!current)return;
    const present=new Set(current.npcs||[]);
    for(const [n,s]of this.states)if(!present.has(n)||this.ignored(n)){
      if(!n.postReserve&&Math.hypot(n.x-s.lastX,n.y-s.lastY)<.00001){n.x=s.homeX;n.y=s.homeY;}
      this.states.delete(n);
    }
  },
  bodyFree(a,x,y) {
    if(!a||!Number.isFinite(x)||!Number.isFinite(y))return false;
    const r=this.radius;
    for(const dx of [-r,0,r])for(const dy of [-r,0,r])if(!tileWalkable(a,x+dx,y+dy))return false;
    return true;
  },
  furnitureBounds(p) {
    if(p.flat||p.groundMaterial)return null;
    const kind=p.type==='life091'?p.kind:p.type;
    const widths={table:3.1,tools:3.1,shelf:2.4,bed:2.6,kitchen:3.1,chair:1.5,
      voiceWorkbench:4.4,voiceBench:2.8,tapeShelf:2.8,radioConsole:3.1,
      c3_table:2.5,c3_bar:5.4,c3_workbench:6.4,c3_crates:3.3,c3_vending:2.4,c3_kiosk:2.8};
    let width=widths[kind],depth=kind==='chair'?.65:.8;
    if(p.type==='env2_prop'&&/^(club_(table|chair|stool)|bar_counter|projection_console|instrument_rack)$/.test(p.item||'')){
      width=Math.max(.8,(p.w||40)/24);depth=.65;
    }
    if(!width)return null;
    // Footprint only: never treat the complete height of a sprite as a wall.
    const cx=p.x+.5,bottom=p.y+1;
    return {left:cx-width/2,right:cx+width/2,top:bottom-depth,bottom};
  },
  pointFree(a,n,x,y,activity=true) {
    if(!this.bodyFree(a,x,y))return false;
    const r=this.radius;
    for(const p of a.props||[]){const b=this.furnitureBounds(p);if(b&&x+r>b.left&&x-r<b.right&&y+r>b.top&&y-r<b.bottom)return false;}
    for(const other of a.npcs||[])if(other!==n&&!this.ignored(other)&&Math.hypot(x-other.x,y-other.y)<.62)return false;
    if(activity){
      for(const g of a.gates||[])if(Math.hypot(x-g.x,y-g.y)<1.05)return false;
      for(const e of a.events||[])if(Math.hypot(x-e.x,y-e.y)<.82)return false;
      for(const p of this.actors())if(Math.hypot(x-p.x,y-p.y)<.72)return false;
    }
    return true;
  },
  routeFree(a,n,from,to) {
    const steps=Math.max(1,Math.ceil(Math.hypot(to.x-from.x,to.y-from.y)/.08));
    for(let i=1;i<=steps;i++)if(!this.pointFree(a,n,from.x+(to.x-from.x)*i/steps,from.y+(to.y-from.y)*i/steps))return false;
    return true;
  },
  actors() {
    const out=G&&Number.isFinite(G.x)&&Number.isFinite(G.y)?[G]:[];
    if(typeof C3!=='undefined'&&C3.coopActive?.()&&Number.isFinite(C3.coop?.x)&&Number.isFinite(C3.coop?.y))out.push(C3.coop);
    return out;
  },
  capabilities(n) {
    const custom=this.appearance(n);
    if(custom&&(!custom.ready||custom.ready(n)))return {walk:!!custom.walk,directional:!!custom.directional};
    const images=typeof C3!=='undefined'?C3.images||{}:{};
    if(this.collaboratorRow(n)!==null)return {walk:this.ready(images.prebeta_collabs_move),directional:true};
    if(n.id==='c3_vega')return {walk:this.ready(images.prebeta_dney),directional:true};
    if(this.ambientImage(n))return {walk:this.ready(images[this.ambientImage(n)]),directional:true};
    if(this.procedural(n))return {walk:true,directional:true};
    return {walk:false,directional:!!n.spriteKey&&['iris','celina','lumi','katana'].includes(n.spriteKey)};
  },
  procedural(n) {return n.id==='voice_guard'||n.id==='voice_vendor'||n.style==='guard'},
  collaboratorRow(n) {
    const byId={c3_maia:0,c3_ciro:2,c3_nara:1,c3_nara_canal:1};
    if(Object.prototype.hasOwnProperty.call(byId,n.id))return byId[n.id];
    return n.spriteKey==='bento'?0:n.spriteKey==='nilo'?1:null;
  },
  ambientImage(n) {
    return {c3_resident:'sprite_resident_a',c3_resident_b:'sprite_resident_b',
      c3_canal_worker:'sprite_canal_worker',c3_plant_operator:'sprite_plant_operator'}[n.id]||null;
  },
  anchored(n) {
    return (this.area?.id==='bento_shop'&&(n.id==='bento'||n.spriteKey==='bento'))||
      ['c3_synth_npc','c3_percussion_npc','c3_alt_final','c3_katana_final','voice_guard'].includes(n.id);
  },
  repairBelga(n) {
    if(this.area?.id!=='bento_shop'||!(n.id==='bento'||n.spriteKey==='bento')||Math.hypot(n.x-18,n.y-8)>.15)return;
    if(!(this.area.props||[]).some(p=>p.type==='life091'&&p.kind==='tools'&&Math.hypot(p.x-18,p.y-7)<.2))return;
    // The legacy actor was on the front edge of the tool table. A short step
    // south keeps the original tools event and the NPC separately reachable.
    // Avatars are not map solids. A load while P1/P2 occupy the counter's
    // front must not permanently keep the canonical home inside the table.
    for(const [x,y]of [[18,9.2],[17.5,9.2],[18.5,9.2],[17,9.2]])if(this.pointFree(this.area,n,x,y,false)){n.x=x;n.y=y;return;}
  },
  state(n) {
    this.sync();if(this.ignored(n)||!this.area||(this.area.npcs||[]).indexOf(n)<0)return null;
    let s=this.states.get(n);
    if(s&&Math.hypot(n.x-s.lastX,n.y-s.lastY)>.00001){this.states.delete(n);s=null;}
    if(!s){
      this.repairBelga(n);
      const seed=this.hash(this.area.id+'/'+n.id+'/'+(n.spriteKey||''));
      s={homeX:n.x,homeY:n.y,lastX:n.x,lastY:n.y,originalDir:n.dir,lastDir:n.dir,
        dir:n.dir||'down',state:'idle',clock:0,age:0,duration:2+(seed%31)/10,
        sequence:seed%5,seed,distance:0,frame:0,moving:false,attending:false,target:null};
      this.states.set(n,s);
    }
    return s;
  },
  face(s,dx,dy) {if(Math.hypot(dx,dy)>.01)s.dir=Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');},
  workTarget(n) {
    const tags=/bento|ciro/.test(n.id)?/tools|workbench|tuning|flute|voiceWorkbench/i:
      /vega/.test(n.id)?/project|console/i:/plant/.test(n.id)?/machine|pressure|valve/i:
      /canal|nara/.test(n.id)?/valve|gate|beacon|wind/i:/maia|street|lumi/.test(n.id)?/stage|speaker|instrument/i:/table|counter|window/i;
    return (this.area.props||[]).filter(p=>tags.test(p.type+' '+(p.item||'')+' '+(p.kind||'')))
      .filter(p=>Math.hypot(p.x-n.x,p.y-n.y)<5).sort((a,b)=>Math.hypot(a.x-n.x,a.y-n.y)-Math.hypot(b.x-n.x,b.y-n.y))[0];
  },
  enter(n,s,state) {
    s.state=state;s.age=0;s.moving=false;s.frame=0;s.target=null;s.returnAfter=false;
    s.duration=state==='idle'?3+(s.seed%13)/10:state==='work'?3:state==='gesture'?1.3:1.8;
    if(state==='wander'){
      if(this.anchored(n)||!this.capabilities(n).walk||this.reduced())return this.enter(n,s,'look');
      for(let i=0;i<8;i++){
        const angle=((s.seed+s.sequence+i)%8)*Math.PI/4;
        const to={x:s.homeX+Math.cos(angle)*this.roamRadius,y:s.homeY+Math.sin(angle)*this.roamRadius};
        if(this.routeFree(this.area,n,n,to)){s.target=to;return;}
      }
      return this.enter(n,s,'idle');
    }
    if(state==='return')s.target={x:s.homeX,y:s.homeY};
    if(state==='work'){const p=this.workTarget(n);if(p)this.face(s,p.x-n.x,p.y-n.y);}
    if(state==='gesture')s.dir=this.ambientImage(n)?'down':this.directions[(this.directions.indexOf(s.dir)+1)%4];
  },
  move(n,s,dt) {
    const to=s.target;if(!to)return this.enter(n,s,'idle');
    const dx=to.x-n.x,dy=to.y-n.y,d=Math.hypot(dx,dy);
    if(d<.025){const away=s.state==='wander';this.enter(n,s,away?'look':'idle');s.returnAfter=away;return;}
    const step=Math.min(d,this.speed*dt),next={x:n.x+dx/d*step,y:n.y+dy/d*step};
    if(Math.hypot(next.x-s.homeX,next.y-s.homeY)>this.roamRadius+.001||!this.routeFree(this.area,n,n,next))return;
    n.x=next.x;n.y=next.y;s.lastX=n.x;s.lastY=n.y;s.distance+=step;s.moving=true;
    s.frame=Math.floor(s.distance*5)%2;this.face(s,dx,dy);
  },
  tick(dt) {
    this.sync();if(!G||!this.area)return;
    const list=[...(this.area.npcs||[])];for(const n of list)if(!this.ignored(n))this.state(n);
    if(!this.enabled())return;
    dt=Math.min(.1,Math.max(0,Number(dt)||0));
    for(const n of list){
      const s=this.states.get(n);if(!s||this.ignored(n))continue;
      s.clock+=dt;s.moving=false;
      const close=this.actors().filter(p=>Math.hypot(p.x-n.x,p.y-n.y)<1.7)
        .sort((a,b)=>Math.hypot(a.x-n.x,a.y-n.y)-Math.hypot(b.x-n.x,b.y-n.y))[0];
      s.attending=!!close;
      if(close){s.frame=0;this.face(s,close.x-n.x,close.y-n.y);}
      else if(this.reduced()){s.frame=0;}
      else {
        s.age+=dt;
        if(s.state==='wander'||s.state==='return')this.move(n,s,dt);
        else {s.frame=0;if(s.age>=s.duration)this.enter(n,s,s.returnAfter?'return':['look','work','idle','gesture','wander'][s.sequence++%5]);}
      }
      n.dir=s.dir;s.lastDir=n.dir;
    }
  },
  pose(n) {
    const s=this.state(n);if(!s)return null;
    return {state:s.attending?'look':s.state,dir:s.dir,moving:s.moving&&this.enabled(),walking:s.moving,frame:s.frame,
      clock:s.clock,phaseOffset:(s.seed%29)/10,age:s.age,duration:s.duration,gesturePhase:Math.min(1,s.age/Math.max(.001,s.duration)),
      blink:(s.clock+(s.seed%53)/10)%5.6>5.44,paused:!this.enabled()};
  },
  ready(image) {return !!image?.complete&&image.naturalWidth>0},
  drawGuard(n,x,y,p) {
    // Existing legacy citizen parts/palette, now facing, blinking and gesturing.
    // No rotating/bobbing the whole actor and no reassignment to a hero sprite.
    x=Math.round(x);y=Math.round(y);const draw=(dx,dy,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x+dx,y+dy,w,h)};
    const coat='#63745a',skin='#b97852',robe='#7e9c8b',trim='#e9cea3';
    const step=p.moving?(p.frame?2:-2):0,gesture=p.state==='gesture'&&p.gesturePhase>.2&&p.gesturePhase<.8;
    ctx.save();draw(-8,8,17,4,'#080b16a0');
    draw(-6,-2,5,10+step,'#30293b');draw(2,-2,5,10-step,'#30293b');draw(-8,6+step,8,4,'#181b27');draw(1,6-step,8,4,'#181b27');
    draw(-9,-17,18,19,coat);draw(-11,-15,5,15,coat);
    draw(7,gesture?-25:-15,5,gesture?17:15,coat);if(gesture)draw(8,-29,4,5,skin);
    draw(-5,-18,10,14,'#2c2934');draw(-2,-13,4,7,'#c69a66');
    draw(-12,-18,24,4,robe);draw(-7,-16,14,4,trim);draw(-11,-13,3,10,robe);draw(8,-13,3,10,robe);
    draw(-4,-22,8,6,skin);draw(-7,-33,14,14,'#392a2d');draw(-6,-31,12,11,skin);
    draw(-7,-26,3,5,skin);draw(5,-26,3,5,skin);draw(-8,-36,15,6,'#221c27');
    for(let j=0;j<7;j++){const xx=-8+(j*3)%17,yy=-38+(j%3)*2;draw(xx,yy,4,4,'#241e27');draw(xx+1,yy+1,1,1,'#5b3945');}
    if(p.dir!=='up'){
      if(p.dir!=='right')draw(-5,-26,3,p.blink?1:2,'#25222b');
      if(p.dir!=='left')draw(2,-26,3,p.blink?1:2,'#25222b');
      draw(p.dir==='left'?-5:p.dir==='right'?4:-2,p.dir==='down'?-21:-23,p.dir==='down'?4:2,1,'#624548');
    }
    ctx.restore();return true;
  },
  draw(n,x,y,p) {
    const custom=this.appearance(n);
    if(custom&&(!custom.ready||custom.ready(n))&&custom.render(n,x,y,p)===true)return true;
    if(typeof C3==='undefined')return false;
    const group=Math.max(0,this.directions.indexOf(p.dir)),row=this.collaboratorRow(n);
    if(row!==null&&c3SheetSprite(C3.images.prebeta_collabs_move,group*2+p.frame,row,8,3,x,y,56,70))return true;
    if(n.id==='c3_vega'&&c3SheetSprite(C3.images.prebeta_dney,group,p.frame,4,3,x,y,56,70))return true;
    const image=this.ambientImage(n);
    if(image&&c3SheetSprite(C3.images[image],group*2+p.frame,0,8,1,x,y,82*(C3.images[image].naturalWidth/8)/C3.images[image].naturalHeight,82))return true;
    if(this.procedural(n))return this.drawGuard(n,x,y,p);
    if(n.spriteKey&&['iris','celina','lumi','katana'].includes(n.spriteKey)&&typeof character092==='function'&&typeof NPC092!=='undefined'&&this.ready(NPC092)){
      character092(n.spriteKey,x,y,p.dir,false);return true;
    }
    const musician=n.id==='c3_synth_npc'?'synth':n.id==='c3_percussion_npc'?'percussion':null;
    if(musician&&typeof MusicianArtV1!=='undefined'){
      const art=MusicianArtV1,variant=art.variant(musician),performance=art.key(musician,variant,'performance');
      const state=p.state==='work'&&art.assets?.[performance]?'performance':'idle',sheet=art.image(art.key(musician,variant,state));
      if(this.ready(sheet)){
        const frame=Math.floor(p.clock/(state==='idle'?.14:.1))%8;
        ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(sheet,frame*256,group*256,256,256,Math.round(x-44),Math.round(y+11-77),88,88);ctx.restore();return true;
      }
    }
    const variant=n.id==='c3_alt_final'?'alt':n.id==='c3_katana_final'?'katana':null;
    if(variant&&typeof NinjaArcherArtV1!=='undefined'){
      const sheet=NinjaArcherArtV1.image(variant+'_idle');
      if(this.ready(sheet)){
        ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(sheet,Math.floor(p.clock/.14)%8*256,group*256,256,256,Math.round(x-44),Math.round(y+11-77),88,88);ctx.restore();return true;
      }
    }
    return false;
  }
};

const npcLifeUpdateV1=update;
update=function(dt,...args){NpcLifeV1.sync();const result=npcLifeUpdateV1(dt,...args);NpcLifeV1.tick(dt);return result};
const npcLifeSetAreaV1=setArea;
setArea=function(...args){NpcLifeV1.reset();const result=npcLifeSetAreaV1(...args);NpcLifeV1.tick(0);return result};
const npcLifeBuildV1=buildMaps;
buildMaps=function(...args){NpcLifeV1.reset();return npcLifeBuildV1(...args)};
const npcLifeDrawV1=drawDetailedNPC;
drawDetailedNPC=function(n,x,y){
  if(NpcLifeV1.ignored(n))return npcLifeDrawV1(n,x,y);
  const beforeX=n.x,beforeY=n.y,p=NpcLifeV1.pose(n);
  if(!p)return npcLifeDrawV1(n,x,y);
  if(NpcLifeV1.draw(n,x+(n.x-beforeX)*T,y+(n.y-beforeY)*T,p))return;
  return npcLifeDrawV1(n,x,y);
};
const npcLifePoseV1=c3NpcPose;
c3NpcPose=function(n){if(NpcLifeV1.ignored(n))return npcLifePoseV1(n);const p=NpcLifeV1.pose(n);return p?{dir:p.dir,frame:p.frame}:npcLifePoseV1(n)};
