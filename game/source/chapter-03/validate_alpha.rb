#!/usr/bin/env ruby
# frozen_string_literal: true

require 'digest'
require 'json'

root = File.expand_path(__dir__)
repo_root = File.expand_path('../../..', root)
base = File.join(repo_root, 'game', 'source', 'base', 'TORII_HUTUKARA_1_1_2_TRILHAS.html')
alpha = File.join(repo_root, 'game', 'builds', 'alpha-1.1.1', 'TORII_HUTUKARA_ALPHA_1_1_1_COMPLETO.html')
runtime = File.join(root, 'chapter3_runtime.js')
dialogues = File.join(repo_root, 'design', 'chapter-03', 'DIALOGOS_CAPITULO_03.json')

checks = []
check = lambda do |name, value, detail = nil|
  checks << [name, !!value, detail]
end

[base, alpha, runtime, dialogues].each { |path| check.call("arquivo #{File.basename(path)}", File.file?(path)) }

source = File.read(runtime, encoding: 'UTF-8')
built = File.read(alpha, encoding: 'UTF-8')
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

check.call('schema 11', built.include?("VERSION:11") && built.include?("version:11,created"))
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
check.call('objetivo do canal por estado', source.include?("!c.canalPath?") && source.include?('Atravesse e liberte a comporta'))
check.call('Nara apresentada no canal', source.include?('canalIntro') && source.include?('Eu disse para irem na frente'))
check.call('transição contínua do capítulo 02', source.include?('ATRAVESSAR · CAPÍTULO 03') && source.include?('não é necessário voltar ao menu'))
check.call('entrada do elevador sem ciclo impossível', source.include?("need:()=>G.c3.clubPhraseDone,blocked:'O ELEVADOR AINDA ESPERA A FRASE DO CONTRATEMPO'"))
check.call('Ryuchi percussionista com golpes próprios', %w[drumBeat drumCounter drumBreak CONTRATEMPO].all? { |term| source.include?(term) })
check.call('NPCs com animação ambiente', source.include?('function c3NpcPose') && source.include?('pose.frame'))
check.call('equipe com níveis e experiência de reserva', source.include?("C3.roles=") && source.include?('Math.floor(amount*.75)') && source.include?('C3.ensureProgression'))
check.call('nenhum placeholder', built.scan(/__C3_[A-Z0-9_]+__/).empty?)
check.call('um init final', built.scan(/\binit\(\);/).length == 1)
check.call('um bloco script', built.scan(/<script\b/).length == 1 && built.scan(%r{</script>}).length == 1)

expected_base_hash = File.read(File.join(repo_root, 'game', 'source', 'base', 'SHA256_TRILHAS_1_1_2.txt')).split.first
check.call('base 1.1.2 preservada', Digest::SHA256.file(base).hexdigest == expected_base_hash)

passed = checks.count { |(_, ok, _)| ok }
failed = checks.reject { |(_, ok, _)| ok }
lines = [
  'TORII & HUTUKARA — VALIDAÇÃO ESTÁTICA ALPHA 1.1.1',
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
  '- resultados manuais devem ser registrados em qa/alpha-1.1.1/PLAYTEST.md.'
]

report = lines.join("\n") + "\n"
File.write(File.join(repo_root, 'game', 'builds', 'alpha-1.1.1', 'VALIDACAO_ALPHA_1_1_1.txt'), report)
puts report
exit(failed.empty? ? 0 : 1)
