# Beta1.10 · integração e publicação verificadas

Composição testada: `21bb786eea7b2703ddf4dae424f6abe84d4b2aed`, sobre a main1.9b83314b8. HTML portátil de427740527bytes, SHA-256 `77c6334bb5d84c62539954376bf44e68db8ffc63e10884b3384c6c11a3689fc8`.

Produção: fachadas C1/C2,13 interiores, luz/vento/areia, portal e nuvens com oito quadros de reconstrução, quedaP1/P2 e bloqueio de viagens durante a queda. Preservados estúdio, personagens, IA/gestos, combate, saves e pós-jogo1.9.

- 145/145 verificações estáticas;20 testes de nuvens,18 de profundidade, oito de atmosfera e oito de infraestrutura.
- 38/38 verificações de navegador na composição:15 ambientes/nuvens,11 estúdio/cinema/saves,12 pós-jogo. Relatórios em [COMPOSICAO_1_10_RESULTADOS.json](COMPOSICAO_1_10_RESULTADOS.json).
- Revisão visual independente de contatos/capturas e revisão independente da guarda tardia, ordem dos módulos e interação com diálogos; fontes remotas conferidas iguais às revisadas localmente. Sem achado acionável pendente no escopo exercitado.
- O problema de teste com checkpoint de chefe foi corrigido no fixture, preservando o código e os HPs de produção. A fala pausa e retoma a mesma queda; não a cancela.
- [Art44853202078](https://github.com/ryusarto/Torii-Hutukara/actions/runs/44853202078) e [Gameplay44853202027](https://github.com/ryusarto/Torii-Hutukara/actions/runs/44853202027) aprovados. [PR#19](https://github.com/ryusarto/Torii-Hutukara/pull/19) integrado em91e8642.
- [Publish44853604429](https://github.com/ryusarto/Torii-Hutukara/actions/runs/44853604429) aprovado. Publicação confirmou1.10.0/sourceSHA77c6334, HTML servido igual ao hash do build-info e13PNGs com bytes idênticos às fontes, incluindo seis assets novos/restaurados e sete preservados. Roundtrip do HTML portátil mantido.

[Prova de rede independente](COORDENACAO_PUBLICACAO.json) · [Conferência dos seis assets](PAGES_VERIFICACAO.json) · [Artes e prompts](../../docs/AMBIENTES_MUNDO_VIVO_V1.md).

A publicação1.9 foi conferida antes da integração1.10, incluindo reservas da sala final, encerramento emHutukara, onda/pontuação e derrota/retry. A1.10 conserva esse pós-jogo e repete seus testes na composição. [Histórico1.9](../postgame/PLAYTEST.md).

Os testes usam Chrome isolado e cenários controlados; a conferência de rede compara arquivos servidos. Não são campanha humana completa nem validação de conforto/desempenho em telefone ou controle físico. Hash do index pode variar entre exportações pelo timestamp de publicação; a prova usa os metadados da própria versão pública, mantendo fixo o sourceSHA.
