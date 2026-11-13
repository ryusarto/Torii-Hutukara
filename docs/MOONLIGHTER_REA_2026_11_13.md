# Moonlighter: aprofundamento com REA

Estudo realizado em 13/11/2026 sobre a instalação Steam fornecida pelo autor. Objetivo: melhorar combate, rolada, leitura dos chefes e identidade dos personagens do Torii & Hutukara.

## Identidade e método

- Ferramenta: REA 6.9.0 oficial, executada localmente por CLI com Node 24.22.1.
- Provedor: `rea-dotnet-static`, versão 1.
- Alvo: `Moonlighter.app/Contents/Resources/Data/Managed/Assembly-CSharp.dll`.
- SHA-256: `3faf63c2f3613d9512e6b840ff15ee6521f53379a8bc822a37aa313b0a2761b1`.
- MVID: `6475f251-2f1f-4d70-bf74-ae4f3711cff4`.
- Classificação observada: Unity/Mono, CIL, AnyCPU. A DLL tem 3.272 declarações de tipos e 20.884 declarações de métodos no total.
- Três seleções de inspeção cobriram 36 tipos e 1.019 métodos relacionados a combate, entrada, armas, dano e chefes. A cobertura foi completa dentro dessas seleções, sem nomes de tipos ausentes.
- As chamadas e os acessos a campos foram examinados para seguir hipóteses concretas. Decodificar 1.019 métodos não equivale a provar o funcionamento integral do jogo.

Nenhum arquivo da instalação foi alterado. A análise não carregou ou executou a DLL. Não recuperou o projeto Unity original nem mediu a jogabilidade em execução.

## Evidências persistidas

Os bundles completos ficam fora do repositório do Torii, em `Documents/Codex/Torii-Hutukara-analysis/moonlighter-2026-11-13/`. Contêm a representação técnica do alvo e não entram na build ou no GitHub.

| Seleção | Evidence ID original | Cobertura |
|---|---|---|
| Controle, armas, inimigo base, chefes principais e Wanderer | `ev_fd5a41b4b30cd513ce8901c49295567b40ecb524f34b7d8ff393ba1922e7072f` | 17 tipos, 840 métodos, 7.894 relações de chamada e 4.516 acessos a campos |
| Configuração de armas, atributos e entrada | `ev_75fcb4f350443ecc0b9241f0f60022d4ea4656aedc2ae4e4477f9204ad54bc7d` | 3 tipos, 16 métodos |
| Chefes e componentes adicionais, armas concretas e colisão | `ev_2c05215a221928b10799b8bc485020f1eaba10898b14802999b15a49e7b7fe42` | 16 tipos, 163 métodos |

Os tokens citados abaixo são coordenadas desta DLL e só valem junto do hash e MVID acima.

## Descobertas verificadas

### 1. Peso de arma é uma relação entre entrada, animação e movimento

`HeroMerchantController.MainAttackUseStart` (`0x06001715`) chama a desativação da entrada de movimento, consulta o tipo de arma, trata deslocamentos direcionais, inicia o uso da arma e avança o contador de combo. O controle não se resume a diminuir HP.

`WeaponEquipmentMaster` declara cooldowns separados para ataque principal e secundário, forças de recuo separadas, multiplicador do secundário e efeitos de cada etapa de combo. A presença desses campos não revela os valores efetivos de cada item serializado.

**Aplicação no Torii:** recuperação e mobilidade por papel; graves com compromisso maior, agilidade com recuperação menor, alcance com preparação. O refinamento completo dos kits permanece em discussão.

### 2. Combos possuem janelas diferentes por família

`IsPlayingMainAttackAnimationWithAttackTimeWindow` (`0x0600177f`) consulta estado e tempo normalizado do Animator e lê janelas próprias de espada curta, espada grande, lança, luvas e arco. `IsPlayingMainAttackAnimationToSecondaryAttackTimeWindow` (`0x06001782`) usa outra janela para a transição ao ataque secundário.

**Aplicação proposta:** não permitir os mesmos cancelamentos e a mesma sequência de ações para todos os personagens. Uma janela curta de tolerância pode melhorar a resposta sem remover o compromisso do golpe.

### 3. Carga e soltura são etapas próprias

Há etapas separadas de começo, pronto, soltura e fim para ataques secundários. `SecondaryAttackUseStart` (`0x06001717`) consulta a família da arma, pode reabilitar movimento e reinicia o combo. `Weapon` também mantém estados separados de ataque principal e secundário e eventos próprios de acerto.

**Aplicação proposta:** arco com carga e tiro preparado; sintetizador com preparação de campos; percussionista com resposta no impacto. Não transformar todas as técnicas em um círculo de dano instantâneo.

### 4. Rolada tem estado e janelas de transição

`IsPlayingRollAnimation` (`0x06001786`) consulta a tag do estado de animação. As rotinas `0x0600178a` e `0x0600178b` verificam transições entre rolada e habilidade usando o tempo normalizado e também verificam obstáculo rebaixado. O `Update` consulta essas condições em diferentes decisões de entrada.

`ApplyRollBack` (`0x06001725`) está ligado à resposta de recuo/erro, modifica `isMissed` e bloqueia movimento e ataque; não deve ser confundido com a rolada comum apenas por conter “Roll” no nome.

**Aplicação no Torii:** um estado único de rolada, direção fixada no início, uma integração de deslocamento, colisão por corpo e recuperação consistente. Foi implementado e testado em três taxas de quadros.

### 5. Invulnerabilidade e colisão não são simplesmente a imagem da animação

`SetNonDamageFromEnemiesLayer` (`0x06001753`) altera a camada do objeto. Há rotinas distintas para camada padrão e efeito de invencibilidade. Isso sustenta a separação de responsabilidades; não prova a duração de invulnerabilidade durante cada rolada, porque parte da ligação pode vir de eventos e estados serializados.

**Aplicação no Torii:** janela de proteção explícita separada da duração visual. Os números utilizados na Alpha 1.2.1 são autorais e precisam de balanceamento próprio.

### 6. Chefes usam repertório com limites e preparação

- **Tesla:** `NextMovemment` (`0x060013c6`) cria uma lista de candidatos a partir do repertório, remove o movimento anterior, escolhe entre os restantes e chama a preparação. Observação concreta de prevenção de repetição imediata.
- **Wanderer, fase 1:** `SelectAttackType` (`0x06000412`) usa seleção aleatória junto de contadores e limites de ataques sucessivos. Não é uma escolha livre sem memória.
- **Golem King:** `OnMovemmentEnded` (`0x060011df`) avança o movimento e atualiza o Animator. Existem operações separadas para começo, interrupção e conclusão de ataques.
- **Carnivorous Mutae:** repertórios separados para esporos, raízes, salto e tentáculos, com operações próprias de início e encerramento.
- **Desert:** prepara carga e possui encerramentos específicos para raio, espiral, canhão e elementais.
- **Gizmo:** possui escolha de ação, golpe, dash, impacto e ataque em voo; outra classe trata sua segunda fase.
- **Slime:** divisão, reaparecimento/empurrão e geração de áreas são operações separadas.

As relações foram obtidas dos métodos e campos selecionados. Não foram observadas todas essas lutas em execução, nem a frequência final de cada golpe.

**Aplicação no Torii já implementada:** depois que o padrão do Metrônomo ou Silêncio termina, uma abertura curta e sinalizada permite responder. Padrões consecutivos iguais são evitados. No coop, ataques mirados alternam o ponto de referência entre os dois jogadores.

### 7. Acerto é uma responsabilidade própria

A inspeção incluiu `WeaponCollisionDetection`, `EnemyAttackCollisionDetection` e `EnemyDamageReceiver`, além de projéteis. A arquitetura separa uso da arma, colisão e aplicação de dano.

**Aplicação proposta:** cada golpe registrar seus próprios alvos, impedir múltiplos acertos acidentais e manter projétil, alcance e efeito consistentes com o personagem que o executou. P1 e P2 devem convergir para o mesmo catálogo de técnicas.

## O que não foi estabelecido

- Timings efetivos de todos os clipes e transições do Animator.
- Valores de armas, inimigos e chefes definidos em objetos Unity serializados ou AssetBundles.
- Duração real de todas as janelas de proteção, incluindo eventos de animação.
- Todos os modificadores de itens, encantamentos e dificuldade.
- Sensação física dos controles ou latência medida no Moonlighter em execução.
- Comportamento de todos os inimigos, salas e combinações de equipamentos da instalação.

Portanto, este é um estudo amplo dos sistemas selecionados, não uma alegação de que “todo o combate” foi integralmente reproduzido ou verificado.

## Decisões para o Torii

1. Estabilizar mobile, colisão, rolada e coop antes de ampliar conteúdo.
2. Refinar cada personagem por compromisso, alcance, movimentação e função, não apenas dano.
3. Estruturar os chefes em preparação, resolução e abertura, sem intervalos vazios longos.
4. Trocar deslocamentos de confirmação de quest por consequência imediata ou comunicação contextual.
5. Validar encontro por encontro no próprio Torii e usar números próprios.

O jogo distribuído contém apenas nossa implementação autoral. O estudo detalhado dos kits e das quests está em `design/COMBATE_E_RITMO_PROPOSTA.md`.
