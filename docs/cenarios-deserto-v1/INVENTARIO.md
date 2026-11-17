# Inventário de dependências — cenário deserto V1

Esta frente revisa **133 slots de cobertura de arte/estado**: os **106 recortes A01–A10** e **27 vínculos legados adicionais** do Capítulo 3. Não são 133 objetos únicos nem 133 gerações obrigatórias: estados, cantos e instâncias reaproveitam arte. Reuso e adaptação são decisões por item. **A11–A12, com 20 recortes, permanecem intocados globalmente.**

A base consultada é o checkout recuperado em `14923f4`, o manifesto `assets/cenarios/v2/manifest.json` e os seletores de `cenarios_v2.js`/`chapter3_runtime.js`. Esta é uma análise estática de dependências. Não constitui nova aprovação de imagem, campanha jogada ou teste em aparelho físico.

O contrato mestre pertence ao outro chat: `design/chapter-03/DIRECAO_DESERTO_POS_APOCALIPTICO.md`. Foi consultado no checkout `/private/tmp/torii-c3-direcao-deserto`, commit `ce659e51`, junto do brief de assets. Sua integração no checkout principal pertence ao root. Este inventário não cria paleta concorrente, nomes, lore ou mudanças de missão. A instrução já confirmada é deserto pós-apocalíptico cyberpunk, com terra, areia, ferrugem e sucata, sem filtros globais. As variantes ficam em `assets/cenarios/deserto-v1`.

## Lote fechado das folhas existentes

| Folha | Recortes/estados | Prioridade | Dependência visual |
|---|---:|---|---|
| A01 — superfícies urbanas | 8 | P0 | Terra seca/úmida, circulação, canal, metal, poeira distante e abismo. Água e vazio conservam leitura não caminhável |
| A02 — interiores | 8 | P0 | Madeira e chapa reparadas, ponte, plataforma, palco e arena; pisos sem objetos embutidos |
| A03 — bordas | 16 | P0 | Guias e cantos, travessias, dreno e soleira adaptados aos materiais novos |
| A04 — encaixes suspensos | 16 | P0 | Topos firmes e bordas de meseta/plataforma; poeira abaixo, mantendo todas as conexões físicas |
| A05 — fachadas complementares | 6 | P0 | Três moradias, entrada de usina, marquise e arco. Não inclui clube, oficina ou elevador |
| A06 — Contratempo | 12 | P1 | Palco e caixas em dois estados, bar, assentos, projeção, instrumentos e painel acústico |
| A07 — indústria | 8 | P1 | Máquina, pressão, válvula e comporta, cada qual com dois estados coerentes |
| A08 — orientação | 12 | P1 | Placas vazias, setas, soleiras, embarque e píeres; texto permanece desenhado no jogo |
| A09 — mecanismos de percurso | 8 | P1 | Balizas, estabilização, âncoras e marcador; bases firmes e ativação local legível |
| A10 — limiar e Núcleo | 12 | P0 | Olhos, altar, círculo, arco, passarela e colunas; arena silenciosa e combate legível |
| A11 — objetivos C1 | 12 | Protegido | Preservar PNG e entradas globais; exceção C3 recebe variante contextual |
| A12 — transições/interiores | 8 | Protegido | Preservar PNG e entradas globais, incluindo parapeitos e margens usados em C2 |

O JSON pareado lista cada ID, grid, célula, recorte e pivô do manifesto atual. A contagem de biblioteca não significa que todos os recortes estejam visíveis: o helper de calçada A03, por exemplo, usa principalmente `curb_n` rotacionado. O aceite deve verificar seletores e mapas reais, além da folha de contato.

## Recursos que A01–A10 não cobrem

| Grupo adicional | Slots | Fonte e ponto de integração |
|---|---:|---|
| Fachadas e infraestrutura icônicas | 8 | Clube, oficina, elevador fechado/aberto, santuário do Terraço, poste, infraestrutura vertical e gravador contextual do Último Torii |
| Mobiliário urbano ativo | 7 | Banco, floreira, caixas, vending, guarda-corpo, dreno e kiosk do atlas urbano |
| Oficina ativa | 4 | Bancada, console dos ventos, expositor de flauta e máquina de afinação |
| Canal ativo | 3 | Interferência ativa/calma e tubo rompido; comporta, válvula e pressão já entram em A07 |
| Elevador: mecanismos | 3 | Console, receptor dos ventos e trava de baixo; par de cabine contado no primeiro grupo |
| Fundos de diálogo | 2 | Painéis `distortion` e `cloud` do atlas cinematográfico compartilhado |
| **Total adicional** | **27** | Variantes somente C3, sem recolorir a biblioteca global |

O clube (`C3.images.props`, célula0,0) e a oficina (2,0) são as fachadas mais fáceis de esquecer. O elevador vem de `atlas_lift`, células0,0 e1,0, em três mapas diferentes; basta um par de estados. O santuário legado continua visível no Terraço: no Último Torii ele já foi trocado pelo arco A10 e no Núcleo é ocultado.

Postes C3 e infraestrutura vertical usam `prebeta_props`, que também fornece elementos do Capítulo 1. Os fundos de diálogo também compartilham atlas com os capítulos anteriores. Esses arquivos não podem ser substituídos globalmente. O novo seletor deve trocar somente o contexto C3 e manter os demais recortes intactos.

O `checkpointStone` comum do C3 já desenha o kiosk urbano. O gravador adicionado no Último Torii usa diretamente `env2_prop`/`checkpoint_recorder` de A11 e precisa de exceção contextual própria. Pode reaproveitar o desenho do kiosk, mas não modificar a entrada global de A11. O número de27 representa cobertura de vínculos; reaproveitamento de desenho não exige gerar imagem duplicada.

## Agrupamento de produção sugerido

Reaproveitar os grids e IDs de A01–A10. Para os extras, uma divisão finita é:

- **D11, 4×2 /8 slots:** clube, oficina, duas cabines, marco do Terraço, poste, infraestrutura e gravador.
- **D12, 3×3 /9 slots:** sete móveis urbanos, bancada e expositor de flauta.
- **D13, 4×2 /8 slots:** console dos ventos, afinação, duas interferências, tubo e três mecanismos do elevador.
- **D14 /2 fundos:** Distrito e paisagem de poeira/plataformas. Medir o aspecto efetivo do painel atual; dois PNGs independentes, conforme consolidação do contrato mestre.

São14 famílias de produção e15 arquivos PNG: **13 atlas C3** (dez folhas variantes e três folhas extras) e **dois fundos separados**. A divisão dos extras entre células é operacional, dentro dos13 atlas C3 confirmados pelo contrato. Manter os133 vínculos cobertos e os metadados de recorte. Os recursos extras usam prefixo **`c3_desert_`**, sem renomear `originalId`, tipo de prop, NPC, flag ou narrativa. O JSON fornece ordem e célula de destino proposta para D11–D13.

Há12 entradas legadas sem colocação ativa identificada e fora do lote: bins, barricade, turbine, toolboard, drawers, cables, workshop_control, bridge_control, signal_beacon, anchor_tower, cloud_beacon e arrival_arch. Não produzir variantes por precaução. A05 já cobre o arco que está sendo instanciado. A célula sem nome do elevador também não gera novo asset.

## Sequência e dependências de integração

A ordem do contrato mestre começa pela **amostra Distrito → Contratempo → entrada da Usina**, incluindo superfície/guia/soleira, fachadas icônicas D11, palco/caixas e mecanismo inativo/ativo com combate. Em seguida, avaliar uma travessia com topo, borda, condensação futura e vazio **antes de expandir A04/A09**. Somente então completar as onze áreas. P0 indica dependência de coerência visual e risco de regressão, não autorização para antecipar a expansão ao aceite das amostras. A10 permanece P0 para o clímax. A01 novo já foi gerado, aceito e normalizado pelo integrador; esta lista não solicita refazer sua geração.

P1 fecha móveis/interiores, estados mecânicos, orientação e mecanismos de percurso. Cada etapa deve ser avaliada dentro da câmera real, com os personagens e o HUD atuais. É necessário manter a percepção de cidade habitada e infraestrutura utilizável, mesmo com sucata e erosão. Não basta tornar tudo marrom ou acrescentar um filtro de poeira sobre o canvas.

Os estados existentes são contratos de leitura, não novos scripts. Elevador acompanha `liftOpen`; pressão acompanha `usinaGate`; válvula acompanha `usinaDone`; comporta e interferência acompanham `canalDone`; a máquina do Canal acompanha `canalPath || canalDone`. Palco acompanha `clubPhraseDone`, e caixas dependem do contexto. Círculo usa `metronomeDone`; olhos/altar respeitam `silenceDone` e o modo de movimento reduzido. Preservar esses ramos e os seletores atuais de A09.

O ramo calmo de interferência delega explicitamente ao atlas antigo: cobrir só o sprite ativo deixa uma regressão após a conclusão da missão. O mesmo vale para a cabine aberta. O cache de material e o cache/callback cinematográfico precisam usar contexto correto, sem restaurar a imagem antiga depois de carregar a variante.

Preservar IDs internos, inclusive `cloud_*`, e encaminhar nomes visíveis, descrições e ambientação narrativa ao contrato mestre. O Canal conserva água/condensação e a Flauta forma passagens nas condensações específicas. Transformar a paisagem em mar de poeira não autoriza pintar apoio firme sobre céu/água sólida. A topologia suspensa mantém o topo caminhável, a passagem futura e a profundidade bloqueada distintos. Nomes públicos permanecem inicialmente; este passe não cria renomeações.

## Integridade e conclusão verificável

- PNG RGBA; props com fundo alpha zero; materiais com conteúdo opaco e gutters transparentes. Preservar nearest-neighbor, recortes, escala percebida, pivôs e bases dos estados.
- Mesmos mapas, sólidos, portas, gates, coordenadas, flags, recompensas, save e co-op. Preservar os seis alinhamentos de entrada/retorno já existentes, o fechamento do anel suspenso e a recuperação de posições antigas.
- Não acrescentar pilhas altas sobre células livres, remover corredor com uma pintura, ocultar telegraphs ou criar falsa continuidade entre topo e vazio. Sombra de contato não deve simular buraco.
- Comparar hashes de A11/A12 e dos atlas compartilhados: os globais permanecem intactos. C1/C2 devem conservar as mesmas imagens e seletores.
- Capturar todos os mapas C3 e estados relevantes, incluindo clube, oficina, elevador fechado/aberto, Canal concluído, Terraço, Último Torii e Núcleo. Rever também fundos de diálogo e retorno de menu/load.
- Repetir a suíte de geometria e os testes existentes de runtime/save/input/co-op após integrar as variantes. Passar testes estáticos ou visualizar uma folha não equivale a campanha jogada ou teste físico.
- Encerrar o lote quando os106 recortes e27 vínculos adicionais estiverem integrados ou explicitamente reaproveitados, sem retornos à arte anterior por cache/fallback e sem alterações nos20 recortes globais protegidos.
