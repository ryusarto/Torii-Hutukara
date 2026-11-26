from pathlib import Path
import re,json
ROOT=Path(__file__).resolve().parents[1];C=ROOT/'qa/integration-1.25.0/conflicts'
rx=re.compile(r'^<<<<<<<[^\n]*\n(.*?)^\|\|\|\|\|\|\|[^\n]*\n(.*?)^=======\n(.*?)^>>>>>>>[^\n]*\n',re.M|re.S)
p=C/'game/source/chapter-03/build_alpha.rb.merged';text=p.read_text();matches=list(rx.finditer(text));assert len(matches)==2
ours,base,theirs=matches[0].groups();ours_init,ours_parts=ours.split('parts = ',1);remote_init,remote_parts=theirs.split('parts = ',1)
needle="*fase2_runtimes, File.read(LUMI_JS, encoding: 'UTF-8'), ui7_runtime"
replacement="*fase2_runtimes, bridge_runtime, File.read(bridge_puzzle, encoding: 'UTF-8'), File.read(radio_tuning, encoding: 'UTF-8'), File.read(LUMI_JS, encoding: 'UTF-8'), canal_runtime, File.read(plant_sequencer, encoding: 'UTF-8'), club_runtime, File.read(final_echoes, encoding: 'UTF-8'), ui7_runtime"
assert needle in ours_parts
first=ours_init+remote_init+'parts = '+ours_parts.replace(needle,replacement)
second=matches[1].group(1)+matches[1].group(3)
for match,replacement in reversed(list(zip(matches,[first,second]))):text=text[:match.start()]+replacement+text[match.end():]
text=text.replace('key = [ENEMY_SKILL_FX_DIR,','key = [bridge_root, club_art_dir, File.dirname(canal_recording), ENEMY_SKILL_FX_DIR,')
(ROOT/'game/source/chapter-03/build_alpha.rb').write_text(text)
(ROOT/'game/source/chapter-03/lumi_melody.js').write_bytes((C/'game/source/chapter-03/lumi_melody.js.theirs').read_bytes())
p=ROOT/'game/VERSION.json';version=json.loads((C/'game/VERSION.json.theirs').read_text());version.update(versao='beta-1.25.0',numero='1.25.0',rotulo='BETA 1.25.0',titulo='Beta 1.25.0',sufixo='BETA_1_25_0');p.write_text(json.dumps(version,ensure_ascii=False,indent=2)+'\n')
p=ROOT/'web/playtest/build.json';p.write_text(json.dumps({'version':'1.25.0','manifest':'game/builds/beta-1.25.0/MANIFESTO_BETA_1_25_0.json'},indent=2)+'\n')
p=ROOT/'CHANGELOG.md';s=rx.sub(lambda m:m.group(3)+m.group(1),(C/'CHANGELOG.md.merged').read_text());s='## [Beta 1.25.0] — integração local\n\n- Base GitHub Beta1.24.1 db6297e integrada com menus/HUD16bit, diálogos, vidas individuais/boss, controles e animações aprovados localmente.\n- Novas atividades musicais e recuperação de ecos recebem a mesma identidade de interface.\n- Poder do Tambor e projétil do Flautim reforçados em área/corpo legíveis, preservando a simulação.\n\n'+s;p.write_text(s)
p=ROOT/'README.md';s=rx.sub(lambda m:m.group(3),(C/'README.md.merged').read_text());s='> **Integração local Beta1.25.0:** incorpora a base publicada1.24.1 (`db6297e`) e os menus/HUD/animações/efeitos desta sessão. Não representa uma publicação nova no GitHub. Evidências em `qa/integration-1.25.0/`.\n\n'+s;p.write_text(s)
assert not rx.search(text)
print('Reconciled six conflicts; native modules once; approved UI and renderers preserved')
