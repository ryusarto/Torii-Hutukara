#!/usr/bin/env python3
from pathlib import Path
from PIL import Image,ImageDraw,ImageSequence
import json
ROOT=Path(__file__).resolve().parents[1];SRC=ROOT/'qa/beta-1.17.0/enemy-variants-v2/animation-frames';OUT=ROOT/'assets/enemies/variants-v2/preview';TYPES=['tambor_escudo','flautim_atirador','coro_curador','maestro_invocador','muralha_estatica','antena_feedback'];allframes=[]
for typ in TYPES:
 frames=[Image.open(p).convert('RGB')for p in sorted((SRC/typ).glob('*.png'))];assert len(frames)==40
 frames[0].save(OUT/f'{typ}-runtime.gif',save_all=True,append_images=frames[1:],duration=100,loop=0,optimize=False);allframes.append(frames)
montage=[]
for frame in range(40):
 im=Image.new('RGB',(660,470),'#1c1823');d=ImageDraw.Draw(im)
 for i,typ in enumerate(TYPES):x=i%3*220;y=i//3*235;d.text((x+3,y+4),typ,fill='#f4d9b0');im.paste(allframes[i][frame],(x,y+22))
 montage.append(im)
montage[10].save(OUT/'six-enemies-runtime-contact.png');montage[0].save(OUT/'six-enemies-runtime.gif',save_all=True,append_images=montage[1:],duration=100,loop=0,optimize=False)
rows=[]
for p in sorted(OUT.glob('*runtime.gif')):
 im=Image.open(p);duration=sum(f.info.get('duration',0)for f in ImageSequence.Iterator(im));assert duration==4000;rows.append({'file':p.name,'storedFrames':im.n_frames,'sourceFrames':40,'durationMs':duration,'bytes':p.stat().st_size})
(ROOT/'qa/beta-1.17.0/enemy-variants-v2/GIF.json').write_text(json.dumps(rows,indent=2)+'\n');print(OUT/'six-enemies-runtime.gif')
