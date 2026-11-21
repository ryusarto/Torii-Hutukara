"""Export a nine-frame filmstrip from the same body sources/pivots as drawActor."""
from pathlib import Path
import argparse
import json
from PIL import Image, ImageDraw, ImageFont
from pack import ROOT,FOLDER,CELL,STATES

def preview(dest):
    placements=json.loads((FOLDER/'placement.json').read_text())
    labels=['Franco','Ryuchi','Arqueiro','Katana','Sintetizador','Percussão']
    actions=['Ataque 1','Ataque 2','Ataque 3','Especial','Avançado','Super']
    frames=[Image.new('RGB',(820,608),'#232128') for _ in range(9)]
    for frame in frames:
        q=ImageDraw.Draw(frame)
        for i,label in enumerate(labels):q.text((10,76+94*i),label,fill='#f3e7d8')
        for i,label in enumerate(actions):q.text((126+115*i,18),label,fill='#f3e7d8')
    for h,hero in enumerate(['franco','ryuchi','alt','katana','synth','percussion']):
        variant='unmasked'
        contacts=Image.open(FOLDER/'atlas'/f'{hero}_{variant}.png')
        for c,state in enumerate(STATES):
            direction=(c+1)%4
            if hero in ['franco','ryuchi']:path=ROOT/f'assets/protagonistas/v5/atlas/{hero}_{state}.png'
            elif hero in ['alt','katana']:path=ROOT/f'assets/variantes/ninja-arqueiro-v1/atlas/{hero}_{state}.png'
            else:
                name='franco_sintetizador' if hero=='synth' else 'ryuchi_percussionista'
                path=ROOT/f'assets/variantes/percussao-sintetizador-v1/atlas/{name}_{variant}_{state}.png'
            original=Image.open(path)
            for slot,frame in enumerate(frames):
                im=contacts if slot==4 else original
                col=c if slot==4 else slot if slot<4 else slot-1
                tile=im.crop((col*CELL,direction*CELL,(col+1)*CELL,(direction+1)*CELL)).resize((88,88),Image.Resampling.NEAREST)
                key=f"{hero}_{variant}/{state}/{['down','left','up','right'][direction]}"
                offset=placements.get(key,(0,0)) if slot==4 else (0,0)
                frame.paste(tile,(108+c*115+round(offset[0]*88/256),39+h*94+round(offset[1]*88/256)),tile)
    dest.parent.mkdir(parents=True,exist_ok=True)
    frames[0].save(dest,save_all=True,append_images=frames[1:],duration=[155]*9,loop=0,disposal=2)

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('output',type=Path)
    preview(parser.parse_args().output)
