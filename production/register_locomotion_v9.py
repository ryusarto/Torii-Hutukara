"""Measure existing artwork; emit per-pose render registration, without changing PNGs.

The old pack anchored the lowest boot of every drawing and added another lift.
Here head/upper-body scale stays consistent and the engine keeps its world pivot.
Preview strips are QA renderings, not replacement character artwork.
"""
from pathlib import Path
import hashlib, importlib.util, json, math, sys
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/protagonistas/v9-registro'
OLD = ROOT / 'assets/protagonistas/v8-corrida'
sys.path.insert(0, str(OLD / 'tools'))
spec = importlib.util.spec_from_file_location('stride_pack', OLD / 'tools/pack.py')
pack = importlib.util.module_from_spec(spec); spec.loader.exec_module(pack)
CELL, PIVOT, DISPLAY = 256, (128, 224), 88 / 256
HEROES = ('franco', 'ryuchi', 'alt', 'katana', 'synth', 'percussion')
cache = {}

def opened(path):
    if path not in cache: cache[path] = Image.open(path).convert('RGBA')
    return cache[path]

def art(hero, state, row):
    if hero in ('franco', 'ryuchi'):
        version = 'v5' if state == 'idle' or state == 'canonical_walk' else 'v7-locomocao'
        state = 'walk' if state == 'canonical_walk' else state
        return ROOT / f'assets/protagonistas/{version}/atlas/{hero}_{state}.png', row
    state = 'walk' if state == 'canonical_walk' else state
    if hero in ('alt', 'katana'):
        return ROOT / f'assets/variantes/ninja-arqueiro-v1/atlas/{hero}_{state}.png', row
    name = {'synth': 'franco_sintetizador', 'percussion': 'ryuchi_percussionista'}[hero]
    variant = 'masked' if row >= 4 else 'unmasked'
    return ROOT / f'assets/variantes/percussao-sintetizador-v1/atlas/{name}_{variant}_{state}.png', row % 4

def poses(path, row, count):
    im = opened(path)
    return [im.crop((i*CELL,row*CELL,(i+1)*CELL,(row+1)*CELL)) for i in range(count)]

def measure(im):
    a = np.asarray(im)[:, :, 3]
    parts = pack.components(a)
    if not parts: raise ValueError('Empty pose')
    lines = parts[0]
    x0, x1 = min(x for _,x,_ in lines), max(x for _,_,x in lines)
    y0, y1 = min(y for y,_,_ in lines), max(y for y,_,_ in lines)+1
    top = [r for r in lines if r[0] < y0 + (y1-y0)*.30]
    # Ignore tiny detached generation remnants and thin hair tips in the width.
    spans = {}
    for y,l,r in top:
        if y not in spans: spans[y] = [l,r]
        else: spans[y] = [min(l,spans[y][0]),max(r,spans[y][1])]
    widths = [r-l for l,r in spans.values()]
    width = float(np.percentile(widths, 85))
    wide = [(l+r)/2 for l,r in spans.values() if r-l >= width*.8]
    return dict(top=y0, bottom=y1, height=y1-y0, width=width,
                headX=float(np.median(wide)), bounds=[x0,y0,x1,y1])

def registrations(items, target, state):
    measured = [measure(p) for p in items]
    entries = []
    for frame,m in enumerate(measured):
        # Per-frame scaling was evaluated and rejected: it changes the head and
        # equipment proportions. Correct registration is translation only.
        scale = 1
        # Two small smooth weight transfers, no extra artificial flight offset.
        bob = 0 if state == 'idle' else -.65/DISPLAY * (1-math.cos(frame/len(items)*4*math.pi))/2
        target_top = target['top'] + bob if state == 'run' else m['top']
        ox = target['headX']-PIVOT[0] - (m['headX']-PIVOT[0])*scale if state == 'run' else 0
        oy = target_top-PIVOT[1] - (m['top']-PIVOT[1])*scale
        if state == 'run':
            # A stable upper body must never plant a boot below the world floor.
            # Airborne boots may rise; do not move the simulation or its shadow.
            alpha=np.asarray(items[frame])[:,:,3]
            solid_y=np.where(alpha>=128)[0]
            bottom=int(solid_y.max())+1
            oy=min(oy,224-bottom)
        entries.append(dict(offset=[round(ox,4),round(oy,4)],scale=round(scale,5)))
    return entries, measured

def rendered(im, reg):
    s=reg['scale']; dx,dy=reg['offset']
    size=max(1,round(88*s)); tile=im.resize((size,size),Image.Resampling.NEAREST)
    result=Image.new('RGBA',(120,120))
    result.alpha_composite(tile,(round(60+(dx-128*s)*DISPLAY),round(104+(dy-224*s)*DISPLAY)))
    return result

def main():
    OUT.mkdir(parents=True,exist_ok=True); (OUT/'previews').mkdir(exist_ok=True)
    document={'version':9,'cell':CELL,'pivot':list(PIVOT),
              'convention':'offset is relative to world pivot, in source pixels: dest=(world + (offset-pivot*scale)*88/256)',
              'artwork':'Existing source PNGs unchanged. Registration measurements only. No invented intermediate poses.',
              'heroes':{}}; audit={}; hashes={}
    for hero in HEROES:
        rows=4 if hero in ('alt','katana') else 8
        entries={'registration':[],'walkRegistration':[],'fallbackRunRegistration':[],'idleRegistration':[],
                 'walkFrameMap':[],'fallbackRunFrameMap':[]}
        if hero in ('franco','ryuchi'):
            # V5's eight masked poses are preserved byte-for-byte at the even
            # columns of V7. Their gait has regular support, unlike the long
            # masked V8 flight. Unmasked V8 and its16 drawings stay untouched.
            entries['nativeRunRows']=[4,5,6,7]
        audit[hero]={}
        for row in range(rows):
            path,rr=art(hero,'canonical_walk',row)
            reference=[measure(p) for p in poses(path,rr,8)]
            target={key:float(np.median([m[key] for m in reference])) for key in ('width','top','headX','height')}
            # Canonical walk has its established planted-foot pivot at y=224.
            target['top']=224-target['height']
            for state,key in [('run','registration'),('walk','walkRegistration'),('fallback_run','fallbackRunRegistration'),('idle','idleRegistration')]:
                if key=='registration': path=OLD/'atlas'/f'{hero}_run.png';rr=row;count=16
                else:
                    actual='run' if state=='fallback_run' else state
                    path,rr=art(hero,actual,row);count=16 if hero in ('franco','ryuchi') and actual!='idle' else 8
                items=poses(path,rr,count)
                if state == 'run':
                    samples=[measure(p) for p in items]
                    actual_target={**target,'top':float(np.median([samples[i]['top'] for i in (0,8)])),
                                   'headX':float(np.median([m['headX'] for m in samples]))}
                else: actual_target=target
                regs,measured=registrations(items,actual_target,state)
                frame_map=list(range(count))
                if key in ('walkRegistration','fallbackRunRegistration'):
                    if count == 16:
                        evens=[m['height'] for m in measured[::2]];odds=[m['height'] for m in measured[1::2]]
                        # V7 stores the eight canonical frames at even columns.
                        # Some generated odd drawings have different proportions.
                        # Use the intact original loop for those specific rows.
                        if abs(float(np.median(evens))-float(np.median(odds)))>8:
                            frame_map=list(range(0,16,2))
                    if key=='fallbackRunRegistration' and hero in ('franco','ryuchi') and row>=4:
                        frame_map=list(range(0,16,2))
                    entries['walkFrameMap' if key=='walkRegistration' else 'fallbackRunFrameMap'].append(frame_map)
                entries[key].append(regs)
                hashes[str(path.relative_to(ROOT))]=hashlib.sha256(path.read_bytes()).hexdigest()
                before_top=[m['top']*DISPLAY for m in measured]
                after_top=[((r['offset'][1]-224*r['scale'])+m['top']*r['scale'])*DISPLAY for m,r in zip(measured,regs)]
                after_floor=[((r['offset'][1]-224*r['scale'])+m['bottom']*r['scale'])*DISPLAY for m,r in zip(measured,regs)]
                audit[hero][f'{key}/{row}']={'source':str(path.relative_to(ROOT)),'count':count,'selectedFrameMap':frame_map,'topRangeBefore':round(max(before_top)-min(before_top),3),'topRangeAfter':round(max(after_top[i] for i in frame_map)-min(after_top[i] for i in frame_map),3),'floorRangeAfter':round(max(after_floor[i] for i in frame_map)-min(after_floor[i] for i in frame_map),3),'scaleRange':[1,1],'target':actual_target}
                if key in ('registration','walkRegistration'):
                    preview=Image.new('RGB',(120*count,260),(22,23,33));q=ImageDraw.Draw(preview)
                    for i,(im,reg) in enumerate(zip(items,regs)):
                        selected=frame_map[min(len(frame_map)-1,i*len(frame_map)//count)]
                        original=rendered(im,{'scale':1,'offset':[0,0]});fixed=rendered(items[selected],regs[selected])
                        preview.paste(original,(i*120,10),original);preview.paste(fixed,(i*120,140),fixed)
                        q.line((i*120,114,(i+1)*120,114),fill=(91,91,98));q.line((i*120,244,(i+1)*120,244),fill=(91,91,98))
                    preview.save(OUT/'previews'/f'{hero}_{key}_{row}.png')
        document['heroes'][hero]=entries
        print(hero,flush=True)
    (OUT/'registration.json').write_text(json.dumps(document,indent=2)+'\n')
    (OUT/'measurements.json').write_text(json.dumps({'measurements':audit,'sourceSha256':hashes,'limits':['Head/upper-body silhouettes are measurement proxies, not anatomical truth.','Visual loops at actual game scale must pass before accepting a registration.']},indent=2)+'\n')

if __name__=='__main__': main()
