/* Render-contract tests; visual acceptance belongs to environment_world_browser. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../game/source/chapter-03/environment_depth_v1.js'),'utf8');
const facadeManifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/environment-volume/v1/manifest.json'),'utf8'));
function fixture(area='studio',art=true){
 const calls=[],stack=[];
 const ctx={globalAlpha:1,fillStyle:'black',strokeStyle:'black',lineWidth:1,
  save(){stack.push([this.globalAlpha,this.fillStyle,this.strokeStyle,this.lineWidth]);},
  restore(){[this.globalAlpha,this.fillStyle,this.strokeStyle,this.lineWidth]=stack.pop();}};
 for(const kind of ['fillRect','beginPath','moveTo','lineTo','closePath','fill','stroke','arc','rect','clip','drawImage','fillText','transform'])ctx[kind]=function(...args){calls.push({kind,args,color:kind==='stroke'?this.strokeStyle:this.fillStyle,alpha:this.globalAlpha,width:this.lineWidth})};
 const s={console,ctx,calls,Math,Object,Array,Set,T:24,VW:768,VH:432,cam:{x:0,y:0},mode:'walk',tick:1,
  G:{area,x:12,y:14,flags:{masks:true},c3:{usinaGate:false}},
  current:{id:area,w:28,h:20,props:[],tiles:[['wood']],blocked:new Set(['2,2']),gates:[{x:3,y:4,to:'outside'}],events:[{id:'plot',x:12,y:9}]},
  oldTileCalls:0,oldPropCalls:0,oldPropAlpha:null};
 s.Image=class{constructor(){this.complete=false;this.naturalWidth=768;this.naturalHeight=768;this.decodes=0;}decode(){this.decodes++;this.complete=true;return Promise.resolve();}};
 s.window=s;s.drawTile=()=>{s.oldTileCalls++;return 'base-tile';};
 s.drawProp=()=>{s.oldPropCalls++;s.oldPropAlpha=ctx.globalAlpha;return 'base-prop';};
 s.C3={coopActive:()=>!!s.coopEnabled,coop:{x:4,y:5}};
 if(art){
  s.CenariosDesertoV1={binding(p){return p.type==='c3_club'?{item:'club',display:[220,176]}:null;}};
  s.CenariosV2={itemFor:p=>p.type==='c3_house'?'house':null,available:item=>({a:{content:item==='club'?[20,8,344,360]:[33,8,319,360]}}),
   material(item,x,y,xx,yy){calls.push({kind:'material',item,x,y,xx,yy});return true;}};
 }
 vm.createContext(s);vm.runInContext(source.replace('__ENVIRONMENT_VOLUME_ASSETS__',JSON.stringify({c1:'data:fixture1',c2:'data:fixture2'})).replace('__ENVIRONMENT_VOLUME_MANIFEST__',JSON.stringify(facadeManifest)),s);s.depth=s.EnvironmentDepthV1;return s;
}
const snapshot=s=>JSON.stringify({G:s.G,current:{...s.current,blocked:[...s.current.blocked]}});
let passed=0;
function test(name,fn){fn();passed++;console.log('OK · '+name);}
test('module installation and rendering never alter map, props, events, gates or progress',()=>{
 const s=fixture('distortion_district');s.current.props=[{type:'c3_club',x:13,y:15}];const before=snapshot(s);
 s.depth.drawGround();s.drawProp(s.current.props[0],0,0);s.drawTile('c3_clubfloor',120,120,5,5);
 assert.equal(snapshot(s),before);assert.equal(s.oldPropCalls,1);assert.equal(s.oldTileCalls,1);
});
test('disabled render delegates once, leaves pixels alone and restores original sort order',()=>{
 const s=fixture();s.depth.enabled=false;const p={type:'house',x:4,y:7,w:6,h:5};
 assert.equal(s.drawTile('wood',0,0,5,5),'base-tile');assert.equal(s.drawProp(p,0,0),'base-prop');s.depth.drawGround();
 assert.equal(s.calls.length,0);assert.equal(s.oldTileCalls,1);assert.equal(s.oldPropCalls,1);assert.equal(s.depth.sortY(p),7.5);
 const light=s.depth.lightingProfile();assert.equal(light.ambient,1);assert.equal(light.lights.length,0);
});
test('thirteen actual interiors expose different architectural surface recipes',()=>{
 const s=fixture(),styles=new Set(),recipes=new Set();
 const ids=['studio','corridor','chamber','celina_home','bento_shop','tape_market','radio9','voice_tower','contratempo','ciro_workshop','power_plant','last_torii','silence_core'];
 for(const id of ids){s.G.area=id;s.current.id=id;s.calls.length=0;const p=s.depth.profile();assert(p,id);styles.add(p.style);for(const [xx,yy]of [[3,5],[6,6],[14,10],[20,5]])s.depth.tile('wood',0,0,xx,yy);recipes.add(JSON.stringify(s.calls));}
 assert.equal(styles.size,13);assert.equal(recipes.size,13);assert.equal(s.depth.profile('city'),null);
});
test('walkable void and sky are never painted as interior floors',()=>{
 const s=fixture('silence_core');for(const type of ['void','c3_sky']){s.calls.length=0;s.depth.tile(type,0,0,4,4);assert.equal(s.calls.length,0);}
 s.G.area='city';s.depth.tile('wood',0,0,4,4);assert.equal(s.calls.length,0);
});
test('wall recipes differ from floors and all changes are clipped to one existing tile',()=>{
 const s=fixture('radio9');s.depth.tile('wall092',17,29,5,2);assert(s.calls.some(c=>c.kind==='clip'));
 assert.deepEqual(s.calls.find(c=>c.kind==='rect').args,[17,29,24,24]);
 const wall=JSON.stringify(s.calls);s.calls.length=0;s.depth.tile('radiofloor',17,29,5,8);assert.notEqual(JSON.stringify(s.calls),wall);
 assert.equal(s.ctx.globalAlpha,1);assert.equal(s.ctx.fillStyle,'black');
});
test('houses sort by their physical base while furniture and flat ornaments retain ordering',()=>{
 const s=fixture('city'),p={type:'house',x:4,y:7,w:6,h:5};assert.equal(s.depth.sortY(p),12.125);
 const v={type:'voiceHouse',x:4,y:7,w:6,h:5};assert.equal(s.depth.sortY(v),12.25);
 assert.equal(s.depth.sortY({type:'table',x:1,y:2}),2.5);
 assert.equal(s.depth.sortY({type:'env2_prop',flat:true,x:1,y:2}),2.5);
 s.G.area='distortion_district';assert.equal(s.depth.sortY({type:'c3_club',x:13,y:15}),15.65);
});
test('ground pass draws only a tight contact band before facades without moving geometry',()=>{
 const s=fixture('city');s.current.props=[{type:'house',x:4,y:3,w:5,h:4},{type:'house',x:100,y:100,w:5,h:4},{type:'tree',x:8,y:6}];const before=snapshot(s);
 s.depth.drawGround();assert.equal(s.calls.filter(c=>c.kind==='fill').length,1);assert.equal(s.oldPropCalls,0);assert.equal(snapshot(s),before);
 assert(s.calls.some(c=>c.kind==='fill'&&c.color==='#17171d6b'));
});
test('facade dimensions follow actual atlas fit rather than requested display width',()=>{
 const s=fixture('distortion_district'),b=s.depth.facade({type:'c3_club',x:13,y:15});
 assert(Math.abs(b.w-344*(176/360))<1e-9);assert.equal(b.h,176);assert.equal(b.bottom,15.65*24);
});
test('actors behind facade fade it and the canvas alpha always returns to its prior value',()=>{
 const s=fixture('city'),p={type:'house',x:4,y:4,w:6,h:5};s.G.x=7;s.G.y=6;s.ctx.globalAlpha=.8;
 assert.equal(s.drawProp(p,0,0),'base-prop');assert(Math.abs(s.oldPropAlpha-.8*.58)<1e-9);assert.equal(s.ctx.globalAlpha,.8);
 s.G.y=11;s.drawProp(p,0,0);assert.equal(s.oldPropAlpha,.8);
 s.coopEnabled=true;s.C3.coop={x:7,y:6};s.drawProp(p,0,0);assert(Math.abs(s.oldPropAlpha-.8*.58)<1e-9);
});
test('C3 residences keep the existing alpha guard, and missing art retains original rendering',()=>{
 const s=fixture('distortion_district',false),p={type:'c3_house',x:9,y:9,w:7,h:5};s.G.x=9;s.G.y=7;
 assert.equal(s.drawProp(p,0,0),'base-prop');assert.equal(s.oldPropAlpha,1);assert.equal(s.oldPropCalls,1);
 assert(s.depth.facade(p));s.G.area='city';s.calls.length=0;assert.equal(s.drawProp(p,0,0),'base-prop');assert.equal(s.calls.length,0);
});
test('lighting compatibility profiles are neutral and do not expose mutable source data',()=>{
 const s=fixture();for(const id of Object.keys(s.depth.profiles)){const p=s.depth.lightingProfile(id);assert.equal(p.ambient,1);assert.equal(p.lights.length,0);assert.equal(s.depth.profiles[id].lights,undefined);}
 const p=s.depth.lightingProfile('studio');p.lights.push({x:1000});assert.equal(s.depth.lightingProfile('studio').lights.length,0);
});
test('render exception restores canvas state and does not duplicate the original renderer',()=>{
 const s=fixture('city'),p={type:'house',x:4,y:4,w:6,h:5};s.ctx.globalAlpha=.8;
 s.ctx.fill=()=>{throw Error('fixture canvas failure')};assert.throws(()=>s.drawProp(p,0,0),/fixture canvas failure/);assert.equal(s.ctx.globalAlpha,.8);assert.equal(s.oldPropCalls,0);
});
test('authored texture remains exposed: studio and chamber never receive an opaque plain tile',()=>{
 for(const area of ['studio','chamber']){const s=fixture(area);for(const type of ['wood','rug','marble'])s.drawTile(type,0,0,6,6);
  assert.equal(s.oldTileCalls,3);assert(!s.calls.some(c=>c.kind==='fillRect'&&c.args[2]===24&&c.args[3]===24&&c.alpha===1));}
});
test('room zones select full authored material textures rather than replacing them with flat fills',()=>{
 for(const [area,xx,yy,item]of [['celina_home',3,5,'calcada_pedra'],['bento_shop',18,7,'metal_industrial'],['tape_market',12,10,'tapete_palco'],['radio9',12,5,'tapete_palco'],['ciro_workshop',6,7,'metal_industrial']]){
  const s=fixture(area);s.drawTile('wood',0,0,xx,yy);assert(s.calls.some(c=>c.kind==='material'&&c.item===item));
  assert(!s.calls.some(c=>c.kind==='fillRect'&&c.args[2]===24&&c.args[3]===24&&c.alpha===1));
 }
});
test('all eight real facade cells align their doorway pivots to the unchanged entrance anchor',()=>{
 const s=fixture('city');s.depth.image('c1').complete=true;s.depth.image('c2').complete=true;
 const cases=[...['house','shop','inn','archive'].map(kind=>({type:'house',kind,x:4,y:7,w:6,h:5})),...['CASA DE CELINA','OFICINA DO BENTO','MERCADO DAS FITAS','RÁDIO 9'].map(sign=>({type:'voiceHouse',sign,x:4,y:7,w:6,h:5}))];
 const keys=new Set();for(const p of cases){const b=s.depth.facade(p),item=b.newSprite.item;keys.add(b.newSprite.key);
  assert(Math.abs(b.x+item.pivot[0]*b.scale-(p.x+p.w/2)*24)<1e-9);
  assert(Math.abs(b.y+item.pivot[1]*b.scale-b.bottom)<1e-9);
  s.calls.length=0;s.drawProp(p,0,0);const images=s.calls.filter(c=>c.kind==='drawImage');assert.equal(images.length,1);assert.deepEqual(images[0].args.slice(1,5),Array.from(item.content));
  assert(!s.calls.some(c=>c.kind==='stroke'||c.kind==='fill'),'new 3/4 sprite must not receive a second opaque wall');
 }
 assert.equal(keys.size,8);assert.equal(s.oldPropCalls,0);
});
test('loading facades retain the original renderer, while ready decodes both sheets without a blocking game call',()=>{
 const s=fixture('city'),p={type:'house',kind:'house',x:4,y:4,w:6,h:5};
 assert.equal(s.drawProp(p,0,0),'base-prop');assert.equal(s.oldPropCalls,1);
 const image=s.depth.image('c1'),promise=s.depth.ready();assert.equal(typeof promise.then,'function');assert.equal(s.depth.image('c1'),image);assert.equal(image.decodes,1);assert.equal(s.depth.image('c2').decodes,1);
 s.calls.length=0;s.drawProp(p,0,0);assert.equal(s.oldPropCalls,1);assert.equal(s.calls.filter(c=>c.kind==='drawImage').length,1);
});
test('secondary C2 houses retain a domestic silhouette rather than all becoming radio stations',()=>{
 const s=fixture('voices');for(const sign of ['CASA DE CELINA','HOTEL','ARQUIVO'])assert.equal(s.depth.assetKey({type:'voiceHouse',sign}),'c2_home');
 for(const sign of ['RÁDIO 9','TORRE'])assert.equal(s.depth.assetKey({type:'voiceHouse',sign}),'c2_radio');
 assert.equal(s.depth.assetKey({type:'voiceHouse',sign:'LOJA DE DISCOS'}),'c2_shop');
 assert.equal(s.depth.assetKey({type:'c3_house'}),null);
});
test('studio furniture retains its explicit ground anchor when architectural sorting is enabled or disabled',()=>{
 const s=fixture('studio'),sofa={type:'sofa',x:2,y:6,worldGroundY:12};
 assert.equal(s.depth.sortY(sofa),12);s.depth.enabled=false;assert.equal(s.depth.sortY(sofa),12);
 assert.equal(s.depth.sortY({type:'table',x:4,y:8}),8.5);
});
console.log(JSON.stringify({suite:'environment-depth-v1',passed,visualAcceptance:false}));
