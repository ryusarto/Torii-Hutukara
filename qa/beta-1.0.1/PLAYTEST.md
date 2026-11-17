# Beta 1.0.1 — progressão, coop e interface

Revisão de 17/11/2026. Os relatórios JSON identificam a build exata por SHA-256. Navegador local: Chrome isolado, com controles simulados e perfis mobile emulados. Testes em Safari/iPhone, Android e controles físicos continuam necessários.

## Resultados

- Validação estrutural: **103/103**.
- Controles: **22/22**; jogabilidade: **20/20**; nenhum erro de runtime nos navegadores.
- Exportação web: **4/4**, cobrindo PC, celular e tablet emulados, rotação, imagens e decodificação de três faixas. Os 92 arquivos de mídia foram reconstruídos para conferir igualdade byte a byte com a build portátil.

Build portátil: 97.981.731 bytes; SHA-256 `d1968466308048f95347d77e922f27962d93110cda08e1ceadaab45e09e35cd7`.

As durações do robô de navegação não são estimativas de duração para pessoas. O equilíbrio narrativo continua sujeito a playtest humano; as correções não acrescentam lutas ao prólogo para alterar a proporção de combate.

## Correções cobertas

- Remoção do inimigo do corredor; prólogo e entrada da floresta seguros até obter o baixo.
- Ataques dos seis integrantes no Distrito da Distorção após a primeira frente.
- XP ativo e de reserva nos três capítulos; migração única, compensação no recrutamento e save/load sem alteração silenciosa dos níveis.
- Campos do sintetizador fora das paredes; atração respeitando o corpo do inimigo.
- Relógio das patrulhas pertencente ao save, sem vazamento entre partidas.
- Metrônomo Menor, Eco Espelho e Abafador atingindo P1/P2 com invulnerabilidade independente.
- Queda do líder durante uma onda sem redirecionar o dano do companheiro.
- Técnicas de ambos bloqueadas na aura e liberadas fora dela.
- Fita usada pelo integrante do controle que apertou Share/Create; simultaneidade sem consumo duplicado ou inventário negativo.
- Diálogo e menus mobile na mesma camada do deck, com leitura e toque livres em retrato/paisagem e texto normal/maior.

## Reproduzir

```bash
ruby game/source/chapter-03/build_alpha.rb
ruby game/source/chapter-03/validate_alpha.rb
node qa/input_regression.cjs
node qa/gameplay_regression.cjs
ROTA=canal PERFIL=tipico RECARREGAR=1 node qa/pace_bot.cjs newGame
ROTA=usina PERFIL=rapido node qa/pace_bot.cjs newGame
ruby production/build_playtest.rb
# Em outro terminal: python3 -m http.server 8771 --directory production/playtest-dist
node qa/playtest_site.cjs http://127.0.0.1:8771/
```

Os scripts aceitam `PLAYWRIGHT_CORE` para apontar a instalação do Playwright. Os relatórios de controles e jogabilidade ficam nesta pasta; capturas são locais e não entram no Git. Os workflows guardam relatórios e imagens como artefatos.

O workflow de PR disponibiliza o HTML portátil em `torii-hutukara-preview` por 14 dias. A publicação em Pages permanece na integração de `main` e repete as verificações antes de publicar.

O simulador desliga `requestAnimationFrame`. As esperas de orientação usam polling por tempo para não depender de um relógio desativado. Isso corrige a causa da espera intermitente observada na auditoria.

O medidor cria uma sessão nova a cada continuação. Em jornadas com recargas, o resumo final mede somente o último segmento; o log de eventos registra a travessia inteira. Não interpretar o tempo da última sessão como duração total.

O verificador de recarga compara a formação efetiva de `partyMembers()`, pois o campo opcional `G.formation` é preenchido na normalização. Compara também XP e níveis dos seis integrantes; divergências fazem o comando falhar.

## Escopo de produção

A Beta 1.0.1 corrige regras e interação. Não incorpora automaticamente a biblioteca V5 nem introduz os inimigos propostos. As entregas de arte e os novos comportamentos estão registrados em [Direção de arte e inimigos](../../docs/DIRECAO_ARTE_E_INIMIGOS.md).
