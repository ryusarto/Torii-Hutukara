#!/usr/bin/env python3
from pathlib import Path
from PIL import Image,ImageDraw
import hashlib,json
ROOT=Path(__file__).resolve().parents[1];A=ROOT/'assets/enemies/variants-v2';OUT=ROOT/'qa/beta-1.17.0/enemy-variants-v2';OUT.mkdir(parents=True,exist_ok=True);m=json.loads((A/'manifest.json').read_text());cell=m['cell'];rows=[]
board=Image.new('RGB',(1280,6*160+25),'#211b26');d=ImageDraw.Draw(board)
for i,label in enumerate(['dark','light','forest screenshot crop','ruins screenshot crop']):d.text((i*320+5,5),label,fill='#f3d6aa')
for n,(typ,e)in enumerate(m['enemies'].items()):
 im=Image.open(A/e['atlas']).convert('RGBA');assert list(im.size)==e['atlasSize'];assert max(im.size)<=4096;assert hashlib.sha256((A/e['atlas']).read_bytes()).hexdigest()==e['atlasSha256'];assert e['headHeight']>0
 for source in e['sources']:
  assert hashlib.sha256((A/source['source']).read_bytes()).hexdigest()==source['sourceSha256'];g=source['segmentation'];assert g['sourceSolidPixels']==g['assignedSolidPixels'];assert len(g['poses'])==32
  for pose in g['poses']:
   b=pose['sourceGlobalBounds'];core=pose['solidBodyBounds'];assert b[0]<=core[0]and b[1]<=core[1]and b[2]>=core[2]and b[3]>=core[3];assert pose['fullPrimaryBodyRetained']and pose['foreignPrimaryBodyPixels']==0
  for row in source['rows']:
   hashes=[]
   for f in range(8):
    tile=im.crop((f*cell,row['row']*cell,(f+1)*cell,(row['row']+1)*cell));a=tile.getchannel('A');assert a.getbbox();assert not any(0<v<=8 for v in a.getdata())
    for b in[(0,0,cell,8),(0,cell-8,cell,cell),(0,0,8,cell),(cell-8,0,cell,cell)]:assert a.crop(b).getextrema()[1]==0,(typ,row['row'],f,'bleed')
    hashes.append(hashlib.sha256(tile.tobytes()).hexdigest());assert hashes[-1]==row['frames'][f]['sha256']
   assert len(set(hashes))==8;rows.append({'type':typ,'direction':source['direction'],'state':row['state'],'frames':8,'alphaGuard':8})
 for col in range(4):
  bg=Image.new('RGB',(320,160),'#15141b'if col==0 else'#d9d1bf')
  if col>=2:
   p=ROOT/'qa/beta-1.17.0'/('fx_preparo.png'if col==2 else'portal_pronto.png')
   if p.exists():bg=Image.open(p).convert('RGB').crop((140,235,460,395)if col==2 else(140,460,460,620))
  for i,state in enumerate([0,1,3]):
   t=im.crop((3*cell,state*cell,4*cell,(state+1)*cell)).resize((112,112),Image.Resampling.NEAREST);bg.paste(t,(i*100,40),t)
  ImageDraw.Draw(bg).text((4,4),typ,fill='#f4d9ad'if col!=1 else'#352a38');board.paste(bg,(col*320,n*160+25))
board.save(A/'background-review.png');report={'method':'Decoded all authored cells, source hashes, atlas bounds/transparency and compositing on dark/light + actual map screenshot crops; not gameplay','types':len(m['enemies']),'clips':len(rows),'authoredFrames':len(rows)*8,'checks':rows};(OUT/'ASSET.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({k:report[k]for k in['types','clips','authoredFrames']}))
