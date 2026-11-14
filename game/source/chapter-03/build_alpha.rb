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
DIALOGUE_EDITS = File.join(REPO_ROOT, 'design', 'dialogo', 'EDICOES_DIALOGO.json')
OUTPUT_DIR = File.join(REPO_ROOT, 'game', 'builds', 'alpha-1.2.4')
OUTPUT = File.join(OUTPUT_DIR, 'TORII_HUTUKARA_ALPHA_1_2_4_MOBILE_COOP.html')

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

def encode(path)
  raise "Arquivo ausente: #{path}" unless File.file?(path)
  Base64.strict_encode64(File.binread(path))
end

raise "Base ausente: #{BASE}" unless File.file?(BASE)
raise "Runtime ausente: #{RUNTIME}" unless File.file?(RUNTIME)
raise "Diálogos ausentes: #{DIALOGUES}" unless File.file?(DIALOGUES)

html = File.binread(BASE).force_encoding(Encoding::UTF_8)
runtime = File.read(RUNTIME, encoding: 'UTF-8')

html.sub!('<title>TORII & HUTUKARA — A Última Frequência · 1.1.2 · Pré-alpha</title>',
          '<title>TORII & HUTUKARA — Alpha 1.2.0 · Pré-beta</title>')

# Nomes públicos dos colaboradores mudam sem alterar IDs persistentes de save.
html.gsub!('BENTO', 'BELGA').gsub!('Bento', 'Belga')
html.gsub!('NILO', 'COLLI').gsub!('Nilo', 'Colli')
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
combat_new = "['forest','ruins','voices','voice_roofs','radio9','voice_tower','power_plant','sky_canal','cloud_sea','cloud_terrace','silence_core']"
combat_count = html.scan(combat_old).length
raise "Arrays de área de combate não encontrados" if combat_count.zero?
html.gsub!(combat_old, combat_new)

replace_once!(html,
  "if(bossActor.id==='voice_boss'){drawCreature(bx,by,'boss',bossActor);}else{",
  "if(['voice_boss','c3_metronome','c3_silence'].includes(bossActor.id)){drawCreature(bx,by,bossActor.id==='voice_boss'?'boss':bossActor.type,bossActor);}else{",
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
html.insert(position, "\n\n#{runtime}\n\n#{File.read(INPUT_RUNTIME, encoding: 'UTF-8')}\n\n#{edits_js}\n\n#{File.read(PACING_JS, encoding: 'UTF-8')}\n\n#{File.read(PACE_METER, encoding: 'UTF-8')}\n")
html.gsub!('ALPHA 1.2.0', 'ALPHA 1.2.4')
html.gsub!('Alpha 1.2.0', 'Alpha 1.2.4')

html.gsub!('clamp(G.x*T-VW/2,0,a.w*T-VW)', 'clamp(coopCamera123("x")*T-VW/2,0,a.w*T-VW)')
html.gsub!('clamp(G.y*T-VH/2,0,a.h*T-VH)', 'clamp(coopCamera123("y")*T-VH/2,0,a.h*T-VH)')
html.gsub!("yy=bossActor?.id==='voice_boss'?", "yy=!C3.coopActive()&&bossActor?.id==='voice_boss'?")
FileUtils.mkdir_p(OUTPUT_DIR)
File.binwrite(OUTPUT, html)

sources = FILES.values + [BASE, RUNTIME, INPUT_RUNTIME, DIALOGUE_EDITS_JS, DIALOGUE_EDITS, PACING_JS, PACE_METER, DIALOGUES]
manifest = {
  game: 'TORII & HUTUKARA',
  build: 'ALPHA 1.2.4 · MOBILE & CO-OP',
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
    [File.basename(path), { bytes: File.size(path), sha256: Digest::SHA256.file(path).hexdigest }]
  end
}

manifest_path = File.join(OUTPUT_DIR, 'MANIFESTO_ALPHA_1_2_4.json')
File.write(manifest_path, JSON.pretty_generate(manifest) + "\n")
File.write(File.join(OUTPUT_DIR, 'SHA256_ALPHA_1_2_4.txt'), "#{manifest[:output][:sha256]}  #{File.basename(OUTPUT)}\n")
File.write(File.join(OUTPUT_DIR, 'LEIA-ME_ALPHA_1_2_4.txt'), <<~README)
  TORII & HUTUKARA — ALPHA 1.2.4 · MOBILE & CO-OP
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

  CONTEÚDO DA ALPHA
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
  - Rolamento em seis etapas para os seis personagens jogáveis.
  - Corrida fluida própria para Franco sintetizador e Ryuchi percussionista.
  - Nuvens volumétricas em 16 bits e fundos cinematográficos próprios por região.
  - Placas, postes e pilares substituídos por sprites detalhados.
  - Colisões do Distrito da Distorção alinhadas às fachadas, inclusive no setor noroeste.
  - Placas próprias para Contratempo, Oficina, Usina, Canal e Elevador.
  - Pós-jogo com revisita e criação de uma nova frase musical.
  - DualShock 4, DualSense e controles padronizados via Gamepad API.
  - Coop local para duas pessoas, com HP e ações independentes em câmera compartilhada.

  O arquivo original TORII_HUTUKARA_1_1_2_TRILHAS.html não é alterado.
  Esta é uma Alpha: use o menu para exportar o progresso periodicamente.
README

warn "Gerado: #{OUTPUT}"
warn "Tamanho: #{File.size(OUTPUT)} bytes"
warn "SHA-256: #{manifest[:output][:sha256]}"
