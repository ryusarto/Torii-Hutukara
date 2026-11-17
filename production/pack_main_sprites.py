"""Pack AI-authored poses without painting them; keep all source sheets intact.
Requires Pillow. Input: design/sprites-principais-v4/fontes.json.
"""
import json, hashlib, statistics, shutil, zipfile, argparse
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--base',default='design/sprites-principais-v4');args=parser.parse_args()
BASE=(ROOT/args.base).resolve()
release=BASE.name.rsplit('-',1)[-1].upper()
OUT=BASE/'pacote'
def save_png(im,path):
 temp=path.with_name(path.name+'.exportando')
 im.save(temp,format='PNG');temp.replace(path)

sources=json.loads((BASE/'fontes.json').read_text())
if release=='V5':
 plan=json.loads((BASE/'PLANO_PERSONAGENS.json').read_text())
 missing={(h,s) for h in plan['heroes'] for s in plan['states']}-{(s['hero'],s['state']) for s in sources}
 assert not missing, 'Pacote V5 incompleto: '+str(sorted(missing))
 portrait_sources=json.loads((BASE/'retratos.json').read_text())
 assert {s['hero'] for s in portrait_sources}==set(plan['heroes']), 'Retratos incompletos'
for folder in ['atlas','frames']: (OUT/folder).mkdir(parents=True,exist_ok=True)
directions=['down','left','up','right']
manifest={'version':1,'cell':[256,256],'pivot':[128,224],'source_grid':[8,8],
 'rows':['unmasked/down','unmasked/left','unmasked/up','unmasked/right','masked/down','masked/left','masked/up','masked/right'],
 'animations':[],'validation':{'alpha':True,'closed_cycles':True,'empty_frames':[]}}
if release=='V5':
 manifest.update(release=release,completeCoverage=True,states=plan['states'],sourceChecks={})

def cell(image,row,col):
 w,h=image.size
 if image.info.get('irregular_roll') or image.info.get('v5_layout'):
  cache=image.info.setdefault('isolated_cells',{})
  if (row,col) in cache:return cache[(row,col)].copy()
  edges=image.info.get('row_edges',[0,182,352,526,695,861,1011,1147,1254])
  crop=image.crop((round(col*w/8),edges[row],round((col+1)*w/8),edges[row+1]))
  # Keep the connected pose, excluding disconnected fragments of adjacent rows.
  a=crop.getchannel('A');pixels=a.tobytes();cw,ch=crop.size;seen=bytearray(cw*ch);best=[]
  for seed,value in enumerate(pixels):
   if value<128 or seen[seed]:continue
   seen[seed]=1;queue=[seed]
   for index in queue:
    x,y=index%cw,index//cw
    for dx,dy in [(-1,-1),(0,-1),(1,-1),(-1,0),(1,0),(-1,1),(0,1),(1,1)]:
     nx,ny=x+dx,y+dy
     if 0<=nx<cw and 0<=ny<ch:
      ni=ny*cw+nx
      if not seen[ni] and pixels[ni]>=128:seen[ni]=1;queue.append(ni)
   if len(queue)>len(best):best=queue
  bb=(max(0,min(i%cw for i in best)-2),max(0,min(i//cw for i in best)-2),min(cw,max(i%cw for i in best)+3),min(ch,max(i//cw for i in best)+3))
  cleaned=Image.new('RGBA',crop.size);cleaned.alpha_composite(crop.crop(bb),bb[:2])
  result=cleaned if image.info.get('v5_layout') else cleaned.resize((256,round(crop.height*256/crop.width)),Image.Resampling.NEAREST)
  cache[(row,col)]=result
  return result.copy()
 return image.crop((round(col*w/8),round(row*h/8),round((col+1)*w/8),round((row+1)*h/8))).resize((256,256),Image.Resampling.NEAREST)

scales={}
for hero in ['franco','ryuchi']:
 source=next(s for s in sources if s['hero']==hero and s['state']=='idle')
 im=Image.open(BASE/source['file']).convert('RGBA')
 heights=[cell(im,r,c).getbbox()[3]-cell(im,r,c).getbbox()[1] for r in range(4) for c in range(8)]
 scales[hero]=min(.84,190/statistics.median(heights))

row_scales={}
for source in sources:
 hero,state=source['hero'],source['state'];print('Empacotando',hero,state,flush=True);im=Image.open(BASE/source['file']).convert('RGBA')
 if source.get('sha256'):assert hashlib.sha256((BASE/source['file']).read_bytes()).hexdigest()==source['sha256'], 'Fonte alterada: '+source['file']
 if hero=='ryuchi' and state=='roll':im.info['irregular_roll']=True
 assert im.getchannel('A').getextrema()[0]==0, source['file']
 if release=='V5':
  transparent=im.getchannel('A').histogram()[0]/(im.width*im.height)
  assert transparent>=.25, 'Verificar fundo opaco: '+source['file']
  manifest['sourceChecks'][hero+'/'+state]={'transparentFraction':transparent,'size':list(im.size)}
  projection=[sum(v>=128 for v in im.getchannel('A').crop((0,y,im.width,y+1)).tobytes()) for y in range(im.height)]
  step=im.height/8;edges=[0]
  for k in range(1,8):
   lo=round((k-.42)*step);hi=round((k+.42)*step);gaps=[]
   for y in range(lo,hi):
    if projection[y]<=4:
     if gaps and y==gaps[-1][-1]+1:gaps[-1].append(y)
     else:gaps.append([y])
   if gaps:
    gap=max(gaps,key=len);cut=(gap[0]+gap[-1])//2
   else:cut=min(range(lo+2,hi-2),key=lambda y:sum(projection[y-2:y+3]))
   edges.append(cut)
  edges.append(im.height)
  if source.get('sourceRowEdges'):edges=source['sourceRowEdges']
  im.info.update(v5_layout=True,row_edges=edges)
  manifest['sourceChecks'][hero+'/'+state]['rowEdges']=edges
  ready_heights=[]
  for r in range(8):
   box=cell(im,r,7 if state=='roll' else 0).getbbox()
   assert box, 'Direção vazia em '+hero+'/'+state
   ready_heights.append(box[3]-box[1])
  for offset in [0,4]:
   heights=ready_heights[offset:offset+4]
   assert min(heights)>=max(heights)*.6, 'Revisar linha ausente ou recorte em '+hero+'/'+state+' '+str(ready_heights)
  manifest['sourceChecks'][hero+'/'+state]['readyHeights']=ready_heights
 sheet=Image.new('RGBA',(256*9,256*8))
 for row in range(8):
  variant='unmasked' if row<4 else 'masked';direction=directions[row%4]
  folder=OUT/'frames'/hero/variant/state/direction;folder.mkdir(parents=True,exist_ok=True)
  frames=[]
  scale_row=None
  if release=='V5':
   boxes=[cell(im,row,c).getbbox() for c in range(8)];assert all(boxes),'Pose vazia'
   ref=boxes[7 if state=='roll' else 0];reference_height=ref[3]-ref[1]
   scale_row=min((205 if row>=4 else 190)/reference_height,240/max(bb[2]-bb[0] for bb in boxes),216/max(bb[3]-bb[1] for bb in boxes))
   row_scales[hero+'/'+state+'/'+variant+'/'+direction]=scale_row
  for col in range(8):
   original=cell(im,row,col);bbox=original.getbbox()
   if not bbox:manifest['validation']['empty_frames'].append([hero,state,row,col]);raise ValueError('Empty pose')
   pose=original.crop(bbox);scale=scales[hero]
   if release=='V5':scale=scale_row
   elif im.info.get('irregular_roll'):
    ref=cell(im,row,7).getbbox();scale=190*(1.08 if row>=4 else 1)/(ref[3]-ref[1])
   pose=pose.resize((max(1,round(pose.width*scale)),max(1,round(pose.height*scale))),Image.Resampling.NEAREST)
   frame=Image.new('RGBA',(256,256));lift=5 if state=='run' and col%2 else 0
   frame.alpha_composite(pose,(128-pose.width//2,224-pose.height-lift));frames.append(frame)
  # An explicit closing keyframe. Defeat is a one-shot that holds its final pose.
  frames.append(frames[-1].copy() if state=='defeat' else frames[0].copy())
  for index,frame in enumerate(frames):
   save_png(frame,folder/f'{index:02}.png');sheet.alpha_composite(frame,(index*256,row*256))
  if state!='defeat':assert frames[0].tobytes()==frames[-1].tobytes()
  frame_ms={'idle':140,'walk':110,'run':65,'roll':45 if hero=='franco' else 42.5,'attack_1':40,'attack_2':40,'attack_3':52.5,'skill':60,'advanced':70,'signature':100,'hurt':40,'defeat':100}.get(state,90)
  if release=='V4':frame_ms=140 if state=='idle' else 65 if state in ['run','roll'] else 90
  manifest['animations'].append({'hero':hero,'variant':variant,'state':state,'direction':direction,'row':row,'frames':9,'playFrames':8,'loop':state in ['idle','walk','run'],'holdLast':state=='defeat','atlas':f'atlas/{hero}_{state}.png','frameMs':frame_ms,'closureSha256':hashlib.sha256(frames[-1].tobytes()).hexdigest()})
 save_png(sheet,OUT/'atlas'/f'{hero}_{state}.png')

manifest['portraits']=[]
for source in json.loads((BASE/'retratos.json').read_text()):
 hero=source['hero'];im=Image.open(BASE/source['file']).convert('RGBA');folder=OUT/'retratos'/hero;folder.mkdir(parents=True,exist_ok=True)
 if release=='V5':
  if source.get('sha256'):assert hashlib.sha256((BASE/source['file']).read_bytes()).hexdigest()==source['sha256'], 'Retrato alterado'
  assert im.getchannel('A').histogram()[0]/(im.width*im.height)>.05, 'Verificar fundo do retrato '+hero
 for index,expression in enumerate(['neutral','speaking','happy','surprised','determined','angry','hurt','sad']*2):
  row,col=divmod(index,4);w,h=im.size;portrait=im.crop((round(col*w/4),round(row*h/4),round((col+1)*w/4),round((row+1)*h/4))).resize((256,256),Image.Resampling.NEAREST)
  variant='unmasked' if index<8 else 'masked';save_png(portrait,folder/f'{variant}_{expression}.png');manifest['portraits'].append({'hero':hero,'variant':variant,'expression':expression,'file':f'retratos/{hero}/{variant}_{expression}.png'})
 shutil.copy2(BASE/source['file'],folder/'ATLAS_ORIGINAL.png')
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
html='''<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Torii · Sprites principais V4</title><style>body{background:#171522;color:#f5e4c9;font:16px system-ui;padding:20px}select,button{font:inherit;margin:6px;padding:8px}canvas{image-rendering:pixelated;background:repeating-conic-gradient(#262332 0% 25%,#353140 0% 50%) 0/24px 24px;border:1px solid #a99;max-width:100%}p{max-width:850px}</style><h1>Franco e Ryuchi · V4</h1><p>PNGs transparentes · célula 256 × 256 · quatro direções · com e sem máscara.</p><div id="controls"></div><canvas width="512" height="512"></canvas><p id="info"></p><button id="replay">Repetir ação</button><p>Espera, caminhada e corrida repetem. Outras ações terminam em pose pronta; derrota termina no chão. O quadro 08 registra o fechamento idêntico ao quadro 00, exceto derrota. Conferir visualmente a passagem 07 → 00 antes da integração.</p><script>const M=MANIFEST,controls=document.querySelector('#controls'),canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d'),info=document.querySelector('#info');let start=performance.now(),image=new Image(),active;const selects={};for(const [key,values]of Object.entries({hero:['franco','ryuchi'],variant:['unmasked','masked'],state:[...new Set(M.animations.map(a=>a.state))],direction:['down','left','up','right']})){const s=document.createElement('select');for(const v of values)s.add(new Option(v,v));selects[key]=s;controls.append(s);s.onchange=choose}function choose(){active=M.animations.find(a=>Object.keys(selects).every(k=>a[k]===selects[k].value));image.src=active.atlas;start=performance.now();info.textContent=active.atlas+' · '+active.frameMs+' ms/quadro'}document.querySelector('#replay').onclick=()=>start=performance.now();function tick(t){ctx.clearRect(0,0,512,512);ctx.imageSmoothingEnabled=false;if(image.complete&&image.naturalWidth){let f=Math.floor((t-start)/active.frameMs);f=active.loop?f%8:Math.min(8,f);ctx.drawImage(image,f*256,active.row*256,256,256,0,0,512,512)}requestAnimationFrame(tick)}choose();requestAnimationFrame(tick);</script>'''
template=Path(__file__).with_name('PREVIA_TEMPLATE.html')
if template.exists():html=template.read_text()
(OUT/'PREVIA.html').write_text(html.replace('V4',release).replace('MANIFEST',json.dumps(manifest,ensure_ascii=False)))
report={'sheets':len(sources),'animations':len(manifest['animations']),'individualPngs':len(manifest['animations'])*9,'cell':[256,256],'scalePerHero':scales,**manifest['validation']}
report['portraits']=len(manifest['portraits'])
if release=='V5':report.update(completeCoverage=True,release=release,requiredStates=plan['states'],scalePerHero=None,scalePerRow=row_scales)
(OUT/'VALIDACAO.json').write_text(json.dumps(report,indent=2))
if (BASE/'LEIA-ME.md').exists():shutil.copy2(BASE/'LEIA-ME.md',OUT/'LEIA-ME.md')
previews=[]
for index in range(8):
 canvas=Image.new('RGBA',(1024,512),(28,25,38,255))
 for y,state in enumerate(['walk','roll']):
  for x,(hero,variant) in enumerate([('franco','unmasked'),('franco','masked'),('ryuchi','unmasked'),('ryuchi','masked')]):
   canvas.alpha_composite(Image.open(OUT/'frames'/hero/variant/state/'down'/f'{index:02}.png'),(x*256,y*256))
 previews.append(canvas.convert('RGB'))
previews[0].save(OUT/'PREVIA_ANIMADA.gif',save_all=True,append_images=previews[1:],duration=120,loop=0)
save_png(previews[3],OUT/'CONTATO.png')
zip_target=BASE/f'TORII_SPRITES_PRINCIPAIS_{release}.zip'
zip_temporary=zip_target.with_suffix('.zip.exportando')
with zipfile.ZipFile(zip_temporary,'w',zipfile.ZIP_DEFLATED) as z:
 for p in OUT.rglob('*'):
  if p.is_file():z.write(p,p.relative_to(OUT))
zip_temporary.replace(zip_target)
print(json.dumps({k:report[k] for k in ['sheets','animations','individualPngs','portraits','empty_frames']}))

