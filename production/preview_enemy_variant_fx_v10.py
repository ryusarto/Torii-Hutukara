#!/usr/bin/env python3
"""Inspect existing effect cells; this is an atlas preview, not gameplay footage."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json
ROOT=Path(__file__).resolve().parents[1]
A=ROOT/'assets/combat-readability/v1'
m=json.loads((A/'manifest.json').read_text())
atlas=Image.open(A/m['atlas']).convert('RGBA')
font_path=Path('/System/Library/Fonts/Menlo.ttc')
font=ImageFont.truetype(str(font_path),13) if font_path.exists() else ImageFont.load_default()
labels=[('Tambor · impacto','cone_drum'),('Flautim · tiro','flute_bolt'),('Coro · cura','heal_chord'),('Maestro · invocação','summon_knot'),('Muralha · escudo','cone_iron'),('Antena · feixe','beam_feedback')]
frames=[]
for f in range(8):
 board=Image.new('RGB',(576,360),'#211e29');d=ImageDraw.Draw(board)
 for i,(label,key) in enumerate(labels):
  x=i%3*192;y=i//3*180;e=m['clips'][key];c=m['cell']
  d.rectangle((x+3,y+3,x+188,y+176),outline='#6c5951')
  tile=atlas.crop((f*c,e['row']*c,(f+1)*c,(e['row']+1)*c))
  board.paste(tile,(x+32,y+12),tile)
  box=d.textbbox((0,0),label,font=font);d.text((x+(192-(box[2]-box[0]))/2,y+150),label,font=font,fill='#ecdcc1')
 frames.append(board)
out=ROOT/'qa/beta-1.17.0/enemy-variants-v2/effects-atlas.gif'
frames[0].save(out,save_all=True,append_images=frames[1:],duration=120,loop=0,disposal=2)
print(out)
