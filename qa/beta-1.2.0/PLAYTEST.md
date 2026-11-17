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
