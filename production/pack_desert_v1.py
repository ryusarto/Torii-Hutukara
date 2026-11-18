"""Pack newly authored C3 variants without changing the published V2 library.
The supplied backup contains fontes.json and originais/*.png. Pillow required.
Partial packs remain staging assets until all variants are accepted.
"""
from pathlib import Path
from PIL import Image
import argparse,ast,hashlib,json
root=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('backup',type=Path);a=p.parse_args();backup=a.backup
out=root/'assets/cenarios/deserto-v1';(out/'atlas').mkdir(parents=True,exist_ok=True)
old=json.loads((root/'assets/cenarios/v2/manifest.json').read_text())
extraPlan=json.loads((root/'design/cenarios-deserto-v1/INVENTARIO.json').read_text())
records=json.loads((backup/'fontes.json').read_text())
# Use the established component/gutter crop contract, not a new painting algorithm.
tree=ast.parse((root/'production/pack_cenarios_v2.py').read_text());fn=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='isolate')
namespace={};exec(compile(ast.Module(body=[fn],type_ignores=[]),'<established atlas crop>','exec'),namespace);isolate=namespace['isolate']
manifest={'version':1,'theme':'deserto-v1','stage':'partial','tile':24,'filter':'nearest-neighbor','sheets':{},'items':{},'backgrounds':{},'sources':[]};checks=[]
for record in records:
 sid=record['id']
 if sid.startswith('BG_'):
  raw=(backup/record['file']).read_bytes();assert hashlib.sha256(raw).hexdigest()==record['sha256']
  im=Image.open(backup/record['file']).convert('RGBA');file='backgrounds/c3_desert_cinema_'+sid[3:]+'.png';dest=out/file;dest.parent.mkdir(parents=True,exist_ok=True);im.save(dest)
  dest=backup/'pacote'/file;dest.parent.mkdir(parents=True,exist_ok=True);im.save(dest)
  manifest['backgrounds'][sid]={'file':file,'size':list(im.size),'context':sid[3:],'originalId':'PB.cinemaPanel('+sid[3:]+')'}
  manifest['sources'].append({k:record[k] for k in ['id','file','sha256','prompt']});continue
 extras=[v for v in extraPlan['extraLegacyVariants'] if v['productionFamily']==sid]
 if sid in old['sheets']:spec=old['sheets'][sid];names=[n for n,d in old['items'].items() if d['sheet']==sid]
 else:
  family=next(v for v in extraPlan['proposedExtraPacking'] if v['id']==sid);spec={'grid':family['grid'],'cell':384 if sid=='D11' else 256,'kind':family['kind'],'file':'D'+sid[1:]+'_COMPLEMENTOS.png'};names=[v['id'] for v in sorted(extras,key=lambda v:v['productionSlot'])]
 raw=(backup/record['file']).read_bytes();assert hashlib.sha256(raw).hexdigest()==record['sha256']
 im=Image.open(backup/record['file']).convert('RGBA');cols,rows=spec['grid'];size=spec['cell'];atlas=Image.new('RGBA',(cols*size,rows*size));assert len(names)==cols*rows
 file='atlas/D'+sid[1:]+'_'+Path(spec['file']).name.split('_',1)[1]
 poses=[]
 for i in range(len(names)):
  row,col=divmod(i,cols);rect=[round(col*im.width/cols),round(row*im.height/rows),round((col+1)*im.width/cols),round((row+1)*im.height/rows)];pose,box=isolate(im.crop(rect));poses.append((pose,box,rect))
 pairs={'A06':[[0,1],[2,3]],'A07':[[0,1],[2,3],[4,5],[6,7]],'A09':[[0,1],[2,3],[4,5]],'A10':[[0,1,2],[3,4],[5,6]],'D11':[[2,3]],'D13':[[2,3]]}.get(sid,[])
 for i,name in enumerate(names):
  row,col=divmod(i,cols);pose,box,rect=poses[i];frame=Image.new('RGBA',(size,size));group=next((g for g in pairs if i in g),[i])
  if size==104:
   if sid in ['A01','A02']:
    dx,dy=max(3,round(pose.width*.05)),max(3,round(pose.height*.05));pose=pose.crop((dx,dy,pose.width-dx,pose.height-dy))
   if sid=='A04' and i<4:
    dx,dy=round(pose.width*.18),round(pose.height*.18);pose=pose.crop((dx,dy,pose.width-dx,pose.height-dy))
   elif sid=='A04':
    # Preserve named transparent edges/notches in a common square footprint.
    # Fitting each silhouette separately would stretch away the void.
    bounds=[v[1] for v in poses];bx=min(v[0] for v in bounds);by=min(v[1] for v in bounds);br=max(v[2] for v in bounds);bb=max(v[3] for v in bounds)
    canvas=Image.new('RGBA',(br-bx,bb-by));canvas.alpha_composite(pose,(box[0]-bx,box[1]-by));pose=canvas
   pose=pose.resize((96,96),Image.Resampling.NEAREST)
   if sid in ['A01','A02'] or sid=='A04' and i<4:pose.putalpha(255)
   frame.alpha_composite(pose,(4,4));content=[4,4,96,96];pivot=[52,100]
  else:
   maxw=max(poses[j][0].width for j in group);maxh=max(poses[j][0].height for j in group);k=min((size-24)/maxw,(size-24)/maxh)
   pose=pose.resize((max(1,round(pose.width*k)),max(1,round(pose.height*k))),Image.Resampling.NEAREST);pivot=[size//2,size-16];left=pivot[0]-pose.width//2;top=pivot[1]-pose.height;frame.alpha_composite(pose,(left,top))
   cw,ch=max(1,round(maxw*k)),max(1,round(maxh*k));content=[pivot[0]-cw//2,pivot[1]-ch,cw,ch]
  assert frame.getpixel((0,0))[3]==0 and frame.getbbox();atlas.alpha_composite(frame,(col*size,row*size));sprite=backup/'pacote/sprites'/f'{name}.png';sprite.parent.mkdir(parents=True,exist_ok=True);frame.save(sprite)
  manifest['items'][name]={'sheet':sid,'file':file,'cell':[col*size,row*size,size,size],'content':[col*size+content[0],row*size+content[1],*content[2:]],'pivot':pivot,'sourceCell':rect,'sourceContent':box}
  if len(group)>1:manifest['items'][name]['scaleGroup']=[names[j] for j in group]
  if extras:
   original=next(v for v in extras if v['id']==name);manifest['items'][name].update(originalId=original['originalId'],context=original['areas'],display=original['currentDrawBox'])
  red=sum(1 for r,g,b,alpha in frame.getdata() if alpha>100 and r>180 and g<30 and b<30)
  if sid in ['A01','A02']:assert red==0,'Unaccepted red fringe in '+name
  checks.append({'id':name,'transparentGutter':True,'nonempty':True,'anomalousRedPixels':red})
 atlas.save(out/file);dest=backup/'pacote'/file;dest.parent.mkdir(parents=True,exist_ok=True);atlas.save(dest)
 manifest['sheets'][sid]={**spec,'file':file};manifest['sources'].append({k:record[k] for k in ['id','file','sha256','prompt']})
if len(manifest['sheets'])==13 and len(manifest['items'])==131 and len(manifest['backgrounds'])==2:manifest['stage']='complete_assets'
report={'sheets':len(manifest['sheets']),'cells':len(manifest['items']),'backgrounds':len(manifest['backgrounds']),'checks':checks,'runtimeIntegrated':False}
# Reuse the established inspector with the current pack's data and correct counts.
html=next(n.value.value for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='html' for t in n.targets));html=html.replace('Cenários V2','C3 · Deserto V1').replace('126 recortes',str(len(manifest['items']))+' recortes')
if manifest['backgrounds']:
 html+='<section><h2>Fundos de diálogo C3</h2>'+''.join('<figure><img style="max-width:100%;width:640px;image-rendering:pixelated" src="'+bg['file']+'"><figcaption>'+bg['context']+'</figcaption></figure>' for bg in manifest['backgrounds'].values())+'</section>'
for folder in [out,backup/'pacote']:
 folder.mkdir(parents=True,exist_ok=True);(folder/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n');(folder/'VALIDACAO.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');(folder/'PREVIA.html').write_text(html.replace('MANIFEST',json.dumps(manifest,ensure_ascii=False)))
print(json.dumps({'sheets':len(manifest['sheets']),'cells':len(manifest['items']),'runtimeIntegrated':False}))
