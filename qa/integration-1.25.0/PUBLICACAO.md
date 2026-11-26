# Publicação da Beta 1.25.0

Em 26/11/2026, o usuário informou ter percorrido a campanha do começo ao fim e autorizou explicitamente publicar e mesclar esta versão no GitHub. Os ajustes posteriores de gameplay serão tratados a partir do feedback seguinte.

Base: `db6297e25a3e701276df0b1ffd04b1dafb14afce` (1.24.1). Branch de entrega: `codex/beta125-ui-fx-tested-20261126`; destino: `main`.

O branch foi reconstruído em um worktree isolado a partir da main, preservando o checkout de trabalho com alterações locais. A compilação reproduziu exatamente a versão jogada: **496648162 bytes**, SHA-256 **da197840cf8fe35be5034e6da819d68ea9dc0e19a1ae9426048d8a6ab6f70e82**.

Nenhum runtime, regra ou asset foi alterado durante a preparação de publicação. Os ajustes deste passo limitam-se a documentação e CI: Chromium Linux explícito; os três runners que exigiam o renderer V2 foram substituídos pela suíte V3 equivalente, mantendo ações/quadros/contatos/ownership e comparação RGBA no HTTP sem perda.

Validação: 149 verificações estruturais; 30 testes VM dos efeitos; 12 suítes nativas com última execução aprovada; 42 estados/checks de UI, incluindo segurança horizontal; três estados finais da Lumi; e suíte V3 HTTP com nove verificações, 48 ações e 384 fases. Os detalhes e snapshots constam em `RELEASE.json` e `native-flows/REPORT.json`. A campanha completa é confirmação do usuário, não uma alegação de playtest humano pelo agente.

`RELEASE.json`, `ENTREGA.md` e as capturas preservam o estado histórico da entrega local anterior à autorização. A confirmação do merge é o PR e o commit registrados no GitHub; os binários HTML e a exportação HTTP são gerados pelo CI a partir das fontes versionadas.

Os primeiros checks remotos identificaram fixtures adicionais: a VM de pausa não declarava document, e a fluidez lia a pose legada antes de o registro V9 ser aplicado no desenho. A VM agora simula captura/propagação (43/43, preservando os39 casos existentes); a fluidez verifica a pose registrada efetiva (208 sequências/48 transições aprovadas), mantendo todos os quadros de rolamento. Ambos são ajustes exclusivos de QA.
