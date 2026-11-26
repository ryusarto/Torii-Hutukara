/* Isolated browser verification of scene art, state and collision contracts. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||(()=>{try{return require.resolve('playwright-core')}catch{return 'playwright'}})());
const root=path.resolve(__dirname,'..'),out=path.join(root,process.env.TORII_SCENE_QA_ROOT||'qa/cenarios-v2');
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await (process.env.CHROME_PATH?chromium.launch({executablePath:process.env.CHROME_PATH,headless:true}):chromium.connectOverCDP(process.env.CDP_URL||'http://127.0.0.1:9238')),context=await browser.newContext({viewport:{width:1280,height:800}}),page=await context.newPage(),errors=[],checks=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;Object.defineProperty(navigator,'getGamepads',{value:()=>[]})});
 try{
  await page.goto(process.argv[2]||'http://127.0.0.1:8767/',{waitUntil:'load',timeout:120000});
  await page.evaluate(async()=>{C3.loadDeferredImages();C3.start(true);for(let i=0;mode==='dialogue'&&i<100;i++)advanceDialogue();mode='walk';transitionAlpha=0;await CenariosV2.ready();$('start').classList.add('hidden');$('overlay').classList.add('hidden');$('dialogue').classList.add('hidden');$('cinema').style.display='none';});
  await page.waitForFunction(()=>Object.values(C3.images).every(i=>i.complete&&i.naturalWidth),null,{timeout:120000});
  async function check(name,fn){const detail=await fn();checks.push({name,passed:true,detail});console.log('OK · '+name)}
  await check('Complete nonempty RGBA library with correctly sized sheets and transparent gutters',async()=>{
   const result=await page.evaluate(()=>{
    const art=CenariosV2,c=document.createElement('canvas'),q=c.getContext('2d',{willReadFrequently:true});let items=0;
    for(const [id,s]of Object.entries(art.manifest.sheets)){const im=art.image(id);if(im.naturalWidth!==s.grid[0]*s.cell||im.naturalHeight!==s.grid[1]*s.cell)throw Error('Atlas size '+id)}
    for(const [name,a]of Object.entries(art.manifest.items)){
     c.width=c.height=a.cell[2];q.drawImage(art.image(a.sheet),...a.cell,0,0,c.width,c.height);const data=q.getImageData(0,0,c.width,c.height).data;
     if(data[3]||data[(c.width*c.height-1)*4+3])throw Error('Opaque gutter '+name);
     if(!data.some((n,i)=>i%4===3&&n))throw Error('Empty crop '+name);items++;
    }return {sheets:Object.keys(art.manifest.sheets).length,items,theme:art.manifest.theme||'v2'};
   });assert.deepEqual(result,result.theme==='deserto-v1'?{sheets:15,items:151,theme:'deserto-v1'}:{sheets:12,items:126,theme:'v2'});return result;
  });
  await check('Material patches join at mirrored edges without gaps or floor props',async()=>{
   const result=await page.evaluate(()=>{
    const names=['asfalto_seco','calcada_pedra','madeira_clube','madeira_oficina','pedra_santuario','basalto_nucleo','cloud_top_a'],fail=[];
    for(const name of names){CenariosV2.material(name,0,0,0,0);const c=CenariosV2.textures[name],q=c.getContext('2d'),d=q.getImageData(0,0,192,192).data;
     for(let p=0;p<192;p++)for(let ch=0;ch<4;ch++)if(d[(p*192+95)*4+ch]!==d[(p*192+96)*4+ch]||d[(95*192+p)*4+ch]!==d[(96*192+p)*4+ch]){fail.push(name);break}
    }return {tested:names.length,fail};
   });assert.deepEqual(result.fail,[]);return result;
  });
  await check('Cloud tiles use the contextual PNG cloud renderer in the actual drawTile chain',async()=>{
   const v=await page.evaluate(()=>{current=areas.cloud_sea;G.area=current.id;let calls=0;const previous=CenariosV2.cloud;CenariosV2.cloud=function(...args){calls++;return previous.apply(this,args)};try{drawTile('c3_cloud',100,100,16,23)}finally{CenariosV2.cloud=previous}return calls});assert.equal(v,1);return v;
  });
  await check('Usina, Canal, club, sky mechanisms and final eyes react to their own flags',async()=>{
   const values=await page.evaluate(()=>{
    const c=G.c3,old={...c},results=[];const run=(area,key,type,off,on)=>{G.area=area;c[key]=false;const a=CenariosV2.itemFor({type,x:6});c[key]=true;const b=CenariosV2.itemFor({type,x:6});results.push({area,key,off:a,on:b,pass:a===off&&b===on})};
    Object.assign(c,{usinaGate:false,usinaDone:false,canalPath:false,canalDone:false,clubPhraseDone:false,silenceDone:false});
    run('power_plant','usinaGate','c3_machine','machine_inactive','machine_active');
    run('sky_canal','canalPath','c3_machine','machine_inactive','machine_active');
    run('sky_canal','canalDone','c3_canal_gate','canal_gate_closed','canal_gate_open');
    run('sky_canal','canalDone','c3_rescue_barrier','canal_gate_closed','canal_gate_open');
    run('power_plant','usinaDone','c3_valve_station','valve_stalled','valve_released');
    run('contratempo','clubPhraseDone','c3_stage','stage_idle','stage_active');
    G.area='silence_core';c.silenceDone=true;results.push({pass:CenariosV2.itemFor({type:'c3_silence_eye',x:6})==='silence_eye_closed'});
    Object.assign(c,old);return results;
   });assert(values.every(v=>v.pass));return values;
  });
  await check('The open canal gate has an actual transparent passage',async()=>{
   const alpha=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=c.height=256;const q=c.getContext('2d');const a=CenariosV2.manifest.items.canal_gate_open;q.drawImage(CenariosV2.image(a.sheet),...a.cell,0,0,256,256);return q.getImageData(128,190,1,1).data[3]});assert.equal(alpha,0);return alpha;
  });
  await check('The real Baixo and Violino callbacks open their physical routes and visual states',async()=>{
   const result=await page.evaluate(()=>{
    current=areas.power_plant;G.area=current.id;G.x=15.5;G.y=15.5;mode='walk';G.flags.bass=true;G.c3.usinaGate=false;
    const plantBefore=canBody121(17.5,15.5);C3.openPlantGate();for(let i=0;mode==='dialogue'&&i<80;i++)advanceDialogue();
    const plantAfter=canBody121(17.5,15.5);moveActor121(G,1,0,3);const crossed=G.x>18.4;
    current=areas.sky_canal;G.area=current.id;G.x=14.5;G.y=12.5;mode='walk';G.flags.violin11=true;G.c3.canalPath=false;
    const canalBefore=canBody121(20.5,12.5);C3.openCanal();for(let i=0;mode==='dialogue'&&i<80;i++)advanceDialogue();
    return {plantBefore,plantAfter,crossed,canalBefore,canalAfter:canBody121(20.5,12.5),machine:CenariosV2.itemFor({type:'c3_machine'})};
   });assert(!result.plantBefore&&result.plantAfter&&result.crossed&&!result.canalBefore&&result.canalAfter);assert.equal(result.machine,'machine_active');return result;
  });
  await check('Cloud frame is blocked and portal arrivals fit the real engine body radius',async()=>{
   const result=await page.evaluate(()=>{
    const fits=(a,x,y)=>[-.29,.29].every(dx=>[-.29,.29].every(dy=>tileWalkable(a,x+dx,y+dy)));
    const invalid=[];for(const a of Object.values(areas))for(const g of a.gates)if(areas[g.to]&&!fits(areas[g.to],g.tx,g.ty))invalid.push({from:a.id,to:g.to,x:g.tx,y:g.ty});
    const a=areas.cloud_sea;let bad=0;for(let y=1;y<a.h-1;y++)for(let x=1;x<a.w-1;x++)if((x===1||y===1||x===a.w-2||y===a.h-2)&&tileWalkable(a,x+.5,y+.5))bad++;
    return {invalid,walkableRing:bad};
   });assert.deepEqual(result.invalid,[]);assert.equal(result.walkableRing,0);return result;
  });
  await check('Ground pass restores all prop identities after normal draw and a render exception',async()=>{
   const v=await page.evaluate(()=>{
    current=areas.contratempo;G.area=current.id;G.x=14;G.y=10;cam.x=cam.y=0;transitionAlpha=0;const before=JSON.stringify(current.props);drawEnv();const normal=before===JSON.stringify(current.props);
    const tile=drawTile;drawTile=()=>{throw Error('intentional isolated renderer test')};try{drawEnv()}catch{}finally{drawTile=tile}
    return {normal,onError:before===JSON.stringify(current.props),temporaryFields:current.props.some(p=>p.env2Ground||p.env2GroundType)};
   });assert(v.normal&&v.onError&&!v.temporaryFields);return v;
  });
  await check('Rendering scenes does not modify the serialized player save',async()=>{
   const v=await page.evaluate(()=>{current=areas.contratempo;G.area=current.id;G.x=14;G.y=10;const before=JSON.stringify(G);transitionAlpha=0;drawEnv();return before===JSON.stringify(G)});assert(v);return v;
  });
  await check('Telhados root gate follows violin fog rather than chapter 1 roots',async()=>{
   const v=await page.evaluate(()=>{G.area='voice_roofs';G.flags.roots=true;G.flags.fogCleared11=false;const a=CenariosV2.itemFor({type:'rootGate'});G.flags.fogCleared11=true;const b=CenariosV2.itemFor({type:'rootGate'});return [a,b]});assert.deepEqual(v,['root_gate_closed','root_gate_open']);return v;
  });
  await check('Repeated map installation is idempotent',async()=>{
   const v=await page.evaluate(()=>{const before=Object.values(areas).map(a=>a.props.length);CenariosV2.installMaps();CenariosV2.installMaps();return before.every((n,i)=>n===Object.values(areas)[i].props.length)});assert(v);return v;
  });
  await check('Three district entrances interact at the visible doors and have valid returns',async()=>{
   const v=await page.evaluate(()=>{
    const out=[];current=areas.distortion_district;G.area=current.id;mode='walk';G.c3.twoRoutesOpen=true;
    for(const [to,x,y,rx,ry]of [['contratempo',13.5,16.5,13.5,17.5],['ciro_workshop',25.5,12.5,25.5,13.5],['power_plant',55.5,12.5,55.5,13.5]]){
      G.x=x;G.y=y;const target=nearestInteraction(),gate=current.gates.find(g=>g.to===to),back=areas[to].gates.find(g=>g.to==='distortion_district');
      out.push({to,near:target?.type==='gate'&&target.value===gate,position:gate.x===x&&gate.y===y,body:canBody121(x,y),return:back.tx===rx&&back.ty===ry});
    }return out;
   });assert(v.every(x=>x.near&&x.position&&x.body&&x.return));return v;
  });
  await check('A legacy save on the removed cloud frame loads onto the entrance-connected route',async()=>{
   const v=await page.evaluate(()=>{
    G.area='cloud_sea';G.x=1.5;G.y=1.5;Object.assign(G.c3,{cloudPathA:false,cloudPathB:false,cloudPlatform:false});
    const loaded=normalizeSave(JSON.parse(JSON.stringify(G)));if(!loaded)throw Error('Legacy save normalization failed');G=loaded;buildMaps();setArea(G.area,G.x,G.y,false);
    return {body:canBody121(G.x,G.y),repaired:G.x!==1.5||G.y!==1.5,nearEntrance:G.x<18&&G.y>20,flags:[G.c3.cloudPathA,G.c3.cloudPlatform,G.c3.cloudPathB]};
   });assert(v.body&&v.repaired&&v.nearEntrance);assert.deepEqual(v.flags,[false,false,false]);return v;
  });
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'RUNTIME_RESULTS.json'),JSON.stringify({passed:checks.length,checks,browserErrors:errors,physicalPlaythrough:false},null,2)+'\n');
 }finally{await context.close();await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
