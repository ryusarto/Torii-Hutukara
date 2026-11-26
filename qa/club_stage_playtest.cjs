/* Physical staircase and native input through the Contratempo map. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright');
const url=process.argv[2]||'http://127.0.0.1:8886/';
const out=process.argv[3];
const results=[],errors=[],phrase=[1.626,3.315,2.748,4.445,5.299],order=['bass','drums','guitar','bass','guitar'];
const score=[0,1,2,0,2];

async function testStage(browser,mobile){
  const context=await browser.newContext(mobile?{viewport:{width:390,height:844},isMobile:true,hasTouch:true,
    userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'}:{viewport:{width:1100,height:760}});
  try{
    const page=await context.newPage();
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(url,{waitUntil:'domcontentloaded'});
    await page.locator('#startNew').click();
    await page.locator('#dif_historia').click();
    const start=await page.evaluate(()=>{
      C3.start(true);
      while(mode==='dialogue')advanceDialogue();
      const desk=ClubStage.desk;
      setArea('contratempo',desk.x+.4,desk.y+1.0,false);closeOverlay();mode='walk';transitionAlpha=0;
      C3.openPhrase('club');
      const gated=!ClubStage.progress().preview&&!G.c3.clubPhraseDone;
      Object.assign(G.c3,{metMaia:true,twoRoutesOpen:true,usinaGate:true,usinaDone:true,canalPath:true,canalDone:true,
        synthUnlocked:true,percussionUnlocked:true,windFlute:true});
      setCheckpoint('c3_club_stage','contratempo',desk.x+.4,desk.y+1.0,true);
      const consoles=current.props.filter(prop=>prop.item==='projection_console'||prop.type==='clubConsole');
      const actualDesk=consoles.length===1&&consoles[0].clubSoundDesk&&consoles[0].x===desk.x&&consoles[0].y===desk.y;
      const furniture=current.props.filter(prop=>prop.type==='clubFurniture');
      const chairs=furniture.filter(prop=>prop.asset==='chair_north');
      const rack=furniture.find(prop=>prop.asset==='rack');
      const bar=furniture.find(prop=>prop.asset==='bar_west');
      const layout=chairs.length===4&&chairs.every(prop=>prop.y>=14&&!canBody121(prop.x,prop.y))&&chairs[1].x-chairs[0].x>2&&chairs[3].x-chairs[2].x>2&&
        rack?.x<5&&rack.w>=76&&rack.h>=74&&bar?.x<25&&bar.x>24&&bar.h>bar.w*2&&!canBody121(25.15,13.5)&&canBody121(23.5,13.5)&&canBody121(13.5,15);
      return {gated,actualDesk,layout,deskOnFloor:desk.x-desk.w/(2*T)>20&&!canBody121(desk.x,desk.y),rails:!canBody121(10.5,9.5)&&!canBody121(17.5,9.5),stairs:canBody121(13.5,9.5)&&canBody121(14.5,9.5),
        floor:ClubStage.stations.every(station=>canBody121(station.x,8.05)),sprites:current.props.filter(p=>p.type==='clubInstrument').length};
    });
    assert.deepEqual(start,{gated:true,actualDesk:true,layout:true,deskOnFloor:true,rails:true,stairs:true,floor:true,sprites:3});
    await page.evaluate(()=>$('playtestEntry')?.remove());
    assert.equal(await page.evaluate(()=>nearestInteraction()?.value.id),'c3_phrase_stage');
    if(mobile&&out){
      const progress=await page.evaluate(()=>copy(G));
      fs.writeFileSync(path.join(path.dirname(out),'SAVE_CONTRATEMPO.json'),JSON.stringify({progress},null,2)+'\n');
    }

    const click=selector=>mobile?page.locator(selector).tap():page.locator(selector).click();
    const interact=()=>mobile?click('[data-mobile-action="interact"]'):page.keyboard.press('e');
    if(mobile){
      await page.evaluate(()=>{
        G.c3.clubPhraseDone=true;G.c3.clubPhrase=[0,1,2,0];save(true);
        openSystem();openSettings10();
      });
      await click('#audio10');
      await page.evaluate(()=>closeOverlay());
      assert(await page.evaluate(()=>audioMuted&&!audioEnabled));
    }
    await page.evaluate(()=>{
      window.__stageSamples=[];
      const proto=AudioBufferSourceNode.prototype,start=proto.start;
      proto.start=function(when,offset,duration){
        if(this.buffer===Music11.buffer.get('c3_chico_buarque')&&duration)
          __stageSamples.push(offset);
        return start.apply(this,arguments);
      };
    });

    const touch=mobile?await context.newCDPSession(page):null;
    const keys={east:'d',west:'a',north:'w',south:'s'};
    const delta={east:[1,0],west:[-1,0],north:[0,-1],south:[0,1]};
    async function drive(direction,axis,goal){
      const key=keys[direction],vector=delta[direction];
      if(mobile){
        const box=await page.locator('#mobileStick121').boundingBox();
        await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{
          id:1,x:box.x+box.width*(.5+vector[0]*.255),y:box.y+box.height*(.5+vector[1]*.255)
        }]});
      }else await page.keyboard.down(key);
      try{
        await page.waitForFunction(({axis,goal,sign})=>sign*(G[axis]-goal)>=0,
          {axis,goal,sign:vector[axis==='x'?0:1]},{timeout:4500});
      }finally{
        if(mobile)await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
        else await page.keyboard.up(key);
      }
    }
    async function move(axis,goal){
      const value=await page.evaluate(axis=>G[axis],axis);
      if(Math.abs(value-goal)<.15)return;
      await drive(axis==='x'?(goal>value?'east':'west'):(goal>value?'south':'north'),axis,goal);
    }
    async function shot(file){
      if(out)await page.screenshot({path:path.join(path.dirname(out),file)});
    }
    async function play(instrument){
      const station=await page.evaluate(instrument=>ClubStage.stations.find(item=>item.id===instrument),instrument);
      await move('x',station.x);
      assert.equal(await page.evaluate(()=>nearestInteraction()?.value.id),station.event);
      await interact();
    }

    await page.waitForFunction(()=>{
      const desk=ClubStage.desk;
      return 8*T-cam.x>=0&&desk.x*T-cam.x+desk.w/2<=VW+1;
    });
    await page.locator('#toast').waitFor({state:'hidden'});
    await shot(mobile?'contratempo-mobile.png':'contratempo-desktop.png');
    await interact();
    assert(await page.evaluate(()=>mode==='walk'&&ClubStage.progress().preview));
    await page.waitForFunction(()=>$('clubStageMessage').textContent.includes('Referência'));
    await page.waitForFunction(()=>ClubStage.progress().heard&&!ClubStage.progress().preview);
    const audio=await page.evaluate(()=>({samples:__stageSamples.slice(),state:AC?.state,hidden:Music11.hidden}));
    assert.deepEqual(audio.samples,mobile?[]:phrase,JSON.stringify(audio));
    await move('y',10.75);
    await move('x',13.78);
    await move('y',8);
    assert(await page.evaluate(()=>G.y<9&&G.area==='contratempo'&&mode==='walk'));
    await play('bass');
    assert.equal(await page.evaluate(()=>ClubStage.progress().count),1);
    await play('guitar');
    assert(await page.evaluate(mobile=>ClubStage.progress().error&&ClubStage.progress().count===0&&G.c3.clubPhraseDone===mobile,mobile));
    for(const instrument of order.slice(0,-1))await play(instrument);
    assert(await page.evaluate(mobile=>ClubStage.progress().count===4&&!ClubStage.progress().ready&&G.c3.clubPhrase.length===(mobile?4:0),mobile));
    await play(order.at(-1));
    await page.waitForFunction(mobile=>mode===(mobile?'walk':'dialogue')&&G.c3.clubPhraseDone&&G.c3.clubPhrase.length===5,mobile);
    const completed=await page.evaluate(()=>({
      phrase:G.c3.clubPhrase,album:albumTrack11(),saved:JSON.parse(localStorage.getItem(KEY)).c3.clubPhrase,
      liftGate:areas.distortion_district.gates.find(gate=>gate.to==='sky_lift').need(),notes:__stageSamples.slice(-5)
    }));
    assert.deepEqual(completed,{phrase:score,album:'c3_chico_buarque',saved:score,
      liftGate:true,notes:mobile?[]:phrase});
    await page.evaluate(()=>{while(mode==='dialogue')advanceDialogue()});
    await shot(mobile?'contratempo-show-mobile.png':'contratempo-show-desktop.png');
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('#startContinue').click();
    assert(await page.evaluate(()=>G.c3.clubPhraseDone&&G.c3.clubPhrase.join('')==='01202'));
    if(mobile&&out){
      await page.reload({waitUntil:'domcontentloaded'});
      await click('#startOptions10');
      await page.locator('#importFile').setInputFiles(path.join(path.dirname(out),'SAVE_CONTRATEMPO.json'));
      await page.waitForFunction(()=>mode==='walk'&&G.area==='contratempo'&&!G.c3.clubPhraseDone);
      assert.equal(await page.evaluate(()=>nearestInteraction()?.value.id),'c3_phrase_stage');
    }
    results.push({mode:mobile?'analógico e Ação emulados, no mudo':'teclado com gravação original',
      ...start,nativeStaircase:true,wrongInstrumentReset:true,requiresFive:true,legacyReplay:mobile,completed,resumed:true});
    console.log('OK · '+results.at(-1).mode);
  }finally{await context.close()}
}

(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});
  try{
    await testStage(browser,false);
    await testStage(browser,true);
    assert.deepEqual(errors,[]);
  }finally{
    await browser.close();
    if(out)fs.writeFileSync(out,JSON.stringify({results,errors},null,2)+'\n');
  }
})().catch(error=>{console.error(error);process.exitCode=1});
