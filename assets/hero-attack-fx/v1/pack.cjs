'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require(process.env.PLAYWRIGHT_CORE || 'playwright');
(async()=>{
  const browser = await chromium.launch({executablePath:process.env.CHROME_PATH});
  try {
    const page = await browser.newPage();
    await page.addScriptTag({path:path.join(__dirname,'draw_atlas.js')});
    const result = await page.evaluate(()=>{
      const canvas=document.createElement('canvas');
      drawHeroAttackAtlas(canvas);
      const ctx=canvas.getContext('2d');
      for(let row=0;row<42;row++){
        const unique=new Set();
        for(let col=0;col<10;col++){
          const cell=ctx.getImageData((Math.floor(row/24)*10+col)*96,(row%24)*96,96,96).data;
          let nonempty=0,hash=2166136261;
          for(let pixel=0;pixel<96*96;pixel++){
            const a=cell[pixel*4+3]; if(!a)continue;
            const x=pixel%96,y=Math.floor(pixel/96);
            if(x===0||x===95||y===0||y===95)throw Error('Edge bleed '+row+'/'+col);
            nonempty++;hash=Math.imul(hash^(pixel+a),16777619);
          }
          if(nonempty<12)throw Error('Empty frame '+row+'/'+col);
          unique.add(hash);
        }
        if(unique.size!==10)throw Error('Duplicate frames '+row);
      }
      return canvas.toDataURL('image/png').split(',')[1];
    });
    fs.writeFileSync(path.join(__dirname,'hero_attacks.png'),Buffer.from(result,'base64'));
    console.log('420 attack frames with transparent gutters, 42 sequences.');
  }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
