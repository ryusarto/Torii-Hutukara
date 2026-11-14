# Roadmap

## Agora — estabilizar a Alpha 1.1.x

- [x] Criar sprites próprios para NPCs do Capítulo 3.
- [x] Integrar postes e objetos detalhados.
- [x] Corrigir objetivo persistente do Canal Suspenso.
- [x] Corrigir presença e falas de Nara e Ciro.
- [x] Manter passagem do Capítulo 2 para o 3 dentro do jogo.
- [x] Corrigir a passagem do Clube Contratempo ao Elevador do Céu.
- [x] Diferenciar visualmente e mecanicamente Ryuchi percussionista.
- [x] Aplicar pisos detalhados, placas e marcos visuais ao Distrito.
- [x] Adicionar animação ambiente aos NPCs do Capítulo 3.
- [ ] Testar os três capítulos numa jornada contínua sem ferramentas de QA.
- [ ] Testar Usina primeiro e Canal primeiro.
- [ ] Validar saves novos, migrados, exportados e reimportados.
- [ ] Testar teclado em Windows/macOS/Linux.
- [ ] Testar viewport móvel e controles de toque existentes.
- [ ] Ajustar escala e sobreposição de todos os novos props no mapa real.
- [ ] Verificar contraste dos marcadores em todas as superfícies.

## Próxima versão — Alpha 1.2

- Animação narrativa de Nara saindo e chegando ao canal.
- Mais reações ao encontro das versões de Franco e Ryuchi.
- Falas de reserva para manter os seis personagens presentes no final.
- Estados visuais adicionais do Contratempo antes e depois do show.
- Melhorias na oficina e demonstração segura da Flauta dos Ventos.
- Atalhos e marcos visuais mais fortes no Distrito.
- Revisão de colisões e corredores com os novos objetos.
- Balanceamento de duração e dano de O Metrônomo e O Silêncio.
- Tela de equipe com três integrantes ativos e reservas, sem perder a identidade atual do combate.
- Nível, experiência e progressão legíveis por personagem.
- Experiência parcial para reservas e mecanismo de recuperação para personagens atrasados.
- Funções de combate claras e técnicas combinadas entre personagens compatíveis.
- Seguidores com trilha de movimento e NPCs com pequenas rotas e agendas locais.

## Beta narrativa

- Revisão completa de diálogos dentro da caixa real do jogo.
- Remoção de repetições e falas explicativas demais.
- Reações específicas conforme a formação ativa.
- Passes de ritmo: exploração, fala, puzzle, combate e silêncio.
- Revisão de acessibilidade de cor, áudio e movimento.
- Créditos, avisos de conteúdo e informações de autoria.

## Beta técnica

- Extração de mapas e quests para dados declarativos.
- Testes automatizados de todos os estados principais.
- Build web modular para hospedagem e build portátil para download.
- Compressão e deduplicação de áudio e imagens.
- Relatório de desempenho em computadores de entrada e celulares.

## Release candidate

- Jornada completa sem bloqueios de progressão.
- Nenhum NPC sem sprite ou nome definitivo.
- Nenhum placeholder visual ou textual.
- Saves compatíveis e recuperação documentada.
- Áudio normalizado e transições revisadas.
- Direitos e créditos de todos os assets confirmados.
- Pacote testado em outro computador sem arquivos externos.

## Possíveis mudanças futuras (decididas para depois)

- **Golpe no tempo da música:** bônus pequeno (dano, ressonância, efeito) para golpes dados na batida da faixa que está tocando. Plano técnico em `ANALISE_E_ROTEIRO_DE_CORRECAO.md`, seção 10: mapa de BPM por faixa, relógio do áudio, janela de ±120 ms, só bônus (nunca punição) e ajuste de atraso para fones Bluetooth. Adiado pelo autor em 14/11/2026 para priorizar playtest da versão atual.
- **Expansões por lançamento:** um mundo novo dentro do Hutukara a cada álbum (funk, trap, solos, The Whistles), com o mapa de mundos no fim do jogo.

## Depois do lançamento

- Correções críticas sem alterar saves.
- Modo de revisita e criação livre expandido.
- Possíveis extras somente depois de estabilizar o jogo principal.

