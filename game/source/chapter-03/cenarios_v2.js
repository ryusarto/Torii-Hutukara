/* Environment V2: authored PNGs, physical state and readable ground planes.
 * Preserves rewards, combat and save keys; aligns six entrance/return coordinates.
 */
'use strict';
const CenariosV2={
  manifest:__CENARIOS_V2_MANIFEST__,assets:__CENARIOS_V2_ASSETS__,images:{},textures:{},requested:null,
  image(id){if(!this.images[id]){const image=new Image();image.src=this.assets[id];this.images[id]=image}return this.images[id]},
  ensure(area=G?.area){
    if(!area||area===this.requested)return;this.requested=area;
    let ids=['A12'];
    if(C3.AREAS.includes(area)){
      ids=['A01','A02','A03','A08'];
      if(area==='distortion_district'||area==='sky_terminal')ids.push('A05');
      if(area==='contratempo')ids.push('A06');
      if(area==='power_plant'||area==='sky_canal')ids.push('A07');
      if(area==='cloud_sea')ids.push('A04','A09');
      if(['cloud_terrace','last_torii','silence_core'].includes(area))ids.push('A10');
    }else if(['city','forest','ruins','corridor','chamber','studio'].includes(area))ids.push('A11');
    for(const id of ids)this.image(id);
  },
  async ready(){await Promise.all(Object.keys(this.assets).map(id=>this.image(id).decode()))},
  available(item){const a=this.manifest.items[item],image=a&&this.image(a.sheet);return image?.complete&&image.naturalWidth?{a,image}:null},
  sprite(item,x,y,w,h,alpha=1){
    const resource=this.available(item);if(!resource)return false;
    const {a,image}=resource,r=a.content,k=Math.min(w/r[2],h/r[3]),dw=r[2]*k,dh=r[3]*k;
    ctx.save();ctx.imageSmoothingEnabled=false;ctx.globalAlpha*=alpha;
    ctx.drawImage(image,...r,Math.round(x-dw/2),Math.round(y-dh),Math.round(dw),Math.round(dh));ctx.restore();return true;
  },
  tileImage(item,x,y){const r=this.available(item);if(!r)return false;ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(r.image,...r.a.content,Math.round(x),Math.round(y),T,T);ctx.restore();return true},
  material(item,x,y,xx,yy){
    const r=this.available(item);if(!r)return false;
    if(!this.textures[item]){
      const c=document.createElement('canvas');c.width=c.height=192;const q=c.getContext('2d');q.imageSmoothingEnabled=false;
      // Mirrored sampling joins identical authored edge pixels, without drawing new art.
      for(const [px,py,sx,sy] of [[0,0,1,1],[192,0,-1,1],[0,192,1,-1],[192,192,-1,-1]]){q.save();q.translate(px,py);q.scale(sx,sy);q.drawImage(r.image,...r.a.content,0,0,96,96);q.restore()}
      this.textures[item]=c;
    }
    const sx=((xx%8)+8)%8*T,sy=((yy%8)+8)%8*T;ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(this.textures[item],sx,sy,T,T,Math.round(x),Math.round(y),T,T);ctx.restore();return true;
  },
  paver(a,x,y){return a?.tiles?.[y]?.[x]==='c3_street'||a?.env2Apron?.has(x+','+y)},
  curb(x,y,side){
    const r=this.available('curb_n');if(!r)return;
    // Extract the actual curb/drain band, not its concept-sheet pavement backdrop.
    const b=r.a.content;ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(Math.round(x+12),Math.round(y+12));
    ctx.rotate(({s:0,w:Math.PI/2,n:Math.PI,e:-Math.PI/2})[side]);
    ctx.drawImage(r.image,b[0],b[1]+Math.round(b[3]*.35),b[2],Math.round(b[3]*.27),-12,6,24,6);ctx.restore();
  },
  cloud(x,y,xx,yy){
    const a=current,at=(cx,cy)=>['c3_cloud','c3_platform'].includes(a?.tiles?.[cy]?.[cx]);
    // Desert shelves sample one continuous authored surface across the map.
    // Alternating four dune materials every tile created false interior seams.
    const top=this.manifest.theme==='deserto-v1'?'cloud_top_a':'cloud_top_'+['a','b','c','d'][((xx%2+2)%2)+((yy%2+2)%2)*2];
    if(!this.material(top,x,y,xx,yy))return false;
    const n=!at(xx,yy-1),e=!at(xx+1,yy),s=!at(xx,yy+1),w=!at(xx-1,yy);
    const band=(item,rect)=>{const r=this.available(item);if(!r)return;ctx.save();ctx.beginPath();ctx.rect(x+rect[0],y+rect[1],rect[2],rect[3]);ctx.clip();this.material('ceu_nuvens_fundo',x,y,xx,yy);ctx.imageSmoothingEnabled=false;ctx.drawImage(r.image,...r.a.content,x,y,T,T);ctx.restore()};
    if(n)band('cloud_edge_n',[0,0,T,7]);if(e)band('cloud_edge_e',[17,0,7,T]);if(s)band('cloud_edge_s',[0,14,T,10]);if(w)band('cloud_edge_w',[0,0,7,T]);
    for(const [name,one,two,dx,dy]of [['ne',n,e,1,-1],['se',s,e,1,1],['sw',s,w,-1,1],['nw',n,w,-1,-1]]){
      const rect=[dx>0?16:0,dy>0?16:0,8,8];
      if(one&&two)band('cloud_outer_'+name,rect);else if(!one&&!two&&!at(xx+dx,yy+dy))band('cloud_inner_'+name,rect);
    }return true;
  },
  tile(type,x,y,xx,yy){
    if(!G||!C3.AREAS.includes(G.area))return false;this.ensure();
    const a=current,c=G.c3||{},boundary=xx===0||yy===0||xx===a.w-1||yy===a.h-1;
    if(G.area==='cloud_sea'&&boundary)return this.material('ceu_nuvens_fundo',x,y,xx,yy);
    if(type==='c3_cloud')return this.cloud(x,y,xx,yy);
    if(type==='void'||type==='c3_sky')return this.material(G.area==='silence_core'?'abismo_fundo':'ceu_nuvens_fundo',x,y,xx,yy);
    if(G.area==='power_plant'&&xx===17&&a.blocked.has(xx+','+yy)){
      if(!this.material('paineis_parede',x,y,xx,yy))return false;
      const fence=this.available('canal_pier_left');
      if(fence){ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(x+12,y+12);ctx.rotate(Math.PI/2);ctx.drawImage(fence.image,...fence.a.content,-12,-8,24,16);ctx.restore()}
      return true;
    }
    if(boundary)return this.material('paineis_parede',x,y,xx,yy);
    let item={c3_asphalt:(xx*5+yy*3)%13<3?'asfalto_molhado':'asfalto_seco',c3_street:'calcada_pedra',c3_metal:'metal_industrial',c3_platform:'metal_terminal',c3_factory:'metal_industrial',c3_indoor:'madeira_oficina',c3_clubfloor:'madeira_clube',c3_bridge:'tabuas_ponte',c3_sanctuary:'pedra_santuario',c3_voidfloor:'basalto_nucleo',c3_water:'agua_canal'}[type];
    const paver=this.paver(a,xx,yy);if(paver)item='calcada_pedra';
    if(!item||!this.material(item,x,y,xx,yy))return false;
    if(paver){for(const [side,dx,dy]of [['n',0,-1],['e',1,0],['s',0,1],['w',-1,0]])if(!this.paver(a,xx+dx,yy+dy)&&a.tiles[yy+dy]?.[xx+dx]?.startsWith('c3_asphalt'))this.curb(x,y,side)}
    if(type==='c3_water'){
      for(const [side,dx,dy]of [['n',0,-1],['e',1,0],['s',0,1],['w',-1,0]])if(a.tiles[yy+dy]?.[xx+dx]&&!['c3_water','c3_bridge'].includes(a.tiles[yy+dy][xx+dx]))this.curb(x,y,side);
    }
    return true;
  },
  installMaps(){
    for(const a of Object.values(areas)){
      if(a.env2Installed)continue;a.env2Installed=true;
      for(const p of a.props)if(p.type==='c3_resonance_circle')p.flat=true;
      const add=(item,x,y,w,h,extra={})=>a.props.push({type:'env2_prop',item,x,y,w,h,...extra});
      if(a.id==='distortion_district'){
        a.env2Apron=new Set();
        for(const [left,top,width,height]of [[11,16,7,3],[23,12,7,3],[53,12,6,3],[32,6,7,4],[55,32,5,4]])for(let y=top;y<top+height;y++)for(let x=left;x<left+width;x++)if(!a.blocked.has(x+','+y))a.env2Apron.add(x+','+y);
        for(const g of a.gates){const point={contratempo:[13.5,16.5],ciro_workshop:[25.5,12.5],power_plant:[55.5,12.5]}[g.to];if(point)[g.x,g.y]=point;}
        for(const [x,y,to]of [[13,16,'contratempo'],[25,12,'ciro_workshop'],[55,12,'power_plant']])add('threshold_open',x,y,80,24,{flat:true,entryTo:to});
        add('wayfinder_left',30,29,64,40);add('wayfinder_right',48,28,64,40);
        add('platform_embark',35,8,112,42,{flat:true});
        for(const [x,y]of [[20,35],[35,27],[49,30]])add('crossing_horizontal',x,y,72,48,{flat:true});add('crossing_vertical',35,15,48,72,{flat:true});
        for(const [x,y]of [[18,34],[35,33],[49,27]])add('service_drain',x,y,34,20,{flat:true});
        add('canal_pier_left',56,33,72,42);add('canal_pier_right',58,33,72,42);
      }
      if(a.id==='sky_terminal'){add('terminal_canopy',13,2,218,125);add('platform_embark',13,7,112,38,{flat:true});add('cloud_arrival_arch',23,10,92,88)}
      const returnPoint={contratempo:[13.5,17.5],ciro_workshop:[25.5,13.5],power_plant:[55.5,13.5]}[a.id];
      if(returnPoint)for(const g of a.gates)if(g.to==='distortion_district')[g.tx,g.ty]=returnPoint;
      if(a.id==='contratempo'){
        add('tapete_palco',14,6,196,40,{flat:true,groundMaterial:true});
        const desk=ClubStage.desk;
        add('projection_console',desk.x,desk.y,desk.w,desk.h,{clubSoundDesk:true,worldGroundY:desk.y});
        add('projector_rig',22,3,52,66);add('acoustic_wallpanel',4,3,74,70);add('acoustic_wallpanel',24,3,74,70);
      }
      if(a.id==='power_plant'){add('canal_gate_closed',17,4,36,48,{state:'plant'});add('threshold_inlay',16,17,44,22,{flat:true})}
      if(a.id==='sky_canal'){add('canal_pier_left',16,11,34,34);add('canal_pier_right',24,11,34,34);add('wind_current_marker',12,10,36,56)}
      if(a.id==='sky_lift'){add('platform_embark',11,16,136,42,{flat:true});add('cloud_arrival_arch',11,3,142,120)}
      if(a.id==='cloud_sea'){
        // The original mk() left a walkable frame around the challenge routes.
        a.env2RemovedCloudCells=new Set();
        for(let y=1;y<a.h-1;y++)for(let x=1;x<a.w-1;x++)if((x===1||y===1||x===a.w-2||y===a.h-2)&&a.tiles[y][x]==='c3_cloud'){a.env2RemovedCloudCells.add(x+','+y);a.tiles[y][x]='c3_sky';solid(a,x,y)}
        add('wind_beacon_off',17,22,38,62,{state:'cloudPathA'});add('condensation_off',44,10,38,62,{state:'cloudPathB'});add('drum_anchor_off',31,16,52,66,{state:'cloudPlatform'});
        add('wind_current_marker',12,25,30,44);add('cloud_anchor_foundation',35,16,66,32,{flat:true,state:'platformFoundation'});
      }
      if(a.id==='last_torii'){add('checkpoint_recorder',13,13,46,46);add('core_column_left',4,5,30,90);add('core_column_right',22,5,30,90)}
      if(a.id==='silence_core'){add('core_column_left',4,12,36,110);add('core_column_right',30,12,36,110);add('core_entry_bridge',10,21,210,72,{flat:true});add('core_bridge_edge',10,23,210,30)}
      if(a.id==='voice_roofs'){for(const [x,y]of [[8,8],[24,8],[38,8]])add('rooftop_parapet',x,y,58,32)}
      if(a.id==='voices'){for(const [x,y]of [[24,24],[27,28]])add('canal_bank',x,y,54,34)}
    }
    routeCache.key='';
  },
  repairLegacyCloudPosition(){
    if(!G||G.area!=='cloud_sea'||current!==areas.cloud_sea||canBody121(G.x,G.y))return false;
    const removed=current.env2RemovedCloudCells;
    if(!removed||![-.29,0,.29].some(dx=>[-.29,0,.29].some(dy=>removed.has(Math.floor(G.x+dx)+','+Math.floor(G.y+dy)))))return false;
    const start=safeSpawn121(5.5,26.5);if(!start)return false;
    const queue=[{x:Math.floor(start.x)+.5,y:Math.floor(start.y)+.5}],seen=new Set([Math.floor(start.x)+','+Math.floor(start.y)]);
    let best=queue[0],distance=Infinity;
    for(let head=0;head<queue.length;head++){
      const p=queue[head],d=Math.hypot(p.x-G.x,p.y-G.y);if(d<distance){best=p;distance=d}
      for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const x=p.x+dx,y=p.y+dy,key=Math.floor(x)+','+Math.floor(y);if(!seen.has(key)&&canBody121(x,y)){seen.add(key);queue.push({x,y})}}
    }
    G.x=best.x;G.y=best.y;trail=[];resetMotion10();
    cam.x=clamp(G.x*T-VW/2,0,Math.max(0,current.w*T-VW));cam.y=clamp(G.y*T-VH/2,0,Math.max(0,current.h*T-VH));
    if(C3.coopActive())C3.syncCoop(true);
    save(true);return true;
  },
  itemFor(p){
    const c=G?.c3||{},f=G?.flags||{};
    if(p.type==='env2_prop'){
      if(p.entryTo==='power_plant'&&!c.twoRoutesOpen)return 'threshold_closed';
      if(p.state==='plant')return c.usinaGate?'canal_gate_open':'canal_gate_closed';
      if(p.state==='cloudPathA')return c.cloudPathA?'wind_beacon_on':'wind_beacon_off';
      if(p.state==='cloudPathB')return c.cloudPathB?'condensation_on':'condensation_off';
      if(p.state==='cloudPlatform')return c.cloudPlatform?'drum_anchor_on':'drum_anchor_off';
      if(p.state==='platformFoundation'&&!c.cloudPlatform)return null;
      return p.item;
    }
    if(p.type==='c3_house')return ['residence_laundry','residence_roof_garden','residence_service_window'][Math.abs(p.x+p.y)%3];
    if(p.type==='c3_machine')return G.area==='distortion_district'?'plant_entrance':(G.area==='sky_canal'?c.canalPath||c.canalDone:c.usinaGate||c.usinaDone)?'machine_active':'machine_inactive';
    if(p.type==='c3_stage')return c.clubPhraseDone?'stage_active':'stage_idle';
    if(p.type==='c3_speakers')return (G.area==='sky_canal'?c.canalDone:G.area==='power_plant'?c.usinaGate:c.clubPhraseDone)?'speaker_active':'speaker_idle';
    if(p.type==='c3_pressure_switch')return c.usinaGate?'pressure_switch_active':'pressure_switch_inactive';
    if(p.type==='c3_valve_station')return c.usinaDone?'valve_released':'valve_stalled';
    if(p.type==='c3_canal_gate'||p.type==='c3_rescue_barrier')return c.canalDone?'canal_gate_open':'canal_gate_closed';
    if(p.type==='c3_silence_eye')return c.silenceDone?'silence_eye_closed':G?.options10?.reducedMotion?'silence_eye_half':Math.floor(tick*.7+p.x)%8===0?'silence_eye_half':'silence_eye_open';
    if(p.type==='c3_silence_altar')return c.silenceDone?'silence_altar_dormant':'silence_altar_awake';
    if(p.type==='c3_resonance_circle')return c.metronomeDone?'resonance_circle_on':'resonance_circle_off';
    if(p.type==='c3_sanctuary'&&G.area==='last_torii')return 'last_torii_arch';
    if(p.type==='rootGate')return (G.area==='voice_roofs'?f.fogCleared11:f.roots)?'root_gate_open':'root_gate_closed';
    if(p.type==='stoneCrystal')return /^#(?:e|d|f)/i.test(p.color||'')?'crystal_timbre':'crystal_pulse';
    if(p.type==='life091'&&p.kind==='window')return 'window_warm';
    if(p.type==='life091'&&p.kind==='frame')return p.x%2?'frame_music':'frame_landscape';
    return {c3_bar:'bar_counter',c3_table:'club_table',lamp:'forest_lamp',checkpointStone:'checkpoint_recorder',pool:'pool_stone',well:'well_stone',totem:'root_totem',rootWall:'root_wall',mushroom:'mushroom_cluster',memoryBell:'memory_bell',window:G.area==='studio'?'window_rustic':'window_warm',doorLit:'door_lit'}[p.type]||null;
  }
};
const cenarioBuildV2=buildMaps;
buildMaps=function(...args){const result=cenarioBuildV2(...args);CenariosV2.installMaps();return result};
const cenarioSetAreaV2=setArea;
setArea=function(...args){const result=cenarioSetAreaV2(...args);CenariosV2.repairLegacyCloudPosition();return result};
const cenarioUpdateV2=update;
update=function(dt){CenariosV2.ensure();return cenarioUpdateV2(dt)};
const cenarioTileV2=drawTile;
drawTile=function(type,x,y,xx,yy){if(!CenariosV2.tile(type,x,y,xx,yy))return cenarioTileV2(type,x,y,xx,yy)};

const cenarioPropV2=drawProp;
drawProp=function(p,cx,cy){
  if(!G)return cenarioPropV2(p,cx,cy);CenariosV2.ensure();
  if(p.type==='c3_sanctuary'&&G.area==='silence_core')return;
  if(p.type==='memoryBell'&&(G.flags.bell||G.flags.bellReward))return;
  const x=(p.x+.5)*T-cx,y=(p.y+.65)*T-cy;
  if(p.type==='checkpointStone'&&C3.AREAS.includes(G.area)){
    if(c3SheetSprite(C3.images.atlas_urban,2,2,3,3,x,y,46,60))return;
  }
  if(p.type==='maskStand'&&G.flags.masks){
    const image=envSprites.maskStand;
    if(image?.complete&&image.naturalWidth){ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(image,0,Math.round(image.naturalHeight*.64),image.naturalWidth,Math.round(image.naturalHeight*.36),Math.round(x-56),Math.round(y-10),112,36);ctx.restore();return;}
  }
  if(p.type==='c3_sign'){
    const theme=p.theme||(['sky_terminal','sky_lift'].includes(G.area)?'lift':'club'),item='sign_'+theme,anchor={club:[13.5,15.6],workshop:[25.5,11.6],plant:[55.5,11.6],canal:[57.5,32.2],lift:[35.5,7.7]}[theme];
    const sx=G.area==='distortion_district'&&anchor?anchor[0]*T-cx:x,sy=G.area==='distortion_district'&&anchor?anchor[1]*T-cy:y;
    const w=Math.max(102,Math.min(164,(p.text||'').length*5.7+30));
    if(CenariosV2.sprite(item,sx,sy,w,92)){
      ctx.save();ctx.textAlign='center';ctx.font='bold 9px monospace';ctx.fillStyle='#fff1d3';ctx.shadowColor='#161320';ctx.shadowBlur=2;ctx.fillText(p.text||'DISTORÇÃO',Math.round(sx),Math.round(sy-7));ctx.restore();return;
    }
  }
  if(p.type==='c3_interference'&&(G.c3?.canalPath||G.c3?.canalDone)){
    const spec=C3_PROP_ATLAS.c3_interference_calm;if(c3SheetSprite(C3.images[spec[0]],...spec.slice(1,5),x,y,...spec.slice(5)))return;
  }
  const item=CenariosV2.itemFor(p);if(!item){if(p.type==='env2_prop')return;return cenarioPropV2(p,cx,cy)}
  if(p.groundMaterial&&CenariosV2.available(item)){
    ctx.save();ctx.beginPath();ctx.rect(x-p.w/2,y-p.h/2,p.w,p.h);ctx.clip();
    for(let yy=Math.floor((p.y*T-p.h/2)/T);yy<Math.ceil((p.y*T+p.h/2)/T)+1;yy++)for(let xx=Math.floor((p.x*T-p.w/2)/T);xx<Math.ceil((p.x*T+p.w/2)/T)+1;xx++)CenariosV2.material(item,xx*T-cx,yy*T-cy,xx,yy);
    ctx.restore();return;
  }
  const specs={c3_house:[168,164],c3_machine:G.area==='distortion_district'?[168,155]:[84,112],c3_stage:[220,106],c3_speakers:[38,62],c3_bar:[130,88],c3_table:[58,50],c3_pressure_switch:[48,40],c3_valve_station:[80,75],c3_canal_gate:[90,90],c3_rescue_barrier:[70,64],c3_silence_eye:[66,92],c3_silence_altar:[172,138],c3_resonance_circle:[120,78],c3_sanctuary:[180,140],rootGate:[92,106],stoneCrystal:[44,64],lamp:[42,94],checkpointStone:[58,68],pool:[72,48],well:[64,76],totem:[38,68],rootWall:[38,42],mushroom:[16,18],memoryBell:[46,66],window:[64,72],doorLit:[40,62],life091:p.kind==='frame'?[44,32]:[54,64]};
  const [w,h]=p.type==='env2_prop'?[p.w,p.h]:specs[p.type]||[64,80];
  const base=p.type==='life091'&&p.kind==='frame'?y-17:p.flat?y+h/2:y;
  let alpha=1;
  if(p.type==='c3_house'){
    const actors=[G,...(C3.coopActive()?[C3.coop]:[])];
    if(actors.some(a=>Math.abs(a.x*T-cx-x)<w/2&&a.y*T-cy>y-h&&a.y*T-cy<y-16))alpha=.48;
  }
  if(CenariosV2.sprite(item,x,base,w,h,alpha))return;
  if(p.type!=='env2_prop')return cenarioPropV2(p,cx,cy);
};

// Ground ornaments render before the actor list, rather than painting over feet.
const cenarioEnvV2=drawEnv;
drawEnv=function(){
  if(!G||!current)return cenarioEnvV2();
  const original=current.props,ground=original.filter(p=>p.flat);
  if(!ground.length)return cenarioEnvV2();
  // The base renderer's existing rug branch provides its pre-actor ground pass.
  const converted=new Map();
  for(const p of ground){converted.set(p,[p.type,p.kind]);p.env2GroundType=p.type;p.type='life091';p.kind='rug';p.env2Ground=true;}
  try{return cenarioEnvV2()}finally{for(const [p,[type,kind]]of converted){p.type=type;p.kind=kind;delete p.env2Ground;delete p.env2GroundType;}}
};
const cenarioGroundPropV2=drawProp;
drawProp=function(p,...args){
  if(p.env2Ground){const type=p.type;p.type=p.env2GroundType||'env2_prop';try{return cenarioGroundPropV2(p,...args)}finally{p.type=type}}
  return cenarioGroundPropV2(p,...args);
};
