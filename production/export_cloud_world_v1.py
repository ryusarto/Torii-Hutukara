#!/usr/bin/env python3
"""Pack generated whole cells; preserve alpha, common pivot and growth."""
import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'assets/cloud-world/v1'
source = DEST / 'source/rebuild.png'
image = Image.open(source).convert('RGBA')
atlas = Image.new('RGBA', (1024, 512))
frames, hashes = [], []
for index in range(8):
    x, y = index % 4, index // 4
    box = (round(x * image.width / 4), round(y * image.height / 2),
           round((x + 1) * image.width / 4), round((y + 1) * image.height / 2))
    frame = image.crop(box).resize((256, 256), Image.Resampling.NEAREST)
    # First wisps are intentionally translucent; the formed cloud is opaque.
    assert frame.getchannel('A').getextrema()[1] > (100 if index < 2 else 200)
    hashes.append(hashlib.sha256(frame.tobytes()).hexdigest())
    frames.append(frame)
    atlas.paste(frame, (x * 256, y * 256))
assert len(set(hashes)) == 8
assert atlas.getchannel('A').getextrema()[0] == 0
(DEST / 'atlas').mkdir(parents=True, exist_ok=True)
atlas.save(DEST / 'atlas/rebuild.png')
original = json.loads((ROOT / 'assets/cenarios/v2/manifest.json').read_text())
items = {k: v for k, v in original['items'].items()
         if k.startswith(('cloud_top_', 'cloud_edge_', 'cloud_inner_', 'cloud_outer_'))
         or k == 'ceu_nuvens_fundo'}
manifest = {'version': 'cloud-world-v1', 'rebuild': {
    'atlas': 'atlas/rebuild.png', 'cols': 4, 'rows': 2, 'frames': 8,
    'cellWidth': 256, 'cellHeight': 256, 'pivot': [128, 128], 'fps': 8,
    'loop': False, 'filtering': 'nearest', 'alpha': True},
    'original': {'items': items, 'sheets': {
        'A01': 'assets/cenarios/v2/atlas/C3_SUPERFICIES_URBANAS.png',
        'A04': 'assets/cenarios/v2/atlas/C3_NUVENS_ENCAIXES.png'}}}
cinema_source = DEST / 'source/sky_portal.png'
if cinema_source.exists():
    (DEST / 'backgrounds').mkdir(exist_ok=True)
    Image.open(cinema_source).convert('RGB').resize((1024, 576), Image.Resampling.NEAREST).save(
        DEST / 'backgrounds/sky_portal.png', optimize=True)
    manifest['cinema'] = {'file': 'backgrounds/sky_portal.png', 'size': [1024, 576]}
(DEST / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
audit = {'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
         'atlasSha256': hashlib.sha256((DEST / 'atlas/rebuild.png').read_bytes()).hexdigest(),
         'sourceSize': list(image.size), 'atlasSize': list(atlas.size),
         'frameHashes': hashes, 'uniqueFrames': len(set(hashes)),
         'alpha': 'original generated alpha preserved; no background removal',
         'packing': 'whole cells, common canvas; no independent tight crop'}
if cinema_source.exists():
    audit['cinemaSourceSha256'] = hashlib.sha256(cinema_source.read_bytes()).hexdigest()
    audit['cinemaSha256'] = hashlib.sha256((DEST / 'backgrounds/sky_portal.png').read_bytes()).hexdigest()
(DEST / 'VALIDACAO_EXPORTACAO.json').write_text(json.dumps(audit, ensure_ascii=False, indent=2) + '\n')
qa = ROOT / 'qa/environment-world-v1'
qa.mkdir(parents=True, exist_ok=True)
previews = []
for frame in frames:
    bg = Image.new('RGBA', (256, 256), '#343140')
    bg.alpha_composite(frame)
    previews.append(bg.convert('RGB'))
previews[-1] = previews[-1].copy()
previews[0].save(qa / 'NUVEM_RECONSTRUCAO.gif', save_all=True,
                 append_images=previews[1:], duration=[150]*7+[650], loop=0)
print(json.dumps(audit, ensure_ascii=False))
