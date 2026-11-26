#!/usr/bin/env python3
"""Verify exact authored/embedded/hosted RGBA and embedded audio byte identity."""
import base64
import hashlib
import io
import json
import os
from pathlib import Path
import re
import subprocess
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
CONFIG = json.loads((ROOT / 'web/playtest/build.json').read_text())
MANIFEST_PATH = ROOT / CONFIG['manifest']
MANIFEST = json.loads(MANIFEST_PATH.read_text())
PORTABLE = MANIFEST_PATH.parent / MANIFEST['output']['file']
HOSTED = ROOT / 'production/playtest-dist'
OUT = Path(os.environ.get('MEDIA_PARITY_OUT', ROOT / 'qa' / MANIFEST['version'] / 'media-parity.json'))
URI = re.compile(r'data:image/(png|webp);base64,([A-Za-z0-9+/]+={0,2})')
report = {'sourceSha256': MANIFEST['output']['sha256'], 'method': 'Independent Pillow RGBA equality against tracked assets or original embedded source; compare portable and hosted decoded pixels and raw MP3 bytes.', 'images': [], 'audio': [], 'errors': []}


def sha(data):
    return hashlib.sha256(data).hexdigest()


def rgba(data):
    with Image.open(io.BytesIO(data)) as image:
        converted = image.convert('RGBA')
        return converted.size, converted.tobytes()


def run():
    with PORTABLE.open('rb') as stream:
        assert hashlib.file_digest(stream, 'sha256').hexdigest() == report['sourceSha256'], 'Portable differs from manifest'
    info = json.loads((HOSTED / 'build-info.json').read_text())
    assert info['sourceSha256'] == report['sourceSha256'], 'Hosted and portable versions differ'
    optimized = json.loads((HOSTED / 'media-optimization.json').read_text())
    # Authored files are the oracle, not the converted image under test.
    references = {}
    tracked = subprocess.check_output(['git', 'ls-files', '-z'], cwd=ROOT).decode().split('\0')
    for name in tracked:
        if Path(name).suffix.lower() not in ('.png', '.webp'):
            continue
        path = ROOT / name
        references.setdefault(sha(path.read_bytes()), path)
    # Some historical originals are embedded directly in source modules.
    embedded_references = {}
    source_files = [ROOT / 'game/source/base/torii-core.html', *(ROOT / 'game/source/chapter-03').glob('*.js')]
    for source in source_files:
        for match in URI.finditer(source.read_text()):
            data = base64.b64decode(match[2], validate=True)
            embedded_references.setdefault(sha(data), (data, str(source.relative_to(ROOT))))
    aliases = {}
    for original, target in MANIFEST.get('webp_from_png', {}).items():
        assert MANIFEST['webp_modes'][original] == 'lossless', 'Authored PNG must remain pixel-exact: ' + original
        aliases.setdefault(Path(target).stem, []).append(Path(original).stem)
    html = PORTABLE.read_text()
    seen = set()
    for match in URI.finditer(html):
        data = base64.b64decode(match[2], validate=True)
        digest = sha(data)
        if digest in seen:
            continue
        seen.add(digest)
        key = 'media/' + digest + '.' + match[1]
        entry = optimized[key]
        assert entry['mode'] in ('original', 'lossless'), 'Hosted conversion became lossy: ' + key
        hosted_data = (HOSTED / entry['file']).read_bytes()
        size, pixels = rgba(data)
        assert rgba(hosted_data) == (size, pixels), 'Hosted RGBA changed: ' + key
        authored = []
        for original_hash in aliases.get(digest, [digest]):
            if original_hash in references:
                source_path = references[original_hash]
                original_data, origin = source_path.read_bytes(), str(source_path.relative_to(ROOT))
            else:
                assert original_hash in embedded_references, 'Untracked image oracle: ' + original_hash
                original_data, origin = embedded_references[original_hash]
            assert sha(original_data) == original_hash
            assert rgba(original_data) == (size, pixels), 'Portable RGBA changed: ' + origin
            authored.append(origin)
        report['images'].append({'portable': key, 'hosted': entry['file'], 'size': size, 'authored': authored, 'rgbaIdentical': True})
    assert len(seen) == sum(name.endswith(('.png', '.webp')) for name in info['assets']), 'Not every hosted image was checked'
    preserved = set(info.get('preservedLegacyAudio', []))
    for match in re.finditer(r'([\'"])([A-Za-z0-9+/]{16384,}={0,2})\1', html):
        try:
            data = base64.b64decode(match[2], validate=True)
        except ValueError:
            assert sha(match[2].encode()) in preserved, 'Unknown malformed embedded audio'
            continue
        assert data.startswith(b'ID3') or data[0] == 255 and data[1] & 224 == 224, 'Unknown binary type'
        name = 'media/' + sha(data) + '.mp3'
        assert (HOSTED / name).read_bytes() == data, 'Hosted audio changed: ' + name
        if name not in report['audio']:
            report['audio'].append(name)
    assert len(report['audio']) == sum(name.endswith('.mp3') for name in info['assets']), 'Not every MP3 was checked'


try:
    run()
except Exception as error:
    report['errors'].append(str(error))
    raise
finally:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({'images': len(report['images']), 'audio': len(report['audio']), 'errors': report['errors']}))
