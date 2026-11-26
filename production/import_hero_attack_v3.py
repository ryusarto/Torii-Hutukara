#!/usr/bin/env python3
"""Pack imagegen authored phases. No generated/inbetween animation or color repaint."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import hashlib,json
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'assets/hero-attack-fx/v3';CELL=128;HEROES=['franco','ryuchi','alt','katana','synth','percussion'];STATES=['attack_1','attack_2','attack_3','skill','advanced','signature']
(OUT/'atlas').mkdir(exist_ok=True);(OUT/'preview').mkdir(exist_ok=True)
manifest={'version':3,'origin':'Built-in image_gen, six original authored sheets; canonical boss atlas used only as style reference','sourcePolicy':'Original PNG preserved. Exact8x6 grid cropped and nearest packed. Alpha1..8 cleared on derivative to avoid sheet tint/bleed; no color repaint or invented phases.','cell':CELL,'columns':8,'rows':6,'frames':8,'pivot':[64,64],'filter':'nearest','guardPixels':8,'guardAtRuntime':'at least2logical pixels at nominal32px or larger; no cell content crosses padding','phaseDriver':'Original accepted action/effect duration; render only, no timer/damage/hitbox edits','preparation':[0,1],'contact':[2,3,4],'recovery':[5,6,7],'sheets':{}}
for hero in HEROES:
 src=OUT/'source'/f'{hero}.png';im=Image.open(src).convert('RGBA');assert im.size==(1448,1086),(hero,im.size)
 assert im.getchannel('A').getextrema()[0]==0
 atlas=Image.new('RGBA',(CELL*8,CELL*6));rows=[]
 for row,state in enumerate(STATES):
  metrics=[]
  for col in range(8):
   tile=im.crop((col*181,row*181,(col+1)*181,(row+1)*181));tile.putalpha(tile.getchannel('A').point(lambda a:a if a>8 else 0));tile=tile.resize((CELL-16,CELL-16),Image.Resampling.NEAREST);guarded=Image.new('RGBA',(CELL,CELL));guarded.alpha_composite(tile,(8,8));tile=guarded
   # Input grid has a deliberately constant center. Do not recenter/normalize
   # each drawing separately: that would erase gathering and dissipation.
   atlas.alpha_composite(tile,(col*CELL,row*CELL));a=tile.getchannel('A');box=a.getbbox();values=list(a.getdata());visible=sum(x>32 for x in values);opaque=sum(x>192 for x in values)
   metrics.append({'frame':col,'hash':hashlib.sha256(tile.tobytes()).hexdigest(),'bounds':box,'visiblePixelsAlpha32':visible,'opaquePixelsAlpha192':opaque,'alphaMass':sum(values)/255,'bboxEmptyFraction':None if not box else round(1-visible/((box[2]-box[0])*(box[3]-box[1])),4)})
  assert len(set(x['hash']for x in metrics))==8,(hero,state,'duplicate phases')
  assert sum(m['visiblePixelsAlpha32']for m in metrics[2:5])>sum(m['visiblePixelsAlpha32']for m in metrics[6:]),(hero,state,'no dissipation')
  rows.append({'state':state,'row':row,'pivot':[64,64],'frames':metrics})
 dest=OUT/'atlas'/f'{hero}.png';atlas.save(dest,optimize=True)
 bg=Image.new('RGB',atlas.size,'#655b59');bg.paste(atlas,(0,0),atlas);d=ImageDraw.Draw(bg)
 for y in range(6):d.text((5,y*CELL+4),STATES[y],fill='#f7e4bc')
 for x in range(8):d.text((x*CELL+CELL-14,5),str(x),fill='#f7e4bc')
 bg.save(OUT/'preview'/f'{hero}.png')
 manifest['sheets'][hero]={'atlas':f'atlas/{hero}.png','source':f'source/{hero}.png','sourceSha256':hashlib.sha256(src.read_bytes()).hexdigest(),'atlasSha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'size':list(atlas.size),'rows':rows}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
contact=Image.new('RGB',(1536,1152),'#221d25')
for i,h in enumerate(HEROES):
 p=Image.open(OUT/'preview'/f'{h}.png');p=p.resize((512,384),Image.Resampling.NEAREST);contact.paste(p,((i%3)*512,(i//3)*576+30));ImageDraw.Draw(contact).text(((i%3)*512+10,(i//3)*576+10),h,fill='#f0d7a3')
contact.save(OUT/'contact-sheet.png');print(json.dumps({'heroes':6,'clips':36,'frames':288,'atlas':[1024,768],'manifest':'assets/hero-attack-fx/v3/manifest.json'}))
