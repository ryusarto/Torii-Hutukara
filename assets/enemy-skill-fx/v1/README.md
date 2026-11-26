# Enemy Skill FX V1 — T&H

Novas imagens originais geradas com a ferramenta integrada image_gen, seguindo a matéria e temporalidade dos FX raster dos bosses. Substituem a linguagem de glifos por pressão, filamentos, rasgos e estilhaços; os seis corpos aprovados não foram modificados.

- Fontes intactas: source/*.png; prompts exatos: PROMPTS.json; proveniência: PRODUCTION.json.
- Exports: seis PNG RGBA atlas/*.png, cell128, quatro colunas, pivô nominal [64,64].
- manifest.json define dez clips com oito fases, rowOffset0/2, orientação, bounds completos e dados/hashes por quadro.
- Preparação0–2, ruptura/pico3–4, dissipação5–7. Tempos no manifesto servem somente à prévia; a integração mantém os eventos, dano, hitboxes e timers originais.
- Flautim no runtime: voo nos quadros3/4/5, com pivôs medidos do núcleo luminoso; flautim_impact é o contato independente. O loopFlightFrames da folha registra a sugestão original de prévia; não comanda o player integrado.
- Coro cura e Maestro emergência são ancorados no receptor/nascimento real, não usados como emblema sobre o lançador.
- Conteúdo do feixe Antena ocupa x18..110 da célula: a integração pode usar contentBounds para encaixar matéria no trajeto. Não recentrar cada fase.
- Importador editável: production/import_enemy_skill_fx_v1.py (Pillow e NumPy).

## Corte e transparência

A fonte completa é analisada ANTES do recorte. Cada fronteira nominal tem uma faixa global de cinco pixels inteiramente alpha0 depois de remover somente alpha1..8; o exterior também é vazio. Isso valida a separação sem amputar componentes. Nenhum fragmento pequeno foi eliminado. Quadros inteiros são escalados pela mesma transformação de célula nominal e ancorados com guard8; nenhuma caixa de conteúdo foi normalizada individualmente. O deslocamento, crescimento e dissipação desenhados são mantidos.

Todo RGB em alpha0 é zerado no derivado. Originais permanecem intactos. IMPORT_QA.json registra seis folhas/dez clips/80quadros; todas as células exportadas têm guard8alpha0, inclusive as fases finais. Fonte e conteúdo porfase constam em frameData.

## Evidências e limite de validação

preview/all-frames-earth.jpg, all-frames-forest.jpg e all-frames-stone.jpg mostram todos os quadros; preview/{clip}.gif contém cada loop completo. Os seis source-composites mostram a folha inteira sem a exibição incorreta de RGB residual em alpha muito baixo.

Inspeção estática de cada fonte/quadro e previews concluída. A direção aprovou as formas das fontes para exportar. Pivô em cena, oclusão, acerto real e convívio com telegraphs dependem do módulo de integração e das demos em runtime do coordenador. Estas pranchas isoladas não são prova de gameplay testado.


## Integração concluída

Runtime local 36465da1 integrado e aprovado visualmente nas11 demos reais. Pivôs de voo/base, encaixe por conteúdo útil e clipping seguem docs/ENEMY_SKILL_FX_V1.md. A galeria está em qa/beta-1.17.0/enemy-skill-fx-v1/index.html. A proveniência JSON preserva o estado do momento de geração/exportação; o aceite de integração está nos relatórios técnico e artístico.
