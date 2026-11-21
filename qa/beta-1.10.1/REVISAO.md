# Revisão geral 1.10 → 1.10.1

Executada em 20/11/2026 (São Paulo). Fonte portátil validada:
`3c9198a7505a5b01c3a8af93f7adfae421c3a0df713e523d5ffe6f1d2e86f939`.

## Correções

| Área | Defeito reproduzido | Resultado |
| --- | --- | --- |
| Fenda | Exportação recusada numa sessão nova, pois a área dinâmica ainda não existia | Importação normaliza antes de validar a área; arquivo inválido preserva sessão e armazenamento |
| Importação | Save anterior carregado numa sessão avançada mantinha NPCs recrutados ausentes e passagens já abertas | Mapas são reconstruídos antes da entrada na área importada |
| Save | Formação com Franco/Ryuchi KO e músico vivo acionava recuperação histórica, alterando área/HP; líder músico também era substituído | Músicos desbloqueados e escalados contam na sobrevivência; líder válido é preservado |
| Pós-jogo | MAPA/sistema permitiam substituir a derrota e iniciar Fenda para obter cura | Derrota mantém o retry mesmo quando só o herói que caiu está KO e seus parceiros continuam vivos; botões extras aparecem somente no menu principal realmente aberto |
| Nuvens | PAUSA touch e Options P1/P2 não respondiam durante queda | Pausam e retomam a mesma queda; diálogo, ritmo e título mantêm suas restrições |
| Coop | Desconectar P2 caindo desenhava o mesmo herói como seguidor e como queda | Uma representação mantém o herói/posição capturados, inclusive com FX desativados |
| Coop | Retorno automático não encontrava caminho quando P2 estava com cantos sobre o vazio | Retoma apoio válido antes do path; movimento voluntário ainda permite queda |
| Mobile | Toque em PAUSA acionava Equipe ao soltar, atravessando o menu recém-aberto | Abertura no clique nativo, com autorização/cancelamento e captura preservados |

Rótulos antigos de Alpha/Pré-Alpha foram atualizados para Beta/versão atual.
A base histórica e a chave de armazenamento foram preservadas.

## Jornadas contínuas

`qa/campaign_review.cjs` começou em **Novo Jogo** e percorreu os três capítulos até o epílogo e a tela de caminhos abertos. Não usou preview, teleporte, manipulação de HP ou flags para avançar. Usa movimento, interação, notas e combate reais por callbacks, com diálogo acelerado e atualização a 60 Hz simulados. O desenho é amostrado a cada oito quadros; isso não mede desempenho/FPS.

- Desktop, Usina primeiro: concluído; três recargas (Praça das Antenas, Usina, Terraço das Nuvens), sem diferença semântica de progresso.
- Mobile emulado, Canal primeiro: concluído; três recargas e cinco rotações durante a jornada, sem erros de JavaScript ou perda de progresso. O bot usa comandos de movimento/callbacks, não gestos touch em cada passo.
- A construção das nuvens é aguardada conforme o aviso do jogo; atravessar antes da superfície pronta continua podendo causar queda.

Os relatórios `CAMPAIGN_*_RELOAD.json` registram áreas, objetivos, eventos, recargas, hash e estado final. A comparação inclui posição, HP/formação/líder, inventário/ressonância, derrotas/descobertas, escolhas, localização do checkpoint, flags/C3, XP e níveis. A duração registrada é simulada com leitura acelerada; não representa o tempo de campanha de uma pessoa.

## Regressões executadas

- 65 verificações novas em Node/VM: 15 de saves/pós-jogo, 11 de nuvens/coop e 39 de pausa/eventos mobile. Testes com a revisão anterior falharam nos casos corrigidos.
- 8 cenários novos no navegador real: FileReader com arquivo realmente exportado e contexto novo; restauração de NPCs e pontes ao importar save anterior; normalização/Continue da Fenda; derrota; desenho de P2/autopull; pausa da queda por toque; rotação com dois dedos pressionados; menus/onda entre orientações.
- Regressões existentes: 22 de input, 20 de gameplay, 15 de ambiente/nuvens e 12 de pós-jogo, aprovadas. Pós-jogo inclui 25 ondas por fixtures e pontuação/reload/retry/exportação.
- Site exportado: PC, telefone e tablet emulados; mídia, aviso, layout e entrada aprovados (`SITE_RESULTS.json`).
- 13 suítes Node/VM passaram, além dos 8 testes de seleção de artefato Pages. Build e validação Ruby passaram.
- Revisão independente de produção por especialistas de pós-jogo, mobile e nuvens; sem bloqueador nos caminhos exercitados.

Para reproduzir, gerar/exportar a build e servir `production/playtest-dist` localmente. Usar `PLAYWRIGHT_CORE`/`CHROME_PATH` quando o navegador não estiver no caminho padrão:

```sh
node qa/review110_postgame_regression.cjs
node qa/review110_cloud_regression.cjs
node qa/review110_mobile_regression.cjs
node qa/review110_browser.cjs http://127.0.0.1:8771/
ROTA=usina RECARREGAR=120 node qa/campaign_review.cjs http://127.0.0.1:8771/
DEVICE=mobile ROTA=canal RECARREGAR=120 node qa/campaign_review.cjs http://127.0.0.1:8771/
```

## Limites e publicação

São testes automatizados em Chrome isolado e emulação mobile. Não houve campanha humana, aparelho físico, Safari real ou controle físico. As capturas renderizadas foram inspecionadas; os testes não comprovam fluidez em aparelhos de baixo desempenho. As regressões foram adicionadas aos checks do PR/publicação, e a campanha contínua ao check do PR. A confirmação de merge/deploy fica no histórico do GitHub e em `docs/COORDENACAO_RELEASES.md`.
