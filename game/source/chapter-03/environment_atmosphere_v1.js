/* World-only atmosphere. The renderer calls this before combat and guidance.
 * No flags, map cells, actor poses, collisions or saved data are written here. */
'use strict';
const EnvironmentAtmosphereV1={
  enabled:true,clock:0,game:null,area:null,
  desertAreas:new Set(['sky_terminal','distortion_district','sky_canal','sky_lift','cloud_terrace']),
  reduced(){return !!G?.options10?.reducedMotion},
  active(){return !!G&&!!current&&(mode==='walk'||mode==='action')&&!menuOpen},
  step(dt){
    if(this.game!==G||this.area!==G?.area){this.game=G;this.area=G?.area;this.clock=0}
    if(this.enabled&&this.active()&&Number.isFinite(dt)&&dt>0)this.clock+=Math.min(dt,.1);
  },
  // Compatibility only: artificial lighting was removed by author direction.
  profile(){return {ambient:1,tint:'#000000',lights:[]}},
  treePose(p){
    const phase=(p.x||0)*.41+(p.y||0)*.73;
    const bend=this.enabled&&!this.reduced()?(Math.sin(this.clock*1.45+phase)*.010+Math.sin(this.clock*.61+phase*1.7)*.004):0;
    return {baseX:p.x,baseY:p.y,bend,canopyOffset:-bend*(p.large?170:74)};
  },
  ellipse(q,x,y,rx,ry){
    q.beginPath();for(let i=0;i<20;i++){const a=i*Math.PI/10,px=Math.round(x+Math.cos(a)*rx),py=Math.round(y+Math.sin(a)*ry);if(i)q.lineTo(px,py);else q.moveTo(px,py)}q.closePath();
  },
  shadowBodies(){
    const mobile=typeof Input121!=='undefined'&&Input121.mobile,limit=mobile?48:80;
    const result=typeof EnvironmentDepthV1!=='undefined'&&EnvironmentDepthV1.shadowBodies?EnvironmentDepthV1.shadowBodies(Math.max(0,limit-16)):[];
    const actors=[];
    const add=(p)=>{if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&!actors.includes(p))actors.push(p)};
    add(G);
    if(typeof C3!=='undefined'&&C3.coopActive?.())add(C3.coop);
    // Party members must receive the same physical ground contact as P1/P2.
    if(typeof partyMembers==='function'&&typeof getFollower==='function'){
      const others=partyMembers().filter(id=>id!==G.active);
      for(let i=0;i<others.length;i++){
        // Disconnecting a falling P2 restores a different follower object for
        // that hero. Captured identity, not only object identity, owns the fall.
        if(typeof CloudWorldV1!=='undefined'&&others[i]===CloudWorldV1.fall?.hero)continue;
        if(!(typeof C3!=='undefined'&&C3.coopActive?.()&&others[i]===C3.coopMember()))add(getFollower(i));
      }
    }
    for(const n of current?.npcs||[]){if(actors.length>=16)break;add(n)}
    for(const p of actors){
      if(result.length>=limit)break;
      if(typeof CloudWorldV1!=='undefined'&&CloudWorldV1.fall?.body===p)continue;
      if(typeof tileWalkable==='function'&&!tileWalkable(current,p.x,p.y))continue;
      const x=p.x*T,y=p.y*T;
      if(x<cam.x-50||x>cam.x+VW+50||y<cam.y-50||y>cam.y+VH+50)continue;
      result.push({x,y,w:12,d:6,h:42,kind:'actor'});
    }
    return result;
  },
  drawContacts(){
    ctx.save();try{
      ctx.globalCompositeOperation='source-over';ctx.fillStyle='#141921';
      for(const b of this.shadowBodies()){
        // Buildings keep their tight foundation band in EnvironmentDepthV1.
        if(b.kind==='architecture')continue;
        const actor=b.kind==='actor',w=actor?6.5:Math.min(b.w*.43,80),d=actor?2:Math.max(1.2,Math.min(b.d*.16,4.2));
        ctx.globalAlpha=actor?.16:.12;this.ellipse(ctx,b.x-cam.x,b.y-cam.y+1,w,d);ctx.fill();
      }
    }finally{ctx.restore()}
  },
  drawGround(){
    if(!this.enabled||!G||!current)return;
    if(this.desertAreas.has(G.area)){
      ctx.save();try{
        const w=current.w*T,h=current.h*T,phase=this.reduced()?0:this.clock,count=this.reduced()?18:72;
        for(let i=0;i<count;i++){
          const wx=((i*137.29+phase*(12+(i%4)*3))%w+w)%w,wy=((i*83.11+Math.sin(phase*.6+i)*3)%h+h)%h;
          const x=Math.round(wx-cam.x),y=Math.round(wy-cam.y);if(x<-5||y<-5||x>VW+5||y>VH+5)continue;
          ctx.fillStyle=i%3?'#e7c58a58':'#8f623f48';ctx.fillRect(x,y,i%5===0?3:2,1);
          if(i%7===0){ctx.fillStyle='#f5dfb629';ctx.fillRect(x-3,y+1,5,1)}
        }
      }finally{ctx.restore()}
    }
    this.drawContacts();
  },
  // Keep the compiler's pre-HUD hook without drawing a filter, light or fixture.
  drawLighting(){}
};
window.EnvironmentAtmosphereV1=EnvironmentAtmosphereV1;
const atmosphereUpdateV1=update;
update=function(dt){const result=atmosphereUpdateV1(dt);EnvironmentAtmosphereV1.step(dt);return result};
// Preserve the trunk and root contact. Only the canopy bends with the breeze.
const atmosphereTreeV1=drawTree;
drawTree=function(x,y,large=false,v=.4){
  const a=EnvironmentAtmosphereV1;
  if(!a.enabled||a.reduced())return atmosphereTreeV1(x,y,large,v);
  const pose=a.treePose({x:(x+cam.x)/T,y:(y+cam.y)/T,large}),w=large?196:90,h=large?240:116,cut=y-(large?55:24);
  ctx.save();ctx.beginPath();ctx.rect(x-w/2-5,y-h,w+10,cut-(y-h));ctx.clip();ctx.transform(1,0,pose.bend,1,-pose.bend*y,0);
  atmosphereTreeV1(x,y,large,v);ctx.restore();
  ctx.save();ctx.beginPath();ctx.rect(x-w/2-5,cut,w+10,h+16);ctx.clip();atmosphereTreeV1(x,y,large,v);ctx.restore();
};
