# Estudo do Delta para os controles mobile

Consulta realizada em 13/11/2026. Referência pedida pelo autor do Torii & Hutukara.

## Fontes primárias consultadas

- [Delta](https://github.com/rileytestut/Delta): suporte a controles físicos, skins e mapeamentos.
- [ThumbstickInputView.swift](https://github.com/rileytestut/DeltaCore/blob/main/DeltaCore/UI/Controller/ThumbstickInputView.swift): origem do gesto, zona morta, deslocamento limitado e retorno ao centro.
- [ButtonsInputView.swift](https://github.com/rileytestut/DeltaCore/blob/main/DeltaCore/UI/Controller/ButtonsInputView.swift): rastreamento separado por toque, união dos comandos ativos, cancelamento e regiões de toque estendidas.
- [ControllerView.swift](https://github.com/rileytestut/DeltaCore/blob/main/DeltaCore/UI/Controller/ControllerView.swift): apresentação do controle e seleção de características do layout.

## Princípios adaptados

1. Cada dedo tem identidade própria: tirar o dedo do ataque não interrompe o analógico.
2. Um gesto cancelado precisa soltar todos os comandos que possuía.
3. Analógico e botões são componentes distintos, com áreas confortáveis para os polegares.
4. A orientação escolhe uma disposição adequada, em vez de apenas diminuir uma interface desktop.
5. Toque, teclado e controle físico entregam intenção ao mesmo jogo, sem apagar os estados dos outros dispositivos.

## Implementação autoral na Alpha 1.2.1

- Pointer Events e captura por `pointerId` para multitouch.
- Analógico radial com zona morta de 14%, intensidade progressiva e corrida na borda.
- Captura continua acompanhando o dedo fora do círculo; soltar ou cancelar centraliza o analógico.
- Retrato: enquadramento lógico 512×480 e controle abaixo da cena.
- Paisagem: enquadramento 768×432 com controles nas laterais.
- Área segura do aparelho, altura visual do navegador e mudanças de orientação respeitadas.
- Diálogos e menus com texto e alvos maiores, roláveis quando necessário.
- Controle físico conectado recolhe o painel de toque; botão permite reexibi-lo.
- Teclado é a apresentação inicial do desktop.

O Delta é um aplicativo nativo e utiliza UIKit. Sua implementação Swift não foi copiada ou incorporada ao jogo; o módulo de navegador foi escrito para a arquitetura do Torii & Hutukara. Não foram utilizados skins ou recursos gráficos do Delta.

## Evidência e limites

Os testes automatizados utilizam Chrome com viewport, user agent e entrada de toque de um iPhone simulado. Validam comandos simultâneos, orientação e conectividade simulada. A ergonomia física e o comportamento específico do Safari iOS ainda precisam de uma sessão real no aparelho.
