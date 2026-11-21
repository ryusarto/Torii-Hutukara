# Sprites de ataques inimigos

Cada linha de `attack-strips.png` contém oito células transparentes de 40 × 40 pixels. A ordem das linhas e os golpes que as utilizam estão em `manifest.json`. O jogo rasteriza essas mesmas tiras em Canvas sob demanda e guarda cada par de desenho e paleta em memória. A imagem PNG permite revisar os quadros em um editor de sprites.

| Chefe | Golpes e visual | Gatilho no combate |
| --- | --- | --- |
| Viajante Mascarado | Onda de gongo, leque de três lâminas, ponta de lança na investida | `windKind` e liberação de `wind`. A investida usa os pontos de colisão percorridos pelo corpo na fase II. |
| Arauto | Três trilhos de faders, caixa de realimentação, dois arcos de eco, rajada de três dardos | `tele09` para faixas e círculo. Na fase II, `echoWarning092` precede duas ondas com atraso e `volley091` emite três projéteis. |
| Metrônomo | Coroa dentada na onda, pistões na cruz, dentes de catraca no leque, pêndulo no pulso | `C3.castPattern` prepara e `C3.fireHazard` dispara. O pulso entra a partir da fase II. |
| Silêncio | Eclipse na onda, fissura na cruz, penas no leque, diafragma no pulso, lascas na chuva, cometas na rajada dirigida, satélites na rajada circular | Cada `hazard.kind` seleciona o desenho real. A rajada dirigida marca os cinco tiros e a circular marca os doze. |

Os golpes de área levam marcas animadas na faixa, setor, anel, trajetória de carga ou discos de chuva. As marcas de chão são recortadas pela geometria do ataque. Os tiros acompanham a velocidade e a posição usadas pela simulação.

| Adversário | Movimento visível |
| --- | --- |
| Nó do Silêncio (hush) | Três garras recolhem e avançam ao fim de `wind`. |
| Sombra Disforme (whisper) | Forma o projétil na mão e dispara uma chama com núcleo, cauda e arco. |
| Metrônomo Menor (compasso) | O pêndulo prepara o golpe no relógio de batidas e avança na batida. |
| Eco Espelho (espelho) | Estilhaços espelhados no golpe próximo. Dois arcos anunciam e liberam sua resposta após dois acertos. |
| Abafador (abafador) | Sino no golpe de contato e lâminas de amortecimento na borda da aura passiva. |
| Drone de Retorno (c3_drone) | Pistões industriais no ataque de contato. |
| Eco de Distorção (c3_echo) | Fissura vermelha no ataque de contato. |

A opção de movimento reduzido seleciona poses estáveis de preparo e disparo. Para validar em uma exportação local, execute `node qa/enemy_attack_fx_browser.cjs URL`. A variável opcional `ENEMY_FX_EXPORT=1` reexporta o PNG e o manifesto após os testes. O teste percorre os controladores em estados preparados, observa o desenho na tela e confere a transparência e a distinção dos quadros.
