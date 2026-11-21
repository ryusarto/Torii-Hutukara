# Attribute historical drawing primitives at creation. Keep their timers and
# gameplay records, and skip only artwork replaced by a successfully loaded PNG.
def install_hero_legacy_fx!(html)
  patches = {
    'if(act.slash>0&&mode' => 'if(act.slash>0&&!HeroLegacyFX.ready(act.slashHero)&&mode',
    'combatFX.push({x,y,kind,r,time' => 'combatFX.push({heroOrigin:HeroLegacyFX.actor,heroArt:HeroLegacyFX.ringOwner(kind),x,y,kind,r,time',
    'for(const f of combatFX){const k=' => 'for(const f of combatFX){if(partyPass!==null&&Boolean(f.heroOrigin)!==partyPass)continue;if(HeroLegacyFX.ready(f.heroArt))continue;const k=',
    'Combat10.effects.push({type,x,y,dir:' => 'Combat10.effects.push({heroArt:HeroLegacyFX.effectOwner(type),type,x,y,dir:',
    'for(const f of Combat10.effects){const k=' => 'for(const f of Combat10.effects){if(HeroLegacyFX.ready(f.heroArt))continue;const k=',
    # Heart is a burst at Franco. Chain, cut, rain and target marks convey the
    # actual world-space span of the technique and have their own draw paths.
    "if(f.kind==='heart'){for(let j=" => "if(f.kind==='heart'){if(HeroLegacyFX.ready('franco'))continue;for(let j=",
    'vfx.push({x:x*T,y:y*T,vx:Math.cos(a)*spd' => 'vfx.push({heroArt:HeroLegacyFX.actor,x:x*T,y:y*T,vx:Math.cos(a)*spd',
    'function drawVfx(dt){' => 'function drawVfx(dt,partyPass=null){',
    'p.vy+=16*dt;ctx.globalAlpha=' => 'p.vy+=16*dt;if(partyPass!==null&&Boolean(p.heroArt)!==partyPass)continue;if(HeroLegacyFX.ready(p.heroArt))continue;ctx.globalAlpha=',
    "if(typeof BossChoreographyV2!=='undefined')BossChoreographyV2.drawGround();" =>
      "HeroLegacyFX.drawGround();if(typeof BossChoreographyV2!=='undefined')BossChoreographyV2.drawGround();",
    "drawCombatLayer();if(mode!=='action')drawGuideMarker();drawVfx(0);" =>
      "HeroLegacyFX.drawOverlay();if(mode!=='action')drawGuideMarker();drawVfx(0,false);"

  }
  patches.each { |old, replacement| replace_once!(html, old, replacement, "legacy VFX #{old}") }
  # Lift each original loop without copying the drawing code. A standalone
  # drawCombatLayer() (used by QA) continues to draw everything.
  definitions = []
  extract = lambda do |first, following, signature, call, prelude = ''|
    start = html.index(first)
    stop = start && html.index(following, start + first.length)
    raise "Unsplittable hero layer: #{signature}" unless start && stop
    body = html[start...stop]
    raise "Unexpected hero layer length: #{signature}" unless body.size.between?(40, 2500)
    definitions << "function #{signature}{#{prelude}#{body}}"
    html[start...stop] = call
  end
  extract.call('for(const p of projectiles){if(typeof HeroAttackFX', 'for(const p of hostileShots)',
               'drawAlliedProjectiles()', 'if(!HeroLegacyFX.worldOverlay)drawAlliedProjectiles();')
  extract.call('for(const f of combatFX){if(partyPass', 'for(const e of [...enemyActors()',
               'drawHeroRings(partyPass)', 'drawHeroRings(HeroLegacyFX.worldOverlay?false:null);')
  extract.call("if(act.slash>0&&!HeroLegacyFX.ready", 'if(switchedAt>0){ctx.fillStyle=',
               'drawHeroSwipe()', 'if(!HeroLegacyFX.worldOverlay)drawHeroSwipe();',
               "if(G.active==='katana'||G.active==='alt')return;const x=G.x*T-cam.x,y=G.y*T-cam.y;")
  extract.call('for(const f of Combat10.effects){if(HeroLegacyFX.ready', "if(Combat10.guard>0&&G.active==='katana'){const x=",
               'drawEquipmentCues()', 'if(!HeroLegacyFX.worldOverlay)drawEquipmentCues();')
  extract.call('ctx.save();for(const f of Special11.traces){const k=', '};' + "\n" + '// Schema stays compatible',
               'drawSignatureCues()', 'if(!HeroLegacyFX.worldOverlay)drawSignatureCues();')
  anchor = 'function drawCombatLayer(){if(!G)return;'
  replace_once!(html, anchor, definitions.join("\n") + "\n" + anchor, 'shared allied ground drawing')
end
