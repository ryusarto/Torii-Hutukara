#!/usr/bin/env python3
"""Register original ImageGen body contacts at the ground pivot of the adjacent two poses."""
from pathlib import Path
import argparse, hashlib, json
import numpy as np
from PIL import Image

FOLDER = Path(__file__).resolve().parent
ROOT = FOLDER.parents[2]
STATES = ('attack_1', 'attack_2', 'attack_3', 'skill', 'advanced', 'signature')
DIRECTIONS = ('down', 'left', 'up', 'right')
SHEETS = [f'{hero}_{variant}' for hero in ('franco','ryuchi','alt','katana','synth','percussion')
          for variant in (('unmasked',) if hero in ('alt','katana') else ('unmasked','masked'))]
CELL = 256

def hashfile(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def canonical(hero, variant, state, direction):
    row = direction
    if hero in ('franco','ryuchi'):
        path = ROOT/f'assets/protagonistas/v5/atlas/{hero}_{state}.png'
        if variant == 'masked':
            row += 4
    elif hero in ('alt','katana'):
        path = ROOT/f'assets/variantes/ninja-arqueiro-v1/atlas/{hero}_{state}.png'
    else:
        name = {'synth':'franco_sintetizador','percussion':'ryuchi_percussionista'}[hero]
        path = ROOT/f'assets/variantes/percussao-sintetizador-v1/atlas/{name}_{variant}_{state}.png'
    with Image.open(path) as atlas:
        return [atlas.crop((i*CELL,row*CELL,(i+1)*CELL,(row+1)*CELL)).convert('RGBA') for i in (3,4)]

def grid_edges(mask, axis, cells):
    profile = mask.sum(axis=axis)
    size = len(profile)
    nominal = size/cells
    edges = [0]
    for i in range(1,cells):
        center = round(nominal*i)
        options = range(round(center-nominal*.22),round(center+nominal*.22)+1)
        edges.append(min(options,key=lambda x:(int(profile[x-1])+int(profile[x]),abs(x-center))))
    return edges+[size]

def metrics(image):
    pixels = np.array(image.getchannel('A'))
    y,x = np.where(pixels>96)
    if len(y)<500:
        raise ValueError('Missing body')
    top,bottom = int(y.min()),int(y.max()+1)
    feet = x[y>=bottom-max(4,(bottom-top)//9)]
    return float(np.mean(feet)), bottom, float(np.quantile(y,.977)-np.quantile(y,.023))

def pack(sheet, preview):
    hero,variant = sheet.split('_')
    source = FOLDER/'source'/f'{sheet}.png'
    image = Image.open(source).convert('RGBA')
    alpha = np.asarray(image.getchannel('A'))
    xs,ys = grid_edges(alpha>95,0,6),grid_edges(alpha>95,1,4)
    result = Image.new('RGBA',(6*CELL,4*CELL))
    evidence = []
    comparisons = [Image.new('RGB',(6*92,4*92),'#392e35') for _ in range(3)]
    for r,direction in enumerate(DIRECTIONS):
        for c,state in enumerate(STATES):
            body = image.crop((xs[c],ys[r],xs[c+1],ys[r+1]))
            refs = canonical(hero,variant,state,r)
            foot_x,foot_y,height = metrics(body)
            m = [metrics(ref) for ref in refs]
            target_x,target_y,ref_height = np.mean(m,axis=0)
            # Export transparent edge speckle separately from the high-alpha registration mask.
            a = body.getchannel('A').point(lambda v: v if v>=9 else 0)
            body.putalpha(a)
            box = a.getbbox()
            if not box:
                raise ValueError(f'Empty {sheet} {state} {direction}')
            # Use the canonical body height. If a long weapon does not fit
            # around the original foot pixel, translate the cell within its
            # gutter and carry that offset to the renderer's destination.
            left,top,right,bottom=box
            scale=min(ref_height/height,248/max(1,right-left),248/max(1,bottom-top))
            scaled=body.resize((round(body.width*scale),round(body.height*scale)),Image.Resampling.LANCZOS)
            l,t,r_,b_=scaled.getchannel('A').point(lambda v:v if v>=7 else 0).getbbox()
            raw_x,raw_y=round(target_x-scale*foot_x),round(target_y-scale*foot_y)
            x=int(np.clip(raw_x,3-l,253-r_))
            y=int(np.clip(raw_y,3-t,253-b_))
            tile=Image.new('RGBA',(CELL,CELL))
            tile.paste(scaled,(x,y))
            tile.putalpha(tile.getchannel('A').point(lambda v:v if v>6 else 0))
            box=tile.getchannel('A').getbbox()
            if not box or min(box[0],box[1],CELL-box[2],CELL-box[3])<1:
                raise ValueError(f'Clipped contact {sheet} {state} {direction}: {box}')
            actual_x,actual_y,actual_height=metrics(tile)
            # Values are in atlas pixels. The normal 88/256 display scale
            # applies these offsets at the same resolution as the source.
            offset=[raw_x-x,raw_y-y]
            if abs(actual_x+offset[0]-target_x)>12 or abs(actual_y+offset[1]-target_y)>3:
                raise ValueError(f'Unexpected planted foot {sheet} {state} {direction}')
            if np.mean(np.asarray(tile.getchannel('A'))>64)>.76:
                raise ValueError(f'Full background {sheet} {state} {direction}')
            result.paste(tile,(c*CELL,r*CELL))
            evidence.append({'state':state,'direction':direction,'targetFoot':[round(target_x,1),round(target_y,1)],
                'foot':[round(actual_x,1),actual_y],'offset':offset,'relativeHeight':round(actual_height/ref_height,3),
                'sha256':hashlib.sha256(tile.tobytes()).hexdigest()})
            for out,pose in zip(comparisons,(refs[0],tile,refs[1])):
                pose=pose.resize((88,88),Image.Resampling.NEAREST)
                ox,oy=offset if out is comparisons[1] else (0,0)
                out.paste(pose,(c*92+2+round(ox*88/256),r*92+2+round(oy*88/256)),pose)
    if len(set(e['sha256'] for e in evidence))!=24:
        raise ValueError('Duplicate generated body poses in '+sheet)
    dest=FOLDER/'atlas'/f'{sheet}.png'
    result.save(dest,optimize=True)
    if preview:
        preview.mkdir(parents=True,exist_ok=True)
        comparisons[0].save(preview/f'{sheet}.gif',save_all=True,append_images=comparisons[1:],
                             duration=[250,250,250],loop=0,disposal=2)
        comparisons[1].save(preview/f'{sheet}.png')
    return {'sheet':sheet,'sourceSha256':hashfile(source),'atlasSha256':hashfile(dest),'cells':evidence}

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('sheets',nargs='*')
    parser.add_argument('--preview',type=Path)
    args = parser.parse_args()
    records=[pack(sheet,args.preview) for sheet in args.sheets or SHEETS]
    if not args.sheets:
        offsets={f"{r['sheet']}/{c['state']}/{c['direction']}":c['offset'] for r in records for c in r['cells'] if c['offset']!=[0,0]}
        (FOLDER/'placement.json').write_text(json.dumps(offsets,indent=2)+'\n')
        (FOLDER/'manifest.json').write_text(json.dumps({'cell':256,'pivot':[128,224],
            'states':STATES,'directions':DIRECTIONS,'sheets':records},ensure_ascii=False,indent=2)+'\n')
    for record in records:
        h=[e['relativeHeight'] for e in record['cells']]
        print(record['sheet'],len(h),'new drawings; height ratios',min(h),max(h))
