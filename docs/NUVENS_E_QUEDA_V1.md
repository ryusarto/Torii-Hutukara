# Mar de Nuvens: reconstrução e queda

Pedido do autor de 20/11/2026, implementado sobre a fonte main `7553828a669d33921940f5b8d1a99923636485a2` / Beta 1.7.1. Módulo aditivo `game/source/chapter-03/cloud_world_v1.js`, carregado após a arte e os cenários atuais. A base HTML histórica não foi editada.

## Regra e apresentação

Somente o mapa `cloud_sea` restitui os materiais de nuvem/céu originais da biblioteca V2, por submanifesto e atlas próprios. O tema global desértico continua nas demais áreas. Terraço e Último Torii continuam estruturas de pedra e sucata suspensas; os capítulos anteriores permanecem com sua direção própria.

As duas passarelas da Flauta dos Ventos e a plataforma do Tambor do Horizonte recebem uma construção em sequência: as primeiras colunas condensam antes das seguintes. Cada célula percorre os oito quadros desenhados no atlas de reconstrução. O apoio físico surge após 0,69 s de condensação por célula, em sincronia com a parte densa do sprite; antes disso, o trecho ainda é abismo. O conjunto estabiliza em menos de dois segundos. Uma segunda interação durante a mesma construção não cria outro processo.

Os registros `G.c3.cloudPathA`, `cloudPathB` e `cloudPlatform` conservam seus significados e IDs. A ação musical aceita é registrada duravelmente desde o início; o progresso visual e o apoio parcial pertencem ao estado temporário. Salvar, exportar ou sair enquanto a passagem se forma não cria um save sobre uma ponte inexistente: ao recarregar, a passagem já conquistada está estável. A atualização de outras missões não antecipa o apoio das células ainda em formação.

## Queda mortal

Em `cloud_sea`, o centro de P1 ou P2 atravessar a borda caminhável para um tile de céu inicia uma queda de 0,85 s. O sprite atual do personagem desce, reduz de tamanho e perde opacidade, sem trocar sua identidade, máscara ou atlas. Caminhada e esquiva usam subpassos de no máximo 0,075 tile; uma esquiva longa não atravessa um trecho ausente sem cair. Paredes e móveis continuam sólidos. A regra de abismo não foi estendida a NPCs, inimigos, seguidores automáticos ou aos outros mapas.

Durante a queda, movimento e ações ficam suspensos; é possível pausar. A formação e a alternância de P2 ficam fixas até terminar a queda. Se o controle de P2 desconectar, a animação capturada continua visível. A correção automática de posição do coop não puxa o personagem de volta da queda, e seguidores não são colocados no abismo. O guard da aproximação também preserva o intervalo em que os cantos de P2 já tocam o céu, mas seu centro ainda está apoiado: a sincronização entre quadros não o devolve continuamente à borda. Paredes reais, spawn com centro inválido e mudanças de área/jogo/membro continuam usando a recuperação existente.

Ao terminar, somente o HP da vítima é zerado e a tentativa compartilhada termina pelo `showDefeat()` existente. O menu de derrota oferece o fluxo normal de checkpoint/restauração. Os outros integrantes mantêm seus HP até esse fluxo. A coordenada registrada ao salvar/exportar durante a queda e ao exibir derrota é um ponto de apoio seguro, nunca o céu usado pela animação.

No pós-jogo, viagens e entrada no calabouço ficam bloqueadas enquanto há queda, mesmo com os FX desligados. A guarda de PostGame.canTravel é instalada de modo idempotente no init, depois da inicialização do último módulo, preservando contexto, argumentos e retorno fora da queda. O carregamento também é testado com a declaração const PostGame posterior ao módulo Cloud, sem acesso antecipado à sua zona temporal.

## Ciclo de vida e API

`CloudWorldV1` expõe `ready()`, `clock`, `builds`, `fall`, `active()`, `sync()`, `isFalling(body)` e `startBridge(which)`. `enabled=false` desativa apenas o desenho do incremento; a construção física e as quedas continuam ativas. O estado temporário é limpo ao mudar mapa, jogo ou checkpoint. Pausa congela construção e queda.

Integração de assets: `__CLOUD_WORLD_ASSETS__` recebe `rebuild`, `originalA01` e `originalA04`; `__CLOUD_WORLD_MANIFEST__` recebe `rebuild` (grade, quadros e FPS) e `original.items` (recortes da biblioteca V2). Não é necessário duplicar os PNGs originais. Fontes, prompts e exportação da nova sequência são responsabilidade da produção visual, em `assets/cloud-world/v1/` e `design/environment-world-v1/`.

## Evidências deste módulo

- Parsing com `node --check`: aprovado.
- `node qa/cloud_world_v1.cjs`: **20 testes de regras aprovados**. Abrangem relíquias, persistência, apoio gradual, atualização de mundo, repetição, pausa, bordas por caminhada/esquiva, paredes, P2 em passos pequenos com sincronização entre quadros, recuperação fora da borda permitida, derrota/retry, export seguro, formação, seguidores e oito células do atlas.
- Testes isolados de regras não comprovam integração visual ou gameplay completo. A revisão independente usa a build compilada e o navegador real em `qa/environment_world_browser.cjs`; os resultados finais e o hash do executável pertencem ao relatório de integração.

Não foi realizada campanha humana completa nem validação em controles/celulares físicos por esta implementação.
