/* Cloud routes: authored reconstruction sprites, progressive support and falls that restart the route.
 * Existing cloud flags remain durable. Render never changes geometry or combat.
 */
'use strict';
const CloudWorldV1={
  assets:__CLOUD_WORLD_ASSETS__,manifest:__CLOUD_WORLD_MANIFEST__,images:{},textures:{},
  enabled:true,clock:0,builds:[],fall:null,start:{x:5.5,y:26.5},game:null,area:null,map:null,followers:new Map(),
  specs:{
    A:{key:'cloudPathA',rect:[18,20,7,6],tile:'c3_cloud',relic:'windFlute'},
    P:{key:'cloudPlatform',rect:[32,14,7,5],tile:'c3_platform',relic:'horizonDrum'},
    B:{key:'cloudPathB',rect:[45,8,6,6],tile:'c3_cloud',relic:'windFlute'}
  },
  active(){return !!G&&G.area==='cloud_sea'&&current===areas.cloud_sea},
  image(key){
    if(!this.assets[key])return null;
    if(!this.images[key]){const im=new Image();im.src=this.assets[key];this.images[key]=im}
    return this.images[key];
  },
  installPostgameGuard(){
    // Executed by init only after all modules, including the later const PostGame.
    // Do not read that binding at source evaluation time: it may still be in its TDZ.
    if(typeof PostGame==='undefined'||typeof PostGame.canTravel!=='function')return false;
    if(PostGame.canTravel.cloudWorldGuardV1)return true;
    const original=PostGame.canTravel;
    const guarded=function(...args){if(CloudWorldV1.fall)return false;return original.apply(this,args)};
    Object.defineProperty(guarded,'cloudWorldGuardV1',{value:true});
    PostGame.canTravel=guarded;return true;
  },
  async ready(){await Promise.all(Object.keys(this.assets).map(k=>this.image(k).decode()))},
  invalidate(){if(typeof routeCache!=='undefined')routeCache.key=''},
  finishBuild(job){
    for(const cell of job.cells){job.area.tiles[cell.y][cell.x]=job.spec.tile;job.area.blocked.delete(cell.x+','+cell.y);cell.solid=true}
    this.invalidate();
  },
  reset(){
    // Interaction was committed durably; leaving/reloading finishes its visual construction.
    for(const job of this.builds)if(G===this.game&&G.c3?.[job.spec.key])this.finishBuild(job);
    this.builds=[];this.fall=null;this.followers.clear();
    if(mode==='cloud_fall')mode='walk';
    this.game=G;this.area=G?.area;this.map=current;
  },
  sync(){if(this.game!==G||this.area!==G?.area||this.map!==current)this.reset()},
  isFalling(body){return !!this.fall&&this.fall.body===body},
  pendingCell(x,y){for(const job of this.builds){const cell=job.lookup.get(x+','+y);if(cell)return {job,cell}}return null},
  applyPending(){
    for(const job of this.builds)for(const cell of job.cells){
      job.area.tiles[cell.y][cell.x]=cell.solid?job.spec.tile:cell.before;
      if(cell.solid)job.area.blocked.delete(cell.x+','+cell.y);
      else if(cell.blocked)job.area.blocked.add(cell.x+','+cell.y);
      else job.area.blocked.delete(cell.x+','+cell.y);
    }
  },
  startBridge(which){
    this.sync();const spec=this.specs[which];
    if(!this.active()||!spec||this.fall)return false;
    if(this.builds.some(j=>j.which===which)){toast('A NUVEM ESTÁ SE RECONSTRUINDO');return false}
    if(G.c3[spec.key]){toast('PASSAGEM DE NUVEM · ESTÁVEL');return false}
    if(!G.c3[spec.relic]){toast(which==='P'?'O TAMBOR DO HORIZONTE PODE REUNIR ESTA NUVEM':'A FLAUTA DOS VENTOS PODE REUNIR ESTA NUVEM');return false}
    const [x,y,w,h]=spec.rect,cells=[];
    for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)cells.push({x:xx,y:yy,before:current.tiles[yy][xx],blocked:current.blocked.has(xx+','+yy),delay:(xx-x)*.11+((yy-y)%2)*.025,solid:false});
    const job={which,key:spec.key,spec,area:current,started:this.clock,cells,lookup:new Map(cells.map(c=>[c.x+','+c.y,c]))};
    this.builds.push(job);
    // Persist the accepted musical action now, so a save on a half-built route reloads safely.
    // Only the ephemeral tile support progresses; flags/old saves still describe the same route.
    G.c3[spec.key]=true;C3.applyWorld();
    emitMusic(G.x*T,G.y*T,24,which==='P'?'gold':'green');save(true);
    toast('NUVEM · REUNINDO AS FREQUÊNCIAS');return true;
  },
  stepBuilds(dt){
    this.clock+=dt;
    for(const job of this.builds){
      const age=this.clock-job.started;
      for(const cell of job.cells)if(!cell.solid&&age>=cell.delay+.69){cell.solid=true;job.area.tiles[cell.y][cell.x]=job.spec.tile;job.area.blocked.delete(cell.x+','+cell.y);this.invalidate()}
    }
    const finished=this.builds.filter(j=>this.clock-j.started>=Math.max(...j.cells.map(c=>c.delay))+1.02);
    if(finished.length){for(const job of finished)this.finishBuild(job);this.builds=this.builds.filter(j=>!finished.includes(j));toast('PASSAGEM DE NUVEM · FORMADA');save(true)}
  },
  voidAt(x,y){
    if(!this.active()||!Number.isFinite(x)||!Number.isFinite(y))return false;
    const ix=Math.floor(x),iy=Math.floor(y);
    if(ix<0||iy<0||ix>=current.w||iy>=current.h)return false;
    return ['c3_sky','void'].includes(current.tiles[iy]?.[ix]);
  },
  canStep(x,y){
    const r=.29;
    return [-r,r].every(dx=>[-r,r].every(dy=>tileWalkable(current,x+dx,y+dy)||this.voidAt(x+dx,y+dy)));
  },
  startFall(body,dx,dy,safe){
    if(this.fall||!this.active())return false;
    const coop=body===C3.coop,hero=coop?C3.coopMember():G.active;
    if(!hero)return false;
    const anchor=safe&&canBody121(safe.x,safe.y)?safe:safeSpawn121(body.x,body.y)||{x:5.5,y:26.5};
    this.fall={body,hero,coop,x:body.x,y:body.y,dir:body.dir||G.dir,dx,dy,safe:{...anchor},elapsed:0,duration:.85};
    if(typeof resetMotion10==='function')resetMotion10();
    if(C3.coop){C3.coop.dash=0;C3.coop.moving=false;C3.coop.route=[]}
    mode='cloud_fall';attackHeld=false;toast('A NUVEM TERMINOU · VOCÊ ESTÁ CAINDO');
    return true;
  },
  stepFall(dt){
    const f=this.fall;if(!f)return;
    f.elapsed=Math.min(f.duration,f.elapsed+dt);
    if(f.elapsed+1e-7<f.duration)return;
    this.respawn();
  },
  respawn(){
    // A fall only restarts the cloud route: no defeat screen and no return to an older
    // checkpoint (that path could leave the city and replay the arrival cinema over the game).
    // Built bridges are durable flags, so the route keeps its progress.
    const start=this.start;
    if(this.fall)Object.assign(this.fall.body,this.fall.safe);
    this.fall=null;this.followers.clear();
    setArea('cloud_sea',start.x,start.y,false);
    if(typeof resetMotion10==='function')resetMotion10();
    if(C3.coopActive?.())C3.syncCoop(true);
    attackHeld=false;mode='walk';
    toast('VOCÊ CAIU DA NUVEM · DE VOLTA AO INÍCIO DAS NUVENS');save(true);
  },
  move(body,dx,dy,distance,updateFacing=true){
    this.sync();
    if(!this.active()||this.fall||!Number.isFinite(distance)||distance<=0||!Number.isFinite(dx)||!Number.isFinite(dy))return false;
    if(body!==G&&body!==C3.coop)return false;
    const ox=body.x,oy=body.y,steps=Math.max(1,Math.ceil(distance/.075));
    let safe=canBody121(ox,oy)?{x:ox,y:oy}:body===C3.coop?C3.coop.lastGood:null;
    for(let i=0;i<steps&&!this.fall;i++){
      for(const [axis,amount]of [['x',dx],['y',dy]]){
        if(!amount)continue;
        const nx=axis==='x'?body.x+amount*distance/steps:body.x,ny=axis==='y'?body.y+amount*distance/steps:body.y;
        if(!this.canStep(nx,ny))continue;
        body.x=nx;body.y=ny;
        if(this.voidAt(nx,ny)){this.startFall(body,dx,dy,safe);break}
        if(canBody121(nx,ny))safe={x:nx,y:ny};
      }
    }
    const moved=Math.hypot(body.x-ox,body.y-oy)>1e-7;
    if(moved&&body===G&&!this.fall){
      if(updateFacing){G.aim091=[dx,dy];G.dir=Math.abs(dx)>Math.abs(dy)?dx<0?'left':'right':dy<0?'up':'down'}
      lastStep=0;const sample=trail[0];if(!sample||Math.hypot(G.x-sample.x,G.y-sample.y)>=.045)trail.unshift({x:G.x,y:G.y,dir:G.dir});if(trail.length>180)trail.length=180;
    }
    return moved;
  },
  originalResource(item){
    const record=this.manifest.original?.items?.[item],im=record&&this.image('original'+record.sheet);
    return im?.complete&&im.naturalWidth?{a:record,image:im}:null;
  },
  material(item,x,y,xx,yy){
    const r=this.originalResource(item);if(!r)return false;
    if(!this.textures[item]){
      const c=document.createElement('canvas');c.width=c.height=192;const q=c.getContext('2d');q.imageSmoothingEnabled=false;
      for(const [px,py,sx,sy]of [[0,0,1,1],[192,0,-1,1],[0,192,1,-1],[192,192,-1,-1]]){q.save();q.translate(px,py);q.scale(sx,sy);q.drawImage(r.image,...r.a.content,0,0,96,96);q.restore()}
      this.textures[item]=c;
    }
    ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(this.textures[item],((xx%8)+8)%8*T,((yy%8)+8)%8*T,T,T,Math.round(x),Math.round(y),T,T);ctx.restore();return true;
  },
  cloud(x,y,xx,yy){
    if(!this.originalView)this.originalView={manifest:{theme:'v2'},material:(...args)=>this.material(...args),available:item=>this.originalResource(item)};
    return CenariosV2.cloud.call(this.originalView,x,y,xx,yy);
  },
  rebuildFrame(cell,job){return Math.min(7,Math.max(0,Math.floor((this.clock-job.started-cell.delay)*8)))},
  drawRebuild(cell,job,x,y){
    const im=this.image('rebuild'),m=this.manifest.rebuild||{},age=this.clock-job.started-cell.delay;
    if(age<0||age>=1.02||!im?.complete||!im.naturalWidth)return false;
    const frames=m.frames||8,cols=m.cols||4,fw=m.cellWidth||im.naturalWidth/cols,fh=m.cellHeight||im.naturalHeight/(m.rows||2),frame=Math.min(frames-1,Math.max(0,Math.floor(age*(m.fps||8))));
    ctx.save();ctx.imageSmoothingEnabled=false;
    if(G.options10?.reducedMotion)ctx.globalAlpha*=.72;
    ctx.drawImage(im,(frame%cols)*fw,Math.floor(frame/cols)*fh,fw,fh,Math.round(x-5),Math.round(y-5),T+10,T+10);ctx.restore();return true;
  },
  clipVoid(){
    // Build the mask in screen/world coordinates before shrinking or dropping the body.
    // Clouds and metal support therefore occlude a falling actor from every edge.
    const left=Math.max(0,Math.floor(cam.x/T)),top=Math.max(0,Math.floor(cam.y/T)),
      right=Math.min(current.w-1,Math.floor((cam.x+VW)/T)),bottom=Math.min(current.h-1,Math.floor((cam.y+VH)/T));
    ctx.beginPath();
    for(let yy=top;yy<=bottom;yy++)for(let xx=left;xx<=right;xx++)if(['c3_sky','void'].includes(current.tiles[yy]?.[xx]))ctx.rect(Math.round(xx*T-cam.x),Math.round(yy*T-cam.y),T,T);
    ctx.clip();
  },
  tile(type,x,y,xx,yy){
    if(!this.active()||!this.enabled)return false;
    if(xx===0||yy===0||xx===current.w-1||yy===current.h-1)return this.material('ceu_nuvens_fundo',x,y,xx,yy);
    if(['void','c3_sky'].includes(type)){
      const result=this.material('ceu_nuvens_fundo',x,y,xx,yy),p=this.pendingCell(xx,yy);if(p)this.drawRebuild(p.cell,p.job,x,y);return result;
    }
    if(type==='c3_cloud'||type==='c3_platform'){
      const result=this.cloud(x,y,xx,yy),p=this.pendingCell(xx,yy);if(p)this.drawRebuild(p.cell,p.job,x,y);return result;
    }
    return false;
  }
};
window.CloudWorldV1=CloudWorldV1;
for(const key of Object.keys(CloudWorldV1.assets))CloudWorldV1.image(key);

const cloudApplyV1=C3.applyWorld;
C3.applyWorld=function(...args){const result=cloudApplyV1.apply(this,args);CloudWorldV1.applyPending();return result};
const cloudPathV1=C3.cloudPath,cloudPlatformV1=C3.cloudPlatform;
C3.cloudPath=function(which){return CloudWorldV1.active()?CloudWorldV1.startBridge(which):cloudPathV1.call(this,which)};
C3.cloudPlatform=function(){return CloudWorldV1.active()?CloudWorldV1.startBridge('P'):cloudPlatformV1.call(this)};

const cloudMoveBodyV1=moveBody10;
moveBody10=function(dx,dy,distance,updateFacing=true){
  if(CloudWorldV1.active()){
    if(C3.coopActive()&&Input121.wasCoop&&Math.hypot(G.x-C3.coop.x,G.y-C3.coop.y)>11&&((G.x-C3.coop.x)*dx+(G.y-C3.coop.y)*dy)>0)return false;
    return CloudWorldV1.move(G,dx,dy,distance,updateFacing);
  }
  return cloudMoveBodyV1(dx,dy,distance,updateFacing);
};
const cloudMoveActorV1=moveActor121;
moveActor121=function(body,dx,dy,distance){
  if(CloudWorldV1.active()&&(body===G||body===C3.coop))return CloudWorldV1.move(body,dx,dy,distance);
  return cloudMoveActorV1(body,dx,dy,distance);
};
const cloudSyncCoopV1=C3.syncCoop;
C3.syncCoop=function(force=false,...args){
  if(CloudWorldV1.fall?.coop)return;
  const c=C3.coop;
  // A controlled body reaches the edge with its corners before its centre crosses it.
  // Keep that narrow, still-supported approach; the original recovery would otherwise
  // pull P2 back every frame and turn the cloud edge into an invisible wall again.
  // Scene/member boundaries, walls and a centre already spawned in void still recover.
  if(!force&&CloudWorldV1.active()&&C3.coopActive()&&c.area===G.area&&c.game===G&&
    c.actor123===C3.coopMember()&&Math.hypot(c.x-G.x,c.y-G.y)<=9.5&&tileWalkable(current,c.x,c.y)&&
    !canBody121(c.x,c.y)&&CloudWorldV1.canStep(c.x,c.y))return;
  return cloudSyncCoopV1.call(this,force,...args);
};
const cloudFollowerV1=getFollower;
getFollower=function(index){
  const p=cloudFollowerV1(index);
  if(!CloudWorldV1.active())return p;
  const others=partyMembers().filter(id=>id!==G.active);
  if(C3.coopActive()&&others[index]===C3.coopMember())return p;
  if(canBody121(p.x,p.y)){CloudWorldV1.followers.set(index,p);return p}
  return CloudWorldV1.followers.get(index)||CloudWorldV1.fall?.safe||safeSpawn121(G.x,G.y)||p;
};

const cloudUpdateV1=update;
update=function(dt){
  CloudWorldV1.sync();
  if(CloudWorldV1.fall){
    if(mode==='walk'||mode==='action')mode='cloud_fall';
    if(mode==='cloud_fall'){const step=Math.max(0,Math.min(Number(dt)||0,.06));CloudWorldV1.stepBuilds(step);CloudWorldV1.stepFall(step)}
    return;
  }
  if(G&&['walk','action'].includes(mode))CloudWorldV1.stepBuilds(Math.max(0,Math.min(Number(dt)||0,.06)));
  return cloudUpdateV1(dt);
};
const cloudSetAreaV1=setArea;
setArea=function(...args){CloudWorldV1.reset();const result=cloudSetAreaV1(...args);CloudWorldV1.reset();return result};
const cloudBuildMapsV1=buildMaps;
buildMaps=function(...args){CloudWorldV1.reset();const result=cloudBuildMapsV1(...args);CloudWorldV1.reset();return result};
const cloudRestoreV1=restoreCheckpoint;
restoreCheckpoint=function(...args){CloudWorldV1.reset();const result=cloudRestoreV1(...args);CloudWorldV1.reset();return result};
const cloudSaveV1=save;
save=function(...args){
  const f=CloudWorldV1.fall;if(!f)return cloudSaveV1(...args);
  const position={x:f.body.x,y:f.body.y};Object.assign(f.body,f.safe);
  try{return cloudSaveV1(...args)}finally{Object.assign(f.body,position)}
};
if(typeof exportSave==='function'){
  const cloudExportV1=exportSave;
  exportSave=function(...args){
    const f=CloudWorldV1.fall;if(!f)return cloudExportV1(...args);
    const position={x:f.body.x,y:f.body.y};Object.assign(f.body,f.safe);
    try{return cloudExportV1(...args)}finally{Object.assign(f.body,position)}
  };
}
if(typeof openParty==='function'){
  const cloudPartyV1=openParty;
  openParty=function(...args){if(CloudWorldV1.fall){toast('A FORMAÇÃO FICA FIXA DURANTE A QUEDA');return}return cloudPartyV1(...args)};
}
if(typeof C3.cycleCoop==='function'){
  const cloudCycleV1=C3.cycleCoop;
  C3.cycleCoop=function(...args){if(CloudWorldV1.fall)return false;return cloudCycleV1.apply(this,args)};
}
if(typeof init==='function'){
  const cloudInitV1=init;
  init=function(...args){CloudWorldV1.installPostgameGuard();return cloudInitV1.apply(this,args)};
}
const cloudTileV1=drawTile;
drawTile=function(...args){if(!CloudWorldV1.tile(...args))return cloudTileV1(...args)};
const cloudActorV1=drawActor;
drawActor=function(p,x,y,moving=false){
  const f=CloudWorldV1.fall;
  // Keep a disconnected P2 in its captured fall, rather than also drawing its follower.
  if(f?.coop&&p.style===f.hero&&(Math.abs(x-(f.body.x*T-cam.x))>2||Math.abs(y-(f.body.y*T-cam.y))>2))return;
  if(f&&p.style===f.hero)f.drawn=true;
  if(!CloudWorldV1.enabled||!f||p.style!==f.hero||Math.abs(x-(f.body.x*T-cam.x))>2||Math.abs(y-(f.body.y*T-cam.y))>2)return cloudActorV1(p,x,y,moving);
  const t=Math.min(1,f.elapsed/f.duration),scale=1-.93*Math.pow(t,1.1),drop=18*t+128*t*t;
  f.drawn=true;
  ctx.save();CloudWorldV1.clipVoid();ctx.globalAlpha*=1-.82*t*t;ctx.translate(x,y+drop);ctx.scale(scale,scale);ctx.translate(-x,-y);
  try{return cloudActorV1(p,x,y,false)}finally{ctx.restore()}
};
if(typeof drawEnv==='function'){
  const cloudEnvV1=drawEnv;
  drawEnv=function(...args){
    if(CloudWorldV1.fall)CloudWorldV1.fall.drawn=false;
    const result=cloudEnvV1(...args),f=CloudWorldV1.fall;
    // A disconnected pad must not make a captured P2 fall disappear into a follower slot.
    if(f&&!f.drawn)drawActor({style:f.hero,dir:f.dir},Math.round(f.body.x*T-cam.x),Math.round(f.body.y*T-cam.y),false);
    return result;
  };
}
