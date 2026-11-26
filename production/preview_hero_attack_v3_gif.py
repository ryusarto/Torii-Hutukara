#!/usr/bin/env python3
"""Assemble actual captured renderer frames. Not asset editing or new poses."""
from pathlib import Path
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1];SRC=ROOT/'qa/beta-1.17.0/hero-fx-v3/animation-frames';OUT=ROOT/'assets/hero-attack-fx/v3/preview';HEROES=['franco','ryuchi','alt','katana','synth','percussion'];all_frames=[]
for h in HEROES:
 frames=[Image.open(p).convert('RGB')for p in sorted((SRC/h).glob('*.png'))];assert len(frames)==42
 frames[0].save(OUT/f'{h}-runtime.gif',save_all=True,append_images=frames[1:],duration=80,loop=0,optimize=False);all_frames.append(frames)
montage=[]
for f in range(42):
 im=Image.new('RGB',(720,470),'#18151e');d=ImageDraw.Draw(im)
 for i,h in enumerate(HEROES):
  x=(i%3)*240;y=(i//3)*235;d.text((x+8,y+5),h+' J combo (slow)',fill='#e9d6b0');im.paste(all_frames[i][f],(x,y+23))
 montage.append(im)
montage[4].save(OUT/'six-heroes-runtime-contact.png')
montage[0].save(OUT/'six-heroes-runtime.gif',save_all=True,append_images=montage[1:],duration=80,loop=0,optimize=False)
print(OUT/'six-heroes-runtime.gif')
