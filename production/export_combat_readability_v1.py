#!/usr/bin/env python3
"""Editable, deterministic pixel sprites for actual phase-2 combat and the C1 rift.
No external art. Integer pixels, transparent background, nearest-neighbour only.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageColor
import json, math, hashlib
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/combat-readability/v1'
CELL=128; FRAMES=8
P={
 'copper':('#241e2b','#68473d','#bc8654','#f0d7a3'),
 'static':('#201e2d','#5b3e53','#b26b7b','#e8c6b5'),
 'iron':('#231f27','#6d4837','#b9824c','#ead49b'),
 'void':('#1c1c2b','#493f59','#887799','#d4c5d4'),
 'wind':('#1e242b','#44646b','#7eacaa','#d1ded0'),
 'heal':('#1e2827','#42694f','#80b894','#d9dec0'),
 'lime':('#202727','#5b7052','#a6b47c','#ded9a6')}
CLIPS=[('pulse_mask','mask','copper'),('pulse_gear','gear','iron'),('pulse_mute','mute','void'),('line_lunge','lunge','copper'),('cross_static','cross','static'),('cone_drum','drum','copper'),('cone_iron','iron_shield','iron'),('beam_feedback','beam','wind'),('flute_bolt','bolt','lime'),('mirror_note','note','wind'),('heal_chord','heal','heal'),('summon_knot','knot','void'),('phase_shatter','shatter','copper'),('ring_echo','echo','static'),('void_crown','crown','void'),('sigil_pulse','sigil_pulse','copper'),('sigil_timbre','sigil_timbre','wind')]
PORTALS=['portal_dormant','portal_ready','portal_spent']
def ir(v):return int(round(v))
def effect(shape,palette,f):
 im=Image.new('RGBA',(64,64));d=ImageDraw.Draw(im);dark,shade,mid,light=P[palette];q=f/7;opening=3+min(f,7-f)
 def rect(box,c):d.rectangle(tuple(map(ir,box)),fill=c)
 def line(points,c,w=1):d.line([(ir(x),ir(y))for x,y in points],fill=c,width=w)
 def poly(points,c):d.polygon([(ir(x),ir(y))for x,y in points],fill=c)
 def ring(r,c,w=1):d.ellipse((32-r,32-r,32+r,32+r),outline=c,width=w)
 def shard(x,y,a,length=8):
  vx,vy=math.cos(a),math.sin(a);nx,ny=-vy,vx
  pts=[(x-vx*length*.7,y-vy*length*.7),(x+nx*2,y+ny*2),(x+vx*length,y+vy*length),(x-nx*2,y-ny*2)]
  poly(pts,dark);line([(x-vx*length*.4,y-vy*length*.4),(x+vx*length*.8,y+vy*length*.8)],light,1)
 if shape=='mask':
  poly([(22,18),(41,18),(44,25),(40,40),(32,46),(24,40),(20,25)],dark)
  poly([(24,20),(39,20),(41,25),(37,38),(32,42),(27,38),(23,25)],mid)
  poly([(25,25),(31,27),(28,30),(24,28)],shade);poly([(33,27),(39,25),(40,28),(36,30)],shade)
  line([(29,35),(32,37),(35,35)],light,1);line([(25,21),(38,21)],light)
  for s in [-1,1]:line([(32+s*(15+opening),23),(32+s*(18+opening),32),(32+s*(15+opening),41)],mid,2)
 elif shape=='gear':
  r=13+f%3
  for n in range(8):
   a=n*math.pi/4+q*.5;shard(32+math.cos(a)*r,32+math.sin(a)*r,a,5)
  ring(12,mid,3);ring(7,shade,3);ring(3,light,2)
 elif shape=='mute':
  poly([(21,20),(43,20),(46,39),(18,39)],dark);poly([(24,22),(40,22),(43,36),(21,36)],mid)
  for x in [26,32,38]:line([(x,25+f%3),(x,33-f%3)],shade,3)
  line([(19,41),(45,41)],light,2)
 elif shape=='lunge':
  for y in [22,30,38]:line([(7+f, y),(26+f,y)],shade,2)
  poly([(19,28),(37,28),(33,20),(55,32),(33,44),(37,35),(19,35)],dark)
  poly([(22,30),(40,30),(37,25),(49,32),(37,39),(40,33),(22,33)],mid)
  line([(29,31),(46,31)],light)
 elif shape=='cross':
  for a in [0,math.pi/2,math.pi,math.pi*1.5]:
   c,s=math.cos(a),math.sin(a)
   pts=[(32+c*r-s*o,32+s*r+c*o)for r,o in [(0,0),(8,-2),(11,1),(19,-3),(27,0)]]
   line(pts,dark,5);line(pts,mid,3);line(pts[:3],light,1)
  rect((29,29,35,35),shade)
 elif shape=='drum':
  poly([(19,21),(43,21),(47,38),(39,44),(23,44),(17,38)],dark)
  poly([(21,23),(41,23),(44,37),(37,40),(25,40),(20,37)],mid)
  d.ellipse((20,19,43,29),fill=shade,outline=light,width=1)
  for x in [23,29,35,41]:line([(x,29),(x-2,38)],light,1)
  a=q*.8
  line([(14,12+f%3),(26,25)],dark,4);line([(14,12+f%3),(26,25)],light,2)
  line([(49,13-f%3),(37,25)],dark,4);line([(49,13-f%3),(37,25)],light,2)
 elif shape=='iron_shield':
  poly([(18,18),(44,18),(48,26),(45,43),(32,49),(19,43),(16,26)],dark)
  poly([(21,21),(42,21),(44,27),(41,40),(32,45),(23,40),(20,27)],mid)
  line([(25,23),(23,37),(32,42),(39,37),(40,24)],shade,2)
  line([(24,22),(40,22)],light,2)
  rect((24,26,27,29),light);rect((36,26,39,29),light)
  for n in [-1,1]:shard(32+n*(20+f%3),36+f%2,0 if n>0 else math.pi,5)
 elif shape=='beam':
  rect((9,25,54,38),dark);rect((11,27,52,36),shade)
  for x in range(13,53,5):
   h=3+((x+f*3)%9);line([(x,32-h//2),(x,32+h//2)],mid,2)
  line([(13,30),(51,30)],light)
 elif shape=='bolt':
  poly([(13,29),(35,29),(35,24),(53,32),(35,40),(35,35),(13,35)],dark)
  poly([(17,30),(37,30),(37,27),(48,32),(37,37),(37,34),(17,34)],mid)
  line([(9-f%3,32),(29,32)],light,1)
 elif shape=='note':
  a=q*.9
  for n in [-1,1]:
   x=32+n*(7+f%3);poly([(x,17),(x+7,20),(x+3,41),(x-5,45),(x-8,40)],dark)
   line([(x+2,20),(x-1,38)],light,2);d.ellipse((x-7,36,x+1,42),fill=mid)
  poly([(32,26),(38,32),(32,38),(26,32)],dark);poly([(32,28),(35,32),(32,35),(29,32)],light)
 elif shape=='heal':
  for n in [-1,0,1]:
   x=32+n*12;y=35+ir(math.sin(q*4+n)*3)
   d.ellipse((x-4,y-2,x+2,y+3),fill=mid);line([(x+2,y),(x+3,y-14),(x+8,y-11)],light,2)
  for a in [0,math.pi/2,math.pi,math.pi*1.5]:shard(32+math.cos(a)*21,32+math.sin(a)*21,a,3)
 elif shape=='knot':
  for n in range(3):
   a=q*.5+n*2*math.pi/3;c,s=math.cos(a),math.sin(a)
   pts=[(32+c*r-s*o,32+s*r+c*o)for r,o in [(2,0),(11,-12),(21,-5),(14,9),(4,8)]]
   poly(pts,dark);line(pts+[pts[0]],mid,2)
  rect((29,29,35,35),light)
 elif shape=='shatter':
  for n in range(6):
   a=n*math.pi/3+q*.4;r=8+q*14;shard(32+math.cos(a)*r,32+math.sin(a)*r,a,5+f%3)
 elif shape=='echo':
  for s in [-1,1]:
   for r in [9+f%3,18+f%3]:
    d.arc((32-r,32-r,32+r,32+r),-60 if s>0 else 120,60 if s>0 else 240,fill=mid,width=2)
  poly([(29,25),(35,25),(38,32),(35,39),(29,39),(26,32)],shade);rect((31,28,33,35),light)
 elif shape=='crown':
  for n in range(7):
   a=n*2*math.pi/7+q*.25;r=17+f%3;shard(32+math.cos(a)*r,32+math.sin(a)*r,a+math.pi/2,5)
  ring(12,shade,2)
 elif shape=='sigil_pulse':
  poly([(32,15),(48,32),(32,49),(16,32)],dark);line([(21,32),(25,32),(28,22),(33,41),(37,27),(40,32),(44,32)],light,2)
 elif shape=='sigil_timbre':
  poly([(32,15),(48,32),(32,49),(16,32)],dark)
  for i,x in enumerate([24,29,34,39]):line([(x,25-(i+f)%3),(x,39-(i+f)%4)],mid,3)
 # A restrained finishing highlight changes every frame, without an opaque glow.
 if shape not in ['bolt','lunge']:
  x=10+(f*7)%43;y=10+(f*11)%43;rect((x,y,x+1,y),mid)
 # Preparation gathers, frame 4 ruptures, then 5..7 dissipate. Projectiles
 # and portal sockets remain stable loops centered on their simulation points.
 if shape not in ['bolt','note','lunge','sigil_pulse','sigil_timbre']:
  scales=[.70,.78,.86,.94,1.12,1.04,.91,.78];alpha=[210,225,240,255,255,220,160,90]
  side=ir(64*scales[f]);scaled=im.resize((side,side),Image.Resampling.NEAREST)
  scaled.putalpha(scaled.getchannel('A').point(lambda a:a*alpha[f]//255))
  im=Image.new('RGBA',(64,64));im.paste(scaled,((64-side)//2,(64-side)//2))
 return im.resize((CELL,CELL),Image.Resampling.NEAREST)
def portal(state,f):
 im=Image.new('RGBA',(CELL,CELL));d=ImageDraw.Draw(im)
 dark,shade,mid,light=P['copper'];stone='#8b7372';edge='#af9385';shadow='#3b303d';moss='#596043';void='#171825';ready=state=='portal_ready';spent=state=='portal_spent'
 # Ground contact, broken roots and engraved stone pylons.
 d.ellipse((17,108,112,120),fill=(17,17,25,110));d.polygon([(20,110),(26,95),(30,30),(42,18),(86,18),(98,30),(102,95),(108,110)],fill=dark)
 for box in [(28,34,42,109),(86,34,100,109)]:d.rectangle(box,fill=stone);d.line([(box[0]+2,box[1]),(box[0]+2,box[3])],fill=edge,width=2)
 d.polygon([(29,33),(38,20),(90,20),(99,33),(92,40),(36,40)],fill=stone)
 d.line([(38,22),(88,22),(96,31)],fill=edge,width=2)
 # Small clusters follow chipped edges and joints, avoiding full-surface noise.
 for x,y in [(29,38),(37,47),(29,60),(38,72),(30,83),(38,99),(87,42),(96,51),(88,63),(96,78),(87,92),(95,104),(39,24),(50,28),(64,23),(78,29),(91,32)]:
  d.rectangle((x,y,x+2,y+1),fill='#62505c');d.line([(x,y-1),(x+2,y-1)],fill='#af9385',width=1)
  d.point((x+3,y+1),fill='#a1877e')
 for j,y in enumerate([43,55,67,79,91,103]):
  left=28+(j%3-1);right=100-(j%2)
  d.line([(left,y),(35,y+1),(42,y)],fill=shadow,width=1)
  d.line([(86,y+1),(93,y),(right,y+2)],fill=shadow,width=1)
  d.line([(30,y+2),(37,y+2)],fill='#af9385',width=1)
  d.line([(88,y+3),(96,y+2)],fill='#af9385',width=1)
  d.line([(33+(j%2)*3,y-4),(32+(j%2)*3,y),(34,y+2)],fill='#473645',width=1)
 for x in [43,57,71,85]:
  d.line([(x,21),(x-2,27),(x+1,33),(x,39)],fill=shadow,width=1)
  d.rectangle((x+2,24,x+4,25),fill='#af9385')
 for x,y in [(28,40),(31,57),(91,38),(97,70),(34,94),(88,101),(53,26),(76,31)]:
  d.line([(x,y),(x+2,y-1),(x+4,y)],fill='#b69a76',width=1)
  d.line([(x+1,y+1),(x+3,y+2),(x+4,y+1)],fill='#493a46',width=1)
 d.polygon([(43,39),(85,39),(85,107),(43,107)],fill=shadow)
 d.polygon([(49,42),(79,42),(80,106),(48,106)],fill=void)
 if not spent:
  # Narrow irregular tear: background remains dark rather than a neon disk.
  center=64+ir(math.sin(f*.8)*1);width=5 if ready else 2
  points=[(center-2,44),(center+width,56),(center-1,66),(center+width+1,77),(center+1,91),(center+3,106),(center-width,96),(center-3,82),(center-width,71),(center+1,57)]
  d.polygon(points,fill='#82aaa2' if ready else '#665a65');d.line([(center,48),(center+2,60),(center,72),(center+3,86),(center+1,102)],fill='#d8d8b4' if ready else '#827060',width=1)
  for n in range(4):
   y=48+(n*13+f*3)%53;x=52 if n%2 else 77;d.rectangle((x,y,x+1,y+1),fill=mid if ready else shade)
 else:
  d.rectangle((49,43,79,106),fill='#3b4142');d.line([(52,55),(67,67),(58,80),(73,96)],fill='#616f65',width=2)
 # Matching sockets are activated separately by runtime sigil overlays.
 for x in [34,94]:
  d.polygon([(x,49),(x+6,56),(x,63),(x-6,56)],fill=dark);d.line([(x-4,55),(x,51),(x+4,55)],fill=mid,width=1)
 for pts in [[(26,110),(15,112),(20,103),(17,97)],[(101,109),(114,113),(108,102),(113,96)],[(30,92),(20,86),(24,77)],[(96,74),(109,68),(103,61)]]:
  d.line(pts,fill=shade,width=4);d.line(pts,fill=mid,width=1)
 for x,y in [(30,38),(88,28),(95,88),(25,101),(104,107),(36,65),(91,54),(50,24)]:
  d.rectangle((x,y,x+3,y+2),fill=moss);d.point((x+1,y-1),fill='#7a874b');d.line([(x+2,y+2),(x+3,y+5),(x+2,y+7)],fill='#66734e',width=1)
 # Secondary segmented root fibres avoid broad smooth branches.
 for s in [-1,1]:
  pts=[(64+s*39,106),(64+s*47,110),(64+s*49,105),(64+s*54,108),(64+s*57,105)]
  d.line(pts,fill='#3c2a31',width=3);d.line(pts,fill='#ab783d',width=1)
  d.line([(64+s*43,83),(64+s*47,78),(64+s*44,72),(64+s*49,68)],fill='#8e673f',width=1)
 return im

def main():
 OUT.mkdir(parents=True,exist_ok=True);count=len(CLIPS)+len(PORTALS);atlas=Image.new('RGBA',(CELL*FRAMES,CELL*count));entries={}
 for row,(key,shape,palette) in enumerate(CLIPS):
  for f in range(FRAMES):atlas.alpha_composite(effect(shape,palette,f),(f*CELL,row*CELL))
  entries[key]={'row':row,'frames':FRAMES,'pivot':[64,64],'nativeSize':[64,64],'palette':palette,'shape':shape,'previewFrameMs':80,'runtimePlayback':{'preparation':'four equal phases of original h.max, never an independent clock','releaseFrameMs':120,'releaseDurationMs':480,'projectileLoopFrameMs':75,'reducedMotion':'fixed preparation2 / release5'},'preparation':[0,1,2,3],'release':[4,5,6,7]}
 for j,key in enumerate(PORTALS):
  row=len(CLIPS)+j
  for f in range(FRAMES):atlas.alpha_composite(portal(key,f),(f*CELL,row*CELL))
  entries[key]={'row':row,'frames':FRAMES,'pivot':[64,112],'nativeSize':[128,128],'frameMs':140,'loop':True}
 atlas.save(OUT/'combat_readability.tmp.png',optimize=True);(OUT/'combat_readability.tmp.png').replace(OUT/'combat_readability.png')
 manifest={'version':1,'source':'production/export_combat_readability_v1.py','origin':'Original T&H code-native pixel art; no external assets','atlas':'combat_readability.png','cell':CELL,'columns':FRAMES,'rows':count,'activeGroundRift':{'path':'assets/portal-chao/v1/fenda_chao_proposta.png','origin':'Built-in imagegen, generated original for T&H on 2026-11-25; image preserved unchanged','dimensions':[1774,887],'footprintTiles':[2,1],'pivot':'footprint center','states':['dormant:dim desaturated','ready:original and subtle center light','spent:dim gray'],'legacyPortalRows':'deprecated, not rendered; retained for atlas row compatibility'},'filter':'nearest','transparent':True,'clips':entries,'notes':['Presentation only. Simulation owns hit geometry, release, damage and cancellation.','Sprites stay inside actual geometry; prep is translucent, release uses frames4..7.','Portal uses silenceGate only; two original stone flags activate its separate sockets.']}
 (OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
 preview=Image.new('RGB',(960,count*82),'#201d2a');d=ImageDraw.Draw(preview)
 for row,key in enumerate(entries):
  d.text((8,row*82+30),key,fill='#efdab5')
  for f in range(FRAMES):
   im=atlas.crop((f*CELL,row*CELL,(f+1)*CELL,(row+1)*CELL)).resize((72,72),Image.Resampling.NEAREST)
   preview.paste(im,(202+f*92,row*82+4),im)
 preview.save(OUT/'preview.png',optimize=True)
 print(json.dumps({'clips':count,'frames':count*FRAMES,'atlasSize':atlas.size,'sha256':hashlib.sha256((OUT/'combat_readability.png').read_bytes()).hexdigest()}))
if __name__=='__main__':main()
