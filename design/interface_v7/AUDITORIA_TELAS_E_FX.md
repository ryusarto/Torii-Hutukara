# Auditoria visual — telas, portal e ataques

25/11/2026. Árvore local `BUILD_INTERFACE_1_17`, Beta 1.17.0 em desenvolvimento; sem merge ou publicação. Auditoria documental do código efetivo, com inspeção visual isolada dos atlas existentes `boss-ground-fx/v=1/atlas/pulse.png` e `scrap.png`. Não equivale a execução de combate nem teste humano.

## Diagnóstico

Os golpes normais dos quatro chefes já passam por `BossChoreographyV2` → `BossGroundFXV1` → `EnemyAttackFX`, com sprites de preparação, descarga e resíduo. Os ataques adicionais de dificuldade/encontros são criados em outra coleção, `ToriiDificuldade.perigos`, e desenhados diretamente por `marcador()`. Não chegam ao pipeline de sprites dos chefes. Os seis tipos novos de inimigo também desenham o corpo diretamente por `EnemyArtV1.draw`, ignorando os glifos de ação de `EnemyAttackFX.actor`.

Assim, coexistem efeitos detalhados e marcações geométricas antigas no mesmo combate. Os projéteis já têm um fallback animado (`wisp`) em `EnemyAttackFX.projectile`; não é correto afirmar que todos os projéteis extras são quadrados sem sprite. O que lhes falta é identidade/aviso específico em algumas famílias.

## Cobertura existente a preservar

| Grupo | Padrões cobertos | Pipeline/limite |
| --- | --- | --- |
| Viajante | `ring`, `fan`, `charge` | `BossChoreographyV2.snapshot/release/paint`; chão pulse âmbar; glifos gong/claws/lance. |
| Arauto | `lanes`, `feedback`, `double_wave`, `volley` | Chão static; faixas/círculo/ondas e projéteis bolts. |
| Metrônomo C3 | `ring`, `cross`, `fan`, `pulse` | `C3.castPattern/fireHazard`; chão scrap; gear/pistons/ratchet/pendulum. |
| Silêncio C3 | `ring`, `cross`, `fan`, `pulse`, `rain`, `chase`, `orbit` | Chão void e emissores; eclipse/fracture/feathers/aperture/shards/comet/satellites. |
| Residentes | `hush`, `whisper`, `compasso`, `espelho`, `abafador`, `c3_echo`, `c3_drone` | Preparações no corpo e projéteis via `EnemyAttackFX`. O piso de alguns golpes musicais ainda é aura/arco/addCombatFX genérico. |

Fonte: `enemy_attack_fx.js`, `boss_ground_fx_v1.js`, `boss_choreography_v2.js`. O novo material não deve cobrir nem duplicar essas passagens sem necessidade.

## Lacunas de ataques de dificuldade

Todos os itens abaixo estão em `dificuldade_v1.js`. A aparência existente é marca geométrica de `marcador(h,cam)` mais `addCombatFX('strike'/'hit')` na resolução.

| Origem/gatilho | Dados reais | Dano/ação | Brief visual |
| --- | --- | --- | --- |
| Boss em fase II no Difícil, depois de ataque resolvido (`ecoDificil`) | `ring`, r=1,25, aviso 1 s, um por lutador | 60% power, mínimo 5 | Eco rachado menor da família daquele chefe; não se confundir com o ataque principal. |
| Viajante fase III (`golpeFase3`) | `ring`, r=1,55, aviso 0,95 s, um por lutador | 80% power, mínimo 6 | Impacto de máscara/onda âmbar ao redor do ponto fixado. |
| Arauto fase III | `cross`, len=9, width=0,85, aviso 1,05 s | Dano base acima +2 | Cruz de interferência com linhas de transmissão/faders; braços limitados a len=9. |
| Metrônomo fase III | Dois `ring` r=1,35 por lutador, aviso 0,7 s, segundo com `atraso=0,55` | Dano base | Duas batidas discretas: relógio/engrenagem, sem antecipar a segunda área antes de atraso acabar. |
| Silêncio fase III | `donut`, r=3,1, inner=1,15, aviso 1,1 s | Dano base +2 | Coroa de rasgos marfim/lavanda; centro seguro realmente vazio. |
| Hush/C3 Echo/C3 Drone, após cada segundo swipe (`padroesNovos`) | `line`, len=3,2, width=0,9, aviso 0,5 s | Dano power; ao resolver avança 12 passos × 0,26 com colisão | Investida com silhueta direcional e marcas de arrasto; não desenhar trajetória infinita. |
| Metrônomo Menor no Difícil, depois da batida | `ring`, r=1,1, aviso 0,8 s, ponto de cada lutador perto (<6) | 70% power | Contratempo menor, forma de engrenagem/dente, distinto do pulso r=2,6 do corpo. |
| Abafador no Difícil, depois de golpe | `ring`, r=2,3, aviso 0,6 s, centrado no inimigo | 80% power | Pressão de abafamento/bell, perímetro forte e interior leve. |
| Sombra/whisper, leque | Clones de hostileShot em ângulos±0,32 | Mantém velocidade/dano do original | Já recebe wisp; dar aviso/emissão de três trajetórias sem criar cone preenchido de dano inexistente. |
| Eco Espelho no Difícil, após retaliate | Seis hostileShots radiais; velocidade 4,2, tempo 1,6 s | 80% power | Seis lascas de espelho/nota, núcleo no ponto de colisão; não confundir com anel de área. |
| Transição de fase (não é ataque por si) | Pausa 1,25 s, imune 1,55 s; limpa perigos/tiros, empurra até 3,2 | A simulação conserva invulnerabilidade | Burst de fase breve/coerente; evitar clarão opaco que esconda o chão. |

## Lacunas dos seis tipos novos

Fonte: `encontros_v1.js:atualizarNovo`, `chamar`, `drawCreature`.

| Tipo | Preparação/alcance real | Variação do Difícil | Arte necessária |
| --- | --- | --- | --- |
| `tambor_escudo` | Cone aviso 0,75 s, r=2,3, arc=0,95; escudo frontal, abre 1,35 s | Segundo cone r=2,6, arc=0,75, mesmo aviso com atraso0,5 | Mão/pele/aro de tambor durante preparo e pancada; escudo visível por forma. |
| `muralha_estatica` | Cone 0,8 s r=2,4 arc=1; investida line aviso 0,9 s, len=min(7,d+1,6), width=1,15 | Recarga 2,6 em vez 3,4; tonto/aberto 1,1 em vez 1,6 | Placa/escudo de metal e arrasto direcional. Investida muda corpo antes de dano. |
| `flautim_atirador` | Linha de mira dano 0 aviso 0,7 s, len≤9, width=0,35; tiro v=9, tempo 1,3 s | Leque de três tiros, offsets±0,22 | Flautim/muzzle/nota; linha estreita de mira não deve parecer feixe danoso. |
| `antena_feedback` | Beam line aviso 1 s, len=12, width=0,8 | Três beams com offsets±0,42 | Antena/carregamento e feixe de interferência recortado nas três faixas reais. |
| `coro_curador` | Canto 1,15 s, ring r=5,5, dano 0; cura aliados no raio | Cura 35% em vez 25%; cd 3,6 em vez 4,6 | Notas de reparo/recomposição dirigidas aos aliados, não campo hostil; evento `torii:cura-inimigo`. |
| `maestro_invocador` | Chamada1,3 s, ring r=1,8, dano 0; cria dois nós menores | Máx 4 chamados/8 totais, cd 4,4 (em vez 3/6 e 6 s) | Batuta/fissuras pequenas e surgimento 0,9 s de cada nó. Interromper canto cancela visual. |

Bloqueio/abertura de escudo emite `torii:bloqueio` e `torii:abertura`. Esses sinais podem ter sprites de impacto próprios sem mexer no `hitEnemy`. Os corpos dos seis tipos são proxies recoloridos existentes; o pedido atual não exige redesenhar todo o elenco, mas exige que seus ataques tenham forma legível.

### Residentes musicais antigos

`combat_patterns.js` conserva mais três casos para conferir na integração: compasso prepara nos últimos 0,6 s do período 1,6 e acerta r=2,6 na mudança de `lastBeat`; espelho retalia depois de aviso 0,8 s e atinge r=2,0 (seu golpe perto comum é r=1,6); abafador prepara swipe0,7 s, atinge r=1,9 e mantém aura de bloqueio de técnicas r=3,2. Os glifos no corpo existem; o piso ainda tem primitivas. Se os novos clips de chão forem usados aqui, esses raios não podem ser substituídos pelo padrão ring/radius de outro inimigo.

## Risco técnico importante

`perigo`, `marcador`, `resolverPerigo` e `desenharChao` de dificuldade são funções de closure. Substituir apenas `ToriiDificuldade.perigo`/`.marcador` não intercepta os ataques difíceis/boss que chamam os nomes lexicais. Uma integração precisa usar um ponto efetivo no gerador ou observar a coleção real antes/depois de update, detectando resoluções sem tratar cancelamento como impacto.

`BossGroundFXV1.path` também não pode receber as geometrias de D sem adaptação. Em D, ring/donut usam distância circular; o marcador legado usa elipse apenas visual. Line usa `along > -0,3 && along < len && abs(across) < width/2+0,25`; cross tem comprimento limitado a len e largura `width/2+0,25`; cone aceita arc+0,08. O cross antigo de BossGroundFX se estende até os limites do mapa e usa outra convenção de width. Centro seguro de donut não deve ser preenchido pela textura.

## Portal do primeiro chefe

Prop `silenceGate` em `areas.ruins`, posição(39,17); evento `boss` em(39,18), “FENDA SEM SOM”. O evento exige `G.flags.ruinA` e `ruinB`, chama `startBattle('boss')`, e o pós-chefe usa `G.flags.boss`/`revealAlt`. Preservar essas regras e coordenadas.

A âncora real de drawProp é `((p.x+0,5)*T-camx,(p.y+0,65)*T-camy)`. A base possui um caminho opcional `envSprites.silenceGate`, mas o fallback é composto por blocos53 × 68 e outro conjunto de blocos no estado vencido; não foi encontrado override especializado em CenariosV2.

Brief proposto: estrutura vertical de pedra antiga/raízes e cobre, com fenda escura estreita; dois encaixes de Pulso/Timbre acendem independentemente. Estados: selado sem ambas pedras; pronto após ambas; inerte/esvaziado após chefe. Loop de oito quadros discreto, cerca de 88 × 104 px lógicos na cena e pivô de chão central. A dimensão é alvo de produção, não valor canônico de simulação. Sem partículas opacas nas passagens, sem neon saturado nem arco de trânsito diferente dos portais Torii seguintes. Só substituir `silenceGate`, não `rainTorii` ou o portal do Arauto.

## Regras visuais para a produção

- Retomar as famílias existentes: Viajante âmbar/marfim/cobre; Arauto grafite/interferência rosa dessaturada; Metrônomo latão/ferrugem; Silêncio lavanda escura com rasgos marfim.
- Preparação tem perímetro forte, interior leve e uma leitura temporal única; impacto muda silhueta, sem alterar o instante de dano; resíduo perde densidade e não parece ainda perigoso.
- Leitura também por forma: círculo/onda, cruz/faixas, corredor/setas, coroa com centro vazio, notas de reparo e fissuras de invocação. Não usar a mesma explosão em todo papel.
- Preencher/recortar FX apenas na geometria da simulação. Nenhum golpe visual pode sugerir “salto sobre o efeito” ou área segura falsa.
- Nearest-neighbor e coordenadas inteiras; alpha real; atlas sem sangramento/halo. O sprite deve funcionar na resolução lógica768 × 432 e nos recortes mobile vigentes.
- Não cobrir o jogador, sua vida ou o núcleo dos projéteis com brilho. Efeitos no chão ficam antes dos corpos; emissões/impactos que pertencem à arma podem ficar sobre o corpo com extensão curta.
- Movimento reduzido deve conservar fases estáveis de aviso/impacto, sem animação rápida ou desaparecer com o aviso.
- Registrar dimensões, pivô, frames, duração e integração por família no manifesto. A duração de animação nunca dirige dano/HP.

## Inventário de telas para o coordenador

A direção encaminhou os seguintes pontos, cuja implementação é do coordenador: `endingScreen` e wrapper continuar Cap02; `voiceEnding` efetivo em chapter3_runtime e flow_fixes; `C3.showEnding`/PostGame.showEnding; showDefeat/retry; openParty C3 e fallback C1/C2 (`formation-row10`); mapa/diário por capítulo; loja de fitas; escolha de rota; escolha de gravação; confirmações de Fenda/retomar/suspender/sair; briefing, viagens e placar. `#leituraHistorico` é uma janela separada de `#overlayInner` e requer conferência própria. Lumi, música livre, controles/acessibilidade e editor também entram na matriz. Um painel genérico com uma borda nova não garante que cards, listas e botões internos deixaram o estilo legado.

## Critérios pendentes de aceite

Este documento conclui o mapeamento estático, não a produção. O artista deve retornar clips e capturas reais com cada família em preparação, impacto e resíduo. O coordenador testa dano/tempo/P1-P2/pausa/limpeza. A direção artística comparará silhueta, paleta e legibilidade no enquadramento real; teste físico e conforto humano permanecem separados.

## Revisão preliminar da prancha nova

Inspecionado `assets/combat-readability/v=1/preview.png`, 20 clips ×8 quadros, e o respectivo manifesto. As famílias de cor, os núcleos de projétil e os três estados do portal estão distintos. A estrutura do portal combina pedra, raiz/cobre e uma fenda vertical, coerente com o brief.

**Correção encaminhada ao artista antes de aceite:** vários clips de ataque isolados ainda leem como ícones com pouca ruptura entre preparação e resolução. Os glifos são úteis para identificar a família, mas não devem substituir sozinhos a materialidade dos golpes existentes. Reutilizar texturas `pulse/static/scrap/void` do BossGroundFX como camada recortada na geometria D; manter intensidade discreta no preparo, ruptura clara no quadro 4 e dissipação 5–7. Evitar um único símbolo flutuante no centro de uma área muito grande. Aceite final depende de capturas em escala de gameplay, não de hashes diferentes por pequenos pontos.


## Revisão visual do halo de Ryuchi

Inspecionados `qa/beta-1.17.0/ryuchi_halo_comparativo.png` (quatro direções × quatro quadros, sobre fundo escuro e claro) e `ryuchi_corrida_sem_halo.png` (enquadramento na floresta). A redução do fringe claro é visível no boné, nos ombros e nas extremidades. O símbolo branco do boné e os detalhes internos claros da roupa permanecem. A silhueta e o contorno nativo escuro são preservados nos quadros comparados. **Aceite artístico para esta correção de halo nas imagens fornecidas.** Isso não valida a animação contínua, controles ou gameplay; a evidência é a comparação de frames e a captura do runtime.

O artista também confirmou que o portal usa `nativeSize=128 × 128`, pivô `(64,112)`, estrutura visível aproximada de 95 × 94 px lógicos; os demais FX têm nativos menores. O contrato de movimento reduzido do módulo agora delega a `BossChoreographyV2.reduced()`, incluindo a preferência do sistema. Esses dois pontos aguardam conferência nas capturas finais de integração.


### Segunda revisão da prancha

A prancha atualizada atende às correções isoladas: `cone_iron` agora é um escudo/placa, distinguindo a Muralha do tambor; os clips de chão reúnem energia nos quadros 0–3, rompem no 4 e perdem escala/densidade nos 5–7. Projéteis e sigilos mantêm loops próprios, sem assumir dissipação durante todo o voo. No módulo de integração, a leitura documental confirmou texturas BossGroundFX recortadas na geometria D e distribuição de símbolos ao longo das faixas/coroas. Esses achados encerram a revisão isolada do atlas; o aceite do enquadramento permanece pendente das capturas de integração.


## Primeira revisão das capturas de integração

Inspecionados os quatro estados de portal (`portal_pronto`, `portal_dormindo`, `portal_uma_pedra`, `portal_esvaziado`) e nove capturas de FX em `qa/beta-1.17.0/`. **Aceite de leitura visual ainda não concedido nesta rodada.**

O portal tem escala e ancoragem de objeto físico; a fenda ativa se distingue da inerte. Porém a pedra forma um bloco muito plano ao lado do Torii, da mesa e das colunas do cenário real. Solicitados: juntas irregulares e lascas pequenas, variação de dois ou três tons por pedra, musgo/raízes segmentados, cobre pontual e sombra de contato. Os sigilos precisam mostrar melhor a ativação independente; na primeira captura o encaixe ativo é escuro demais. Não alterar pivô, área de interação nem lógica dos estados.

Nos FX, a geometria finita da cruz e o contorno circular aparecem, mas preparo/donut/mira/feixe têm contraste insuficiente contra terra/água; os glifos ficam muito apagados e a vegetação cobre grande parte deles. A captura `fx_leque_notas.png` não permite localizar claramente os núcleos do leque de três tiros. A leitura posterior do harness esclareceu que os três estão congelados no mesmo ponto, sobre o personagem; isso limita a evidência, e não demonstra um erro no ataque real. Solicitados: suporte escuro sob borda clara, núcleos/glifos de preparo mais opacos com interior ainda translúcido e conferência de escala no quadro lógico. Capturar também num trecho de chão livre para comparar preparação/impacto/resíduo, além de conservar o teste em ambiente com vegetação. Melhorar contraste não deve aumentar a geometria de dano.

O artista informou onze checks de runtime sem erros em `COMBAT_READABILITY_BROWSER.json`; essa verificação técnica não substitui a inspeção de legibilidade descrita acima.


### Limitação das primeiras fixtures de FX

O harness injeta hazards no ponto do jogador `(24,5;22,5)` e mantém o emissor em `(26,5;21,5)`. Isso não representa a origem real dos cones, miras e feixes, que partem do inimigo. A fixture de projétil usa três tiros na mesma posição sem avançar a simulação; as imagens assim não permitem aferir os núcleos separados. Foi solicitado ajustar a evidência: origem no inimigo, direção para o alvo, captura com tiros separados após voo, uma fixture adicional de seis tiros radiais do Espelho e cenário com chão livre. Nenhuma dessas constatações significa que a lógica de produção gera tiros no lugar errado.


## Parecer final desta auditoria — FX

Reinspecionados `fx_preparo.png`, `fx_impacto.png`, `fx_residuo.png`, `fx_donut_centro_seguro.png`, `fx_cruz_finita.png`, `fx_mira_flautim.png`, `fx_feixe_antena.png`, `fx_cone_tambor.png`, `fx_leque_notas.png`, `fx_espelho_seis_notas.png` e `fx_clutter_floresta.png` após a segunda rodada. **Aceite artístico dos FX para legibilidade funcional nas capturas fornecidas.** Os perímetros têm suporte escuro e borda clara, continuam reconhecíveis sobre folhagem, os interiores preservam os corpos e o chão, e os núcleos separados de três e seis projéteis são localizáveis. Mira tracejada, faixa danosa e cone se distinguem por forma. O impacto mostra matéria e identidade de família; o resíduo perde intensidade. A evidência cobre o runtime com fixtures controladas, não uma campanha jogada nem conforto em hardware físico.

A revisão encontrou ainda um traço radial indesejado no donut, causado pela conexão automática entre dois `arc` no mesmo subpath. O artista corrigiu a fonte com dois subpaths fechados e `moveTo(inner*T,0)` antes do círculo interno. A geometria circular e o centro seguro permanecem. **Conferência restante do coordenador:** repetir a captura do donut na build final e verificar a ausência desse traço; esta auditoria não recebeu ainda a imagem posterior a essa correção.

## Direção atual do portal — substitui o brief vertical

O usuário esclareceu expressamente que a fenda/portal deve ficar **no chão**. A proposta vertical deste relatório fica **reprovada e suspensa**, incluindo a tentativa de recompor jambas com as colunas do cenário. Não apresentá-la como sprite final concluído. O coordenador produzirá a nova fenda por imagegen.

Referência pertinente para a nova produção: pedra, musgo e cobre devem preservar a densidade e a materialidade do mundo existente (`assets/prebeta/runtime/environment/ENVIRONMENT_PROPS_4X2.png`, ruínas e props vizinhos), aplicadas como borda baixa de um rasgo horizontal, em perspectiva superior de três quartos. Centro escuro, abertura no plano do piso, sem pórtico vertical. Os dois sigilos de Pulso/Timbre podem ser pedras planas independentes junto à borda, respeitando as flags originais e os três estados. Isso é direção de produção para o pedido atual; dimensões e arte final ainda serão definidas pelo coordenador.

Escopo de escrita da direção nesta tarefa: somente este relatório. Produção, integração, rebuild e regressões pertencem ao coordenador/artista/programador. Nenhuma publicação ou merge foi realizado por esta auditoria.


## Proposta nova de fenda no chão

Inspecionado `assets/portal-chao/v1/fenda_chao_proposta.png`, imagem gerada pelo coordenador: 1774 × 887 px, canal alpha presente, proporção 2:1. **Proposta nova, ainda sem aprovação do usuário.** A inspeção isolada confirma abertura deitada, borda baixa de pedra quebrada com topos e faces em perspectiva superior de três quartos, musgo agrupado, núcleo escuro e acentos violeta/verde localizados nas fissuras. Há volume e materialidade consideravelmente mais próximos das ruínas do que no pórtico vertical anterior.

O artista informou integração do PNG original sem alteração, renderizado em 2 × 1 tiles na camada de chão antes dos atores, com flags/estados e sigilos independentes preservados. O aceite de enquadramento aguarda captura do runtime: verificar contraste e leitura após redução, profundidade do centro, sigilos efetivamente planos e ausência completa da estrutura vertical. A análise isolada da proposta não equivale a aprovação do usuário nem a gameplay testado.


## Última conferência de integração — build 16f62faa

Inspecionados novamente `portal_dormindo.png`, `portal_uma_pedra.png`, `portal_pronto.png`, `portal_esvaziado.png` e `fx_donut_centro_seguro.png` em `qa/beta-1.17.0/`. O donut agora tem dois contornos independentes, sem o raio conector; a pendência visual dos FX está encerrada.

A nova fenda está efetivamente no chão entre a mesa e o Torii, sem qualquer coluna ou pórtico vertical. Pedra, musgo e paleta se integram melhor às ruínas. No footprint de 2 × 1 tiles definido pelo coordenador, a imagem de origem é reduzida a aproximadamente 70 × 30 px na captura de 1280 × 800: a abertura escura continua identificável, mas boa parte da textura e as diferenças de estados/sigilos ficam sutis. Isso é uma limitação material da escala escolhida, comunicada ao coordenador; não foi solicitada alteração do footprint nesta revisão.

A integração está revisável como **nova proposta de fenda no chão**, ainda sem aprovação do usuário. Para a apresentação, mostrar a imagem gerada em tamanho legível junto da captura real do jogo, permitindo avaliar tanto a direção artística quanto sua escala efetiva. Esta revisão confirma aparência nas imagens e encerra a conferência pedida; não declara campanha, interação física ou animação contínua testadas pelo diretor artístico.
