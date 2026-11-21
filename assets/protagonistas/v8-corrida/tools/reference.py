from pathlib import Path
from PIL import Image
base=Path(__file__).resolve().parents[1]
assets=base.parents[1]
def groups():
 for hero in ('franco','ryuchi','alt','katana','synth','percussion'):
  for variant in (('unmasked',) if hero in ('alt','katana') else ('unmasked','masked')):
   if hero in ('franco','ryuchi'):
    p=assets/'protagonistas/v7-locomocao/atlas'/f'{hero}_run.png';row=4 if variant=='masked' else 0
   elif hero in ('alt','katana'):
    p=assets/'variantes/ninja-arqueiro-v1/atlas'/f'{hero}_run.png';row=0
   else:
    name={'synth':'franco_sintetizador','percussion':'ryuchi_percussionista'}[hero]
    p=assets/'variantes/percussao-sintetizador-v1/atlas'/f'{name}_{variant}_run.png';row=0
   yield hero,variant,p,row
if __name__=='__main__':
 for hero,variant,p,row in groups():
  im=Image.open(p).convert('RGBA');ref=Image.new('RGBA',(1024,512))
  for d in range(4):
   for i,c in enumerate((0,4)):
    tile=im.crop((c*256,(row+d)*256,(c+1)*256,(row+d+1)*256))
    ref.alpha_composite(tile,(d*256,i*256))
  ref.save(base/'source'/f'{hero}_{variant}_reference.png')
