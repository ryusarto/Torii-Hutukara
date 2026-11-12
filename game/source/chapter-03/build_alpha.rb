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
OUTPUT_DIR = File.join(REPO_ROOT, 'game', 'builds', 'alpha-1.1.2')
OUTPUT = File.join(OUTPUT_DIR, 'TORII_HUTUKARA_ALPHA_1_1_2_COMPLETO.html')

ASSETS = File.join(REPO_ROOT, 'assets', 'chapter-03')
RUNTIME_ASSETS = File.join(ASSETS, 'runtime')
AUTHORING = File.join(REPO_ROOT, 'design', 'chapter-03')

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
  '__C3_ATLAS_LIFT__' => File.join(RUNTIME_ASSETS, 'ambiente', 'ELEVADOR_CEU_PROPS_ATLAS.png')
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

replace_once!(html,
  "const VW=768,VH=432,T=24,KEY='torii_hutukara_piloto_v04';",
  "const VW=768,VH=432,T=24,KEY='torii_hutukara_alpha_v1';",
  'chave de autosave')

replace_once!(html,
  "for(const key of [KEY,'torii_hutukara_piloto_v03','torii_hutukara_piloto_v02','torii_hutukara_piloto_v01'])",
  "for(const key of [KEY,'torii_hutukara_piloto_v04','torii_hutukara_piloto_v03','torii_hutukara_piloto_v02','torii_hutukara_piloto_v01'])",
  'migração de autosave')

replace_once!(html,
  "version:10,created:new Date().toISOString(),progress:exportState",
  "version:12,created:new Date().toISOString(),progress:exportState",
  'versão do export')
replace_once!(html,
  "a.download='torii-hutukara-salvamento.json'",
  "a.download='torii-hutukara-alpha-1-1-2-salvamento.json'",
  'nome do export')

replace_once!(html,
  'if(!original||Number(original.version)>10)return null;',
  'if(!original||Number(original.version)>12)return null;',
  'limite do schema')

replace_once!(html,
  "...(f.voicesKatana?['katana']:[])];let ids=",
  "...(f.voicesKatana?['katana']:[]),...(s.c3?.synthUnlocked?['synth']:[]),...(s.c3?.percussionUnlocked?['percussion']:[])];let ids=",
  'formação viva C3')
replace_once!(html,
  "(id==='katana'?49:id==='alt'?48:40)",
  "(id==='percussion'?46:id==='synth'?44:id==='katana'?49:id==='alt'?48:40)",
  'HP de fallback C3')

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

dialogue_data = JSON.generate(JSON.parse(File.read(DIALOGUES, encoding: 'UTF-8')))
replace_once!(runtime, '__C3_DIALOGUES__', dialogue_data, 'diálogos C3')
FILES.each { |placeholder, path| replace_once!(runtime, placeholder, encode(path), File.basename(path)) }

leftovers = runtime.scan(/__C3_[A-Z0-9_]+__/).uniq
raise "Placeholders restantes: #{leftovers.join(', ')}" unless leftovers.empty?

marker = "\ninit();\n</script>"
position = html.rindex(marker)
raise 'Ponto final de injeção não encontrado' unless position
html.insert(position, "\n\n#{runtime}\n")

FileUtils.mkdir_p(OUTPUT_DIR)
File.binwrite(OUTPUT, html)

sources = FILES.values + [BASE, RUNTIME, DIALOGUES]
manifest = {
  game: 'TORII & HUTUKARA',
  build: 'ALPHA 1.1.2',
  schema: 12,
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
  sources: sources.uniq.to_h do |path|
    [File.basename(path), { bytes: File.size(path), sha256: Digest::SHA256.file(path).hexdigest }]
  end
}

manifest_path = File.join(OUTPUT_DIR, 'MANIFESTO_ALPHA_1_1_2.json')
File.write(manifest_path, JSON.pretty_generate(manifest) + "\n")
File.write(File.join(OUTPUT_DIR, 'SHA256_ALPHA_1_1_2.txt'), "#{manifest[:output][:sha256]}  #{File.basename(OUTPUT)}\n")
File.write(File.join(OUTPUT_DIR, 'LEIA-ME_ALPHA_1_1_2.txt'), <<~README)
  TORII & HUTUKARA — ALPHA 1.1.2
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

  CONTEÚDO DA ALPHA
  - Três capítulos conectados e salvamento migrável da build 1.1.2.
  - Seis personagens jogáveis, formação de até três.
  - Duas ordens possíveis de recrutamento no Capítulo 03.
  - Metrônomo, O Silêncio, retries e epílogo no estúdio.
  - Seis faixas novas incorporadas no próprio HTML.
  - Sprites próprios para Maia, Nara, Ciro, Vega, Dimas e NPCs do distrito.
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
  - Placas próprias para Contratempo, Oficina, Usina, Canal e Elevador.
  - Pós-jogo com revisita e criação de uma nova frase musical.

  O arquivo original TORII_HUTUKARA_1_1_2_TRILHAS.html não é alterado.
  Esta é uma Alpha: use o menu para exportar o progresso periodicamente.
README

warn "Gerado: #{OUTPUT}"
warn "Tamanho: #{File.size(OUTPUT)} bytes"
warn "SHA-256: #{manifest[:output][:sha256]}"
