#!/usr/bin/env python3
"""Export building cells without repainting their generated alpha or pixels."""
import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'assets/environment-volume/v1'
groups = {
    'c1': [('c1_house', .435), ('c1_shop', .425), ('c1_inn', .435), ('c1_archive', .425)],
    'c2': [('c2_home', .45), ('c2_workshop', .415), ('c2_shop', .445), ('c2_radio', .415)]}
manifest = {'version': 'environment-volume-v1', 'cell': 384, 'columns': 2, 'rows': 2,
            'filtering': 'nearest', 'sheets': {}, 'items': {}}
audit = {}
for key, entries in groups.items():
    source = DEST / ('source/' + key + '.png')
    image = Image.open(source).convert('RGBA')
    atlas = Image.new('RGBA', (768, 768))
    hashes = []
    for i, (name, door_x) in enumerate(entries):
        x, y = i % 2, i // 2
        box = (round(x * image.width / 2), round(y * image.height / 2),
               round((x + 1) * image.width / 2), round((y + 1) * image.height / 2))
        frame = image.crop(box).resize((384, 384), Image.Resampling.NEAREST)
        assert frame.getchannel('A').getextrema() == (0, 255)
        # Bounds describe the opaque architectural body; atlas alpha stays intact.
        b = frame.getchannel('A').point(lambda v: 255 if v > 32 else 0).getbbox()
        assert b and b[2] - b[0] > 200 and b[3] - b[1] > 200
        content = [x * 384 + b[0], y * 384 + b[1], b[2] - b[0], b[3] - b[1]]
        pivot = [round(door_x * 384) - b[0], b[3] - b[1]]
        manifest['items'][name] = {'sheet': key, 'frame': i, 'content': content,
                                   'pivot': pivot, 'pivotRole': 'front doorway threshold'}
        atlas.paste(frame, (x * 384, y * 384))
        hashes.append(hashlib.sha256(frame.tobytes()).hexdigest())
    assert len(set(hashes)) == 4
    (DEST / 'atlas').mkdir(parents=True, exist_ok=True)
    target = DEST / ('atlas/' + key + '.png')
    atlas.save(target)
    manifest['sheets'][key] = {'file': 'atlas/' + key + '.png', 'size': [768, 768]}
    audit[key] = {'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
                  'atlasSha256': hashlib.sha256(target.read_bytes()).hexdigest(),
                  'frameHashes': hashes, 'alpha': 'preserved', 'sourceSize': list(image.size)}
(DEST / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
(DEST / 'VALIDACAO_EXPORTACAO.json').write_text(json.dumps(audit, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(audit, ensure_ascii=False))
