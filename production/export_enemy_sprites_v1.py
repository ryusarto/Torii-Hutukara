"""Pack reviewed ImageGen cutouts; no background removal or painted frames.
Run with Pillow: python production/export_enemy_sprites_v1.py.
Source sheets remain unchanged. One scale per identity preserves relative poses.
"""
import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets/enemies/v1'
CONTRACT = {
    'hush': ('Nó do Silêncio', 88),
    'whisper': ('Sombra Disforme', 96),
    'compasso': ('Metrônomo Menor', 88),
    'espelho': ('Eco Espelho', 96),
    'abafador': ('Abafador', 92),
    'compasso_c3': ('Metrônomo Menor · Distrito', 88),
    'abafador_c3': ('Abafador · Distrito', 92),
    'c3_echo': ('Eco de Distorção', 82),
    'c3_drone': ('Drone de Retorno', 88),
    'boss': ('O Viajante Mascarado', 134),
    'voice_boss': ('Arauto da Estática', 166),
    'c3_metronome': ('O Metrônomo', 166),
    'c3_silence': ('O Silêncio', 202),
}


def gutter(image, axis):
    """Find the transparent central gutter, tolerating uneven source-cell layout."""
    alpha = image.getchannel('A').point(lambda value: 255 if value >= 16 else 0)
    size = image.width if axis == 'x' else image.height
    runs, start = [], None
    for value in range(int(size * .32), int(size * .68)):
        region = (value, 0, value + 1, image.height) if axis == 'x' else (0, value, image.width, value + 1)
        empty = alpha.crop(region).getbbox() is None
        if empty and start is None:
            start = value
        if not empty and start is not None:
            runs.append((start, value))
            start = None
    if start is not None:
        runs.append((start, int(size * .68)))
    if not runs:
        raise ValueError('No transparent gutter between poses; source needs review')
    a, b = max(runs, key=lambda pair: (pair[1] - pair[0], -abs(sum(pair) / 2 - size / 2)))
    return (a + b) // 2


def export():
    entries, evidence = {}, {}
    for key, (name, height) in CONTRACT.items():
        candidates = [ASSETS / 'source' / (key + suffix + '.png') for suffix in ['-rust', '-padded', '']]
        source = next((path for path in candidates if path.exists()), candidates[-1])
        if not source.exists():
            continue  # Unreviewed/raw concepts are never silently integrated.
        image = Image.open(source).convert('RGBA')
        sx, sy = gutter(image, 'x'), gutter(image, 'y')
        xs, ys = [0, sx, image.width], [0, sy, image.height]
        frames, boxes = [], []
        for index in range(4):
            col, row = index % 2, index // 2
            cell = image.crop((xs[col], ys[row], xs[col + 1], ys[row + 1]))
            cw, ch = cell.size
            # Ignore nearly invisible encoder/segmentation speckles for framing only.
            # Original alpha and RGB are preserved inside each packed crop.
            box = cell.getchannel('A').point(lambda value: 255 if value >= 16 else 0).getbbox()
            if not box or box[0] <= 0 or box[1] <= 0 or box[2] >= cw or box[3] >= ch:
                raise ValueError(f'{key}/{index}: empty or touching cell edge; review source')
            boxes.append(box)
            frames.append(cell.crop(box))
        scale = min(232 / max(f.width for f in frames), 204 / max(f.height for f in frames))
        atlas = Image.new('RGBA', (512, 512))
        normalized = []
        for index, frame in enumerate(frames):
            frame = frame.resize((max(1, round(frame.width * scale)), max(1, round(frame.height * scale))),
                                 Image.Resampling.NEAREST)
            x, y = (index % 2) * 256 + 128 - frame.width // 2, (index // 2) * 256 + 224 - frame.height
            atlas.paste(frame, (x, y))
            normalized.append([x % 256, y % 256, frame.width, frame.height])
        destination = ASSETS / 'atlas' / (key + '.png')
        destination.parent.mkdir(parents=True, exist_ok=True)
        atlas.save(destination, optimize=True)
        entries[key] = {'name': name, 'atlas': 'atlas/' + key + '.png', 'height': height,
                        'source': 'source/' + source.name}
        evidence[key] = {'sourceDimensions': image.size, 'sourceGridCuts': [sx, sy], 'sourceBounds': boxes,
                         'normalizedBounds': normalized, 'scale': scale,
                         'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
                         'atlasSha256': hashlib.sha256(destination.read_bytes()).hexdigest()}
    manifest = {'version': 1, 'cell': 256, 'grid': [2, 2], 'pivot': [128, 224],
                'states': ['idle', 'prepare', 'strike', 'hurt'], 'filter': 'nearest',
                'notes': 'Four discrete front poses, not walk cycles or directional animation.',
                'enemies': entries}
    (ASSETS / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    (ASSETS / 'VALIDACAO_EXPORTACAO.json').write_text(json.dumps(evidence, indent=2) + '\n')
    print('Exported', len(entries), 'reviewed identities:', ', '.join(entries))


if __name__ == '__main__':
    export()
