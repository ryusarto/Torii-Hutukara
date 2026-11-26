/* Serial regression launcher. Keeps original test assertions and stores every
 * stdout/stderr/exit. No argv3 screenshot/report target is passed to children. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawn,execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../../..'),url=process.argv[2];
if(!/^https?:\/\/127\.0\.0\.1(?::\d+)?\//.test(url||''))throw Error('Pass the local HTTP export URL. Portable HTML is forbidden.');
const ids=['bridge_playtest','radio9_playtest','lumi_melody_playtest','canal_violin_playtest','plant_sequencer_playtest','club_stage_playtest','final_echoes_playtest','recovery_mobile','interface_controls_v7_browser','interface_screens_v7_browser','interface_v7_dialogue_browser','enemy_health_v7_browser'];
const requested=process.argv[3]?process.argv[3].split(','):ids,unknown=requested.filter(id=>!ids.includes(id));if(unknown.length)throw Error('Unknown cases: '+unknown.join(','));
const out=__dirname,logs=path.join(out,'logs'),reportFile=path.join(out,'REPORT.json'),runId=new Date().toISOString().replace(/[^0-9TZ]/g,'');fs.mkdirSync(logs,{recursive:true});
const previous=fs.existsSync(reportFile)?JSON.parse(fs.readFileSync(reportFile)):null;
const report={method:'Original repository regression scripts executed serially against the local HTTP build; one Chromium per case. No optional screenshot argv3. Logs retain failures. Not a full human campaign or physical device playtest.',preparedAt:new Date().toISOString(),url,caseOrder:ids,attempts:previous?.attempts||[],runs:previous?.runs||[],status:'prepared'};
const run={id:runId,url,startedAt:new Date().toISOString(),timeoutMs:180000,selected:requested,buildInfo:null,results:[],status:'prepared'};
try{const info=JSON.parse(fs.readFileSync(path.join(root,'production/playtest-dist/build-info.json')));run.buildInfo={sourceSha256:info.sourceSha256,version:info.version}}catch(e){run.buildInfo={readError:e.message}}
for(const id of requested)if(!fs.existsSync(path.join(root,'qa',id+'.cjs')))throw Error('Missing script '+id);
function write(){fs.writeFileSync(reportFile,JSON.stringify(report,null,2)+'\n')}
report.fixtureAdjustments=fs.readdirSync(logs).filter(f=>f.endsWith('_fixture_adjustment.json')).map(f=>JSON.parse(fs.readFileSync(path.join(logs,f))));
report.runs.push(run);write();
if(process.env.QA_PREPARE_ONLY==='1'){console.log(JSON.stringify({prepared:requested.length,url,noBrowserStarted:true}));process.exit(0)}
function descendants(pid){try{const rows=execFileSync('ps',['-axo','pid=,ppid='],{encoding:'utf8'}).trim().split('\n').map(line=>line.trim().split(/\s+/).map(Number)),set=new Set([pid]);let changed=true;while(changed){changed=false;for(const [p,parent]of rows)if(set.has(parent)&&!set.has(p)){set.add(p);changed=true}}return[...set]}catch{return[pid]}}
function killOwned(pids,signal){for(const pid of pids.slice().reverse())try{process.kill(pid,signal)}catch{}}
async function one(id){
 const started=Date.now(),base=runId+'-'+id,stdoutFile=path.join(logs,base+'.stdout.log'),stderrFile=path.join(logs,base+'.stderr.log'),stdout=fs.createWriteStream(stdoutFile),stderr=fs.createWriteStream(stderrFile),okLines=[];
 const row={id,script:'qa/'+id+'.cjs',scriptSha256:require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(root,'qa',id+'.cjs'))).digest('hex'),url,startedAt:new Date(started).toISOString(),status:'running',stdout:path.relative(root,stdoutFile),stderr:path.relative(root,stderrFile),exitCode:null,signal:null,timedOut:false,okLines};run.results.push(row);write();console.log('START '+id);
 let pending='',stderrPrefix='',timer,hardTimer,timeoutPids=[];
 const child=spawn(process.execPath,[path.join(root,'qa',id+'.cjs'),url],{cwd:root,env:process.env,stdio:['ignore','pipe','pipe']});
 child.stdout.on('data',chunk=>{stdout.write(chunk);pending+=chunk.toString();let at;while((at=pending.indexOf('\n'))>=0){const line=pending.slice(0,at);pending=pending.slice(at+1);if(line.startsWith('OK'))okLines.push(line)}});
 child.stderr.on('data',chunk=>{stderr.write(chunk);if(stderrPrefix.length<4000)stderrPrefix+=chunk.toString().slice(0,4000-stderrPrefix.length)});
 const result=await new Promise(resolve=>{let done=false;const finish=data=>{if(!done){done=true;resolve(data)}};child.once('error',e=>finish({error:e.message}));child.once('close',(code,signal)=>finish({code,signal}));timer=setTimeout(()=>{row.timedOut=true;timeoutPids=descendants(child.pid);killOwned(timeoutPids,'SIGTERM');hardTimer=setTimeout(()=>killOwned(timeoutPids,'SIGKILL'),5000)},run.timeoutMs)});
 clearTimeout(timer);if(hardTimer){clearTimeout(hardTimer);killOwned(timeoutPids,'SIGKILL')}
 if(pending.startsWith('OK'))okLines.push(pending);await Promise.all([new Promise(r=>stdout.end(r)),new Promise(r=>stderr.end(r))]);
 Object.assign(row,{endedAt:new Date().toISOString(),durationMs:Date.now()-started,exitCode:result.code??null,signal:result.signal??null,status:row.timedOut?'timeout':result.code===0?'passed':'failed',failureKind:row.timedOut?'runner-timeout':result.error?'spawn-error':result.code===0?null:/AssertionError/.test(stderrPrefix)?'assertion-failure':/TimeoutError|Timeout \d+ms/.test(stderrPrefix)?'test-timeout':'test-error',error:result.error||null,stderrPrefix:stderrPrefix||null});report.attempts.push({...row,runId,url});write();console.log(row.status.toUpperCase()+' '+id+' · '+(row.durationMs/1000).toFixed(1)+'s · exit='+row.exitCode+' · OK-lines='+okLines.length);return row;
}
(async()=>{run.status=report.status='running';write();for(const id of requested)await one(id);run.endedAt=new Date().toISOString();run.status=run.results.every(r=>r.status==='passed')?'passed':'failed';const latest=new Map(report.attempts.map(r=>[r.id,r]));report.latestSummary={passed:ids.filter(id=>latest.get(id)?.status==='passed'),failed:ids.filter(id=>latest.has(id)&&latest.get(id).status!=='passed'),notRun:ids.filter(id=>!latest.has(id)),passedOnCurrentURL:ids.filter(id=>latest.get(id)?.url===url&&latest.get(id)?.status==='passed'),notPassedOnCurrentURL:ids.filter(id=>latest.get(id)?.url!==url||latest.get(id)?.status!=='passed')};report.status=run.status;write();console.log(JSON.stringify({url,runId,status:run.status,summary:report.latestSummary}));if(run.status!=='passed')process.exitCode=1})().catch(e=>{run.status=report.status='runner-error';run.error=e.stack;write();console.error(e);process.exitCode=1});
