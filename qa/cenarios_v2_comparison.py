"""Create the six selected before/after environment QA comparisons; Pillow required."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
qa=Path(__file__).resolve().parent/'cenarios-v2'
pairs=[('Distrito / portas','distrito-entradas.png'),('Clube Contratempo','contratempo-camera.png'),('Usina de Retorno','power_plant-camera.png'),('Mar de Nuvens','nuvens-percurso.png'),('Último Torii','last_torii-camera.png'),('Núcleo do Silêncio','silence_core-camera.png')]
try:font=ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc',19);small=ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc',16)
except OSError:font=small=ImageFont.load_default()
out=Image.new('RGB',(1232,56+382*len(pairs)),'#171321');d=ImageDraw.Draw(out)
d.text((16,15),'TORII & HUTUKARA · Cenários V2 — câmera do motor',font=font,fill='#f6dfb1')
for i,(label,file) in enumerate(pairs):
 y=56+i*382;d.text((16,y+3),label,font=font,fill='#f6dfb1')
 for j,(folder,title) in enumerate([('antes','ANTES'),('depois','DEPOIS')]):
  x=16+j*608;im=Image.open(qa/folder/file).convert('RGB').resize((592,333),Image.Resampling.NEAREST)
  out.paste(im,(x,y+40));d.text((x+480,y+10),title,font=small,fill='#c3a8dd')
out.save(qa/'COMPARACOES.png',optimize=True)
print(qa/'COMPARACOES.png')
