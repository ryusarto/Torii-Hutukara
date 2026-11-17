# Percussionista e Sintetizador · pacote V1 · Beta 1.3

Ryuchi Percussionista (`percussion`) e Franco Sintetizador (`synth`) recebem animações próprias no padrão chibi aprovado: cabeça grande, tronco compacto e pernas curtas. Cada folha reúne um personagem, uma ação e uma versão de máscara. As linhas seguem frente, esquerda, costas e direita; as oito colunas são poses consecutivas.

## Cobertura

| Conteúdo | Quantidade entregue |
|---|---:|
| Atlas PNG RGBA de animação | 52 |
| Sequências: 2 personagens × 2 variantes × 13 estados × 4 direções | 208 |
| Poses individuais: 8 por sequência | 1.664 |
| Retratos: 2 personagens × 2 variantes × 8 expressões | 32 |

Estados: `idle`, `walk`, `run`, `roll`, `attack_1`, `attack_2`, `attack_3`, `skill`, `advanced`, `signature`, `hurt`, `defeat` e `performance`. Expressões: neutral, speaking, happy, surprised, determined, angry, hurt e sad. Célula de 256 × 256 e pivô comum 128,224; atlas de 2.048 × 1.024, oito colunas e quatro linhas.

As oito poses são desenhadas pela ferramenta de imagens. Recorte, escala uniforme por vizinho mais próximo e posicionamento organizam os quadros para o runtime; o empacotamento não fabrica poses intermediárias. A derrota mantém o último quadro no chão. O estado `performance` fica disponível para cenas musicais e prévia, sem introduzir uma ação de combate nova.

## Integração

`game/source/chapter-03/musician_art_v1.js` é injetado depois dos módulos Ninja/Arqueiro, Protagonistas V5 e Cenários V2. Atende somente a `synth` e `percussion`, delegando os demais ao render anterior. Ataques e técnicas são selecionados a partir de ações aceitas pelo gameplay, com registros separados para P1 e P2. Botão bloqueado por cooldown não reinicia uma animação.

A seleção visual usa o estágio de Oscilador de Franco e o combo de Ryuchi, sem criar novos valores de dano. Rolamento usa o progresso real da esquiva, sem alterar distância, invulnerabilidade ou cooldown. Troca de personagem, área ou save cancela registros; os relógios ficam parados durante diálogo.

Os encontros de recrutamento `c3_synth_npc` e `c3_percussion_npc`, o menu de equipe e os diálogos usam o mesmo pacote. O render conserva fallback enquanto uma imagem carrega; ações são carregadas sob demanda e o cache decodificado é limitado.

O padrão dos músicos continua `unmasked`, preservando a apresentação existente. `MusicianArtV1.setVariant('synth'|'percussion', 'masked'|'unmasked')` permite conferir as duas versões sem alterar o schema de saves. A flag de máscaras dos protagonistas não é aplicada automaticamente a estas versões dos personagens.

## Arquivos

- `assets/variantes/percussao-sintetizador-v1/`: atlas, retratos, `manifest.json`, `PREVIA.html` e `VALIDACAO.json`.
- `design/variantes/percussao-sintetizador-v1/`: folhas-fonte, referência aprovada, prompts, hashes e procedência.
- `production/`: ferramentas de empacotamento e exportação de PNGs individuais.
- `qa/beta-1.3.0/`: evidências e resultados de validação da entrega.

O GitHub é a fonte oficial desta entrega. Os frames individuais podem ser reconstruídos a partir dos atlas. As imagens seguem as proteções de `LICENSE-ASSETS.md` para Ryuchi, Franco, suas versões e as máscaras Torii.

## Verificação da entrega

Os resultados efetivamente executados ficam nos relatórios de `qa/beta-1.3.0/`, separados de avaliações visuais. A cobertura estrutural, a prévia e o render integrado das 208 combinações foram executados sobre a nova paleta. Consulte `qa/beta-1.3.0/REVISAO_ENTREGA.md` para os resultados e os limites da verificação.

```bash
ruby game/source/chapter-03/build_alpha.rb
ruby game/source/chapter-03/validate_alpha.rb
```

O builder recusa manifesto marcado como incompleto. A build nova usa `game/builds/beta-1.3.0/`; a base 1.1.2 e builds anteriores permanecem preservadas. Build portátil é gerada, validada e publicada pelo workflow; não é commitada como substituição de uma build histórica.

## Paleta canônica

As cores finais de terra e sucata substituem as anteriores por decisão do autor. A troca preserva as poses, geometria, alpha, pele e pixels protegidos das máscaras; não cria animações adicionais nem contexto selecionável. O jogo usa os mesmos 52 atlas e 32 retratos com as cores promovidas. Receita e auditoria ficam nos metadados `paletteRecipe`/`geometryAudit`; ver `ADAPTACAO_CONTEXTUAL_C3.md`.
