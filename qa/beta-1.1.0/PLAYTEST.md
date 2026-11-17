# Beta 1.1 · Ninja e Arqueiro · 17/11/2026

Build: `TORII_HUTUKARA_BETA_1_1_0.html` · SHA-256 `f2957c77710fb12ebe34f8fc7b72981c89643ee8d5398b28d5df75bf38ed08f6`.

- Validador estático: **107/107** verificações aprovadas, incluindo dimensões e alpha das 40 imagens integradas, cobertura e regras da máscara.
- `NINJA_ARQUEIRO_RESULTS.json`: **8/8** verificações. Leitura dos 864 quadros nas 96 sequências; transparência e fechamento; ataques/rolamentos separados por jogador; cooldown recusado; técnicas e especial; troca, área e save; diálogo e retratos; render anterior dos quatro outros heróis preservado pixel a pixel; cache de atlas limitado e carregamento adiado no título.
- `INPUT_TEST_RESULTS.json`: **22/22** verificações de entrada, dash, colisões, co-op, multitouch, rotação e trava de movimento durante diálogos. Simulação a 30, 60 e 120 Hz.
- `PREVIA_RESULTS.json`: **96/96** combinações da prévia, pausa, avanço de um quadro e largura de celular.
- `qa/playtest/SITE_TEST_RESULTS.json`: PC, iPhone e iPad com identificação temporária, layout e entrada do Capítulo 3, além de fetch/decodificação das músicas. Nenhum erro JavaScript registrado.
- Exportação hospedada: conteúdo e bytes das mídias reconstruídos e comparados ao HTML portátil; **round trip idêntico**.

Revisão visual: folhas de espera, corrida, caminhada, rolamento, ataques, técnicas, dano e derrota; máscara no cinto do Arqueiro, ausência de máscara no Ninja; retratos e escala no motor. `NINJA_ARQUEIRO_ENGINE.png` mostra os novos desenhos ampliados com escala uniforme.

Os testes usam Chrome isolado, perfis de dispositivo e Gamepad API simulados. Esta entrega não registra uma nova campanha manual completa, medição em iPhone físico ou sessão com dois controles físicos. A troca automática após morte mantém o comportamento anterior; não foi inserida uma espera para mostrar a animação de derrota inteira.
