"""Organiza poses autorais sem desenhar ou interpolar arte.

Uso: python empacotar.py [--no-frames]
Requer Pillow e NumPy. As fontes em originais/ nunca são sobrescritas.
"""
from pathlib import Path
from argparse import ArgumentParser
from PIL import Image
import hashlib
import json
import numpy as np

BASE = Path(__file__).resolve().parent
CELL = 256
PIVOT = (128, 224)
VISIBLE_ALPHA = 48
CUT_ALPHA = 72


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def visible_bbox(image):
    return image.getchannel('A').point(lambda a: 255 if a > VISIBLE_ALPHA else 0).getbbox()


def separators(profile, count):
    """Busca vales alpha, com regularidade suave e margem para células irregulares."""
    length = len(profile)
    step = length / count
    profile = np.asarray(profile, dtype=float)
    maximum = max(1.0, float(profile.max()))
    normalized = profile / maximum
    candidates = [[0]]
    for k in range(1, count):
        lo = max(k, round((k - .8) * step))
        hi = min(length - (count - k), round((k + .8) * step))
        candidates.append(list(range(lo, hi + 1)))
    candidates.append([length])
    costs = {0: 0.0}
    links = []
    for points in candidates[1:]:
        previous = np.asarray(list(costs), dtype=int)
        previous_cost = np.asarray(list(costs.values()), dtype=float)
        next_cost, back = {}, {}
        for point in points:
            width = (point - previous) / step
            valid = (width >= .42) & (width <= 1.65)
            if not valid.any():
                continue
            options = previous_cost + 2 * (width - 1) ** 2
            options[~valid] = np.inf
            best = int(np.argmin(options))
            occupancy = normalized[point] if point < length else 0.0
            next_cost[point] = float(options[best]) + 60 * occupancy
            back[point] = int(previous[best])
        costs = next_cost
        links.append(back)
    if length not in costs:
        raise ValueError('Não foi possível separar a grade da fonte.')
    result = [length]
    for back in reversed(links):
        result.append(back[result[-1]])
    return list(reversed(result))


def split_source(image, rows, columns):
    alpha = np.asarray(image.getchannel('A'))
    occupied = alpha > CUT_ALPHA
    row_cuts = separators(occupied.sum(axis=1), rows)
    rects, warnings, contacts, adjustments = [], [], [], []
    for row in range(rows):
        top, bottom = row_cuts[row:row + 2]
        column_cuts = separators(occupied[top:bottom].sum(axis=0), columns)
        row_rects = [[column_cuts[c], top, column_cuts[c + 1], bottom]
                     for c in range(columns)]
        rects.append(row_rects)
        for boundary in column_cuts[1:-1]:
            bridge = int((occupied[top:bottom, boundary - 1] & occupied[top:bottom, boundary]).sum())
            if bridge:
                warnings.append({'axis': 'x', 'row': row, 'position': boundary,
                                 'connectedVisiblePixelsAcrossCut': bridge})
    for row in range(1, rows):
        boundary = row_cuts[row]
        band_amount = int(occupied[boundary - 1:boundary + 1].sum())
        if band_amount:
            contacts.append({'axis': 'y', 'position': boundary,
                             'visiblePixelsAboveCut': int(occupied[boundary - 1].sum()),
                             'visiblePixelsBelowCut': int(occupied[boundary].sum()),
                             'connectedVisiblePixelsAcrossCut': int((occupied[boundary - 1] & occupied[boundary]).sum())})
        for column in range(columns):
            above, below = rects[row - 1][column], rects[row][column]
            left, right = min(above[0], below[0]), max(above[2], below[2])
            bridge = int((occupied[boundary - 1, left:right] & occupied[boundary, left:right]).sum())
            if not bridge:
                continue
            # A zero band proves this local separator does not pass through a visible figure.
            radius = max(6, round(image.height / rows * .12))
            candidates = range(max(above[1] + 2, boundary - radius),
                               min(below[3] - 1, boundary + radius + 1))
            empty = [y for y in candidates if not occupied[y - 1:y + 1, left:right].any()]
            if not empty:
                warnings.append({'axis': 'y', 'rowBoundary': row, 'column': column,
                                 'position': boundary, 'connectedVisiblePixelsAcrossCut': bridge,
                                 'reason': 'Sem corredor alpha vazio próximo; revisão da fonte necessária.'})
                continue
            new_boundary = min(empty, key=lambda y: abs(y - boundary))
            above[3] = new_boundary
            below[1] = new_boundary
            low, high = sorted([boundary, new_boundary])
            adjustments.append({'axis': 'y', 'rowBoundary': row, 'column': column,
                                'oldBoundary': boundary, 'newBoundary': new_boundary,
                                'connectedVisiblePixelsBefore': bridge,
                                'visiblePixelsReassigned': int((alpha[low:high, left:right] > VISIBLE_ALPHA).sum()),
                                'connectedVisiblePixelsAfter': 0})
    # Adaptive row limits must not drop or duplicate any visible source pixel.
    coverage = np.zeros(alpha.shape, dtype=np.uint8)
    for row in rects:
        for left, top, right, bottom in row:
            coverage[top:bottom, left:right] += 1
    visible = alpha > VISIBLE_ALPHA
    lost = int((visible & (coverage == 0)).sum())
    repeated = int((visible & (coverage > 1)).sum())
    if lost or repeated:
        raise ValueError(f'A grade perde {lost} pixels visíveis e duplica {repeated}; requer revisão.')
    poses = [[image.crop(rect) for rect in row] for row in rects]
    return poses, rects, warnings, {'contacts': contacts, 'adjustments': adjustments,
                                   'visiblePixelsLost': lost, 'visiblePixelsDuplicated': repeated}


def normalize_sequence(poses, masked, source_rects):
    boxes = [visible_bbox(pose) for pose in poses]
    if not all(boxes):
        raise ValueError('A grade contém ao menos um frame sem personagem visível.')
    first_height = boxes[0][3] - boxes[0][1]
    target_height = 198 if masked else 180
    scale = target_height / first_height
    global_tops = [rect[1] + box[1] for rect, box in zip(source_rects, boxes)]
    ground = max(rect[1] + box[3] for rect, box in zip(source_rects, boxes))
    tallest = max((ground - top) * scale for top in global_tops)
    widest = max((box[2] - box[0]) * scale for box in boxes)
    fit_factor = min(1.0, 212 / tallest, 230 / widest)
    scale *= fit_factor
    frames = []
    placements = []
    for pose, box, global_top in zip(poses, boxes, global_tops):
        crop = pose.crop(box)
        size = (max(1, round(crop.width * scale)), max(1, round(crop.height * scale)))
        crop = crop.resize(size, Image.Resampling.NEAREST)
        x = round(PIVOT[0] - crop.width / 2)
        y = round(PIVOT[1] - (ground - global_top) * scale)
        frame = Image.new('RGBA', (CELL, CELL))
        frame.alpha_composite(crop, (x, y))
        frames.append(frame)
        placements.append([x, y, crop.width, crop.height])
    return frames, {'scale': round(scale, 6), 'fitFactor': round(fit_factor, 6),
                    'targetHeight': target_height, 'sourceGroundGlobal': ground,
                    'sourceCoordinateSpace': 'native-sheet-global', 'sourceRects': source_rects,
                    'placements': placements}


def portrait_frame(pose):
    box = visible_bbox(pose)
    if box is None:
        raise ValueError('Retrato sem personagem visível.')
    crop = pose.crop(box)
    scale = min(232 / crop.width, 232 / crop.height)
    crop = crop.resize((max(1, round(crop.width * scale)), max(1, round(crop.height * scale))),
                       Image.Resampling.NEAREST)
    result = Image.new('RGBA', (CELL, CELL))
    result.alpha_composite(crop, ((CELL - crop.width) // 2, 244 - crop.height))
    return result


def frame_hash(frame):
    pixels = np.asarray(frame).copy()
    pixels[pixels[:, :, 3] == 0] = 0
    return hashlib.sha256(pixels.tobytes()).hexdigest()


def validate_frame(frame, key, report):
    box = visible_bbox(frame)
    if box is None:
        report['emptyFrames'].append(key)
        return
    if box[0] <= 0 or box[1] <= 0 or box[2] >= CELL or box[3] >= CELL:
        report['outputClipping'].append(key)
    low, high = frame.getchannel('A').getextrema()
    if frame.mode != 'RGBA' or low != 0 or high <= VISIBLE_ALPHA:
        report['alphaFailures'].append(key)


def pack(export_frames=True):
    plan = json.loads((BASE / 'PLANO_E_PROMPTS.json').read_text())
    for directory in ['atlas', 'retratos', 'qa']:
        (BASE / directory).mkdir(exist_ok=True)
    manifest = {'version': plan.get('version', 3), 'date': plan.get('date', '2026-11-17'),
                'heroes': plan['heroes'], 'variants': plan['variants'],
                'directions': plan['directions'], 'cell': [CELL, CELL],
                'pivot': list(PIVOT), 'sourceFrames': 8,
                'expectedActions': list(plan['actions']),
                'animations': [], 'portraits': [],
                'individualFramesPublished': False,
                'note': 'complete indica cobertura e estrutura; aprovação visual é registrada em qa/.'}
    report = {'missing': [], 'processingErrors': [], 'rejectedSources': [], 'emptyFrames': [], 'outputClipping': [],
              'alphaFailures': [], 'sourceBoundaryWarnings': [], 'sourceBoundaryContacts': [],
              'sourceCutAdjustments': [], 'duplicateFrames': [],
              'sources': [], 'sequences': [],
              'limitations': ['Recortes automáticos por alpha exigem conferência visual das bordas.',
                              'Escala é constante dentro da sequência. Redução para caber na célula é registrada.',
                              'O teste estrutural não avalia anatomia nem fluidez perceptiva.']}
    processed_animation_sheets = 0
    processed_portrait_sheets = 0
    rejected_hashes = {}
    rejections_path = BASE / 'qa' / 'REJEICOES_ARTE.json'
    if rejections_path.is_file():
        for rejected in json.loads(rejections_path.read_text()):
            rejected_source = Path(rejected.get('source', ''))
            if rejected.get('status') == 'rejected' and rejected_source.is_file():
                rejected_hashes[rejected['name']] = hashlib.sha256(rejected_source.read_bytes()).hexdigest()
    for task in plan['tasks']:
        source = BASE / 'originais' / f"{task['name']}.png"
        if not source.is_file():
            report['missing'].append(task['name'])
            continue
        if rejected_hashes.get(task['name']) == hashlib.sha256(source.read_bytes()).hexdigest():
            report['rejectedSources'].append(task['name'])
            continue
        hero, variant, state = task['hero'], task['variant'], task['state']
        try:
            with Image.open(source) as opened:
                image = opened.convert('RGBA')
            columns, rows = task['layout']
            poses, rects, warnings, cut_audit = split_source(image, rows, columns)
            report['sources'].append({'name': task['name'], 'size': list(image.size), 'rects': rects,
                                      'sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
                                      'visiblePixelsLost': cut_audit['visiblePixelsLost'],
                                      'visiblePixelsDuplicated': cut_audit['visiblePixelsDuplicated']})
            report['sourceBoundaryWarnings'].extend([{'name': task['name'], **warning} for warning in warnings])
            report['sourceBoundaryContacts'].extend([{'name': task['name'], **contact} for contact in cut_audit['contacts']])
            report['sourceCutAdjustments'].extend([{'name': task['name'], **adjustment} for adjustment in cut_audit['adjustments']])
            if state == 'portrait':
                flattened = [pose for row in poses for pose in row]
                if len(flattened) != len(plan['expressions']):
                    raise ValueError('Quantidade de retratos difere da especificação.')
                entries = []
                for expression, pose in zip(plan['expressions'], flattened):
                    frame = portrait_frame(pose)
                    key = f'{hero}/{variant}/portrait/{expression}'
                    validate_frame(frame, key, report)
                    relative = Path('retratos') / hero / variant / f'{expression}.png'
                    (BASE / relative).parent.mkdir(parents=True, exist_ok=True)
                    frame.save(BASE / relative)
                    entries.append({'hero': hero, 'variant': variant, 'expression': expression,
                                    'file': relative.as_posix(), 'source': f'originais/{task["name"]}.png'})
                manifest['portraits'].extend(entries)
                processed_portrait_sheets += 1
                continue
            if rows != 4 or columns != 8:
                raise ValueError('A folha de animação precisa de oito colunas e quatro direções.')
            atlas = Image.new('RGBA', (8 * CELL, 4 * CELL))
            entries = []
            for row, direction in enumerate(plan['directions']):
                frames, calibration = normalize_sequence(poses[row], variant == 'masked', rects[row])
                relative = Path('frames') / hero / variant / state / direction
                if export_frames:
                    (BASE / relative).mkdir(parents=True, exist_ok=True)
                hashes = []
                for n, frame in enumerate(frames):
                    key = f'{task["name"]}/{direction}/{n}'
                    validate_frame(frame, key, report)
                    if export_frames:
                        frame.save(BASE / relative / f'{n:02}.png')
                    atlas.alpha_composite(frame, (n * CELL, row * CELL))
                    hashes.append(frame_hash(frame))
                unique = len(set(hashes))
                if unique < 8:
                    report['duplicateFrames'].append({'name': task['name'], 'direction': direction,
                                                      'uniqueFrames': unique})
                report['sequences'].append({'name': task['name'], 'direction': direction,
                                            'uniqueFrames': unique, **calibration})
                entries.append({'hero': hero, 'variant': variant, 'state': state, 'direction': direction,
                                'row': row, 'frames': 8, 'frameMs': plan['actions'][state][1],
                                'loop': bool(plan['actions'][state][2]), 'holdLast': state == 'defeat',
                                'atlas': f'atlas/{task["name"]}.png',
                                'source': f'originais/{task["name"]}.png',
                                'individualFrames': relative.as_posix() + '/{frame:02}.png',
                                'uniqueFrames': unique})
            atlas.save(BASE / 'atlas' / f'{task["name"]}.png')
            manifest['animations'].extend(entries)
            processed_animation_sheets += 1
        except Exception as error:
            report['processingErrors'].append({'name': task['name'], 'error': str(error)})
    expected_animation_sheets = len(plan['heroes']) * len(plan['variants']) * len(plan['actions'])
    expected_portrait_sheets = len(plan['heroes']) * len(plan['variants'])
    expected_sequences = expected_animation_sheets * len(plan['directions'])
    expected_portraits = expected_portrait_sheets * len(plan['expressions'])
    actual_keys = {(a['hero'], a['variant'], a['state'], a['direction']) for a in manifest['animations']}
    expected_keys = {(h, v, s, d) for h in plan['heroes'] for v in plan['variants']
                     for s in plan['actions'] for d in plan['directions']}
    coverage_ok = (actual_keys == expected_keys and len(manifest['animations']) == expected_sequences
                   and len(manifest['portraits']) == expected_portraits
                   and processed_animation_sheets == expected_animation_sheets
                   and processed_portrait_sheets == expected_portrait_sheets)
    structure_ok = not any(report[key] for key in ['missing', 'processingErrors', 'rejectedSources', 'sourceBoundaryWarnings', 'emptyFrames',
                                                  'outputClipping', 'alphaFailures'])
    manifest['complete'] = coverage_ok and structure_ok
    manifest['counts'] = {'sheets': processed_animation_sheets,
                          'portraitSheets': processed_portrait_sheets,
                          'sourceSheets': processed_animation_sheets + processed_portrait_sheets,
                          'sequences': len(manifest['animations']),
                          'frames': len(manifest['animations']) * 8,
                          'portraits': len(manifest['portraits'])}
    manifest['expectedCounts'] = {'sheets': expected_animation_sheets, 'portraitSheets': expected_portrait_sheets,
                                  'sequences': expected_sequences, 'frames': expected_sequences * 8,
                                  'portraits': expected_portraits}
    manifest['validation'] = {'coverage': coverage_ok, 'alpha': not report['alphaFailures'],
                              'noRejectedSources': not report['rejectedSources'],
                              'noEmptyFrames': not report['emptyFrames'],
                              'noOutputClipping': not report['outputClipping'],
                              'noUnresolvedSourceCuts': not report['sourceBoundaryWarnings'],
                              'sourceBoundaryWarnings': len(report['sourceBoundaryWarnings'])}
    report.update({'structurallyComplete': manifest['complete'], 'counts': manifest['counts'],
                   'expectedCounts': manifest['expectedCounts'], 'framesExportedLocally': export_frames})
    for field, filename in [('paletteRecipe', 'PALETA_CANONICA.json'), ('geometryAudit', 'AUDITORIA_GEOMETRIA.json')]:
        if (BASE / filename).is_file():
            manifest[field] = filename
    write_json(BASE / 'MANIFESTO.json', manifest)
    write_json(BASE / 'manifest.json', manifest)
    write_json(BASE / 'VALIDACAO.json', report)
    template = BASE / 'previa.template.html'
    if template.is_file():
        (BASE / 'PREVIA.html').write_text(template.read_text().replace('__MANIFEST_DATA__', json.dumps(manifest, ensure_ascii=False)))
    print(json.dumps({'complete': manifest['complete'], 'counts': manifest['counts'],
                      'missing': len(report['missing']), 'errors': report['processingErrors'],
                      'rejectedSources': report['rejectedSources'],
                      'emptyFrames': len(report['emptyFrames']), 'outputClipping': len(report['outputClipping']),
                      'sourceBoundaryWarnings': len(report['sourceBoundaryWarnings'])}, ensure_ascii=False))


if __name__ == '__main__':
    parser = ArgumentParser(description=__doc__)
    parser.add_argument('--no-frames', action='store_true', help='Não exporta os PNGs individuais locais.')
    arguments = parser.parse_args()
    pack(export_frames=not arguments.no_frames)
