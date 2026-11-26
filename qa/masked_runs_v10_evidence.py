"""Assemble actual masked/unmasked browser loops without creating sprite art."""
from pathlib import Path
import json,sys
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1]/'qa/beta-1.17.0/masked-runs-v10'
DIRECTIONS=('down','left','up','right')
def main():
    stage=sys.argv[1]if len(sys.argv)>1 else'after';folder=ROOT/stage;r=json.loads((folder/'REPORT.json').read_text());frames=[]
    for n in range(60):
        im=Image.new('RGB',(1280,320),'#15151e');d=ImageDraw.Draw(im)
        for h,hero in enumerate(['franco','ryuchi']):
            for col,direction in enumerate(DIRECTIONS):
                for row,variant in enumerate(['unmasked','masked']):
                    x=(h*4+col)*160;y=row*160;im.paste(Image.open(folder/f'{hero}_{variant}_{direction}_{n:03}.png').convert('RGB'),(x,y+20));d.text((x+3,y+3),hero+' '+variant+' '+direction,fill='#e8d7ac')
        frames.append(im)
    frames[0].save(ROOT/f'masked_runs_{stage}.gif',save_all=True,append_images=frames[1:],duration=33,loop=0,optimize=True)
    count=8 if stage=='canonical' or any(c.get('nativeChosen')for c in r['cases']) else 16;film=Image.new('RGB',(count*160,8*160),'#15151e');d=ImageDraw.Draw(film)
    for h,hero in enumerate(['franco','ryuchi']):
        for di,direction in enumerate(DIRECTIONS):
            row=h*4+di;c=next(x for x in r['cases']if x['hero']==hero and x['masked']and x['seat']==0 and x['direction']==direction);index={}
            for i,s in enumerate(c['samples']):
                if i%2==0 and s['state']in ['run-v8','run']:index.setdefault(s['col']//2 if count==8 else s['col'],i//2)
            for col in range(count):
                if col not in index:continue
                x=col*160;y=row*160;film.paste(Image.open(folder/f'{hero}_masked_{direction}_{index[col]:03}.png').convert('RGB'),(x,y+20));d.text((x+3,y+3),hero+' '+direction+' f'+str(col),fill='#e8d7ac')
    film.save(ROOT/f'masked_phases_{stage}.png')
    summary=[{k:c[k]for k in ['hero','masked','seat','direction','topRange','floorMax','badRoute']}for c in r['cases']]
    (ROOT/f'masked_metrics_{stage}.json').write_text(json.dumps({'sha256':r['sha256'],'cases':summary},indent=2)+'\n')
if __name__=='__main__':main()
