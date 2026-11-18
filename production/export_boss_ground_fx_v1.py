"""Pack generated FX cells without painting or removing backgrounds.

Keep whole cells and one scale, so growth and dissipation survive export.
Requires Pillow. Run: python production/export_boss_ground_fx_v1.py
"""
from pathlib import Path
from PIL import Image
import hashlib
import json

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets/boss-ground-fx/v1'


def export():
    clips, audit = {}, {}
    for key in ['pulse', 'static', 'scrap', 'void']:
        source = ASSETS / 'source' / (key + '.png')
        im = Image.open(source).convert('RGBA')
        assert im.getchannel('A').histogram()[0] / (im.width * im.height) > .25, key + ': background needs review'
        atlas = Image.new('RGBA', (1024, 512))
        hashes, bounds = [], []
        for frame in range(8):
            col, row = frame % 4, frame // 4
            cell = im.crop((round(col * im.width / 4), round(row * im.height / 2),
                            round((col + 1) * im.width / 4), round((row + 1) * im.height / 2)))
            b = cell.getchannel('A').point(lambda a: 255 if a >= 16 else 0).getbbox()
            assert b and b[0] > 0 and b[1] > 0 and b[2] < cell.width and b[3] < cell.height, (key, frame, b)
            cell = cell.resize((256, 256), Image.Resampling.NEAREST)
            atlas.paste(cell, (col * 256, row * 256))
            hashes.append(hashlib.sha256(cell.tobytes()).hexdigest())
            bounds.append(cell.getchannel('A').point(lambda a: 255 if a >= 16 else 0).getbbox())
        assert len(set(hashes)) == 8, key + ': duplicate frames'
        dest = ASSETS / 'atlas' / (key + '.png')
        atlas.save(dest, optimize=True)
        clips[key] = {'atlas': 'atlas/' + key + '.png', 'frames': 8, 'source': 'source/' + source.name}
        audit[key] = {'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
                      'atlasSha256': hashlib.sha256(dest.read_bytes()).hexdigest(),
                      'bounds': bounds, 'frameHashes': hashes}
    manifest = {'version': 1, 'cell': 256, 'columns': 4, 'rows': 2,
                'preparation': [0, 1, 2], 'release': [3, 4], 'dissipation': [5, 6, 7],
                'filter': 'nearest', 'clips': clips}
    (ASSETS / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    (ASSETS / 'VALIDACAO_EXPORTACAO.json').write_text(json.dumps(audit, indent=2) + '\n')
    print('Exported 4 ground FX clips, 32 distinct frames; whole-cell scale and alpha preserved.')


if __name__ == '__main__':
    export()
