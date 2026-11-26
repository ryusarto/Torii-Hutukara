#!/usr/bin/env python3
"""Stream browser PNGs into an actual-speed GIF without temporary frame files."""
from pathlib import Path
from PIL import Image
import io, struct, sys, json, os

out=Path(sys.argv[1]);duration=int(sys.argv[2]) if len(sys.argv)>2 else 50
frames=[]
while True:
    header=sys.stdin.buffer.read(4)
    if not header:break
    if len(header)!=4:raise RuntimeError('Truncated frame header')
    size=struct.unpack('>I',header)[0];data=sys.stdin.buffer.read(size)
    if len(data)!=size:raise RuntimeError('Truncated screenshot')
    im=Image.open(io.BytesIO(data)).convert('RGB')
    width=min(768,im.width);height=round(im.height*width/im.width)
    frames.append(im.resize((width,height),Image.Resampling.NEAREST))
assert frames
samples=[frames[i] for i in sorted(set([0,len(frames)//4,len(frames)//2,len(frames)*3//4,len(frames)-1]))]
width,height=frames[0].size
sheet=Image.new('RGB',(width,height*len(samples)))
for i,im in enumerate(samples):sheet.paste(im,(0,i*height))
# Reserve colours for the small effects instead of letting the terrain's
# larger pixel count quantize away their rare bright cores.
scene=sheet.quantize(colors=208,method=Image.Quantize.MEDIANCUT)
colours=[]
for asset in (Path(__file__).resolve().parents[1]/'assets/enemy-skill-fx/v2/atlas').glob('*.png'):
    colours.extend(p[:3] for p in Image.open(asset).convert('RGBA').getdata() if p[3]>96)
if colours:
    swatch=Image.new('RGB',(512,(len(colours)+511)//512));swatch.putdata(colours)
    fx=swatch.quantize(colors=48,method=Image.Quantize.MEDIANCUT)
    palette=Image.new('P',(1,1));palette.putpalette(scene.getpalette()[:208*3]+fx.getpalette()[:48*3])
else:palette=scene
packed=[im.quantize(palette=palette,dither=Image.Dither.NONE) for im in frames]
out.parent.mkdir(parents=True,exist_ok=True)
packed[0].save(out,save_all=True,append_images=packed[1:],duration=duration,loop=0,disposal=1,optimize=True)
if os.environ.get('FX_WEBP'):
    frames[0].save(out.with_suffix('.webp'),save_all=True,append_images=frames[1:],duration=duration,loop=0,lossless=True,quality=100,method=4)
print(json.dumps({'webp':str(out.with_suffix('.webp')) if out.with_suffix('.webp').exists() else None,'webpBytes':out.with_suffix('.webp').stat().st_size if out.with_suffix('.webp').exists() else None,'file':str(out),'sourceFrames':len(frames),'frameMs':duration,'bytes':out.stat().st_size}))
