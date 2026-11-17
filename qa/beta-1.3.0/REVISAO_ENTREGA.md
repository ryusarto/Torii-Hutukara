# Entrega dos músicos · Beta 1.3 · 17/11/2026

Pacote concluído: Ryuchi Percussionista e Franco Sintetizador, versões com e sem máscara, cabeça grande e pernas curtas. São 56 folhas-fonte (52 de ações e quatro de expressões), 52 atlas, 208 sequências de oito poses e 32 retratos. A folha mistura apenas direções da mesma ação/personagem/máscara. A máscara mantém o marfim com costura, espinhos e óculos; os instrumentos continuam distintos.

A nova paleta de vestuário usa alterações discretas de RGB, guiadas por areia, ferrugem e metal gasto. Não houve redesenho, interpolação ou mudança de coordenadas. Auditoria dos 140 pares: alpha idêntico, agrupamentos de sombreamento preservados e zero pixels protegidos modificados. As cores quentes, marfim, contorno escuro e acentos tecnológicos definidos na receita permanecem protegidos. As 56 fontes e os 84 PNGs de runtime foram promovidos juntos; os arquivos da paleta anterior foram substituídos somente após essa verificação. Os hashes anteriores permanecem na auditoria. Não há pacote contextual duplicado.

A direção artística, game design e coordenação participaram da produção e revisão. Uma folha de especial que misturava personagens foi rejeitada e substituída antes do pacote final; nenhum PNG rejeitado é publicado. Os quatro ajustes de recorte da revisão de fontes preservaram todos os pixels visíveis. A auditoria de paleta confirma que essa geometria aprovada permaneceu igual. Os documentos REVISAO_CORTES_FONTE registram a etapa anterior à troca de cores; seus hashes históricos não substituem PRODUCAO.json/AUDITORIA_GEOMETRIA.json atuais.

## Verificação executada nesta entrega

- Build portátil: 380.795.001 bytes, SHA-256 `539cb3ad2fa3eeee9d39a229c2011f5d6974a9aa995be61791bc146934191c93`.
- Validação estática: 121/121 verificações.
- Módulo dos músicos: ações aceitas/bloqueadas, relógios independentes de P1/P2, mudança de papel/área/save, máscaras, NPCs/retratos, fallback, cache de oito imagens, derrota mantida no chão e pausa de diálogo.
- Render real dos músicos: oito checks, decodificando as 208 sequências/1.664 poses, máscaras e técnicas. Zero erros no navegador.
- Ninja/Arqueiro: oito checks; Protagonistas V5: 11 checks. Comparações exatas de pixels preservam os quatro heróis previamente integrados. O canvas é aquecido com três draws do renderer capturado antes da comparação estrita para estabilizar a leitura GPU; não há tolerância de diferença.
- Estado V5: 24 verificações unitárias; controles: 22; gameplay/save/progressão: 20; recorrência de NPCs: 32 casos direcionais/temporais.
- Site: quatro verificações, incluindo áudio decodificado, PC, mobile e iPad com identificação desktop. Prévia offline: 208 combinações, frames 0/3/7, 32 miniaturas, zero requisições de frames individuais e zero erros.
- Exportação dos 1.664 PNGs individuais: round trip dos pixels aprovado, digest `91b0d6caeebc44e078cbf1a0370f3b189edfb25a9b6fe1f9b4a2d4ba92cb1427`.

As capturas canônicas, do render e dos layouts mobile foram inspecionadas. Os testes usam Chrome headless e perfis/controles simulados, sem saves pessoais. Não houve teste em telefone ou controle físico nem uma nova jornada manual completa do início ao fim. A entrega adiciona arte e seleção visual; preserva saves, dano, cooldowns, colisão, geometria e os módulos Ninja/Arqueiro, Protagonistas V5 e Cenários V2.

O HTML portátil e os frames individuais são regeneráveis; não são commitados como cópias duplicadas. GitHub contém fontes, atlas, retratos, manifesto, receita, auditoria e ferramentas. Os relatórios desta pasta correspondem à mesma build final.
