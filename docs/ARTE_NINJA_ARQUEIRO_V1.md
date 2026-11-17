# Ninja e Arqueiro · pacote V1 · Beta 1.1

O desenho aprovado de Ryuchi Ninja/Katana (`katana`) e Franco Arqueiro (`alt`) foi mantido em todas as folhas. Esta entrega não inclui novos sprites dos protagonistas principais, do Percussionista ou do Sintetizador.

## Cobertura

| Conteúdo | Quantidade |
|---|---:|
| Atlas PNG RGBA | 24 |
| Sequências: 2 personagens × 12 estados × 4 direções | 96 |
| Quadros individuais: 8 poses + fechamento por sequência | 864 |
| Retratos: 8 expressões por personagem | 16 |

Estados: `idle`, `walk`, `run`, `roll`, `attack_1`, `attack_2`, `attack_3`, `skill`, `advanced`, `signature`, `hurt`, `defeat`. Direções: frente (`down`), esquerda, costas (`up`), direita. Célula 256 × 256; pivô 128,224; atlas 2304 × 1024, nove colunas e quatro linhas. Escala uniforme, sem esticar eixos ou girar poses por código. Fundo transparente real; redimensionamento por vizinho mais próximo.

As sequências contêm oito poses desenhadas. O quadro 08 é cópia do 00 para registrar o fechamento; na derrota, repete o 07 no chão. O runtime reproduz 00–07 e usa o estado de ação real para voltar à espera. Corrida e caminhada usam deslocamento para escolher o quadro. O rolamento usa o progresso do dash já existente, sem alterar distância, invulnerabilidade ou cooldown.

O Ninja não usa nem carrega máscara. O Arqueiro a prende ao lado direito do cinto; o rosto permanece descoberto, inclusive nos retratos. A máscara acompanha o corpo nas poses de rolamento. Não há sobreposição de máscara na cabeça desses dois personagens.

## Integração

`game/source/chapter-03/ninja_archer_art_v1.js` é injetado depois das camadas de controle e gameplay. Intercepta somente o desenho de `alt` e `katana`, além de observar ações aceitas para escolher o sprite. Ataque, técnica, técnica avançada, especial e dano têm registros separados por jogador, com identidade e direção. Troca de personagem, área ou objeto de save cancela o registro. Um botão bloqueado por cooldown não reinicia a animação. Durante diálogo, os relógios de ação ficam parados.

Os três ataques do Arqueiro são variações visuais do disparo existente; não introduzem três valores novos de dano. Os golpes do Ninja acompanham seu combo atual. As folhas de derrota ficam disponíveis para produção e prévia; o gameplay mantém a troca imediata por um companheiro vivo e a tela de derrota, sem impor uma espera nova para exibir todos os quadros.

O desenho dos quatro outros personagens é delegado integralmente ao render anterior. O menu de equipe usa o retrato neutro; diálogos usam a expressão informada em `line.expression`, ou `speaking`. Os atlas das variantes não são solicitados na tela inicial: começam a carregar quando esses personagens aparecem. Imagens de ação são carregadas sob demanda e o cache mantém até oito atlas decodificados. Em caso de carregamento pendente, usa a nova espera; o render anterior continua como fallback se nem a espera estiver disponível.

## Arquivos e backup

- `assets/variantes/ninja-arqueiro-v1/`: atlas, retratos, manifesto, prévia offline e validação. Abra `PREVIA.html` para comparar ação/direção, pausar e avançar quadros.
- `production/pack_ninja_archer_sprites_v1.py`: recorta e normaliza as folhas originais preservadas no backup.
- `production/export_ninja_archer_sprites_v1.py /destino`: reconstrói os 864 PNGs individuais a partir dos atlas publicados, sem precisar das folhas originais.
- `design/variantes/ninja-arqueiro-v1/PRODUCAO.json`: prompts e hashes de procedência das 26 folhas geradas.
- Dropbox/T&H → Assets → Torii & Hutukara → Variantes jogaveis → ninja-arqueiro-v1: originais, referências, pacote com quadros individuais, ZIP e prévias. O Drive não faz parte desta entrega, por solicitação do autor.

O repositório é a fonte oficial de código e assets integrados. ZIPs, folhas originais e PNGs individuais não são duplicados no Git. As imagens são protegidas por `LICENSE-ASSETS.md`.

## Verificação

`ruby game/source/chapter-03/build_alpha.rb` gera o HTML portátil; `validate_alpha.rb` verifica sua integridade. `qa/ninja_archer_art.cjs` verifica os 864 quadros na versão hospedada e a separação de estado dos jogadores. `qa/input_regression.cjs` cobre movimento, dash, colisão, co-op, touch e rotação. Resultados da entrega ficam em `qa/beta-1.1.0/`.

Esses testes usam controles simulados em navegador isolado. Não substituem a avaliação de fluidez em um telefone real e dois controles físicos.
