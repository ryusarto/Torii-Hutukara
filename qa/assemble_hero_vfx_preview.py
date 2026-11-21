"""Assemble real-time combat footage. Arguments: old captures, new captures, gallery, [group captures]."""
import hashlib
import html
import json
import sys
from functools import lru_cache
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


HEROES = {
    'franco': 'Franco', 'ryuchi': 'Ryuchi', 'alt': 'Franco · Arqueiro',
    'katana': 'Ryuchi · Katana', 'synth': 'Franco · Sintetizador',
    'percussion': 'Ryuchi · Percussionista',
}
MOVES = {
    'basic': 'J · Ataque', 'second': 'J · Segundo golpe', 'third': 'J · Terceiro golpe',
    'skill': 'Z · Técnica', 'advanced': 'X · Avançado', 'super': 'K · Super',
}
ACTIONS = ['basic', 'skill', 'advanced', 'super']
WIDTH, HEIGHT, COLUMNS, COUNT = 256, 154, 6, 36
FRAME_MS = [round((i + 1) * 1000 / 24) - round(i * 1000 / 24) for i in range(COUNT)]


def report(directory):
    data = json.loads((directory / 'captures.json').read_text())
    extra_file = directory / 'extra-captures.json'
    if extra_file.exists():
        extra = json.loads(extra_file.read_text())
        assert extra['sha'] == data['sha']
        data['cases'].update(extra['cases'])
    return data


@lru_cache(maxsize=None)
def font(size):
    for file in ('/System/Library/Fonts/Supplemental/Arial.ttf',
                 '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'):
        if Path(file).is_file():
            return ImageFont.truetype(file, size)
    return ImageFont.load_default()


def frame(raw, index):
    x, y = index % COLUMNS * WIDTH, index // COLUMNS * HEIGHT
    return raw.crop((x, y, x + WIDTH, y + HEIGHT))


def arrow_digest(directory):
    raster = Image.open(directory / 'ARROW.png').convert('RGBA')
    assert raster.getchannel('A').getbbox()
    return hashlib.sha256(raster.tobytes()).hexdigest()


def save_arrows(directories, versions, out):
    image = Image.new('RGB', (512, 142), '#202a37')
    draw = ImageDraw.Draw(image)
    for i, (version, directory) in enumerate(zip(versions, directories)):
        shot = Image.open(directory / 'ARROW.png').convert('RGBA')
        shot = shot.resize((244, 244), Image.Resampling.NEAREST)
        image.paste(shot, (i * 256 + 5, -42), shot)
        draw.text((i * 256 + 10, 4), version, fill='white', font=font(16))
    image.save(out / 'FLECHA.png')


def compare_cast(old, new):
    start = new['dimensions']['inputFrame']
    samples = new['stats'][start:]
    old_samples = old['stats'][old['dimensions']['inputFrame']:]
    return {
        'oldPeakCastPixels': max(s['marked'] for s in old_samples),
        'newPeakCastPixels': max(s['marked'] for s in samples),
        'visibleCastFrames': [s['frame'] for s in samples if s['marked'] >= 16],
        'observedBodyStates': sorted({s['stance'] for s in samples if s['stance']}),
        'targetDamage': new.get('healthWhenPressed', new['stats'][0]['enemyHp']) -
                        min(s['enemyHp'] for s in samples),
        'peakNewArtAgainstFallback': max(s.get('weaponPixels') or 0 for s in samples),
        'newArtFramesAgainstFallback': [
            s['frame'] for s in samples if (s.get('weaponPixels') or 0) >= 16
        ],
    }


def film_hero(hero, versions, clips, out):
    moves = list(clips)
    columns = len(moves) // 2
    row_height = 2 * HEIGHT + 24
    width, height = columns * WIDTH, 2 * row_height + 28
    frames = []
    for index in range(COUNT):
        film = Image.new('RGB', (width, height), '#17151e')
        draw = ImageDraw.Draw(film)
        draw.text((10, 4), HEROES[hero], fill='#ffe6ad', font=font(16))
        draw.text((width - 152, 6), f'{(index-5)/24:.2f} s', fill='#dfd7e2', font=font(14))
        for i, move in enumerate(moves):
            x, y = i % columns * WIDTH, i // columns * row_height + 28
            draw.text((x + 8, y + 2), MOVES[move], fill='#ebe5d2', font=font(14))
            for j, version in enumerate(versions):
                top = y + 24 + j * HEIGHT
                film.paste(frame(clips[move][j], index), (x, top))
                draw.rectangle((x, top, x + 52, top + 16), fill='#181821')
                draw.text((x + 3, top), version, fill='#efdeb8', font=font(12))
        frames.append(film)
    frames[0].save(out / (hero + '.webp'), save_all=True, append_images=frames[1:],
                   duration=FRAME_MS, loop=0, lossless=True, method=3)


def save_group(group_path, sha, out):
    group = report(group_path)
    assert group['sha'] == sha, 'As duas demonstrações devem usar a mesma exportação.'
    group_stats = {}
    for key, case in group['cases'].items():
        rows = case['stats'][case['dimensions']['inputFrame']:]
        # Face 13x13, torso 17x19, relative to the position of each native actor.
        stats = {}
        for region, pixels, field in (('face', 169, 'peakFaceOverlapFraction'),
                                      ('torso', 323, 'peakTorsoOverlapFraction')):
            stats[field] = [
                round(max(s['groupRead'][region][i] for s in rows) / pixels, 3)
                for i in range(3)
            ]
        stats['frames'] = [{
            'frame': s['frame'], 'changedPixels': s['marked'],
            'aheadOfLeader': s['groupRead']['ahead'], 'atTarget': s['groupRead']['contact'],
            'atTargetBeforeRecoil': s['groupRead'].get('atOriginalTarget'),
            'withinFourPixelsOfRenderedTarget': s['groupRead']['atSpriteEdge'],
            'centerX': s['groupRead']['centerX'],
        } for s in rows]
        group_stats[key] = stats
    shot = Image.open(group_path / 'franco_super.png').convert('RGB')
    frames = [frame(shot, i) for i in range(COUNT)]
    frames[0].save(out / 'FRANCO-GRUPO.webp', save_all=True, append_images=frames[1:],
                   duration=FRAME_MS, loop=0, lossless=True, method=4)
    sequence = Image.new('RGB', (3 * WIDTH, HEIGHT + 25), '#17151e')
    captions = ImageDraw.Draw(sequence)
    for i, (index, label) in enumerate([(6, 'Saída'), (10, 'Passagem'), (13, 'Contato')]):
        sequence.paste(frames[index], (i * WIDTH, 25))
        captions.text((i * WIDTH + 8, 3), label, font=font(15), fill='#ffe6ad')
    sequence.save(out / 'FRANCO-GRUPO-FASES.png', optimize=True)
    return group_stats


def save_page(out, versions, group):
    options = ''.join(f'<option value="{hero}">{html.escape(name)}</option>' for hero, name in HEROES.items())
    group_panel = """<h2>Super de Franco em grupo</h2>
<p>Recorte do jogo em escala nativa e velocidade de combate.</p>
<img style="width:256px;max-width:100%" src="FRANCO-GRUPO.webp" alt="Franco usa seu super perto de dois aliados e um inimigo">
<p><a href="FRANCO-GRUPO.webp">Abrir a animação</a> · <a href="FRANCO-GRUPO-FASES.png">Ver a saída, a passagem e o contato</a></p>""" if group else ''
    page = f"""<!doctype html><html lang="pt-BR"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Ataques em combate · Comparação</title>
<style>body{{max-width:54rem;margin:2rem auto;padding:0 1rem;background:#181721;color:#f1e5ce;font:16px/1.5 system-ui}}a{{color:#bce5ed}}select{{font:inherit;padding:.45rem}}img{{display:block;width:100%;height:auto;margin-top:.9rem}}</style>
<h1>Ataques em combate</h1><p>Cada ação aparece em duas versões. A {versions[0]} está acima da {versions[1]}. O comando acontece em 0,00 s.</p>
<label>Personagem <select id="hero">{options}</select></label><img id="preview" src="franco.webp" alt="Franco em combate nas duas versões">
<script>const hero=document.querySelector('#hero'),preview=document.querySelector('#preview');hero.onchange=()=>{{preview.src=hero.value+'.webp';preview.alt=hero.selectedOptions[0].text+' em combate nas duas versões'}};</script>
<p><a href="FLECHA.png">Comparar a flecha em voo</a> · <a href="GOLPES.png">Ver os impactos dos seis personagens</a></p>
{group_panel}</html>"""
    (out / 'index.html').write_text(page)


def main():
    old, new, out = map(Path, sys.argv[1:4])
    out.mkdir(parents=True, exist_ok=True)
    before, after = report(old), report(new)
    hashes = [arrow_digest(directory) for directory in [old, new]]
    versions = [before['version'], after['version']]
    arrows_match = before['cases']['alt_basic']['arrows'] == after['cases']['alt_basic']['arrows']
    summary = {'baseline': before['sha'], 'candidate': after['sha'], 'versions': versions,
               'arrowRasterIdentical': hashes[0] == hashes[1], 'arrowHashes': hashes,
               'arrowTrajectoryIdentical': arrows_match, 'cases': {}}
    save_arrows([old, new], versions, out)
    overview = Image.new('RGB', (4 * 216, 6 * 128 + 30), '#181721')
    draw = ImageDraw.Draw(overview)
    for i, action in enumerate(ACTIONS):
        draw.text((i * 216 + 8, 5), MOVES[action], fill='#ffe6ad', font=font(15))
    for row, (hero, name) in enumerate(HEROES.items()):
        moves = ACTIONS if hero == 'alt' else list(MOVES)
        clips = {}
        for move in moves:
            key = f'{hero}_{move}'
            clips[move] = [Image.open(directory / (key + '.png')).convert('RGB') for directory in (old, new)]
            case = after['cases'][key]
            summary['cases'][key] = compare_cast(before['cases'][key], case)
            if move in ACTIONS:
                peak = max(case['stats'][5:26], key=lambda s: s.get('weaponPixels') or s['marked'])
                col, y = ACTIONS.index(move), row * 128 + 30
                draw.text((col * 216 + 8, y), name, fill='#efdeb8', font=font(13))
                scene = frame(clips[move][1], peak['frame']).crop((4, 23, 220, 132))
                overview.paste(scene, (col * 216, y + 19))
        film_hero(hero, versions, clips, out)
    overview.save(out / 'GOLPES.png', optimize=True)
    group = len(sys.argv) > 4
    if group:
        summary['groupSupers'] = save_group(Path(sys.argv[4]), after['sha'], out)
    (out / 'LEITURA.json').write_text(json.dumps(summary, ensure_ascii=False, indent=2) + '\n')
    save_page(out, versions, group)


if __name__ == '__main__':
    main()
