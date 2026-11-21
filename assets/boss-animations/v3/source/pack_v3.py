#!/usr/bin/env python3
from pathlib import Path
from PIL import Image
import json,statistics,hashlib
ROOT=Path(__file__).resolve().parents[4];OUT=ROOT/'assets/boss-animations/v3'
def bbox(a):return a.getchannel('A').point(lambda v:255 if v>120 else 0).getbbox()
def tile(im,c,r,cols,rows):return im.crop((round(c*im.width/cols),round(r*im.height/rows),round((c+1)*im.width/cols),round((r+1)*im.height/rows)))
ref=Image.open(ROOT/'assets/boss-animations/v2/atlas/boss_charge.png').convert('RGBA');target=bbox(tile(ref,0,0,4,2));source=Image.open(OUT/'source/boss_walk_clean.png').convert('RGBA');atlas=Image.new('RGBA',(8*320,4*320));rows=[]
for r,d in enumerate(['down','left','up','right']):
 cells=[tile(source,c,r,8,4) for c in range(8)];scale=(target[3]-target[1])/statistics.median(bbox(f)[3]-bbox(f)[1] for f in cells)
 hashes=[]
 for c,f in enumerate(cells):
  f=f.resize((round(f.width*scale),round(f.height*scale)),Image.Resampling.NEAREST);b=bbox(f);out=Image.new('RGBA',(320,320));out.paste(f,(round(160-(b[0]+b[2])/2),280-b[3]));atlas.paste(out,(c*320,r*320));hashes.append(hashlib.sha256(out.tobytes()).hexdigest())
 assert len(set(hashes))==8
 rows.append({'direction':d,'row':r,'uniqueFrames':8,'uniformScale':scale})
atlas.save(OUT/'atlas/boss_walk.png',optimize=True)
base=json.loads((ROOT/'assets/boss-animations/v2/manifest.json').read_text());scale=base['clips']['boss_cast']['scale']
manifest={'version':3,'extends':'boss-animations/v2','clips':{'boss_walk':{'boss':'boss','atlas':'atlas/boss_walk.png','columns':8,'rows':4,'cell':320,'pivot':[160,280],'scale':scale,'frames':8,'loop':True,'frameMs':95,'strideDistance':1.8,'directions':['down','left','up','right'],'source':'source/boss_walk_clean.png'}}}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');(OUT/'VALIDACAO.json').write_text(json.dumps({'method':'RGBA/registration/uniqueness only. Browser review separate.','rows':rows,'atlasSha256':hashlib.sha256((OUT/'atlas/boss_walk.png').read_bytes()).hexdigest()},indent=2)+'\n')
# Pack each authored FX cell into the common 4x2 contract without repainting it.
fx=ROOT/'assets/boss-ground-fx/v2';entries={}
for name,filename,size in [('aim','aim_clean.png',238),('projectile','projectile.png',226)]:
 source=Image.open(fx/'source'/filename).convert('RGBA');out=Image.new('RGBA',(1024,512));cells=[tile(source,c,r,4,2) for r in range(2) for c in range(4)];boxes=[bbox(f) for f in cells];union=(min(b[0] for b in boxes),min(b[1] for b in boxes),max(b[2] for b in boxes),max(b[3] for b in boxes));scale=size/max(union[2]-union[0],union[3]-union[1]);cx=(union[0]+union[2])/2;cy=(union[1]+union[3])/2
 for i,f in enumerate(cells):
  image=f.resize((round(f.width*scale),round(f.height*scale)),Image.Resampling.NEAREST);out.paste(image,((i%4)*256+round(128-cx*scale),(i//4)*256+round(128-cy*scale)))
 out.save(fx/f'atlas/{name}.png',optimize=True);entries[name]={'atlas':f'atlas/{name}.png','frames':8,'source':f'source/{filename}','cell':256,'columns':4,'rows':2,'pivot':[128,128],'frameMs':70 if name=='projectile' else 100}
(fx/'manifest.json').write_text(json.dumps({'version':2,'extends':'boss-ground-fx/v1','cell':256,'columns':4,'rows':2,'filter':'nearest','clips':entries},indent=2)+'\n')
print('Packedboss_walk2560x1280 +projectile/aim1024x512')
