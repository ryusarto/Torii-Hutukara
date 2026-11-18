# Fontes dos músicos chibi

56 folhas PNG nativas geradas com a ferramenta integrada de imagens, sob direção do autor. As animações mantêm oito poses em quatro direções; as versões de máscara ficam separadas.

`PRODUCAO.json` registra dimensões de entrega e hashes SHA-256. `PLANO_E_PROMPTS.json` contém a especificação final e os prompts; `fontes/` registra a origem de cada folha. Os registros marcados `promptReconstructed` recuperam a especificação da conversa após perda de arquivos locais; os PNGs nativos foram preservados.

Os atlas prontos e a prévia ficam em `assets/variantes/percussao-sintetizador-v1/`. Para exportar os 1.664 PNGs individuais, execute na raiz do repositório, com Pillow instalado:

```bash
python3 production/export_musician_frames.py --out /tmp/torii-musicos-frames
```

O exportador verifica o round trip dos pixels. `empacotar.py` permite reprocessar estas folhas com Pillow e NumPy, sem criar poses por código. Consulte `EMPACOTAMENTO.md` para recortes e calibração.

A arte segue as proteções de `LICENSE-ASSETS.md` do projeto.

A nova paleta canônica de terra e sucata foi aplicada por lookup RGB, preservando alpha, coordenadas e agrupamentos do sombreamento. As 56 folhas-fonte também usam a nova paleta; os PNGs da paleta anterior foram substituídos após a auditoria dos 140 pares. A receita e os hashes da transformação estão no pacote de assets. `gerar_paleta_c3.cjs` documenta a transformação executada uma vez; não aplicá-la novamente às fontes já recoloridas.

A Beta 1.6.1 aplica correções localizadas de continuidade às cabeças mascaradas. As folhas-fonte atuais e os atlas guardam somente a versão corrigida. A origem anterior está no histórico Git; prompts e montagem estão em CORRECOES_FLUIDEZ_PROMPTS.json, e a auditoria encadeada no pacote de assets. Não reescrever a auditoria histórica de paleta ao reprocessar uma nova correção.
