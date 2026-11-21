# Revisão de cenário, movimento e NPCs · Beta1.8

Base de integração: main7553828, Beta1.7.1. A revisão atende aos defeitos relatados durante o teste do autor: planta sem vaso, sofá na orientação errada, corrida entrecortada, fundos degradados e NPCs sobrepostos ao mobiliário ou sem presença no mundo.

## Implementação

- Estúdio: vaso de terracota e planta próprios, sofá redesenhado com encosto a oeste e assentos voltados para o tapete. Reserva física3×6 em(2,6), ordenação pelo contato com o chão. Rotas até mesa/saída continuam verificadas; base histórica não foi editada.
- Franco/Ryuchi principais:64 intermediários autorados,12 poses por direção/variante e fechamento. Todos128quadros originais de corrida preservados byte a byte. Fase contínua entre caminhada/corrida, dependente do deslocamento real; ciclo520ms separado da contagem de desenhos. Parede/pausa/load/coop possuem verificações próprias.
- Diálogos: original2172×724 substitui atlas reduzido1086×362 (painéis724×362 em vez de362×181). Floresta tem novo panorama1672×941 sem a borda/fragmento de outro painel da imagem histórica550×200. Fontes1672×941 do deserto preservadas. Escurecimento duplicado removido; contraste do texto permanece na própria interface.
- NPCs: estados cosméticos separados do save, atenção ao jogador, trabalho, pequenos gestos, percurso local seguro e retorno quando a arte suporta marcha. Sem caminhada frontal deslizando, rotação de foto ou bob do sprite inteiro. Ema/criança/comerciante/arquivista/músico/guardião da cidade recebem24poses novas. Belga é deslocado para fora da bancada da loja. Interações e IDs permanecem os existentes.

A própria composição final deve passar geração, validação, unidades, regressões de controles/gameplay e navegador antes de integração automática. Evidências de execução identificam hash do HTML; capturas estáticas não são prova de fluidez ou de campanha humana.

## Arte e proveniência

Produção pela ferramenta embutida ImageGen; sem API/CLI de geração. Fontes RGBA e prompts preservados; exportação técnica recorta/escala/ancora, sem pintar poses, trocar cores ou misturar quadros.

- Corrida: [manifesto e prompts completos](../assets/protagonistas/v6-locomocao/README.md).
- Estúdio: [artes, fontes e recortes](../assets/studio/v1/manifest.json).
- Cidade: [24gestos e contrato](../assets/npcs/vida-v1/manifest.json).
- Floresta: [panorama](../assets/dialogue/v2/forest.png).
- IA: [comportamento, limites e lacunas](NPC_LIFE_V1.md).

Especificações dos prompts adicionais:

1. **Sofá**: identidade do sofá de couro bordô original, manta creme/ferrugem, almofada verde e fones; perspectivaJRPG3/4, eixo longo norte-sul, encosto a oeste e assentos a leste. Uma peça isolada RGBA, sem chão, interface ou rotação da imagem antiga.
2. **Vaso**: planta doméstica verde compacta com caules dentro de vaso de terracota, borda e terra visíveis; vaso no terço inferior, legível em36×54. Estilo de pixels do mobiliário, sem raízes/rochas/solo externo e fundo transparente.
3. **GestosC1**: preservar as seis identidades de npcCity1_10, grade4×6 transparente; neutro, olhar, piscar e gesto de personalidade. Ema/cajado, criança/aceno, comerciante/bolsa, arquivista/livro, músico/instrumento, guardião/cinto. Pés estáveis, sem marcha/bob ou figurino novo.
4. **Floresta**: reconstruir referência histórica em panorama16:9, ponte suspensa sobre rio/cascata, grandes troncos/raízes, vegetação azul/ciano/verde e arara vermelha. Sem borda/strip lateral, pessoas pintadas, blur, vinheta forte ou texto; floresta mágica preservada.

## Limites

Oito poses antigas e quatro novas compartilham o mesmo ciclo; detalhes finos das máscaras têm microvariações de desenho que ainda se beneficiam do teste perceptivo do autor. Não foi realizada nova campanha humana completa nem validação de conforto/desempenho em telefone ou controle físico. Há NPCs secundários com orientação/gestos procedurais ou com uma pose por direção; o inventário da IA diferencia a cobertura real de futuras pranchas autoradas. As tarefas paralelas de nuvens/fachadas/pós-jogo pertencem às próximas entregas e não são anunciadas como parte desta versão.
