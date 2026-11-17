"""Pack authored environment PNGs. No procedural replacement drawings.
Source originals/prompts remain in the Dropbox asset backup; this script crops,
normalizes, preserves alpha and exports the published atlas contract.
"""
import argparse,hashlib,json,os,shutil,zipfile
from pathlib import Path
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('backup',type=Path);args=parser.parse_args()
base=args.backup.resolve();out=base/'pacote';official=root/'assets/cenarios/v2';out.mkdir(parents=True,exist_ok=True);official.mkdir(parents=True,exist_ok=True)
plan=json.loads((root/'design/cenarios-v2/REVISAO_ARTE.json').read_text());records=json.loads((base/'fontes.json').read_text());by_id={s['id']:s for s in records}
assert set(by_id)=={s['id'] for s in plan['sheets']},'Missing source sheets'
manifest={'version':2,'tile':24,'filter':'nearest-neighbor','sheets':{},'items':{},'sources':[]}
checks=[];all_previews=[]

def save(im,p):
 p.parent.mkdir(parents=True,exist_ok=True);temp=p.with_suffix('.png.exportando');im.save(temp,format='PNG',optimize=True);os.replace(temp,p)

def isolate(cell):
 # Keep all substantial authored components: open gates have separate supports.
 cell=cell.convert('RGBA');cell.putalpha(cell.getchannel('A').point(lambda n:0 if n<128 else n))
 a=cell.getchannel('A');pixels=a.tobytes();w,h=cell.size;seen=bytearray(w*h);parts=[]
 for seed,n in enumerate(pixels):
  if n<128 or seen[seed]:continue
  seen[seed]=1;queue=[seed]
  for i in queue:
   x,y=i%w,i//w
   for dx,dy in [(-1,0),(1,0),(0,-1),(0,1)]:
    nx,ny=x+dx,y+dy
    if 0<=nx<w and 0<=ny<h:
     j=ny*w+nx
     if not seen[j] and pixels[j]>=128:seen[j]=1;queue.append(j)
  parts.append(queue)
 assert parts,'Empty source cell'
 largest=max(map(len,parts));kept=[i for part in parts if len(part)>=max(20,largest*.10) for i in part]
 box=(min(i%w for i in kept),min(i//w for i in kept),max(i%w for i in kept)+1,max(i//w for i in kept)+1)
 return cell.crop(box),box

for sheet in plan['sheets']:
 source=by_id[sheet['id']];path=base/source['file'];raw=path.read_bytes();assert hashlib.sha256(raw).hexdigest()==source['sha256']
 image=Image.open(path).convert('RGBA');cols,rows=sheet['grid'];assert len(sheet['items'])==cols*rows
 tile=sheet['id'] in ['A01','A02','A03','A04'];size=104 if tile else 384 if sheet['id']=='A05' else 256
 atlas=Image.new('RGBA',(cols*size,rows*size));file='atlas/'+sheet['file'];manifest['sheets'][sheet['id']]={'file':file,'grid':[cols,rows],'cell':size,'kind':sheet['kind']}
 for i,item in enumerate(sheet['items']):
  row,col=divmod(i,cols);rect=[round(col*image.width/cols),round(row*image.height/rows),round((col+1)*image.width/cols),round((row+1)*image.height/rows)]
  pose,box=isolate(image.crop(rect));frame=Image.new('RGBA',(size,size))
  if tile:
   # Material borders are presentation frames, not terrain seams.
   if sheet['id'] in ['A01','A02']:
    dx,dy=max(3,round(pose.width*.045)),max(3,round(pose.height*.045));pose=pose.crop((dx,dy,pose.width-dx,pose.height-dy))
   if sheet['id']=='A04' and i<4:
    dx,dy=round(pose.width*.18),round(pose.height*.18);pose=pose.crop((dx,dy,pose.width-dx,pose.height-dy))
   pose=pose.resize((96,96),Image.Resampling.NEAREST)
   if sheet['id'] in ['A01','A02'] or sheet['id']=='A04' and i<4:pose.putalpha(255)
   frame.alpha_composite(pose,(4,4));content=[4,4,96,96];pivot=[52,100]
  else:
   scale=min((size-24)/pose.width,(size-24)/pose.height);pose=pose.resize((max(1,round(pose.width*scale)),max(1,round(pose.height*scale))),Image.Resampling.NEAREST)
   pivot=[size//2,size-16];left=pivot[0]-pose.width//2;top=pivot[1]-pose.height;frame.alpha_composite(pose,(left,top));content=[left,top,pose.width,pose.height]
  save(frame,out/'sprites'/f'{item}.png');atlas.alpha_composite(frame,(col*size,row*size))
  manifest['items'][item]={'sheet':sheet['id'],'file':file,'cell':[col*size,row*size,size,size],'content':[col*size+content[0],row*size+content[1],content[2],content[3]],'pivot':pivot,'sourceCell':rect,'sourceContent':box}
  assert frame.getbbox() and frame.getchannel('A').histogram()[0]>0,item
  checks.append({'id':item,'size':[size,size],'alpha':True,'nonempty':True,'sourceSha256':source['sha256']});all_previews.append((item,frame))
 save(atlas,out/file);save(atlas,official/file)
 manifest['sources'].append({'id':sheet['id'],'file':source['file'],'sha256':source['sha256'],'sourceSize':list(image.size),'prompt':source['prompt']})

assert len(manifest['items'])==126
text=json.dumps(manifest,ensure_ascii=False,indent=2)+'\n';(out/'manifest.json').write_text(text);(official/'manifest.json').write_text(text)
report={'sheets':12,'cells':126,'pngAlpha':True,'uniformPropScale':True,'sourceIntegrity':True,'checks':checks}
for folder in [out,official]:(folder/'VALIDACAO.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
contact=Image.new('RGB',(1400,((len(all_previews)+6)//7)*150),(27,24,37));draw=ImageDraw.Draw(contact)
for i,(name,frame) in enumerate(all_previews):
 row,col=divmod(i,7);thumb=frame.resize((128,128),Image.Resampling.NEAREST);contact.paste(thumb,(col*200+35,row*150),thumb);draw.text((col*200+3,row*150+130),name[:26],fill='white')
save(contact,out/'CONTATO.png');save(contact,official/'CONTATO.png')
html='''<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Torii · Cenários V2</title><style>*{box-sizing:border-box}body{background:#171522;color:#ffe4c4;font:16px system-ui;padding:20px;margin:0}select,button{font:inherit;padding:8px;margin:6px}canvas{max-width:100%;image-rendering:pixelated;background:repeating-conic-gradient(#252330 0 25%,#393543 0 50%) 0/24px 24px}p{max-width:850px}</style><h1>Cenários V2 · 126 recortes</h1><p>PNG com alpha · materiais e peças separados · tile24 · biblioteca de produção.</p><select id="item"></select><button id="repeat">Repetir 3 × 3</button><canvas id="preview" width="576" height="576"></canvas><p id="info"></p><script>const M=MANIFEST,s=document.querySelector('#item'),c=document.querySelector('canvas'),q=c.getContext('2d');let tiled=false;for(const name of Object.keys(M.items))s.add(new Option(name,name));function draw(){const a=M.items[s.value],image=new Image();image.onload=()=>{q.clearRect(0,0,576,576);q.imageSmoothingEnabled=false;const r=a.content;if(tiled){const k=Math.min(180/r[2],180/r[3]);for(let y=0;y<3;y++)for(let x=0;x<3;x++)q.drawImage(image,...r,x*192+(192-r[2]*k)/2,y*192+(192-r[3]*k)/2,r[2]*k,r[3]*k)}else{const k=Math.min(500/r[2],500/r[3]);q.drawImage(image,...r,288-r[2]*k/2,288-r[3]*k/2,r[2]*k,r[3]*k)}info.textContent=s.value+' · '+a.sheet+' · '+r[2]+'×'+r[3]};image.src=a.file}s.onchange=draw;repeat.onclick=()=>{tiled=!tiled;draw()};draw()</script>'''
for folder in [out,official]:(folder/'PREVIA.html').write_text(html.replace('MANIFEST',json.dumps(manifest,ensure_ascii=False)))
print(json.dumps({'sheets':12,'cells':126,'official':str(official),'backup':str(out)}))
