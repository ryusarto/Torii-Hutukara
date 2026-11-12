# Futuras Mudanças — Alpha 1.2.0

> **Status: PLANEJADO · NÃO IMPLEMENTADO / NÃO VALIDADO**
>
> Esta é a especificação das próximas mudanças de **TORII & HUTUKARA — A Última Frequência**. Não confundir com sistemas já presentes no HTML. A build 1.2.0 só será considerada pronta após validação real de todos os critérios abaixo.
>
> Última atualização do planejamento: 12/11/2026. Alterações de status exigem código entregue, teste e referência ao commit/build correspondente.

## Acompanhar implementação

Use a [issue principal de acompanhamento](../issues) na aba **Issues** do GitHub. A cada implementação, atualize o item correspondente com: **commit**, **build testada**, **resultado**, **evidência**, **problemas restantes**. Não marcar nada como concluído apenas por existir uma função no código.

### 1. Transição direta: Capítulo 2 → Capítulo 3
- [ ] Segundo chefe derrotado → entidade se desfaz, restando fragmento do Silêncio.
- [ ] O fragmento reconhece a derrota nesta realidade; sugestão de fala: “Vocês abriram vozes demais. Eu volto quando nenhuma delas conseguir escolher.”
- [ ] Fragmento entra na antena; as quatro máscaras reagem juntas.
- [ ] Franco, Ryuchi, Arqueiro e Katana percebem que a travessia não está sob controle deles.
- [ ] Rádio 9 tenta transmitir; o sinal vira a primeira batida do Capítulo 3.
- [ ] Transição visual estática → máscara → nuvens.
- [ ] Grupo aparece diretamente no **Terminal do Céu**, sem menu, seleção ou recarga.
- [ ] Salvamento antes da travessia e ao chegar ao Terminal.

### 2. Entrada coerente no Capítulo 3
- [ ] Abertura só com Narrador, Franco original, Ryuchi original, Franco Arqueiro, Ryuchi da Katana e transmissão impessoal sobre o Contratempo.
- [ ] Nenhum NPC desconhecido fala antes da apresentação.
- [ ] Maia é encontrada fisicamente no clube, apresenta-se e reconhece o sinal da Rádio 9.
- [ ] Maia explica problemas da Usina e do Canal, ligando Cidade das Vozes ao Lado B.

### 3. Nara: apresentação e deslocamentos físicos
- [ ] Maia informa que Nara foi verificar o Canal Suspenso.
- [ ] Grupo encontra Nara **ao sair do Contratempo**, preparando o estojo amarelo.
- [ ] Nara comunica que seguirá adiante; fala sugerida: “Vou na frente. A comporta não vai esperar vocês terminarem de entender esta cidade.”
- [ ] Sprite de Nara caminha até a saída do distrito.
- [ ] Ao chegar ao canal, jogador encontra Nara já na interferência.
- [ ] Nara explica a situação e aponta o percussionista sustentando a passagem.
- [ ] Após resgate, Nara retorna **fisicamente** à oficina.
- [ ] Falas de Ciro ramificam por ausência, retorno e entrega da flauta; nada de teleporte narrativo.

### 4. Novos protagonistas: apresentação com personalidade
- [ ] Ryuchi Percussionista surge **pelo som**: batidas que mantêm a ponte de pé e trabalhadores vivos.
- [ ] Percussionista salva uma pessoa antes de mostrar o rosto.
- [ ] Variante de diálogo se Ryuchi original estiver na formação: reconhece gestos antes do rosto.
- [ ] Variante se Katana estiver: humor diante da terceira versão.
- [ ] Variante especial se ambos estiverem: conversa entre os três Ryuchis.
- [ ] Variante sem Ryuchi escalado: Franco/Arqueiro reage primeiro, Ryuchis entram como personagens narrativos.
- [ ] Percussionista demonstra cuidado, senso de ritmo e medo de parar, não só aparição/desbloqueio.
- [ ] Franco Sintetizador recebe personalidade, vulnerabilidade, humor, motivação e decisão convincente de entrar na equipe.

### 5. Sprites próprios e animações
- [ ] Maia: sprite, retrato, animação atendendo no clube.
- [ ] Nara: sprite consistente no distrito, canal e oficina.
- [ ] Ciro: sprite com ferramentas e animação de bancada.
- [ ] Vega: sprite de palco, retrato, animação de show.
- [ ] Dimas: vendedor de discos com sprite próprio.
- [ ] Franco Sintetizador: conjunto direcional completo e retrato.
- [ ] Ryuchi Percussionista: conjunto direcional completo e retrato.
- [ ] Moradores: pelo menos seis variantes **reais**, não simples recolorações.
- [ ] Trabalhadores do canal: dois ou três modelos próprios.
- [ ] Operadores da Usina: variações industriais próprias.
- [ ] Nenhum NPC nomeado usa sprite genérico ou provisório; Maia **não** reutiliza Nara.

### 6. Cenários e objetos legíveis
- [ ] Sprites detalhados para postes, luminárias, bancos, placas, letreiros, caixas, lixeiras e grelhas.
- [ ] Máquinas da Usina e comporta do Canal.
- [ ] Bancada de Ciro e duto de teste da flauta.
- [ ] Entrada, controle e mecanismo do elevador.
- [ ] Objetos próprios no clube e banca de discos.
- [ ] Piso aproveita folha de materiais; objetos têm volume, sombra, luz e escala coerentes com capítulos anteriores.
- [ ] Validação automática sinaliza **sprites obrigatórios ausentes** na build de teste (sem objeto invisível ou pixel substituto na entrega).

### 7. Interferência do Canal: missão em etapas
- [ ] 1. Encontre Nara no Canal.
- [ ] 2. Examine a interferência.
- [ ] 3. Use o Violino das Vozes.
- [ ] 4. Atravesse a passagem revelada.
- [ ] 5. Derrote os ecos.
- [ ] 6. Ajude Nara a liberar a comporta.
- [ ] 7. Confirme que todos atravessaram.
- [ ] 8. Retorne à oficina ou conclua a Usina.
- [ ] A cada etapa, marcador anterior some, objetivo muda de posição e diário atualiza imediatamente.
- [ ] Save/reload preserva etapa concluída.
- [ ] Matar último inimigo não deixa objetivo travado na ponte.
- [ ] Comporta abre visualmente e trabalhadores atravessam, com mudança persistente do mundo.

### 8. Elevador, nuvens e sequência de chefes
- [ ] O objetivo mostra exatamente o requisito faltante: Usina, Canal, Flauta, Frase no Contratempo, Tambor ou Controle do Elevador.
- [ ] Nada de bloqueio circular; após show, entrada do elevador fica acessível, e apenas mecanismo interno depende da ativação.
- [ ] Subida leva a tutorial curto das nuvens.
- [ ] Caminho claro até **O Metrônomo**.
- [ ] Checkpoint depois do miniboss.
- [ ] Último Torii e sinalização clara de **O Silêncio**, chefe final.

### 9. Iniciar Capítulo 03 (teste alpha)
- [ ] Botão no menu **INICIAR CAPÍTULO 03 · TESTE ALPHA**.
- [ ] Cria estado coerente: capítulos anteriores concluídos, quatro personagens anteriores disponíveis, relíquias corretas, níveis e recursos equilibrados.
- [ ] Nenhuma missão do Capítulo 3 marcada artificialmente como concluída.
- [ ] Estado de teste separado de **Continuar**, sem apagar ou sobrescrever o save principal sem aviso.

### 10. Critérios obrigatórios para lançar 1.2.0
- [ ] Derrotar segundo boss e entrar diretamente no Capítulo 3.
- [ ] Funcionar pelo fluxo normal e pelo botão de teste.
- [ ] Testar Usina → Canal e Canal → Usina.
- [ ] Testar todas as formações relevantes e suas variantes de diálogo.
- [ ] Validar Nara em cada local e transição.
- [ ] Concluir missão do Canal sem travamento.
- [ ] Validar Ciro após retorno de Nara.
- [ ] Tornar elevador acessível e o mecanismo acionável.
- [ ] Jogar caminho completo até O Metrônomo e O Silêncio.
- [ ] Migrar saves antigos sem perda.
- [ ] Garantir NPCs/objetos reais, visíveis e animados, sem placeholders.
- [ ] Executar teste **offline em outro computador**.

## Regra de atualização do repositório

**Planejado → Em implementação → Implementado (não validado) → Validado na build → Concluído.**

Ao receber uma nova build, comparar com esta especificação; registrar commits relevantes, testes, problemas e screenshots quando existirem; só alterar os checkboxes mediante evidência. Se uma funcionalidade já estiver no HTML atual, registrá-la como **existente no código / validação pendente**, nunca presumir que está pronta. Não mudar o arquivo HTML de referência ao fazer manutenção deste planejamento.
