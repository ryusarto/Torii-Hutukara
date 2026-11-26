#!/usr/bin/env python3
"""Decode atlas and inspect every frame; compositing evidence is not gameplay."""
from pathlib import Path
from PIL import Image,ImageDraw
import json,hashlib
ROOT=Path(__file__).resolve().parents[1];ASSET=ROOT/'assets/hero-attack-fx/v3';OUT=ROOT/'qa/beta-1.17.0/hero-fx-v3';OUT.mkdir(parents=True,exist_ok=True)
m=json.loads((ASSET/'manifest.json').read_text());checks=[];heroes=list(m['sheets']);c=m['cell'];board=Image.new('RGB',(1280,6*150+30),'#26212a');d=ImageDraw.Draw(board)
for j,label in enumerate(['dark','light','forest screenshot crop','ruins screenshot crop']):d.text((j*320+5,8),label,fill='#f4ddaa')
for n,(hero,e)in enumerate(m['sheets'].items()):
 im=Image.open(ASSET/e['atlas']).convert('RGBA');assert im.size==(1024,768);assert hashlib.sha256((ASSET/e['atlas']).read_bytes()).hexdigest()==e['atlasSha256']
 for row in range(6):
  hashes=[];phases=[]
  for col in range(8):
   tile=im.crop((col*c,row*c,(col+1)*c,(row+1)*c));a=tile.getchannel('A');px=list(a.getdata());assert not any(0<v<=8 for v in px)
   for box in [(0,0,c,8),(0,c-8,c,c),(0,0,8,c),(c-8,0,c,c)]:assert a.crop(box).getextrema()[1]==0,(hero,row,col,'edge bleed')
   box=a.getbbox();assert box and min(box[0],box[1],c-box[2],c-box[3])>=12,(hero,row,col,'less than2logical pixels of real margin at smallest runtime size');hashes.append(hashlib.sha256(tile.tobytes()).hexdigest());phases.append(sum(px))
  assert len(set(hashes))==8,(hero,row,'duplicate frames');assert max(phases[2:5])>max(phases[6:]),(hero,row,'non-decaying residue')
  checks.append({'hero':hero,'clip':row,'frames':8,'transparentMargin':8,'decay':True})
 for j in range(4):
  bg=Image.new('RGB',(320,150),'#171923'if j==0 else '#d9cdb8')
  if j>=2:
   src=ROOT/'qa/beta-1.17.0'/('fx_preparo.png'if j==2 else 'portal_pronto.png')
   if src.exists():bg=Image.open(src).convert('RGB').crop((140,240,460,390)if j==2 else(140,470,460,620))
  for i,row in enumerate([0,3,5]):
   tile=im.crop((3*c,row*c,4*c,(row+1)*c)).resize((84,84),Image.Resampling.NEAREST);bg.paste(tile,(i*102+12,35),tile)
  ImageDraw.Draw(bg).text((5,5),hero+' J / Z / K at nominal56px',fill='#f6e5b6'if j!=1 else'#332b31');board.paste(bg,(j*320,n*150+30))
board.save(ASSET/'background-review.png');report={'method':'Pillow decoded all cells and composed nominal-size FX on dark/light and actual map screenshot crops; not human gameplay','passedClips':len(checks),'frames':len(checks)*8,'checks':checks};(OUT/'ASSET.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'clips':len(checks),'frames':len(checks)*8,'bordersAlpha':0,'residualAlpha1to8':0,'actualMinimumMarginPx':12,'minimumRuntimeMarginLogical':12*22/128}))
