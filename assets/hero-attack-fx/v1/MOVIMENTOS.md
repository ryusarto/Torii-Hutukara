# Sprites dos golpes de Torii & Hutukara

O atlas hero_attacks.png possui células de 96 × 96 px, dez quadros por sequência. A segunda metade horizontal contém as sequências 24 a 41. O gerador Canvas draw_atlas.js descreve o desenho de cada quadro e pack.cjs rejeita quadros vazios, repetidos dentro da mesma sequência ou tocando as bordas. O movimento normal inicial de Ryuchi usa ainda o atlas externo de quatro quadros. Os sprites de efeito acompanham as poses corporais de ataque já existentes.

| Herói jogável | Ataque normal | Habilidade Z | Habilidade X | Super com ressonância |
| --- | --- | --- | --- | --- |
| Franco | Palhetada do baixo, retorno e acento final | Pulso radial | Acorde de impacto, com quatro notas na onda | Coração grave pulsando sobre a pauta |
| Ryuchi | Arco de espada, contragolpe e finalização | Três lâminas sônicas, com sprite em cada projétil real | Passo sônico com rastros na chegada | Corrente de vozes com elos e marca nos alvos atingidos |
| Arqueiro | Soltura da corda e flecha | Disparo perfurante com rastro maior | Três horizontes com três disparos reais em sequência | Chuva de flechas e novos impactos a cada pulso da marca |
| Katana | Dois cortes opostos e estocada | Iai | Postura de aparo e faísca no contra-ataque confirmado | Corte do horizonte com duas arestas |
| Sintetizador | Três ondas com amplitude crescente | Campo harmônico com marca no pad | Filtro que contrai sobre cada campo | Camadas vivas com ondas entrelaçadas e descarga nos alvos |
| Percussão | Duas baquetas, segunda batida e fechamento | Contratempo com sinal de guarda e marca no contra-ataque | Quebra rítmica com três pulsações temporizadas | Pulso comum com oito acentos no anel |

As quatro entradas para P1 são attackAction, skillAction, advancedSkill e duoAction. Para P2, coopAttack, coopSkill, coopAdvanced e coopSignature disparam a identidade visual do personagem na posição do segundo jogador. P2 usa as próprias regras existentes de dano, área, combo e recarga. Suas habilidades especiais têm mecânica compartilhada entre classes. As roupas e máscaras compartilham o efeito da arma. A flecha conserva sua orientação a cada atualização, tanto nas salvas e na perfuração de P1 quanto no disparo de P2.

O jogo também pode atacar usando o primeiro aliado controlado pela IA. O efeito breve parte do aliado real e aponta ao alvo. Golpes em várias fases usam os eventos já produzidos por effect10 (counter, drumCounter, drumBreak, synthFilter e synthPad), pelas marcas chain e rain de traceSpecial11 e pelo vetor dos projéteis reais. Apertar novamente uma ação em recarga não reinicia sua animação. A opção de movimento reduzido seleciona uma pose estável e o relógio das animações acompanha as pausas.

Para rasterizar o atlas, execute `node assets/hero-attack-fx/v1/pack.cjs` com Playwright e Chromium disponíveis. A suíte `node qa/hero_attack_fx_browser.cjs URL` verifica o atlas publicado, as ações e os combos em navegador isolado. Nenhum item da tabela representa uma nova habilidade de gameplay.
