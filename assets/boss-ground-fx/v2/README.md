# Boss FX V2 · mira e projéteis

Acrescenta `aim` e `projectile` aos quatro clips V1 existentes. Cada atlas RGBA1024×512 possui oito células256×256, pivô128,128 e filtro nearest. As fontes foram geradas pelo ImageGen integrado com referências aprovadas do próprio projeto; prompts e hashes estão em `PROMPTS.json`.

`projectile` é uma lasca de máscara marfim com núcleo de vórtice/filamentos de cobre e energia azul-pálida. Oito desenhos, frame nominal70ms, orientação determinada porvx/vy reais. O núcleo permanece na posição de colisão; o rastro curto é decorativo. `BossGroundFXV1.drawProjectile(p)` retornafalse quando não há arte decodificada para preservar o fallback. O hook do builder substitui apenas a pintura antiga de quadrados; não duplica ou remove projéteis, não altera vida/dano/tempo ou movimento.

`aim` reúne chevrons, fragmentos de máscara, cobre e marcas de equalizador: preparo0–3, liberação4, dissipação5–7. A arte é recortada pelas mesmas geometrias reais já usadas em BossChoreographyV2. Contornos e guias de direção continuam ativos para comunicar o alcance completo; a nova textura não amplia nem move a área de dano, e não oculta os personagens/UI. Movimento reduzido usa quadros estáveis e menor opacidade.

Cobertura visual: Viajante pulso/leque/investida; Arauto faixas/retorno/ondas/rajada; Metrônomo anel/cruz/leque/pulso; Silêncio anel/cruz/leque/chuva/pulso/perseguição/órbita. Os ataques continuam usando os casts V2 e as texturas de impacto V1, com a nova mira no preparo. As emissões5 e12 do Silêncio passam a exibir o projétil animado no lugar de quadrados.

`source/aim.png` registra a primeira proposta rejeitada por halo; `source/aim_clean.png` é a selecionada com espaço negativo transparente. Exportação técnica em `assets/boss-animations/v3/source/pack_v3.py`; não produz desenho por código. `VALIDACAO.json` verifica grade/alpha/quadros diferentes.14 checks legados de FX e7 de animação passaram em Node/VM. O resultado em jogo, desempenho mobile e legibilidade dependem da revisão de navegador do coordenador; não foram testados por esta frente.
