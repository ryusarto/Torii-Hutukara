# Direção e aceite — máscaras, inimigos extras e HUD de chefe v10

26/11/2026. Árvore local `BUILD_INTERFACE_1_17`. Ownership desta direção: somente este relatório; produção/fontes e geração de arte pertencem aos responsáveis. Sem merge/publicação.

**Estado atual — aceite visual integrado concluído em HTTP7dc73a23:** corrida mascarada dos dois principais aceita; seis corpos revistos integralmente após o defeito de extração apontado pelo usuário (320 poses/40 sequências), com escudos completos no runtime corrigido; HUD boss/comuns aceito também na foto nativa final sem sobrepor J/Ataque. As seções anteriores registram o histórico dos achados e não substituem o aceite corretivo final ao fim deste documento. A inspeção desta direção usa imagens e gravações do runtime; não equivale a uma partida humana de campanha.

## Pedido e divisão de responsabilidade

O usuário relatou corrida dos principais mascarados com aparência bugada, seis inimigos extras do Médio ainda como proxies e pediu vida grande exclusiva de boss, mantendo vidas pequenas individuais nos comuns. O programador cuida de corrida/máscara/fase; o artista de corpos próprios e `enemy_variant_art_v2.js`; o coordenador do HUD. Não mudar engine, sprites canônicos de protagonistas, dano, hitboxes, velocidades ou cronômetros de combate.

A implementação em `encontros_v1.js` confirma seis tipos extras habilitados pela configuração de extras de Normal/Médio e Difícil: C1 Tambor/Flautim, C2 Coro/Maestro, C3 Muralha/Antena. Até aqui eles usam `EnemyArtV1.draw` de outra espécie com recoloração, aura e símbolos. O corpo novo precisa substituir efetivamente esse proxy e suas marcas de papel, preservando mecânica e FX reais já existentes.

## Referências inspecionadas nesta rodada

- `assets/enemies/v1/atlas/hush.png` e `compasso.png`: matéria, volume, máscara/tecido/marfim/cobre; não herdar o fundo quadrado de glow desses atlas.
- `game/source/chapter-03/encontros_v1.js`, `run_stride_v1.js`, `enemy_health_v7.js`.
- `qa/beta-1.17.0/masked-runs-v10/{franco,ryuchi}_rows_before.png`, `canonical_masked_run_compare.png`, `masked_phases_before.png`, `masked_metrics_before.json` e os dados completos de `before/REPORT.json` (SHA22bae091).

O aceite v9 anterior cobria runtime completo dos seis sem máscara e observação isolada de linhas mascaradas. Essa evidência não bastava para encerrar especificamente a marcha mascarada em quatro direções; esta rodada amplia essa cobertura.

## Corrida mascarada — gate de marcha

As pranchas e os dados não mostram troca óbvia de masked/unmasked nem índice de linha incorreto. O programador também não reproduziu essa hipótese em P1. Topo estável, índice correto e pé sem penetrar o chão são necessários, mas não garantem uma marcha convincente.

A leitura das 16 fases de Franco mascarado para esquerda mostra longa suspensão na segunda metade. A distância entre o plano do solo (`y=121`) e a extremidade opaca mais baixa por pose é:

`[1, 4, 3, 2, 7, 12, 3, 2, 2, 5, 5, 5, 10, 10, 7, 6] px`

Nas poses9–15, sete poses consecutivas não se aproximam do solo, com intervalos de5–10 px; o pico nessa direção chega a12 px, e para direita chega a14 px. A cabeça permanece quase parada (`topRange=1`). Isso explica uma sensação de flutuação/saltos mesmo com fase e ancoragem corretas. Trata-se de um achado de apresentação/marcha da combinação fonte+registro, não de prova de direção errada. A extremidade opaca é um proxy, não uma marca anatômica: a inspeção da prancha sustenta que os apoios inferiores estão levantados nessas fases.

A severidade não é uniforme: Ryuchi mascarado para direita tem pico7 px e apenas duas poses com intervalo maior que3 px; para frente, no máximo5 px. Portanto não aplicar um deslocamento universal aos dois personagens/às oito linhas nem alegar que o bug real de nascimento de P2 explica todo o relato de P1.

Encaminhado ao programador um A/B de runtime com as oito poses mascaradas canônicas v5 já existentes, conservando fase por distância e pivô/collider, antes de gerar qualquer imagem de corrida nova. Outra alternativa experimental é mesclar registro de cabeça e apoio para reduzir o voo prolongado; rejeitar se introduzir novos estalos de cabeça ou resize. Nenhuma dessas alternativas está aprovada sem comparação real. As fontes e a corrida sem máscara previamente aceita devem ser preservadas.

Critérios observáveis:

- Dois apoios alternados e aproximação clara do solo em cada meio ciclo; voo breve, com chegada ao próximo apoio, sem um segmento longo de pernas recolhidas que desliza sobre a sombra.
- Máscara, óculos, espinhos, ombreiras e roupa mantêm escala/orientação. Não redesenhar o protagonista ou trocar máscara no meio de um ciclo.
- Sequência inteira em quatro direções, P1/P2, frio/quente, andar→correr→parar, colisão, primeira aquisição e equipar/desequipar máscara.
- Mesmo eixo e fase em corpo/cabeça/pés; 15→0 ou7→0 contínuo. Não contar warp/spawn como passo. Não alterar `G.x/y`, colisão ou sombra para encobrir a arte.
- Aceite por comparação do movimento no mundo com solo/sombra; contagem de poses, `badRoute=0` ou topo estável isoladamente não bastam.

## Corpos próprios dos seis inimigos

A linguagem continua a dos inimigos/chefes reais: tecido/void violeta, osso/marfim, ferragens de cobre e materiais locais; volume e clusters de pixel coerentes com o enquadramento 2D de16 bits. Os novos corpos são criaturas/constructos, portanto seus instrumentos físicos são parte da silhueta; não confundir isso com o problema anterior de emblemas/props duplicados nos FX dos heróis.

| Tipo | Silhueta e material | Leitura de ação |
| --- | --- | --- |
| `tambor_escudo` | Baixo e redondo, pele/rim de tambor com cobre, corpo mais leve | Frente protegida; preparo contrai/arma; pancada abre e expõe o corpo. |
| `muralha_estatica` | Baixa, larga e pesada, placa retangular de ferro/ferrugem, dois apoios | Peso antes da investida; placa e corpo avançam; recuperação/tontura abre a defesa. |
| `flautim_atirador` | Estreito, flauta comprida e manto curvado, acento verde contido | Direção da flauta e emissão antes do tiro; sem retículo de UI desenhado no corpo. |
| `antena_feedback` | Alta, haste/garfo industrial, núcleo teal/azul | Carregamento no emissor e feixe dirigido; não parecer apenas um Compasso recolorido. |
| `coro_curador` | Curto, trio/agrupamento de bocas ou sinos, verde contido | Canto/reparo por gesto e ressonância; interrupção retorna ao corpo ferido, sem campo hostil falso. |
| `maestro_invocador` | Esguio, casaco angular e batuta, lavanda fraturada | Batuta sobe para chamar; descarga e recuperação próprias, vulnerabilidade visível após interrupção. |

Produzir idle/preparo/ataque/ferido com oito fases reais por estado. Um hash distinto causado por ruído não conta como animação. Pivô de chão e escala consistentes; rosto/emissor/arma permanecem legíveis. Não esconder falta de ação sob piscadas de alpha ou glifos flutuantes.

Para Tambor/Muralha, usar corpos verticais com facings próprios. Não girar o humanoide inteiro no plano do chão para seguir `e.face`. Principal frontal de três quartos, perfil e costas; direita pode espelhar esquerda apenas se o novo desenho for bilateral, com escudo central e sem inscrições assimétricas. Se a identidade exigir assimetria, gerar os quatro facings completos. Os quatro outros tipos podem manter billboard de três quartos/espelhamento lateral coerente com os inimigos existentes.

Critérios de transparência: fontes preservadas; derivados RGBA com margem alfa0 em todas as células; sem placa/fundo quadrado, moldura, glow cortado nos limites, texto ou sangramento entre frames. O fundo quadrado dos atlas de referência não deve ser copiado. Verificar sobre terra, pedra, fundo claro/escuro e vegetação; o novo corpo deve substituir a aura/proxy anterior no caminho efetivo.

O renderer deve acompanhar preparação, descarga real e ferimento/interrupção nos campos existentes, respeitando cancelamento/morte/pausa. Os estados visuais não criam dano nem dirigem o tempo de ataque. Health/headHeight precisa vir do manifesto/silhueta nova para não colocar a vida dentro de antena, batuta ou escudo.

## HUD de chefe

Direção: uma única barra grande fixa para o boss, com nome e preenchimento bem legível; comuns mantêm barras pequenas acima de cada cabeça. Não repetir a barra do boss na cabeça nem transformar um comum em barra grande por ter `maxhp` alto.

O coordenador está implementando painel inferior central com limite de620 px e barra de14–15 px, verificando obstáculos reais (ações/fita/controles móveis reposicionados). Aceite depende de reservar uma faixa acima/entre os controles; um bottom fixo sem considerar J/Z/X/K não atende. Mobile precisa compactação e reposicionamento quando o espaço horizontal não basta.

Texto: nome + barra são suficientes. Evitar acumular fase, fração, porcentagem e HP simultaneamente. HP/max pode permanecer discreto no PC; em mobile priorizar nome/barra quando houver aperto. Não criar nova tipografia fora do sistema UI7 aprovado.

Cobertura de revisão: boss e comuns juntos; quatro chefes e nomes longos; entrada, dano, fim/morte/pausa/diálogo/troca de área; PC e mobile vertical/horizontal; controles em posição padrão e reposicionados; boss fora do enquadramento durante combate. A barra fixa continua informando o chefe ativo sem sequestrar o espaço do mapa ou bloquear comandos.

## Estado do aceite

Pendentes: comparação da marcha mascarada no runtime após decisão do programador; fontes/derivados dedicados dos seis inimigos e suas ações em contexto; capturas do HUD boss com comuns e controles. Nenhuma produção foi editada por esta direção.


## Gate comparativo da corrida mascarada

Recebido A/B de runtime em `masked_runs_before.gif` e `masked_runs_canonical.gif`, ambos1280×320,60 quadros a30 ms (1,8 s), mais `masked_phases_canonical.png`. A variante canônica usa os oito desenhos v5 já existentes nos pares de v7_run; o responsável informou comparação RGBA idêntica. É uma fixture de seleção, não ainda prova do caminho de produção integrado.

Inspecionadas as oito combinações herói/direção na prancha e a sequência inteira de60 quadros dos perfis esquerdo/direito dos dois personagens. **Gate artístico aprovado para escolher os oito canônicos na corrida mascarada de Franco e Ryuchi.** O voo longo de Franco desaparece, os apoios se aproximam do solo a cada meio ciclo e o conjunto ganha peso. Ryuchi esquerdo/direito também fica mais assentado e consistente com idle/caminhada.

O topo da máscara varia entre poses por espinhos e inclinação; o core/torso comprime junto da passada, sem mudança de escala ou identidade. Portanto não tentar congelar o extremo de cada espinho para otimizar uma métrica que eliminaria o peso do corpo. A comparação favorece a versão canônica mesmo com maior oscilação do topo que na cabeça artificialmente fixa do v8.

Escolha autorizada pelo gate: somente corrida mascarada dos dois principais; unmasked/v8 e demais integrantes permanecem preservados, fase continua por distância e nenhum PNG novo é necessário. **Aceite final dessa frente depende da seleção real na build integrada**, incluindo ganhar/equipar máscara, P1/P2 e transições, sem `bitmap=null` de teste como condição artificial.

## Aceite visual do HUD de chefe

Inspecionados `qa/beta-1.17.0/chefe_vida_pc.png`, `chefe_vida_mobile.png` e `chefe_vida_landscape.png`. **Layout aprovado nas três configurações mostradas.** PC usa intervalo livre entre fita e ações; vertical mantém o painel no mundo acima da área dos controles; horizontal conserva respiro para analógico e botões. Nome, HP discreto e preenchimento comunicam o estado sem precisar fase/porcentagem extra. Não se vê barra duplicada sobre a cabeça do boss.

A fixture apresenta um nome/ator de chefe em área artificial de floresta; ela valida enquadramento do HUD e não é evidência de capítulo3 jogado. O coordenador informou21 checks, incluindo exclusividade de boss e preservação das barras dos comuns. A direção não executou esse suite; a leitura das barras acima dos seis novos corpos ainda será feita com as capturas da integração artística.


## Entrega parcial para liberar revisão técnica

O coordenador confirmou fonte do HUD congelada e21 checks em três viewports; também corrigiu o nome de barra para alias nativo do tipo de encontro e acrescentou suporte opcional a head metadata. O aceite visual do HUD nas três capturas está registrado acima. A escolha das oito poses canônicas mascaradas foi aprovada pelo A/B; ainda conferir o caminho integrado de ganho/equipar máscara.

As dez folhas originais dos seis inimigos, incluindo facings dos escudos, foram geradas pelo artista e estão sendo importadas. **Ainda não há aceite desta direção para esses corpos.** A próxima rodada deve comparar as pranchas, snapshots e animações em contexto após integração.

Achado preventivo encaminhado: retornar antes de aura/proxy em `encontros_v1.js` não impede automaticamente o glifo de cast de40 px do wrapper externo `CombatReadabilityV1.actor`. Avaliar duplicação com o instrumento/corpo novo; se redundante, usar um guard de suporte apenas no glifo corporal. Telegraphs de chão, projéteis, impactos e bursts permanecem preservados. Não alterar mecânica para resolver sobreposição.

A direção encerra esta rodada parcial a pedido do coordenador para liberar a revisão técnica independente. Somente este relatório foi escrito. Os próximos aceites serão retomados quando chegarem as evidências dos corpos novos e da seleção mascarada integrada; não apresentar a aprovação do A/B/atlas como aprovação final de tudo.


## Aceite da corrida mascarada integrada — HTTP05514491

Recebida a evidência de produção `masked_runs_after.gif`, `masked_phases_after.png`, `mask_equip_first_run.gif` e `after/equip_http_ryuchi_warm_during_dialogue.png`. A direção comparou os60 quadros decodificados da faixa masked do GIF integrado contra o A/B canônico: os60 são pixel-idênticos. Inspecionou também as32 imagens da primeira corrida após equipar e a captura do callback entre falas, já com ambos os principais mascarados.

**Aceite integrado da marcha mascarada concluído.** A seleção usa os oito canônicos sem a condição artificial `bitmap=null` da fixture, preservando o resultado aprovado: apoios mais próximos do chão, sem o voo prolongado do v8. O programador também corrigiu a pose congelada de diálogo que mantinha linha sem máscara após aquisição, e o primeiro sincronismo de P2 não conta nascimento como passo. O responsável informou77 checks e quatro equipagens HTTP aprovados; a inspeção visual e comparação dos GIFs desta direção complementam essa validação técnica.

A oscilação de espinhos/pose original permanece, acompanhando compressão e inclinação do corpo; não representa resize ou troca de identidade. Não gerar novos frames de corrida nesta rodada.

## Revisão inicial dos seis corpos integrados

Inspecionados `assets/enemies/variants-v2/contact-sheet.png` e capturas reais de idle/preparo em floresta e ruínas dos seis tipos, além de perfil e costas dos dois escudos. **Leitura de forma/material e integração estática aprovada.** Tambor e Muralha se distinguem por circular/leve versus retangular/pesado; Flautim é estreito, Coro tem tríade, Maestro é fino/angular e Antena é alta com emissor próprio. Cobre, tecido/void púrpura, marfim e ferrugem se relacionam aos materiais existentes.

Os facings dos escudos mantêm corpo ereto e escudo físico na frente correta; costas expostas são reconhecíveis. Não se veem placas de fundo, glifos antigos substituindo corpo ou círculos artificiais de escudo nas capturas. As barras pequenas aparecem acima do volume, incluindo antena/batuta, sem se tornarem barras grandes de boss.

Verificação independente executada nos seis PNGs exportados:320 células armazenadas, todas com faixa de10 px totalmente alfa0 e zero pixels de resíduo alfa1–8. Os escudos armazenam três facings autorais e espelham o perfil para esquerda, portanto não duplicam a quarta vista em memória. Fontes originais preservadas.

**Pendente apenas o aceite temporal dos inimigos novos e a foto nativa boss+comum:** o artista está produzindo GIFs de preparação/ataque/ferimento reais e uma captura do Viajante com Tambor no Médio. Essa conferência encerrará a leitura da ação e da coexistência HUD boss/barra pequena em situação nativa, sem confundir fixtures de outros chefes em floresta com campanha jogada.


## Aceite temporal dos seis inimigos

Inspecionadas integralmente as seis sequências `assets/enemies/variants-v2/preview/*-runtime.gif`, montadas a partir de40 imagens de evolução real em4 s por tipo (a otimização GIF pode unir quadros idênticos). A direção revisou todos os quadros armazenados, não somente o primeiro. **Aceite temporal dos corpos concluído.**

Preparo, descarga/ataque, abertura e ferimento mudam a pose do corpo e o instrumento físico. Tambor/Muralha mantêm identidade e orientação sem girar o corpo ereto; o escudo se desloca/abre. Flautim aproxima o instrumento da emissão, Antena carrega o núcleo, Coro canaliza com sua tríade e Maestro conduz a chamada. Ferimento/interrupção e recuperação são distinguíveis. Barras pequenas acompanham os volumes novos, sem proporção de boss. Os avisos geométricos de chão continuam como sinais funcionais de mecânica, não como molduras do PNG.

`BROWSER.json` final foi conferido: dez checks, `errors=[]`, sem falha, incluindo os caminhos efetivos de preparo→ataque→abertura, cancelamento e ausência do glifo corporal antigo quando o atlas está pronto. `GIF.json` confirma as seis sequências e a montagem conjunta. Esses checks foram executados pelo responsável; a direção fez a inspeção visual e conferência dos artefatos.

## Foto nativa boss + comum — conferência final de layout

A foto `native_c1_medium_viajante_and_shield.png` mostra o Viajante Mascarado de C1 com Tambor novo e comuns: nome/ator de boss coerentes, uma barra fixa grande e barras pequenas distintas nos inimigos normais, sem barra sobre a cabeça do boss. Porém, na primeira versão recebida dessa foto, a barra fixa terminava emx≈845 enquanto J/Ataque começava emx≈775 na mesma faixa vertical, encobrindo parte inferior do botão.

O artista já estava ajustando refresh de HUD/toast dessa fixture. Foi solicitado apenas estabilizar `UI7Actions` e sincronizar a vida antes de salvar novamente, sem redesign ou mudança de mecânica. As três capturas anteriores do HUD estavam corretas. Essa constatação é da evidência nativa recebida; ainda não demonstra falha persistente do layout após estabilização. O aceite geral do HUD aguarda somente a imagem nativa atualizada sem a sobreposição.


## Bloqueio visual reportado pelo usuário — corpos reabertos

O usuário apresentou screenshot de Tambor com escudo interrompido por um corte vertical e uma lasca solta à esquerda. Não é fragmentação legítima da animação: uma parte da pose vizinha entrou na célula seguinte. A inspeção inicial desta direção não examinou suficientemente todos os frames internos; guardalpha detecta margem externa, mas não detecta um personagem que já foi cortado no crop e depois reduzido para dentro da margem. **Aprovação anterior dos corpos suspensa até revisão integral e correção.**

Causa localizada: `production/import_enemy_variants_v2.py` usa `raw.crop((round(col*w/8), round(row*h/4), round((col+1)*w/8), round((row+1)*h/4)))`. Nem todas as poses geradas respeitam essas fronteiras. A inspeção global confirmou, entre outros casos, `source/tambor_escudo_down.png`, estado `hurt`, pose2, e `source/tambor_escudo_right.png`, estado `attack`, poses1–3. O pior caso é `right/attack/2`, cujo corpo sólido cruza21 px além da célula nominal; o crop corta o próprio escudo e incorpora sua continuação no próximo quadro. Depois o shrink uniforme cria guard10 externo, escondendo o defeito dos testes de borda.

Requisito de correção encaminhado: extrair e registrar cada corpo/instrumento completo por limites reais/componentes e associação explícita de frame, preservando todas as partes da mesma pose, removendo somente contaminação identificada de outra pose. Não apagar genericamente lascas pequenas nem aumentar margem sem recuperar a geometria. Se a fonte original já cortar uma extremidade no limite da imagem ou fundir personagens, essa pose precisa reparo/regeneração em vez de reconstrução inventada pelo importer. Fontes originais preservadas.


## Auditoria integral e reparo da extração — HTTP7dc73a23

Inspecionadas as dez fontes completas em pranchas de32 poses e as320 células corrigidas em dez pranchas ampliadas, cobrindo40 sequências de oito poses. A auditoria independente de componentes alfa>96 localizou32 corpos principais por fonte, todos contidos no canvas original. O defeito era recuperável na extração; não havia motivo para redesenhar os originais.

Mapa de cruzamentos do corpo sólido nas fronteiras antigas (índices de frame a partir de0):

| Fonte/facing | Estado | Poses afetadas |
| --- | --- | --- |
| Tambor down | hurt | 2 |
| Tambor right | attack | 1,2,3 (até21 px) |
| Tambor up | hurt | 3 |
| Muralha right | attack | 2,3,4 |
| Muralha right | hurt | 1,2,3,4 |
| Muralha up | attack | 4 |
| Muralha up | hurt | 1,2,3,4 |

São17 poses com cruzamento do corpo mais opaco. O importador registra22 cruzamentos contando também bordas alfa>8; os limiares explicam a diferença. A ocorrência num quadro também contaminava o vizinho, portanto o total de células visualmente defeituosas não se limita a17.

O reparo do artista segmenta a imagem inteira antes de extrair poses. Verificada a correspondência visual de corpo, escudo, arma, dedos, pés e extremidades com os originais: **aceite estático integral refeito**, sem cortes retos ou restos anatômicos de outra pose observados. Os sopros do Flautim, partículas verdes do Coro e notas do Maestro são elementos intencionais da fonte e continuam presentes. A comprovação de guardalpha continua útil, mas é complementar à inspeção anatômica.

Registro conferido independentemente por manifesto novo/arquivo anterior: pivô nominal de pé na fonte tem delta[0,0] nas dez vistas, descontado o pad do novo canvas. Pivô de destino permanece[64,104]. O encaixe recupera toda a extensão com um fator fixo por tipo: Tambor reduz15,9% em relação ao export cortado anterior, Muralha1,2%; quatro demais tipos mantêm escala. Não existe normalização de tamanho por pose. A escala aparente do Tambor e o ciclo de todos os facings precisam da conferência em contexto após o rebuild; a aprovação integrada permanece pendente nesse ponto.

Evidências estáveis: `assets/enemies/variants-v2/SEGMENTATION_REPAIR.png`, seis atlas corrigidos e `manifest.json`. Ponto de recuperação do antes em `assets/enemies/variants-v2/history/uniform-grid-20261126/`, incluindo manifesto e importador. Diagnóstico independente temporário em `/private/tmp/torii-v10-direction/component-audit/audit.json`; pranchas completas antes em `component-audit/` e depois em `repaired/`. A direção não alterou assets nem produção.


## Aceite corretivo final dos corpos e foto nativa — HTTP7dc73a23

Conferidos os40 arquivos de `preview/clips/`: todos decodificam oito quadros, total320 poses, com1.120 ms por loop. A cobertura visual foi feita por decomposição completa em pranchas ampliadas, incluindo as transições7→0 e os três facings autorais de ambos os escudos. Esses arquivos são playback de atlas para inspeção de arte; não são40 testes de gameplay nem evidência de que o cronômetro da AI percorre todas as oito fases em cada ação.

Inspecionadas também as seis gravações novas `preview/*-runtime.gif`, integralmente por quadros com marcação temporal. Cada uma representa2 s de atualização real da AI capturados em40 passos de50 ms e apresentados em4 s para inspeção (otimização GIF pode unir quadros repetidos). As poses de preparo, ataque, abertura e ferimento efetivamente renderizadas mantêm os escudos/instrumentos completos; não reaparecem a borda reta de recorte ou partes de outro personagem. Forma, pivô e peso continuam consistentes. Os avisos geométricos de chão, projéteis e impactos existentes permanecem independentes dos novos corpos; este aceite não afirma que foram gerados seis conjuntos inteiramente exclusivos de FX.

Na foto nativa C1 final, Tambor ocupa aproximadamente60 px de altura diante de protagonistas com cerca de85 px. **Escala aparente aceita:** ele permanece uma criatura baixa e compacta, com tambor circular e mão/baqueta reconhecíveis, enquanto Muralha conserva corpo largo e escudo retangular pesado. O fator de encaixe fixo recupera o escudo inteiro sem criar pulsação de escala entre quadros. Não aumentar partes por frame para compensar a diferença.

A foto `native_c1_medium_viajante_and_shield.png` atualizada também fecha o aceite de convivência do HUD: a barra de850 HP de O Viajante Mascarado termina antes de J/Ataque; a barra pequena do Tambor fica acima do corpo e não substitui a barra exclusiva de boss. Nome/ator/contexto são coerentes com o encontro nativo de C1, sem apresentar fixture de capítulo3 como campanha.

`BROWSER.json` corrigido registra dez checks aprovados e `errors=[]`, com método explicitamente headless/HTTP. A direção conferiu os artefatos e a imagem; os checks de execução foram realizados pelo responsável. **Aceite artístico dos corpos restabelecido após correção integral e aceite visual do HUD nativo concluído. Sem achado visual material restante no escopo desta rodada.** Fontes originais e ponto de recuperação foram preservados. Somente este relatório foi alterado pela direção.
