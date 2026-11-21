// Body poses only. All particles, hitboxes, cooldowns and combat ticks belong
// to their original controllers. Existing action frames bracket the new contact.
const HeroAttackBody={
  sources:__HERO_BODY_ATLASES__,
  placement:__HERO_BODY_PLACEMENT__,
  states:['attack_1','attack_2','attack_3','skill','advanced','signature'],
  directions:['down','left','up','right'],
  images:new Map(),
  playback:new WeakMap(),
  followerCast:null,
  variant(hero,pose){
    if(hero==='alt'||hero==='katana')return 'unmasked';
    return pose.variant || (G?.flags?.masks?'masked':'unmasked');
  },
  sheet(hero,variant){
    const key=hero+'_'+variant;
    if(!this.sources[key])return null;
    const known=this.images.get(key);
    if(known){
      // Refresh LRU order only when another character has been drawn since.
      if(this.lastKey!==key){this.images.delete(key);this.images.set(key,known)}
      this.lastKey=key;
      return known;
    }
    const image=new Image();
    image.src=this.sources[key];
    this.images.set(key,image);
    if(this.images.size>4)this.images.delete(this.images.keys().next().value);
    this.lastKey=key;
    return image;
  },
  source(image,frame,row){return [image,frame*256,row*256,256,256]},
  frame(art,pose,seat,image,x,y){
    const destination=[Math.round(x-44),Math.round(y+11-77),88,88];
    const native=()=>({source:this.source(image,pose.frame,pose.row),destination,contact:false});
    if(!G)return native();
    const variant=this.variant(pose.hero,pose);
    // Start a single small sheet when a playable hero is first drawn. A missing
    // or still-loading body contact never holds input or hides a character.
    const sheet=this.sheet(pose.hero,variant);
    let record=seat>=0?art.players[seat]:null;
    if(seat<0 && this.followerCast?.hero===pose.hero && this.followerCast.game===G &&
        this.followerCast.area===G.area && HeroAttackFX.clock-this.followerCast.started<.24){
      const ally=getFollower(0);
      if(ally && Math.abs(x-(ally.x*T-cam.x))<2 && Math.abs(y-(ally.y*T-cam.y))<2){
        record=this.followerCast;
        record.elapsed=Math.max(0,HeroAttackFX.clock-record.started);
        const key=art===MusicianArtV1?art.key(pose.hero,variant,record.state):pose.hero+'_'+record.state;
        const attack=art.image(key);
        if(attack?.complete && attack.naturalWidth){
          image=attack;
          pose={...pose,state:record.state,direction:record.direction,frame:Math.min(7,Math.floor(record.elapsed/.24*8)),
            row:this.directions.indexOf(record.direction)+(art===ProtagonistArtV5 && variant==='masked'?4:0)};
        }
      }
    }
    const column=this.states.indexOf(pose.state);
    if(column<0 || !record || record.hero!==pose.hero || record.state!==pose.state ||
       !sheet?.complete || !sheet.naturalWidth || !image?.complete || !image.naturalWidth)return native();
    const nativeKey=art===MusicianArtV1?art.key(pose.hero,variant,pose.state):pose.hero+'_'+pose.state;
    if(image!==art.images[nativeKey])return native(); // First-decode idle fallback.
    const phase=Math.max(0,Math.min(1,record.elapsed/record.duration));
    // The contact has its own ninth time slot. The remaining slots still point
    // to all eight original source cells. A same-clock redraw or menu preserves
    // the displayed cell. Short hitches can skip time but never reverse a pose.
    const target=Math.min(8,Math.floor(phase*9));
    let cursor=this.playback.get(record);
    if(!cursor){
      // Decoding or visibility can begin midway through an action. Starting
      // from the present time avoids replaying the windup after a late load.
      cursor={time:art.clock,slot:target};
      this.playback.set(record,cursor);
    }else if(cursor.time!==art.clock){
      const ordered=art===MusicianArtV1 && seat>=0 && art.presentedAttack(record);
      cursor.slot=ordered?Math.max(cursor.slot,Math.min(target,cursor.slot+1)):Math.max(cursor.slot,target);
      cursor.time=art.clock;
    }
    if(cursor.slot===4){
      const row=this.directions.indexOf(pose.direction);
      const offset=this.placement[pose.hero+'_'+variant+'/'+pose.state+'/'+pose.direction];
      if(offset){destination[0]+=Math.round(offset[0]*88/256);destination[1]+=Math.round(offset[1]*88/256)}
      return {source:this.source(sheet,column,Math.max(0,row)),destination,contact:true};
    }
    pose.frame=cursor.slot>4?cursor.slot-1:cursor.slot;
    return native();
  },
  ally(hero,ally,target){
    if(!G)return;
    const dx=target.x-ally.x,dy=target.y-ally.y;
    const direction=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');
    this.followerCast={hero,game:G,area:G.area,state:'attack_1',direction,
      duration:.24,elapsed:0,started:HeroAttackFX.clock};
  }
};
const heroBodyFollower=HeroAttackFX.follower;
HeroAttackFX.follower=function(hero,ally,target){
  const result=heroBodyFollower.apply(this,arguments);
  if(ally && target)HeroAttackBody.ally(hero,ally,target);
  return result;
};
const heroBodyEffect=effect10;
effect10=function(type,...args){
  const result=heroBodyEffect.apply(this,arguments);
  if(type==='counter' && G?.active==='katana')NinjaArcherArtV1.mark(0,'katana','attack_3',.26,G.dir);
  return result;
};
