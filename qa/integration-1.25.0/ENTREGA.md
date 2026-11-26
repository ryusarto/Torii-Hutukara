> Registro histórico da entrega local. A publicação foi autorizada posteriormente; veja [PUBLICACAO.md](PUBLICACAO.md).

# Integração local Beta 1.25.0

Base GitHub verificada: `ryusarto/Torii-Hutukara`, main `db6297e25a3e701276df0b1ffd04b1dafb14afce` (Beta 1.24.1). Ponto comum: `66b0dbc3ca12b6f0342fb49e1b3e27f2f38c47a7`. As 74 entradas da comparação foram conciliadas; procedência e resolução por arquivo em `UPSTREAM.json`.

Esta é uma entrega local. Não houve push, merge remoto nem alteração do checkout de trabalho `REPOSITORIO`.

## Incorporado

- Sete atividades musicais nativas e seus recursos: Ponte, Rádio 9, Lumi, Canal/Violino, Usina, Clube e Ecos Finais. Ponte/Canal/Clube/Final continuam acontecimentos no mapa, com HUD próprio; Rádio/Usina/Lumi mantêm seus callbacks nativos no painel.
- Recuperação de posições inválidas, preferência de áudio, câmera em mapas pequenos, caminhada do Metrônomo, cenários, gravações e progressão/recuperação dos ecos da base 1.24.1.
- A estética aprovada dos menus, pausa, equipe, capítulos, dificuldade, diálogos, controles reposicionáveis e HUD permanece integrada. Novos painéis usam a mesma moldura e componentes pixelados.
- Combate mantém corrida/recortes corrigidos, portal no chão, colisão do dash e barras individuais; somente chefes usam barra grande.
- Seis inimigos usam efeitos animados próprios. Tambor e Flautim ganharam novas fontes raster V2; os demais quatro preservam as animações autorais e receberam melhor sustentação/escala/ordem de desenho. Não houve aumento de dano, hitbox, velocidade de projétil ou tempo de perigo para obter mais visibilidade.

## Arte

`assets/enemy-skill-fx/v2/` contém os seis atlases e manifesto. Os sprites novos de Tambor/Flautim foram criados com image_gen integrado: fontes RGBA, prompts exatos (`PROMPTS.json`), proveniência (`PRODUCTION.json`) e validação de margens/quadros incluídos. Não são mockups sobrepostos às capturas.

O golpe de chão tem pico de 180 ms e dissipação até 450 ms. O Flautim tem projétil corporal 72×56 com núcleo alinhado à colisão física e impacto próprio; Tambor ocupa seu setor real com cristas de pressão separadas, deixando o chão aparecer.

A abertura da Usina pelo toque foi corrigida: o clique de compatibilidade do mesmo gesto que abre um painel/fala não pode ativar um botão recém-aparecido sob o dedo. Um novo toque funciona normalmente; segurar a nota do Canal continua começando no pressionamento. A falha original e o reteste ficam registrados nos traces nativos.

## Evidência e limites

As gravações são da execução HTTP real, com IA e colisões nativas em encontros controlados nos mapas originais. O jogador foi posicionado e recebeu vida elevada para permitir a gravação. Não representam uma campanha humana integral. A indicação da Ponte pode aparecer quando o encontro é capturado perto dos instrumentos.

Teclado, toque e controle são automatizados/emulados; não equivalem a validação física em celulares ou gamepads. Os resultados por teste e hashes da distribuição constam no relatório final de execução ao lado deste documento.

## Distribuição

O HTML portátil é a saída canônica do compilador. A exportação HTTP verifica a reconstrução exata do conteúdo, conserva áudio e aplica somente compressão sem perda às imagens aceitas. O exporter move sua pasta temporária no mesmo volume para evitar duplicar a mídia durante a geração; recria a pasta vazia para o cleanup do Ruby 2.6.
