# Alpha 1.2.1 — mobile, rolada, coop e leitura de chefes

## Validado automaticamente

Chrome isolado, sem ler saves do usuário, com as entradas e os cenários controlados pelo teste.

- 16/16 verificações funcionais aprovadas; resultados em `INPUT_TEST_RESULTS.json`.
- Desktop inicia com teclado e sem painel de toque.
- A ausência de gamepad não apaga comandos pertencentes ao toque.
- Círculo inicia rolada em área pacífica e Options abre pausa.
- Seis personagens mantêm duração e distância de rolada a 30, 60 e 120 Hz.
- Rolada para diante de paredes considerando o corpo inteiro.
- Ryuchi completa a rolada pelo ciclo real de atualização sem deslocamento duplo.
- P2 é puxado ao redor de uma construção sem salto de posição ou penetração em parede.
- Entrada perto de parede encontra ponto válido para o P2.
- P2 não se move nem avança sua rolada durante pausa.
- Posição inválida herdada recupera-se sem desconectar o controle.
- Chefes finais expõem uma abertura depois de resolver o padrão.
- Ataques mirados dos chefes alternam entre jogadores sem alterar a posição do líder.
- iPhone simulado recebe automaticamente layout de retrato e alvos de toque grandes.
- Dois dedos mantêm movimento e ataque; soltar um mantém o comando do outro.
- Rotação muda o layout e libera gestos antigos.
- Conectar e desconectar controle físico restaura a apresentação de toque.
- Nenhum erro de execução registrado no navegador durante essa rodada.

## Inspeção visual

Capturas geradas pela build final em `mobile-portrait.png` e `mobile-landscape.png`. A cena é renderizada nas dimensões lógicas de cada orientação; os controles ficam fora da área jogável.

## Limites e próximos testes

- Emulação de viewport e touch no Chrome não substitui ergonomia e Safari em iPhone físico.
- DualShock/DualSense reais, USB e Bluetooth, precisam de rodada física com duas pessoas.
- O teste não percorre a narrativa inteira ou cada combinação de formação.
- A imagem da rolada ainda deriva do atlas existente, voltado ao perfil lateral. Foi corrigido seu fluxo e enquadramento; arte direcional adicional permanece como refinamento visual.
- P2 ainda possui versões simplificadas de técnicas, registradas na proposta de unificação dos kits.
