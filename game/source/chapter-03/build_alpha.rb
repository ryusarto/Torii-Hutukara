#!/usr/bin/env ruby
# frozen_string_literal: true

require 'base64'
require 'digest'
require 'json'
require 'time'
require 'fileutils'

ROOT = File.expand_path(__dir__)
REPO_ROOT = File.expand_path('../../..', ROOT)
BASE = File.join(REPO_ROOT, 'game', 'source', 'base', 'torii-core.html')
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
BOSS_GROUND_FX_V2 = File.join(REPO_ROOT, 'assets', 'boss-ground-fx', 'v2')
ENVIRONMENT_DEPTH_JS = File.join(ROOT, 'environment_depth_v1.js')
ENVIRONMENT_ATMOSPHERE_JS = File.join(ROOT, 'environment_atmosphere_v1.js')
ENVIRONMENT_VOLUME_ASSETS = File.join(REPO_ROOT, 'assets', 'environment-volume', 'v1')
CLOUD_WORLD_JS = File.join(ROOT, 'cloud_world_v1.js')
CLOUD_STORY_JS = File.join(ROOT, 'cloud_story_v1.js')
CLOUD_WORLD_ASSETS = File.join(REPO_ROOT, 'assets', 'cloud-world', 'v1')
BOSS_ANIMATION_JS = File.join(ROOT, 'boss_choreography_v2.js')
BOSS_ANIMATION_ASSETS = File.join(REPO_ROOT, 'assets', 'boss-animations', 'v2')
BOSS_ANIMATION_V3 = File.join(REPO_ROOT, 'assets', 'boss-animations', 'v3')
PROTAGONIST_JS = File.join(ROOT, 'protagonist_art_v5.js')
PROTAGONIST_ASSETS = File.join(REPO_ROOT, 'assets', 'protagonistas', 'v5')
LOCOMOTION_ASSETS = File.join(REPO_ROOT, 'assets', 'protagonistas', 'v7-locomocao')
WORLD_POLISH_JS = File.join(ROOT, 'world_polish_v1.js')
WORLD_POLISH_ASSETS = File.join(REPO_ROOT, 'assets', 'studio', 'v1')
NPC_LIFE_JS = File.join(ROOT, 'npc_life_v1.js')
NPC_GESTURES_JS = File.join(ROOT, 'npc_gestures_v1.js')
NPC_GESTURES_ASSETS = File.join(REPO_ROOT, 'assets', 'npcs', 'vida-v1')
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
  '__CINEMA_FOREST__' => File.join(REPO_ROOT, 'assets', 'dialogue', 'v2', 'forest.png'),
  '__CINEMA_STUDIO__' => File.join(REPO_ROOT, 'assets', 'dialogue', 'v2', 'studio.png'),
  '__C3_AUDIO_1__' => File.join(ASSETS, 'audio', '01-100adsense.mp3'),
  '__C3_AUDIO_2__' => File.join(ASSETS, 'audio', '02-type-shit.mp3'),
  '__C3_AUDIO_3__' => File.join(ASSETS, 'audio', '03-ak-cruzada.mp3'),
  '__C3_AUDIO_4__' => File.join(ASSETS, 'audio', '04-chico-buarque.mp3'),
  '__C3_AUDIO_5__' => File.join(ASSETS, 'audio', '05-passaros-exoticos.mp3'),
  '__C3_AUDIO_6__' => File.join(ASSETS, 'audio', '06-final-boss.mp3'),
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
  '__PREBETA_MASK__' => File.join(PREBETA, 'dialogue', 'TORII_MASK_CANON_4X2.png'),
  '__PREBETA_PROPS__' => File.join(PREBETA, 'environment', 'ENVIRONMENT_PROPS_4X2.png'),
  '__PREBETA_CLOUDS__' => File.join(PREBETA, 'environment', 'VOLUMETRIC_CLOUDS_4X2.png'),
  '__PREBETA_CINEMA__' => File.join(REPO_ROOT, 'assets', 'prebeta', 'originals', 'dialogue', 'CINEMATIC_BACKGROUNDS_3X2.png'),
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
replace_once!(html, "const activeModes10=()=>mode==='walk'||mode==='action';",
  "const activeModes10=()=>!window.FinalAssetLoadingV1?.busy()&&(mode==='walk'||mode==='action');", 'ações aguardam a arte da cena')

# Menu input must run before the legacy anonymous capture listener, while the
# actual implementation is loaded with the additive interface modules below.
replace_once!(html, '<script>', "<script>\n'use strict';\nwindow.addEventListener(\"keydown\",e=>{if(e.metaKey||e.ctrlKey||e.altKey){e.stopImmediatePropagation();return}if(window.FinalAssetLoadingV1?.handleKey(e))return;window.ToriiMenuControlsV7?.handleKey(e)},true);", 'entrada unificada dos menus')
replace_once!(html, "window.addEventListener('keydown',e=>{if(mode==='title'", "window.addEventListener('keydown',e=>{if(document.querySelector('.keymap6 .listening'))return;if(mode==='title'", 'captura de remapeamento antes da navegação legada')
# Legacy X used a free tile center instead of the movement body's collision radius.
replace_once!(html, 'const nx=G.x+v[0]*.28,ny=G.y+v[1]*.28;if(!tileWalkable(current,nx,ny))break;G.x=nx;G.y=ny;steps++;', 'if(!window.SkillMovementV1.warpStep(G,v[0],v[1],.28))break;steps++;', 'Passo Sônico respeita colisão do corpo')
legacy_enemy_health = "const w=e===bossActor?68:32,h=4;ctx.fillStyle='#1c1621';ctx.fillRect(ex-w/2,ey-(e===bossActor?76:48),w,h+2);ctx.fillStyle=e===bossActor?'#f5bdcb':'#df8fa7';ctx.fillRect(ex-w/2+1,ey-(e===bossActor?75:47),Math.max(0,(w-2)*e.hp/e.max),3)"
replace_once!(html, legacy_enemy_health, '', 'vida individual acima do sprite')

# The original Franco super also heals the party outside the dungeon.
replace_once!(html, 'for(const id of partyMembers())if(G.hp[id]>0)G.hp[id]=Math.min',
  'for(const id of partyMembers())if(!PostGame.active()&&G.hp[id]>0)G.hp[id]=Math.min', 'cura de super fora da Fenda')

# The larger portrait viewport needs to paint every visible tile. In mobile
# combat, only AI followers fade; the second player keeps full opacity.
replace_once!(html, 'Math.min(a.h,iy+23)', 'Math.min(a.h,iy+Math.ceil(VH/T)+3)', 'altura visível do mapa')
%w[behind third].each_with_index do |pose, index|
  original = "drawActor({style:following[#{index}],dir:#{pose}.dir},Math.round(#{pose}.x*T-cam.x),Math.round(#{pose}.y*T-cam.y),lastStep<.3)"
  replace_once!(html, original, "drawMobileFollower121(following[#{index}],#{pose},lastStep<.3)", 'legibilidade do grupo no mobile')
end

follower_hit = "hitEnemy(target,allyId==='franco'?8:6,.09,.03);"
replace_once!(html, follower_hit,
  "HeroAttackFX.withSource(allyId,()=>hitEnemy(target,allyId==='franco'?8:6,.09,.03));if(typeof HeroAttackFX!=='undefined')HeroAttackFX.follower(allyId,ally,target);",
  'golpe automático do companheiro')

# Deferred allied hits need their actual author, even after switching leaders.
# The wrappers tag presentation only and preserve every original hit argument.
friendly_projectile_hit = 'hitEnemy(e,p.damage,p.arrow ? .18 : .26,p.piercing ? .15 : .06)'
replace_once!(html, friendly_projectile_hit,
  "HeroAttackFX.withSource(p.arrow?'alt':'ryuchi',()=>#{friendly_projectile_hit})", 'origem visual dos projéteis aliados')
archer_rain_hit = 'hitEnemy(e,18,.15,.02)'
replace_once!(html, archer_rain_hit,
  "HeroAttackFX.withSource('alt',()=>#{archer_rain_hit})", 'origem visual da chuva de flechas')
katana_counter_hit = 'coneHit10(Combat10.guardDir,TUNING10.katana.counterRange,.25,TUNING10.katana.counterDamage,.65,.2)'
replace_once!(html, katana_counter_hit,
  "HeroAttackFX.withSource('katana',()=>#{katana_counter_hit})", 'origem visual do contracorte')
synth_pad_hit = 'hitEnemy(e,7,.16,.04)'
replace_once!(runtime, synth_pad_hit,
  "HeroAttackFX.withSource('synth',()=>#{synth_pad_hit})", 'origem visual dos pads persistentes')

projectile_loop = 'for(const p of projectiles){'
original_projectile = 'const px=p.x*T-cam.x,py=p.y*T-cam.y;if(p.arrow)'
replace_once!(html, projectile_loop + original_projectile,
  projectile_loop + "if(typeof HeroAttackFX!=='undefined'&&HeroAttackFX.drawProjectile(p))continue;" + original_projectile,
  'sprite do projétil do grupo')

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
# The tuner owns left/right before the generic overlay focus navigator.
replace_once!(html, "if(mode!=='overlay'||!menuPage10)return;if(['Enter',' '].includes(e.key))",
  "if(mode!=='overlay'||!menuPage10)return;if(menuPage10==='radio9'&&Radio9.key(e))return;if(['Enter',' '].includes(e.key))", 'teclado do mostrador de sintonia')
replace_once!(html, 'O painel aguarda o acoplador da Rádio 9. Encontre o técnico mascarado primeiro.',
  'O painel aguarda o sinal da Rádio 9. Sintonize o mostrador junto à antena.', 'pista do retransmissor')
replace_once!(html, "A torre vai responder.':'Procurem a fita no Mercado das Fitas.",
  "A torre vai responder.':G.flags.voicesCoupler?'Levem o acoplador à Rádio 9, a leste do canal.':'Procurem a fita no Mercado das Fitas.", 'pista da Íris com o acoplador')
# The city's next track enters when the three retransmitters are back.
replace_once!(html, ".length>=2||f.voicesBoss||f.voicesDone?'sauna':'esquecer'", ".length===3||f.voicesBoss||f.voicesDone?'sauna':'esquecer'", 'trilha da rede restaurada')
# The forest keeps water as its terrain; the animated bridge draws below the actors.
replace_once!(html, "'forest_hush_a',21,24,'hush'", "'forest_hush_a',19,25,'hush'", 'clareira dos instrumentos')
replace_once!(html, "if(a.id==='forest'&&G.flags.bridge&&x>=32&&x<=35&&y>=19&&y<=23)tt='woodbridge';", '', 'água da ponte')
replace_once!(html, " drawRoute();\n // world accent lighting", " BridgePuzzle.drawGround();\n CanalViolin.draw();\n ClubStage.drawGround();\n FinalEchoes.drawGround();\n drawRoute();\n // world accent lighting", 'ponte animada abaixo dos atores')
replace_once!(html, 'clamp(G.x*T-VW/2,0,a.w*T-VW),yy=', 'ClubStage.cameraX(CanalViolin.cameraX(clamp(G.x*T-VW/2,0,a.w*T-VW))),yy=', 'enquadramento do canal e do palco')
replace_once!(html, 'clamp(G.y*T-VH/2,0,a.h*T-VH);cam.x', 'ClubStage.cameraY(clamp(G.y*T-VH/2,0,a.h*T-VH));cam.x', 'enquadramento do palco')
# The explicit mute switch survives interaction shortcuts that wake AudioContext.
replace_once!(html, 'let AC=null,audioEnabled=false,', 'let AC=null,audioEnabled=false,audioMuted=readAudioMute121(),', 'áudio desligado pelo jogador')
replace_once!(html, 'function enableAudio(){if(!AC)', 'function enableAudio(){if(audioMuted)return;if(!AC)', 'interação respeita o mudo')
replace_once!(html, 'if(audioEnabled)audioEnabled=false;else enableAudio();openSettings10()', 'toggleAudio121();openSettings10()', 'alternar som nas opções')
# The approved swept SkillMovementV1 warp patch above already replaces this path.
# It reads the promoted canBody121 collision predicate; do not patch the same site twice.
replace_once!(html, '<b>E</b> ${near.label}', %q~<b>${controlHint121('E','AÇÃO','A / ✕')}</b> ${near.label}~, 'ação perto de um interagível')
replace_once!(html, "'O mundo está pausado. K · '+SIGNATURE11", %q~'O mundo está pausado. '+controlHint121('K','Especial','R2')+' · '+SIGNATURE11~, 'dica de especial na pausa')
replace_once!(html, "text.innerHTML+='<br>K · '+SIGNATURE11", %q~text.innerHTML+='<br>'+controlHint121('K','Especial','R2')+' · '+SIGNATURE11~, 'dica de especial na equipe')
replace_once!(html, 'As teclas 1–3 seguem a ordem da formação.', %q~${controlHint121('As teclas 1–3 seguem a ordem da formação.','O botão TROCAR PERSONAGEM segue a ordem da formação.','O botão Y / △ segue a ordem da formação.')}~, 'troca de personagem na equipe')
team_techniques = 'J ${skillNames10[id][0]} · Z ${skillNames10[id][1]} · X ${skillNames10[id][2]}'
team_techniques_hint = %q~${controlHint121('J','Atacar:','X / □')} ${skillNames10[id][0]} · ${controlHint121('Z','Técnica:','L1')} ${skillNames10[id][1]} · ${controlHint121('X','Técnica II:','R1')} ${skillNames10[id][2]}~
replace_once!(html, team_techniques, team_techniques_hint, 'técnicas na equipe')
replace_once!(runtime, team_techniques, team_techniques_hint, 'técnicas na equipe do capítulo 3')
replace_once!(html, ' drawable.sort((a,b)=>a.y-b.y);for(let d of drawable)d.draw();',
  " if(typeof EnvironmentDepthV1!=='undefined')EnvironmentDepthV1.drawGround();\n if(typeof EnvironmentAtmosphereV1!=='undefined')EnvironmentAtmosphereV1.drawGround();\n if(typeof BossChoreographyV2!=='undefined')BossChoreographyV2.drawGround();\n drawable.sort((a,b)=>a.y-b.y);for(let d of drawable)d.draw();", 'chão e áreas dos chefes abaixo dos personagens')
replace_once!(html, 'drawable.push({x:p.x,y:p.y+.5,draw:()=>drawProp(p,cam.x,cam.y)})',
  "drawable.push({x:p.x,y:(typeof EnvironmentDepthV1!=='undefined'?EnvironmentDepthV1.sortY(p):(p.worldGroundY??p.y+.5)),draw:()=>drawProp(p,cam.x,cam.y)})", 'fachadas ordenadas pela base física')
replace_once!(html, "drawCombatLayer();if(mode!=='action')drawGuideMarker();drawVfx(0);",
  "if(typeof EnvironmentAtmosphereV1!=='undefined')EnvironmentAtmosphereV1.drawLighting();drawCombatLayer();if(mode!=='action')drawGuideMarker();drawVfx(0);", 'luz antes dos avisos de combate e missão')
replace_once!(runtime, "C3_drawEnvBase();if(!G||!C3.AREAS.includes(G.area))return;",
  "C3_drawEnvBase();if(!G||!C3.AREAS.includes(G.area)||(typeof EnvironmentAtmosphereV1!=='undefined'&&EnvironmentAtmosphereV1.enabled))return;", 'atmosfera contextual substitui névoa rosa legada')

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
# Every legacy action must share the live registry. Postgame areas are registered
# by the runtime after compilation, rather than belonging to a frozen chapter list.
combat_checks = html.scan("#{combat_old}.includes(G.area)").length
raise "Verificações legadas de combate inesperadas: #{combat_checks}" unless combat_checks == 6
html.gsub!("#{combat_old}.includes(G.area)", 'combatAreas10.has(G.area)')
html.gsub!(combat_old, combat_new)

replace_once!(html,
  "if(bossActor.id==='voice_boss'){drawCreature(bx,by,'boss',bossActor);}else{",
  "if(['boss','voice_boss','c3_metronome','c3_silence'].includes(bossActor.id)){drawCreature(bx,by,bossActor.type||'boss',bossActor);}else{",
  'render dos chefes C3')

replace_once!(html,
  "for(const p of hostileShots){const px=p.x*T-cam.x,py=p.y*T-cam.y;ctx.fillStyle='#bd517a';ctx.fillRect(px-5,py-5,11,11);ctx.fillStyle='#ffccd3';ctx.fillRect(px-2,py-2,4,4)}",
  "for(const p of hostileShots){if(typeof BossGroundFXV1!=='undefined'&&BossGroundFXV1.drawProjectile(p))continue;const px=p.x*T-cam.x,py=p.y*T-cam.y;ctx.fillStyle='#bd517a';ctx.fillRect(px-5,py-5,11,11);ctx.fillStyle='#ffccd3';ctx.fillRect(px-2,py-2,4,4)}",
  'sprites dos projéteis hostis')

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
  'C3_018.01' => 'A Flauta reúne as nuvens. Esperem a superfície ficar inteira antes de pisar. Fora da borda não há chão: quem cair volta ao começo das nuvens.',
  'C3_020.01' => 'O sinal chegou inteiro. Eu reconheci cada frequência — até as que vocês quase esconderam.',
  'C3_026.01' => 'A última frequência abriu caminhos que antes não respondiam.',
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

# Sorte com semente: primeiro código do jogo, antes da base 1.1.2.
SORTE_JS = File.join(REPO_ROOT, 'game', 'source', 'engine', 'sorte.js')
raise 'Esperado um único <script> de jogo na base' unless html.scan('<script>').length == 1
html.sub!('<script>') { "<script>\n#{File.read(SORTE_JS, encoding: 'UTF-8')}\n" }

marker = "\ninit();\n</script>"
require_relative 'hero_legacy_fx'
install_hero_legacy_fx!(html)

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
locomotion_manifest = JSON.parse(File.read(File.join(LOCOMOTION_ASSETS, 'manifest.json')))
locomotion_files = locomotion_manifest.fetch('animations').map { |a| a.fetch('atlas') }.uniq
locomotion_states = locomotion_manifest.fetch('animations').map { |a| a.fetch('state') }.uniq
protagonist_manifest['animations'] = protagonist_manifest.fetch('animations').reject { |a| locomotion_states.include?(a['state']) } + locomotion_manifest.fetch('animations')
locomotion_manifest.fetch('animations').each do |a|
  protagonist_uris[a.fetch('hero') + '_' + a.fetch('state')] = "data:image/png;base64,#{encode(File.join(LOCOMOTION_ASSETS, a.fetch('atlas')))}" if a.fetch('row').zero?
end
ryuchi_matte_dir = File.join(REPO_ROOT, 'assets', 'protagonistas', 'v9-matte')
ryuchi_matte_manifest = JSON.parse(File.read(File.join(ryuchi_matte_dir, 'manifest.json')))
ryuchi_matte_manifest.fetch('atlases').each do |record|
  protagonist_uris[record.fetch('key')] = "data:image/png;base64,#{encode(File.join(ryuchi_matte_dir, record.fetch('atlas')))}"
end
protagonist_manifest['bakedEdgeMatte'] = ryuchi_matte_manifest.fetch('bakedEdgeMatte')
polish_manifest = JSON.parse(File.read(File.join(WORLD_POLISH_ASSETS, 'manifest.json')))
polish_files = polish_manifest.fetch('assets').values.flat_map { |a| [a.fetch('file'), a.fetch('runtime')] }
polish_uris = polish_manifest.fetch('assets').to_h { |key, entry| [key, "data:image/png;base64,#{encode(File.join(WORLD_POLISH_ASSETS, entry.fetch('runtime')))}"] }
npc_gestures_runtime = File.read(NPC_GESTURES_JS, encoding: 'UTF-8')
replace_once!(npc_gestures_runtime, '__NPC_GESTURES_URI__', JSON.generate("data:image/png;base64,#{encode(File.join(NPC_GESTURES_ASSETS, 'city_gestures.png'))}"), 'gestos dos moradores C1')
replace_once!(npc_gestures_runtime, '__NPC_C3_GESTURES_URI__', JSON.generate("data:image/png;base64,#{encode(File.join(REPO_ROOT, 'assets', 'npcs', 'vida-v2', 'NPC_C3_GESTURES_6X4.png'))}"), 'gestos dos moradores C3')
polish_runtime = File.read(WORLD_POLISH_JS, encoding: 'UTF-8')
replace_once!(polish_runtime, '__WORLD_POLISH_ASSETS__', JSON.generate(polish_uris), 'mobiliário do estúdio')
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
boss_animation_v3_manifest = JSON.parse(File.read(File.join(BOSS_ANIMATION_V3, 'manifest.json')))
boss_animation_manifest['clips'].merge!(boss_animation_v3_manifest.fetch('clips'))
boss_animation_files = boss_animation_manifest.fetch('clips').values.map { |entry| entry.fetch('atlas') }.uniq
boss_animation_paths = boss_animation_files.to_h do |file|
  folder = boss_animation_v3_manifest.fetch('clips').values.any? { |clip| clip.fetch('atlas') == file } ? BOSS_ANIMATION_V3 : BOSS_ANIMATION_ASSETS
  [file, File.join(folder, file)]
end
boss_animation_uris = boss_animation_paths.to_h { |file, absolute| [file, "data:image/png;base64,#{encode(absolute)}"] }
boss_animation_runtime = File.read(BOSS_ANIMATION_JS, encoding: 'UTF-8')
replace_once!(boss_animation_runtime, '__BOSS_ANIMATION_ASSETS__', JSON.generate(boss_animation_uris), 'animações dos chefes')
replace_once!(boss_animation_runtime, '__BOSS_ANIMATION_MANIFEST__', JSON.generate(boss_animation_manifest), 'manifesto de animações dos chefes')
ground_fx_manifest = JSON.parse(File.read(File.join(BOSS_GROUND_FX_ASSETS, 'manifest.json')))
ground_fx_v2_manifest = JSON.parse(File.read(File.join(BOSS_GROUND_FX_V2, 'manifest.json')))
ground_fx_manifest['clips'].merge!(ground_fx_v2_manifest.fetch('clips'))
ground_fx_files = ground_fx_manifest.fetch('clips').values.map { |entry| entry.fetch('atlas') }.uniq
ground_fx_paths = ground_fx_manifest.fetch('clips').to_h do |key, entry|
  folder = ground_fx_v2_manifest.fetch('clips').key?(key) ? BOSS_GROUND_FX_V2 : BOSS_GROUND_FX_ASSETS
  [key, File.join(folder, entry.fetch('atlas'))]
end
ground_fx_uris = ground_fx_paths.to_h { |key, absolute| [key, "data:image/png;base64,#{encode(absolute)}"] }
ground_fx_runtime = File.read(BOSS_GROUND_FX_JS, encoding: 'UTF-8')
replace_once!(ground_fx_runtime, '__BOSS_GROUND_FX_ASSETS__', JSON.generate(ground_fx_uris), 'sprites FX de golpes no chão')
replace_once!(ground_fx_runtime, '__BOSS_GROUND_FX_MANIFEST__', JSON.generate(ground_fx_manifest), 'manifesto FX de golpes no chão')
cloud_manifest = JSON.parse(File.read(File.join(CLOUD_WORLD_ASSETS, 'manifest.json')))
cloud_files = {
  'rebuild' => File.join(CLOUD_WORLD_ASSETS, cloud_manifest.fetch('rebuild').fetch('atlas')),
  'originalA01' => File.join(CENARIOS_ASSETS, 'atlas', 'C3_SUPERFICIES_URBANAS.png'),
  'originalA04' => File.join(CENARIOS_ASSETS, 'atlas', 'C3_NUVENS_ENCAIXES.png'),
  'cinema' => File.join(CLOUD_WORLD_ASSETS, 'backgrounds', 'sky_portal.png')
}
cloud_uris = cloud_files.to_h { |id, path| [id, "data:image/png;base64,#{encode(path)}"] }
cloud_runtime = File.read(CLOUD_WORLD_JS, encoding: 'UTF-8')
replace_once!(cloud_runtime, '__CLOUD_WORLD_ASSETS__', JSON.generate(cloud_uris), 'sprites de reconstrução e nuvens originais')
replace_once!(cloud_runtime, '__CLOUD_WORLD_MANIFEST__', JSON.generate(cloud_manifest), 'manifesto das nuvens')
environment_depth_runtime = File.read(ENVIRONMENT_DEPTH_JS, encoding: 'UTF-8')
volume_manifest = JSON.parse(File.read(File.join(ENVIRONMENT_VOLUME_ASSETS, 'manifest.json')))
volume_files = volume_manifest.fetch('sheets').to_h { |id, item| [id, File.join(ENVIRONMENT_VOLUME_ASSETS, item.fetch('file'))] }
volume_uris = volume_files.to_h { |id, path| [id, "data:image/png;base64,#{encode(path)}"] }
replace_once!(environment_depth_runtime, '__ENVIRONMENT_VOLUME_ASSETS__', JSON.generate(volume_uris), 'fachadas com volume dos capítulos 1 e 2')
replace_once!(environment_depth_runtime, '__ENVIRONMENT_VOLUME_MANIFEST__', JSON.generate(volume_manifest), 'manifesto de fachadas com soleira')
environment_atmosphere_runtime = File.read(ENVIRONMENT_ATMOSPHERE_JS, encoding: 'UTF-8')
cloud_story_runtime = File.read(CLOUD_STORY_JS, encoding: 'UTF-8')
# Embedded runtime strings now own these bytes; release duplicate URI maps
# before constructing the portable HTML on memory-constrained computers.
ninja_archer_uris = protagonist_uris = musician_uris = cenarios_uris = enemy_art_uris = boss_animation_uris = ground_fx_uris = cloud_uris = volume_uris = polish_uris = nil
GC.start
# Insert pieces in reverse at the same anchor: identical bytes without a second
# full-size concatenation of every embedded PNG/audio runtime.
body_dir = File.join(REPO_ROOT, 'assets', 'hero-body', 'v1')
stride_dir = File.join(REPO_ROOT, 'assets', 'protagonistas', 'v8-corrida')
hero_variants = %w[franco ryuchi alt katana synth percussion].flat_map do |hero|
  variants = %w[alt katana].include?(hero) ? %w[unmasked] : %w[unmasked masked]
  variants.map { |variant| "#{hero}_#{variant}" }
end
body_paths = hero_variants.to_h { |key| [key, File.join(body_dir, 'atlas', "#{key}.png")] }
stride_manifest_path = File.join(stride_dir, 'manifest.json')
stride_manifest = JSON.parse(File.read(stride_manifest_path))
stride_registration_path = File.join(REPO_ROOT, 'assets', 'protagonistas', 'v9-registro', 'registration.json')
stride_registration = JSON.parse(File.read(stride_registration_path))
stride_manifest['registrationVersion'] = stride_registration.fetch('version')
stride_registration.fetch('heroes').each do |hero, registration|
  stride_manifest.fetch('heroes').fetch(hero).merge!(registration)
end
archer_split_path = File.join(stride_dir, 'archer-split', 'manifest.json')
stride_paths = %w[franco ryuchi alt katana synth percussion].to_h do |hero|
  [hero, File.join(stride_dir, 'atlas', "#{hero}_run.png")]
end
def png_map(paths)
  JSON.generate(paths.transform_values { |path| "data:image/png;base64,#{encode(path)}" })
end
body_script = File.join(ROOT, 'hero_attack_body.js')
stride_script = File.join(ROOT, 'run_stride_v1.js')
body_runtime = File.read(body_script, encoding: 'UTF-8')
stride_runtime = File.read(stride_script, encoding: 'UTF-8')
body_placement = File.join(body_dir, 'placement.json')
replace_once!(body_runtime, '__HERO_BODY_PLACEMENT__', JSON.generate(JSON.parse(File.read(body_placement))), 'registro horizontal das armas')
replace_once!(body_runtime, '__HERO_BODY_ATLASES__', png_map(body_paths), 'poses corporais de contato')
replace_once!(stride_runtime, '__RUN_STRIDE_ASSETS__', png_map(stride_paths), 'sprites de corrida')
replace_once!(stride_runtime, '__ARCHER_SPLIT_MANIFEST__', JSON.generate(JSON.parse(File.read(archer_split_path))), 'camadas de movimento e tiro do arqueiro')
replace_once!(stride_runtime, '__RUN_STRIDE_MANIFEST__', JSON.generate(stride_manifest), 'fases da passada')
hero_attack_path = File.join(ROOT, 'hero_attack_fx.js')
enemy_attack_path = File.join(ROOT, 'enemy_attack_fx.js')
hero_attack_runtime = File.read(hero_attack_path, encoding: 'UTF-8')
hero_attack_v3_dir = File.join(REPO_ROOT, 'assets', 'hero-attack-fx', 'v3')
hero_attack_v3_manifest_path = File.join(hero_attack_v3_dir, 'manifest.json')
hero_attack_v3_paths = %w[franco ryuchi alt katana synth percussion].to_h do |hero|
  [hero, File.join(hero_attack_v3_dir, 'atlas', "#{hero}.png")]
end
replace_once!(hero_attack_runtime, '__HERO_ATTACK_V3_ATLASES__', png_map(hero_attack_v3_paths), 'animações compactas originais dos seis personagens')
replace_once!(hero_attack_runtime, '__HERO_ATTACK_V3_MANIFEST__', JSON.generate(JSON.parse(File.read(hero_attack_v3_manifest_path))), 'fases e transparência dos ataques')
# Fase 4 da narrativa: leitura, narrador como cenário, falas de combate e consequências.
NARRATIVA_JS = File.join(ROOT, 'narrativa_v1.js')
NARRATIVA_DATA = File.join(REPO_ROOT, 'design', 'dialogo', 'NARRATIVA_FASE4.json')
narrativa_runtime = File.read(NARRATIVA_JS, encoding: 'UTF-8')
raise 'Marcador __NARRATIVA_DATA__ ausente' unless narrativa_runtime.scan('__NARRATIVA_DATA__').length == 1
narrativa_runtime = narrativa_runtime.sub('__NARRATIVA_DATA__') { JSON.generate(JSON.parse(File.read(NARRATIVA_DATA, encoding: 'UTF-8'))) }
# Fase 2: dificuldade, chefes em três fases, inimigos novos, encontros e impacto.
FASE2_JS = %w[dificuldade_v1.js encontros_v1.js impacto_v1.js].map { |name| File.join(ROOT, name) }
# Approved interface assets embedded in the portable build, with original game logic intact.
UI7_JS = File.join(ROOT, 'interface_v7.js')
UI7_CSS = File.join(ROOT, 'interface_v7.css')
TOUCH_LAYOUT_JS = File.join(ROOT, 'touch_layout_v1.js')
MENU_CONTROLS_JS = File.join(ROOT, 'interface_controls_v7.js')
ENEMY_HEALTH_JS = File.join(ROOT, 'enemy_health_v7.js')
UI7_SCREENS_JS = File.join(ROOT, 'interface_screens_v7.js')
UI7_SCREENS_CSS = File.join(ROOT, 'interface_screens_v7.css')
UI7_NEW_GAMES_JS = File.join(ROOT, 'ui7_new_games_v1.js')
UI7_NEW_GAMES_CSS = File.join(ROOT, 'ui7_new_games_v1.css')
COMBAT_READABILITY_JS = File.join(ROOT, 'combat_readability_v1.js')
SKILL_MOVEMENT_JS = File.join(ROOT, 'skill_movement_v1.js')
COMBAT_READABILITY_DIR = File.join(REPO_ROOT, 'assets', 'combat-readability', 'v1')
ENEMY_VARIANT_V2_JS = File.join(ROOT, 'enemy_variant_art_v2.js')
ENEMY_VARIANT_V2_DIR = File.join(REPO_ROOT, 'assets', 'enemies', 'variants-v2')
ENEMY_SKILL_FX_JS = File.join(ROOT, 'enemy_skill_fx_v1.js')
ENEMY_SKILL_FX_DIR = File.join(REPO_ROOT, 'assets', 'enemy-skill-fx', 'v2')
GROUND_RIFT_DIR = File.join(REPO_ROOT, 'assets', 'portal-chao', 'v1')
LUMI_JS = File.join(ROOT, 'lumi_melody.js')
ui7_asset_dir = File.join(REPO_ROOT, 'assets', 'interface', 'v1')
ui7_paths = Dir[File.join(ui7_asset_dir, '{dungeon,icons}', '*.png')].reject { |p| File.basename(p) == 'atlas.png' }.to_h { |p| [File.basename(p, '.png'), p] }
ui7_paths['titleStudio'] = File.join(ui7_asset_dir, 'title_studio.png')
ui7_runtime = File.read(UI7_JS, encoding: 'UTF-8')
replace_once!(ui7_runtime, '__UI7_ASSETS__', png_map(ui7_paths), 'ícones de interface')
replace_once!(ui7_runtime, '__UI7_CSS__', JSON.generate(File.read(UI7_CSS, encoding: 'UTF-8')), 'estilos de interface')
ui7_screens_runtime = File.read(UI7_SCREENS_JS, encoding: 'UTF-8')
replace_once!(ui7_screens_runtime, '__UI7_SCREENS_CSS__', JSON.generate(File.read(UI7_SCREENS_CSS, encoding: 'UTF-8')), 'componentes internos das telas')
ui7_new_games_runtime = File.read(UI7_NEW_GAMES_JS, encoding: 'UTF-8')
replace_once!(ui7_new_games_runtime, '__UI7_NEW_GAMES_CSS__', JSON.generate(File.read(UI7_NEW_GAMES_CSS, encoding: 'UTF-8')), 'interface dos novos jogos musicais')
combat_readability_runtime = File.read(COMBAT_READABILITY_JS, encoding: 'UTF-8')
replace_once!(combat_readability_runtime, '__COMBAT_READABILITY_ASSET__', JSON.generate("data:image/png;base64,#{encode(File.join(COMBAT_READABILITY_DIR, 'combat_readability.png'))}"), 'sprites de legibilidade do combate')
replace_once!(combat_readability_runtime, '__GROUND_RIFT_ASSET__', JSON.generate("data:image/png;base64,#{encode(File.join(GROUND_RIFT_DIR, 'fenda_chao_proposta.png'))}"), 'fenda horizontal no piso das ruínas')
replace_once!(combat_readability_runtime, '__COMBAT_READABILITY_MANIFEST__', JSON.generate(JSON.parse(File.read(File.join(COMBAT_READABILITY_DIR, 'manifest.json'), encoding: 'UTF-8'))), 'manifesto dos sprites de combate')
enemy_variant_v2_paths = Dir[File.join(ENEMY_VARIANT_V2_DIR, 'atlas', '*.png')].to_h { |path| [File.basename(path, '.png'), path] }
raise 'Expected six authored enemy variant atlases' unless enemy_variant_v2_paths.length == 6
enemy_variant_runtime = File.read(ENEMY_VARIANT_V2_JS, encoding: 'UTF-8')
replace_once!(enemy_variant_runtime, '__ENEMY_VARIANT_V2_ASSETS__', png_map(enemy_variant_v2_paths), 'corpos próprios dos seis inimigos adicionais')
replace_once!(enemy_variant_runtime, '__ENEMY_VARIANT_V2_MANIFEST__', JSON.generate(JSON.parse(File.read(File.join(ENEMY_VARIANT_V2_DIR, 'manifest.json'), encoding: 'UTF-8'))), 'poses e orientações dos inimigos adicionais')
enemy_skill_fx_paths = Dir[File.join(ENEMY_SKILL_FX_DIR, 'atlas', '*.png')].to_h { |path| [path.delete_prefix(ENEMY_SKILL_FX_DIR + '/'), path] }
abort 'Esperados seis atlas de golpes dos encontros' unless enemy_skill_fx_paths.length == 6
enemy_skill_fx_runtime = File.read(ENEMY_SKILL_FX_JS, encoding: 'UTF-8')
replace_once!(enemy_skill_fx_runtime, '__ENEMY_SKILL_FX_ASSETS__', png_map(enemy_skill_fx_paths), 'efeitos próprios dos seis inimigos')
replace_once!(enemy_skill_fx_runtime, '__ENEMY_SKILL_FX_MANIFEST__', JSON.generate(JSON.parse(File.read(File.join(ENEMY_SKILL_FX_DIR, 'manifest.json'), encoding: 'UTF-8'))), 'sequências materiais dos golpes dos encontros')
fase2_runtimes = FASE2_JS.map do |path|
  source = File.read(path, encoding: 'UTF-8')
  if File.basename(path) == 'dificuldade_v1.js'
    replace_once!(source, 'marcador(h,cam);', 'if(!window.CombatReadabilityV1?.ground(h))marcador(h,cam);', 'sprites dos perigos sem alterar sua simulação')
  end
  if File.basename(path) == 'encontros_v1.js'
    replace_once!(source, 'const e=entity||{};', 'const e=entity||{};if(window.EnemyVariantArtV2?.draw(x,y,kind,e))return;', 'corpos animados antes dos proxies de encontros')
  end
  source
end

bridge_root = File.join(REPO_ROOT, 'assets', 'ponte-frequencias', 'runtime')
bridge_manifest = File.join(bridge_root, 'manifest.json')
bridge_assets = File.file?(bridge_manifest) ? JSON.parse(File.read(bridge_manifest)) : {}
bridge_files = bridge_assets.empty? ? [] :
  bridge_assets.fetch('stations').values.map { |prop| prop.fetch('file') } +
    bridge_assets.fetch('bridge').values_at('montagem', 'desmonte').flatten
bridge_assets['files'] = bridge_files.to_h do |file|
  [file, "data:image/png;base64,#{encode(File.join(bridge_root, file))}"]
end
bridge_art = File.join(ROOT, 'bridge_art.js')
bridge_puzzle = File.join(ROOT, 'bridge_puzzle.js')
radio_tuning = File.join(ROOT, 'radio9_tuning.js')
lumi_melody = File.join(ROOT, 'lumi_melody.js')
plant_sequencer = File.join(ROOT, 'plant_sequencer.js')
club_stage = File.join(ROOT, 'club_stage.js')
final_echoes = File.join(ROOT, 'final_echoes.js')
club_art_dir = File.join(ASSETS, 'runtime', 'palco-contratempo')
club_art = %w[backdrop bass drums guitar chair_north rack bar_west].to_h { |name| [name, File.join(club_art_dir, "#{name}.png")] }
club_runtime = File.read(club_stage, encoding: 'UTF-8')
replace_once!(club_runtime, '__CLUB_STAGE_ASSETS__', png_map(club_art), 'instrumentos e fundo do Contratempo')
canal_violin = File.join(ROOT, 'canal_violin.js')
canal_recording = File.join(ASSETS, 'audio', 'violino-veracidade-canal.wav')
canal_runtime = File.read(canal_violin, encoding: 'UTF-8')
replace_once!(canal_runtime, '__CANAL_VIOLIN_WAV__', encode(canal_recording), 'recorte de Veracidade no Canal Suspenso')
bridge_runtime = File.read(bridge_art, encoding: 'UTF-8')
replace_once!(bridge_runtime, '__BRIDGE_SPRITES__', JSON.generate(bridge_assets), 'sprites da Ponte das Frequências')
parts = [runtime, input_runtime, edits_js, *[PACING_JS, HEALING_JS, COMBAT_JS, FLOW_JS, ACCESS_JS, PACE_METER].map { |path| File.read(path, encoding: 'UTF-8') }, ninja_archer_runtime, protagonist_runtime, cenarios_runtime, musician_runtime, enemy_art_runtime, boss_animation_runtime, ground_fx_runtime, polish_runtime, File.read(NPC_LIFE_JS, encoding: 'UTF-8'), npc_gestures_runtime, environment_depth_runtime, stride_runtime, cloud_runtime, environment_atmosphere_runtime, cloud_story_runtime, File.read(File.join(ROOT, 'postgame.js'), encoding: 'UTF-8'), File.read(File.join(ROOT,'hero_legacy_fx.js'), encoding: 'UTF-8'), hero_attack_runtime, File.read(enemy_attack_path, encoding: 'UTF-8'), body_runtime, narrativa_runtime, File.read(File.join(ROOT, 'interface_v6.js'), encoding: 'UTF-8'), *fase2_runtimes, bridge_runtime, File.read(bridge_puzzle, encoding: 'UTF-8'), File.read(radio_tuning, encoding: 'UTF-8'), File.read(LUMI_JS, encoding: 'UTF-8'), canal_runtime, File.read(plant_sequencer, encoding: 'UTF-8'), club_runtime, File.read(final_echoes, encoding: 'UTF-8'), ui7_runtime, File.read(TOUCH_LAYOUT_JS, encoding: 'UTF-8'), File.read(MENU_CONTROLS_JS, encoding: 'UTF-8'), File.read(ENEMY_HEALTH_JS, encoding: 'UTF-8'), ui7_screens_runtime, combat_readability_runtime, enemy_variant_runtime, enemy_skill_fx_runtime, File.read(SKILL_MOVEMENT_JS, encoding: 'UTF-8'), ui7_new_games_runtime]
parts += %w[render_performance_v1.js guidance_recovery_v1.js final_asset_loading_v1.js].map { |name| File.read(File.join(ROOT, name), encoding: 'UTF-8') }
runtime = input_runtime = edits_js = ninja_archer_runtime = protagonist_runtime = cenarios_runtime = musician_runtime = enemy_art_runtime = boss_animation_runtime = ground_fx_runtime = polish_runtime = npc_gestures_runtime = environment_depth_runtime = cloud_runtime = environment_atmosphere_runtime = cloud_story_runtime = nil
html.insert(position, "\n")
until parts.empty?
  part = parts.pop
  html.insert(position, part)
  html.insert(position, "\n\n")
end
part = nil
GC.start

html.gsub!('1.0 · PRÉ-ALPHA', VERSION.fetch('rotulo'))
html.gsub!('ALPHA 1.2.0', VERSION.fetch('rotulo'))
html.gsub!('Alpha 1.2.0', VERSION.fetch('titulo'))

html.gsub!('clamp(G.x*T-VW/2,0,a.w*T-VW)', 'clamp(coopCamera123("x")*T-VW/2,0,a.w*T-VW)')
html.gsub!('clamp(G.y*T-VH/2,0,a.h*T-VH)', 'clamp(coopCamera123("y")*T-VH/2,0,a.h*T-VH)')
html.gsub!("yy=bossActor?.id==='voice_boss'?", "yy=!C3.coopActive()&&bossActor?.id==='voice_boss'?")
FileUtils.mkdir_p(OUTPUT_DIR)
GC.start
pending_output = "#{OUTPUT}.building-#{Process.pid}"
begin
  # APFS can clone the large portable file without allocating another copy.
  # Patch only changed chunks; retain the atomic rename and verify every byte.
  cloned = RUBY_PLATFORM.include?('darwin') && File.file?(OUTPUT) &&
    system('cp', '-c', OUTPUT, pending_output, out: File::NULL, err: File::NULL)
  if cloned
    File.open(pending_output, 'r+b') do |pending|
      offset = 0
      while offset < html.bytesize
        chunk = html.byteslice(offset, 4 * 1024 * 1024).b
        previous = pending.read(chunk.bytesize)
        if previous != chunk
          pending.seek(offset)
          pending.write(chunk)
        end
        offset += chunk.bytesize
        pending.seek(offset)
      end
      pending.truncate(html.bytesize)
    end
  else
    File.binwrite(pending_output, html)
  end
  abort 'Conteúdo da build temporária divergente' unless
    Digest::SHA256.file(pending_output).hexdigest == Digest::SHA256.hexdigest(html)
  File.rename(pending_output, OUTPUT)
ensure
  File.delete(pending_output) if File.exist?(pending_output)
end

sources = [PROTAGONIST_JS, File.join(PROTAGONIST_ASSETS, 'manifest.json')] + protagonist_files.map { |relative| File.join(PROTAGONIST_ASSETS, relative) } + FILES.values + [BASE, SORTE_JS, NARRATIVA_JS, NARRATIVA_DATA, RUNTIME, INPUT_RUNTIME, DIALOGUE_EDITS_JS, DIALOGUE_EDITS, PACING_JS, HEALING_JS, COMBAT_JS, FLOW_JS, ACCESS_JS, PACE_METER, DIALOGUES, NINJA_ARCHER_JS, File.join(NINJA_ARCHER_ASSETS, 'manifest.json')] + ninja_archer_files.map { |relative| File.join(NINJA_ARCHER_ASSETS, relative) }
sources += [File.join(REPO_ROOT, 'production', 'import_hero_attack_v3.py')] + Dir[File.join(hero_attack_v3_dir, '**', '*')].select { |path| File.file?(path) }
sources += [File.join(REPO_ROOT, 'production', 'clean_ryuchi_matte_v9.py')] + Dir[File.join(ryuchi_matte_dir, '**', '*')].select { |path| File.file?(path) }
sources += [stride_registration_path, File.join(REPO_ROOT, 'production', 'register_locomotion_v9.py')]
sources += [File.join(LOCOMOTION_ASSETS, 'manifest.json')] + locomotion_files.map { |relative| File.join(LOCOMOTION_ASSETS, relative) }
sources += [NPC_GESTURES_JS, File.join(NPC_GESTURES_ASSETS, 'city_gestures.png'), File.join(NPC_GESTURES_ASSETS, 'manifest.json')]
sources += Dir[File.join(REPO_ROOT, 'assets', 'npcs', 'vida-v2', '*.png')] + [File.join(REPO_ROOT, 'assets', 'npcs', 'vida-v2', 'manifest.json')]
sources += [WORLD_POLISH_JS, NPC_LIFE_JS, File.join(WORLD_POLISH_ASSETS, 'manifest.json')] + polish_files.map { |relative| File.join(WORLD_POLISH_ASSETS, relative) }
sources += [MUSICIAN_JS, File.join(MUSICIAN_ASSETS, 'manifest.json')] + musician_files.map { |relative| File.join(MUSICIAN_ASSETS, relative) }
sources += [CENARIOS_JS, File.join(CENARIOS_ASSETS, 'manifest.json')] + cenarios_files.map { |relative| File.expand_path(relative, CENARIOS_ASSETS) }
if cenarios_theme == 'deserto-v1'
  sources += [desert_manifest_path, File.join(ROOT, 'cenarios_deserto_v1.js')]
end

sources += [ENEMY_ART_JS, File.join(ENEMY_ART_ASSETS, 'manifest.json')] + enemy_art_files.map { |relative| File.join(ENEMY_ART_ASSETS, relative) }
sources += [BOSS_ANIMATION_JS, File.join(BOSS_ANIMATION_ASSETS, 'manifest.json'), File.join(BOSS_ANIMATION_V3, 'manifest.json')] + boss_animation_paths.values

sources += %w[hero_legacy_fx.rb hero_legacy_fx.js].map { |name| File.join(ROOT, name) }
sources += body_paths.values + stride_paths.values + [body_placement, body_script, stride_script, stride_manifest_path, archer_split_path]
sources += [File.join(ROOT, "postgame.js"), File.join(ROOT, "interface_v6.js"), hero_attack_path, enemy_attack_path]
sources += [BOSS_GROUND_FX_JS, File.join(BOSS_GROUND_FX_ASSETS, 'manifest.json'), File.join(BOSS_GROUND_FX_V2, 'manifest.json')] + ground_fx_paths.values
sources += [ENVIRONMENT_DEPTH_JS, ENVIRONMENT_ATMOSPHERE_JS, CLOUD_WORLD_JS, CLOUD_STORY_JS, File.join(CLOUD_WORLD_ASSETS, 'manifest.json')] + cloud_files.values
sources += [File.join(ENVIRONMENT_VOLUME_ASSETS, 'manifest.json')] + volume_files.values
sources += [ENEMY_VARIANT_V2_JS, File.join(REPO_ROOT, 'production', 'import_enemy_variants_v2.py'), File.join(REPO_ROOT, 'production', 'segment_enemy_variants_v2.py')] + Dir[File.join(ENEMY_VARIANT_V2_DIR, '{atlas,source}', '**', '*'), File.join(ENEMY_VARIANT_V2_DIR, '*.json'), File.join(ENEMY_VARIANT_V2_DIR, 'README.md')].select { |path| File.file?(path) }
sources += [ENEMY_SKILL_FX_JS, File.join(REPO_ROOT, 'production', 'import_enemy_skill_fx_v1.py'), File.join(REPO_ROOT, 'production', 'import_enemy_skill_fx_v2.py')] + Dir[File.join(ENEMY_SKILL_FX_DIR, '{atlas,source}', '**', '*'), File.join(ENEMY_SKILL_FX_DIR, '*.json')].select { |path| File.file?(path) }
sources += FASE2_JS + [LUMI_JS, UI7_JS, UI7_CSS, TOUCH_LAYOUT_JS, MENU_CONTROLS_JS, ENEMY_HEALTH_JS, UI7_SCREENS_JS, UI7_SCREENS_CSS, UI7_NEW_GAMES_JS, UI7_NEW_GAMES_CSS, COMBAT_READABILITY_JS, SKILL_MOVEMENT_JS] + [File.join(REPO_ROOT, 'production', 'export_combat_readability_v1.py')] + Dir[File.join(COMBAT_READABILITY_DIR, '*')].select { |p| File.file?(p) } + Dir[File.join(GROUND_RIFT_DIR, '*')].select { |p| File.file?(p) } + Dir[File.join(ui7_asset_dir, '**', '*')].select { |p| File.file?(p) }
sources += FASE2_JS + [bridge_art, bridge_puzzle, radio_tuning, lumi_melody, canal_violin, canal_recording, plant_sequencer, club_stage, final_echoes] + club_art.values + [File.join(club_art_dir, 'manifest.json')]
if File.file?(bridge_manifest)
  sources += [bridge_manifest] + bridge_files.map { |file| File.join(bridge_root, file) }
end
sources += %w[render_performance_v1.js guidance_recovery_v1.js final_asset_loading_v1.js].map { |name| File.join(ROOT, name) }
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
    portrait_viewport: { width: 512, height: [380, 820], responsive: true },
    landscape_viewport: [768, 432],
    distance_teleport: false
  },
  sources: sources.uniq.to_h do |path|
    key = [bridge_root, club_art_dir, File.dirname(canal_recording), ENEMY_SKILL_FX_DIR, ENEMY_VARIANT_V2_DIR, ryuchi_matte_dir, hero_attack_v3_dir, body_dir, stride_dir, BOSS_ANIMATION_V3, BOSS_GROUND_FX_V2, File.join(REPO_ROOT, 'assets', 'npcs', 'vida-v2'), NINJA_ARCHER_ASSETS, PROTAGONIST_ASSETS, LOCOMOTION_ASSETS, WORLD_POLISH_ASSETS, NPC_GESTURES_ASSETS, File.join(REPO_ROOT, 'assets', 'cenarios'), MUSICIAN_ASSETS, ENEMY_ART_ASSETS, BOSS_ANIMATION_ASSETS, BOSS_GROUND_FX_ASSETS, CLOUD_WORLD_ASSETS, ENVIRONMENT_VOLUME_ASSETS].any? { |folder| path.start_with?(folder + '/') } ? path.delete_prefix(REPO_ROOT + '/') : File.basename(path)

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

  O arquivo original torii-core.html não é alterado.
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

