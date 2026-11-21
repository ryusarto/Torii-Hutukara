#!/usr/bin/env python3
"""Register/crop/pack authored ImageGen poses. Does not paint poses or interpolate pixels."""
from pathlib import Path
from PIL import Image
import json,statistics,hashlib
ROOT=Path(__file__).resolve().parents[4]
OUT=ROOT/'assets/protagonistas/v7-locomocao'
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def tile(im,c,r,cols,rows):return im.crop((round(c*im.width/cols),round(r*im.height/rows),round((c+1)*im.width/cols),round((r+1)*im.height/rows)))
def box(im):return im.getchannel('A').point(lambda a:255 if a>120 else 0).getbbox()
def clear_export_gutter(im,padding=2):
 # Generated RGBA cells can contain near-invisible matte noise at their edge.
 # This is export padding, never silhouette cleanup: refuse to crop any pixel
 # more opaque than 2/255, and preserve every pixel inside the gutter exactly.
 edge=[im.getpixel((x,y))[3] for y in range(256) for x in range(256) if min(x,y,255-x,255-y)<padding]
 maximum=max(edge,default=0)
 if maximum>2:raise ValueError(f'visible sprite in export gutter: alpha={maximum}')
 clean=Image.new('RGBA',im.size)
 clean.paste(im.crop((padding,padding,256-padding,256-padding)),(padding,padding))
 return clean,{'paddingPx':padding,'removedMattePixels':sum(a>0 for a in edge),'maxRemovedAlpha':maximum}
def assert_transparent_gutter(im,padding=2):
 if any(im.getpixel((x,y))[3] for y in range(256) for x in range(256) if min(x,y,255-x,255-y)<padding):raise ValueError('nontransparent cell gutter')
def headcenter(im):
 b=box(im);a=im.getchannel('A');limit=b[1]+(b[3]-b[1])*.42;weighted=total=0
 for y in range(b[1],int(limit)):
  for x in range(b[0],b[2]):
   v=a.getpixel((x,y));weighted+=x*v;total+=v
 return weighted/max(total,1)
animations=[];checks=[]
for hero in ['franco','ryuchi']:
 for state in ['walk','run']:
  ref=Image.open(ROOT/f'assets/protagonistas/v5/atlas/{hero}_{state}.png').convert('RGBA')
  atlas=Image.new('RGBA',(4096,2048));sourceHashes={}
  for variant in ['unmasked','masked']:
   source=OUT/f'source/{hero}_{state}_{variant}.png';new=Image.open(source).convert('RGBA');sourceHashes[variant]=sha(source)
   for row,direction in enumerate(['down','left','up','right']):
    rr=row+(4 if variant=='masked' else 0)
    original=[tile(ref,c,rr,9,8) for c in range(8)];fresh=[tile(new,c,row,8,4) for c in range(8)]
    scale=statistics.median(box(f)[3]-box(f)[1] for f in original)/statistics.median(box(f)[3]-box(f)[1] for f in fresh)
    packed=[];paddingChecks=[]
    for c in range(8):
     atlas.paste(original[c],(c*512,rr*256));packed.append(original[c])
     image=fresh[c].resize((round(fresh[c].width*scale),round(fresh[c].height*scale)),Image.Resampling.NEAREST)
     targetX=(headcenter(original[c])+headcenter(original[(c+1)%8]))/2
     targetY=(box(original[c])[3]+box(original[(c+1)%8])[3])/2
     registered=Image.new('RGBA',(256,256));offset=(round(targetX-headcenter(image)),round(targetY-box(image)[3]));registered.paste(image,offset)
     registered,paddingCheck=clear_export_gutter(registered);paddingChecks.append(paddingCheck)
     atlas.paste(registered,(c*512+256,rr*256));packed.append(registered)
    for f in packed:assert_transparent_gutter(f)
    hashes=[hashlib.sha256(f.tobytes()).hexdigest() for f in packed]
    if len(set(hashes))!=16:raise ValueError(f'duplicate pose {hero}/{state}/{rr}')
    if any(box(f)[0]<3 or box(f)[1]<3 or box(f)[2]>253 or box(f)[3]>248 for f in packed):raise ValueError('sprite clips cell')
    checks.append({'hero':hero,'state':state,'row':rr,'uniqueFrames':len(set(hashes)),'newDrawings':8,'uniformSourceScale':scale,'maxVisibleFootSpread':max(box(f)[3] for f in packed)-min(box(f)[3] for f in packed),'referenceFootRange':[min(box(f)[3] for f in original),max(box(f)[3] for f in original)],'newFootRange':[min(box(packed[c*2+1])[3] for c in range(8)),max(box(packed[c*2+1])[3] for c in range(8))],'transparentPaddingPx':2,'transparentCorners':64,'removedMattePixels':sum(p['removedMattePixels'] for p in paddingChecks),'maxRemovedAlpha':max(p['maxRemovedAlpha'] for p in paddingChecks)})
    ms=520/16 if state=='run' else (8/3.6)/3.7*1000/16
    animations.append({'hero':hero,'variant':variant,'state':state,'direction':direction,'row':rr,'frames':16,'playFrames':16,'loop':True,'closureFrame':0,'atlas':f'atlas/{hero}_{state}.png','frameMs':ms,'frameDurationsMs':[ms]*16,'cycleMs':ms*16,'strideDistance':3.172 if state=='run' else 8/3.6,'frameSources':[{'kind':'original-v5' if i%2==0 else 'authored-v7','index':i//2} for i in range(16)],'sourceSha256':sourceHashes[variant]})
  dest=OUT/f'atlas/{hero}_{state}.png';atlas.save(dest,optimize=True)
manifest={'version':7,'release':'V7-locomocao','extends':'V5; replaces V6 run','cell':[256,256],'pivot':[128,224],'columns':16,'transparentPaddingPx':2,'rows':['unmasked/down','unmasked/left','unmasked/up','unmasked/right','masked/down','masked/left','masked/up','masked/right'],'states':['walk','run'],'filter':'nearest','animations':animations}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
(OUT/'VALIDACAO.json').write_text(json.dumps({'method':'Technical RGBA/registration/uniqueness checks; visual preview and engine QA are separate.','sequences':len(animations),'newDrawings':256,'cellCount':512,'transparentCornerCount':2048,'transparentPaddingPx':2,'matteCleanupGuardMaxAlpha':2,'checks':checks,'files':{p.name:{'sha256':sha(p),'bytes':p.stat().st_size,'size':list(Image.open(p).size)} for p in (OUT/'atlas').glob('*.png')}},indent=2)+'\n')
# Browser-independent contact preview; each cell remains the same world scale.
preview=Image.new('RGB',(16*96,8*110),(47,40,43))
for rr,entry in enumerate([a for a in animations if a['direction']=='down']):
 a=Image.open(OUT/entry['atlas'])
 for c in range(16):
  im=a.crop((c*256,entry['row']*256,(c+1)*256,(entry['row']+1)*256)).resize((88,88),Image.Resampling.NEAREST);preview.paste(im,(c*96+4,rr*110+5),im)
preview.save(OUT/'PREVIA_CONTATO.png')
print('Packed32sequences,256newdrawings,4atlases4096x2048,16uniqueplayedframes each')
