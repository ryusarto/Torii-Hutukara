#!/usr/bin/env python3
"""Atlas structure, transparency and per-clip frames; does not approve gameplay."""
from pathlib import Path
from PIL import Image
import json,hashlib
root=Path(__file__).resolve().parents[1];folder=root/'assets/combat-readability/v1';m=json.loads((folder/'manifest.json').read_text());im=Image.open(folder/m['atlas']);assert im.mode=='RGBA';assert im.size==(m['columns']*m['cell'],m['rows']*m['cell']);assert im.getpixel((0,0))[3]==0
rows=[];cell=m['cell']
for key,e in m['clips'].items():
 assert 0<=e['row']<m['rows'];assert len(e['pivot'])==2;assert 1<=e['frames']<=m['columns'];assert all(0<=v<=cell for v in e['pivot'])
 frames=[im.crop((f*cell,e['row']*cell,(f+1)*cell,(e['row']+1)*cell))for f in range(e['frames'])];assert all(f.getbbox() for f in frames)
 hashes=[hashlib.sha256(f.tobytes()).hexdigest()for f in frames]
 if key!='portal_spent':assert len(set(hashes))>=(3 if key=='flute_bolt' else 4),(key,len(set(hashes)))
 for f in frames:
  assert f.getchannel('A').getextrema()[0]==0
  # No opaque white matte was introduced around the authored pixels.
  rgba=f.tobytes();assert not any(rgba[i]>250 and rgba[i+1]>250 and rgba[i+2]>250 and rgba[i+3]>0 for i in range(0,len(rgba),4))
 rows.append({'key':key,'frames':len(frames),'distinctFrames':len(set(hashes)),'pivot':e['pivot'],'bounds':list(frames[0].getbbox())})
# HTTP transport may recode PNG to lossless WebP. Verify decoded original RGBA
# separately from Chrome's format-specific premultiplied-alpha rounding.
http_check=None
optpath=root/'production/playtest-dist/media-optimization.json'
if optpath.exists():
 optimization=json.loads(optpath.read_text());key='media/'+hashlib.sha256((folder/m['atlas']).read_bytes()).hexdigest()+'.png'
 if key in optimization:
  entry=optimization[key];served=Image.open(root/'production/playtest-dist'/entry['file']).convert('RGBA')
  assert entry['mode'] in ('lossless','original'),entry
  assert served.size==im.size and served.tobytes()==im.tobytes(),'HTTP optimizer changed original RGBA'
  http_check={'mode':entry['mode'],'originalRGBAIdentical':True,'file':entry['file']}
out=root/'qa/beta-1.17.0/COMBAT_READABILITY_ASSET.json';out.parent.mkdir(parents=True,exist_ok=True);out.write_text(json.dumps({'method':'Pillow decoded RGBA and per-cell checks; no gameplay claim','atlas':m['atlas'],'sha256':hashlib.sha256((folder/m['atlas']).read_bytes()).hexdigest(),'size':list(im.size),'clips':rows,'passed':len(rows),'httpDecoded':http_check},ensure_ascii=False,indent=2)+'\n');print(json.dumps({'passed':len(rows),'httpDecoded':http_check,'dimensions':im.size,'transparent':True}))
