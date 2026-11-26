#!/usr/bin/env python3
"""Importa fontes image_gen somente depois de validar os gutters na imagem global.
Não apaga fragmentos pequenos nem recentra/normaliza quadros individualmente.
"""
from pathlib import Path
import json, hashlib
import numpy as np
from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/enemy-skill-fx/v1'
SPECS={
 'tambor':[('tambor','right')],
 'flautim':[('flautim','right'),('flautim_impact','radial')],
 'coro':[('coro','up'),('coro_melee','right')],
 'maestro':[('maestro','up'),('maestro_emerge','up')],
 'muralha':[('muralha','right'),('muralha_charge','right')],
 'antena':[('antena','right')],
}
CELL=128
GUARD=8
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def box(a):
 y,x=np.where(a>0)
 return [int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1)] if len(x) else None
def union(boxes):
 return [min(b[0] for b in boxes),min(b[1] for b in boxes),max(b[2] for b in boxes),max(b[3] for b in boxes)]
manifest={'version':1,'cell':CELL,'columns':4,'pivot':[64,64],
 'origin':'built-in image_gen; exact prompts in PROMPTS.json; original sources preserved',
 'cleanup':'Derived only: alpha1..8 zero, transparent RGB zero. No small-component deletion.',
 'segmentation':'Global 5px alpha>8 empty gutters and exterior checked BEFORE any crop. Nominal origins preserved; whole-cell constant scale, no per-frame recentering.',
 'clips':{},'sources':{},'validation':{}}
report={'checks':[],'clips':{},'allFrameCount':0}
loops=[]
for name,spec in SPECS.items():
 source=OUT/'source'/f'{name}.png'
 raw=np.array(Image.open(source).convert('RGBA'))
 h,w=raw.shape[:2];rows=len(spec)*2
 alpha=raw[:,:,3]
 clean=raw.copy();clean[alpha<=8]=0
 a=clean[:,:,3]
 xs=[round(i*w/4) for i in range(5)]
 ys=[round(i*h/rows) for i in range(rows+1)]
 for axis,coords in [('x',xs[1:-1]),('y',ys[1:-1])]:
  for v in coords:
   strip=a[:,v-2:v+3] if axis=='x' else a[v-2:v+3,:]
   assert not strip.any(),f'{name}: global {axis} gutter {v} crosses authored content'
 assert not np.concatenate([a[0],a[-1],a[:,0],a[:,-1]]).any(),f'{name}: source truncated at exterior'
 source_frames=[]
 atlas=Image.new('RGBA',(CELL*4,CELL*rows))
 for n,(key,orientation) in enumerate(spec):
  frames=[];frame_meta=[]
  for f in range(8):
   r=n*2+f//4;c=f%4;x0,x1=xs[c:c+2];y0,y1=ys[r:r+2]
   # The FULL assigned source cell is retained after global isolation check.
   im=Image.fromarray(clean[y0:y1,x0:x1])
   sb=box(np.array(im)[:,:,3]);assert sb
   # Nominal source cell ->112px nominal cell, shared across all phases.
   fitted=im.resize((CELL-GUARD*2,CELL-GUARD*2),Image.Resampling.NEAREST)
   frame=Image.new('RGBA',(CELL,CELL));frame.alpha_composite(fitted,(GUARD,GUARD))
   fa=np.array(frame);fb=box(fa[:,:,3]);assert fb
   assert not fa[:GUARD,:,3].any() and not fa[-GUARD:,:,3].any()
   assert not fa[:,:GUARD,3].any() and not fa[:,-GUARD:,3].any()
   atlas.alpha_composite(frame,(c*CELL,r*CELL))
   meta={'frame':f,'sourceCell':[x0,y0,x1,y1],'sourceContent':[x0+sb[0],y0+sb[1],x0+sb[2],y0+sb[3]],
    'content':fb,'sha256':hashlib.sha256(fa.tobytes()).hexdigest(),
    'alphaPixels':int((fa[:,:,3]>0).sum()),'solidPixels':int((fa[:,:,3]>=128).sum())}
   frame_meta.append(meta);source_frames.append(meta);frames.append(frame)
  assert len(set(m['sha256'] for m in frame_meta))==8,key+' repeated frame'
  content=union([m['content'] for m in frame_meta])
  entry={'atlas':f'atlas/{name}.png','frames':8,'columns':4,'cell':CELL,'pivot':[64,64],
   'rowOffset':n*2,'orientation':orientation,'contentBounds':content,
   'phaseFrames':{'gather':[0,1],'accelerate':[2],'peak':[3,4],'recover':[5,6,7]},
   'previewFrameMs':[95,95,75,65,65,90,110,150],
   'source':f'source/{name}.png','frameData':frame_meta}
  if key=='flautim':entry['loopFlightFrames']=[2,3,4];entry['coreAnchor']=[104,64]
  if key=='antena':entry['beamContentBounds']=content
  manifest['clips'][key]=entry;report['clips'][key]={'frames':8,'alphaGuard':GUARD,'contentBounds':content,'completeSourceOwnership':True}
  # One full loop on a dark-earth background; no artificial moving frame recentering.
  gif=[]
  for f,fr in enumerate(frames):
   bg=Image.new('RGBA',(256,280),'#3f3430');bg.alpha_composite(fr.resize((256,256),Image.Resampling.NEAREST))
   d=ImageDraw.Draw(bg);d.text((8,261),key+' '+str(f+1)+'/8',fill='#f5e1c0')
   gif.append(bg.convert('RGB'))
  gp=OUT/'preview'/f'{key}.gif';gif[0].save(gp,save_all=True,append_images=gif[1:],duration=entry['previewFrameMs'],loop=0,optimize=True)
  loops.append((key,frames))
 atlaspath=OUT/'atlas'/f'{name}.png';atlas.save(atlaspath,optimize=True)
 manifest['sources'][name]={'path':f'source/{name}.png','width':w,'height':h,'sha256':sha(source),
  'globalGuttersAlphaGT8':0,'completeAssignedPixels':int((a>0).sum()),'atlasSha256':sha(atlaspath)}
 report['allFrameCount']+=len(spec)*8
 report['checks'].append({'sheet':name,'globalGutters':True,'exterior':True,'wholeFrameOwnership':True,'atlasGuard':True})
# All80frames at2x on brown/forest/stone: inspect phase ownership and no rectangle or matte.
for label,color in [('earth','#3f3430'),('forest','#243a2b'),('stone','#a79e96')]:
 sheet=Image.new('RGB',(8*192,10*214),color)
 d=ImageDraw.Draw(sheet)
 for r,(key,frames) in enumerate(loops):
  for f,fr in enumerate(frames):
   at=(f*192,r*214)
   bg=Image.new('RGBA',(192,192),color);bg.alpha_composite(fr.resize((192,192),Image.Resampling.NEAREST))
   sheet.paste(bg.convert('RGB'),at)
  d.text((5,r*214+194),key,fill='#f8eacb' if label!='stone' else '#28232d')
 sheet.save(OUT/'preview'/f'all-frames-{label}.jpg',quality=91)
manifest['validation']={'sheets':6,'clips':10,'frames':80,'allCellGuardAlpha0':GUARD,'sourceGuttersValidated':True,
 'scope':'Static import validation and authored phase previews. Actual engine/runtime validation remains with integration.'}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
(OUT/'IMPORT_QA.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'sheets':6,'clips':len(manifest['clips']),'frames':report['allFrameCount'],'atlasBytes':sum(p.stat().st_size for p in (OUT/'atlas').glob('*.png')),'passed':True}))

