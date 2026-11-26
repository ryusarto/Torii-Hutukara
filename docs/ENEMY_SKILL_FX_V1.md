# Golpes próprios dos seis inimigos

Integrado na Beta1.17 local `36465da160b56425f49fd00739b39693148266cb54effe2875a14b398cbbfd05`. Sem merge/publicação.

O pedido era substituir os glifos por ataques que desenvolvem matéria no espaço e preservam o cenário. Seis fontes originais foram produzidas com o `image_gen` integrado, usando os FX reais dos bosses como referência de matéria/pixel. Dez clips somam80 poses: concentração, aceleração, ruptura e dissipação. As fontes RGBA, prompts exatos e proveniência estão em `assets/enemy-skill-fx/v1/`; os corpos aprovados dos personagens/inimigos permanecem nas rotas anteriores.

| Inimigo | Ações apresentadas |
| --- | --- |
| Tambor-Escudo | Cristas de pressão frontal e fragmentos de cobre, incluindo segunda pancada no Difícil |
| Flautim Atirador | Filamento móvel com núcleo físico registrado e contato independente; três trajetórias no Difícil |
| Coro de Reparo | Fios ascendentes no aliado realmente curado e golpe próximo curto |
| Maestro Oco | Concentração no emissor e condensação nos dois Nós realmente nascidos |
| Muralha de Estática | Pancada próxima e investida com rastro/ruptura no destino real após colisões |
| Antena de Feedback | Descarga horizontal segmentada, com três eixos no Difícil |

## Encaixe e integração

`enemy_skill_fx_v1.js` e os hooks de `combat_readability_v1.js` substituem somente a apresentação dos seis tipos. O golpe usa o perigo real e os callbacks existentes; não há novo dano, hitbox ou cronômetro da AI. Material do chão é desenhado uma vez; foreground mantém o aviso funcional. A limpeza de alpha≤8 ocorre só nos derivados, com gutters da fonte verificados antes de recortar e pivô/escala fixos por clip.

A primeira revisão em contexto detectou que as margens transparentes atrofiavam a forma. O encaixe final usa os `contentBounds` constantes: crista dentro do cone real e feixe com altura útil de um tile (T=24), sempre recortados pela geometria existente. O núcleo do projétil usa pivôs medidos nos três quadros de voo; Coro e emergência do Maestro usam base fixa. Não se recentra cada fase nem se amplia área de dano.

Um WeakSet identifica somente as decorações nativas novas dos mesmos releases, por identidade e parâmetros exatos. O desenho filtra/restaura a lista original em `finally`; preserva efeitos alheios e acréscimos feitos na delegação. A supressão inclui os aros externos dos Nós recém-nascidos daquele Maestro e o strike extra no destino da investida da Muralha. A marca plana nativa de nascimento permanece. Não há filtro global de efeitos, remoção de avisos, XP ou feedback de outras origens.

O builder continua verificando o hash completo antes do rename atômico. Em APFS, clona o portable existente e escreve só os chunks diferentes, evitando uma segunda alocação integral de≈472MiB; em outros ambientes mantém a escrita completa. A saída temporária deve ser byte a byte equivalente ao HTML montado.

## Evidência

- 24 testes VM do módulo; validação estrutural da build; revisão independente HTTP e comparações A−B no `drawEnv` real, com estado/câmera estabilizados.
- 80 poses/10 loops comparados com as fontes e aprovados pela direção;11 gravações reais das oito ações e três padrões do Difícil, em `qa/beta-1.17.0/enemy-skill-fx-v1/build-b121e997/`.
- Os closes são recortes da tela do runtime, sem composição de sprites por fora. IA/timers originais, vida do alvo aumentada somente na fixture, um herói isolado e movimento real por setas nos cones. Os GIFs usam20fps na velocidade da simulação.
- `qa/beta-1.17.0/enemy-skill-fx-v1/index.html` reúne os seis inimigos, ações adicionais e capturas móveis emuladas. `REVISAO.md` e `design/enemy_skill_fx_v1/DIRECAO_E_ACEITE.md` separam teste técnico e leitura artística.

Essas evidências não constituem campanha humana completa, teste físico ou benchmark universal de desempenho. A aceitação visual foi feita sobre quadros e gravações do jogo.

A correção final 36465da1 aceita, somente para o spawn recém-criado do Maestro, o tempo nativo já descontado do mesmo dt. Seu filme foi regravado nesse SHA; os outros dez e os dois móveis permanecem no b121e997, com os respectivos renderers inalterados. Os JSONs por pasta preservam a URL de captura.
