#!/usr/bin/env python3
"""Pack authored inbetweens; existing V5 frame pixels are copied unchanged.

No pose is interpolated in this script. New art comes from the four recorded
imagegen outputs. Only crop, uniform nearest-neighbor scaling and translation
normalize the generated art to the established 256px / (128,224) contract.
"""
from pathlib import Path
from PIL import Image
import argparse, hashlib, json, statistics

p=argparse.ArgumentParser()
p.add_argument('--v5',type=Path,required=True)
p.add_argument('--output',type=Path,default=Path(__file__).resolve().parents[1])
args=p.parse_args();out=args.output
dirs=['down','left','up','right'];rows=[f'{v}/{d}' for v in ['unmasked','masked'] for d in dirs]
timings=[32.5,32.5,65]*4
schedule=[('original',0),('new',0),('original',1),('original',2),('new',1),('original',3),('original',4),('new',2),('original',5),('original',6),('new',3),('original',7)]
sha=lambda b:hashlib.sha256(b).hexdigest()
def core(im):
    box=im.getchannel('A').point(lambda a:255 if a>=128 else 0).getbbox()
    if box is None:raise ValueError('empty opaque body')
    return box
def digest(im):return sha(im.tobytes())
animations=[];records=[];checks=[];source_hashes={}
(out/'atlas').mkdir(parents=True,exist_ok=True)
for hero in ['franco','ryuchi']:
    src_path=args.v5/f'{hero}_run.png'
    original=Image.open(src_path).convert('RGBA')
    assert original.size==(2304,2048)
    source_hashes[hero]=sha(src_path.read_bytes())
    atlas=Image.new('RGBA',(13*256,8*256),(0,0,0,0))
    for row in range(8):
        variant='masked' if row>=4 else 'unmasked';direction=dirs[row%4]
        generated=Image.open(out/'originais'/f'{hero}_{variant}_inbetweens.png').convert('RGBA')
        old=[original.crop((i*256,row*256,(i+1)*256,(row+1)*256)) for i in range(8)]
        old_boxes=[core(f) for f in old]
        raw=[];raw_boxes=[];source_cells=[]
        for col in range(4):
            cell=(round(col*generated.width/4),round((row%4)*generated.height/4),round((col+1)*generated.width/4),round(((row%4)+1)*generated.height/4))
            f=generated.crop(cell);raw.append(f);raw_boxes.append(core(f));source_cells.append(cell)
        scale=statistics.mean(b[3]-b[1] for b in old_boxes)/statistics.mean(b[3]-b[1] for b in raw_boxes)
        new=[]
        for i,(f,b) in enumerate(zip(raw,raw_boxes)):
            # The meaningful body is inside the high-alpha bounds. Two pixels
            # retain the authored antialias edge without distant alpha specks.
            crop_box=(max(0,b[0]-2),max(0,b[1]-2),min(f.width,b[2]+2),min(f.height,b[3]+2))
            body=f.crop(crop_box)
            size=(max(1,round(body.width*scale)),max(1,round(body.height*scale)))
            body=body.resize(size,Image.Resampling.NEAREST)
            scaled_core=core(body)
            a,z=old_boxes[i*2],old_boxes[i*2+1]
            center=statistics.mean([(a[0]+a[2])/2,(z[0]+z[2])/2])
            sole=statistics.mean([a[3],z[3]])
            dx=round(center-(scaled_core[0]+scaled_core[2])/2)
            dy=round(sole-scaled_core[3])
            assert 0<=dx and dx+body.width<=256 and 0<=dy and dy+body.height<=256
            frame=Image.new('RGBA',(256,256),(0,0,0,0));frame.paste(body,(dx,dy))
            new.append(frame)
            name=f'novos/{hero}/{variant}/{direction}/run_between_{i*2:02d}_{i*2+1:02d}.png'
            dest=out/name;dest.parent.mkdir(parents=True,exist_ok=True);frame.save(dest)
            records.append({'hero':hero,'variant':variant,'direction':direction,'row':row,'between':[i*2,i*2+1],
                'file':name,'source':f'originais/{hero}_{variant}_inbetweens.png','sourceCell':list(source_cells[i]),
                'sourceCrop':list(crop_box),'uniformRowScale':scale,'translation':[dx,dy],
                'bbox':list(core(frame)),'rgbaSha256':digest(frame),'authoredBy':'imagegen built-in'})
        assert len({digest(f) for f in new})==4
        assert all(digest(f) not in {digest(o) for o in old} for f in new)
        for index,(kind,source_index) in enumerate(schedule):atlas.paste(old[source_index] if kind=='original' else new[source_index],(index*256,row*256))
        atlas.paste(old[0],(12*256,row*256))
        for index,(kind,source_index) in enumerate(schedule):
            if kind=='original':assert atlas.crop((index*256,row*256,(index+1)*256,(row+1)*256)).tobytes()==old[source_index].tobytes()
        assert atlas.crop((12*256,row*256,13*256,(row+1)*256)).tobytes()==old[0].tobytes()
        checks.append({'hero':hero,'row':row,'originalFramesPreserved':8,'newFramesUnique':4,'closureMatches':True,'cycleMs':sum(timings)})
        animations.append({'hero':hero,'variant':variant,'state':'run','direction':direction,'row':row,'frames':13,'playFrames':12,
            'loop':True,'holdLast':False,'atlas':f'atlas/{hero}_run.png','frameMs':520/12,'frameDurationsMs':timings,'cycleMs':520,
            'closureSha256':digest(old[0]),'frameSources':[{'kind':k,'index':i} for k,i in schedule]})
    atlas.save(out/'atlas'/f'{hero}_run.png')
manifest={'version':1,'release':'V6-locomocao','extends':'V5','states':['run'],'cell':[256,256],'pivot':[128,224],
    'rows':rows,'sourceV5Sha256':source_hashes,'animations':animations,'newFrames':records,
    'production':{'newPoseMethod':'authored with imagegen built-in','normalization':'crop / uniform row scale / nearest-neighbor / translation',
        'noPoseBlending':True,'noImageRotation':True,'v5OriginalPixelsUnchanged':True},
    'validation':{'static':True,'engineIntegration':False,'physicalDevice':False}}
(out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
(out/'VALIDACAO.json').write_text(json.dumps({'staticChecks':checks,'rows':16,'originalFrameCopies':128,'newAuthoredFrames':64,
    'atlasSize':[3328,2048],'sourceV5Sha256':source_hashes,'engineTested':False,
    'limits':'Static packing and visual contact review do not prove animation quality in gameplay.'},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'output':str(out),'rows':16,'newFrames':64,'originalCopiesPreserved':128,'cycleMs':520}))
