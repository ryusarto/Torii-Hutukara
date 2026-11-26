# Fontes dos músicos chibi

56 folhas PNG nativas geradas com a ferramenta integrada de imagens, sob direção do autor. As animações mantêm oito poses em quatro direções, com variantes de máscara separadas.

`PRODUCAO.json` registra dimensões, hashes e transformações das fontes. `PLANO_EMPACOTAMENTO.json` contém o contrato de montagem: personagens, variantes, direções, ações, expressões, nomes e grades das folhas. Os PNGs nativos ficam em `originais/`; os atlas e retratos publicados ficam em `assets/variantes/percussao-sintetizador-v1/`.

Para exportar os 1.664 PNGs individuais dos atlas atuais, execute na raiz do repositório, com Pillow instalado:

```sh
python3 production/export_musician_frames.py --out /tmp/torii-musicos-frames
```

O exportador verifica a reconstrução dos pixels. `empacotar.py` reprocessa as folhas com Pillow e NumPy, preservando as poses autorais. Consulte [EMPACOTAMENTO.md](EMPACOTAMENTO.md) para recortes, calibração e saídas.

A paleta canônica e as correções localizadas já estão aplicadas às fontes e aos atlas atuais. A receita, as regiões autorizadas e os hashes das transformações permanecem no pacote de assets. `gerar_paleta_c3.cjs` documenta a transformação de paleta; reaplicá-la às fontes já recoloridas mudaria seus pixels. As auditorias históricas registram as entradas de cada transformação e devem permanecer íntegras.

A arte segue [LICENSE-ASSETS.md](../../../LICENSE-ASSETS.md).
