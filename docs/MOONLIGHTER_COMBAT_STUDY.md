# Estudo de combate — Moonlighter

## Escopo e limite autoral

Este estudo foi feito sobre a instalação local legitimamente fornecida pelo autor do projeto, apenas para compreender princípios de interação. Nenhum código, sprite, áudio, texto, mapa, parâmetro exato ou conteúdo de Moonlighter foi copiado para Torii & Hutukara.

Arquivo técnico observado: `Assembly-CSharp.dll` da versão Unity/Mono instalada. SHA-256: `3faf63c2f3613d9512e6b840ff15ee6521f53379a8bc822a37aa313b0a2761b1`.

## Estruturas observadas

- Ataque principal e ataque secundário possuem ciclos independentes: início, janela ativa, encerramento, carga e soltura.
- Cada família de arma altera alcance, compromisso, mobilidade, recuo e sequência, em vez de trocar apenas o dano.
- Combos são contados e reiniciados por tempo.
- Rolamento, ataques e técnicas especiais possuem janelas específicas de transição; o jogador não pode cancelar qualquer ação em qualquer instante.
- Ataques errados podem gerar recuperação e recuo, tornando posição e intenção relevantes.
- Invulnerabilidade, empurrão, colisão e animação trabalham como um único estado de combate.

## Tradução autoral para Torii & Hutukara

### Franco Sintetizador

- **J — Oscilador:** sequência de três formas de onda. Cada etapa muda largura, alcance, dano e tempo de recuperação. Errar aumenta levemente a recuperação.
- **Z — Pad harmônico:** posiciona até dois campos persistentes. Os campos pulsam dano em área e podem ser prolongados pelo terceiro golpe do oscilador.
- **X — Filtro de corte:** transpõe e consome os campos, atrai inimigos próximos, causa impacto e elimina projéteis dentro da área.
- **K — Camadas vivas:** permanece como assinatura de grupo, com dano global e pequeno fôlego para a formação.

O resultado não é um arqueiro com outra aparência: o sintetizador controla território, prepara combinações e decide quando consumir as próprias zonas.

### Ryuchi Percussionista

O kit já existente foi preservado porque trabalha com outra leitura: combo rítmico curto, defesa de contratempo, contra-ataque no impacto e ondas de percussão. Sua força vem do tempo; a do sintetizador vem do espaço.

## Princípios para as próximas versões

1. Cada personagem deve mudar a decisão do jogador, não apenas a cor do projétil.
2. Ataque, esquiva e técnica precisam de compromisso legível e janelas coerentes.
3. Erro deve ter consequência curta, nunca paralisar o fluxo.
4. Combos devem nascer da identidade narrativa do instrumento.
5. Parâmetros serão balanceados por playtest do próprio Torii & Hutukara, não por reprodução de números externos.

