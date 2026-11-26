# Combat Readability V1

Arte original produzida em código para Torii & Hutukara (HTML/Canvas). Os clips deste atlas são originais em código. A fenda de chão é um recurso separado gerado por imagegen, descrito abaixo.

- Fonte editável: `production/export_combat_readability_v1.py` (Pillow).
- Export: `combat_readability.png`, RGBA 1024×2560, 20 linhas × 8 quadros, células128×128, transparência real, filtro nearest.
- FX são desenhados nativamente em64×64 e ampliados por inteiro; portal em128×128.
- Manifesto identifica linhas, nomes, paletas, pivôs e animação. FX: pivô64,64; portal:64,112. Portal conserva a mesma estrutura entre estados.
- Preparação acompanha quatro fases do tempo original do perigo. Descarga/resíduo: quatro quadros de120ms. Projéteis:75ms/quadro. Portal:140ms/quadro. Movimento reduzido conserva quadros estáticos informativos.

## Integração

`game/source/chapter-03/combat_readability_v1.js` recebe atlas e manifesto embutidos pelo builder. O marcador privado da dificuldade chama `CombatReadabilityV1.ground(h)` com fallback legado quando o atlas ainda não está pronto. Não há mudanças de dano, relógios, hitboxes, persistência ou cancelamento.

O detalhe e as texturas existentes de BossGroundFXV1 são recortados no chão pela geometria real. Contorno informativo e poucos fragmentos de identidade ficam sobre a vegetação, sem preenchimento opaco sobre atores. Círculos, cruz finita, corredor, cone e coroa preservam as regiões de dano e o centro seguro. Mira sem dano é tracejada; feixe danoso é sólido. Cura e invocação usam identidades próprias.

Famílias: Viajante âmbar/cobre; Arauto interferência rosa/grafite; Metrônomo ferrugem/latão; Silêncio lavanda/marfim. O portal ativo usa exclusivamente `assets/portal-chao/v1/fenda_chao_proposta.png`, gerado pelo built-in imagegen em25/11/2026 e preservado sem alteração:1774×887 RGBA. É desenhado no chão antes dos atores, footprint2×1tiles e pivô no centro. Se o PNG ainda estiver carregando ou falhar, uma elipse de pedra/índigo e rasgo plano conserva o ponto interativo visível, sem arquitetura vertical. Os dois sigilos achatados respondem separadamente a `ruinA`/`ruinB`; estados dormant/ready/spent respondem às flags originais. As três linhas de portal vertical do atlas estão descontinuadas e não são renderizadas; permanecem apenas para estabilidade das linhas dos outros clips.

## Validação reproduzível

`qa/combat_readability_v1_asset.py`: estrutura, quadros, alpha e pivôs do atlas.

`qa/combat_readability_v1_browser.cjs`: runtime construído no Chrome headless, fixtures controladas, dano resolvido pela simulação original, recorte de geometrias, cancelamento, pausa e portal. Capturas cobrem chão livre e vegetação original, três projéteis de leque e seis radiais separados. Não equivale a campanha jogada por humano nem validação de aparelhos móveis físicos.

Inventário e direção: `design/interface_v7/AUDITORIA_TELAS_E_FX.md`. Resultados e capturas: `qa/beta-1.17.0/COMBAT_READABILITY_*.json` e arquivos `fx_*.png`/`portal_*.png`. A aprovação visual depende das capturas da build corrente, não apenas da prancha isolada.
