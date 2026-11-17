/* Reproducible isolated Chromium checks. Requires playwright and generated hosted build. */
const {chromium}=require('playwright');
const {spawn}=require('node:child_process');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'production/playtest-dist');
(async()=>{
 const server=http.createServer((req,res)=>{
   const file=path.resolve(dir,'.'+decodeURIComponent(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));
   if(!file.startsWith(dir+path.sep)){res.writeHead(403);res.end();return;}
   fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end();return;}const ext=path.extname(file);res.setHeader('Content-Type',({'.html':'text/html','.png':'image/png','.js':'text/javascript','.css':'text/css','.json':'application/json'})[ext]||'application/octet-stream');res.end(data);});
 });
 await new Promise(resolve=>server.listen(8767,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,args:['--remote-debugging-port=9237']});
 try{
  for(const test of ['protagonist_art_v5','ninja_archer_art','input_regression']){
   await new Promise((resolve,reject)=>{const child=spawn(process.execPath,[path.join(__dirname,test+'.cjs'),'http://127.0.0.1:8767/'],{stdio:'inherit',timeout:180000,env:{...process.env,CDP_URL:'http://127.0.0.1:9237',TORII_BUILD_URL:'http://127.0.0.1:8767/'}});child.on('exit',code=>code===0?resolve():reject(Error(test+' failed: '+code)));});
  }
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
