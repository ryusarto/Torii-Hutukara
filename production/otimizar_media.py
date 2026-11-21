#!/usr/bin/env python3
"""Converte as imagens extraídas do site para WebP, com cache por conteúdo.

    python3 -I production/otimizar_media.py <pasta_media> <relatorio.json>

Para cada PNG/WebP de <pasta_media>:
  1. tenta WebP com perda (qualidade 90, alfa sem perda);
  2. aceita só se a diferença for imperceptível: PSNR >= 42 dB nas cores
     visíveis e alfa idêntico; senão usa WebP sem perda (pixels idênticos);
  3. fica com o original se nada for menor.
Escreve o arquivo novo em <pasta_media>/<sha256>.webp, apaga o original
substituído e grava {original: {file, bytes, mode, psnr}} no relatório.
O cache (production/.media-cache/) guarda o resultado por hash do original.
"""
import hashlib, io, json, math, os, sys
from multiprocessing import Pool
import numpy as np
from PIL import Image

QUALITY = 90
MIN_PSNR = 42.0
CACHE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.media-cache')
VERSION = 'v1-q%d-psnr%d' % (QUALITY, MIN_PSNR)


def psnr(a, b):
    """PSNR das cores ponderado pelo alfa; None se o alfa mudou."""
    if a.size != b.size:
        return None
    ra = np.asarray(a.convert('RGBA'), dtype=np.float64)
    rb = np.asarray(b.convert('RGBA'), dtype=np.float64)
    if not np.array_equal(ra[..., 3], rb[..., 3]):
        return None
    w = ra[..., 3:4] / 255.0
    weight = float(w.sum()) * 3
    if not weight:
        return 99.0
    err = float((((ra[..., :3] - rb[..., :3]) ** 2) * w).sum()) / weight
    return 99.0 if err == 0 else 10 * math.log10(255 * 255 / err)


def convert(path):
    data = open(path, 'rb').read()
    digest = hashlib.sha256(data).hexdigest()
    cached = os.path.join(CACHE, VERSION, digest)
    if os.path.exists(cached + '.json'):
        meta = json.load(open(cached + '.json'))
        if meta['mode'] == 'original':
            return path, meta, None
        return path, meta, open(cached + '.webp', 'rb').read()
    src = Image.open(io.BytesIO(data))
    src.load()
    has_alpha = src.mode in ('RGBA', 'LA') or (src.mode == 'P' and 'transparency' in src.info)
    img = src.convert('RGBA' if has_alpha else 'RGB')
    best, mode, quality = None, 'original', None
    lossy = io.BytesIO()
    img.save(lossy, 'WEBP', quality=QUALITY, alpha_quality=100, method=4)
    score = psnr(img, Image.open(io.BytesIO(lossy.getvalue())))
    if score is not None and score >= MIN_PSNR:
        best, mode, quality = lossy.getvalue(), 'lossy', round(score, 1)
    else:
        lossless = io.BytesIO()
        img.save(lossless, 'WEBP', lossless=True, quality=100, method=4, exact=True)
        check = Image.open(io.BytesIO(lossless.getvalue())).convert(img.mode)
        if check.tobytes() != img.tobytes():
            raise SystemExit('WebP sem perda alterou pixels: ' + path)
        best, mode = lossless.getvalue(), 'lossless'
    if len(best) >= len(data):
        best, mode, quality = None, 'original', None
    meta = {'mode': mode, 'psnr': quality, 'bytesBefore': len(data),
            'bytesAfter': len(best) if best else len(data), 'size': list(img.size)}
    os.makedirs(os.path.dirname(cached), exist_ok=True)
    if best:
        open(cached + '.webp', 'wb').write(best)
    json.dump(meta, open(cached + '.json', 'w'))
    return path, meta, best


def main():
    folder, report_path = sys.argv[1], sys.argv[2]
    files = sorted(os.path.join(folder, f) for f in os.listdir(folder)
                   if f.endswith(('.png', '.webp')))
    report = {}
    with Pool(os.cpu_count() or 2) as pool:
        for path, meta, best in pool.imap_unordered(convert, files):
            name = 'media/' + os.path.basename(path)
            if best is None:
                report[name] = {**meta, 'file': name}
                continue
            out_name = hashlib.sha256(best).hexdigest() + '.webp'
            open(os.path.join(folder, out_name), 'wb').write(best)
            if os.path.basename(path) != out_name:
                os.remove(path)
            report[name] = {**meta, 'file': 'media/' + out_name}
    json.dump(report, open(report_path, 'w'), indent=1, sort_keys=True)
    before = sum(r['bytesBefore'] for r in report.values())
    after = sum(r['bytesAfter'] for r in report.values())
    modes = {}
    for r in report.values():
        modes[r['mode']] = modes.get(r['mode'], 0) + 1
    print('Imagens: %d · %.1f MB → %.1f MB · %s' % (len(report), before / 1e6, after / 1e6, modes))


if __name__ == '__main__':
    main()
