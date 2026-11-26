# Direção e aceite — efeitos próprios dos seis inimigos

26/11/2026. `BUILD_INTERFACE_1_17`. Direção: leitura da produção e escrita deste relatório. Artista: `assets/enemy-skill-fx/v1/`. Programador: módulo novo e integração com `CombatReadability`. Fontes, mecânicas, corpos, cronômetros e callbacks de dano pertencem aos responsáveis; esta direção não os altera. Sem merge/publicação.

**Estado final — aceite artístico integrado concluído em HTTP36465da1:** seis fontes/atlas e80 poses aprovadas; evidência integrada composta pelas11 demos de HTTPb121e997, complementadas pela regravação corretiva do Maestro em HTTP36465da1. As demais dez apresentações permanecem inalteradas. As seções abaixo preservam o histórico; o parecer final está ao fim do documento. O usuário rejeitou a leitura de ícones dos efeitos anteriores. Corpos próprios aprovados na rodada v10 não resolvem esta solicitação: o novo trabalho é animar a habilidade materialmente dentro do jogo, com baixa oclusão do cenário.

## Referências concretas e regra de tradução

Inspecionados `assets/boss-ground-fx/v1/atlas/{pulse,scrap}.png`, os manifestos/caminhos dos conjuntos `static`, `void`, `v2/aim` e `v2/projectile`, `docs/BOSS_GROUND_FX_V1.md` e o comportamento efetivo em `game/source/chapter-03/encontros_v1.js`.

O padrão dos chefes oferece concentração, expansão, ruptura e dissipação, com matéria de cobre/pedra, energia fraturada e detritos. Transpor essa progressão e a densidade de pixel para os seis inimigos. Os efeitos grandes de boss não determinam a opacidade dos efeitos menores: conservar terreno visível entre fragmentos, especialmente no preparo e na recuperação.

Um símbolo que pisca, gira, cresce ou alterna oito desenhos continua sendo símbolo. A ação aprovada precisa mudar a configuração material no espaço: partículas convergem para uma emissão, crista/filamento avança, rompe no contato ou no release, e os restos se separam/perdem intensidade. Sem notas musicais, claves, logos, escudos decorativos, ícones fechados, instrumentos inteiros ou emblemas repetidos sobre o chão.

## Brief por inimigo e ação real

| Tipo | Matéria e silhueta em movimento | Origem/contato e cobertura |
| --- | --- | --- |
| `tambor_escudo` | Cristas âmbar curtas, abertas e quebradas, com lascas de cobre/poeira; expansão frontal seguida de ruptura | Cone real, acompanha frente funcional. No Difícil, também a segunda pancada atrasada. Não desenhar tambor/baqueta como FX. |
| `flautim_atirador` | Filamento verde estreito, cabeça de energia e cauda irregular com espaços; pequeno estalo que se dispersa | Aviso de mira, emissão real de `hostileShots`, trajetórias individuais do leque no Difícil, impacto no ponto real de colisão. Nada de impacto na extremidade teórica da mira. |
| `coro_curador` | Fios verde-pátina ascendentes e pequenos brilhos descontínuos; gesto curto mais seco no ataque próximo | Canalização no Coro; cura aparece nos aliados que receberam HP, junto de `torii:cura-inimigo`; melee próprio quando não há cura. Cura não deve parecer uma explosão hostil de dano. |
| `maestro_invocador` | Fendas/vórtices lavanda abertos e filamentos partidos; concentração e separação da matéria | Preparo no invocador e condensação nos pontos reais dos Nós nascidos em `chamar`; sem selo cheio que encubra o novo corpo. Cancelamento antes do nascimento não gera aparição. |
| `muralha_estatica` | Lasca ferrugem pesada, chispas laterais e poeira interrompida; avanço mais retilíneo e pesado que Tambor | Cobrir cone de perto e investida. Rastro liga posição anterior/final real; impacto termina no destino possível após `tileWalkable`, sem atravessar parede. Não reaproveitar apenas o cone do Tambor recolorido. |
| `antena_feedback` | Fios ciano ramificados e segmentos com falhas/vazios; energia corre pelo eixo antes de se romper | Faixa real de12 tiles e três eixos no Difícil. Feixe acompanha geometria, sem transformar a faixa toda num retângulo opaco ou acumular três grandes discos. |

Cobertura mínima de seis identidades e oito famílias de ações: Tambor cone, Flautim projétil/contato, Coro cura, Coro melee, Maestro invocação, Muralha cone, Muralha investida e Antena feixe. Contato/emissão/resíduo são estados visuais da mesma ação, não novos golpes.

## Composição, transparência e registro

- Preparação: poucas fontes de luz/fragmentos junto ao emissor e um fluxo que esclarece a direção. O aviso geométrico existente comunica o alcance exato; o FX não deve preenchê-lo com matéria antes do golpe.
- Ataque: núcleo localizado e breve, com vazios que deixam ler piso, pés e inimigos. Preferir poucas massas legíveis a ruído uniforme ou dezenas de ícones pequenos.
- Recuperação: detritos se afastam e perdem densidade. Não voltar a um símbolo inteiro; não manter uma superfície luminosa parecendo dano ainda ativo.
- Pivô e escala constantes por sequência, perspectiva do chão consistente, filtragem nearest e câmera atual. Emissão segue corpo/frente; impacto segue local real de contato. Não normalizar individualmente cada pose para preencher uma célula.
- Fontes RGBA preservadas, derivados sem matte branco/preto, contorno quadrado, bloom retangular ou bleed. A revisão inclui corpo completo do efeito e fragmentos nas bordas internas: guardalpha sozinho não detecta o defeito de crop nominal ocorrido nos corpos v10.
- Exportar a extensão integral de cada pose. Se o efeito cruza a célula nominal da fonte, atribuir a geometria inteira ao quadro dono antes de empacotar; não apagar lascas para fazer o teste passar. Comparar cores/alfa com a fonte completa e inspecionar sobre claro, escuro, pedra, terra e vegetação.

## Contrato temporal e integração

Os tempos existentes são a referência: Tambor0,75 s; Muralha cone0,8 s e charge0,9 s; Flautim mira0,7 s e tiro9 tiles/s; Antena1 s; Coro canto1,15 s; Maestro chamado1,3 s. Não mudar esses tempos para acomodar o desenho. A seleção de poses deve representar antecipação/descarga/dissipação nos eventos reais, com o pico junto do release/contato.

Warnings funcionais permanecem íntegros e identificáveis; o novo caminho substitui os glifos decorativos antigos para evitar duplicação. Frio/carga atrasada conserva aviso e simulação sem ressuscitar ícones antigos. Corpo fica acima do FX de chão. Cancelamento, morte, pausa e troca de área não deixam descargas órfãs. Não acrescentar hitbox, dano, RNG ou escrita em atores como consequência de renderizar.

## Critérios de aceite observáveis

1. Comparar todos os quadros das fontes e exportações, com estrutura íntegra e associação correta; verificar halo, matte, bleed e clipping dentro/fora da célula. Oito hashes diferentes não comprovam animação nem integridade.
2. Inspecionar loops completos com preparação, pico, separação e dissipação; testar a passagem final→inicial onde houver loop e ausência de reinício visual em cada frame da simulação. Shapes mudam por ação material, sem deformar um único emblema.
3. Demonstrar os seis inimigos no runtime real com cenário e heróis. Incluir todas as famílias acima, cura em aliado ferido, melee do Coro, cone/investida da Muralha, tiro com colisão e feixe triplo/leque do Difícil. Gravação de atlas ou mockup não substitui isso.
4. Verificar nas imagens de contexto que o chão continua visível entre fragmentos e que o efeito não mascara corpo, pés ou aviso de perigo. Ataque deve parecer presente na ação, não apenas como um ícone novo sobre a área.
5. Distinguir evidência visual de gameplay humano: demos automatizadas do jogo comprovam execução/inserção, sem alegar uma partida de campanha ou conforto em dispositivo físico.

Brief encaminhado a `/root/arte_fx_portal` e `/root/integrar_fx_seis`. A próxima revisão registrará artefatos, build, imagens/gravações examinadas, correções concretas e limites. Nenhum efeito novo está aprovado nesta etapa.


## Revisão das seis fontes — 80 poses, antes da exportação

Recebidas `source/{tambor,flautim,coro,maestro,muralha,antena}.png`. Tambor/Antena usam4×2 (oito poses); as quatro demais4×4 (duas sequências de oito), total80 poses. A direção examinou as folhas completas em composição RGBA correta sobre escuro e pedra, com versões adicionais em fundo claro disponíveis para a conferência.

**Forma e progressão das fontes aprovadas para exportar.** O Tambor abre uma crista frontal, cresce e rompe em detritos; Flautim tem cabeça/cauda e impacto curto; Coro separa fluxo ascendente de cura e gesto direcional de melee; Maestro separa vórtice e aparição vertical; Muralha apresenta fragmentos ferrugem de ataque e fluxo de avanço mais comprido; Antena apresenta filamentos ramificados com falhas. As formas mudam materialmente e se dissipam, sem ícone fechado/nota/logo animado. Isso não é ainda aceite da escala/densidade em jogo.

Na visualização direta do PNG transparente, o Tambor parecia ter vermelho/amarelo externo. A composição RGBA sobre fundos opacos mostra a onda âmbar sem essas cores: elas estavam em RGB de pixels quase transparentes, não em uma moldura visível. O coordenador mediu vermelho com alfa máximo4 e amarelo com alfa máximo2. Limpar alfa1–8 somente no derivado preserva a fonte e é adequado; não tratar o RGB invisível exibido pela ferramenta como prova de halo no jogo.

Auditoria independente de fronteiras: nas80 células, toda geometria alfa>8 fica a pelo menos11 pixels da borda nominal. A inspeção integral das fontes não mostra linhas retas interrompendo forma nem fragmentos pertencentes a um vizinho. Isso é diferente do defeito v10: aqui há folga real na fonte antes do pack. Ocupação alfa>64 varia de0,07% a16,21% da célula (dependendo de quadro), compatível com bastante espaço vazio, mas não comprova sozinho baixa oclusão no enquadramento do jogo. Maestro e Tambor têm picos mais densos; conferir que permaneçam breves e que a escala aplicada não transforme os filamentos em grandes manchas.

Diagnóstico independente em `/private/tmp/torii-enemy-skill-fx-review/source_audit.json` e composições `*_dark.jpg`, `*_stone.jpg`, `*_white.jpg`. Fontes e assets não foram alterados pela direção. Próxima etapa: comparar exportações contra as80 fontes e as demos reais de todas as ações, com avisos, contatos e pontos de nascimento efetivos. **Integração/contexto ainda pendentes.**


## Aceite das exportações — seis atlas, dez clips, 80 poses

Revisadas integralmente `preview/all-frames-earth.jpg`, `all-frames-stone.jpg` e `all-frames-forest.jpg`, comparando as80 poses com as seis fontes anteriormente examinadas. **Exportações aprovadas como assets.** Ondas abertas, sopros, partículas menores e dissipação continuam íntegros; não se observam cortes retos, pedaços do quadro vizinho, moldura ou matte cromático. A base verde destas pranchas é uma cor de contraste; não equivale à demonstração no mapa com vegetação real.

Comparação independente RGBA da célula exportada com o recorte integral correspondente da fonte, após zerar somente alfa≤8 e aplicar downsample nearest para112×112+guard:80/80 correspondências exatas. Não há supressão de pequenos componentes ou limpeza que apague uma parte física. Toda célula apresenta margem real de pelo menos12 px, além do guard8 contratado. Fonte completa permanece preservada e a extensão visual cabe antes da exportação.

Os dez GIFs de atlas decodificam oito imagens cada; durações somam aproximadamente720 ms por ciclo devido à quantização de centésimos do GIF. A leitura das fases mantém expansão/ruptura/dissipação. Esses tempos de prévia não alteram os cronômetros reais dos ataques; a seleção temporal no jogo é responsabilidade do integrador.

Pivô nominal[64,64] e origem da célula são constantes. A emissão do projétil Flautim exige ancorar a cabeça energética na posição física, pois o núcleo de voo ocupa aproximadamente[98,68], [102,66] e[104,66] em fases distintas; o integrador recebeu essa informação e está ajustando o caminho de renderização. Para Antena, considerar contentBounds ao encaixar o filamento na faixa para não perder extensão útil nos espaços transparentes. Nenhuma alteração de PNG foi solicitada por esses dados.

Pendência de aceite final: demos reais de todas as ações, principalmente colisão do Flautim, cura no aliado, spawn de Nós, Muralha cone/investida e feixe do Difícil. Conferir baixa oclusão sobre cenário real e relação de escala com os corpos, sem apresentar as pranchas como gameplay.


## Primeira revisão de contexto — HTTPd8beaf75, capturas em ajuste

Recebidas11 demos do runtime em `qa/beta-1.17.0/enemy-skill-fx-v1/`, com quadros a20 fps e velocidade da simulação preservada. O coordenador está ajustando enquadramento dos casos C3, cujo caster ficava próximo da borda/props. Essas primeiras capturas não constituem o aceite final.

Achados encaminhados para comparação antes de alterar a arte:

- Tambor: no trecho0,70–1,00 s, caster/alvos e seguidores ficam sobrepostos e parte do setor toca folhagem. A leitura atual é sobretudo de arco/poeira sob o grupo, não da crista aberta inteira da fonte. Regravar o golpe dirigido sobre piso livre com o alvo e o caster separados; manter depois outra demo com vegetação como stress. Não engrossar ou encher o FX para compensar uma captura que esconde sua área útil.
- Flautim: trajetória passa pelo grupo sobreposto e o núcleo/contato é muito discreto nas primeiras imagens. Conferir um tiro atravessando piso livre com um alvo isolado antes de julgar dimensão e cauda. A presença de registro de projétil por si só não comprova visibilidade da animação.
- Coro/Maestro: plumas verticais ficam majoritariamente nas pernas/sob os corpos. A auditoria do registro revela pivô central[64,64] apesar de uma base desenhada estável mais baixa: Coro base≈105 (fase0 contenty80..105); `maestro_emerge` base≈90. Testar no runtime pivô de base fixo por clip, sem editar PNG/escala ou sincronismo, para a forma partir do chão e subir. O vórtice de chão do Maestro permanece um caso diferente e pode conservar pivô central. Ainda conferir a comparação visual após teste.

A preservação do cenário é boa nas imagens iniciais, porém baixa oclusão sozinha não satisfaz o pedido se o golpe quase desaparecer. A decisão final exige a forma ser reconhecível em movimento no campo real, sem voltar a emblemas ou massas opacas. Nada foi alterado em produção por esta direção.


## Comparação limpa Tambor/Antena — HTTP657a5693

O coordenador separou o alvo, retirou os outros membros da equipe da fixture e regravou o Tambor com deslocamento real por input; Antena foi centralizada na Usina. GIFs720×300 são crops do jogo em pixels nativos,20 fps, com paleta preservando cores dos efeitos. A direção inspecionou os trechos de preparo/release/dissipação, em especial Tambor0,70–1,15 s e Antena0,80–1,55 s.

**Leitura integrada ainda não aprovada.** No Tambor, mesmo sobre piso exposto, o release é percebido sobretudo como círculo claro no caster e poeira breve; a crista âmbar aberta da fonte não se distingue no setor como deveria. Na Antena há faixa ciano, porém muito fina/tênue para ler a ramificação material em tamanho nativo. Isso não invalida os desenhos: fontes e atlas têm as formas aprovadas; a apresentação efetiva precisa esclarecer o golpe.

Antes de engrossar/aumentar a arte, foi solicitado ao integrador medir `ctx.globalAlpha`, `globalCompositeOperation` e clip efetivo no stamp real. O renderer multiplica alpha herdado; um estado externo baixo seria hipótese capaz de explicar perda geral de intensidade e deve ser confirmado por instrumentação, não tratado como causa já provada. Se o estado estiver neutro, comparar ajustes de escala/encaixe/opacidade da apresentação sem alterar a geometria de dano nem converter área em preenchimento opaco. Não aceitar apenas porque o contador de stamp aumentou ou porque os oito quadros existem.

Os pivôs verticais fixos Coro[64,105] e `maestro_emerge`[64,90] já foram aplicados pelo integrador com o coordenador;16 checks informados. A direção ainda precisa ver os resultados na gravação atualizada para aprová-los visualmente.


## Comparação de escala útil — HTTP63d32a38

Diagnóstico do integrador confirmou estado Canvas normal: alpha real≈0,92/0,95 e `source-over`; a hipótese de supressão por estado herdado não se confirmou. O problema de escala veio da célula transparente: o conteúdo vertical útil do cone ocupava aproximadamente49 px diante de um setor≈90 px; Antena ficava com cerca de10 px úteis. O responsável passou a encaixar unionbounds fixos por clip na geometria nativa, com clip preservado; nenhuma fase é normalizada individualmente e nenhum PNG/dano foi alterado.

Revisadas as novas gravações em caminho próprio `build-63d32a38/{tambor,antena}.gif`, seus posters e as capturas `drawstate/63d32a38/*_real.png`. **Antena recebe aceite parcial de escala e leitura:** a descarga ciano aparece segmentada, com núcleo claro e dissipação curta; piso e atores continuam visíveis entre os fios. Ainda falta conferir o feixe triplo do Difícil na apresentação final.

**Tambor ainda tem competição visual material:** o anel legado de release no emissor domina a pancada nos quadros14–17. A crista raster ampliada aparece em brilhos e fragmentos na borda direita/superior, porém a leitura principal continua sendo de um círculo/poeira. O encaixe fixo maior está correto; não foi pedido novo PNG ou aumento geral de opacidade. Foi recomendada ao coordenador supressão estritamente cosmética do anel de release nos seis tipos com habilidades próprias, preservando avisos funcionais, dano, bloqueio e contatos. Rever o Tambor após essa retirada antes de decidir qualquer reforço localizado.

As contagens de910/2257 pixels diferentes no A/B e os testes de execução apoiam a confirmação técnica de que há raster renderizado, mas não substituem esse julgamento de hierarquia visual. O aceite geral permanece pendente dos demais casos e da nova comparação do Tambor.


## Rodada agrupada das demais ações — HTTP63d32a38

Recebidas as11 gravações versionadas em `build-63d32a38/`; `RECORDING.json` identifica essa URL e `errors=[]`. Conferidos os trechos reais de preparo, emissão/colisão, cura, nascimento, investida e dissipação por decomposição temporal. Para o leque, a direção usou adicionalmente recortes PNG ampliados nearest dos próprios quadros, evitando que a compressão JPEG da prancha de análise apagasse núcleos de poucos pixels.

| Ação | Parecer da rodada |
| --- | --- |
| Flautim tiro e leque Difícil | Núcleos verdes compactos com caudas curtas seguem as trajetórias separadas. Contato aparece no alvo real; escala pequena é adequada ao contexto16bit. Não solicitado aumento. |
| Coro cura | Registro de base corrigido melhora a subida do brilho junto do aliado efetivamente curado. FX é discreto e preserva corpo/cenário. Não observado conflito material que justifique suprimir o XP nativo. |
| Coro melee | Golpe curto no contato, distinto da cura. Não solicitado novo efeito/timer nem supressão adicional. |
| Antena Difícil | Três eixos de descarga segmentada legíveis, com espaço entre fios e terreno aparente. Aceite visual dessa variação. |
| Muralha cone | Lasca ferrugem/ruptura pesada se distingue da onda do Tambor. Retirada do ring geral já combinada resolve a duplicação de release; sem novo PNG solicitado. |
| Muralha charge | Rastro/ruptura material aparecem no trajeto/destino efetivo, mas círculo claro extra no destino compete com o impacto. Solicitação cosmética específica abaixo. |
| Maestro invocação | Pluma emerge no ponto dos Nós nascidos, com registro vertical corrigido; os aros rosa antigos do spawn ainda dominam o surgimento. Solicitação específica abaixo. |
| Tambor dupla pancada Difícil | Duas descargas seguem o ritmo real. A comparação estética final da crista fica agrupada ao Tambor após retirada dos aros decorativos. |

Dois concorrentes materiais foram identificados, além do ring geral que o programador já está suprimindo: (1) Maestro, quadros25–41/1,25–2,05 s: aros rosa nos Nós persistem e dominam a pluma nova; recomendado retirar somente o spawn cosmético dos minions `f2chamado` dessa habilidade. (2) Muralha-charge, quadros17–22/0,85–1,10 s: círculo claro do callback terminal compete com a ruptura ferrugem; recomendado retirar somente o `strike` cosmético extra dessa investida. Esses pedidos foram encaminhados ao coordenador; autorização/alteração pertencem a ele e ao integrador.

Não ampliar essa supressão para XP da cura, dano do Coro, efeitos de heróis/chefes, feedback de bloqueio, avisos funcionais ou callbacks de combate. São achados visuais de casos concretos, não uma regra genérica contra círculos no jogo. Fontes e atlas continuam congelados e aceitos. Última comparação deve mostrar Tambor sem ring e a resolução desses dois extras.


## Aceite artístico integrado final — HTTPb121e997

Conferido `build-b121e997/RECORDING.json`:11 casos com URL dessa build, `errors=[]` e sem failure informado. As oito ações base têm45–75 quadros de simulação a20 fps; as três variações do Difícil têm75 quadros cada (3,75 s). São gravações do jogo real executado por fixtures controladas; não são montagens de FX sobre cenário nem comprovação de uma partida humana.

Comparadas as novas versões dos três casos pendentes com os anteriores, por quadros de preparo/release/dissipação e seus posters:

- **Tambor aprovado:** sem o anel de release, o estouro/crista branco-âmbar à frente do escudo e os fragmentos em expansão assumem a leitura da pancada. O material se separa e desaparece brevemente, sem preencher todo o setor ou cobrir o alvo. A curva do aviso funcional continua antes do golpe.
- **Muralha-charge aprovada:** o aro terminal redundante saiu e o destino efetivo apresenta ruptura curta de lascas/poeira. O corpo pesado e o rastro fornecem direção/peso; a recuperação expõe o corpo. Não se vê um impacto decorativo além do lugar atingido pelo ator.
- **Maestro aprovado:** os aros externos redundantes deixaram de dominar; a condensação lavanda acompanha os corpos nos pontos reais de nascimento. A marca plana de nascimento ainda presente é parte da apresentação nativa preservada e não impede ler os Nós surgindo. Não afirmar que todos os círculos/marcadores do jogo foram removidos.

Também conferidas as três variações finais do Difícil nessa build: Tambor mantém duas pancadas e dissipações separadas; Flautim emite três núcleos verdes com caudas curtas e impactos locais; Antena descarrega três eixos segmentados com vazios entre os filamentos. A escala já aprovada e o recorte nativo foram preservados. Cura/melee do Coro e os demais casos conservam o resultado da rodada anterior com os registros verticais corrigidos.

**Aceite artístico integrado dos seis inimigos concluído, sem achado visual material restante no escopo.** As habilidades têm animações de matéria com avanço/ruptura/dissipação próprias, sem depender de ícones fechados; cenário, pés e corpos continuam legíveis. Fontes/atlas passaram revisão integral de80 poses, bordas reais e correspondência RGBA, além da conferência em contexto. Os avisos geométricos funcionais permanecem por necessidade de leitura do alcance; o aceite não recomenda apagá-los para parecer mais cinematográfico.

Artefato alterado pela direção: somente este relatório. Os responsáveis informaram22 checks de integração cosmética antes da validação técnica final do coordenador; a direção não os executou nem apresenta a análise visual como teste de hardware/mobile. Fontes originais e corpos de personagens foram preservados. Sem publicação/merge nesta tarefa.


## Conferência final restrita do Maestro — HTTP36465da1

A revisão técnica identificou que o guard cosmético de spawn podia deixar passar objetos cujo `time` já tinha sido decrementado pelo update nativo. O coordenador/integrador corrigiram apenas esse guard; forma, pivô, escala, opacidade e PNGs não mudaram. Essa descrição é informação técnica dos responsáveis, não uma causa inferida pela imagem.

Inspecionados os novos `build-36465da1/maestro.gif` e `maestro-impact.png`, incluindo a sequência1,20–2,35 s (quadros24–47) de condensação, formação do corpo e saída do estado de nascimento. A gravação contém75 quadros/3,75 s a20 fps. **Maestro mantém aceite final:** os aros CFX redundantes não disputam o aparecimento; a pluma e os corpos surgem nos pontos efetivos. As marcas planas nativas de nascimento continuam presentes, sem serem confundidas com o efeito redundante retirado. Não foi solicitado apagar essas marcas, criar outro PNG ou ampliar a intensidade.

A evidência final é, portanto, as11 demos já revisadas de `build-b121e997/` mais essa comparação restrita de Maestro em `build-36465da1/`. Não declarar que todas as11 demos foram regravadas na última build. As demais dez apresentações e suas aprovações são preservadas conforme a proveniência informada pelo coordenador. **Aceite artístico final consolidado, sem pendência material adicional no escopo.** Só este relatório foi alterado pela direção.
