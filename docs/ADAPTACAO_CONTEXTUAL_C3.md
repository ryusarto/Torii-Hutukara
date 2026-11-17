# Identidade visual dos músicos · paleta canônica de terra e sucata

O autor escolheu uma troca de paleta, preservando os frames, para aproximar Ryuchi Percussionista e Franco Sintetizador da direção de terra, desgaste e sucata do Capítulo 3. Em seguida, determinou que essas cores substituem as anteriores. Por isso a entrega final usa uma única paleta canônica desses dois papéis; não mantém seleção de contexto, versão standard nem cópias paralelas de animações.

## O que muda

As cores de vestuário e instrumentos são remapeadas localmente nos PNGs por uma receita registrada. Cabeça grande, pernas curtas, silhueta chibi, instrumentos, poses, posição dos pixels, máscaras e transparência permanecem preservados. Pele, rostos e os pixels protegidos das máscaras continuam auditados como inalterados.

A adaptação não aplica filtro sépia à tela ou ao cenário. Não muda o desenho dos quatro outros integrantes, NPCs ou os demais assets dos Capítulos 1 e 2. Caso estes dois músicos apareçam no estúdio ou em áreas revisitadas, usam sua identidade canônica nova; a região não altera automaticamente a paleta. A escolha com/sem máscara continua independente.

Não há mudanças em gates, progressão, saves, colisão, velocidade, dano, cooldowns ou custos. O runtime testado continua com `MusicianArtV1`, seus registros separados de P1/P2 e o seletor de máscara; não contém API contextual ou prefixo de chave `c3_desert__`.

## Contagem correta

| Conteúdo final | Quantidade |
|---|---:|
| Atlas canônicos de animação | 52 |
| Sequências direcionais | 208 |
| Poses por sequência | 8 |
| Poses de animação | 1.664 |
| Retratos canônicos individuais | 32 |
| Folhas-fonte nativas | 56 |

A troca de cor não cria novas poses desenhadas. Não deve ser anunciada como 416 sequências ou 3.328 frames. A aplicação mantém os caminhos e chaves dos 84 PNGs usados pelo jogo: 52 atlas e 32 retratos.

## Receita, auditoria e promoção

O manifesto do pacote referencia `paletteRecipe` e `geometryAudit`. A receita documenta o remapeamento; a auditoria registra os pares anteriores/promovidos, dimensões, hashes dos PNGs e hashes do canal alpha. Antes da promoção, verificar `geometryEqual`, diferença máxima de alpha zero e nenhum pixel protegido alterado. A revisão artística também confere que os grupos de sombreamento não colapsaram.

Depois de promover e validar os PNGs novos, as versões de paleta anteriores podem ser removidas, como autorizado pelo autor. A auditoria retém seus hashes históricos. Nos registros dos arquivos usados pelo jogo, `canonicalFile` (ou `baseFile`) identifica o caminho promovido; `contextSha256` identifica os bytes novos, apesar do nome histórico desse campo. O validador estático vincula esse hash ao PNG canônico presente e verifica dimensões, transparência e a evidência geométrica, sem exigir a imagem antiga após sua remoção.

A geometria foi comparada durante o processamento de paleta. Essa auditoria não substitui a inspeção de fluidez, mãos, instrumentos e transições nos atlas originais nem os testes do render real.

## Integração preservada

A Beta 1.3 preserva NinjaArcherArtV1, ProtagonistArtV5 e Cenários V2 do `main` atual. O builder incorpora somente a paleta canônica e inclui receita/auditoria no manifesto de hashes. Os arquivos desses músicos usam caminhos completos como chave de origem, evitando colisão entre retratos com o mesmo nome (`neutral.png`, por exemplo).

Build, validador, prévia, testes dos três módulos de arte e regressões de gameplay/controles devem ser executados novamente sobre os PNGs promovidos. Os relatórios indicam quais verificações foram automáticas e quais foram visuais.
