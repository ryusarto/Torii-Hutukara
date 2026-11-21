# Beta 1.9 — pós-jogo

Método: Chrome isolado, runtime efetivo da build, fixtures de estado e simulação de teclado/toque/Gamepad API. Nenhum save pessoal foi usado. Não equivale a uma campanha humana completa nem validação em hardware físico.

- `UNIT.json`: 48 verificações; 41 formações possíveis de 1–3 entre seis aliados, exclusão adicional do P2, 2.000 ondas determinísticas e normalização defensiva de save.
- `BROWSER.json`: 12 cenários, incluindo encerramento com recompensa única, viagens para 25 mapas com posições/carga válidas, 25 ondas com eliminações controladas via `hitEnemy`, pausa, retomada sem pontos duplicados, derrota causada pela IA, nova tentativa, saída, exportação da expedição e coop simulado.
- Contextos de telefone em 844×390 e 390×844, com agente de celular, `isMobile` e toque; interação real com os botões de viagem e expedição.
- Capturas da Fenda e do menu em dois formatos: evidência visual localizada, não prova de fluidez ou dificuldade de longa duração.
- Regressões de controles: 22 casos; de jogabilidade: 20 casos. Relatórios em `qa/beta-1.9.0/`.

Regras: arena fixa, inimigos/posições procedurais por semente, oito vivos e até 18 por onda, HP/poder crescentes e recorde local. Ao carregar, reiniciar a onda com seus pontos/HP iniciais. Concluir uma onda consolida os pontos; derrota e saída registram o resultado e recuperam a equipe no Torii. Não há XP/fragmentos permanentes ou ranking online.

Ainda avaliar em playtest humano: curva de dificuldade após muitas ondas, legibilidade no telefone físico e conforto com dois controles reais. O funcionamento automatizado não deve ser apresentado como balanceamento final aprovado.
