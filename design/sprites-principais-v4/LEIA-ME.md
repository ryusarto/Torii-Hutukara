# Sprites principais V4 — primeiro lote · 14/11/2026

## Estado: PARCIAL, para revisão visual

O limite da ferramenta integrada de geração de imagens foi atingido. Este pacote NÃO contém o conjunto inteiro solicitado e NÃO foi aplicado à build jogável. Nenhuma animação ausente foi substituída por uma cópia da caminhada ou de outro personagem.

Produzidos: Franco e Ryuchi principais, em quatro direções, com e sem máscara, para espera, caminhada, corrida e rolamento. Também foram produzidas oito expressões de Ryuchi em versões com e sem máscara. O corpo de Franco mantém a roupa vermelha/laranja e o de Ryuchi a jaqueta azul com touquinha de tecido.

Pendentes: ataque básico, técnica Z, técnica X, especial K, dano e derrota dos dois protagonistas; retratos de Franco com e sem máscara. Esses itens precisam de geração própria e revisão antes de integrar o conjunto inteiro ao jogo. A ferramenta informou renovação do limite em 14/11/2026 às 22:24, horário de São Paulo; disponibilidade depende do serviço. Existe alternativa de geração via API com chave própria, somente mediante escolha explícita do usuário.

## Arquivos e animações

- `originais/`: oito pranchas originais de 8 × 8 poses, preservadas.
- `retratos/`: prancha original de expressões de Ryuchi.
- `pacote/atlas/`: pranchas padronizadas, 2304 × 2048, com células de 256 × 256.
- `pacote/frames/`: PNGs individuais, separados por personagem, máscara, ação e direção.
- `pacote/retratos/`: retratos individuais de 256 × 256.
- `pacote/PREVIA.html`: abrir no navegador para comparar ações, direções e máscaras.
- `pacote/manifest.json`: ordem dos quadros, tempos, pivô e caminhos.
- `TORII_SPRITES_PRINCIPAIS_V4.zip`: pacote portátil do lote disponível.

Cada sequência tem oito poses geradas e um quadro 08 de fechamento idêntico ao 00. A reprodução contínua usa os quadros 00–07; o 08 registra a volta ao início. O rolamento é uma ação completa que termina na pose de prontidão. A derrota futura será uma ação única que segura a última pose, sem voltar artificialmente a ficar em pé.

Pivô comum: x=128, y=224. O empacotador usa escala constante por personagem, reposiciona os recortes, preserva os pixels com vizinho mais próximo e não pinta poses novas. Os PNGs originais permanecem intactos. A transparência, dimensões, ausência de quadros vazios e igualdade do quadro de fechamento são verificadas automaticamente. Isso não comprova que todas as transições de pose estejam visualmente perfeitas: a prévia permite conferir especialmente a passagem 07 → 00, contornos, simetria da máscara e consistência anatômica. A integração ao jogo exige esse playtest visual.

Exceção documentada: a prancha de rolamento de Ryuchi veio com espaçamento irregular entre linhas. Seu recorte usa limites específicos, isola o componente conectado da pose para excluir fragmentos das linhas vizinhas e normaliza a escala uniformemente por linha pela pose final em pé. Essa exceção está explícita no empacotador; o original continua preservado. A prévia GIF tem fundo de apresentação; os sprites e retratos PNG têm alfa transparente.

## Referências e reprodução

Foram examinados o repositório até o commit `675e672` e os três modelos GLB fornecidos. Os modelos não contêm skins ou animações. Nove vistas foram renderizadas no Blender como apoio de volume e encaixe, sem modificar os GLBs. `modelos-referencia/` contém essas vistas; os modelos originais permanecem no local do usuário.

Arte criada com a ferramenta integrada de imagens. `fontes.json` e `retratos.json` registram os prompts finais e hashes das pranchas. Referências: rostos e roupas aprovados, vista frontal dos GLBs e máscara canônica. Não houve reutilização de sprites de outros jogos.

Para reproduzir o empacotamento, instalar Pillow e executar `python3 production/pack_main_sprites.py` na raiz do repositório. Não é necessário gerar imagens novamente para reempacotar este lote.
