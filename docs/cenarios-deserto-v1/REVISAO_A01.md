# Revisão artística A01 — direção deserto

**Parecer: aceito para normalização e avaliação na câmera. Não solicito nova geração deste material.**

Escopo desta revisão: somente a fonte A01 nova e a folha A01 anterior. O contrato mestre da nova direção é mantido pelo outro chat; este parecer não o substitui nem o amplia.

Fonte revista: `/Users/henriqueryusartorelliuchiyama/.codex/generated_images/01a1cc4f-ebaa-7983-aa96-436bb79c2350/exec-f3965087-5c22-4bfd-bb8c-e97943f86e1e.png`.

Comparação: `assets/cenarios/v2/atlas/C3_SUPERFICIES_URBANAS.png` da recuperação em `/private/tmp/torii-cenarios-recovery-20261117/`.

## Fundamentação

- **Direção e materiais:** terra seca fissurada, pedra arenosa reparada e chapas corroídas comunicam desgaste físico e sucata. A mudança observada não depende de aplicar um filtro castanho sobre a imagem inteira: há alterações de superfície e de detalhes, como reparos metálicos e corrosão.
- **Paleta:** ocres, ferrugem, pedra quente e água escura substituem o predomínio violeta/ciano da versão anterior. Os pequenos pontos ciano no metal continuam como acento tecnológico, sem transformar toda a superfície em neon. A água conserva uma família escura distinta do chão seco; céu e abismo ficam mais quietos que os materiais de circulação.
- **Leitura:** seco e molhado possuem diferença de textura e valor; a calçada clara distingue-se do solo escuro. As placas metálicas e seus rebites conservam identificação industrial. A composição das oito células permanece reconhecível e não contém fachadas, móveis ou personagens embutidos.
- **Acabamento 16-bit:** os padrões principais e os recortes de material são compatíveis com a linguagem raster do projeto. A fonte possui detalhe fino em alta resolução; a leitura final deve vir do patch lógico normalizado, e não da reprodução deste painel inteiro a cada tile.

## Limite deste aceite

A franja vermelha e os resíduos externos visíveis em algumas células **não estão aprovados como arte final**. Este aceite pressupõe a normalização já prevista pelo integrador: recorte interno do material, inset de5%, conteúdo96 em célula104 e gutters RGBA limpos. Esses resíduos não devem virar borda, reflexo ou decoração no jogo.

Não foi revisto o PNG normalizado nem uma repetição em mosaico/câmera desta nova direção nesta etapa. Portanto, ainda não há aceite de costuras, alpha do export final, escala percebida no mapa ou contraste durante combate. Não foram realizados testes de gameplay ou campanha por este revisor.

**Decisão:** avançar com este A01. A remoção da franja exterior faz parte da exportação prevista; não é um pedido de outro conceito ou de nova campanha de assets.
