#!/usr/bin/env python3
"""Register six authored effects per hero. Preserve relative expansion across each clip."""
import argparse
import hashlib
import json
from pathlib import Path
import numpy as np
from PIL import Image

HERE=Path(__file__).resolve().parent
HEROES=['franco','ryuchi','katana','synth','percussion']
STATES=['attack_1','attack_2','attack_3','skill','advanced','signature']
CELL=128

def boundaries(profile,n):
    size=len(profile);span=size/n
    edges=[0]
    for i in range(1,n):
        center=round(span*i)
        candidates=range(max(1,round(center-span*.18)),min(size-1,round(center+span*.18)+1))
        edges.append(min(candidates,key=lambda p:(int(profile[p-1])+int(profile[p]),abs(center-p))))
    return edges+[size]

def pack(hero,preview):
    src=HERE/'source'/f'{hero}.png'
    raw=Image.open(src).convert('RGBA')
    alpha=np.asarray(raw.getchannel('A'))
    if alpha.min()>=80:
        raise ValueError(f'{hero} has no transparent background')
    visible=alpha>=64
    xs=boundaries(visible.sum(axis=0),6);ys=boundaries(visible.sum(axis=1),6)
    atlas=Image.new('RGBA',(6*CELL,6*CELL));rows=[]
    for row,state in enumerate(STATES):
        tiles=[];bounds=[]
        for col in range(6):
            tile=raw.crop((xs[col],ys[row],xs[col+1],ys[row+1]))
            a=tile.getchannel('A').point(lambda p:p if p>=8 else 0);tile.putalpha(a)
            box=a.getbbox()
            if not box or np.count_nonzero(np.array(a)>60)<36:
                raise ValueError(f'Empty drawing {hero}/{state}/{col}')
            tiles.append(tile);bounds.append(box)
        largest=max(max(b[2]-b[0],b[3]-b[1]) for b in bounds)
        scale=114/largest
        hashes=[];visible_counts=[]
        # Keep the relative size of the onset, impact and decay drawings. Their
        # common attachment is the near edge (directional) or the floor centre.
        forward = state.startswith('attack') or (hero in ('ryuchi','katana') and state!='signature') or (hero=='katana' and state=='signature')
        if hero=='katana' and state=='advanced':forward=False
        for col,(tile,b) in enumerate(zip(tiles,bounds)):
            piece=tile.crop(b).resize((max(1,round((b[2]-b[0])*scale)),max(1,round((b[3]-b[1])*scale))),Image.Resampling.LANCZOS)
            piece.putalpha(piece.getchannel('A').point(lambda p:p if p>4 else 0))
            dest=Image.new('RGBA',(CELL,CELL))
            x=7 if forward else (CELL-piece.width)//2
            dest.paste(piece,(x,(CELL-piece.height)//2))
            a=np.array(dest.getchannel('A'))
            if any((a[0].any(),a[-1].any(),a[:,0].any(),a[:,-1].any())):raise ValueError('Cell clipped')
            hashes.append(hashlib.sha256(dest.tobytes()).hexdigest());visible_counts.append(int((a>64).sum()))
            atlas.paste(dest,(CELL*col,CELL*row))
        if len(set(hashes))!=6:raise ValueError('Repeated pose '+hero+'/'+state)
        rows.append({'state':state,'pivot':[7 if forward else 64,64],'frameHashes':hashes,'visiblePixels':visible_counts})
    output=HERE/'atlas'/f'{hero}.png';atlas.save(output,optimize=True)
    if preview:
        preview.mkdir(parents=True,exist_ok=True)
        background=Image.new('RGB',atlas.size,'#302a31');background.paste(atlas,(0,0),atlas)
        background.thumbnail((552,552));background.save(preview/f'{hero}.png')
    return {'hero':hero,'sourceSha256':hashlib.sha256(src.read_bytes()).hexdigest(),'atlasSha256':hashlib.sha256(output.read_bytes()).hexdigest(),'rows':rows}


def pack_bass():
    """Use one scale across the eight drawings so the impulse can grow and decay."""
    source=Image.open(HERE/'bass'/'onda-original.png').convert('RGBA')
    opaque=np.asarray(source.getchannel('A'))>=48
    xs=boundaries(opaque.sum(axis=0),4)
    ys=boundaries(opaque.sum(axis=1),2)
    frames=[]
    for y0,y1 in zip(ys,ys[1:]):
        for x0,x1 in zip(xs,xs[1:]):
            tile=source.crop((x0,y0,x1,y1))
            alpha=tile.getchannel('A').point(lambda value: value if value>=16 else 0)
            tile.putalpha(alpha)
            bounds=alpha.getbbox()
            if not bounds:
                raise ValueError('Missing bass pulse frame '+str(len(frames)))
            frames.append(tile.crop(bounds))
    scale=min(122/max(f.width for f in frames),42/max(f.height for f in frames))
    strip=Image.new('RGBA',(1024,48))
    for i,frame in enumerate(frames):
        w=max(1,round(frame.width*scale))
        h=max(1,round(frame.height*scale))
        sprite=frame.resize((w,h),Image.Resampling.LANCZOS)
        strip.paste(sprite,(i*128+(128-w)//2,(48-h)//2))
    strip.save(HERE/'atlas'/'onda-do-baixo.png',optimize=True)

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('heroes',nargs='*');p.add_argument('--preview',type=Path);args=p.parse_args()
    records=[pack(hero,args.preview) for hero in args.heroes or HEROES]
    if not args.heroes:pack_bass()
    if not args.heroes:(HERE/'manifest.json').write_text(json.dumps({'cell':128,'frames':6,'rows':6,'sheets':records},indent=2)+'\n')
    print(sum(len(row['frameHashes']) for sheet in records for row in sheet['rows']),'transparent frames registered')
