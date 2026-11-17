"""Export the approved atlas poses without repainting, interpolation, or a raw-source dependency."""
from pathlib import Path
import argparse,json,hashlib,shutil
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--source',default='assets/protagonistas/v5')
parser.add_argument('--out',help='Export folder outside the source tree; e.g. the Dropbox asset backup')
parser.add_argument('--check-only',action='store_true')
args=parser.parse_args()
source=(ROOT/args.source).resolve()
if not args.check_only and not args.out:parser.error('--out is required for an export')
out=Path(args.out).expanduser().resolve() if args.out and not args.check_only else None
if out and (out==source or source in out.parents):parser.error('Choose an output folder outside the official source tree')
manifest=json.loads((source/'manifest.json').read_text())
cache={};count=0
for action in manifest['animations']:
 name=action['atlas']
 if name not in cache:
  atlas=Image.open(source/name).convert('RGBA')
  assert atlas.size==(2304,2048),name
  cache[name]=atlas
 atlas=cache[name];poses=[]
 for index in range(action['frames']):
  pose=atlas.crop((index*256,action['row']*256,(index+1)*256,(action['row']+1)*256))
  assert pose.getbbox() and pose.getchannel('A').getextrema()[0]==0,(name,index)
  poses.append(pose)
  if out:
   folder=out/'frames'/action['hero']/action['variant']/action['state']/action['direction'];folder.mkdir(parents=True,exist_ok=True)
   target=folder/f'{index:02}.png';temporary=target.with_suffix('.png.exportando')
   pose.save(temporary,format='PNG');temporary.replace(target)
  count+=1
 assert poses[8].tobytes()==poses[7 if action['holdLast'] else 0].tobytes(),action
 assert hashlib.sha256(poses[8].tobytes()).hexdigest()==action['closureSha256'],action
for portrait in manifest['portraits']:
 im=Image.open(source/portrait['file'])
 assert im.size==(256,256) and im.mode=='RGBA' and im.getchannel('A').getextrema()[0]==0,portrait
if out:
 for name in list(cache)+[p['file'] for p in manifest['portraits']]+['manifest.json','PREVIA.html','VALIDACAO.json','REVISAO_ESTRUTURAL.json','VALIDACAO_NAVEGADOR.json']:
  origin=source/name;target=out/name;target.parent.mkdir(parents=True,exist_ok=True)
  temporary=target.with_suffix(target.suffix+'.exportando');shutil.copyfile(origin,temporary);temporary.replace(target)
print(json.dumps({'passed':True,'atlas':len(cache),'animations':len(manifest['animations']),'frames':count,'portraits':len(manifest['portraits']),'exported':bool(out)}))
