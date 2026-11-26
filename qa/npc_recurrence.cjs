/* Run: node qa/npc_recurrence.cjs. Executes the actual NPC render selector. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'game/source/chapter-03/chapter3_runtime.js'),'utf8');
const start=source.indexOf('function c3NpcPose('),end=source.indexOf('\n',source.indexOf('drawDetailedNPC=function(n,x,y)',start));
assert(start>=0&&end>start);
let calls=[],fallback=[],available=true;
const sandbox={G:{x:0,y:0},tick:0,C3:{images:{prebeta_collabs_move:'directions',prebeta_collabs:'front',prebeta_dney:'dney'}},
 drawDetailedNPC:(...args)=>fallback.push(args),c3SheetSprite:(...args)=>{calls.push(args);return available||args[0]==='front'},
 drawActor:()=>{},c3MoveSprite:()=>false,ACTOR_W:56,ACTOR_H:70};
vm.createContext(sandbox);vm.runInContext(source.slice(start,end),sandbox);
let checked=0;
for(const [key,row] of [['bento',0],['nilo',1]])for(const [dir,dx,dy,col]of [['down',0,1,0],['left',-1,0,2],['up',0,-1,4],['right',1,0,6]]){
 const npc={id:key,spriteKey:key,x:18,y:8},original=JSON.stringify(npc);
 for(const time of [0,.5,2,100]){calls=[];sandbox.G={x:18+dx,y:8+dy};sandbox.tick=time;sandbox.drawDetailedNPC(npc,200,100);
 assert.deepEqual(calls[0],['directions',col,row,8,3,200,100,80,80]);assert.equal(calls.length,1);assert.equal(JSON.stringify(npc),original);checked++;}
}
// Far away, keep the authored direction. Missing directional art retains frontal fallback.
sandbox.G={x:100,y:100};calls=[];sandbox.drawDetailedNPC({spriteKey:'nilo',x:18,y:8,dir:'up'},200,100);assert.equal(calls[0][1],4);
available=false;calls=[];sandbox.drawDetailedNPC({spriteKey:'bento',x:18,y:8},200,100);assert.equal(calls[1][0],'front');
// Unrelated NPCs still reach their original renderer; C3 keeps its existing selector.
calls=[];fallback=[];const other={id:'iris',x:1,y:1};sandbox.drawDetailedNPC(other,200,100);assert.equal(fallback[0][0],other);
available=true;calls=[];sandbox.drawDetailedNPC({id:'c3_ciro',x:7,y:13},200,100);assert.equal(calls[0][2],2);
console.log('PASS: '+checked+' directional/time cases; authored direction, fallback, no mutation and C3 routing.');
