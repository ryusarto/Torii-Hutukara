#!/usr/bin/env python3
"""Index actual gameplay recordings and native UI screenshots; no mockups."""
from pathlib import Path
from html import escape
import json

root = Path(__file__).resolve().parents[1]
version = json.loads((root / 'game/VERSION.json').read_text())['versao']
qa = root / 'qa' / version
build = json.loads((root / 'production/playtest-dist/build-info.json').read_text())
key = build['sourceSha256'][:8]
fx = qa / 'enemy-skill-fx-v2' / ('build-' + key)
captures = [fx] + sorted((qa / 'enemy-skill-fx-v2').glob('build-*'),
                         key=lambda p: p.stat().st_mtime, reverse=True)

def relative(path):
    return escape(str(path.relative_to(qa)), quote=True)

def video(name, title, note, folder=fx):
    path = folder / (name + '.gif')
    if not path.exists():
        suffix = folder.relative_to(fx)
        path = next((p / suffix / (name + '.gif') for p in captures
                     if (p / suffix / (name + '.gif')).exists()), path)
    if not path.exists():
        return ''
    snapshot = path.parent.name if path.parent.name.startswith('build-') else path.parent.parent.name + ' · ' + path.parent.name
    return f'<article><h3>{escape(title)}</h3><p>{escape(note)}</p><a href="{relative(path)}"><img loading="lazy" src="{relative(path)}" alt="{escape(title)} — gravação real"></a><small>Captura: {escape(snapshot)}.</small></article>'

cases = [
    ('tambor', 'Tambor-Escudo', 'Frente de pressão no setor real do golpe; pico sólido, expansão e dissipação.'),
    ('flautim', 'Flautim Atirador', 'Projétil com núcleo, cauda e contato próprios; núcleo alinhado à colisão.'),
    ('coro', 'Coro Curador', 'Cura animada sobre o destinatário, com base no chão e coluna em primeiro plano.'),
    ('maestro', 'Maestro Invocador', 'Matéria se reúne onde os aliados realmente surgem.'),
    ('muralha', 'Muralha Estática', 'Impacto no setor do ataque, deixando o piso visível entre os fragmentos.'),
    ('antena', 'Antena Feedback', 'Descarga ao longo do raio nativo, com preparação e ruptura próprias.'),
]
extras = [
    ('muralha-charge', 'Muralha · investida', 'Rastro acompanha o deslocamento e termina na colisão real.'),
    ('coro-melee', 'Coro · corpo a corpo', 'Impacto curto no contato.'),
    ('tambor-dificil', 'Tambor · Difícil', 'Mesmo sprite de poder nos padrões da dificuldade Difícil.'),
    ('flautim-dificil', 'Flautim · Difícil', 'Projéteis do padrão Difícil com corpo e rastro próprios.'),
    ('antena-dificil', 'Antena · Difícil', 'Padrão Difícil em execução real.'),
]
ui = qa / 'ui7-new-games'
names = {'radio':'Rádio 9', 'radio_stable':'Rádio 9 · sinal estável', 'plant':'Usina · sequenciador', 'lumi':'Lumi · quatro timbres', 'bridge_ready':'Ponte · no mapa', 'canal_holding':'Canal · nota sustentada', 'club_ready':'Clube · no mapa', 'final_ready':'Ecos finais · no mapa'}
screens = []
for orientation, label in [('pc', 'PC'), ('vertical', 'Mobile vertical'), ('horizontal', 'Mobile horizontal')]:
    cards = []
    for name, title in names.items():
        path = ui / f'{name}_{orientation}.png'
        if name == 'lumi' and orientation == 'horizontal' and (qa / 'lumi-footer/hint.png').exists():
            path = qa / 'lumi-footer/hint.png'
        if path.exists():
            cards.append(f'<figure><a href="{relative(path)}"><img loading="lazy" src="{relative(path)}" alt="{escape(title)} · {label}"></a><figcaption>{escape(title)}</figcaption></figure>')
    if cards:
        screens.append('<h3>' + label + '</h3><div class="screens">' + ''.join(cards) + '</div>')
mobile = ''.join(video(name, f'{title} · {label}', note, fx / orientation)
                 for orientation, label in [('portrait', 'vertical'), ('landscape', 'horizontal')]
                 for name, title, note in cases[:2])
html = '''<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Torii &amp; Hutukara · demonstração 1.25</title><style>
body{margin:0;background:#18151c;color:#f4d8a0;font:16px/1.55 system-ui,sans-serif}main{max-width:1000px;margin:auto;padding:24px}h1,h2,h3{color:#f7cf83}a{color:#f7cf83}article,figure{margin:0 0 24px;padding:16px;border:1px solid #8e6240;background:#221e28}img{display:block;max-width:100%;height:auto;image-rendering:pixelated;margin:auto}.screens{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:16px}.screens img{max-height:620px;object-fit:contain}figcaption{margin-top:12px}small{color:#c1b3a5}nav{display:flex;gap:16px;flex-wrap:wrap}
</style><main>'''
html += f'<h1>Torii &amp; Hutukara · Beta 1.25.0</h1><p>Integração local da base GitHub 1.24.1 com os menus, HUD e animações aprovados.</p><nav><a href="http://127.0.0.1:8877/?ui={key}">Jogar a build local</a><a href="../integration-1.25.0/ENTREGA.md">Integração e limites</a></nav>'
html += f'<p><small>Build {escape(build["sourceSha256"])}. Sem publicação ou merge remoto.</small></p><h2>Golpes no jogo</h2><p>Gravações do runtime real com IA e colisão nativas, a 20 quadros por segundo. Encontros controlados nos mapas originais; vida do jogador elevada para captura. As imagens PC são recortes do viewport real. Cada GIF identifica a build gravada; os ajustes finais de toque e HUD horizontal não alteraram os sprites e a animação dos golpes. Não representam uma campanha humana completa.</p>'
html += ''.join(video(*case) for case in cases)
html += '<h2>Outros padrões</h2>' + ''.join(video(*case) for case in extras)
if mobile:
    html += '<h2>Golpes no mobile</h2><p>Viewport e toque emulados; aparelhos físicos não testados.</p>' + mobile
html += '<h2>Novas telas com a estética aprovada</h2><p>Capturas reais das interfaces nativas. Atividades do mapa continuam no mapa; os painéis preservam seus comandos e progressão.</p>' + ''.join(screens)
html += '</main></html>'
out = qa / 'DEMONSTRACAO_1_25_0.html'
out.write_text(html)
print(out)
