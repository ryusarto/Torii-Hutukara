"""Global run-length connected components. Never cut a source by nominal cells."""
import numpy as np
from PIL import Image

def components(raw,threshold=8):
 a=np.asarray(raw.getchannel('A'));mask=a>threshold;parent=[];runs=[];previous=[]
 def find(i):
  while parent[i]!=i:parent[i]=parent[parent[i]];i=parent[i]
  return i
 def union(a,b):
  a=find(a);b=find(b)
  if a!=b:parent[b]=a
 for y,line in enumerate(mask):
  edges=np.flatnonzero(np.diff(np.r_[False,line,False]));current=[];j=0
  for x0,x1 in zip(edges[::2],edges[1::2]):
   n=len(parent);parent.append(n);runs.append((y,int(x0),int(x1)));current.append((int(x0),int(x1),n))
   while j<len(previous)and previous[j][1]<x0:j+=1
   k=j
   while k<len(previous)and previous[k][0]<=x1:union(n,previous[k][2]);k+=1
  previous=current
 groups={}
 for i,(y,x0,x1)in enumerate(runs):
  r=find(i);g=groups.setdefault(r,{'box':[x0,y,x1,y+1],'area':0,'runs':[]});b=g['box'];b[0]=min(b[0],x0);b[1]=min(b[1],y);b[2]=max(b[2],x1);b[3]=max(b[3],y+1);g['area']+=x1-x0;g['runs'].append((y,x0,x1))
 return sorted(groups.values(),key=lambda g:-g['area'])

if __name__=='__main__':
 from pathlib import Path
 import json
 out=[]
 for p in Path('assets/enemies/variants-v2/source').glob('*.png'):
  raw=Image.open(p).convert('RGBA')
  for t in[8,32,64]:
   gs=components(raw,t);big=[g for g in gs if g['area']>4000];print(p.stem,t,'big',len(big),'areas',[g['area']for g in big[:3]],'min',min([g['area']for g in big]or[0]))

def isolate_poses(raw):
 """Own every solid pixel globally before any crop. Preserve nominal motion.

 Alpha>64 identifies physical bodies; lower-alpha antialiasing grows at most
 four source pixels from those cores. This excludes diffuse source haze, while
 keeping the original colors/alpha of all physical body/equipment pixels.
 """
 gs=components(raw,64);anchors=[g for g in gs if g['area']>4000]
 assert len(anchors)==32,('Expected32 complete physical bodies',len(anchors))
 anchors.sort(key=lambda g:(g['box'][1]+g['box'][3])/2)
 ordered=[]
 for row in range(4):ordered.extend(sorted(anchors[row*8:(row+1)*8],key=lambda g:(g['box'][0]+g['box'][2])/2))
 w,h=raw.size;a=np.asarray(raw.getchannel('A'));labels=np.full((h,w),-1,dtype=np.int16);anchor_ids={id(g):i for i,g in enumerate(ordered)}
 for g in gs:
  if id(g)in anchor_ids:owner=anchor_ids[id(g)]
  else:
   x0,y0,x1,y1=g['box'];cx=(x0+x1)/2;cy=(y0+y1)/2
   def score(b):
    bx0,by0,bx1,by1=b['box'];dx=max(bx0-cx,0,cx-bx1);dy=max(by0-cy,0,cy-by1)
    return dx*dx+dy*dy+1e-4*((cx-(bx0+bx1)/2)**2+(cy-(by0+by1)/2)**2)
   owner=min(range(32),key=lambda i:score(ordered[i]))
  for y,x0,x1 in g['runs']:labels[y,x0:x1]=owner
 solid_count=int((a>64).sum());assert int(((a>64)&(labels>=0)).sum())==solid_count
 for _ in range(4):
  grown=labels.copy()
  for dy in[-1,0,1]:
   for dx in[-1,0,1]:
    if dx==dy==0:continue
    shifted=np.roll(labels,(dy,dx),(0,1))
    if dy>0:shifted[:dy,:]=-1
    if dy<0:shifted[dy:,:]=-1
    if dx>0:shifted[:,:dx]=-1
    if dx<0:shifted[:,dx:]=-1
    take=(grown<0)&(a>8)&(shifted>=0);grown[take]=shifted[take]
  labels=grown
 boxes=[];overshoot=0
 for i in range(32):
  yy,xx=np.where(labels==i);box=[int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1)];boxes.append(box);row,col=divmod(i,8);x0=round(col*w/8);y0=round(row*h/4);x1=round((col+1)*w/8);y1=round((row+1)*h/4);overshoot=max(overshoot,x0-box[0],y0-box[1],box[2]-x1,box[3]-y1)
 pad=int(max(8,overshoot+8));tw=int(np.ceil(w/8))+pad*2;th=int(np.ceil(h/4))+pad*2;pixels=np.asarray(raw);tiles=[];report=[]
 for i,(anchor,box)in enumerate(zip(ordered,boxes)):
  row,col=divmod(i,8);ox=round(col*w/8);oy=round(row*h/4);x0,y0,x1,y1=box
  assert anchor['box'][0]>0 and anchor['box'][1]>0 and anchor['box'][2]<w and anchor['box'][3]<h,('Physical body touches source canvas; regenerate',i,anchor['box'])
  owned=pixels[y0:y1,x0:x1].copy();mask=labels[y0:y1,x0:x1]==i;owned[:,:,3]=np.where(mask,owned[:,:,3],0)
  tile=Image.new('RGBA',(tw,th));tile.alpha_composite(Image.fromarray(owned),(x0-ox+pad,y0-oy+pad));tiles.append(tile)
  count=int(((a>64)&(labels==i)).sum());assert count>=anchor['area'];assert all(np.all(labels[y,x0:x1]==i)for y,x0,x1 in anchor['runs'])
  report.append({'pose':i,'stateRow':row,'column':col,'sourceGlobalBounds':box,'solidBodyBounds':anchor['box'],'solidBodyPixels':anchor['area'],'ownedSolidPixels':count,'fullPrimaryBodyRetained':True,'foreignPrimaryBodyPixels':0,'nominalOrigin':[ox,oy],'paddedCanvas':[tw,th],'pad':pad,'crossedOldCell':box[0]<ox or box[1]<oy or box[2]>round((col+1)*w/8)or box[3]>round((row+1)*h/4)})
 assert sum(r['ownedSolidPixels']for r in report)==solid_count
 return tiles,{'method':'Global alpha>64 components + bounded antialias ownership; no nominal-cell crop; no solid pixel removed or duplicated','sourceSize':[w,h],'sourceSolidPixels':solid_count,'assignedSolidPixels':solid_count,'poses':report}
