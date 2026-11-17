# Estado do projeto

Atualizado em 17 de novembro de 2026.

## Versão jogável atual

**Beta 1.2** — os três capítulos estão reunidos em um único HTML portátil. A base 1.1.2 permanece preservada. Os resultados de teste estão em `qa/beta-1.2.0/`, `qa/ritmo/` e `qa/combate/`.

Franco e Ryuchi principais usam os atlas V5, com/sem máscara por progressão. Ninja/Arqueiro e músicos preservam suas próprias artes. Resultados da integração em `qa/beta-1.2.0/PLAYTEST.md`.

### Critério de Beta (verificado em 14/11/2026)
| Critério | Como foi verificado | Resultado |
|---|---|---|
| Nenhuma missão travada | jornada completa automática, Usina primeiro e Canal primeiro | ✅ |
| Nenhuma perda de save | 4 jornadas salvando e recarregando a página a cada 2 min | ✅ progresso idêntico (só a formação é completada) |
| Nenhum objetivo preso | as mesmas jornadas, com detector de objetivo parado | ✅ |
| Sem voltar ao menu para continuar | Capítulo 1 → 2 → 3 contínuos | ✅ |
| Sem travamento de luta | correções de projétil, integrante ativo e formação | ✅ |

Ainda dependem de pessoas: playtest em iPhone/Android físicos, dois controles físicos e a sensação de combate.

Site provisório: https://ryusarto.github.io/Torii-Hutukara/. O aviso PC/MOBILE aparece por quatro segundos na entrada. O fluxo de publicação e suas limitações estão em `docs/PLAYTEST_SITE.md`.

## Implementado

- Jornada do início ao epílogo, com atalhos de teste para os capítulos 2 e 3.
- Salvamento local, exportação, importação, migração e checkpoints.
- Capítulo 3 com Distrito da Distorção, Clube Contratempo, Usina de Retorno, Canal Suspenso, oficina, elevador, Mar de Nuvens e Último Torii.
- O Metrônomo e O Silêncio como confrontos finais.
- Seis faixas do ato final incorporadas ao HTML.
- Maia, Nara, Ciro, Vega, Dimas e NPCs comuns com folhas de movimento próprias.
- Cinco atlas ambientais para postes, mobiliário urbano, oficina, canal e elevador.
- Progressão do canal e da usina reagindo às ações concluídas.
- Passagem narrativa direta do fim do Capítulo 2 para o Capítulo 3.
- Passagem do Clube Contratempo ao Elevador do Céu sem bloqueio circular.
- Piso detalhado, placas e marcos visuais no Distrito da Distorção.
- Ryuchi percussionista com movimentação e repertório de combate próprios.
- NPCs do Capítulo 3 com animação ambiente e reação à proximidade.
- Tela de equipe com função, nível, XP, experiência parcial para reservas e recuperação para aliados tardios.
- Entrada caminhável no Núcleo do Silêncio, inclusive pelo retorno do checkpoint final.
- Recrutamento posterior às cenas e apresentações diferentes conforme a ordem das rotas.
- Franco Sintetizador com combate territorial próprio: oscilador, pads e filtro.

## Playtest humano pendente

- Confirmar ergonomia mobile em iPhone/Safari e Android físicos, em pé e deitado.
- Confirmar dois controles físicos no mesmo computador e no celular.
- Unificar os kits completos de habilidades entre Jogador 1 e Jogador 2, que ainda tem ações simplificadas.

- Jornada integral em navegador desktop.
- Jornada integral em celular.
- Escala, colisão e ordem visual dos novos sprites em todas as salas.
- Todas as variações de ordem entre Usina e Canal.
- Vitória, derrota e repetição dos dois chefes finais.
- Migração de um save real da versão 1.1.2.
- Teste em pelo menos três computadores diferentes.

## Próximo ciclo

1. Playtest da Beta 1.1.1 com pessoas de fora (usar `?ritmo` e coletar os relatórios).
2. Discutir os seis kits e as reduções de deslocamento propostas em `design/COMBATE_E_RITMO_PROPOSTA.md`.
3. Refinar as técnicas completas e encurtar quests preservando as revelações centrais.
4. Produzir as versões cyberpunk de Belga, Colli e Mazza com identidade preservada e PNG transparente.
5. Estabilizar a Beta e congelar conteúdo antes da candidata a lançamento.

## Critério de pronto

Uma versão só avança para Beta quando não houver bloqueio de missão, perda de save, personagem sem sprite, objetivo preso em etapa concluída ou necessidade de voltar ao menu para continuar a história.

## Correções de direção da Beta 1.0.1

Prólogo, permissões de combate do Distrito, XP/save, geometria dos campos, patrulhas, dano/aura/cura de P2 e camadas mobile foram corrigidos. Cenários e reprodução em `qa/beta-1.0.1/PLAYTEST.md`. O inventário de arte e os novos inimigos propostos estão em `docs/DIRECAO_ARTE_E_INIMIGOS.md`; a integração V5 está preservada na Beta 1.2.

## Integração de correções de gameplay na Beta 1.2

As correções de progressão e coop foram reconciliadas com a Beta 1.2, preservando tanto os protagonistas V5 como Ninja/Arqueiro e suas animações independentes de P1/P2. Novos inimigos e os demais pacotes em produção continuam separados. Resultados atuais em `qa/beta-1.2.0/PLAYTEST.md`.
