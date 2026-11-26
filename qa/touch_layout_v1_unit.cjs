/* Pure rules, no gameplay claim. node qa/touch_layout_v1_unit.cjs */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const storage=new Map(),root={style:{setProperty(){}},classList:{toggle(){},contains(){return false}}};
const context={document:{documentElement:root},innerWidth:390,innerHeight:844,console,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)}};context.window=context;
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../game/source/chapter-03/touch_layout_v1.js'),'utf8'),context);
const api=context.TouchLayoutV1,close=(a,b)=>Math.abs(a-b)<.00001;
for(const [o,w,h,s]of [['portrait',390,844],['portrait',390,700],['portrait',320,568],['landscape',844,390],['landscape',667,375],['landscape',812,375,{top:0,bottom:21,left:44,right:44}],['portrait',390,844,{top:47,bottom:34,left:0,right:0}],['portrait',390,844,{top:0,bottom:0,left:44,right:0}]]){
 const g=api.geometry(o,w,h,s),p=api.positions(o,w,h);
 // positions() reads runtime safe-area; use normalized geometry to test inset models.
 const n=api.defaults(o),actual={};for(const z of Object.values(g.zones)){assert(z.x>=(s?.left||0));assert(z.x+z.w<=w-(s?.right||0));assert(z.y>=(s?.top||0));assert(z.y+z.h<=h-(s?.bottom||0))}
 for(const[id,c]of Object.entries(g.controls)){const z=g.zones[c.zone];actual[id]={x:z.x+n[id].u*(z.w-c.w),y:z.y+n[id].v*(z.h-c.h)};assert(c.w>=44&&c.h>=44);assert(actual[id].x>=z.x-.001&&actual[id].x+c.w<=z.x+z.w+.001);assert(actual[id].y>=z.y-.001&&actual[id].y+c.h<=z.y+z.h+.001)}
 for(const[id,pos]of Object.entries(actual))assert(!api.collides(id,pos,actual,g),`${o} ${w}x${h}: ${id} overlaps`);
 const normalized=api.normalize(g,actual);for(const id of Object.keys(n)){assert(close(n[id].u,normalized[id].u));assert(close(n[id].v,normalized[id].v))}
 assert(Object.keys(p).length===9);
 console.log('OK · minimum targets, bounds, no overlaps, normalized round-trip · '+o+' '+w+'x'+h);
}
storage.set(api.key,JSON.stringify({opacity:99,portrait:{attack:{u:5,v:-8},skill:{u:'bad',v:0}},landscape:{switch:{u:.2,v:.4}}}));
const saved=api.read();assert.equal(saved.opacity,.85);assert.equal(saved.portrait.attack.u,1);assert.equal(saved.portrait.attack.v,0);assert.equal(saved.portrait.skill,undefined);assert.equal(saved.landscape.switch.u,.2);
const collision=api.geometry('portrait',390,844),poses=api.positions('portrait',390,844);poses.attack={...poses.dodge};assert(api.collides('attack',poses.attack,poses,collision));
storage.set(api.key,'broken json');assert.equal(api.read().opacity,.72);
storage.set('torii_hutukara_save','campaign stays here');api.read();assert.equal(storage.get('torii_hutukara_save'),'campaign stays here');
console.log('OK · corrupt data, clamps, collision detection, separate orientations and save isolation');

// Optional actual DOM/input pass: PLAYWRIGHT_CORE=/path/to/playwright-core node qa/touch_layout_v1_unit.cjs --browser
if(process.argv.includes('--browser'))(async()=>{
 const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright-core'),{pathToFileURL}=require('node:url');
 const version=JSON.parse(fs.readFileSync(path.join(__dirname,'../game/VERSION.json')));
 const artifact=path.join(__dirname,version.versao);fs.mkdirSync(artifact,{recursive:true});
 const report={timestamp:new Date().toISOString(),engine:'Chrome headless / Playwright + CDP touch',limits:['Automação em Chromium com viewport e toque emulados; não substitui teste em hardware Android/iOS.','Estado de campanha preparado numa sessão isolada; não é uma campanha completa jogada.'],checks:[],screenshots:[],errors:[]};
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--disable-gpu']});
 try{
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 await page.goto((process.env.TORII_BUILD_URL||pathToFileURL(path.join(__dirname,'../game/builds',version.versao,'TORII_HUTUKARA_'+version.sufixo+'.html')).href)+'?input=mobile',{timeout:120000});await page.waitForFunction(()=>window.TouchLayoutV1);
 const check=(name,actual)=>{assert(actual,name);report.checks.push({name,passed:true});console.log('OK · '+name)};
 check('Title hides gameplay touch controls',await page.evaluate(()=>getComputedStyle($('mobileDeck121')).visibility==='hidden'));
 await page.evaluate(async()=>{G=fresh();G.flags.masks=G.flags.bass=true;G.active='franco';G.formation=['franco','ryuchi'];G.potions=3;G.resonance=34;mode='walk';setArea('studio',10.5,12.5);$('start').classList.add('hidden');$('overlay').classList.add('hidden');$('dialogue').classList.add('hidden');$('hud').style.display='block';await window.FinalAssetLoadingV1?.ready();updateHUD();updateMobileLayout121();updateMobileReadout121()});await page.waitForTimeout(350);
 check('Hidden title does not cover gameplay',await page.evaluate(()=>getComputedStyle($('start')).display==='none'));
 check('Portrait deck retains its approved control area',await page.evaluate(()=>$('mobileDeck121').getBoundingClientRect().height>=200));
 check('Rectangular Fita and Ação controls retain visible frames',await page.evaluate(()=>['heal','interact'].every(id=>parseFloat(getComputedStyle(document.querySelector('[data-mobile-action='+id+']')).borderTopWidth)>0)));
 check('Mobile objective visible and populated',await page.evaluate(()=>getComputedStyle($('mobileGoal121')).display!=='none'&&$('mobileGoal121').textContent.length>0));
 check('Nine live controls preserve 44px minimum targets',await page.evaluate(()=>{const n=[...document.querySelectorAll('#mobileDeck121 [data-tl-control]')];return n.length===9&&n.every(n=>{const r=n.getBoundingClientRect();return r.width>=43.99&&r.height>=43.99})}));
 const shot=async name=>{await page.waitForFunction(()=>transitionAlpha<=0,null,{timeout:12000});await page.screenshot({path:path.join(artifact,name)});report.screenshots.push(name)};await shot('mobile_vertical.png');
 const centers=await page.evaluate(()=>{const center=n=>{const r=n.getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2}};return{stick:center($('mobileStick121')),attack:center(document.querySelector('[data-mobile-action=attack]'))}}),cdp=await context.newCDPSession(page),f={id:1,x:centers.stick.x+25,y:centers.stick.y},a={id:2,...centers.attack};
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[f]});await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[f,a]});check('Multitouch preserves movement and held attack',await page.evaluate(()=>Input121.pointers.size===2&&Input121.touch[0]>0&&attackHeld));await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});check('Pointer cancellation releases movement and held attack',await page.evaluate(()=>!Input121.pointers.size&&Input121.touch[0]===0&&!attackHeld));
 check('Original readiness hint nodes remain connected',await page.evaluate(()=>mobileCombatHUD121.controls.every(({button,hint})=>button.isConnected&&hint.isConnected&&button.contains(hint))));
 await page.locator('[data-mobile-action=pause]').click();check('Native pause click opens pause B without stuck input',await page.evaluate(()=>mode==='overlay'&&!!document.querySelector('.ui7-pause-sidebar')&&!Input121.pointers.size));
 await page.evaluate(()=>TouchLayoutV1.openSettings(()=>openSystem()));await page.locator('#tlPortraitV1').click();check('Editor uses nine inert clones and hides real controls',await page.evaluate(()=>document.querySelectorAll('#tlEditorStageV1 [data-tl-control]').length===9&&!document.querySelector('#tlEditorStageV1 [data-mobile-action]')&&getComputedStyle($('mobileDeck121')).visibility==='hidden'));
 const beforeCollision=await page.evaluate(()=>JSON.stringify(TouchLayoutV1.editor.positions.attack)),attackBox=await page.locator('#tlEditorStageV1 [data-tl-control=attack]').boundingBox(),dodgeBox=await page.locator('#tlEditorStageV1 [data-tl-control=dodge]').boundingBox();await page.mouse.move(attackBox.x+attackBox.width/2,attackBox.y+attackBox.height/2);await page.mouse.down();await page.mouse.move(dodgeBox.x+dodgeBox.width/2,dodgeBox.y+dodgeBox.height/2,{steps:4});await page.mouse.up();check('Editor rejects overlapping control positions',await page.evaluate(s=>JSON.stringify(TouchLayoutV1.editor.positions.attack)===s,beforeCollision));
 const original=await page.evaluate(()=>TouchLayoutV1.editor.positions.heal.x),node=page.locator('#tlEditorStageV1 [data-tl-control=heal]'),box=await node.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+18,box.y+box.height/2,{steps:4});await page.mouse.up();check('Editor drag moves controls within the zone',await page.evaluate(x=>TouchLayoutV1.editor.positions.heal.x>x,original));
 await node.focus();const keyX=await page.evaluate(()=>TouchLayoutV1.editor.positions.heal.x);await page.keyboard.press('ArrowRight');check('Keyboard editor navigation moves focused control',await page.evaluate(x=>TouchLayoutV1.editor.positions.heal.x>x,keyX));
 await shot('mobile_editor_vertical.png');await page.locator('#tlEditorSaveV1').click();const saved=await page.evaluate(()=>localStorage.getItem(TouchLayoutV1.key));check('Editor save normalizes position and keeps game paused',!!saved&&await page.evaluate(()=>mode==='overlay'));
 await page.locator('#tlPortraitV1').click();await page.locator('#tlEditorResetV1').click();await page.keyboard.press('Escape');check('Reset then Escape discards draft and keeps settings paused',await page.evaluate(s=>localStorage.getItem(TouchLayoutV1.key)===s&&mode==='overlay'&&!TouchLayoutV1.editor&&!!$('tlPortraitV1'),saved));
 await page.locator('#tlLandscapeV1').click();await page.locator('#tlEditorSaveV1').click();check('Portrait and landscape positions are stored independently',await page.evaluate(s=>JSON.stringify(TouchLayoutV1.read().portrait)===JSON.stringify(JSON.parse(s).portrait)&&Object.keys(TouchLayoutV1.read().landscape).length===9,saved));
 await page.setViewportSize({width:844,height:390});await page.evaluate(()=>{closeOverlay();TouchLayoutV1.layout()});await page.waitForTimeout(250);
 check('Landscape uses transparent pads and configured opacity',await page.evaluate(()=>document.querySelector('[data-mobile-action=attack] canvas').dataset.transparent==='true'&&getComputedStyle(document.querySelector('[data-mobile-action=attack]')).opacity==='0.72'));
 await shot('mobile_horizontal.png');await page.evaluate(()=>TouchLayoutV1.openEditor('landscape'));await shot('mobile_editor_horizontal.png');await page.keyboard.press('Escape');check('Escape never resumes simulation under editor',await page.evaluate(()=>mode==='overlay'&&!Input121.pointers.size));
 check('No browser page errors',!report.errors.length);
 }catch(e){report.failure=e.stack;throw e}finally{fs.writeFileSync(path.join(artifact,'TOUCH_BROWSER.json'),JSON.stringify(report,null,2)+'\n');await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
