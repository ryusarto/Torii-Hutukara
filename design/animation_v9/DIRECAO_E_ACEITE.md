# Direção e aceite — animação v9

25/11/2026. Revisão local de Torii & Hutukara, `BUILD_INTERFACE_1_17`. A direção tem escrita apenas neste relatório; fontes, runtime, assets e builds pertencem aos demais responsáveis. Nenhum merge/publicação.

**Estado final:** locomoção e halo aprovados visualmente nas sequências de runtime SHA2837e87b, preservando poses originais e sua pequena suspensão estilizada; nenhuma geração adicional de corrida necessária nesta rodada. FX v3 aprovados também no runtime final22bae091, após J34 e correção do impacto aliado legado, sem molduras/sangramento/props duplicados visíveis. O bloqueio temporário ENOSPC foi resolvido pelo coordenador; não permanece pendência desta direção. Os detalhes abaixo distinguem diagnóstico, propostas e evidência de cada etapa.

## Pedido atual e decisões

O usuário relatou ataques dos personagens poluídos/contornados, halo e direção incorreta de Ryuchi sem máscara, e corrida dos seis personagens com aspecto de saltos. A referência positiva são as animações dos chefes. O steering posterior pede verificar o código e o movimento completo antes de concluir que faltam sprites. Portanto, **a geração de novos intermediários de corrida está suspensa para diagnóstico**; o alvo de 32 só faria sentido se houver necessidade comprovada e poses intermediárias autênticas. Novos FX de ataque continuam autorizados.

Preservar os sprites e a identidade canônica de `franco`, `ryuchi`, `alt`, `katana`, `synth` e `percussion`, incluindo variantes, instrumentos, máscara, cabelo/boné, proporções e detalhes da roupa. Não redesenhar personagens para corrigir alinhamento. Não alterar colisão, velocidades, dano ou tempos do combate.

## Referências efetivamente inspecionadas

- `assets/protagonistas/v8-corrida/preview_*.png` dos seis personagens: 16 poses por direção/variante, inspecionadas visualmente.
- `assets/protagonistas/v8-corrida/README.md`, `manifest.json`, `validation.json` e `tools/pack.py`.
- `game/source/chapter-03/run_stride_v1.js`, `hero_attack_fx.js`, `hero_attack_body.js`.
- Os cinco atlas `assets/hero-attack-fx/v2/atlas/{franco,ryuchi,katana,synth,percussion}.png`, o contato corporal `hero-body/v1/atlas/ryuchi_unmasked.png` e `assets/boss-ground-fx/v1/atlas/pulse.png`.
- Métricas de alfa dos seis atlas v8, 16 quadros por linha, via Pillow/NumPy do ambiente local de QA.

Essas evidências são documentais e visuais em atlas. Não são prova de campanha jogada nem de animação contínua já aprovada. O aceite de v9 dependerá das capturas/loops do runtime final.

## Diagnóstico da corrida v8

O registro atual usa `anchor_y=224-lift-p.height`, com `lift=[0,0,0,1,3,5,5,2]` repetido nas duas metades do ciclo. Cada pose é alinhada pelo limite inferior de seu próprio bbox e ainda recebe elevação artificial, embora a geração já desenhe contato/voo. A altura muda com a extensão da perna; assim, alinhar pelo extremo inferior move torso e cabeça. Isso pode produzir saltos sem ser falta de frames.

As métricas abaixo usam a região superior de 35 px como **proxy**, não como marco anatômico exato. O display usa escala 88/256.

| Atlas/linha | Altura da silhueta na fonte | Variação vertical do centro superior | Maior salto entre vizinhos, incluindo ciclo |
| --- | --- | --- | --- |
| Ryuchi sem máscara, esquerda | 160–201 px | 39,1 px (~13,4 lógicos) | 21,9 px (~7,5 lógicos) |
| Franco sem máscara, frente | 159–194 px | 32,6 px (~11,2 lógicos) | 24,8 px (~8,5 lógicos) |
| Percussion sem máscara, costas | 150–187 px | 32,7 px (~11,2 lógicos) | 31,0 px (~10,7 lógicos) |
| Synth com máscara, esquerda | 170–213 px | 44,7 px (~15,4 lógicos) | 28,0 px (~9,6 lógicos) |

As diferenças de altura podem conter articulação de corrida legítima; as medidas não demonstram sozinhas deformação anatômica. Entretanto, o registro inferior transforma essas diferenças em deslocamento do corpo inteiro. A primeira correção a experimentar é registro por marcos estáveis de pelve/torso, escala fixa por sequência e remoção do lift duplicado, usando metadados por pose/direção/variante. Não congelar toda a cabeça artificialmente: uma oscilação curta e suave deve permanecer.

Nos seis contatos, a altura aparente de cabeça/busto muda bastante enquanto as fases inferiores variam; isso sustenta fazer o A/B de registro antes de atribuir o problema à quantidade de desenhos. Os instrumentos/acessórios também variam nas extremidades, logo o bbox total não é um marco de pelve confiável.

O código já avança a fase por distância realmente percorrida após colisão. Isso deve ser preservado: parede, pausa, teleporte e dash não devem simular passos inexistentes. `state.moveDir` é calculado por movimento pós-colisão, mas a corrida normal desenha `art.pose(...).direction`; a composição do arqueiro usa `state.moveDir` para as pernas. O programador precisa verificar divergência entre direção de pose/input e trajetória efetiva, com tolerância nas diagonais, sem simples espelhamento global.

## Aceite observável da corrida e colisão

1. Cada meio ciclo deve mostrar contato, aceitação do peso/compressão, passagem, impulso e voo breve; dois apoios alternados por ciclo. Sem repetir um contato no meio do arco ou congelar ambos os pés em voo.
2. Marco da pelve/torso deve seguir trajetória contínua. Alvo de revisão: oscilação total de cerca de 1–2 px lógicos, sem saltos entre vizinhos provocados pelo bbox. Esse é um critério artístico inicial, não regra nova de simulação.
3. Pé de apoio deve permanecer coerente com o chão em coordenadas do mundo durante sua janela de contato. O deslocamento local para trás que compensa o avanço é correto. A tolerância visual de cerca de 2 px se refere a estalo residual no mundo, não a limitar a passada entre poses.
4. Sombra e posição de simulação continuam estáveis. Não mover `G.x/y`, colliders ou câmera para seguir a arte. Não ancorar ambos os pés ao mesmo tempo nem dimensionar cada frame individualmente.
5. Verificar transição 15→0 e todas as vizinhas; observar em câmera lenta e em velocidade real. Comparar A/B registro antigo e novo com as mesmas 16 poses antes de gerar qualquer imagem adicional.
6. Comparar frente/esquerda/costas/direita, diagonais, mudança rápida, parar/recomeçar, parede, saída de colisão e caminhada→corrida→ataque. Cobrir P1/P2/follower e variantes com/sem máscara. A direção não pode oscilar por ruído numérico quando dx≈dy.
7. Cabeça, máscara, boné, roupa, arma/instrumento e silhueta não podem mudar de identidade. Se o alinhamento corrigido ainda expuser membros/tamanho inconsistentes, registrar os frames específicos; offsets globais não corrigem esse defeito.

## Se ainda forem necessários intermediários

Não tratar 32 como aprovação automática. Um intermediário real para cada intervalo de 16 poses, incluindo 15→0, deve alterar articulação de membros mantendo identidade e pivô; não aceitar duplicação, deslocamento global, crossfade ou borrão de duas poses.

Layout prático proposto: uma folha por herói, variante e direção, com oito intermediários em grade 4×2 e célula 256×256. Duas folhas cobrem os 16 intervalos. Referência separada contém pares endpoint A/B identificados; saída contém apenas a pose intermediária correspondente, sem textos ou marcadores. Pivô de chão nominal (128,224), mesma escala e iluminação, fundo transparente real, nearest no empacotamento.

Prompt-base: “Use exatamente o personagem das referências. Desenhe somente a fase anatômica intermediária de cada par A/B, mantendo rosto, cabelo/boné, máscara, traje, arma/instrumento, escala, densidade de pixels e orientação. Pelve contínua, pé de apoio coerente com a mesma linha de chão, oscilação curta do torso; contato→compressão→passagem→impulso→voo breve→contato oposto. Sem salto do corpo inteiro, sem nova roupa/rosto, sem trocar a arma de mão, sem membros duplicados, sem ghost/crossfade, sem borrão, sem perspectiva/câmera diferentes.”

É preferível conservar 16 poses bem registradas a integrar 32 poses com mudança de identidade. Essa proposta de geração não está ativa enquanto o diagnóstico de código não terminar.

## FX dos personagens: linguagem e limites

Os cinco atlas v2 mostram também o problema de props/emblemas inteiros: Franco tem pino, amplificador e coração; Ryuchi repete arma inteira ornamentada junto de vários arcos/diamantes; Percussion repete tambor completo; Katana tem medalhão de guarda; Synth usa molduras e terminais de cabo. Não se trata somente de partículas em excesso. A linguagem fica próxima de ícones de menu desenhados sobre o mapa, em vez da consequência sonora/física do gesto. A arma já faz parte da pose do corpo; a sobreposição de silhuetas e contornos aumenta a massa visual. No runtime ainda existem detalhes vetoriais com três traços sobrepostos em `bassWave` e dois em contatos de `drawV2`. O novo bitmap sozinho não remove essa duplicação: integração precisa revisar as camadas realmente desenhadas.

Retomar dos chefes a **matéria e a temporalidade**: concentração curta de energia, ruptura assimétrica, fragmentação com vazios e dissipação. Não copiar o tamanho da explosão de um chefe para uma ação comum. Preferir um gesto principal estreito e aberto, com dois a quatro fragmentos de apoio no pico; rosto, mãos, arma e inimigo continuam localizáveis. A textura deve ter clusters de pixels e luz concentrada, evitando tanto superfícies compactas quanto ícones genéricos planos.

Identidades por família propostas para comparação: Franco vibração quente de corda; Ryuchi corte aberto azul/marfim; Katana fio/vapor curto; Synth dois ou três blocos/filamentos sonoros; Percussion onda quebrada/poeira; Arqueiro núcleo/projétil com trajetória limpa. Paletas de referência já implementadas: Franco âmbar/cobre; Ryuchi azul; Katana violeta/marfim; Synth verde-água com acentos magenta/âmbar; Percussion coral/cobre. Conferir cada uma com as ações reais antes de produzir. Não redesenhar a arma física como parte obrigatória do FX.

Negativos de geração e integração: sem personagem, arma completa, escudo/placa, aro fechado de 360°, moldura grossa, contorno preto espesso em torno de toda a massa, chuva uniforme de partículas ou múltiplos flashes sobrepostos. Esses limites não proíbem uma sombra interna discreta na matéria nem o contorno nativo do corpo.

Layout preferido: um clip por linha, oito fases da esquerda para a direita, pivô constante; se uma folha 6×8 não preservar ordem, gerar um clip por folha 4×2 e empacotar. Os seis clips existentes por personagem permanecem mapeados às mesmas ações, eventos e durações. Não derivar dano da animação.

## Aceite observável dos FX

- Comparar atlas novo com um boss de referência e com o corpo real do herói, em escala do jogo. O espaço transparente deve predominar no bbox; área alfa e fragmentos servem como diagnóstico, não aprovação automática.
- Preparo, pico e resíduo precisam mudar de silhueta. O pico acompanha o evento já existente; o resíduo perde densidade e não parece um segundo golpe.
- Em quatro direções, rosto/mãos/arma e a borda do alvo atingido permanecem identificáveis. Nenhuma moldura/arma duplicada envolvendo o personagem.
- Ação comum, skill e assinatura devem ter diferenças legíveis de gesto e escala; evitar que tudo seja um círculo ou a mesma explosão recolorida.
- Em dois jogadores e com outros inimigos próximos, ainda identificar emissor e alvo sem clarões opacos. Fundo claro, chão escuro e vegetação entram na comparação.
- Movimento reduzido conserva sinal estável; pausa congela; cancelamento, morte e troca de área não produzem impacto falso.
- Rodar ações completas e combos, incluindo ataque durante movimento. Capturas do pico isoladas não bastam para avaliar poluição durante uma sequência.

## Halo e direção de Ryuchi

O programador informou que walk v7 e idle v5 também têm matte neutro semitransparente externo; a correção anterior cobria apenas run. A revisão deve abranger idle/walk/run, quatro direções e transições, sobre fundos claro/escuro/terra/floresta. Preservar alfa, opacos, detalhes brancos internos, roupas e máscara; remover apenas contaminação da borda confirmada.

Para direção, usar a trajetória pós-colisão como evidência e comparar com pose/arma em vez de aplicar espelhamento sem verificar. Registrar alternância por dx≈dy, input mantido contra parede e release. Fase de walk/run/fallback deve ser contínua, sem saltar de orientação por um frame.

## Estado do aceite

Diagnóstico e brief concluídos; **v9 ainda não aprovada**. Pendentes: A/B de registro por marcos e loops de corrida no runtime, comparação do halo/direção corrigidos, folhas novas de FX e ações completas em contexto. A direção não editou produção nem gerou novos protagonistas.


## Primeira revisão do registro v9

O coordenador rejeitou o experimento de normalização de escala por frame, pois causava resize artificial. A versão adotada conserva escala1 e os PNGs originais, remove lift duplicado e usa registro translacional de topo/centro de cabeça com oscilação curta de 0,65 px. Isso é uma alternativa à sugestão inicial de marco de pelve e deve ser avaliado pelo resultado, não pelo nome do marco.

Inspecionados os comparativos `assets/protagonistas/v9-registro/previews/`: `ryuchi_registration_0/1`, `franco_registration_7`, `alt_registration_1`, `katana_registration_3`, `synth_registration_5`, `percussion_registration_2` e `ryuchi_walkRegistration_1`. O A/B da corrida reduz claramente estalos de cabeça/busto e conserva escala e identidade. O preview de caminhada ainda mostra as fontes alternadas de proporções distintas; ele não demonstra o `walkFrameMap` aplicado no runtime.

O coordenador registrou que apenas a caminhada de Ryuchi sem máscara para esquerda usará os oito quadros originais pares, preservando os demais mapas. O programador verificará a continuidade de fase normalizada ao selecionar oito em vez de 16, sem mudar a velocidade da passada. Não foram geradas poses adicionais de corrida.

**Pendência de apoio:** `measurements.json` mostra topo estável, porém a faixa vertical das extremidades inferiores após registro é de cerca de 10–12 px lógicos em várias linhas. Isso pode ser voo/perna recolhida legítimos; não prova por si apoio errado. É obrigatório observar se o pé de apoio chega ao chão no contato e não atravessa abaixo do plano. Cabeça estável isoladamente não conclui o aceite. Foram solicitadas sequências do runtime com solo/sombra, dois ciclos e transições, incluindo 15→0, seis personagens, parede e caminhada esquerda mapeada de Ryuchi.

## Primeira revisão das fontes de FX v3

Inspecionadas as seis novas fontes `assets/hero-attack-fx/v3/source/{franco,ryuchi,alt,katana,synth,percussion}.png`, geradas por imagegen: 1448 × 1086, grade8×6, RGBA. Props, armas completas e medalhões foram retirados; massas abertas, núcleo curto, pico e fragmentação/dissipação atendem ao brief isolado. Isso não constitui aceite no jogo.

A análise de alfa encontrou resíduo difuso de valores1–8 em grandes partes das fontes (por exemplo, cerca de862 mil pixels em Ryuchi e390 mil em Franco), inclusive bordas da folha com alfa1–2. Encaminhada limpeza desse resíduo apenas no export derivado, preservando fontes originais, para evitar tinta/retângulo fantasma e sangramento entre clips. A ocupação global de alfa reportada pelo artista não mede vazios dentro do bbox do pico; conferir composição sobre terra, cinza e corpos reais. A paleta ainda será julgada nas pranchas compostas e no runtime, pois a aparência sobre transparência preta isolada não é suficiente.


## Aceite isolado das pranchas de FX v3

Inspecionados `assets/hero-attack-fx/v3/contact-sheet.png` e `preview/ryuchi.png`, compostos sobre fundo cinza, além das seis fontes já revisadas. As paletas ficam distintas e mais limpas no fundo composto; preparo, pico e resíduo têm silhuetas reconhecíveis. Armas/props/emblemas inteiros, molduras e aros fechados não reapareceram. **Aceite artístico isolado das pranchas e do export derivado**, ainda condicionado à integração no jogo.

O usuário explicitou que as bordas não devem aparecer no jogo. Verificação executada nos seis atlas exportados: todas as 288 células (6 heróis × 6 ações × 8 fases) têm a faixa externa de 2 px com alfa0; o resíduo alfa1–8 foi removido somente no derivado. A mediana de vazio dentro do bbox das fases2–4 é de62% a76%, conforme os dados do manifesto, sustentando a leitura de matéria aberta; não é uma aprovação automática do resultado sobre personagens. Nenhuma moldura ou sangramento entre células aparece na prancha composta.

Ainda conferir no runtime que o caminho v3 substitui `bassWave`, slivers/traços auxiliares, recortes fixos de projétil v2 e efeitos legados duplicados. Não recolocar contornos grossos em nome de legibilidade: o pedido explícito exige arte sem essas bordas, conservando apenas contraste interno na matéria.


## Entrega parcial para revisão técnica independente

A pedido do coordenador, a direção encerra esta rodada para liberar a revisão técnica enquanto os responsáveis produzem as sequências do runtime. Não é aceite final da animação.

Estado consolidado:

- **FX v3 isolados:** aprovados nas fontes/pranchas compostas; export derivado das seis folhas com borda transparente de 2 px nas 288 células, sem resíduos alfa1–8. Produção e regressões dos caminhos frio/P2/follower/projéteis ainda pertencem ao artista/coordenador.
- **Locomoção v9 isolada:** A/B translacional com escala1 preserva identidade e reduz estalos do torso. Não foi necessário gerar ou inventar novos frames de corrida. O mapa de oito originais na caminhada esquerda sem máscara de Ryuchi é uma escolha de consistência, ainda aguardando evidência visual do runtime nesta auditoria.
- **Apoio:** o coordenador está acrescentando um footguard por translação (`offsetY≤224-bottom`) para impedir pixels opacos abaixo do chão, conservando o voo legítimo e a oscilação onde possível. Isso não altera posições, colisores ou sombras. A direção ainda não inspecionou sequências posteriores a essa alteração.
- **Halo/direção:** o programador informou 37 checks de runtime aprovados para fase comum/direções/diagonais e limpeza de matte. O parecer artístico sobre a aparência e as transições finais continua pendente das imagens/loops; esse número é informação do responsável, não execução independente desta direção.

Para reabrir o aceite, fornecer os loops/filmstrips reais dos seis personagens com solo/sombra, dois ciclos, contato/voo e 15→0; caminhada esquerda mapeada de Ryuchi; corrida→parede→parar e caminhada→corrida→ataque; e as ações completas dos FX v3 com fundo claro/escuro, P1/P2, follower e primeiro uso frio. O coordenador reativará a direção quando essas evidências estiverem prontas.


## Aceite visual da locomoção no runtime — evidência SHA2837e87b

Revisados os GIFs em `qa/beta-1.17.0/locomotion-v9/`, com decomposição e inspeção da sequência inteira para não limitar a análise ao primeiro quadro:

- `seis_personagens_corrida_mundo.gif`: todos os60 quadros para cada um dos seis personagens (360 recortes), duração nominal de30 ms por quadro/1,8 s, cobrindo aproximadamente três ciclos. Solo, sombra e física do ator do runtime preservados nos recortes.
- `ryuchi_caminhada_esquerda_mundo.gif`: todos os60 quadros, confirmando o mapa dos oito originais sem a alternância entre corpos de145/184 px.
- `contatos_e_ciclo_completo_mundo.png`: 16 fases × seis personagens, incluindo fechamento15→0.
- `comparativo_seis_personagens.gif`: comparação amostrada das transições caminhada→corrida, quatro direções e retorno à caminhada.
- `after/intro_ryuchi_{down,left,right,up}.png`: enquadramento real do estúdio antes da máscara.

**Aceite visual para a correção de locomoção atual.** Torso/cabeça estão mais estáveis; a escala e a identidade foram preservadas; os pés não penetram abaixo do plano do chão; a caminhada esquerda de Ryuchi não alterna mais personagens de tamanhos distintos. A sequência observada não apresenta defeito material restante que justifique gerar novos frames de corrida neste momento.

A pequena suspensão estilizada já presente nas poses originais continua: Ryuchi no contato convencional8 fica cerca de4 px acima do solo; isso não deve ser descrito como apoio físico perfeito. O movimento mantém voo/pernas recolhidas e pequenos desvios de desenho. A melhora obtida por registro, mapa/fase/direção e footguard é suficiente para esta rodada, preservando arte canônica e sem inventar poses.

Nas quatro capturas do estúdio, não se vê halo branco externo envolvendo Ryuchi. O símbolo do boné e os brancos internos da roupa continuam presentes. Esse parecer visual é mais específico que declarar “zero halo” por uma contagem de pixels: cobre os estados/imagens fornecidos.

O método foi inspeção quadro a quadro das sequências capturadas e da cadência nominal registrada nos GIFs, além de imagens do runtime. Não equivale a playtest humano contínuo, sensação de controle ou validação de hardware físico. O responsável informou 50 checks de locomoção, três de halo e12 de carregamento frio; a direção não executou esses suites independentemente.

## Último ajuste de ancoragem dos FX

A primeira revisão das capturas `forest_franco_contact.png` e `ruins_ryuchi_contact.png` mostrou que o J ancorado23 px à frente deixava parte importante da textura atrás do próprio torso. Aprovado ao artista mover **somente a emissão J** para34 px à frente, conservando PNG, tamanho nominal, impacto no alvo, geometria e tempos. Como o conteúdo ocupa parte central da célula, isso expõe o gesto perto da mão/tip sem aumentar massa opaca.

O artista também identificou e corrigirá o `addCombatFX('hit')` residual de chamadas aliadas fora de capture, substituindo a apresentação por contato v3 apenas quando não houver outro já emitido. Ainda aguarda captura posterior e regressão; não apresentar esta pendência de FX como resolvida antes da evidência final.


## Limitação na última captura independente

A tentativa de capturar independentemente os dois quadros após J34 em Chrome headless isolado não iniciou: o sistema retornou ENOSPC ao criar perfil/arquivo temporário. Foram removidos somente os derivados temporários desta direção e seu próprio perfil Chrome; as evidências originais de QA e produção foram preservadas. Depois disso o volume ainda tinha apenas cerca de130 MiB livres. O coordenador e o artista foram avisados para verificar a gravação efetiva dos últimos resultados. Esta falha não altera os aceites já obtidos, mas a direção não afirma ter inspecionado uma captura nova que não recebeu.


## Aceite final dos FX no runtime — build22bae091

Conferidas novamente `qa/beta-1.17.0/hero-fx-v3/forest_franco_contact.png` e `ruins_ryuchi_contact.png` posteriores a J34. A emissão fica mais exposta à frente do corpo sem aumentar tamanho/massa opaca. O corte aberto de Ryuchi é localizável; rostos, mãos, armas/instrumentos e silhuetas permanecem legíveis. Franco continua particularmente discreto contra a terra, característica da proposta de menor poluição, sem novo bloqueio material para esta rodada.

Inspecionadas por decomposição integral as seis sequências `assets/hero-attack-fx/v3/preview/{franco,ryuchi,alt,katana,synth,percussion}-runtime.gif`:32–38 quadros distintos por arquivo,3,36 s cada, respeitando os tempos variáveis registrados nos GIFs. As sequências de ações/combos preservam as poses do corpo e não mostram retorno de molduras, props/emblemas completos duplicados ou aros legados sobre o mapa. A montagem conjunta `six-heroes-runtime.gif` reúne42 quadros em720×470.

`BROWSER.json` final foi conferido: nove checks aprovados, `errors=[]`, sem campo de falha. Inclui seis caminhos adiados com dono explícito, um contato v3 por resolução e atribuição do hit antigo para supressão, mantendo recursos inalterados pelo desenho. Essa validação técnica é do responsável; a contribuição desta direção foi a inspeção das imagens/sequências e dos dados finais, sem executar independentemente a bateria completa.

**Aceite artístico final desta rodada: concluído.** Não há outra correção visual solicitada pela direção. O coordenador informou resolução do ENOSPC antes de salvar as evidências finais; a limitação temporária anterior não permanece como bloqueio da entrega. Nenhum arquivo de produção foi alterado pela direção; fontes/atlas e registros de jogo foram preservados.

Limites materiais mantidos: pequenas suspensões estilizadas dos pés nas poses originais, ausência de apoio biomecânico perfeito e FX de Franco discretos sobre terra clara. Revisão de sequências capturadas do runtime não equivale a campanha jogada por humano ou validação de celular/controle físico.
