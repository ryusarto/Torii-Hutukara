"""Verify exported PNGs through the ZIP to avoid thousands of cloud file opens."""
from pathlib import Path
from io import BytesIO
from PIL import Image,ImageDraw
import json,zipfile,itertools,hashlib,argparse
ROOT=Path(__file__).resolve().parents[1];parser=argparse.ArgumentParser();parser.add_argument('--base',default='sprites-principais-v5' if (ROOT/'sprites-principais-v5').exists() else 'design/sprites-principais-v5');args=parser.parse_args();BASE=(ROOT/args.base).resolve();OUT=BASE/'pacote'
archive=BASE/'TORII_SPRITES_PRINCIPAIS_V5.zip';counts=0;distinct={};cache={}
with zipfile.ZipFile(archive) as z:
 names=z.namelist();assert len(names)==len(set(names)),'Membros duplicados no ZIP'
 m=json.loads(z.read('manifest.json'));plan=json.loads((BASE/'PLANO_PERSONAGENS.json').read_text());expected=set(itertools.product(plan['heroes'],plan['variants'],plan['states'],plan['directions']));actual={(a['hero'],a['variant'],a['state'],a['direction']) for a in m['animations']};assert actual==expected and len(actual)==len(m['animations'])
 for a in m['animations']:
  atlas_name=a['atlas']
  if atlas_name not in cache:
   atlas=Image.open(BytesIO(z.read(atlas_name))).convert('RGBA');assert atlas.size==(2304,2048);cache[atlas_name]=atlas
  frames=[]
  for i in range(9):
   name='/'.join(['frames',a['hero'],a['variant'],a['state'],a['direction'],f'{i:02}.png']);im=Image.open(BytesIO(z.read(name)));assert im.mode=='RGBA' and im.size==(256,256),name
   bb=im.getbbox();assert bb and 0<bb[0]<bb[2]<256 and 0<bb[1]<bb[3]<256,(name,bb)
   assert im.getchannel('A').getextrema()[0]==0,name
   data=im.tobytes();assert data==cache[atlas_name].crop((i*256,a['row']*256,(i+1)*256,(a['row']+1)*256)).tobytes(),name
   frames.append(data);counts+=1
  assert frames[8]==frames[7 if a['state']=='defeat' else 0],a
  key='/'.join(a[k] for k in ['hero','variant','state','direction']);distinct[key]=len(set(frames[:8]));assert distinct[key]>=2,key
 for a in m['portraits']:
  im=Image.open(BytesIO(z.read(a['file'])));assert im.mode=='RGBA' and im.size==(256,256) and im.getchannel('A').getextrema()[0]==0,a
 assert len([n for n in names if n.startswith('frames/') and n.endswith('.png')])==1728
 assert len([n for n in names if n.startswith('atlas/') and n.endswith('.png')])==24
 assert len(m['portraits'])==32
report={'passed':True,'input':'Exported ZIP members; PNG CRC verified while reading','animations':len(actual),'actionFramesChecked':counts,'portraitsChecked':len(m['portraits']),'alpha':True,'dimensions':True,'padding':True,'atlasMatchesIndividualFrames':True,'closureFiles':True,'defeatHoldsLast':True,'minimumDistinctPoses':min(distinct.values()),'distinctPoses':distinct,'limits':'Structural checks do not certify natural motion, correct anatomy, or in-game integration.'}
(OUT/'REVISAO_ESTRUTURAL.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps({k:v for k,v in report.items() if k not in ['distinctPoses','limits']}),flush=True)

contact=Image.new('RGB',(2048,len(plan['states'])*156+24),(28,25,38));draw=ImageDraw.Draw(contact)
for ri,state in enumerate(plan['states']):
 draw.text((4,ri*156+24),state,fill='#f1d1a8')
 for hi,hero in enumerate(plan['heroes']):
  atlas=cache['atlas/'+hero+'_'+state+'.png']
  for row in range(8):
   col=hi*8+row;pose=atlas.crop((0,row*256,256,(row+1)*256)).resize((128,128),Image.Resampling.NEAREST);contact.paste(pose,(col*128,ri*156+45),pose)
   if ri==0:draw.text((col*128+2,4),hero[:1]+' '+str(row),fill='#f1d1a8')
temp=OUT/'CONTATO_DIRECOES.png.exportando';contact.save(temp,format='PNG');temp.replace(OUT/'CONTATO_DIRECOES.png')

