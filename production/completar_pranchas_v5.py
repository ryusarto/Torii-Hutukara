"""Mechanically arrange AI-authored poses; no new pixels painted or poses fabricated."""
from pathlib import Path
import json,hashlib,shutil
from PIL import Image
import argparse
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--base',default='sprites-principais-v5' if (ROOT/'sprites-principais-v5').exists() else 'design/sprites-principais-v5');parser.add_argument('--generated-dir');args=parser.parse_args()
BASE=(ROOT/args.base).resolve();GEN=Path(args.generated_dir) if args.generated_dir else None
extras={'franco_attack_3_adicional':'exec-5b63541c-29ce-4bf6-ad51-5c060db88c1e.png','ryuchi_advanced_adicional':'exec-d0a4b90f-40a4-4b3e-a43c-db02a4ebfe53.png','franco_defeat_adicional':'exec-448c31f5-5f32-4c18-9d65-9b87e4fd09e6.png','ryuchi_defeat_adicional':'exec-31c15a63-14e9-4e90-a40f-6c5145d03183.png'}
for name,filename in extras.items():
 target=BASE/'originais'/f'{name}.png'
 if not target.exists():
  assert GEN, 'Fornecer --generated-dir ou preservar '+str(target)
  shutil.copy2(GEN/filename,target)
def isolate(im):
 a=im.getchannel('A');pix=a.tobytes();w,h=im.size;seen=bytearray(w*h);best=[]
 for seed,v in enumerate(pix):
  if v<128 or seen[seed]:continue
  seen[seed]=1;q=[seed]
  for i in q:
   x,y=i%w,i//w
   for dx,dy in [(-1,-1),(0,-1),(1,-1),(-1,0),(1,0),(-1,1),(0,1),(1,1)]:
    nx,ny=x+dx,y+dy
    if 0<=nx<w and 0<=ny<h:
     j=ny*w+nx
     if not seen[j] and pix[j]>=128:seen[j]=1;q.append(j)
  if len(q)>len(best):best=q
 assert best
 bb=(max(0,min(i%w for i in best)-1),max(0,min(i//w for i in best)-1),min(w,max(i%w for i in best)+2),min(h,max(i//w for i in best)+2))
 return im.crop(bb)
def rows(name,edges):
 im=Image.open(BASE/'originais'/f'{name}.png').convert('RGBA')
 return [[isolate(im.crop((round(c*im.width/8),edges[r],round((c+1)*im.width/8),edges[r+1]))) for c in range(8)] for r in range(7)]
def supplemental(name,cols,rows,sequence,target_height):
 im=Image.open(BASE/'originais'/f'{name}_adicional.png').convert('RGBA');poses=[]
 for i in range(sequence*8,(sequence+1)*8):
  r,c=divmod(i,cols);poses.append(isolate(im.crop((round(c*im.width/cols),round(r*im.height/rows),round((c+1)*im.width/cols),round((r+1)*im.height/rows)))))
 scale=target_height/poses[0].height
 return [p.resize((round(p.width*scale),round(p.height*scale)),Image.Resampling.NEAREST) for p in poses]
corrections=[]
def save(hero,state,poses,details):
 im=Image.new('RGBA',(2048,2048))
 for r,row in enumerate(poses):
  assert len(row)==8
  for c,p in enumerate(row):
   assert p.width<252 and p.height<248,(hero,state,r,c,p.size)
   im.alpha_composite(p,(c*256+128-p.width//2,r*256+248-p.height))
 rel=f'originais/{hero}_{state}_completo.png';im.save(BASE/rel)
 corrections.append(dict(hero=hero,state=state,file=rel,sha256=hashlib.sha256((BASE/rel).read_bytes()).hexdigest(),sourceRowEdges=list(range(0,2049,256)),assembly=details))
 print('Prancha completa:',hero,state,flush=True)
a=rows('franco_attack_3',[0,175,337,502,672,840,1003,1170]);extra=Image.open(BASE/'originais/franco_attack_3_adicional.png').convert('RGBA')
a.append([isolate(extra.crop((round(c*1254/8),1003,round((c+1)*1254/8),1170))) for c in range(8)])
save('franco','attack_3',a,{'type':'repacking AI-authored rows','base':'franco_attack_3.png','additional':'franco_attack_3_adicional.png','additionalRow':7,'noMirroring':True})
a=rows('ryuchi_advanced',[0,183,351,521,698,869,1051,1254])
right=supplemental('ryuchi_advanced',4,4,0,a[0][0].height);rear=supplemental('ryuchi_advanced',4,4,1,a[3][0].height)
save('ryuchi','advanced',a[:3]+[right,a[3],a[4],rear,a[6]],{'type':'repacking AI-authored rows','base':'ryuchi_advanced.png','additional':'ryuchi_advanced_adicional.png','replacedDirections':['unmasked/right','masked/up'],'noMirroring':True})
for hero,edges in [('franco',[0,185,362,539,719,895,1064,1254]),('ryuchi',[0,189,370,548,730,910,1075,1254])]:
 a=rows(hero+'_defeat',edges);rear=supplemental(hero+'_defeat',4,2,0,a[4][0].height)
 save(hero,'defeat',a[:6]+[rear,a[6]],{'type':'repacking AI-authored rows','base':hero+'_defeat.png','additional':hero+'_defeat_adicional.png','insertedDirection':'masked/up','noMirroring':True})
corrections.append({'hero':'ryuchi','state':'roll','sourceRowEdges':[0,182,352,526,695,861,1011,1147,1254],'assembly':{'type':'source row boundaries reviewed visually','originalPreserved':True}})
(BASE/'CORRECOES_V5.json').write_text(json.dumps(corrections,ensure_ascii=False,indent=2))

