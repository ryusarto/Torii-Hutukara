"""Crop/pack reviewed eight-frame ImageGen sheets. Never paint or remove backgrounds.

One scale per clip, matched to the approved static idle. Overscan leaves room for
expanded limbs without shrinking each frame independently. Alpha is preserved.
"""
import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets/boss-animations/v2'
STATIC = ROOT / 'assets/enemies/v1'
CLIPS = {'boss_cast': ('boss', 'boss_cast-cutout'),
         'boss_charge': ('boss', 'boss_charge-cutout'),
         'voice_boss_cast': ('voice_boss', 'voice_boss_cast'),
         'c3_metronome_cast': ('c3_metronome', 'c3_metronome_cast'),
         'c3_silence_cast': ('c3_silence', 'c3_silence_cast')}


def cut(image, axis, fraction, radius):
    alpha = image.getchannel('A').point(lambda a: 255 if a >= 16 else 0)
    length = image.width if axis == 'x' else image.height
    runs, start = [], None
    lo, hi = int(length * (fraction-radius)), int(length * (fraction+radius))
    for i in range(lo, hi):
        box = (i, 0, i+1, image.height) if axis == 'x' else (0, i, image.width, i+1)
        if alpha.crop(box).getbbox() is None:
            if start is None:
                start = i
        elif start is not None:
            runs.append((start, i)); start = None
    if start is not None:
        runs.append((start, hi))
    if not runs:
        raise ValueError(f'No transparent gutter: {axis}/{fraction}')
    a, b = max(runs, key=lambda p: p[1]-p[0])
    return (a+b)//2


def export():
    static = json.loads((STATIC/'manifest.json').read_text())
    entries, audit = {}, {}
    for key, (identity, source) in CLIPS.items():
        path = ASSETS/'source'/(source+'.png')
        im = Image.open(path).convert('RGBA')
        alpha = im.getchannel('A')
        assert alpha.histogram()[0]/(im.width*im.height) > .4, key+' background'
        xs = [0]+[cut(im, 'x', f, .055) for f in [.25, .5, .75]]+[im.width]
        ys = [0, cut(im, 'y', .5, .09), im.height]
        frames, boxes = [], []
        for n in range(8):
            c, r = n % 4, n // 4
            region = im.crop((xs[c], ys[r], xs[c+1], ys[r+1]))
            b = region.getchannel('A').point(lambda a: 255 if a >= 16 else 0).getbbox()
            assert b and b[0] > 0 and b[1] > 0 and b[2] < region.width and b[3] < region.height, (key, n, b)
            boxes.append(b); frames.append(region.crop(b))
        approved = static['enemies'][identity]
        old = Image.open(STATIC/approved['atlas']).crop((0, 0, 256, 256))
        b = old.getchannel('A').point(lambda a: 255 if a >= 16 else 0).getbbox()
        target = b[3]-b[1]
        scale = min(target/frames[0].height, 304/max(f.width for f in frames), 264/max(f.height for f in frames))
        atlas = Image.new('RGBA', (1280, 640)); packed = []; hashes = []
        for n, frame in enumerate(frames):
            frame = frame.resize((round(frame.width*scale), round(frame.height*scale)), Image.Resampling.NEAREST)
            x, y = 160-frame.width//2, 280-frame.height
            assert x >= 4 and y >= 4 and x+frame.width <= 316
            atlas.paste(frame, (n%4*320+x, n//4*320+y))
            packed.append([x, y, frame.width, frame.height])
            hashes.append(hashlib.sha256(frame.tobytes()).hexdigest())
        assert len(set(hashes)) == 8, key+' duplicate animation frames'
        dest = ASSETS/'atlas'/(key+'.png'); atlas.save(dest, optimize=True)
        entries[key] = {'boss': identity, 'atlas': 'atlas/'+key+'.png', 'frames': 8,
                        'scale': approved['height']/256, 'source': 'source/'+path.name}
        audit[key] = {'sourceSha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                      'atlasSha256': hashlib.sha256(dest.read_bytes()).hexdigest(),
                      'cuts': [xs, ys], 'bounds': boxes, 'packed': packed,
                      'sourceScale': scale, 'staticIdleHeight': target,
                      'animatedIdleHeight': packed[0][3], 'frameHashes': hashes}
    manifest = {'version': 2, 'cell': 320, 'columns': 4, 'rows': 2, 'pivot': [160, 280],
                'filter': 'nearest', 'frames': 8, 'preparation': [0,1,2,3],
                'release': 4, 'recovery': [5,6,7], 'clips': entries}
    (ASSETS/'manifest.json').write_text(json.dumps(manifest, indent=2)+'\n')
    (ASSETS/'VALIDACAO_EXPORTACAO.json').write_text(json.dumps(audit, indent=2)+'\n')
    print('Exported 5 clips / 40 distinct frames, approved idle scale, preserved RGBA.')


if __name__ == '__main__':
    export()
