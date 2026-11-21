"""Verify the published registration and compare the profile silhouettes to their original run."""
from pathlib import Path
import hashlib,json,statistics
import numpy as np
from PIL import Image
from reference import base,groups
def cells(image,row,n):
    return [image.crop((i*256,row*256,(i+1)*256,(row+1)*256)) for i in range(n)]
def measures(cell):
    alpha=cell.getchannel('A').point(lambda a:255 if a>=128 else 0)
    l,t,r,b=alpha.getbbox()
    return [l,t,r,b],alpha.crop((0,int(t+.76*(b-t)),256,b)).getbbox()
def spans(cells):
    bounds=[measures(c)[1] for c in cells]
    return [min(e[2]-e[0] for e in bounds),max(e[2]-e[0] for e in bounds)]
result={'bodyDrawings':0,'comparisons':[],'sources':{}}
for hero,variant,path,refrow in groups():
    original=Image.open(path);new=Image.open(base/'atlas'/f'{hero}_run.png')
    source=base/'source'/f'{hero}_{variant}_generated.png'
    result['sources'][source.name]=hashlib.sha256(source.read_bytes()).hexdigest()
    assert new.size==(4096,1024 if hero in ('alt','katana') else 2048)
    for d,direction in enumerate(('down','left','up','right')):
        clips=cells(new,(4 if variant=='masked' else 0)+d,16)
        assert len({hashlib.sha256(c.tobytes()).digest() for c in clips})==16
        old=cells(original,refrow+d,16 if hero in ("franco","ryuchi") else 8)
        assert not {c.tobytes() for c in old}.intersection({c.tobytes() for c in clips})
        for c in clips:
            l,t,r,b=measures(c)[0]
            assert l>=2 and t>=2 and r<=254 and b<=224,(hero,variant,d,[l,t,r,b])
        result['bodyDrawings']+=len(clips)
        if direction in ('left','right'):
            result['comparisons'].append({'hero':hero,'variant':variant,'direction':direction,'originalLowerSpanMinMaxPx':spans(old),'newLowerSpanMinMaxPx':spans(clips),'newContactAndAirBottomsPx':sorted({measures(c)[0][3] for c in clips})})
assert result['bodyDrawings']==640
(base/'validation.json').write_text(json.dumps(result,indent=2)+'\n')
