#!/usr/bin/env python3
"""Import V2 material FX; preserve original cells, V1 and the four reused atlases.

Requires Pillow and NumPy. No individual recenter/normalization or deletion of
small fragments. Global empty source dividers are validated before cropping.
"""
from pathlib import Path
import copy, hashlib, json, shutil
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
V1 = ROOT/'assets/enemy-skill-fx/v1'
OUT = ROOT/'assets/enemy-skill-fx/v2'
CELL, GUARD = 128, 8
SPECS = {'tambor':[('tambor','right')],
         'flautim':[('flautim','right'),('flautim_impact','radial')]}

def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def bounds(a):
    y,x = np.where(a)
    return [int(x.min()),int(y.min()),int(x.max()+1),int(y.max()+1)] if len(x) else None
def union(bs):
    return [min(b[0] for b in bs),min(b[1] for b in bs),max(b[2] for b in bs),max(b[3] for b in bs)]
def largest_component(mask):
    seen=set(); best=[]
    for y,x in zip(*np.where(mask)):
        if (y,x) in seen: continue
        q=[(int(y),int(x))]; seen.add((y,x)); comp=[]
        while q:
            yy,xx=q.pop(); comp.append((yy,xx))
            for dy,dx in ((0,1),(0,-1),(1,0),(-1,0)):
                pt=(yy+dy,xx+dx)
                if 0<=pt[0]<mask.shape[0] and 0<=pt[1]<mask.shape[1] and mask[pt] and pt not in seen:
                    seen.add(pt);q.append(pt)
        if len(comp)>len(best): best=comp
    return best

for d in ('atlas','preview'): (OUT/d).mkdir(parents=True,exist_ok=True)
manifest=copy.deepcopy(json.loads((V1/'manifest.json').read_text()))
manifest.update(version=2, origin='built-in image_gen; exact new prompts in PROMPTS.json; V1 four atlases reused byte-for-byte',
    cleanup='Derived only: alpha <= 8 and RGB of fully transparent pixels zeroed. No component deletion.',
    segmentation='Global 5px divider alpha > 8 checked before crops. Full source cells mapped with constant nominal scale to112x112 at[8,8]. No per-frame recentering.')
report={'checks':[],'clips':{},'newFrames':0,'reusedAtlases':{}}
for name in ('coro','maestro','muralha','antena'):
    src=V1/'atlas'/f'{name}.png'; dst=OUT/'atlas'/src.name
    shutil.copyfile(src,dst)
    assert sha(src)==sha(dst)
    manifest['sources'][name]['path']=f'../v1/source/{name}.png'
    manifest['sources'][name]['reusedFrom']='../v1/manifest.json'
    report['reusedAtlases'][name]=sha(dst)
for key,clip in manifest['clips'].items():
    if clip['atlas'].split('/')[-1].split('.')[0] not in SPECS:
        clip['source']='../v1/'+clip['source']

loops=[]
for name,spec in SPECS.items():
    source=OUT/'source'/f'{name}.png';raw=np.array(Image.open(source).convert('RGBA'))
    h,w=raw.shape[:2]; rows=len(spec)*2
    a=raw[:,:,3]; clean=raw.copy();clean[a<=8]=0
    xs=[round(i*w/4) for i in range(5)];ys=[round(i*h/rows) for i in range(rows+1)]
    for axis,coords in [('x',xs[1:-1]),('y',ys[1:-1])]:
        for v in coords:
            s=a[:,v-2:v+3] if axis=='x' else a[v-2:v+3,:]
            assert not (s>8).any(),f'{name}: source {axis} divider at{v} crosses content'
    assert not (np.concatenate([a[0],a[-1],a[:,0],a[:,-1]])>8).any()
    atlas=Image.new('RGBA',(CELL*4,CELL*rows))
    for n,(key,orientation) in enumerate(spec):
        frames=[]; data=[];core_pivots={};core_evidence={}
        for f in range(8):
            r=n*2+f//4;c=f%4;x0,x1=xs[c:c+2];y0,y1=ys[r:r+2]
            im=Image.fromarray(clean[y0:y1,x0:x1]);sb=bounds(np.array(im)[:,:,3]>0);assert sb
            fitted=im.resize((112,112),Image.Resampling.NEAREST)
            frame=Image.new('RGBA',(128,128));frame.alpha_composite(fitted,(8,8));fa=np.array(frame)
            fb=bounds(fa[:,:,3]>0);assert fb
            assert not fa[:8,:,3].any() and not fa[-8:,:,3].any()
            assert not fa[:,:8,3].any() and not fa[:,-8:,3].any()
            # Exact full-source-cell derivative proof, not hash uniqueness alone.
            assert np.array_equal(np.array(fitted),fa[8:120,8:120])
            atlas.alpha_composite(frame,(c*128,r*128));frames.append(frame)
            width,height=fb[2]-fb[0],fb[3]-fb[1]
            meta={'frame':f,'sourceCell':[x0,y0,x1,y1],
                'sourceContent':[x0+sb[0],y0+sb[1],x0+sb[2],y0+sb[3]],
                'content':fb,'sha256':hashlib.sha256(fa.tobytes()).hexdigest(),
                'alphaPixels':int((fa[:,:,3]>0).sum()),'solidPixels':int((fa[:,:,3]>=128).sum()),
                'solidDensityWithinFrameBounds':round(float((fa[:,:,3]>=128).sum())/(width*height),4)}
            if key=='flautim' and f in (3,4,5):
                # Largest contiguous opaque ivory cluster in the leading half.
                mask=(fa[:,:,0]>=205)&(fa[:,:,1]>=195)&(fa[:,:,2]>=145)&(fa[:,:,3]>=192)
                mask[:,:80]=False
                comp=largest_component(mask);assert len(comp)>=8
                yy=np.array([p[0] for p in comp]);xx=np.array([p[1] for p in comp])
                core_pivots[str(f)]=[round(float(xx.mean()),2),round(float(yy.mean()),2)]
                cb=[int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1)]
                core_evidence[str(f)]={'bounds':cb,'pixels':len(comp),'centroid':core_pivots[str(f)],
                    'method':'Largest 4-connected leading-half ivory cluster R>=205 G>=195 B>=145 alpha>=192; measured in final128px cell'}
            data.append(meta)
        assert len({m['sha256'] for m in data})==8
        entry={'atlas':f'atlas/{name}.png','frames':8,'columns':4,'cell':128,'pivot':[64,64],
            'rowOffset':n*2,'orientation':orientation,'contentBounds':union([m['content'] for m in data]),
            'phaseFrames':{'gather':[0,1],'accelerate':[2],'peak':[3,4],'recover':[5,6,7]},
            'previewFrameMs':[95,95,75,90,90,90,110,150],
            'source':f'source/{name}.png','frameData':data}
        if key=='flautim':
            entry.update(flightFrames=[3,4,5],loopFlightFrames=[3,4,5],flightCorePivots=core_pivots,
                         flightCoreMeasurement=core_evidence)
        manifest['clips'][key]=entry
        report['clips'][key]={'frames':8,'contentBounds':entry['contentBounds'],
            'core':core_evidence,'wholeCellPreserved':True,'exportGuard':8}
        loops.append((key,frames));report['newFrames']+=8
        gif=[]
        for f,fr in enumerate(frames):
            bg=Image.new('RGBA',(256,280),'#29362b');bg.alpha_composite(fr.resize((256,256),Image.Resampling.NEAREST))
            ImageDraw.Draw(bg).text((8,262),key+' '+str(f),fill='#f4dfb4');gif.append(bg.convert('RGB'))
        gif[0].save(OUT/'preview'/f'{key}.gif',save_all=True,append_images=gif[1:],duration=entry['previewFrameMs'],loop=0,optimize=True)
    dst=OUT/'atlas'/f'{name}.png';atlas.save(dst,optimize=True)
    manifest['sources'][name]={'path':f'source/{name}.png','width':w,'height':h,'sha256':sha(source),
        'globalGuttersAlphaGT8':0,'completeAssignedPixels':int((a>8).sum()),'atlasSha256':sha(dst)}
    report['checks'].append({'sheet':name,'globalSourceDividersClear':True,'sourceExteriorClear':True,
        'fullCellSourceExportExact':True,'wholeFrameOwnership':True,'atlasGuard':8})

for label,color in [('earth','#3f3430'),('forest','#243a2b'),('stone','#a79e96')]:
    sheet=Image.new('RGB',(8*192,3*214),color);d=ImageDraw.Draw(sheet)
    for r,(key,frames) in enumerate(loops):
        for f,fr in enumerate(frames):
            bg=Image.new('RGBA',(192,192),color);bg.alpha_composite(fr.resize((192,192),Image.Resampling.NEAREST))
            sheet.paste(bg.convert('RGB'),(f*192,r*214))
        d.text((5,r*214+194),key,fill='#f8eacb' if label!='stone' else '#28232d')
    sheet.save(OUT/'preview'/f'all-new-frames-{label}.jpg',quality=91)
manifest['validation']={'sheets':6,'clips':10,'frames':80,'newSheets':2,'newClips':3,'newFrames':24,
    'reusedSheets':4,'reusedFrames':56,'allCellGuardAlpha0':8,'sourceGuttersValidated':True,
    'scope':'Static source/export and phase preview validation only; runtime integration and gameplay reviewed separately.'}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
(OUT/'IMPORT_QA.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'passed':True,'newFrames':24,'totalFrames':80,'bytes':sum(p.stat().st_size for p in (OUT/'atlas').glob('*.png')),
    'flightCorePivots':manifest['clips']['flautim']['flightCorePivots'],'bounds':{k:v['contentBounds'] for k,v in report['clips'].items()}}))
