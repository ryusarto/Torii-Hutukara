# Ataques e locomoção — revisão V9

25/11/2026, America/Sao_Paulo. Incremento local da Beta 1.17.0, sem merge ou publicação.

## Corrida: diagnóstico antes de acrescentar frames

O pedido foi refinado pelo usuário: verificar o movimento completo e o código antes de aumentar a quantidade de desenhos. A corrida mantém suas 16 poses existentes. Não foram inventados intermediários por duplicação, crossfade ou deformação.

Havia três causas distintas: relógios de caminhada e corrida diferentes, registro das poses pelo pé mais baixo acrescido de outro deslocamento de voo, e intermediários da caminhada inicial do Ryuchi com proporções diferentes. Nas transições de algumas variantes, os relógios divergiam em quase meia passada. A caminhada à esquerda alternava desenhos com alturas aproximadas de 184 e 146 pixels fonte.

`run_stride_v1.js` agora mantém fase por deslocamento real de cada ator. Caminhada, corrida e fallback compartilham essa fase; mudança de direção considera o deslocamento após a colisão e tem tolerância para ruído nas diagonais. Parada, parede e pausa interrompem a progressão visual. Ações conservam a sua própria precedência. P1, P2 e seguidores têm estados separados.

`assets/protagonistas/v9-registro/registration.json` contém translações por pose, direção e variante. A escala é sempre 1: não se amplia ou encolhe a cabeça entre frames. Um limite impede que o pé opaco seja deslocado para baixo do plano do chão; os pés podem subir nas poses aéreas existentes. A sombra e a colisão permanecem no mundo. O arqueiro também recebe a mesma translação nas duas camadas enquanto atira em movimento, mantendo o encaixe da cintura e a mira independente.

Somente a linha defeituosa de caminhada do Ryuchi sem máscara à esquerda usa oito desenhos canônicos, nas colunas pares da folha original. A duração e a fase física do ciclo independem desse número. As outras linhas permanecem com seus desenhos existentes. O gerador de metadados é `production/register_locomotion_v9.py`; os PNGs canônicos da corrida não foram alterados.

## Ryuchi no início e bordas

A correção anterior alcançava a corrida V8, mas a caminhada e o descanso iniciais usavam outras folhas. A limpeza agora é preparada antes da execução: `production/clean_ryuchi_matte_v9.py` produz 12 derivados em `assets/protagonistas/v9-matte/`. O manifesto registra fontes, hashes e contagens. Alfa, pixels opacos, linhas mascaradas e PNGs originais são preservados.

O builder substitui somente as imagens de corpo correspondentes e marca `bakedEdgeMatte`. Não há varredura pesada de pixels no primeiro carregamento desses atlas, nem apresentação provisória da folha bruta. A versão V8 da corrida continua com sua correção compacta no decode de exibição. Os testes conferem início no estúdio nas quatro direções, fundos preto/terra/verde e ausência de regressão das partes claras válidas do figurino.

## Novos efeitos dos personagens

Foram geradas seis folhas originais com o `image_gen` integrado, usando os efeitos dos bosses do próprio projeto como referência. São 36 clipes e 288 desenhos: três ataques de combo, Z, X e K para cada personagem. Os arquivos fonte, prompts e manifestos ficam em `assets/hero-attack-fx/v3/`; o importador é `production/import_hero_attack_v3.py`.

Cada folha exportada tem 1024 × 768, grade 8 × 6, células 128 × 128, pivô (64,64), filtro nearest e oito pixels transparentes de margem. Resíduos de alfa 1–8 foram removidos apenas dos derivados; as imagens geradas originais ficam preservadas. Todas as 288 células foram conferidas contra vazamento entre quadros. As pranchas de contraste incluem fundos claro/escuro e recortes reais da floresta e das ruínas.

As fases têm reunião, contato e dissipação próprios. O desenho fica concentrado no gesto ou no alvo; antigas ondas, contornos e ornamentos redundantes são suprimidos no caminho V3. A primeira ação usa a pose corporal enquanto o efeito carrega, sem retornar aos efeitos grandes anteriores. Projéteis acompanham os seus pontos reais, e um golpe sem acerto não inventa impacto no inimigo. A preparação do ataque, os recursos, o dano, as colisões e as recargas continuam pertencendo à simulação original.

## Evidências e limites

- `qa/beta-1.17.0/locomotion-v9/`: comparação antes/depois, 50 verificações, ciclos completos no mundo, transições, diagonais, parada, parede, pausa, carregamento atrasado, jogador 2 e abertura com Ryuchi.
- `COMPARATIVO.json`: na corrida direita medida, variação do topo caiu de 7–9 para 1–4 pixels, conforme o personagem; nenhum pé ultrapassou o plano do chão nas capturas medidas. Algumas poses originais conservam suspensão estilizada dos pés.
- `after/RYUCHI_HALO.json` e `assets/protagonistas/v9-matte/manifest.json`: correção da franja e carregamento dos derivados sem limpeza durante a execução.
- `hero-fx-v3/`: 36 clipes auditados como assets e nove cenários de navegador, incluindo 48 ações de P1/P2, combos, quatro direções, acerto/erro, projéteis, seguidores, pausa, movimento reduzido e PC/mobile emulado.
- `qa/archer_strafe_browser.cjs`: caminhada/corrida, P1/P2 e seis ações do arco com pernas, cintura e mira independentes.
- `REVISAO_ANIMACAO_V9.md` e `design/animation_v9/DIRECAO_E_ACEITE.md`: revisão técnica independente e avaliação artística.

As capturas e métricas foram obtidas em Chromium com cenários controlados; não equivalem a uma campanha humana completa ou a teste em aparelhos físicos. GIFs permitem revisar o movimento em vez de inferir fluidez apenas de uma imagem parada.


A amostra animada dos efeitos usa gravações reais de ataques aceitos; os GIFs são mais lentos para inspeção, sem alterar a temporização do jogo. Os seis emissores adiados (projéteis, seguidores, pad, chuva, contracorte e pulsos) foram testados com origem explícita e um contato V3 por acerto. O ensaio do arqueiro cobriu 24 combinações e 712 desenhos das camadas registradas. A exportação HTTP final passou três verificações de módulos, carregamento lazy dos seis atlas e caminhada inicial do Ryuchi. Galeria em `qa/beta-1.17.0/ANIMACOES_V9.html`.
