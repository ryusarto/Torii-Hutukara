"""Reconstruct individual PNGs from published atlases without original AI sheets.
Usage: python3 production/export_ninja_archer_sprites_v1.py /backup/output
Pillow required. Does not change the repository's atlas files.
"""
import argparse, json, shutil
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('output',type=Path);args=parser.parse_args()
base=root/'assets/variantes/ninja-arqueiro-v1';output=args.output.resolve()
assert output!=base,'Use a separate export directory'
manifest=json.loads((base/'manifest.json').read_text())
for animation in manifest['animations']:
    image=Image.open(base/animation['atlas']).convert('RGBA');row=animation['row']
    directory=output/'frames'/animation['hero']/animation['variant']/animation['state']/animation['direction'];directory.mkdir(parents=True,exist_ok=True)
    for frame in range(9):image.crop((frame*256,row*256,(frame+1)*256,(row+1)*256)).save(directory/f'{frame:02}.png')
for name in ['atlas','retratos']:shutil.copytree(base/name,output/name,dirs_exist_ok=True)
for name in ['manifest.json','VALIDACAO.json','PREVIA.html']:shutil.copy2(base/name,output/name)
print('Exported 864 animation PNGs, 16 portraits and 24 atlases to',output)
