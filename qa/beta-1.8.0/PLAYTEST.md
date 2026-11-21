# Beta1.8 · revisão do mundo vivo

Composição testada: HTML portátil SHA-256`b269abaaa2a6914e8a79d1dcb7a69951de5c7433fd4981fe9660b5ebc0578ef0`,420850907bytes. Base7553828/Beta1.7.1 preservada; novas fontes e assets identificados no manifesto gerado. Exportação web conserva prova de roundtrip do HTML e os mesmos bytes de imagens/áudio.

-142/142 verificações estáticas;24checks do estado anterior dos protagonistas,10 da locomocão nova e16grupos da IA.
- Revisão independente:50checksNode/VM mais leitura de código e auditoria dos16atlas/ciclos. Corrigidos: cena da floresta fora do novo cinema, filtros do publicador incompletos e Belga preso na bancada após loadcoop. Nenhum achado pendente nessa revisão.
- Navegador:10checks do estúdio/cinema/gestos;3grupos da IA em todososmapas comNPCs,60segundos simulados por mapa;32sequências da corrida com tecladoP1/GamepadAPI injetadaP2, quatro direções e máscaras;22checksdeinput e20deprogressão/save/coop/diálogo.
- Regressões:11checksdosprotagonistas,13decenários,72casosdeataquesdosmúsicos,208sequências/48transições dosmúsicos e4checks do site(PC,telefone/tablet emulados e áudio).
- Capturas reais revisadas: estúdio(vaso/sofá/folga do tapete), cinema desktop, cidade e Belga em sua bancada. O cenário conserva acesso à mesa e saída;25mapas/gates preservados, com allowlist exclusiva da colisão do sofá.

As capturas comprovam apresentação estática. As verificações de corrida medem o encadeamento input→update→pose→draw em passos de60Hz, além de fase equivalente30/60/120Hz no módulo real em VM; não são um benchmark de FPS nem certificação de conforto percebido. Sem nova campanha humana completa ou teste em telefone/controle físico. Novos desenhos preservam os originais, mas têm pequenas variações de detalhe, sobretudo nas máscaras.

ResultadosJSON e validação acompanham esta pasta. Artes,fontes,prompts e limites em [documentação da revisão](../../docs/REVISAO_MUNDO_VIVO_1_8.md).
