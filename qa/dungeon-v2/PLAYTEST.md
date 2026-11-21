# Calabouço 1.12 — evidências de calibração

Build: `ad32edf6d1102a5440be2601b4ef44f35393d6f6eb4455e1613f69e7c04cca22`.
Meta humana aprovada:15–20min com escalada gradual. Candidato preserva1.11 (main871e0f3), sem efeitos de iluminação.

## Comparação de pressão

Bot simples com seed97, passo30Hz, save real da campanha concluída (seis personagens nível7), ações/IA/dano/cura reais. As durações da tabela incluem os descansos automáticos; a tela de resultado mostra somente tempo de combate. Duração limitada a20min; quem chegou ao limite pode durar mais. O bot não domina todas as armas, não mede diversão e não comprova igualdade entre personagens. Nas linhas ended=true, hp e tapes já refletem a restauração da campanha após finishRun, não o saldo no instante da derrota. Sem bypass deHP/dano no benchmark; testes de60ondas usam eliminações controladas separadamente.

| Líder inicial | Solo antes | Solo novo | Coop novo | Onda novo solo/coop |
|---|---:|---:|---:|---|
| franco | 12:19 | 16:17 | 18:56 | 39/41 |
| ryuchi | 10:59 | 12:09 | 17:21 | 32/39 |
| alt | 11:24 | 11:08 | 17:11 | 30/39 |
| katana | 10:49 | 13:48 | 17:41 | 34/39 |
| synth | 10:51 | 17:12 | 20:00+ | 37/43 |
| percussion | 18:41 | 20:00+ | 20:00+ | 45/44 |

Mediana observada solo: 15.0min (valores censurados em20min).

Mediana observada coop: 18.3min (valores censurados em20min).

O candidato desacelera a escalada (intensidade0,72solo/0,90coop) em vez de alongar artificialmente HP ou acelerar golpes. Variação por arma permanece; o arqueiro/katana exigem validação humana específica. Limite de inimigos e avisos evitam pressão ilegível no mobile. Não prometer que toda formação sobreviverá15min.

## Cobertura e limites

- 148/148 verificações estáticas.
- 12 verificações novas de regras/recursos/legacy, com12mil composições.
- 7 cenários de runtime:60ondas solo,60coop, avisos antes do surgimento, posição revalidada, desconexão/reconexão, mochila/energia, save parcial, esquivaP2, confirmação simultânea, HUD e botão de descanso.
- Toque simultâneo real viaCDP para movimento+ataque, esquiva e botão de44px em390×844 e844×390. GamepadAPI simulado; nenhuma alegação de controle/aparelho físico testado.
- A saída próxima da entrada reproduziu encerramento involuntário nos dois controles. Mudou para extremo norte; mesmo teste passou.
- Os relatórios de regressão do pós-jogo e campanha ficam em suas pastas próprias. O placar é local ao save. Histórico antigo separado das regras novas.

## Próximo playtest humano

Jogar15–20min em telefone físico e dois controles: legibilidade após10ondas, tempo para reagir aos avisos, uso de cura, conforto de toque e diferença entre armas. Registrar onda, duração, formação, KOs e motivo da derrota. Nenhum placar online ou novo boss foi introduzido.

Revisão independente final: sem novo achado funcional nos deltas de curva/saída/botão; limites das medições e restauração de recursos explicitados.

## Publicação verificada

- [PR24](https://github.com/ryusarto/Torii-Hutukara/pull/24), integrado em `f0ca922a079b97389149ef59cac88b74abdca1a6`.
- [Gameplay CI](https://github.com/ryusarto/Torii-Hutukara/actions/runs/44864424508) e [integração visual](https://github.com/ryusarto/Torii-Hutukara/actions/runs/44864424568): sucesso no head `2711feb9754f5166acb335698260494be360cdfb`.
- [Publicação](https://github.com/ryusarto/Torii-Hutukara/actions/runs/44864808492): sucesso. HTML portátil disponível no artefato desse run.
- [Site público](https://ryusarto.github.io/Torii-Hutukara/): versão1.12.0 e SHA da fonte conferidos, hash/bytes do índice conferidos, PNGs dos inimigos decodificados, onda concluída com410pontos, derrota e nova tentativa aprovadas. Relatório `PAGES_VERIFICACAO.json`.
- Os sete cenários novos também passaram contra o site público: `BROWSER.json` registra o metadado real de publicação; capturas mobile atualizadas. Inclui60ondas por modalidade com eliminações controladas, e controles/ataque reais nos cenários de toque.
- Nenhum teste acessou saves pessoais do jogador. Não houve teste em aparelho ou controle físico.
