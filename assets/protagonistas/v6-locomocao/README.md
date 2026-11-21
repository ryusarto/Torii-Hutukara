# V6 — poses intermediárias de corrida

Produção de 20/11/2026 para Franco e Ryuchi principais. O pacote adiciona quatro poses desenhadas por direção/estado de máscara, mantendo os oito quadros originais V5 em cada ciclo. A integração1.8 exercita32combinações de direção/máscara/herói/jogador no pipeline real de input/update/draw; resultados em qa/beta-1.8.0/LOCOMOTION_BROWSER_RESULTS.json.

- 64 poses novas, geradas pela ferramenta embutida `imagegen` a partir dos atlas V5 existentes.
- Dois atlas RGBA de 3328×2048: 13 colunas × 8 linhas de 256×256.
- Doze quadros reproduzidos; a coluna 12 é fechamento, igual à coluna 0.
- Pivô preservado em (128,224). Linhas: down/left/up/right sem máscara, depois as mesmas quatro com máscara.
- Ciclo de 520 ms. Durações: `[32.5,32.5,65]` repetidas quatro vezes. Oito quadros originais não são alongados para acomodar os intermediários.

Sequência: `V5_0, novo_0-1, V5_1, V5_2, novo_2-3, V5_3, V5_4, novo_4-5, V5_5, V5_6, novo_6-7, V5_7`.

## Arquivos

- `atlas/`: atlas integrados à Beta1.8.
- `manifest.json`: somente os dezesseis registros `run` que substituem a seleção correspondente de V5.
- `novos/`: quadros novos isolados e normalizados.
- `originais/`: quatro fontes RGBA da geração, sem sobrescrever as fontes V5.
- `PROMPTS.json`: ferramenta, prompts exatos e origem de cada geração.
- `tools/pack_run_v6.py`: empacotamento reproduzível. Recorta o corpo a partir do limite de alpha alto com dois pixels de margem, aplica uma escala uniforme por linha com vizinho mais próximo e ancora os pés à posição intermediária dos vizinhos V5.
- `PREVIA.html`: comparação offline do ciclo V5 com o V6, com pausa, avanço e controle de velocidade.
- `VALIDACAO.json`: validação de quadros, fechamento, integridade das cópias V5 e unicidade dos novos quadros.
- `VALIDACAO_PREVIA.json`: carregamento dos quatro atlas, 16 cartões/32 canvases, pausa e avanço conferidos em Chrome isolado; não é gameplay.

O empacotador não desenha poses, não mistura frames, não aplica rotação e não cria inbetweens por interpolação de pixels. Os desenhos novos provêm das quatro gerações registradas. A normalização de recorte/escala/âncora é técnica; os oito quadros V5 são copiados sem qualquer alteração de pixel.

## Reproduzir

Com Python e Pillow instalados:

```sh
python3 tools/pack_run_v6.py --v5 ../v5/atlas
```

## Estado de aceite

As fontes e os atlas foram inspecionados visualmente quanto a identidade, máscara e direção; o empacotamento comprova 128 cópias originais preservadas, 64 quadros novos distintos e fechamento dos 16 ciclos. Isso não substitui revisão animada no motor.

O pacote é candidato de produção. Integração de runtime, leitura em escala de jogo, aprovação de fluidez, gameplay, mobile e coop pertencem ao integrador/revisor. O manifesto registra `engineIntegration:false`; não declarar o asset testado no jogo apenas por esses resultados estáticos.

A prévia também foi capturada com todas as 16 linhas mostrando a pose nova de índice 1 (32,5 ms). As imagens foram inspecionadas, mas a continuidade de microdetalhes gerados, sobretudo nas máscaras, ainda deve receber aceite no enquadramento real do jogo.
