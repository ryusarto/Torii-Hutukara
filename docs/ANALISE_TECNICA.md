# Análise técnica — TORII & HUTUKARA 1.1.2

A build original é um HTML de 40.080.984 bytes com Canvas, CSS/JavaScript embutidos e 49 imagens em data URLs (13 PNG e 36 WebP). A inspeção estática encontrou 189 declarações de funções tradicionais.

Sistemas presentes no código: mapas e exploração, NPCs e diálogos, interação e puzzles, combate de ação com esquiva/habilidades/golpes em dupla, equipes, níveis, relíquias, salvamento e checkpoints, controle por teclado/touch/gamepad, desafios rítmicos, síntese com AudioContext e faixas carregadas em buffer.

O Capítulo 2 inclui Cidade das Vozes, NPCs, relés, chefe e opção de playtest direta. Isso confirma código de implementação, mas não equivale a uma validação jogável de todos os caminhos.

O Capítulo 3 está em fase de narrativa/direção visual: 32 cenas e 135 falas, arquivos JSON e Markdown de missões e diálogo, materiais de arte do Distrito da Distorção. Os arquivos assinalam explicitamente `runtimeIntegration: false` e `visualRuntimeValidation: false`.

Prioridades de engenharia: preservar o HTML original como referência, externalizar assets e código apenas com validação de equivalência; testar saves antigos, progressão, derrotas, relíquias, áudio e carregamento; depois integrar o Capítulo 3 aos estados reais da build.

A versão original e todos os arquivos foram organizados em pacote local. Os arquivos grandes ainda precisam ser sincronizados com este repositório.
