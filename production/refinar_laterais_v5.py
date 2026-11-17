"""Repack supplementary AI-authored sequences; preserve all original pixels."""
from pathlib import Path
from PIL import Image
import json,hashlib,argparse
ROOT=Path(__file__).resolve().parents[1];parser=argparse.ArgumentParser();parser.add_argument('--base',default='sprites-principais-v5' if (ROOT/'sprites-principais-v5').exists() else 'design/sprites-principais-v5');args=parser.parse_args();BASE=(ROOT/args.base).resolve()
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
 return im.crop((max(0,min(i%w for i in best)-1),max(0,min(i//w for i in best)-1),min(w,max(i%w for i in best)+2),min(h,max(i//w for i in best)+2)))
def row(im,index,edges):return [isolate(im.crop((round(c*im.width/8),edges[index],round((c+1)*im.width/8),edges[index+1]))) for c in range(8)]
def new_rows(filename,n):
 im=Image.open(BASE/'originais'/filename).convert('RGBA');result=[]
 for r in range(n):
  poses=row(im,r,[round(i*im.height/n) for i in range(n+1)]);scale=160/poses[0].height
  result.append([p.resize((round(p.width*scale),round(p.height*scale)),Image.Resampling.NEAREST) for p in poses])
 return result
config=BASE/'COMPOSICAO_LATERAIS_V5.json'
if config.exists():edges=json.loads(config.read_text())
else:
 m=json.loads((BASE/'pacote/manifest.json').read_text());edges={s:m['sourceChecks']['franco/'+s]['rowEdges'] for s in ['skill','advanced','hurt']};config.write_text(json.dumps(edges,indent=2))
corrections=json.loads((BASE/'CORRECOES_V5.json').read_text());sources={(s['hero'],s['state']):s for s in json.loads((BASE/'fontes.json').read_text())}
def save(hero,state,rows,additional,changed):
 im=Image.new('RGBA',(2048,2048))
 for r,poses in enumerate(rows):
  for c,p in enumerate(poses):
   assert p.width<252 and p.height<248,(hero,state,r,c,p.size)
   im.alpha_composite(p,(c*256+128-p.width//2,r*256+248-p.height))
 rel=f'originais/{hero}_{state}_refinado.png';im.save(BASE/rel)
 entry=dict(hero=hero,state=state,file=rel,sha256=hashlib.sha256((BASE/rel).read_bytes()).hexdigest(),sourceRowEdges=list(range(0,2049,256)),assembly={'type':'repacking supplementary AI-authored poses; no painted pixels','base':hero+'_'+state+'.png','additional':additional,'replacedRows':changed,'noMirroring':True})
 corrections[:]=[s for s in corrections if (s['hero'],s['state'])!=(hero,state)];corrections.append(entry);print('Refinado:',hero,state,flush=True)
extra=new_rows('franco_laterais_chibi_adicional.png',3)
for i,state in enumerate(['skill','advanced','hurt']):
 im=Image.open(BASE/'originais'/('franco_'+state+'.png')).convert('RGBA');rows=[row(im,r,edges[state]) for r in range(7)];save('franco',state,rows+[extra[i]],'franco_laterais_chibi_adicional.png',[7])
im=Image.open(BASE/'../sprites-principais-v4/originais/ryuchi_roll.png').convert('RGBA');old=[0,182,352,526,695,861,1011,1147,1254];rows=[row(im,r,old) for r in range(4)]
save('ryuchi','roll',rows+new_rows('ryuchi_roll_masked_adicional.png',4),'ryuchi_roll_masked_adicional.png',[4,5,6,7])
(BASE/'CORRECOES_V5.json').write_text(json.dumps(corrections,ensure_ascii=False,indent=2))

