#!/usr/bin/env ruby
# frozen_string_literal: true

require 'digest'
require 'json'

root = File.expand_path(__dir__)
repo_root = File.expand_path('../../..', root)
base = File.join(repo_root, 'game', 'source', 'base', 'TORII_HUTUKARA_1_1_2_TRILHAS.html')
version = JSON.parse(File.read(File.join(repo_root, 'game', 'VERSION.json')))
alpha = File.join(repo_root, 'game', 'builds', version.fetch('versao'), "TORII_HUTUKARA_#{version.fetch('sufixo')}.html")
runtime = File.join(root, 'chapter3_runtime.js')
dialogues = File.join(repo_root, 'design', 'chapter-03', 'DIALOGOS_CAPITULO_03.json')
collaborator_atlases = %w[
  BELGA_COLLI_MAZZA_3X2.png
  BELGA_COLLI_MAZZA_MOVEMENT_8X3.png
  DNEY_MOVEMENT_PORTRAITS_4X3.png
].map { |name| File.join(repo_root, 'assets', 'prebeta', 'runtime', 'collaborators', name) }

checks = []
check = lambda do |name, value, detail = nil|
  checks << [name, !!value, detail]
end

[base, alpha, runtime, dialogues].each { |path| check.call("arquivo #{File.basename(path)}", File.file?(path)) }
check.call('sprites de colaboradores com transparência PNG', collaborator_atlases.all? do |path|
  File.file?(path) && [4, 6].include?(File.binread(path, 26).getbyte(25))
end)

source = File.read(runtime, encoding: 'UTF-8') + File.read(File.join(root, 'input_mobile_combat.js'), encoding: 'UTF-8')
built = File.read(alpha, encoding: 'UTF-8')
ninja_art_root = File.join(repo_root, 'assets', 'variantes', 'ninja-arqueiro-v1')
ninja_art = JSON.parse(File.read(File.join(ninja_art_root, 'manifest.json')))
check.call('Ninja e Arqueiro: 96 sequências em quatro direções', ninja_art.fetch('animations').size == 96 && ninja_art.fetch('animations').all? { |a| a['frames'] == 9 && a['playFrames'] == 8 })
check.call('Ninja sem máscara e Arqueiro com máscara no cinto', ninja_art.fetch('maskLocation') == { 'katana' => 'none', 'alt' => 'right_hip' })
ninja_files = ninja_art.fetch('animations').map { |a| a.fetch('atlas') }.uniq + ninja_art.fetch('portraits').map { |p| p.fetch('file') }
check.call('40 imagens Ninja e Arqueiro completas com alpha', ninja_files.size == 40 && ninja_files.all? do |relative|
  path = File.join(ninja_art_root, relative)
  next false unless File.file?(path)
  header = File.binread(path, 26)
  expected = relative.start_with?('atlas/') ? [2304, 1024] : [256, 256]
  header.byteslice(16, 8).unpack('NN') == expected && header.getbyte(25) == 6
end)
check.call('arte Ninja e Arqueiro integrada sem marcadores pendentes', built.include?('const NinjaArcherArtV1') && !built.include?('__NINJA_ARCHER_'))
scene_root = File.join(repo_root, 'assets', 'cenarios', 'v2')
scene_manifest = JSON.parse(File.read(File.join(scene_root, 'manifest.json')))
check.call('cenários V2: 12 folhas e 126 recortes', scene_manifest.fetch('sheets').size == 12 && scene_manifest.fetch('items').size == 126)
check.call('atlas de cenário RGBA com dimensões contratuais', scene_manifest.fetch('sheets').all? do |_id, sheet|
  path = File.join(scene_root, sheet.fetch('file'))
  next false unless File.file?(path)
  header = File.binread(path, 26)
  header.getbyte(25) == 6 && header.byteslice(16, 8).unpack('NN') == sheet.fetch('grid').map { |n| n * sheet.fetch('cell') }
end)
check.call('recortes de cenário contidos no atlas', scene_manifest.fetch('items').all? do |_id, item|
  sheet = scene_manifest.fetch('sheets').fetch(item.fetch('sheet'))
  x, y, w, h = item.fetch('content')
  x >= 0 && y >= 0 && w > 0 && h > 0 && x + w <= sheet['grid'][0] * sheet['cell'] && y + h <= sheet['grid'][1] * sheet['cell']
end)
check.call('cenários integrados sem marcador de dados pendente', built.include?('const CenariosV2=') && !built.include?('__CENARIOS_V2_'))
check.call('posição de save antigo nas nuvens possui migração', built.include?('repairLegacyCloudPosition') && built.include?('env2RemovedCloudCells'))
protagonist_root = File.join(repo_root, 'assets', 'protagonistas', 'v5')
protagonist_manifest = JSON.parse(File.read(File.join(protagonist_root, 'manifest.json')))
check.call('protagonistas V5: 192 sequências com oito poses e fechamento', protagonist_manifest.fetch('animations').size == 192 && protagonist_manifest.fetch('animations').all? { |a| a['frames'] == 9 && a['playFrames'] == 8 })
protagonist_files = protagonist_manifest.fetch('animations').map { |a| a.fetch('atlas') }.uniq + protagonist_manifest.fetch('portraits').map { |p| p.fetch('file') }
check.call('56 imagens V5 completas com alpha e dimensões corretas', protagonist_files.size == 56 && protagonist_files.all? do |relative|
  path = File.join(protagonist_root, relative)
  next false unless File.file?(path)
  header = File.binread(path, 26)
  expected = relative.start_with?('atlas/') ? [2304, 2048] : [256, 256]
  header.byteslice(16, 8).unpack('NN') == expected && header.getbyte(25) == 6
end)
check.call('protagonistas V5 integrados sem marcadores pendentes', built.include?('const ProtagonistArtV5') && !built.include?('__PROTAGONIST_'))
dialogue_ids = JSON.parse(File.read(dialogues, encoding: 'UTF-8')).fetch('scenes').map { |scene| scene.fetch('id') }

expected_areas = %w[
  sky_terminal distortion_district contratempo power_plant sky_canal
  ciro_workshop sky_lift cloud_sea cloud_terrace last_torii silence_core
]
built_areas = source.scan(/(?:mk|C3\.room)\('([^']+)'/).flatten.uniq
expected_areas.each { |id| check.call("mapa #{id}", built_areas.include?(id)) }

scene_refs = source.scan(/C3\.scene\('([^']+)'/).flatten.uniq
missing_scenes = scene_refs - dialogue_ids
check.call('referências de diálogo', missing_scenes.empty?, missing_scenes.join(', '))

audio_keys = %w[
  c3_100_adsense c3_type_shit c3_ak_cruzada c3_chico_buarque
  c3_passaros_exoticos c3_nervos
]
audio_keys.each { |id| check.call("trilha #{id}", built.include?(id)) }

%w[C3.startMetronome C3.startSilence C3.resolveSilence C3.finishMetronome C3.finishSilence C3.returnStudio].each do |name|
  check.call("função #{name}", source.include?("#{name}=function"))
end

check.call('schema 13', built.include?("VERSION:13") && built.include?("version:13,created"))
check.call('autosave Alpha separado', built.include?("KEY='torii_hutukara_alpha_v1'"))
check.call('migração da 1.1.2', built.include?("'torii_hutukara_piloto_v04'"))
check.call('seis assinaturas', built.include?("synth:{name:'Camadas vivas'") && built.include?("percussion:{name:'Pulso comum'"))
check.call('sete padrões finais', %w[ring cross fan rain chase pulse orbit].all? { |kind| source.include?(kind) })
check.call('cinco padrões por tentativa', source.include?('Array.from({length:5}'))
check.call('frase final', source.include?("C3.openPhrase('final')") && source.include?('C3.resolveSilence()'))
check.call('epílogo', source.include?("C3.scene('C3_027'"))
%w[district_materials sprite_maia sprite_nara sprite_ciro sprite_vega sprite_dimas sprite_resident_a sprite_resident_b sprite_canal_worker sprite_plant_operator atlas_lamps atlas_urban atlas_workshop atlas_canal atlas_lift].each do |asset|
  check.call("asset #{asset}", source.include?("#{asset}:") && built.include?("#{asset}:"))
end
%w[prebeta_roll prebeta_run prebeta_portraits prebeta_mask prebeta_props prebeta_clouds prebeta_cinema].each do |asset|
  check.call("asset #{asset}", source.include?("#{asset}:") && built.include?("#{asset}:"))
end
%w[prebeta_run_v2 prebeta_portraits_v2 prebeta_collabs prebeta_collabs_move prebeta_dney prebeta_materials_v2].each do |asset|
  check.call("asset #{asset}", source.include?("#{asset}:") && built.include?("#{asset}:"))
end
check.call('rosto autoral do Franco nos diálogos', source.include?('prebeta_portraits') && source.include?("who.includes('franco')"))
check.call('máscara canônica com rosto visível', source.include?('PB.drawCanonicalMask') && source.include?('Eu ainda vejo pelas lentes'))
check.call('máscara passa a aparecer depois da aquisição', source.include?('PB.repairMaps') && source.include?('G.flags.masks=true;updateHUD()'))
check.call('rolamento dos seis personagens', source.include?('PLAYABLE_ROLL') || source.include?('prebeta_roll'))
check.call('corrida própria da dupla do capítulo 3', source.include?('prebeta_run') && source.include?("style==='synth'||style==='percussion'"))
check.call('nuvens volumétricas', source.include?('PB.cloudTile') && source.include?('prebeta_clouds'))
check.call('placa e pilares detalhados', source.include?("p.type==='signpost'") && source.include?("p.type==='ruinColumn'"))
check.call('colisões alinhadas às fachadas', source.include?('districtHouses') && source.include?('rectBlock(a,hx-3,hy-5,7,5)'))
check.call('fundos cinematográficos próprios', source.include?('PB.cinemaPanel') && source.include?("showCinema('distortion')"))
check.call('máscara ancorada sem flutuar', source.include?("-18,-25,36,36") && !source.include?("-34,-66,68,68"))
check.call('novos personagens na escala dos protagonistas', source.include?('ACTOR_W,ACTOR_H') && source.include?('prebeta_run_v2'))
check.call('rolamento desacelerado', built.include?("duration:.30,cooldown:.75,invulnerability:.22,speed:7.8"))
check.call('retry final reconstrói estado', source.include?('C3.retryFinal=function') && source.include?("setArea('silence_core',17.5,20.5,false)"))
check.call('colaboradores Belga Colli Mazza', %w[Belga Colli Mazza].all? { |name| built.include?(name) })
check.call('Dney integrado ao Contratempo', built.include?('Dney · Imagem e Ressonância') && source.include?('prebeta_dney'))
check.call('papéis centrais ocupados pelos colaboradores', built.include?('Belga · Contratempo') && built.include?('Mazza · Oficina de Frequências') && built.include?('Colli · Cartógrafo Sonoro'))
check.call('Último Torii sem máscaras aleatórias', source.include?("prop(a,'c3_resonance_circle',13,8)") && !source.include?("prop(a,'maskStand',13,8)"))
check.call('Núcleo observado por olhos', source.include?('c3_silence_eye') && source.include?('c3_silence_altar'))
check.call('objetivo do canal por estado', source.include?("!c.canalPath?") && source.include?('Atravesse e liberte a comporta'))
check.call('Colli apresentado no canal', source.include?('canalIntro') && source.include?('Eu disse para irem na frente'))
check.call('transição contínua do capítulo 02', source.include?('ATRAVESSAR · CAPÍTULO 03') && source.include?('não é necessário voltar ao menu'))
check.call('entrada do elevador sem ciclo impossível', source.include?("need:()=>G.c3.clubPhraseDone,blocked:'O ELEVADOR AINDA ESPERA A FRASE DO CONTRATEMPO'"))
check.call('Ryuchi percussionista com golpes próprios', %w[drumBeat drumCounter drumBreak CONTRATEMPO].all? { |term| source.include?(term) })
check.call('Franco sintetizador sem flechas recicladas', source.include?('C3.synthLine') && source.include?('C3.placeSynthZone') && source.include?('FILTRO DE CORTE'))
check.call('recrutamento somente após apresentação', source.index("C3.scene('C3_007'") < source.index("C3.recruit('synth')") && source.index("C3.scene('C3_010'") < source.index("C3.recruit('percussion')"))
core_open = Array.new(26) { Array.new(34, false) }
(2...24).each do |y|
  (2...32).each { |x| core_open[y][x] = Math.hypot((x - 17) / 1.15, y - 13) <= 11 }
end
(19...23).each { |y| (3...18).each { |x| core_open[y][x] = true } }
# A própria função path abre uma faixa de largura 2 entre estes pontos.
[[5, 21], [11, 21], [17, 18]].each_cons(2) do |(x0, y0), (x1, y1)|
  steps = [(x1 - x0).abs, (y1 - y0).abs, 1].max
  (0..steps).each do |i|
    x = (x0 + (x1 - x0) * i.fdiv(steps)).round
    y = (y0 + (y1 - y0) * i.fdiv(steps)).round
    (-1..1).each { |dy| (-1..1).each { |dx| core_open[y + dy][x + dx] = true } }
  end
end
queue = [[5, 21]]
seen = { [5, 21] => true }
until queue.empty?
  x, y = queue.shift
  [[1, 0], [-1, 0], [0, 1], [0, -1]].each do |dx, dy|
    p = [x + dx, y + dy]
    next if seen[p] || !core_open.dig(p[1], p[0])
    seen[p] = true
    queue << p
  end
end
check.call('entrada caminhável do Núcleo', seen[[17, 10]] && source.include?("fill(a,3,19,15,4,'c3_voidfloor')"))
check.call('NPCs com animação ambiente', source.include?('function c3NpcPose') && source.include?('pose.frame'))
check.call('equipe com níveis e experiência de reserva', source.include?("C3.roles=") && source.include?('Math.floor(amount*.75)') && source.include?('C3.ensureProgression'))
check.call('Gamepad API com mapeamento PlayStation', source.include?('navigator.getGamepads') && source.include?('C3.handlePrimaryPad') && source.include?('CONTROLE PLAYSTATION'))
check.call('coop local com segundo controle', source.include?('C3.handleSecondPad') && source.include?('C3.coopMove') && source.include?('C3.coopAttack'))
check.call('Jogador 2 com HP e dano próprios', source.include?('C3.damageCoop') && source.include?('C3.updateCoopCombat'))
check.call('assistência automática suspensa no coop', source.include?('companionCooldown=Math.max(companionCooldown,.48)'))
check.call('câmera compartilhada com limite', source.include?('max=7.25') && source.include?('C3.syncCoop'))
check.call('ajuda de controles dentro do jogo', source.include?('controllerHelp') && source.include?('ESPECIAL R2'))
check.call('nenhum placeholder', built.scan(/__C3_[A-Z0-9_]+__/).empty?)
check.call('um init final', built.scan(/\binit\(\);/).length == 1)
check.call('um bloco script', built.scan(/<script\b/).length == 1 && built.scan(%r{</script>}).length == 1)

expected_base_hash = File.read(File.join(repo_root, 'game', 'source', 'base', 'SHA256_TRILHAS_1_1_2.txt')).split.first
check.call('base 1.1.2 preservada', Digest::SHA256.file(base).hexdigest == expected_base_hash)

musician_root = File.join(repo_root, 'assets', 'variantes', 'percussao-sintetizador-v1')
musician_art = JSON.parse(File.read(File.join(musician_root, 'manifest.json')))
musician_animations = musician_art.fetch('animations')
musician_portraits = musician_art.fetch('portraits')
musician_atlas = musician_animations.to_h { |a| [[a.fetch('hero'), a.fetch('variant'), a.fetch('state')].join('_'), a.fetch('atlas')] }
musician_faces = musician_portraits.to_h { |p| [[p.fetch('hero'), p.fetch('variant'), 'portrait', p.fetch('expression')].join('_'), p.fetch('file')] }
check.call('músicos: 208 sequências de oito poses sem reescrever base', musician_art['complete'] == true && musician_animations.size == 208 && musician_animations.all? { |a| a['frames'] == 8 } && musician_atlas.size == 52 && musician_faces.size == 32)
musician_png_matches = lambda do |relative, expected|
  path = File.join(musician_root, relative)
  next false unless File.file?(path)
  header = File.binread(path, 26)
  header.byteslice(16, 8).unpack('NN') == expected && header.getbyte(25) == 6
end
check.call('84 imagens base dos músicos RGBA com dimensões corretas', musician_atlas.values.all? { |file| musician_png_matches.call(file, [2048, 1024]) } && musician_faces.values.all? { |file| musician_png_matches.call(file, [256, 256]) })
check.call('músicos: uma paleta canônica sem contextos duplicados', musician_art.fetch('contexts', {}).empty?)
recipe_path = File.join(musician_root, musician_art.fetch('paletteRecipe'))
audit_path = File.join(musician_root, musician_art.fetch('geometryAudit'))
recipe = JSON.parse(File.read(recipe_path))
audit = JSON.parse(File.read(audit_path))
audit_entries = audit.fetch('entries')
canonical_pairs = musician_atlas.map { |key, file| [key, file, [2048, 1024]] } + musician_faces.map { |key, file| [key, file, [256, 256]] }
geometry_verified = canonical_pairs.all? do |key, relative, expected|
  entries = audit_entries.select { |entry| (entry['canonicalFile'] || entry['baseFile']) == relative }
  next false unless entries.size == 1
  entry = entries.first
  path = File.join(musician_root, relative)
  # The approved old palette may be removed after promotion; its hash remains in
  # the audit. Tie the palette-remapped bytes to the current canonical PNG.
  entry['geometryEqual'] == true && entry['shadingClustersPreserved'] == true && entry['baseClusterSha256'] == entry['contextClusterSha256'] && entry['baseClusterSha256'].is_a?(String) && entry['baseClusterSha256'].match?(/\A[0-9a-f]{64}\z/) && entry['rgbaAlphaMaxDiff'] == 0 && entry['protectedPixelsChanged'] == 0 &&
    [entry['width'], entry['height']] == expected &&
    entry['contextSha256'] == Digest::SHA256.file(path).hexdigest &&
    entry['baseSha256'].is_a?(String) && entry['baseSha256'].match?(/\A[0-9a-f]{64}\z/) &&
    entry['baseAlphaSha256'].is_a?(String) && entry['baseAlphaSha256'].match?(/\A[0-9a-f]{64}\z/) &&
    entry['baseAlphaSha256'] == entry['contextAlphaSha256']
end
check.call('paleta canônica: geometria e pixels protegidos auditados nos 84 PNGs atuais', geometry_verified)
check.call('receita de paleta e auditoria documentadas sem novas poses', !recipe.empty? && audit_entries.size >= 84 && musician_art['animations'].size == 208)
check.call('músicos integrados sem placeholders ou filtro contextual pendente', built.include?('const MusicianArtV1') && !built.include?('__MUSICIAN_'))

passed = checks.count { |(_, ok, _)| ok }
failed = checks.reject { |(_, ok, _)| ok }
lines = [
  "TORII & HUTUKARA — VALIDAÇÃO ESTÁTICA #{version.fetch('rotulo')}",
  '=' * 53,
  "Resultado: #{passed}/#{checks.length} verificações aprovadas",
  "HTML: #{File.size(alpha)} bytes",
  "SHA-256: #{Digest::SHA256.file(alpha).hexdigest}",
  ''
]
checks.each do |name, ok, detail|
  lines << "#{ok ? 'OK' : 'FALHA'} · #{name}#{detail && !detail.empty? ? " — #{detail}" : ''}"
end
lines += [
  '',
  'Playtest visual e funcional desta versão: PENDENTE',
  '- a validação acima comprova estrutura, referências e integridade da build;',
  '- a jornada completa ainda deve ser jogada em navegador desktop e móvel;',
  "- resultados manuais devem ser registrados em qa/#{version.fetch('versao')}/PLAYTEST.md."
]

report = lines.join("\n") + "\n"
File.write(File.join(repo_root, 'game', 'builds', version.fetch('versao'), "VALIDACAO_#{version.fetch('sufixo')}.txt"), report)
puts report
exit(failed.empty? ? 0 : 1)
