# Cenários desérticos V1 — QA de integração

`qa/cenarios_deserto_v1.cjs` opera um navegador isolado sobre a URL local fornecida pelo agente principal. Não inicia servidor, não usa o perfil do jogador e não altera um save pessoal. A compilação precisa ter sido feita com `TORII_CENARIOS_THEME=deserto-v1`.

```sh
PLAYWRIGHT_CORE=/caminho/playwright-core \
CHROME_PATH=/caminho/Chrome \
node qa/cenarios_deserto_v1.cjs http://127.0.0.1:PORTA/
```

Sem `CHROME_PATH`, usa `CDP_URL` (padrão `http://127.0.0.1:9238`) e cria contexto separado. A URL também pode vir de `TORII_URL`. `TORII_EXPECTED_SHA` opcional exige que o `sourceSha256` servido coincida antes de executar a suíte, evitando testar por engano uma saída web anterior.

## Contratos verificados

1. Tema final compilado, 15 atlas e 151 células na composição de runtime (131 recortes desérticos + 20 legados), 25 extras `c3_desert_*` e dois fundos. Cada célula é não vazia, tem quatro cantos alpha zero, dimensões corretas e conteúdo dentro da célula; os dois fundos são decodificados no tamanho declarado.
2. Mesmos tiles, sólidos, dimensões e campos de todos os gates nos 25 mapas em relação a `qa/cenarios-v2/depois/MAPAS.json`. O baseline **já contém** os seis alinhamentos de portas e a remoção do anel; o teste desértico não reaplica uma allowlist nem aceita novo deslocamento.
3. O renderer real `drawProp` usa os bindings do deserto somente no Capítulo 3. Elevador fechado/aberto escolhe recortes e pixels diferentes conforme `liftOpen`.
4. Carregamento adicional D11/D12/D13 limitado às áreas designadas, cobrindo as 11 áreas do Capítulo 3 e quatro mapas legados amostrados; nenhuma chamada extra nos capítulos 1/2.
5. Máquina, pressão, válvula e comporta seguem flags locais de Usina/Canal; progresso na outra rota não os ativa.
6. Renderizar os 25 mapas conserva estado serializado do jogador, props e gates.
7. Props e tipos de tiles dos 14 mapas legados têm pixels iguais aos renderers V2 anteriores ao wrapper do deserto.
8. Os seis personagens, quatro direções e estado de máscara ligado/desligado conservam pixels com tema do deserto ligado/desligado, sem recoloração global. A suíte decodifica os atlas `idle` dos módulos ProtagonistArtV5, NinjaArcherArtV1 e MusicianArtV1 antes da comparação; nos músicos também alterna explicitamente `masked`/`unmasked`.
9. Um inimigo existente do Distrito, aproximado por uma posição válida, entra em combate e gera seu windup pela função real. A fixture prepara a primeira frente concluída (`usinaDone=true`), pois as patrulhas são ocultadas antes dela, e usa `enemyActors`/`hydrateEnemy` reais para inicialização. Um quadro é renderizado e o JSON registra inimigo, posições e aviso. Nenhum inimigo fictício é adicionado ao produto.

10. Os nove bindings D12 são exercitados no renderer real com seus tamanhos; o checkpoint reutiliza `kiosk` em **46×60**, além do quiosque comum em 68×80.
11. D13 cobre todos os objetos funcionais; interferência permanece ativa sem progresso do Canal ou somente com a Usina concluída, e fica calma com `canalPath` ou `canalDone`.
12. Treze pares de estado conservam tamanho de célula e pivô: palco, caixa, máquina, pressão, válvula, comporta, baliza, condensação, tambor, altar, círculo, elevador e interferência.
13. Os dois painéis contextuais C3 usam os novos fundos, enquanto quatro painéis legados são idênticos ao renderer anterior. A suíte força o ramo de imagem pendente no objeto real, dispara o callback de `load` registrado por `showCinema` e verifica: contexto novo não recebe a imagem/cor anterior; encerramento real de diálogo não é ressuscitado por carregamento tardio.

A ordem dos checks no JSON agrupa os bindings e os fundos antes das regressões gerais; a numeração acima descreve cobertura.

## Evidência e limites

O relatório da execução fica em `qa/cenarios-deserto-v1/RUNTIME_RESULTS.json`, com hash do baseline, build servido quando disponível, versão do navegador, resultados individuais e erros JavaScript. Falha em qualquer contrato dá status de saída 1; exceção fatal também produz relatório.

## Execução da amostra desértica

O resultado histórico foi preservado em `qa/cenarios-deserto-v1/AMOSTRA_RUNTIME_RESULTS.json`. A build de SHA-256 `91ebc8aecb1f27f26cf29a8e72dafdaf66f0b0ff1f66cbdfb62730ba2d0fd3bd`, servida pelo principal em `http://127.0.0.1:8791/`, passou **9/9 verificações**, sem erros JavaScript. O resultado vale para essa amostra de 13 atlas/134 células; novas folhas ou alterações de runtime exigem nova execução.

Foram conferidas as dimensões/cantos alpha dos 134 recortes, 25 mapas e 43 transições sem diferença geométrica/portais em relação ao baseline, 13 casos de flags A07, 959 instâncias de props dos 14 mapas legados e 48 amostras de render de personagens. O teste compara os campos serializados completos dos gates: remove apenas valores `undefined`/funções que o JSON de referência também não contém, sem dispensar `blocked` ou coordenadas.

O quadro mecânico de combate usa a patrulha real `p4_patrol_center` (`c3_echo`) em `(36.5,25.5)`, jogador em `(37.5,25.5)`, modo `action`, aviso `swipe`, `wind=0.52`. A função real `updateEnemy` produziu o windup e o renderer desenhou o quadro. A suíte registra esses dados no JSON; não salvou PNG nem afirma revisão visual humana desse quadro.

A primeira tentativa detectou duas inadequações de fixture, ambas corrigidas antes da execução aprovada: o transporte Playwright retinha uma propriedade `need: undefined` ausente no JSON e o filtro de patrulhas/hidratação preguiçosa exigia preparar a etapa legítima acima. Nenhuma correção de produção foi necessária.

Comparações de pixels verificam isolamento da alteração, não aprovam artisticamente a areia, as fachadas ou o volume das bordas. Um quadro de windup produzido pelo motor não comprova legibilidade humana, luta vencida ou campanha completa. Não há nesta suíte validação de celular físico, multitouch real ou dois controles físicos.

## Execução final reconciliada

Suíte expandida preparada; aguarda o hash final e a confirmação do principal de que a URL serve a build reconciliada. O relatório histórico 9/9 não aprova antecipadamente os novos D12/D13/fundos/músicos. Nenhuma nova execução final é declarada nesta preparação.
