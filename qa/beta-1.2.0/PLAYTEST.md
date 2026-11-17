# Beta 1.2 · Cenários V2 e integração final

## Validação final da entrega

Build SHA-256 `41a7abfe9dac6a8059e488ea1e28ef9f9cd8a43dc796ab2ffbf6c22dcd222528`, 232.842.945 bytes, sobre a base publicada `54b8fff1992a58f59ca897e12b066d5b8afc9abe`. Preserva as correções de progressão, co-op, mobile e NPCs dos PRs #8/#9, os protagonistas V5 e Ninja/Arqueiro.

A execução final em Chrome isolado aprovou: **115 estáticas; 13 cenários; 88 geometria; 11 protagonistas; 8 variantes; 22 input; 20 jogabilidade; 4 site**. Unidades: 24 estados e 32 casos de NPC. A prévia passou nas 126 seleções, repetição 3×3 e largura mobile. Nenhum erro JavaScript foi registrado nessas suítes.

Os snapshots finais foram regenerados a partir da mesma build, desabilitando somente o módulo de cenários na referência anterior. A suíte confirma 43 chegadas válidas e apenas a remoção do anel excedente de 172 centros caminháveis, com os seis alinhamentos de portas explicitamente permitidos. Capturas com câmera congelada não representam campanha manual. Não houve validação de aparelho físico nem dois controles físicos nesta entrega.

A indisponibilidade dos arquivos locais foi contornada com uma cópia temporária recuperada do GitHub e reaplicação dos patches registrados nesta tarefa. Antes de incorporar os PRs novos, a reconstrução reproduziu byte a byte o hash `8b440916…`; a documentação reconstruída pelas especialidades está identificada como tal. Os testes listados acima foram executados novamente sobre o hash final. Os registros anteriores de interrupção são históricos e não representam pendências da suíte final.

## Evidência anterior da integração de gameplay

# Beta 1.2 · Protagonistas V5 · 17/11/2026

Build portátil SHA-256: `ad3a2223423100d6147cc53b6dc71c67e2d9d16a1ad7c5ae7bf8c3e100ead11f`. Duas gerações locais produziram o mesmo hash.

- Validador oficial: **110/110** verificações aprovadas.
- Exportação PNG: **24 atlas, 192 sequências, 1.728 quadros, 32 retratos**, dimensões e alpha aprovados.
- Unidade da camada de estado: **24/24** verificações (`node qa/protagonist_state.cjs`).
- Chromium no GitHub Actions: **11/11** testes V5, **8/8** testes de variantes e **22/22** regressões de controles/coop/mobile. Nenhum erro JavaScript.
- Cobertura V5: 192 sequências decodificadas com transparência e fechamento; ataques e rolamentos separados por jogador; combo 1–3; técnicas Z/X/K para P1/P2; cooldown recusado; troca/área/save; pausa em diálogo; máscaras e retratos; dano/invulnerabilidade; render das outras variantes preservado; cache limitado.
- Exportação web reconstruiu exatamente o conteúdo e as mídias do HTML portátil.

Evidência remota: [Art integration QA](https://github.com/ryusarto/Torii-Hutukara/actions/runs/44138010896), commit `3c3e9f86c98af27ea63e86f01db8e4f1c64afa3d`. Relatórios JSON copiados do artefato desse run. Captura `PROTAGONISTAS_V5_ENGINE.png` inspecionada: sprites aprovados, escala uniforme e pés alinhados.

Limites: testes com Chromium e dispositivos/controles simulados. Não foi executada uma nova campanha manual completa, nem teste em telefone físico ou dois controles físicos. A derrota mantém a troca automática existente, sem espera nova para exibir a sequência inteira. O navegador local deste ambiente não iniciou; a execução real do navegador ocorreu no CI.

## Correções de gameplay integradas — PR #8

O teste da build combinada, a preservação dos assets publicados e as jornadas com save/load estão registrados em [Integração final de gameplay](GAMEPLAY_INTEGRATION.md). A evidência acima corresponde à integração original de arte; os relatórios atuais identificam a build pelas versões e pelo SHA-256.
