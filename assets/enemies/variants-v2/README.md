# Corpos dedicados dos encontros — V2

Produção original via built-in image_gen em26/11/2026. Referências canônicas: EnemyArtV1 (hush, compasso, c3_drone) e boss/Viajante, usadas somente para linguagem visual. Os seis tipos agora têm silhuetas e equipamento físico próprios; não são recolorações dos proxies.

- Dez folhas-fonte RGBA preservadas em `source/`; prompts exatos em `PROMPTS.json` e `DIRECTION_PROMPTS.json`, com origem da geração por arquivo.
- Seis inimigos: tambor_escudo, flautim_atirador, coro_curador, maestro_invocador, muralha_estatica, antena_feedback.
- Quatro estados: idle, prepare, attack, hurt. Oito desenhos autorais consecutivos por sequência. Total40sequências/320poses.
- Tambor/Muralha possuem frente, perfil e costas autorais. Esquerda usa espelhamento do perfil, sem inscrições dependentes de lateralidade. Os corpos ficam eretos; não são girados como figuras planas. Os outros inimigos seguem apresentação3/4; Flautim admite espelhamento lateral.
- Células128×128, pivô64,104, filtro nearest. Atlas1024×512 para quatro tipos;1024×1536 para os dois escudos. Exportação por `production/import_enemy_variants_v2.py`, mantendo um único transform/pivô de apoio por facing e a escala relativa das fases. Margem transparente de segurança; alpha1..8 zerado só no derivado para eliminar ruído de fundo. Nenhum desenho intermediário é fabricado.

`manifest.json` registra grade, dimensões, paleta, fontes/hashes, pivô, transform, caixas por quadro, escala lógica, facings, estados, playback e altura da silhueta. A escala é escolha de apresentação, não mudança de hitbox. O escudo deslocado na pose hurt3 serve à janela original de abertura, depois da animação de ataque; não altera duração de bloqueio.

`enemy_variant_art_v2.js` é aditivo, carregado após CombatReadability e antes do init. O hook de encontros ocorre antes da aura/proxy; wrappers externos de vida/FX recebem o ator original. `headHeight(e)` usa metadados prontos, sem ler o atlas no canvas. A API `ownsCast(e)` elimina somente o glifo de cast do corpo quando o novo PNG está pronto; chão, projéteis, impactos e bursts permanecem.

Estados seguem wind/canto/chamado, flash/stun, cooldown do melee do Coro e flags f2aberto/f2tonto. Releases efetivos também são observados em D.perigos; cancelamento pela espera do boss não fabrica ataque. Poses/relógio são cosméticos e param nos menus. HP, AI, RNG, timers, hitboxes e saves permanecem nas funções originais.

Enquanto o PNG está pendente ou falha, o corpo nativo anterior é um fallback de tamanho limitado; nunca se usa largura do atlas como tamanho do ator. Prewarm consulta ready na proximidade para promover o carregamento HTTP antes da primeira aparição.

Tokens: `__ENEMY_VARIANT_V2_ASSETS__` (tipo→dataURI) e `__ENEMY_VARIANT_V2_MANIFEST__` (JSON). Pranchas em `preview/`, `contact-sheet.png` e `background-review.png`. QA separa inspeção de PNG, contrato VM e execução real em navegador. Emulação não equivale a aparelho físico/campanha humana.

## Correção de segmentação —26/11/2026

O recorte uniforme inicial estava rejeitado: algumas poses dos escudos atravessavam a divisão nominal da folha, que cortava a própria peça e levava um fragmento do vizinho. `history/uniform-grid-20261126/` preserva esses exports apenas como evidência do erro; nunca devem ser integrados. `SEGMENTATION_REPAIR.png` compara os casos apontados antes/depois.

O importador agora chama `production/segment_enemy_variants_v2.py` sobre a folha inteira. São32componentes físicos principais por fonte; todo pixel sólido alpha>64 recebe exatamente um dono, o corpo principal de cada pose é preservado inteiro e nenhum corpo vizinho entra na sua máscara. Antialias original é mantido até4px do núcleo físico, descartando haze difuso do fundo. A cobertura de pixels refere-se à separação da fonte antes da redução nearest. A fonte original não foi repintada ou cortada.

Só depois dessa atribuição global o empacotamento usa coordenadas nominais/pivô constante para manter o deslocamento autoral dos golpes. Não recentra cada bbox. O manifesto registra bounds globais, origem nominal, canvas expandido, pixels sólidos atribuídos, hash e escala por pose/facing. QA verifica anatomia/ownership, além da margem alpha; a margem sozinha havia deixado passar o defeito.
