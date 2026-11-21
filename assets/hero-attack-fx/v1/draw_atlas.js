// Original pixel FX for Torii & Hutukara. Run pack.cjs to rasterize the atlas.
function drawHeroAttackAtlas(canvas) {
  const cell = 96, frames = 10, tau = 2 * Math.PI;
  canvas.width = frames * cell * 2;
  canvas.height = 24 * cell;
  const q = canvas.getContext('2d');
  const palettes = [
    ['#814535','#e99a48','#ffe7a5'], ['#245686','#65cddd','#e7ffff'],
    ['#4b6342','#a5c17f','#fff1b9'], ['#56476c','#c0a8d5','#ffffe4'],
    ['#2c5867','#4fd6cf','#e1fcff'], ['#753d65','#ef79ae','#ffe3ac']
  ];
  function polygon(points, color) {
    q.beginPath();
    points.forEach(([x,y],n)=>n ? q.lineTo(Math.round(x),Math.round(y)) : q.moveTo(Math.round(x),Math.round(y)));
    q.closePath(); q.fillStyle=color; q.fill();
  }
  function stroke(points,color,width=1) {
    q.beginPath(); points.forEach(([x,y],n)=>n ? q.lineTo(Math.round(x),Math.round(y)) : q.moveTo(Math.round(x),Math.round(y)));
    q.strokeStyle=color; q.lineWidth=width; q.stroke();
  }
  function polar(r,a,flat=1){return [r*Math.cos(a),r*Math.sin(a)*flat]}
  function slash(r,start,end,w,color,flat=.84) {
    const outer=[], inner=[];
    for(let k=0;k<=18;k++){
      const t=k/18, a=start+(end-start)*t, width=w*Math.sin(Math.PI*t);
      outer.push(polar(r,a,flat)); inner.push(polar(r-width,a,flat));
    }
    polygon(outer.concat(inner.reverse()),color);
  }
  function star(x,y,r,color) {
    polygon(Array.from({length:8},(_,i)=>{
      const [dx,dy]=polar(i%2?r*.22:r,i*Math.PI/4);return [x+dx,y+dy];
    }),color);
  }
  function arrow(x,y,length,color,angle=0) {
    q.save();q.translate(x,y);q.rotate(angle);
    polygon([[-length,0],[-length+3,-2],[-length+6,-1],[-4,-1],[-7,-4],[2,0],[-7,4],[-4,1],[-length+6,1],[-length+3,2]],color);q.restore();
  }
  function note(x,y,s,color) {
    polygon([[x,y],[x+s,y-s*.4],[x+s,y-s*2.8],[x+2*s,y-s*2.2],[x+2*s,y-s*3.1],[x+s*.6,y-s*3.7],[x+s*.6,y-s],[x,y-s*.6],[x-s*.5,y]],color);
  }
  function chevron(x,w,color) {polygon([[x,-w],[x+6,0],[x,w],[x+2,0]],color)}
  // Rows 0–23 are accepted casts. Extra rows cover combo contacts and releases.
  const variants=[[0,0],[0,0],[1,0],[1,0],[3,0],[3,0],[4,0],[4,0],[5,0],[5,0],[3,2],[5,1],[2,3],[2,0],[1,1],[5,2],[4,2],[4,1]];
  for(let row=0;row<24+variants.length;row++) for(let f=0;f<frames;f++) {
    const [hero,action]=row<24?[Math.floor(row/4),row%4]:variants[row-24];
    const variant=row<24?0:1+(row-24)%2;
    const [shade,mid,light]=palettes[hero], t=(f+.5)/frames, ease=1-(1-t)**2, pulse=Math.sin(Math.PI*t);
    const radius=12+30*ease, turn=-1.3+2.75*ease;
    q.save(); q.translate(cell*(Math.floor(row/24)*frames+f+.5),cell*(row%24+.5)); q.lineJoin='round';q.lineCap='round';
    q.globalAlpha=Math.min(1,.55+3*t,.18+2.7*(1-t));
    // Successive bass strums and sword attacks swing back, then finish with a thrust.
    if([24,26,28].includes(row))q.scale(1,-1);
    if([25,27,29].includes(row)){
      polygon([[-6,2],[radius-3,-3],[radius+3,-5],[radius,0],[7,3]],light);
      slash(radius*.78,-.9,1.1,5,mid);
    }
    if(row===34 || row===35){ // Parry and percussion counter trigger on contact.
      for(let k=0;k<8;k++){const [x,y]=polar(radius*.7,k*tau/8+t*.36);star(x,y,1+3*pulse,light)}
    }
    if(row===30 || row===31)q.scale(1,1+variant*.36);
    if(row===32 || row===33)slash(radius*.8,-1.8,1.7,3+variant,light,.72);
    if(row===37 || row===38){ // Actual moving arrow / sonic shard, centred on projectile.
      polygon([[-16,0],[-7,-2],[1,-3],[10,0],[0,3],[-7,2]],shade);
      arrow(7,0,22,light);star(-12+f*.85,0,2+2*pulse,mid);q.restore();continue;
    }
    switch(hero*4+action) {
      case 0: // Franco: bass pick striking vibrating strings
        for(let i=-1;i<2;i++)stroke([[3,i*4],[11,i*6+3*pulse],[radius,i*8]],i===0?light:mid,2);
        polygon([[4+20*ease,-6],[13+20*ease,-3],[8+20*ease,7],[2+20*ease,1]],mid);
        star(radius,0,2+4*pulse,light); break;
      case 1: // Bass pulse with a vibrating open edge
      case 2: // Resonant chord: four chord tones moving around the wave
      case 3: // Coração grave: beating heart, pulse wave and staff
        for(let band=0;band<=action;band++){
          const r=radius-band*4;
          for(let k=0;k<4;k++)slash(r,k*tau/4+.15+t*.4,(k+1)*tau/4+t*.4,2+band%2,band%2?light:mid,.69);
        }
        if(action===2)for(let i=0;i<4;i++){const [x,y]=polar(radius-3,i*tau/4+t*.5,.75);note(x,y,2.4,light)}
        if(action===3){
          const h=8+4*pulse;
          polygon([[0,.85*h],[-h,0],[-h,-h*.55],[-.6*h,-h*.86],[0,-h*.47],[.6*h,-h*.86],[h,-h*.55],[h,0]],mid);
          stroke([[-radius,0],[-13,0],[-8,-3],[-5,4],[0,-9],[3,6],[7,0],[radius,0]],light,1.5);
        } break;
      case 4: // Ryuchi's curved blade, guard, moving tip and lacquered wake
        slash(33,-1.5,turn,8*pulse+1,shade);slash(34,-1.28,turn,5*pulse+1,mid);
        slash(34,-.94,turn,2.6,light);q.rotate(turn);
        polygon([[4,-1],[11,-2],[24,-3],[36,-1],[26,1],[11,2],[4,1]],light);
        stroke([[10,-4],[10,4]],mid,2);stroke([[3,0],[8,0]],shade,3);star(34,0,3*pulse,light);break;
      case 5: // Three sonic blades
        for(let i=-1;i<=1;i++){q.save();q.rotate(i*.28);chevron(radius-6,7-i%2,mid);chevron(radius-2,6,light);q.restore()}break;
      case 6: // Passo sônico: movement afterimages
        for(let i=0;i<4;i++){const x=radius-11*i-7;polygon([[x-9,9],[x+3,-10],[x+10,-13],[x-3,7]],i===0?light:mid)} break;
      case 7: // Corrente de vozes: interlocked harmonics
        for(let i=0;i<3;i++){q.save();q.translate((i-1)*(12+7*ease),Math.sin(t*tau+i)*5);q.rotate(-.6+i*.3);slash(10+4*pulse,-2.8,2.9,3,i===1?light:mid,.53);q.restore()}
        star(26*ease,-6,2+3*pulse,light);break;
      case 8: case 9: case 10: // Recurve bow, piercing arrow, three-arrow volley
        stroke([[8,-16],[12,-9],[10,0],[12,9],[8,16]],mid,2);
        stroke([[8,-16],[2+6*ease,0],[8,16]],light);
        if(action===0)arrow(radius-2,0,20,light);
        if(action===1){polygon([[0,0],[radius-5,-4],[radius+2,0],[radius-5,4]],mid);arrow(radius,0,30,light)}
        if(action===2)for(let i=-1;i<=1;i++)arrow(radius-Math.abs(i)*6,i*6,20,light,i*.09);
        break;
      case 11: // Chuva de flechas: mark and descending arrows
        for(let i=0;i<4;i++)slash(radius*.7,i*tau/4+.1,(i+1)*tau/4-.1,2,mid,.52);
        for(let i=-2;i<=2;i++){const y=((t*30+i*7+40)%30)-18;arrow(i*6,y,15,light,1.94)}
        break;
      case 12: // Unsheathed katana: sharp single bevel
        slash(35,-1.6,turn,4*pulse+1,mid);slash(36,-1,turn,2,light);q.rotate(turn);polygon([[4,-2],[34,-2],[40,-4],[35,1],[4,1]],light);break;
      case 13: // Iai
        polygon([[-17,6],[radius-5,-3],[radius+4,-4],[radius,0],[-15,8]],light);
        stroke([[-21,9],[radius-7,2]],mid,2);star(radius-2,-3,5*pulse,light);break;
      case 14: // Parry guard with a polished crossing edge
        slash(22+5*pulse,-1.25+t*.3,1.25+t*.3,5,mid);stroke([[5,14],[12,2],[21,-15]],light,3);star(16,-4,4+4*pulse,light);break;
      case 15: // Corte do horizonte: opposing edges close around a cut
        for(let i of [-1,1])polygon([[-radius,i*(7-5*pulse)],[-4,i*2],[radius,i*5],[radius-6,i*2],[-2,0]],i>0?mid:light);
        star(radius*.65,0,2+5*pulse,light);break;
      case 16: case 19: // Synth waveform and layered super
        for(let band=0;band<(action===3?3:1);band++){
          const points=[];for(let i=0;i<=32;i++){const x=i/32;points.push([action===3?(x-.5)*radius*2:x*radius,Math.sin(x*tau*(2+band)+t*tau+band)*(4+7*pulse)*Math.sin(x*Math.PI)+band*3-2])}
          stroke(points,band%2?mid:light,2);
        }
        if(action===3)for(let i=0;i<6;i++){const [x,y]=polar(radius,i*tau/6+t,.6);star(x,y,3,mid)}
        break;
      case 17: case 18: // Pad harmônico expands; Filtro de corte collapses into the pad
        for(let n=0;n<3;n++){
          const r=action===1?radius-n*4:9+(1-ease)*23+n*3;
          stroke([[0,-r*.55],[r,0],[0,r*.55],[-r,0],[0,-r*.55]],n===1?light:mid,2);
        }
        if(action===2)stroke([[-radius,3],[radius,-3]],light,2);break;
      case 20: // Percussion: paired sticks and a rim impact
        for(const side of [-1,1])stroke([[2,side*14],[radius-7,side*(7-6*pulse)]],mid,3);
        star(radius-7,0,3+7*pulse,light);break;
      case 21: case 22: case 23: // Counterbeat, sequential breaks, communal pulse
        for(let n=0;n<(action===1?1:3);n++){
          const r=radius-n*6;
          for(let k=0;k<8;k++)slash(r,k*tau/8+t*.45,(k+.8)*tau/8+t*.45,action===1?4:2,n%2?light:mid,.68);
        }
        if(action===1){stroke([[-8,-9],[8,6]],light,2);stroke([[-8,6],[8,-9]],light,2)}
        if(action===2)for(let i=0;i<3;i++)star((i-1)*11,(i%2)*6-3,4+2*pulse,light);
        if(action===3)for(let i=0;i<8;i++){
          const [x,y]=polar(radius-4,i*tau/8+t*.45,.68);q.save();q.translate(x,y);q.rotate(i*tau/8);polygon([[0,-2],[5,0],[0,2],[-3,0]],light);q.restore()
        }break;
    }
    // Small directional ringing spark on release provides a different silhouette each frame.
    const sparkX=8+f*2, sparkY=(row%3-1)*3+Math.floor(t*5);
    star(sparkX,sparkY,1.25+pulse,light);
    q.restore();
  }
}
