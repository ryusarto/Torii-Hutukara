"""Export all 126 individual scene PNGs from the published atlases. Pillow required."""
from pathlib import Path
from PIL import Image
import argparse,json,shutil
root=Path(__file__).resolve().parents[1];base=root/'assets/cenarios/v2'
p=argparse.ArgumentParser();p.add_argument('output',type=Path);args=p.parse_args();out=args.output.resolve();assert out!=base
m=json.loads((base/'manifest.json').read_text());(out/'sprites').mkdir(parents=True,exist_ok=True)
for name,a in m['items'].items():
 im=Image.open(base/a['file']);x,y,w,h=a['cell'];im.crop((x,y,x+w,y+h)).save(out/'sprites'/f'{name}.png')
shutil.copytree(base/'atlas',out/'atlas',dirs_exist_ok=True)
for name in ['manifest.json','PREVIA.html','VALIDACAO.json']:shutil.copy2(base/name,out/name)
print('Exported',len(m['items']),'PNGs to',out)
