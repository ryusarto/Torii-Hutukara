/* Browser regression for old saves, touch displacement and sound preferences. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_CORE||'playwright');
const url=process.argv[2]||'http://127.0.0.1:8886/';
const defaultSave=JSON.parse(fs.readFileSync(path.join(__dirname,'beta-1.10.1/CAMPAIGN_usina_RELOAD.json'))).save;
const cases=[['sky_canal',23.579130188030252,14.892525070121348],['cloud_terrace',16.07459429595726,1.1684163178242453]];
const saves=cases.map(([area,x,y],index)=>{
  if(process.argv[index+3])return JSON.parse(fs.readFileSync(process.argv[index+3])).save;
  return {...defaultSave,area,x,y,active:'ryuchi',difficulty:'normal',c3:{...defaultSave.c3,canalPath:true}};
});
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROME_PATH});
  const errors=[];
  try{
    const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,
      userAgent:'Mozilla/5.0 (Linux; Android 15; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Mobile Safari/537.36'});
    const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
    const tap=id=>page.locator(id).tap();
    const enter=async()=>{
      await tap('#startContinue');
      await page.locator('#playtestEntry').waitFor({state:'detached'});
    };
    await page.goto(url,{waitUntil:'domcontentloaded'});
    for(const data of saves){
      const expected=await page.evaluate(raw=>{
        const valid=normalizeSave(raw);
        localStorage.setItem(KEY,JSON.stringify(raw));
        return {area:valid.area,hp:valid.hp,flags:valid.flags,c3:valid.c3,potions:valid.potions};
      },data);
      await page.reload({waitUntil:'domcontentloaded'});await enter();
      const result=await page.evaluate(()=>{
        const stored=JSON.parse(localStorage.getItem(KEY));
        return {positionValid:canBody121(G.x,G.y),x:G.x,y:G.y,savedPosition:[stored.x,stored.y],
          progress:{area:G.area,hp:G.hp,flags:G.flags,c3:G.c3,potions:G.potions}};
      });
      assert(result.positionValid);
      assert(Math.hypot(result.x-data.x,result.y-data.y)<1);
      assert.notDeepEqual([result.x,result.y],[data.x,data.y]);
      assert.deepEqual(result.savedPosition,[result.x,result.y]);
      assert.deepEqual(result.progress,expected);
      console.log('OK · save antigo recuperado em '+data.area);
    }

    await page.locator('#importFile').setInputFiles({name:'canal-antigo.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({progress:saves[0]}))});
    await page.waitForFunction(()=>G.area==='sky_canal'&&canBody121(G.x,G.y));
    assert(await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem(KEY));return s.x===G.x&&s.y===G.y}));
    console.log('OK · importação JSON recupera e grava a posição');

    await page.evaluate(()=>{
      closeOverlay();G.active='ryuchi';G.levels.ryuchi=Math.max(3,G.levels.ryuchi);
      G.flags.bass=true;G.c3.canalPath=true;setArea('sky_canal',23.579130188030252,14.612525070121348,false);
      G.dir='down';G.aim091=[0,1];act.skillX=0;
    });
    await tap('[data-mobile-action=advanced]');
    assert(await page.evaluate(()=>act.skillX>0&&canBody121(G.x,G.y)&&G.y<14.72));
    console.log('OK · Passo Sônico no toque respeita a borda da passarela');

    await page.evaluate(()=>setArea('studio',12.5,10.5,false));
    const openAudio=async()=>{await tap('[data-mobile-action=pause]');await tap('#system10');};
    await openAudio();
    assert.match(await page.locator('#audio10').innerText(),/Som ligado/);
    await tap('#audio10');
    assert.match(await page.locator('#audio10').innerText(),/Som desligado/);
    assert(await page.evaluate(()=>audioMuted&&!audioEnabled));
    await tap('#save10');await page.reload({waitUntil:'domcontentloaded'});await enter();
    assert(await page.evaluate(()=>audioMuted&&!audioEnabled));
    await openAudio();
    assert.match(await page.locator('#audio10').innerText(),/Som desligado/);
    await tap('#audio10');await tap('#save10');await page.reload({waitUntil:'domcontentloaded'});await enter();
    assert(await page.evaluate(()=>!audioMuted&&audioEnabled));
    assert.deepEqual(errors,[]);
    console.log('OK · mudo e som ligado persistem no mobile após continuar');
  }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
