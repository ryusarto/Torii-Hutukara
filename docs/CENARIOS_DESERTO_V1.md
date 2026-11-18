# Cenários desérticos do Capítulo 3 — Beta 1.6

**Situação:** assets completos e candidata Beta 1.6 reconstruída e revalidada, preservando a Beta 1.5 de inimigos/bosses já incorporada a main. A validação estática passou em 137/137 verificações e as 14 suítes automatizadas terminaram aprovadas; a publicação foi concluída na main, commit `bf1c2dc45c19216463983bd92f8bcb39216fe4d7`, e o hash foi conferido no site público. A recuperação partiu do checkpoint `8ad20909efd72b9f0143da1b9d3163c474dc8f6d`, da branch `art/cenarios-deserto-v1`. Evidências atuais e histórico da candidata 1.4 estão separados em [ENTREGA.md](cenarios-deserto-v1/ENTREGA.md).

## Experiência e escopo

O Capítulo 3 adota um assentamento desértico pós-apocalíptico cyberpunk: areia compactada, pedra de reuso, ferrugem, aço reparado, lona e tecnologia musical recuperada. Luzes âmbar e espaços habitados preservam o acolhimento; o ciano fica concentrado em funções e mecanismos. O mundo muda por materiais, volumes e composição, sem um filtro global sobre o jogo.

O passe serve aos pilares existentes: música como ação, afeto antes de exposição, progresso visível e liberdade de ordem entre Usina e Canal. Este passe de cenário não introduz sobrevivência, veículos, combustível, facções, novos combates ou outra engine. A candidata 1.6 também preserva a frente de inimigos/bosses da Beta 1.5; essa frente tem sua própria documentação e testes. Torii & Hutukara continua em HTML/Canvas/JavaScript, com construção em Ruby.

A direção comum está em [DIRECAO_DESERTO_POS_APOCALIPTICO.md](../design/chapter-03/DIRECAO_DESERTO_POS_APOCALIPTICO.md), com [brief de assets](../design/chapter-03/BRIEF_ASSETS_DESERTO_V1.md) e [paleta](../design/chapter-03/PALETA_DESERTO_V1.json).

## Pacote produzido

| Conjunto | Conteúdo |
|---|---|
| A01–A10 | 106 recortes e estados que substituem funções C3 existentes |
| D11–D13 | 25 variantes contextuais de fachadas, infraestrutura, móveis e mecanismos |
| Fundos separados | Dois panoramas de diálogo: Distrito e travessia elevada |
| Biblioteca desértica | **13 atlas, 131 recortes e dois fundos** |
| A11/A12 preservados | 20 recortes compartilhados dos capítulos anteriores |
| Composição de runtime | **15 atlas, 151 recortes e dois fundos** |

Os PNGs integrados, manifesto e prévia ficam em `assets/cenarios/deserto-v1/`. Props e vãos têm alpha real; materiais têm miolo opaco e gutters transparentes. O empacotamento usa nearest-neighbor e bases/pivôs comuns para estados correspondentes. O manifesto conserva IDs originais, contexto, fonte e recortes medidos.

O passe cobre as onze áreas C3: Terminal, Distrito, Contratempo, Oficina, Usina, Canal, Elevador, Mar de Nuvens, Terraço, Último Torii e Núcleo. Bancos, floreiras, caixas, dispensadores, grades, instrumentos, gravadores, palco, comportas, elevador, condensação, âncoras, olhos e altar recebem imagens próprias. Topos firmes, margens e vazio se separam por vizinhança; água e condensação continuam reconhecíveis como água.

## Contratos preservados

A integração contextual pertence a `game/source/chapter-03/cenarios_deserto_v1.js`. O gerador escolhe `deserto-v1` por padrão na candidata 1.6; o seletor `TORII_CENARIOS_THEME=v2` mantém a referência anterior reproduzível. O manifesto desértico está em `complete_assets`.

Não mudar os 25 mapas, 43 gates, sólidos, IDs, flags, ações, recompensas, músicas, recrutamentos, saves ou regras de co-op por causa da troca de imagem. Permanecem os seis alinhamentos de portas V2 e o reparo de saves no anel antigo do Mar de Nuvens. As máquinas reagem às flags locais; o progresso da Usina não resolve visualmente o Canal.

A11/A12, quatro painéis de diálogo legados e a identidade dos seis heróis permanecem próprios. Isso inclui Protagonistas V5, Ninja/Arqueiro e os músicos da Beta 1.3. Não recolorir pele, roupa ou máscara Torii como consequência do cenário.

## Evidência e limites

A candidata **Beta 1.6.0** tem **401.631.199 bytes**, SHA-256 **`517715fe2e742bf3e19b2e238f0286378e5c63335002a1e116cf62fe3b10b845`**. Foram conferidos os relatórios atuais: **137/137 verificações estáticas**, **13/13 checks de cenário**, 19 estados com corpos válidos de P1/P2 e retomada real pelo botão Tentar novamente. A exportação contém HTML de 888.756 bytes e 307 mídias; os relatórios indicam roundtrip SHA-256 e build portátil inalterada. O agregado final contém 14/14 suítes aprovadas, incluindo controles, progressão/saves, estado dos personagens, arte dos seis heróis, inimigos, bosses e site. A execução [44227852940](https://github.com/ryusarto/Torii-Hutukara/actions/runs/44227852940) terminou com sucesso; o [site público](https://ryusarto.github.io/Torii-Hutukara/?v=bf1c2dc) serviu o mesmo SHA-256, 15 atlas/151 recortes e dois fundos, sem erro JavaScript. Quatro PNGs públicos também foram conferidos por hash.

O integrador registrou, antes da interrupção, aprovação visual das onze câmeras e 19 estados para o executável de SHA-256 `222eaeb6bcbc8f21dbee04dc614d3f366009979a3eb03f59a8aedd236d5a2e58`, além das verificações listadas em [ENTREGA.md](cenarios-deserto-v1/ENTREGA.md). Esses resultados históricos não certificam automaticamente uma reconstrução com outro hash.

A direção artística não deixou P0/P1 aberto no escopo de cenário. Registrou um P2 opcional: reduzir a repetição simétrica das dunas no topo. Na candidata 1.6, sete tipos reais de padrão foram solicitados e assertados em modo `padrao`. Isso não equivale a uma aprovação humana de sete geometrias distintas de aviso. A revisão artística anterior não as atestou; alguns enquadramentos de cross/fan/chase/orbit mostravam sobretudo anéis semelhantes.

Não houve nesta entrega uma nova campanha manual completa, telefone físico ou dois controles físicos. Execução automatizada e captura de quadros não comprovam conforto, diversão ou fluidez universal entre aparelhos.

O GitHub é a fonte oficial de código e assets integrados. Originais, PNGs individuais, atlas, prévias e capturas completas têm backup em `Dropbox/T&H/Assets/Torii & Hutukara/Cenarios/cenarios-deserto-v1`. O Dropbox guarda assets e backups; o Google Drive foi retirado desse fluxo. A coordenação não publica a build: o integrador confirma hash, testes, atualização de main e disponibilidade do link.

## Fechamento observado

A direção artística reviu as onze áreas e 19 estados da composição 1.6, sem P0/P1 artístico aberto. Provas em `qa/cenarios-deserto-v1/PUBLICACAO.json` e `ASSETS_PUBLICADOS.json`. O pacote `TORII_CENARIOS_DESERTO_V1.zip` e os originais/quadros individuais estão no backup Dropbox indicado acima; CRC e SHA-256 do ZIP foram verificados. Os metadados finais estão em `qa/cenarios-deserto-v1/BACKUP.json`. Nenhuma dessas verificações representa uma campanha manual nova ou teste físico.
