/* World-only atmosphere. The renderer calls this before combat and guidance.
 * No flags, map cells, actor poses, collisions or saved data are written here. */
'use strict';
const EnvironmentAtmosphereV1={
  enabled:true,clock:0,game:null,area:null,mask:null,maskContext:null,
  desertAreas:new Set(['sky_terminal','distortion_district','sky_canal','sky_lift','cloud_terrace']),
  reduced(){return !!G?.options10?.reducedMotion},
  active(){return !!G&&!!current&&(mode==='walk'||mode==='action')&&!menuOpen},
  step(dt){
    if(this.game!==G||this.area!==G?.area){this.game=G;this.area=G?.area;this.clock=0}
    if(this.enabled&&this.active()&&Number.isFinite(dt)&&dt>0)this.clock+=Math.min(dt,.1);
  },
  profile(area=G?.area){
    const supplied=typeof EnvironmentDepthV1!=='undefined'?EnvironmentDepthV1.lightingProfile(area):null;
    const base=supplied||{ambient:1,tint:'#18202b',lights:[]};
    return {ambient:Math.max(.5,Math.min(1,base.ambient??1)),tint:base.tint||'#18202b',lights:base.lights||[]};
  },
  treePose(p){
    const phase=(p.x||0)*.41+(p.y||0)*.73;
    const bend=this.enabled&&!this.reduced()?(Math.sin(this.clock*1.45+phase)*.010+Math.sin(this.clock*.61+phase*1.7)*.004):0;
    return {baseX:p.x,baseY:p.y,bend,canopyOffset:-bend*(p.large?170:74)};
  },
  drawGround(){
    if(!this.enabled||!G||!current||!this.desertAreas.has(G.area))return;
    ctx.save();
    // The warm aerial perspective is under props/actors: clothes retain their palette.
    const haze=ctx.createLinearGradient(0,0,0,VH);
    haze.addColorStop(0,'#d4a85d18');haze.addColorStop(.65,'#b9956410');haze.addColorStop(1,'#b77b4007');
    ctx.fillStyle=haze;ctx.fillRect(0,0,VW,VH);
    const w=current.w*T,h=current.h*T,phase=this.reduced()?0:this.clock;
    const count=this.reduced()?18:72;
    for(let i=0;i<count;i++){
      const wx=((i*137.29+phase*(12+(i%4)*3))%w+w)%w;
      const wy=((i*83.11+Math.sin(phase*.6+i)*3)%h+h)%h;
      const x=Math.round(wx-cam.x),y=Math.round(wy-cam.y);
      if(x<-5||y<-5||x>VW+5||y>VH+5)continue;
      ctx.fillStyle=i%3?'#e7c58a58':'#8f623f48';ctx.fillRect(x,y,i%5===0?3:2,1);
      if(i%7===0){ctx.fillStyle='#f5dfb629';ctx.fillRect(x-3,y+1,5,1)}
    }
    ctx.restore();
  },
  lightSources(profile){
    const result=profile.lights.slice(0,12).map(l=>({...l}));
    for(const p of current?.props||[]){
      const type=p.env2GroundType||p.type;
      if(['lamp','rainLamp','c3_lamp','c3_neon_lamp','c3_neon_utility'].includes(type)){
        result.push({x:p.x+.5,y:p.y-.9,radius:3.4,color:type.startsWith('c3_')?'#efc17b':'#ffce91',intensity:.62});
      }
      if(result.length>=24)break;
    }
    if(G?.area==='distortion_district'&&G.c3?.smallLight)result.push({x:42,y:16,radius:3,color:'#b8e9db',intensity:.6});
    return result.slice(0,24);
  },
  drawLighting(){
    if(!this.enabled||!G||!current)return;
    const profile=this.profile(),darkness=1-profile.ambient,lights=this.lightSources(profile);
    if(darkness>.005){
      if(!this.mask){this.mask=document.createElement('canvas');this.maskContext=this.mask.getContext('2d')}
      if(this.mask.width!==VW||this.mask.height!==VH){this.mask.width=VW;this.mask.height=VH}
      const q=this.maskContext;q.clearRect(0,0,VW,VH);q.globalCompositeOperation='source-over';q.globalAlpha=darkness;q.fillStyle=profile.tint;q.fillRect(0,0,VW,VH);q.globalAlpha=1;
      q.globalCompositeOperation='destination-out';
      // Lamps open real pools in the darkness, instead of adding opaque circles.
      for(const l of lights){
        const x=l.x*T-cam.x,y=l.y*T-cam.y,r=Math.max(12,l.radius*T);
        if(x+r<0||y+r<0||x-r>VW||y-r>VH)continue;
        const grad=q.createRadialGradient(x,y,r*.06,x,y,r);
        grad.addColorStop(0,'rgba(0,0,0,'+Math.min(.93,l.intensity??.7)+')');grad.addColorStop(1,'rgba(0,0,0,0)');
        q.fillStyle=grad;q.fillRect(x-r,y-r,r*2,r*2);
      }
      q.globalCompositeOperation='source-over';ctx.save();ctx.drawImage(this.mask,0,0);ctx.restore();
    }
    // Very restrained warmth at the source; no pulse/strobe, even in the club.
    ctx.save();ctx.globalCompositeOperation='screen';
    for(const l of lights){
      const x=l.x*T-cam.x,y=l.y*T-cam.y,r=Math.max(10,l.radius*T*.7);
      if(x+r<0||y+r<0||x-r>VW||y-r>VH)continue;
      const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,l.color||'#f7c990');g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.globalAlpha=.055*(l.intensity??.7);ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);
    }
    ctx.restore();
  }
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
