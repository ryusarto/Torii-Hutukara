#!/usr/bin/env python3
"""Read-only confirmation of the exact hosted executable and six environment PNGs."""
import hashlib
import json
import struct
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = 'https://ryusarto.github.io/Torii-Hutukara/'
expected = sys.argv[1]

def get(path):
    request = urllib.request.Request(BASE + path, headers={
        'Cache-Control': 'no-cache', 'User-Agent': 'Torii-environment-release-verification'})
    with urllib.request.urlopen(request, timeout=45) as response:
        return response.read()

stamp = str(int(time.time()))
info = json.loads(get('build-info.json?verify=' + stamp))
assert info['version'] == '1.10.0', info['version']
assert info['sourceSha256'] == expected, info['sourceSha256']
assert info['gameContentRoundTrip'] and info['portableBuildUnchanged']
html = get('index.html?verify=' + stamp)
assert hashlib.sha256(html).hexdigest() == info['indexSha256']
paths = {
    'facades_c1': 'assets/environment-volume/v1/atlas/c1.png',
    'facades_c2': 'assets/environment-volume/v1/atlas/c2.png',
    'rebuild': 'assets/cloud-world/v1/atlas/rebuild.png',
    'cloud_cinema': 'assets/cloud-world/v1/backgrounds/sky_portal.png',
    'cloud_surface': 'assets/cenarios/v2/atlas/C3_SUPERFICIES_URBANAS.png',
    'cloud_edges': 'assets/cenarios/v2/atlas/C3_NUVENS_ENCAIXES.png'}
assets = {}
for key, relative in paths.items():
    original = (ROOT / relative).read_bytes()
    digest = hashlib.sha256(original).hexdigest()
    media = 'media/' + digest + '.png'
    assert media.encode() in html, key
    served = get(media)
    assert hashlib.sha256(served).hexdigest() == digest, key
    assert served[:8] == b'\x89PNG\r\n\x1a\n'
    size = list(struct.unpack('>II', served[16:24]))
    assert size == list(struct.unpack('>II', original[16:24])), key
    assets[key] = {'file': relative, 'sha256': digest, 'size': size, 'bytes': len(served)}
report = {
    'checkedAtUtc': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
    'url': BASE,
    'buildInfo': {k: info[k] for k in ['version', 'sourceSha256', 'builtAt', 'indexBytes',
                                     'indexSha256', 'portableBuildUnchanged', 'gameContentRoundTrip']},
    'htmlSha256Verified': True, 'assets': assets}
out = ROOT / 'qa/environment-world-v1/PAGES_VERIFICACAO.json'
out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'version': info['version'], 'sourceSha256': expected,
                  'htmlVerified': True, 'verifiedPNGs': len(assets), 'report': str(out)}, ensure_ascii=False))
