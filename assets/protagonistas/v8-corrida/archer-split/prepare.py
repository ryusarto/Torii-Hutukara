"""Trace the archer's pelvis and boot layers; leave the bow, hand and skull on the upper body."""
from pathlib import Path
from collections import deque
import base64,json
from PIL import Image
import numpy as np
HERE=Path(__file__).resolve().parent
ASSETS=HERE.parents[2]
ORIGINAL=ASSETS/'variantes/ninja-arqueiro-v1/atlas'
CONTACT=ASSETS/'hero-body/v1/atlas/alt_unmasked.png'
RUN=HERE.parent/'atlas/alt_run.png'
CELL=256
GRID=128

def trace(cell, running):
    a=np.asarray(cell.resize((GRID,GRID),Image.Resampling.NEAREST)).astype(int)
    y,x=np.mgrid[:GRID,:GRID]
    red,green,blue,alpha=a.transpose(2,0,1)
    solid=alpha>60
    yy,xx=np.where(solid)
    top,bottom=int(yy.min()),int(yy.max())
    # Locate the pelvis in the canonical cell. Frame registration varies slightly,
    # especially between profile and back views. Feet in flight sit above the pivot.
    waist=round(bottom-(bottom-top)*(.28 if running else .215))
    # Trouser fabric and boot soles are cool violet. The ochre bow, bare hand,
    # leather quiver and ivory charm have warmer pigment, even below the belt.
    violet=(blue>green*1.12)&(red<blue*1.49)&(blue>16)
    sole=(blue>=red*.94)&(blue>=green)&(blue>48)
    fabric=(violet|sole)&solid
    near=fabric&(y>waist+1)&(y<waist+7)
    hip=int(np.median(x[near])) if near.any() else int(np.median(xx))
    # Start on the trousers inside the waist; allow both legs to spread during flight.
    spread=12+np.clip(y-waist,0,25)*1.35
    cone=np.abs(x-hip)<=spread
    threshold=waist+np.minimum(3,np.abs(x-hip)//8)
    warm=(red>blue*1.6)&(green>blue*1.1)&(red>100)&(y<bottom-6)&(np.abs(x-hip)>7)
    # Feet on the ground and toes in the air are part of the motion even when
    # the light makes the leather brown. Associate the entire connected sole.
    boot=(y>=bottom-9)&solid
    cone|=boot
    above=(y<threshold)&solid
    upper=above|((y>=threshold)&solid&(~cone|warm))
    lower=(y>=threshold)&(fabric|boot)&cone&~warm
    # Grow both masks through shadow outlines. Empty pixels block propagation, so
    # a hanging crystal/skull or a low edge of the bow travels with the torso.
    labels=np.zeros((GRID,GRID),dtype='int8')
    labels[upper]=1;labels[lower]=2
    pending=deque()
    for dy,dx in [(-1,0),(1,0),(0,-1),(0,1)]:
        candidates=(labels!=0)&np.roll((labels==0)&solid,(dy,dx),axis=(0,1))
        pending.extend(zip(*np.where(candidates)))
    while pending:
        py,px=pending.popleft()
        for dy,dx in [(-1,0),(1,0),(0,-1),(0,1)]:
            ny,nx=py+dy,px+dx
            if 0<=ny<GRID and 0<=nx<GRID and labels[ny,nx]==0 and solid[ny,nx]:
                labels[ny,nx]=labels[py,px];pending.append((ny,nx))
    mask=labels==2
    for py in range(waist+2,GRID):
        edge=np.where(np.diff(np.r_[False,solid[py],False]))[0]
        for left,right in zip(edge[::2],edge[1::2]):
            span=mask[py,left:right]
            if span.mean()>.35 and (py>bottom-10 or not warm[py,left:right].any()):
                span[:]=True
    # Extend legs a few pixels under the overlaid belt so angled knees remain joined.
    if running:
        for k in range(1,3):
            mask|=solid&np.roll(mask,-1,axis=0)&(y>=waist-2)&cone
    # Include the semitransparent edge of each boot when framing the masked blit.
    outside=~solid
    for dy,dx in [(-1,0),(1,0),(0,-1),(0,1)]:
        mask|=outside&np.roll(labels==2,(dy,dx),axis=(0,1))
    runs=bytearray()
    for py in range(GRID):
        marks=np.where(np.diff(np.r_[False,mask[py],False]))[0]
        for start,end in zip(marks[::2],marks[1::2]):
            runs.extend((py,int(start),int(end-start)))
    return {'join':[2*hip,2*waist],'spans':base64.b64encode(runs).decode('ascii')}

def pack(path, playable, running=False):
    with Image.open(path) as im:
        im=im.convert('RGBA')
        return [[trace(im.crop((c*CELL,r*CELL,(c+1)*CELL,(r+1)*CELL)),running)
                for c in range(playable)] for r in range(4)]

if __name__=='__main__':
    sheets={s:pack(ORIGINAL/f'alt_{s}.png',8) for s in ['attack_1','attack_2','attack_3','skill','advanced','signature','walk']}
    sheets['run']=pack(RUN,16,True)
    if not CONTACT.exists():raise FileNotFoundError(CONTACT)
    sheets['contact']=pack(CONTACT,6)
    (HERE/'manifest.json').write_text(json.dumps({'pixelStep':2,'sheets':sheets},separators=(',',':'))+'\n')
