#!/usr/bin/env ruby
# frozen_string_literal: true

require 'base64'
require 'digest'
require 'json'
require 'time'
require 'fileutils'

ROOT = File.expand_path(__dir__)
REPO_ROOT = File.expand_path('../../..', ROOT)
BASE = File.join(REPO_ROOT, 'game', 'source', 'base', 'TORII_HUTUKARA_1_1_2_TRILHAS.html')
RUNTIME = File.join(ROOT, 'chapter3_runtime.js')
INPUT_RUNTIME = File.join(ROOT, 'input_mobile_combat.js')
PACE_METER = File.join(REPO_ROOT, 'game', 'source', 'telemetry', 'pace_meter.js')
DIALOGUE_EDITS_JS = File.join(ROOT, 'dialogue_edits.js')
PACING_JS = File.join(ROOT, 'pacing.js')
HEALING_JS = File.join(ROOT, 'healing.js')
COMBAT_JS = File.join(ROOT, 'combat_patterns.js')
FLOW_JS = File.join(ROOT, 'flow_fixes.js')
ACCESS_JS = File.join(ROOT, 'accessibility.js')
ENEMY_ART_JS = File.join(ROOT, 'enemy_art_v1.js')
ENEMY_ART_ASSETS = File.join(REPO_ROOT, 'assets', 'enemies', 'v1')
BOSS_GROUND_FX_JS = File.join(ROOT, 'boss_ground_fx_v1.js')
BOSS_GROUND_FX_ASSETS = File.join(REPO_ROOT, 'assets', 'boss-ground-fx', 'v1')
BOSS_ANIMATION_JS = File.join(ROOT, 'boss_choreography_v2.js')
BOSS_ANIMATION_ASSETS = File.join(REPO_ROOT, 'assets', 'boss-animations', 'v2')
PROTAGONIST_JS = File.join(ROOT, 'protagonist_art_v5.js')
PROTAGONIST_ASSETS = File.join(REPO_ROOT, 'assets', 'protagonistas', 'v5')
NINJA_ARCHER_JS = File.join(ROOT, 'ninja_archer_art_v1.js')
NINJA_ARCHER_ASSETS = File.join(REPO_ROOT, 'assets', 'variantes', 'ninja-arqueiro-v1')
MUSICIAN_JS = File.join(ROOT, 'musician_art_v1.js')
MUSICIAN_ASSETS = File.join(REPO_ROOT, 'assets', 'variantes', 'percussao-sintetizador-v1')
CENARIOS_JS = File.join(ROOT, 'cenarios_v2.js')
CENARIOS_ASSETS = File.join(REPO_ROOT, 'assets', 'cenarios', 'v2')
DIALOGUE_EDITS = File.join(REPO_ROOT, 'design', 'dialogo', 'EDICOES_DIALOGO.json')
VERSION = JSON.parse(File.read(File.join(REPO_ROOT, 'game', 'VERSION.json')))
OUTPUT_DIR = File.join(REPO_ROOT, 'game', 'builds', VERSION.fetch('versao'))
OUTPUT = File.join(OUTPUT_DIR, "TORII_HUTUKARA_#{VERSION.fetch('sufixo')}.html")

ASSETS = File.join(REPO_ROOT, 'assets', 'chapter-03')
RUNTIME_ASSETS = File.join(ASSETS, 'runtime')
AUTHORING = File.join(REPO_ROOT, 'design', 'chapter-03')
PREBETA = File.join(REPO_ROOT, 'assets', 'prebeta', 'runtime')

FILES = {
  '__C3_AUDIO_1__' => File.join(ASSETS, 'audio', '01-100adsense.mp3'),
  '__C3_AUDIO_2__' => File.join(ASSETS, 'audio', '02-type-shit.mp3'),
  '__C3_AUDIO_3__' => File.join(ASSETS, 'audio', '03-ak-cruzada.mp3'),
  '__C3_AUDIO_4__' => File.join(ASSETS, 'audio', '04-chico-buarque.mp3'),
  '__C3_AUDIO_5__' => File.join(ASSETS, 'audio', '05-passaros-exoticos.mp3'),
  '__C3_AUDIO_6__' => File.join(ASSETS, 'audio', '06-final-boss.mp3'),
  '__C3_ACTORS__' => File.join(RUNTIME_ASSETS, 'reference', 'FRANCO_RYUCHI_MOVIMENTO.png'),
  '__C3_PROPS__' => File.join(RUNTIME_ASSETS, 'reference', 'EDIFICIOS_PERSONAGENS.png'),
  '__C3_CAST__' => File.join(RUNTIME_ASSETS, 'reference', 'ELENCO_INIMIGOS.png'),
  '__C3_STREET__' => File.join(AUTHORING, 'RUA_DISTRITO_PROPOSTA.png'),
  '__C3_MATERIALS__' => File.join(AUTHORING, 'MATERIAIS_CIDADE_NUVENS_FONTE.png'),
  '__C3_SPRITE_MAIA__' => File.join(RUNTIME_ASSETS, 'personagens', 'MAIA_MOVIMENTO_8_FRAMES.png'),
  '__C3_SPRITE_NARA__' => File.join(RUNTIME_ASSETS, 'personagens', 'NARA_MOVIMENTO_8_FRAMES.png'),
  '__C3_SPRITE_CIRO__' => File.join(RUNTIME_ASSETS, 'personagens', 'CIRO_MOVIMENTO_8_FRAMES.png'),
  '__C3_SPRITE_VEGA__' => File.join(RUNTIME_ASSETS, 'personagens', 'VEGA_MOVIMENTO_8_FRAMES.png'),
  '__C3_SPRITE_DIMAS__' => File.join(RUNTIME_ASSETS, 'personagens', 'DIMAS_MOVIMENTO_8_FRAMES.png'),
  '__C3_SPRITE_RESIDENT_A__' => File.join(RUNTIME_ASSETS, 'personagens', 'MORADORA_DISTRITO_A_MOVIMENTO_8_FRAMES.png'),
  '__C3_SPRITE_RESIDENT_B__' => File.join(RUNTIME_ASSETS, 'personagens', 'MORADOR_DISTRITO_B_MOVIMENTO_8_FRAMES.png'),
  '__C3_SPRITE_CANAL_WORKER__' => File.join(RUNTIME_ASSETS, 'personagens', 'TRABALHADORA_CANAL_MOVIMENTO_8_FRAMES.png'),
  '__C3_SPRITE_PLANT_OPERATOR__' => File.join(RUNTIME_ASSETS, 'personagens', 'OPERADOR_USINA_MOVIMENTO_8_FRAMES.png'),
  '__C3_ATLAS_LAMPS__' => File.join(RUNTIME_ASSETS, 'ambiente', 'POSTES_LUMINARIAS_ATLAS.png'),
  '__C3_ATLAS_URBAN__' => File.join(RUNTIME_ASSETS, 'ambiente', 'MOBILIARIO_URBANO_ATLAS.png'),
  '__C3_ATLAS_WORKSHOP__' => File.join(RUNTIME_ASSETS, 'ambiente', 'OFICINA_CIRO_PROPS_ATLAS.png'),
  '__C3_ATLAS_CANAL__' => File.join(RUNTIME_ASSETS, 'ambiente', 'CANAL_INTERFERENCIA_PROPS_ATLAS.png'),
  '__C3_ATLAS_LIFT__' => File.join(RUNTIME_ASSETS, 'ambiente', 'ELEVADOR_CEU_PROPS_ATLAS.png'),
  '__PREBETA_ROLL__' => File.join(PREBETA, 'characters', 'PLAYABLE_ROLL_6X6.png'),
  '__PREBETA_RUN__' => File.join(PREBETA, 'characters', 'SYNTH_PERCUSSION_RUN.png'),
  '__PREBETA_RUN_V2__' => File.join(PREBETA, 'characters', 'SYNTH_PERCUSSION_RUN_V2_12X2.png'),
  '__PREBETA_PORTRAITS__' => File.join(PREBETA, 'dialogue', 'PLAYABLE_PORTRAITS_MASK_CANON.png'),
  '__PREBETA_PORTRAITS_V2__' => File.join(PREBETA, 'dialogue', 'PLAYABLE_PORTRAITS_NATURAL_V2.png'),
  '__PREBETA_MASK__' => File.join(PREBETA, 'dialogue', 'TORII_MASK_CANON_4X2.png'),
  '__PREBETA_PROPS__' => File.join(PREBETA, 'environment', 'ENVIRONMENT_PROPS_4X2.png'),
  '__PREBETA_CLOUDS__' => File.join(PREBETA, 'environment', 'VOLUMETRIC_CLOUDS_4X2.png'),
  '__PREBETA_CINEMA__' => File.join(PREBETA, 'dialogue', 'CINEMATIC_BACKGROUNDS_3X2.png'),
  '__PREBETA_COLLABS__' => File.join(PREBETA, 'collaborators', 'BELGA_COLLI_MAZZA_3X2.png'),
  '__PREBETA_COLLABS_MOVE__' => File.join(PREBETA, 'collaborators', 'BELGA_COLLI_MAZZA_MOVEMENT_8X3.png'),
  '__PREBETA_DNEY__' => File.join(PREBETA, 'collaborators', 'DNEY_MOVEMENT_PORTRAITS_4X3.png'),
  '__PREBETA_MATERIALS_V2__' => File.join(PREBETA, 'environment', 'ENVIRONMENT_MATERIALS_V2_4X2.png')
}.freeze

DIALOGUES = File.join(AUTHORING, 'DIALOGOS_CAPITULO_03.json')

def replace_once!(text, old, replacement, label)
  count = text.scan(old).length
  raise "Patch ausente ou ambíguo (#{label}): #{count}" unless count == 1
  text.sub!(old, replacement)
end

# Troca texto só fora de dados codificados (base64 de músicas e imagens).
# Antes, 'NILO' -> 'COLLI' também alterava a faixa Walk Talk Twin e a corrompia.
DATA_RUN = %r{[A-Za-z0-9+/=]{300,}}
def replace_in_text!(text, old, replacement)
  out = +''
  last = 0
  text.scan(DATA_RUN) do
    m = Regexp.last_match
    out << text[last...m.begin(0)].gsub(old, replacement) << m[0]
    last = m.end(0)
  end
  out << text[last..].gsub(old, replacement)
  text.replace(out)
end

def encode(path)
  raise "Arquivo ausente: #{path}" unless File.file?(path)
  Base64.strict_encode64(File.binread(path))
end

raise "Base ausente: #{BASE}" unless File.file?(BASE)
raise "Runtime ausente: #{RUNTIME}" unless File.file?(RUNTIME)
raise "Diálogos ausentes: #{DIALOGUES}" unless File.file?(DIALOGUES)

html = File.binread(BASE).force_encoding(Encoding::UTF_8)
runtime = File.read(RUNTIME, encoding: 'UTF-8')

# Replace only legacy presentation; simulation, HP and projectile loops stay intact.
boss_visual_guard = "(typeof BossChoreographyV2!=='undefined'&&BossChoreographyV2.managesLegacyTelegraph(e))"
replace_once!(html, 'const ex=e.x*T-cam.x,ey=e.y*T-cam.y;if(e.wind>0){',
  "const ex=e.x*T-cam.x,ey=e.y*T-cam.y;if(e.wind>0&&!#{boss_visual_guard}){", 'aviso genérico dos chefes')
replace_once!(html, 'combat09();const a=bossActor?.tele09;if(!a)return;',
  "combat09();const a=bossActor?.tele09;if(!a||(typeof BossChoreographyV2!=='undefined'&&BossChoreographyV2.managesLegacyTelegraph(bossActor)))return;", 'faixas do Arauto')
replace_once!(html, 'drawCombatLayer=function(){combatPrev092();ctx.save();ctx.lineWidth=3;for(const r of rings092)',
  "drawCombatLayer=function(){combatPrev092();if(typeof BossChoreographyV2!=='undefined'&&BossChoreographyV2.managesLegacyTelegraph(bossActor))return;ctx.save();ctx.lineWidth=3;for(const r of rings092)", 'ondas do Arauto')
replace_once!(html, "addCombatFX(e.x,e.y,'warning',isBoss?2.8:1.5);return;",
  "if(!#{boss_visual_guard})addCombatFX(e.x,e.y,'warning',isBoss?2.8:1.5);return;", 'círculo decorativo do Viajante')
replace_once!(runtime, "e.facing=base.angle||0;addCombatFX(e.x,e.y,'warning',base.r||3);toast(",
  "e.facing=base.angle||0;if(!#{boss_visual_guard})addCombatFX(e.x,e.y,'warning',base.r||3);toast(", 'círculo decorativo C3')
replace_once!(html, ' drawable.sort((a,b)=>a.y-b.y);for(let d of drawable)d.draw();',
  " if(typeof BossChoreographyV2!=='undefined')BossChoreographyV2.drawGround();\n drawable.sort((a,b)=>a.y-b.y);for(let d of drawable)d.draw();", 'áreas dos chefes abaixo dos personagens')

html.sub!('<title>TORII & HUTUKARA — A Última Frequência · 1.1.2 · Pré-alpha</title>',
          '<title>TORII & HUTUKARA — Alpha 1.2.0 · Pré-beta</title>')

# Nomes públicos dos colaboradores mudam sem alterar IDs persistentes de save.
{ 'BENTO' => 'BELGA', 'Bento' => 'Belga', 'NILO' => 'COLLI', 'Nilo' => 'Colli' }.each do |old, current|
  replace_in_text!(html, old, current)
end
replace_once!(html, "const who={franco:", "const who={nilo:'COLLI',bento:'BELGA',nara:'COLLI',synth:'FRANCO SINTETIZADOR',percussion:'RYUCHI PERCUSSIONISTA',metronome:'O METRÔNOMO',franco:", 'nomes de Colli e das falas do Capítulo 3 por ID interno')

replace_once!(html,
  "const VW=768,VH=432,T=24,KEY='torii_hutukara_piloto_v04';",
  "let VW=768,VH=432;const T=24,KEY='torii_hutukara_alpha_v1';",
  'chave de autosave')

replace_once!(html,
  "for(const key of [KEY,'torii_hutukara_piloto_v03','torii_hutukara_piloto_v02','torii_hutukara_piloto_v01'])",
  "for(const key of [KEY,'torii_hutukara_piloto_v04','torii_hutukara_piloto_v03','torii_hutukara_piloto_v02','torii_hutukara_piloto_v01'])",
  'migração de autosave')

replace_once!(html,
  "version:10,created:new Date().toISOString(),progress:exportState",
  "version:13,created:new Date().toISOString(),progress:exportState",
  'versão do export')
replace_once!(html,
  "a.download='torii-hutukara-salvamento.json'",
  "a.download='torii-hutukara-alpha-1-2-0-salvamento.json'",
  'nome do export')

replace_once!(html,
  'if(!original||Number(original.version)>10)return null;',
  'if(!original||Number(original.version)>13)return null;',
  'limite do schema')

replace_once!(html,
  "...(f.voicesKatana?['katana']:[])];let ids=",
  "...(f.voicesKatana?['katana']:[]),...(s.c3?.synthUnlocked?['synth']:[]),...(s.c3?.percussionUnlocked?['percussion']:[])];let ids=",
  'formação viva C3')
replace_once!(html,
  "(id==='katana'?49:id==='alt'?48:40)",
  "(id==='percussion'?46:id==='synth'?44:id==='katana'?49:id==='alt'?48:40)",
  'HP de fallback C3')

replace_once!(html,
  "dash:Object.freeze({duration:.18,cooldown:.75,invulnerability:.16,speed:13})",
  "dash:Object.freeze({duration:.30,cooldown:.75,invulnerability:.22,speed:7.8})",
  'rolamento mais fluido sem alterar distância')

signature_old = "const SIGNATURE11=Object.freeze({franco:{name:'Coração grave',cost:40,cooldown:7,color:'#edc391'},ryuchi:{name:'Corrente de vozes',cost:40,cooldown:7,color:'#9bdcd9'},alt:{name:'Chuva de flechas',cost:40,cooldown:7,color:'#c8d49a'},katana:{name:'Corte do horizonte',cost:40,cooldown:7,color:'#ded1ec'}});"
signature_new = "const SIGNATURE11=Object.freeze({franco:{name:'Coração grave',cost:40,cooldown:7,color:'#edc391'},ryuchi:{name:'Corrente de vozes',cost:40,cooldown:7,color:'#9bdcd9'},alt:{name:'Chuva de flechas',cost:40,cooldown:7,color:'#c8d49a'},katana:{name:'Corte do horizonte',cost:40,cooldown:7,color:'#ded1ec'},synth:{name:'Camadas vivas',cost:40,cooldown:7,color:'#69ecec'},percussion:{name:'Pulso comum',cost:40,cooldown:7,color:'#ff86cd'}});"
replace_once!(html, signature_old, signature_new, 'assinaturas dos seis integrantes')

combat_old = "['forest','ruins','voices','voice_roofs','radio9','voice_tower']"
combat_new = "['forest','ruins','voices','voice_roofs','radio9','voice_tower','distortion_district','power_plant','sky_canal','cloud_sea','cloud_terrace','silence_core']"
combat_count = html.scan(combat_old).length
raise "Arrays de área de combate não encontrados" if combat_count.zero?
html.gsub!(combat_old, combat_new)

replace_once!(html,
  "if(bossActor.id==='voice_boss'){drawCreature(bx,by,'boss',bossActor);}else{",
  "if(['boss','voice_boss','c3_metronome','c3_silence'].includes(bossActor.id)){drawCreature(bx,by,bossActor.type||'boss',bossActor);}else{",
  'render dos chefes C3')

dialogue_document = JSON.parse(File.read(DIALOGUES, encoding: 'UTF-8'))
public_names = { 'Maia' => 'Belga', 'Ciro' => 'Mazza', 'Nara' => 'Colli', 'Vega' => 'Dney' }
dialogue_document.fetch('scenes').each do |scene|
  scene.fetch('lines', []).each do |line|
    line['speaker'] = public_names.fetch(line['speaker'], line['speaker'])
    public_names.each { |old, current| line['text'] = line['text'].gsub(old, current) }
    line['text'] = line['text'].gsub('A Dney', 'O Dney').gsub('à Dney', 'ao Dney').gsub('da Dney', 'do Dney')
  end
  scene.fetch('choices', []).each do |choice|
    public_names.each do |old, current|
      choice['text'] = choice['text'].gsub(old, current)
      choice['effect'] = choice['effect'].to_s.gsub(old, current)
    end
    choice['effect'] = choice['effect'].gsub('Dney decide', 'Dney decide')
  end
end
line_overrides = {
  'C3_001.03' => 'Então foram vocês que a máscara escolheu. Eu sou Belga. Guardo aqui os sons que a cidade tenta esquecer — e O Silêncio chegou antes para separar todos eles.',
  'C3_002.02' => 'O horário eu sei. Sou Dney; cuido da imagem e da ressonância do Contratempo. Falta decidir o que a cidade precisa enxergar quando a música começar.',
  'C3_002.04' => 'Estou esperando a imagem parar de fingir que está inteira. Quando uma borda falha, eu sei que O Silêncio passou por ali.',
  'C3_004.01' => 'A oficina está aberta. Eu sou Mazza. Se um instrumento daqui parece improvisado, é porque já sobreviveu a alguma coisa.',
  'C3_004.03' => 'O Colli foi mapear o Canal Suspenso. Ele lê corrente de ar como quem lê uma rua; eu não devia ter deixado ele ir sozinho.',
  'C3_004.05' => 'Podia. Fiquei tentando decidir se esperar era cautela ou medo. Não vou repetir isso.',
  'C3_008.04' => 'Tem mais gente na comporta. Eu marquei o caminho, mas uma coisa está repetindo a voz deles e apagando minhas referências.',
  'C3_009.01' => 'Eu aumento o sinal e a água devolve tudo por cima. A rota existe; precisamos separar a interferência do lugar verdadeiro.',
  'C3_011.01' => 'O mapa voltou inteiro?',
  'C3_011.02' => 'Eu também, obrigado.',
  'C3_011.03' => 'Eu ia perguntar isso primeiro. A flauta só funciona porque o desenho do Colli diz onde o ar consegue ficar.',
  'C3_011.04' => 'Esta é a Flauta dos Ventos. O Mazza construiu o corpo; eu desenhei as rotas que ela consegue revelar.',
  'C3_013.01' => 'O pulso voltou. Colli trouxe os nomes de todo mundo que atravessou a comporta — ninguém vira só número no arquivo do Contratempo.',
  'C3_014.01' => 'Agora a imagem tem harmonia e pulso. Eu consigo projetar a intenção de vocês até o Elevador, mas a frase precisa vir da banda.',
  'C3_015.01' => 'A frase entrou no sistema. Eu deixei as imperfeições visíveis — foram elas que mostraram ao Elevador que havia gente tocando.',
  'C3_018.01' => 'A Flauta revela onde o ar sustenta peso. O Tambor ancora o passo. Sigam minhas marcas claras; são o mapa que a cidade não conseguiu apagar.',
  'C3_020.01' => 'O sinal chegou inteiro. Eu reconheci cada frequência — até as que vocês quase esconderam.',
  'C3_026.01' => 'Vocês vão voltar? Eu ainda quero redesenhar este mapa quando ele deixar de ser uma fuga.',
  'C3_S01.01' => 'Não precisa mexer na projeção. Só me ajuda a encontrar uma fita sem rótulo que caiu perto do canal.',
  'C3_S01.03' => 'Primeiro show do Contratempo. Eu projetei tudo antes de aprender a escutar a banda. Desde aquela noite, tenho medo de rever a fita.',
  'C3_S01.05' => 'Porque eu estava lá. Foi a noite em que entendi que um erro meu não precisava apagar o resto da banda.',
  'C3_S02.01' => 'Nossa. Eu cortei para a minha imagem antes da primeira nota terminar.',
  'C3_S02.03' => 'Eu só lembrava do meu erro. A fita guardou todo mundo que continuou tocando depois dele.'
}
dialogue_document.fetch('scenes').each do |scene|
  scene.fetch('lines', []).each { |line| line['text'] = line_overrides.fetch(line['id'], line['text']) }
end
dialogue_data = JSON.generate(dialogue_document)
replace_once!(runtime, '__C3_DIALOGUES__', dialogue_data, 'diálogos C3')
FILES.each { |placeholder, path| replace_once!(runtime, placeholder, encode(path), File.basename(path)) }

leftovers = runtime.scan(/__C3_[A-Z0-9_]+__/).uniq
raise "Placeholders restantes: #{leftovers.join(', ')}" unless leftovers.empty?

marker = "\ninit();\n</script>"
position = html.rindex(marker)
raise 'Ponto final de injeção não encontrado' unless position
edits_json = JSON.generate(JSON.parse(File.read(DIALOGUE_EDITS, encoding: 'UTF-8')))
edits_js = File.read(DIALOGUE_EDITS_JS, encoding: 'UTF-8')
raise 'Marcador __DIALOGUE_EDITS__ ausente' unless edits_js.include?('__DIALOGUE_EDITS__')
edits_js = edits_js.sub('__DIALOGUE_EDITS__') { edits_json }
input_runtime = File.read(INPUT_RUNTIME, encoding: 'UTF-8').gsub('__BUILD_LABEL__', VERSION.fetch('rotulo')).gsub('__BUILD_TITLE__', VERSION.fetch('titulo'))
raise 'Rótulo de versão ausente no runtime' if input_runtime.include?('__BUILD_')
ninja_archer_manifest = JSON.parse(File.read(File.join(NINJA_ARCHER_ASSETS, 'manifest.json')))
ninja_archer_files = ninja_archer_manifest.fetch('animations').map { |a| a.fetch('atlas') }.uniq + ninja_archer_manifest.fetch('portraits').map { |p| p.fetch('file') }
ninja_archer_uris = ninja_archer_files.to_h do |relative|
  hero = relative.split('/')[1]
  key = relative.start_with?('atlas/') ? File.basename(relative, '.png') : "#{hero}_portrait_#{File.basename(relative, '.png')}"
  [key, "data:image/png;base64,#{encode(File.join(NINJA_ARCHER_ASSETS, relative))}"]
end
ninja_archer_runtime = File.read(NINJA_ARCHER_JS, encoding: 'UTF-8')
replace_once!(ninja_archer_runtime, '__NINJA_ARCHER_ASSETS__', JSON.generate(ninja_archer_uris), 'sprites Ninja e Arqueiro')
replace_once!(ninja_archer_runtime, '__NINJA_ARCHER_MANIFEST__', JSON.generate(ninja_archer_manifest), 'manifesto Ninja e Arqueiro')
cenarios_manifest = JSON.parse(File.read(File.join(CENARIOS_ASSETS, 'manifest.json')))
cenarios_theme = ENV.fetch('TORII_CENARIOS_THEME', 'deserto-v1')
raise 'Unknown scenario theme' unless %w[v2 deserto-v1].include?(cenarios_theme)
desert_manifest_path = File.join(REPO_ROOT, 'assets', 'cenarios', 'deserto-v1', 'manifest.json')
if cenarios_theme == 'deserto-v1'
  desert = JSON.parse(File.read(desert_manifest_path))
  %w[sheets items backgrounds].each do |group|
    cenarios_manifest[group] ||= {}
    desert.fetch(group).each do |id, record|
      copy = Marshal.load(Marshal.dump(record))
      copy['file'] = '../deserto-v1/' + copy.fetch('file')
      cenarios_manifest.fetch(group)[id] = copy
    end
  end
  replaced_ids = desert.fetch('sources').map { |s| s.fetch('id') }
  cenarios_manifest['sources'] = cenarios_manifest.fetch('sources').reject { |s| replaced_ids.include?(s.fetch('id')) } + desert.fetch('sources')
  cenarios_manifest['theme'] = 'deserto-v1'
  cenarios_manifest['variantStage'] = desert.fetch('stage')
end
cenarios_resources = cenarios_manifest.fetch('sheets').merge(cenarios_manifest.fetch('backgrounds', {}))
cenarios_files = cenarios_resources.values.map { |s| s.fetch('file') }
cenarios_uris = cenarios_resources.to_h { |id, sheet| [id, "data:image/png;base64,#{encode(File.expand_path(sheet.fetch('file'), CENARIOS_ASSETS))}"] }
cenarios_runtime = File.read(CENARIOS_JS, encoding: 'UTF-8')
replace_once!(cenarios_runtime, '__CENARIOS_V2_MANIFEST__', JSON.generate(cenarios_manifest), 'manifesto de cenários V2')
replace_once!(cenarios_runtime, '__CENARIOS_V2_ASSETS__', JSON.generate(cenarios_uris), 'PNG de cenários V2')
if cenarios_theme == 'deserto-v1'
  cenarios_runtime += "\n" + File.read(File.join(ROOT, 'cenarios_deserto_v1.js'), encoding: 'UTF-8')
end
protagonist_manifest = JSON.parse(File.read(File.join(PROTAGONIST_ASSETS, 'manifest.json')))
protagonist_files = protagonist_manifest.fetch('animations').map { |a| a.fetch('atlas') }.uniq + protagonist_manifest.fetch('portraits').map { |p| p.fetch('file') }
protagonist_uris = protagonist_files.to_h do |relative|
  hero = relative.split('/')[1]
  key = relative.start_with?('atlas/') ? File.basename(relative, '.png') : "#{hero}_portrait_#{File.basename(relative, '.png')}"
  [key, "data:image/png;base64,#{encode(File.join(PROTAGONIST_ASSETS, relative))}"]
end
protagonist_runtime = File.read(PROTAGONIST_JS, encoding: 'UTF-8')
replace_once!(protagonist_runtime, '__PROTAGONIST_ASSETS__', JSON.generate(protagonist_uris), 'sprites protagonistas V5')
replace_once!(protagonist_runtime, '__PROTAGONIST_MANIFEST__', JSON.generate(protagonist_manifest), 'manifesto protagonistas V5')
enemy_art_manifest = JSON.parse(File.read(File.join(ENEMY_ART_ASSETS, 'manifest.json')))
enemy_art_files = enemy_art_manifest.fetch('enemies').values.map { |entry| entry.fetch('atlas') }.uniq
enemy_art_uris = enemy_art_manifest.fetch('enemies').to_h { |key, entry| [key, "data:image/png;base64,#{encode(File.join(ENEMY_ART_ASSETS, entry.fetch('atlas')))}"] }
enemy_art_runtime = File.read(ENEMY_ART_JS, encoding: 'UTF-8')
replace_once!(enemy_art_runtime, '__ENEMY_ART_ASSETS__', JSON.generate(enemy_art_uris), 'sprites de inimigos')
replace_once!(enemy_art_runtime, '__ENEMY_ART_MANIFEST__', JSON.generate(enemy_art_manifest), 'manifesto de inimigos')
musician_manifest = JSON.parse(File.read(File.join(MUSICIAN_ASSETS, 'manifest.json')))
raise 'Pacote Percussionista/Sintetizador incompleto' unless musician_manifest['complete'] == true
musician_files = (musician_manifest.fetch('animations').map { |a| a.fetch('atlas') } + musician_manifest.fetch('portraits').map { |p| p.fetch('file') }).uniq
musician_uris = {}
musician_manifest.fetch('animations').each do |animation|
  key = [animation.fetch('hero'), animation.fetch('variant'), animation.fetch('state')].join('_')
  musician_uris[key] ||= "data:image/png;base64,#{encode(File.join(MUSICIAN_ASSETS, animation.fetch('atlas')))}"
end
musician_manifest.fetch('portraits').each do |portrait|
  key = [portrait.fetch('hero'), portrait.fetch('variant'), 'portrait', portrait.fetch('expression')].join('_')
  musician_uris[key] = "data:image/png;base64,#{encode(File.join(MUSICIAN_ASSETS, portrait.fetch('file')))}"
end
# The earth/scrap palette is canonical; no alternate context images are embedded.
raise 'Não publicar paleta dupla/contextual' if musician_manifest.fetch('contexts', {}).any?
%w[paletteRecipe geometryAudit].each do |field|
  relative = musician_manifest.fetch(field)
  raise "Metadado de paleta inválido: #{field}" unless relative.is_a?(String) && File.file?(File.join(MUSICIAN_ASSETS, relative))
  musician_files << relative
end
# Optional evidence for the localized, approved masked-head corrections.
if musician_manifest.key?('correctionAudit')
  relative = musician_manifest.fetch('correctionAudit')
  raise 'Auditoria de correções inválida' unless relative == 'AUDITORIA_CORRECOES_FLUIDEZ.json' && File.file?(File.join(MUSICIAN_ASSETS, relative))
  musician_files << relative
end
musician_files.uniq!
musician_runtime = File.read(MUSICIAN_JS, encoding: 'UTF-8')
replace_once!(musician_runtime, '__MUSICIAN_ASSETS__', JSON.generate(musician_uris), 'sprites Percussionista e Sintetizador com paleta canônica')
replace_once!(musician_runtime, '__MUSICIAN_MANIFEST__', JSON.generate(musician_manifest), 'manifesto Percussionista e Sintetizador')
boss_animation_manifest = JSON.parse(File.read(File.join(BOSS_ANIMATION_ASSETS, 'manifest.json')))
boss_animation_files = boss_animation_manifest.fetch('clips').values.map { |entry| entry.fetch('atlas') }.uniq
boss_animation_uris = boss_animation_files.to_h { |file| [file, "data:image/png;base64,#{encode(File.join(BOSS_ANIMATION_ASSETS, file))}"] }
boss_animation_runtime = File.read(BOSS_ANIMATION_JS, encoding: 'UTF-8')
replace_once!(boss_animation_runtime, '__BOSS_ANIMATION_ASSETS__', JSON.generate(boss_animation_uris), 'animações dos chefes')
replace_once!(boss_animation_runtime, '__BOSS_ANIMATION_MANIFEST__', JSON.generate(boss_animation_manifest), 'manifesto de animações dos chefes')
ground_fx_manifest = JSON.parse(File.read(File.join(BOSS_GROUND_FX_ASSETS, 'manifest.json')))
ground_fx_files = ground_fx_manifest.fetch('clips').values.map { |entry| entry.fetch('atlas') }.uniq
ground_fx_uris = ground_fx_manifest.fetch('clips').to_h { |key, entry| [key, "data:image/png;base64,#{encode(File.join(BOSS_GROUND_FX_ASSETS, entry.fetch('atlas')))}"] }
ground_fx_runtime = File.read(BOSS_GROUND_FX_JS, encoding: 'UTF-8')
replace_once!(ground_fx_runtime, '__BOSS_GROUND_FX_ASSETS__', JSON.generate(ground_fx_uris), 'sprites FX de golpes no chão')
replace_once!(ground_fx_runtime, '__BOSS_GROUND_FX_MANIFEST__', JSON.generate(ground_fx_manifest), 'manifesto FX de golpes no chão')
# Embedded runtime strings now own these bytes; release duplicate URI maps
# before constructing the portable HTML on memory-constrained computers.
ninja_archer_uris = protagonist_uris = musician_uris = cenarios_uris = enemy_art_uris = boss_animation_uris = ground_fx_uris = nil
GC.start
# Insert pieces in reverse at the same anchor: identical bytes without a second
# full-size concatenation of every embedded PNG/audio runtime.
parts = [runtime, input_runtime, edits_js, *[PACING_JS, HEALING_JS, COMBAT_JS, FLOW_JS, ACCESS_JS, PACE_METER].map { |path| File.read(path, encoding: 'UTF-8') }, ninja_archer_runtime, protagonist_runtime, cenarios_runtime, musician_runtime, enemy_art_runtime, boss_animation_runtime, ground_fx_runtime]
runtime = input_runtime = edits_js = ninja_archer_runtime = protagonist_runtime = cenarios_runtime = musician_runtime = enemy_art_runtime = boss_animation_runtime = ground_fx_runtime = nil
html.insert(position, "\n")
until parts.empty?
  part = parts.pop
  html.insert(position, part)
  html.insert(position, "\n\n")
end
part = nil
GC.start

html.gsub!('ALPHA 1.2.0', VERSION.fetch('rotulo'))
html.gsub!('Alpha 1.2.0', VERSION.fetch('titulo'))

html.gsub!('clamp(G.x*T-VW/2,0,a.w*T-VW)', 'clamp(coopCamera123("x")*T-VW/2,0,a.w*T-VW)')
html.gsub!('clamp(G.y*T-VH/2,0,a.h*T-VH)', 'clamp(coopCamera123("y")*T-VH/2,0,a.h*T-VH)')
html.gsub!("yy=bossActor?.id==='voice_boss'?", "yy=!C3.coopActive()&&bossActor?.id==='voice_boss'?")
FileUtils.mkdir_p(OUTPUT_DIR)
File.binwrite(OUTPUT, html)

sources = [PROTAGONIST_JS, File.join(PROTAGONIST_ASSETS, 'manifest.json')] + protagonist_files.map { |relative| File.join(PROTAGONIST_ASSETS, relative) } + FILES.values + [BASE, RUNTIME, INPUT_RUNTIME, DIALOGUE_EDITS_JS, DIALOGUE_EDITS, PACING_JS, HEALING_JS, COMBAT_JS, FLOW_JS, ACCESS_JS, PACE_METER, DIALOGUES, NINJA_ARCHER_JS, File.join(NINJA_ARCHER_ASSETS, 'manifest.json')] + ninja_archer_files.map { |relative| File.join(NINJA_ARCHER_ASSETS, relative) }
sources += [MUSICIAN_JS, File.join(MUSICIAN_ASSETS, 'manifest.json')] + musician_files.map { |relative| File.join(MUSICIAN_ASSETS, relative) }
sources += [CENARIOS_JS, File.join(CENARIOS_ASSETS, 'manifest.json')] + cenarios_files.map { |relative| File.expand_path(relative, CENARIOS_ASSETS) }
if cenarios_theme == 'deserto-v1'
  sources += [desert_manifest_path, File.join(ROOT, 'cenarios_deserto_v1.js')]
end

sources += [ENEMY_ART_JS, File.join(ENEMY_ART_ASSETS, 'manifest.json')] + enemy_art_files.map { |relative| File.join(ENEMY_ART_ASSETS, relative) }
sources += [BOSS_ANIMATION_JS, File.join(BOSS_ANIMATION_ASSETS, 'manifest.json')] + boss_animation_files.map { |relative| File.join(BOSS_ANIMATION_ASSETS, relative) }

sources += [BOSS_GROUND_FX_JS, File.join(BOSS_GROUND_FX_ASSETS, 'manifest.json')] + ground_fx_files.map { |relative| File.join(BOSS_GROUND_FX_ASSETS, relative) }
manifest = {
  game: 'TORII & HUTUKARA',
  build: VERSION.fetch('rotulo'),
  version: VERSION.fetch('versao'),
  schema: 13,
  created_at: Time.now.iso8601,
  output: {
    file: File.basename(OUTPUT),
    bytes: File.size(OUTPUT),
    sha256: Digest::SHA256.file(OUTPUT).hexdigest
  },
  chapter_3: {
    title: 'O Som que Ainda Não Existe',
    areas: 11,
    playable_characters: 6,
    final_boss_patterns: 7,
    patterns_per_attempt: 5,
    tracks: %w[100Adsense type_shit ak_cruzada chico_buarque passaros_exoticos nervos]
  },
  controls: {
    keyboard: true,
    touch: true,
    gamepad_api: true,
    playstation_mapping: true,
    local_players: 2,
    shared_camera: true,
    dedicated_mobile: true,
    portrait_viewport: [512, 480],
    landscape_viewport: [768, 432],
    distance_teleport: false
  },
  sources: sources.uniq.to_h do |path|
    key = [NINJA_ARCHER_ASSETS, PROTAGONIST_ASSETS, File.join(REPO_ROOT, 'assets', 'cenarios'), MUSICIAN_ASSETS, ENEMY_ART_ASSETS, BOSS_ANIMATION_ASSETS, BOSS_GROUND_FX_ASSETS].any? { |folder| path.start_with?(folder + '/') } ? path.delete_prefix(REPO_ROOT + '/') : File.basename(path)

    [key, { bytes: File.size(path), sha256: Digest::SHA256.file(path).hexdigest }]
  end
}

manifest_path = File.join(OUTPUT_DIR, "MANIFESTO_#{VERSION.fetch('sufixo')}.json")
File.write(manifest_path, JSON.pretty_generate(manifest) + "\n")
File.write(File.join(OUTPUT_DIR, "SHA256_#{VERSION.fetch('sufixo')}.txt"), "#{manifest[:output][:sha256]}  #{File.basename(OUTPUT)}\n")
File.write(File.join(OUTPUT_DIR, "LEIA-ME_#{VERSION.fetch('sufixo')}.txt"), <<~README)
  TORII & HUTUKARA — #{VERSION.fetch('rotulo')}
  =================================

  Build jogável completa, do Capítulo 01 ao Capítulo 03.
  Arquivo principal: #{File.basename(OUTPUT)}

  COMO JOGAR
  - Abra o HTML em um navegador moderno.
  - A jornada normal começa no estúdio.
  - Em OUTRAS OPÇÕES há previews dos Capítulos 02 e 03 para teste.
  - WASD/setas: mover · Shift: correr · E: interagir.
  - J/Espaço: atacar · Z/X: técnicas · Q: dash · K: especial.
  - 1–3: trocar o integrante ativo.
  - Controle PlayStation: analógico/direcional mover · ✕ interagir · □ atacar · ○ esquivar.
  - L1/R1: técnicas · R2: especial · △: trocar integrante · Options: pausa.
  - Com dois controles, cada pessoa controla um integrante da formação em coop local.
  - Celulares e tablets abrem com controles dedicados em retrato ou paisagem.
  - No celular: analógico virtual com corrida na borda, multitouch e botões de combate.
  - Círculo sempre esquiva durante a exploração; apenas Options/Start abre a pausa.
  - O segundo jogador é puxado por rotas livres, sem teleporte por distância.

  CONTEÚDO DA VERSÃO
  - Três capítulos conectados e salvamento migrável da build 1.1.2.
  - Seis personagens jogáveis, formação de até três.
  - Duas ordens possíveis de recrutamento no Capítulo 03.
  - Metrônomo, O Silêncio, retries e epílogo no estúdio.
  - Seis faixas novas incorporadas no próprio HTML.
  - Belga, Colli, Mazza e Dney ocupam os papéis centrais do Capítulo 03, com sprites e retratos próprios.
  - Postes, mobiliário, oficina, canal e elevador redesenhados.
  - Objetivos do canal e da usina reagem ao estado real da missão.
  - Transição do Capítulo 02 ao Capítulo 03 sem voltar ao menu.
  - Entrada do Elevador do Céu acessível depois da frase do Contratempo.
  - Ryuchi percussionista com corrida, rolamento e golpes rítmicos próprios.
  - Franco sintetizador com combo de oscilador, pads persistentes e filtro de corte.
  - Recrutamentos acontecem somente depois das apresentações específicas de cada rota.
  - Passarela de entrada do Núcleo do Silêncio reconstruída e caminhável.
  - NPCs do Capítulo 03 com movimento ambiente e reação à aproximação.
  - Pisos do distrito, interiores, canal e nuvens usam texturas detalhadas.
  - Rosto do Franco refeito com referências autorais e identidade consistente nos diálogos.
  - Máscara Torii canônica ampliada sobre testa e cabelo, mantendo a parte inferior do rosto visível.
  - Ninja e Arqueiro com oito poses por ação, quatro direções, retratos e rolamento próprios.
  - Ninja sem máscara; Arqueiro com a máscara presa ao cinto em todas as ações.
  - Os demais integrantes mantêm suas animações atuais.
  - Cenários V2: 12 atlas de produção, 126 recortes e estados, pisos sem objetos embutidos.
  - Nuvens por vizinhança, barreiras visíveis da Usina, sinalização junto às fachadas e móveis próprios do Contratempo.
  - Corrida fluida própria para Franco sintetizador e Ryuchi percussionista.
  - Nuvens volumétricas em 16 bits e fundos cinematográficos próprios por região.
  - Placas, postes e pilares substituídos por sprites detalhados.
  - Colisões do Distrito da Distorção alinhadas às fachadas, inclusive no setor noroeste.
  - Placas próprias para Contratempo, Oficina, Usina, Canal e Elevador.
  - Pós-jogo com revisita e criação de uma nova frase musical.
  - DualShock 4, DualSense e controles padronizados via Gamepad API.
  - Coop local para duas pessoas, com HP e ações independentes em câmera compartilhada.

  O arquivo original TORII_HUTUKARA_1_1_2_TRILHAS.html não é alterado.
  Esta é uma Beta: use o menu para exportar o progresso periodicamente.
README

warn "Gerado: #{OUTPUT}"
warn "Tamanho: #{File.size(OUTPUT)} bytes"
warn "SHA-256: #{manifest[:output][:sha256]}"

# O site publica sempre a versão atual.
File.write(File.join(REPO_ROOT, 'web', 'playtest', 'build.json'), JSON.pretty_generate(
  'version' => VERSION.fetch('numero'),
  'manifest' => "game/builds/#{VERSION.fetch('versao')}/MANIFESTO_#{VERSION.fetch('sufixo')}.json"
) + "\n")
