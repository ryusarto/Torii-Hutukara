/* Pause routing regression for source handlers; no browser, build or save needed.
 * Run: node qa/review110_mobile_regression.cjs
 * This checks touch/Options mode guards. Browser QA owns real pointer delivery,
 * orientation, overlay rendering and freezing/resuming the cloud simulation.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../game/source/chapter-03/input_mobile_combat.js'),'utf8');

// Compile complete real declarations instead of copying their conditions into
// the fixture. The parser handles braces in strings, comments and templates.
function declarationAt(start){
  for(let end=source.indexOf('}',start);end!==-1;end=source.indexOf('}',end+1)){
    const candidate=source.slice(start,end+1);
    try{new vm.Script(candidate);return candidate}catch(error){if(!(error instanceof SyntaxError))throw error}
  }
  throw Error('Unterminated production declaration at '+start);
}
const declarations=[];
for(const name of ['mobileAction121','canPause121','bindMobile121']){
  const start=source.indexOf('function '+name+'(');
  if(start<0){assert.equal(name,'canPause121','Missing production touch handler');continue}
  declarations.push(declarationAt(start));
}
for(const name of ['handlePrimaryPad','handleSecondPad']){
  const marker='C3.'+name+'=function(';
  const start=source.indexOf(marker);
  assert(start>=0,'Missing production handler '+name);
  declarations.push(declarationAt(start));
}

function fixture(mode,{game=true,coop=true}={}){
  const calls={open:0,close:0,gameplay:0};
  const context={
    mode,G:game?{}:null,Input121:{pointers:new Map(),stickPointer:null,touch:[0,0],touchRun:false},
    activeModes10:()=>['walk','action'].includes(context.mode),
    openSystem(){calls.open++;context.mode='overlay'},
    closeOverlay(){calls.close++;context.mode='walk'},
    mergeInput121(){},enableAudio(){},
    C3:{
      padDirection:()=>[0,0],padPressed:()=>false,padEdge:(_,button)=>button===9,
      coopActive:()=>coop,syncCoop(){},handleMenuPad(){},
    },
  };
  for(const name of ['interact','dodgeAction','switchHero','skillAction','advancedSkill','duoAction','attackAction','advanceDialogue','rhythmPush']){
    context[name]=()=>{calls.gameplay++};
  }
  vm.createContext(context);
  vm.runInContext(declarations.join('\n'),context,{filename:'input_mobile_combat.pause-handlers.js'});
  return {context,calls};
}
const inputs={
  touch:context=>context.mobileAction121('pause'),
  'Options P1':context=>context.C3.handlePrimaryPad({}),
  'Options P2':context=>context.C3.handleSecondPad({}),
};
let passed=0,failed=0;
function check(name,run){
  try{run();passed++;console.log('OK · '+name)}
  catch(error){failed++;console.error('FAIL · '+name+'\n'+error.message)}
}
for(const [name,input]of Object.entries(inputs)){
  for(const mode of ['walk','action','cloud_fall'])check(name+' pauses '+mode,()=>{
    const {context,calls}=fixture(mode);input(context);
    assert.equal(calls.open,1,'Expected exactly one system menu request');
    assert.equal(context.mode,'overlay');assert.equal(calls.gameplay,0);
  });
  for(const mode of ['dialogue','rhythm','title'])check(name+' preserves '+mode,()=>{
    const {context,calls}=fixture(mode);input(context);
    assert.equal(calls.open,0,'Pause must not interrupt this mode');
    assert.equal(context.mode,mode);assert.equal(calls.gameplay,0);
  });
  for(const mode of ['walk','cloud_fall','title'])check(name+' requires a game in '+mode,()=>{
    const {context,calls}=fixture(mode,{game:false});input(context);
    assert.equal(calls.open,0);assert.equal(calls.close,0);assert.equal(context.mode,mode);
  });
}
for(const name of ['Options P1','Options P2'])check(name+' closes an existing overlay',()=>{
  const {context,calls}=fixture('overlay');inputs[name](context);
  assert.equal(calls.close,1);assert.equal(calls.open,0);assert.equal(context.mode,'walk');
});
check('Options P2 requires active coop',()=>{
  const {context,calls}=fixture('cloud_fall',{coop:false});inputs['Options P2'](context);
  assert.equal(calls.open,0);assert.equal(context.mode,'cloud_fall');
});
// Dispatch the actual production listeners through a tiny event-target fixture.
// This verifies ordering/cancellation, not browser hit testing or synthetic click
// retargeting (covered by review110_browser.cjs with real touchscreen events).
function touchFixture(mode='walk'){
  const f=fixture(mode),listeners=new Map(),pressed=new Set(),captures=[];
  const target={id:'pauseFixture',dataset:{mobileAction:'pause'},
    classList:{add:name=>pressed.add(name),remove:name=>pressed.delete(name)},
    setPointerCapture:id=>captures.push(id),
    closest(){return this},
  };
  const deck={addEventListener(name,handler){listeners.set(name,handler)}};
  f.context.bindMobile121(deck);
  return {...f,pressed,captures,target,dispatch(type,pointerId=17,extra={}){
    const handler=listeners.get(type);assert(handler,'Missing real listener for '+type);
    const prevented={default:false,propagation:false};
    handler({type,pointerId,target,detail:1,
      preventDefault(){prevented.default=true},stopPropagation(){prevented.propagation=true},...extra});
    return prevented;
  }};
}
for(const mode of ['walk','cloud_fall'])check('Captured pause waits for native click in '+mode,()=>{
  const f=touchFixture(mode);f.dispatch('pointerdown');
  assert.equal(f.calls.open,0);assert.equal(f.context.mode,mode);
  assert(f.pressed.has('pressed'));assert.equal(f.context.Input121.pointers.size,1);
  assert.deepEqual(f.captures,[17]);
  f.dispatch('pointerup');
  assert.equal(f.calls.open,0,'pointerup must not expose the overlay to the following click');
  assert.equal(f.context.Input121.pointers.size,0);assert(!f.pressed.has('pressed'));
  f.dispatch('lostpointercapture');
  const prevented=f.dispatch('click');
  assert.equal(f.calls.open,1);assert.equal(f.context.mode,'overlay');
  assert(prevented.default&&prevented.propagation,'Handled pause click must not propagate');
  f.dispatch('pointerup');f.dispatch('click');
  assert.equal(f.calls.open,1,'The click authorization must be consumed exactly once');
});
for(const cancelled of ['pointercancel','lostpointercapture'])check(cancelled+' cancels pending pause',()=>{
  const f=touchFixture('cloud_fall');f.dispatch('pointerdown');f.dispatch(cancelled);
  assert.equal(f.context.Input121.pointers.size,0);assert(!f.pressed.has('pressed'));
  f.dispatch('pointerup');f.dispatch('click');
  assert.equal(f.calls.open,0);assert.equal(f.context.mode,'cloud_fall');
});
check('Unrelated pointer release cannot trigger pending pause',()=>{
  const f=touchFixture();f.dispatch('pointerdown');f.dispatch('pointerup',99);
  assert.equal(f.calls.open,0);assert.equal(f.context.Input121.pointers.size,1);
  f.dispatch('click');assert.equal(f.calls.open,0);
  f.dispatch('pointerup');f.dispatch('click');assert.equal(f.calls.open,1);
});
check('Keyboard/assistive click can activate pause without a touch pointer',()=>{
  const f=touchFixture('cloud_fall');f.dispatch('click',-1,{detail:0});
  assert.equal(f.calls.open,1);assert.equal(f.context.mode,'overlay');
});
check('A new pointerdown invalidates the previous click authorization',()=>{
  const f=touchFixture();f.dispatch('pointerdown');f.dispatch('pointerup');
  f.dispatch('pointerdown',18);f.dispatch('click');assert.equal(f.calls.open,0);
  f.dispatch('pointerup',18);f.dispatch('click',18);assert.equal(f.calls.open,1);
});
check('A cleared touch cannot authorize a later pointerup/click',()=>{
  const f=touchFixture();f.dispatch('pointerdown');
  // releaseTouch121 clears this map on rotation, blur and overlay entry.
  f.context.Input121.pointers.clear();
  f.dispatch('pointerup');f.dispatch('click');assert.equal(f.calls.open,0);
});
check('A click from another target does not activate pause',()=>{
  const f=touchFixture();f.dispatch('pointerdown');f.dispatch('pointerup');
  const other={dataset:{mobileAction:'pause'},closest(){return this}};
  f.dispatch('click',17,{target:other});assert.equal(f.calls.open,0);
});
console.log(`${passed} passed; ${failed} failed.`);
if(failed)process.exitCode=1;
