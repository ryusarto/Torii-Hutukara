"""Register authored running poses against the canonical pivot. Requires Pillow and numpy."""
from pathlib import Path
from collections import defaultdict
import hashlib, json, sys
import numpy as np
from PIL import Image, ImageDraw
from reference import base,groups

DIRECTIONS=('down','left','up','right')
def components(alpha):
    # Label opaque row intervals, rather than blindly slicing across toes on a grid line.
    parent=[]
    def root(i):
        while parent[i]!=i:
            parent[i]=parent[parent[i]];i=parent[i]
        return i
    prev=[];runs=[]
    for y,line in enumerate(alpha>=128):
        changes=np.flatnonzero(np.diff(np.pad(line,(1,1)).astype('int8'))).reshape(-1,2)
        curr=[];j=0
        for aa,bb in changes:
            a,b=int(aa),int(bb);k=len(parent);parent.append(k)
            while j<len(prev) and prev[j][1]<a:j+=1
            z=j
            while z<len(prev) and prev[z][0]<=b:
                parent[root(k)]=root(prev[z][2]);z+=1
            curr.append((a,b,k));runs.append((y,a,b,k))
        prev=curr
    parts=defaultdict(list)
    for y,a,b,k in runs:parts[root(k)].append((y,a,b))
    return sorted(parts.values(),key=lambda r:sum(b-a for _,a,b in r),reverse=True)
def extract(path):
    im=Image.open(path).convert('RGBA');rgba=np.asarray(im);h,w=rgba.shape[:2]
    alpha=rgba[:,:,3]
    # Some transparent-generation sources have a pale residual matte. Use the higher
    # object confidence range there; opaque dark outlines separate the white mask from paper.
    if path.stem in {'synth_masked_generated','percussion_masked_generated','percussion_unmasked_generated'}:
        rgba=rgba.copy()
        rgba[:,:,3]=np.where(alpha>=225,255,0)
    result={};parts=components(rgba[:,:,3]);min_size=w*h*.001
    for lines in parts:
        mass=sum(b-a for _,a,b in lines)
        if mass < min_size:break
        x0=min(a for _,a,b in lines);x1=max(b for _,a,b in lines);y0=lines[0][0];y1=lines[-1][0]+1
        mx=(x0+x1)/2;my=(y0+y1)/2;row=int(my*8/h);col=int(mx*8/w)
        if (row,col) in result:continue
        if y1-y0<h/16:continue
        crop=np.zeros((y1-y0,x1-x0,4),dtype='uint8')
        for y,a,b in lines:crop[y-y0,a-x0:b-x0]=rgba[y,a:b]
        result[row,col]=Image.fromarray(crop)
    if len(result)!=64:raise ValueError(f'{path}: {len(result)} distinct bodies; missing {set((y,x) for y in range(8) for x in range(8))-set(result)}')
    return result
def boxh(im):return im.getchannel('A').point(lambda a:255 if a>32 else 0).getbbox()
def pack(hero,inputs):
    canvas=Image.new('RGBA',(4096,1024*len(inputs)));audit=[]
    for vi,(variant,source,offset) in enumerate(inputs):
        template=Image.open(source).convert('RGBA');items=extract(base/'source'/f'{hero}_{variant}_generated.png')
        for d in range(4):
            ref=template.crop((0,(offset+d)*256,256,(offset+d+1)*256))
            x0,y0,x1,y1=boxh(ref)
            poses=[items[d*2+i//8,i%8] for i in range(16)]
            scale=min((y1-y0)/float(np.median([p.height for p in poses])),242/max(p.width for p in poses),213/max(p.height for p in poses))
            serial=[];widths=[];heights=[]
            for i,p in enumerate(poses):
                p=p.resize((max(1,round(p.width*scale)),max(1,round(p.height*scale))),Image.Resampling.NEAREST)
                # Anchor upper torso horizontally so that stretching a front boot does not drag the head.
                upper=boxh(p.crop((0,0,p.width,max(1,round(p.height*.38)))))
                center=(upper[0]+upper[2])/2
                anchor_x=max(4,min(252-p.width,round(128-center)))
                # Contact -> weight acceptance -> push -> suspension. Each leg repeats this half-cycle.
                lift=[0,0,0,1,3,5,5,2][i%8];anchor_y=224-lift-p.height
                cell=Image.new('RGBA',(256,256));cell.alpha_composite(p,(anchor_x,anchor_y))
                canvas.paste(cell,(256*i,256*(4*vi+d)));serial.append(hashlib.sha256(p.tobytes()).hexdigest())
                lower=p.crop((0,round(p.height*.76),p.width,p.height));bounds=boxh(lower);widths.append(bounds[2]-bounds[0]);heights.append(p.height)
            assert len(set(serial))==16,(hero,variant,d)
            audit.append(dict(direction=DIRECTIONS[d],variant=variant,distinct=16,heightRange=[min(heights),max(heights)],lowerQuarterSpanPx=[min(widths),max(widths)]))
    destination=base/'atlas'/f'{hero}_run.png';canvas.save(destination,optimize=True)
    preview=canvas.resize((1536,canvas.height*96//256),Image.Resampling.NEAREST)
    preview.save(base/f'preview_{hero}.png')
    return audit
if __name__=='__main__':
    entries=defaultdict(list)
    for hero,variant,source,offset in groups():entries[hero].append((variant,source,offset))
    audit={}
    for hero in sys.argv[1:] or entries:
        audit[hero]=pack(hero,entries[hero]);print(hero,flush=True)
