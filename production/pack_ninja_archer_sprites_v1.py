"""Normalize authored PNG poses; no procedural drawing, stretching or rotation.
Usage: python3 production/pack_ninja_archer_sprites_v1.py /path/to/ninja-arqueiro-v1
Requires Pillow. Originals and individual exports stay in the asset backup.
"""
import argparse, hashlib, json, statistics, zipfile, os
from pathlib import Path
from PIL import Image, ImageDraw

parser = argparse.ArgumentParser()
parser.add_argument('base', type=Path)
args = parser.parse_args()
base = args.base.resolve()
out = base / 'pacote'
states = ['idle','walk','run','roll','attack_1','attack_2','attack_3','skill','advanced','signature','hurt','defeat']
heroes = {'katana':'unmasked','alt':'belt_mask'}
directions = ['down','left','up','right']
sources = json.loads((base/'fontes.json').read_text())
portraits = json.loads((base/'retratos.json').read_text())
assert len(sources)==24 and {(s['hero'],s['state']) for s in sources} == {(h,s) for h in heroes for s in states}
assert len(portraits)==2 and {s['hero'] for s in portraits}==set(heroes)
manifest = dict(version=1,release='ninja-arqueiro-v1',cell=[256,256],pivot=[128,224],sourceGrid=[8,4],
    directions=directions,states=states,heroes=heroes,maskLocation={'katana':'none','alt':'right_hip'},animations=[],portraits=[],sources=[])
checks=[]

def png(im,path):
    path.parent.mkdir(parents=True,exist_ok=True)
    tmp=path.with_suffix('.png.exportando');im.save(tmp,format='PNG');os.replace(tmp,path)

def edges(im,rows):
    a=im.getchannel('A');projection=[sum(v>=128 for v in a.crop((0,y,im.width,y+1)).tobytes()) for y in range(im.height)]
    result=[0];step=im.height/rows
    for k in range(1,rows):
        lo,hi=round((k-.35)*step),round((k+.35)*step);gaps=[]
        for y in range(lo,hi):
            if projection[y]<=4:
                if gaps and y==gaps[-1][-1]+1:gaps[-1].append(y)
                else:gaps.append([y])
        if gaps:
            gap=max(gaps,key=len);result.append((gap[0]+gap[-1])//2)
        else:result.append(min(range(lo+2,hi-2),key=lambda y:sum(projection[y-2:y+3])))
    return result+[im.height]

def crop_pose(im,rows,row,col,columns=8):
    crop=im.crop((round(col*im.width/columns),rows[row],round((col+1)*im.width/columns),rows[row+1]))
    # Alpha debris is excluded only outside the connected silhouette and nearby gear.
    a=crop.getchannel('A');pixels=a.tobytes();w,h=crop.size;seen=bytearray(w*h);components=[]
    for seed,value in enumerate(pixels):
        if value<128 or seen[seed]:continue
        seen[seed]=1;queue=[seed]
        for i in queue:
            x,y=i%w,i//w
            for dx,dy in [(-1,-1),(0,-1),(1,-1),(-1,0),(1,0),(-1,1),(0,1),(1,1)]:
                nx,ny=x+dx,y+dy
                if 0<=nx<w and 0<=ny<h:
                    ni=ny*w+nx
                    if not seen[ni] and pixels[ni]>=128:seen[ni]=1;queue.append(ni)
        components.append(queue)
    assert components,'Empty authored pose'
    main=max(components,key=len)
    x0,x1=min(i%w for i in main),max(i%w for i in main)
    y0,y1=min(i//w for i in main),max(i//w for i in main)
    keep=list(main)
    for component in components:
        if component is main or len(component)<20:continue
        if any(x0-14<=i%w<=x1+14 and y0-14<=i//w<=y1+14 for i in component):keep.extend(component)
    bb=(max(0,min(i%w for i in keep)-1),max(0,min(i//w for i in keep)-1),min(w,max(i%w for i in keep)+2),min(h,max(i//w for i in keep)+2))
    return crop.crop(bb)

for source in sources:
    hero,state,variant=source['hero'],source['state'],source['variant'];path=base/source['file']
    assert variant==heroes[hero]
    raw=path.read_bytes();sha=hashlib.sha256(raw).hexdigest();assert sha==source['sha256']
    im=Image.open(path).convert('RGBA')
    # Remove near-transparent generation dust, preserving the authored silhouette.
    im.putalpha(im.getchannel('A').point(lambda a: 0 if a<128 else a))
    transparent=im.getchannel('A').histogram()[0]/(im.width*im.height)
    assert transparent>.4,(path,transparent)
    row_edges=source.get('rowEdges') or edges(im,4)
    atlas=Image.new('RGBA',(2304,1024))
    for row,direction in enumerate(directions):
        poses=[crop_pose(im,row_edges,row,col) for col in range(8)]
        reference=poses[7 if state=='roll' else 0]
        scale=min(190/reference.height,244/max(p.width for p in poses),216/max(p.height for p in poses))
        frames=[]
        for pose in poses:
            pose=pose.resize((max(1,round(pose.width*scale)),max(1,round(pose.height*scale))),Image.Resampling.NEAREST)
            frame=Image.new('RGBA',(256,256));frame.alpha_composite(pose,(128-pose.width//2,224-pose.height));frames.append(frame)
        frames.append(frames[7 if state=='defeat' else 0].copy())
        hashes=[hashlib.sha256(f.tobytes()).hexdigest() for f in frames]
        assert len(set(hashes[:8]))>=2,(hero,state,direction,'No animated poses')
        for index,frame in enumerate(frames):
            box=frame.getbbox();assert box and box[0]>0 and box[1]>0 and box[2]<256 and box[3]<256
            png(frame,out/'frames'/hero/variant/state/direction/f'{index:02}.png')
            atlas.alpha_composite(frame,(index*256,row*256))
        timing={'idle':140,'walk':105,'run':65,'roll':45 if hero=='alt' else 43.75,'attack_1':45,'attack_2':50,'attack_3':60,'skill':65,'advanced':75,'signature':100,'hurt':45,'defeat':100}[state]
        manifest['animations'].append(dict(hero=hero,variant=variant,state=state,direction=direction,row=row,frames=9,playFrames=8,loop=state in ['idle','walk','run'],holdLast=state=='defeat',atlas=f'atlas/{hero}_{state}.png',frameMs=timing))
        checks.append(dict(hero=hero,state=state,direction=direction,uniquePoses=len(set(hashes[:8])),referenceHeight=round(reference.height*scale),closureValid=hashes[8]==hashes[7 if state=='defeat' else 0]))
    png(atlas,out/'atlas'/f'{hero}_{state}.png')
    manifest['sources'].append(dict(hero=hero,state=state,sha256=sha,file=source['file'],size=list(im.size),rowEdges=row_edges,transparentFraction=transparent))

expressions=['neutral','speaking','happy','surprised','determined','angry','hurt','sad']
for source in portraits:
    path=base/source['file'];assert hashlib.sha256(path.read_bytes()).hexdigest()==source['sha256']
    im=Image.open(path).convert('RGBA');im.putalpha(im.getchannel('A').point(lambda a:0 if a<128 else a));row_edges=edges(im,2)
    poses=[crop_pose(im,row_edges,i//4,i%4,4) for i in range(8)]
    scale=min(242/max(p.width for p in poses),242/max(p.height for p in poses))
    for pose,expression in zip(poses,expressions):
        pose=pose.resize((round(pose.width*scale),round(pose.height*scale)),Image.Resampling.NEAREST)
        portrait=Image.new('RGBA',(256,256));portrait.alpha_composite(pose,(128-pose.width//2,248-pose.height))
        file=f'retratos/{source["hero"]}/{expression}.png';png(portrait,out/file)
        manifest['portraits'].append(dict(hero=source['hero'],variant=source['variant'],expression=expression,file=file))

(out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
report=dict(atlas=24,directionalSequences=96,individualFrames=864,portraits=16,cell=[256,256],pivot=[128,224],trueAlpha=True,nearestNeighborOnly=True,closureValid=all(c['closureValid'] for c in checks),checks=checks)
(out/'VALIDACAO.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
html='''<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Ninja e Arqueiro · V1</title><style>*{box-sizing:border-box}body{background:#171522;color:#f5e4c9;font:16px system-ui;padding:20px}select,button,input{font:inherit;margin:6px;padding:8px}canvas{image-rendering:pixelated;background:repeating-conic-gradient(#262332 0% 25%,#353140 0% 50%) 0/24px 24px;border:1px solid #a99;max-width:100%}p{max-width:850px}</style><h1>Ryuchi Ninja e Franco Arqueiro · V1</h1><p>PNG transparente · quatro direções · 12 estados. Ninja sem máscara; Arqueiro com máscara no cinto.</p><div id="controls"></div><canvas width="512" height="512"></canvas><p id="info"></p><button id="replay">Repetir</button><button id="pause">Pausar</button><button id="step">Próximo quadro</button><label>Velocidade <input id="speed" type="range" min="0.25" max="2" step="0.25" value="1"></label><script>const M=MANIFEST,ctx=document.querySelector('canvas').getContext('2d'),info=document.querySelector('#info'),selects={};let image=new Image(),active,elapsed=0,last=0,paused=false;for(const[k,values]of Object.entries({hero:['katana','alt'],state:M.states,direction:M.directions})){const s=document.createElement('select');s.id=k;values.forEach(v=>s.add(new Option(v,v)));selects[k]=s;controls.append(s);s.onchange=choose}function choose(){active=M.animations.find(a=>Object.keys(selects).every(k=>a[k]===selects[k].value));image.src=active.atlas;elapsed=0}replay.onclick=()=>elapsed=0;pause.onclick=()=>{paused=!paused;pause.textContent=paused?'Continuar':'Pausar'};step.onclick=()=>{paused=true;elapsed+=active.frameMs};function tick(t){if(!paused)elapsed+=(last?t-last:0)*+speed.value;last=t;let f=Math.floor(elapsed/active.frameMs);f=active.loop?f%8:Math.min(8,f);ctx.clearRect(0,0,512,512);ctx.imageSmoothingEnabled=false;if(image.complete&&image.naturalWidth)ctx.drawImage(image,f*256,active.row*256,256,256,0,0,512,512);info.textContent=active.hero+' · '+active.state+' · '+active.direction+' · quadro '+f;requestAnimationFrame(tick)}choose();requestAnimationFrame(tick)</script>'''
(out/'PREVIA.html').write_text(html.replace('MANIFEST',json.dumps(manifest,ensure_ascii=False)))
contact=Image.new('RGB',(1536,12*150),(27,24,37));draw=ImageDraw.Draw(contact)
for y,state in enumerate(states):
    for x,hero in enumerate(heroes):
        variant=heroes[hero];draw.text((x*768+8,y*150+4),f'{hero} / {state}',fill='white')
        for c,index in enumerate([0,3,5,7]):
            frame=Image.open(out/'frames'/hero/variant/state/'down'/f'{index:02}.png').resize((128,128),Image.Resampling.NEAREST)
            contact.paste(frame,(x*768+c*180+18,y*150+20),frame)
png(contact,out/'CONTATO.png')
for state in ['walk','run','roll']:
    contact=Image.new('RGB',(1024,1024),(27,24,37));draw=ImageDraw.Draw(contact)
    for h,hero in enumerate(heroes):
        for r,direction in enumerate(directions):
            for c in range(8):
                frame=Image.open(out/'frames'/hero/heroes[hero]/state/direction/f'{c:02}.png').resize((128,128),Image.Resampling.NEAREST)
                contact.paste(frame,(c*128,(h*4+r)*128),frame)
    png(contact,out/f'CONTATO_{state}.png')
preview=[]
for c in range(8):
    canvas=Image.new('RGB',(768,512),(27,24,37))
    for row,hero in enumerate(heroes):
        for col,state in enumerate(['walk','run','roll']):
            frame=Image.open(out/'frames'/hero/heroes[hero]/state/'down'/f'{c:02}.png');canvas.paste(frame,(col*256,row*256),frame)
    preview.append(canvas)
preview[0].save(out/'PREVIA_ANIMADA.gif',save_all=True,append_images=preview[1:],duration=95,loop=0)
zip_path=base/'TORII_NINJA_ARQUEIRO_SPRITES_V1.zip';temp=zip_path.with_suffix('.zip.exportando')
with zipfile.ZipFile(temp,'w',zipfile.ZIP_DEFLATED) as z:
    for p in sorted(out.rglob('*')):
        if p.is_file():z.write(p,p.relative_to(out))
os.replace(temp,zip_path)
print(json.dumps({k:v for k,v in report.items() if k!='checks'}))
