"""Assemble actual browser captures; no synthetic sprite poses/interpolation."""
from pathlib import Path
from PIL import Image,ImageDraw
import json
ROOT=Path(__file__).resolve().parents[1]/'qa/beta-1.17.0/locomotion-v9'
HEROES=['franco','ryuchi','alt','katana','synth','percussion']
def strip(folder,pattern,n,caption):
    im=Image.new('RGB',(960,160),'#15151e');d=ImageDraw.Draw(im)
    for col,h in enumerate(HEROES):
        im.paste(Image.open(folder/(pattern.format(hero=h,n=n))).convert('RGB'),(col*160,20));d.text((col*160+5,3),caption+' '+h,fill='#e1d4b0')
    return im
def gif(frames,path,duration=33):frames[0].save(path,save_all=True,append_images=frames[1:],duration=duration,loop=0,optimize=True)
def main():
    before=ROOT/'before';after=ROOT/'after';report=json.loads((after/'REPORT.json').read_text());old=json.loads((before/'REPORT.json').read_text())
    transition=[]
    for n in range(100):
        frame=Image.new('RGB',(960,320),'#15151e');frame.paste(strip(before,'{hero}_{n:03}.png',n,'ANTES'),(0,0));frame.paste(strip(after,'{hero}_{n:03}.png',n,'DEPOIS'),(0,160));transition.append(frame)
    gif(transition,ROOT/'comparativo_seis_personagens.gif')
    world=[strip(after,'world_{hero}_{n:03}.png',n,'CICLO')for n in range(60)]
    gif(world,ROOT/'seis_personagens_corrida_mundo.gif')
    walk=[Image.open(after/f'world_ryuchi_walkleft_{n:03}.png').convert('RGB')for n in range(60)]
    gif(walk,ROOT/'ryuchi_caminhada_esquerda_mundo.gif')
    film=Image.new('RGB',(16*160,6*160),'#15151e');d=ImageDraw.Draw(film);metrics=[]
    for row,h in enumerate(HEROES):
        data=next(x for x in report['heroes']if x['hero']==h);previous=next(x for x in old['heroes']if x['hero']==h)
        samples=data['world']['samples'];contacts=data['world']['contacts'];indices={}
        for i,sample in enumerate(samples):
            if i%2==0 and sample['col']not in indices:indices[sample['col']]=i//2
        for col in range(16):
            if col not in indices:continue
            film.paste(Image.open(after/f'world_{h}_{indices[col]:03}.png').convert('RGB'),(col*160,row*160+20));d.text((col*160+4,row*160+3),h+' f'+str(col)+(' APOIO'if col in[0,8]else''),fill='#e1d4b0')
        previous=[x for x in previous['rows']if x['stage']=='d/true'];current=[x for x in data['rows']if x['stage']=='d/true']
        metrics.append({'hero':h,'topRangeBefore':max(x['bounds']['top']for x in previous)-min(x['bounds']['top']for x in previous),'topRangeAfter':max(x['bounds']['top']for x in current)-min(x['bounds']['top']for x in current),'runFloorRangeAfter':[min(x['bounds']['bottom']for x in current),max(x['bounds']['bottom']for x in current)],'groundY':121,'maxBelowGround':max(0,max(x['bounds']['bottom']for x in samples)-121),'contactFrames':contacts})
    film.save(ROOT/'contatos_e_ciclo_completo_mundo.png')
    contact=Image.new('RGB',(12*160,6*160),'#15151e');d=ImageDraw.Draw(contact)
    for row,h in enumerate(HEROES):
        for col,n in enumerate([0,8,12,20,28,36,44,52,60,72,84,96]):
            contact.paste(Image.open(after/f'{h}_{n:03}.png').convert('RGB'),(col*160,row*160+20));d.text((col*160+4,row*160+3),h+' t'+str(n*2),fill='#e1d4b0')
    contact.save(ROOT/'sequencia_depois.png')
    result={'beforeSHA':old['sha256'],'afterSHA':report['sha256'],'method':'Direct render captures: body-pixel metrics (alpha>=128) and world crops with actual shadows. Ground is actor y110+11. Floor changes above ground may be stylized flight; contact0/8 are listed for review. Not physical hardware or human gameplay.','metrics':metrics}
    (ROOT/'COMPARATIVO.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
if __name__=='__main__':main()
