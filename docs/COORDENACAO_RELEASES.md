# Coordenação de releases — Torii & Hutukara

Atualizado em 20/11/2026 após a confirmação dos FX no Pages. Reservas de produção e versões integradas são distinguidas abaixo. O estado do site exige conferir o workflow e o build-info, além do merge.

## Base consultada

Main funcional `3e7ad3f5c9ba484e9e257e016102c19d8389c235`: **Beta 1.7.0**, com FX dos golpes no chão, cenários desérticos, músicos revisados na 1.6.1 e inimigos/bosses da 1.5 preservados. Publicação e hashes conferidos em 20/11/2026.

## Versões integradas

| Versão | Frente responsável | Escopo | Situação |
|---|---|---|---|
| Beta 1.3.0 | Músicos | Músicos chibi e paleta canônica | Integrada antes do PR #13; preservar |
| Beta 1.5.0 | NPCs/inimigos e bosses | Inimigos próprios e ataques animados dos quatro chefes | PR #13 integrado em 47039cdd; incluído na publicação 1.6 |
| Beta 1.6.0 | Cenários / Analisar build HTML TORII Hutukara | Direção desértica do C3, biblioteca, integração e exportação | Integrada em bf1c2dc; workflow 44227852940 aprovado e site/hash confirmados |
| Beta 1.6.1 | Músicos | Máscaras, cadência e transições | PR #16 integrado em 86e3085; publicação 44230185415 aprovada |
| Beta 1.7.0 | NPCs/inimigos e bosses | 32 quadros de FX dos golpes no chão | PR #15 integrado em 3e7ad3f; publicação 44232084397 aprovada e site/hash confirmados |

A reserva anterior **1.4.0 para cenários foi realocada para 1.6.0**, pois a main avançou para 1.5 antes da conclusão dos cenários. Os assets recuperados continuam válidos. Não promover a build de cenários1.4 por cima da main1.5 nem simplesmente renomear seu executável.

O checkpoint de cenários permanece recuperável na branch art/cenarios-deserto-v1 e nos backups próprios. Os executáveis e relatórios anteriores são evidências das respectivas fontes. A composição final 1.6 foi recompilada e revalidada; seus resultados identificam o hash abaixo.

## Publicação atual confirmada — Beta 1.7

- [Publish playtest 44232084397](https://github.com/ryusarto/Torii-Hutukara/actions/runs/44232084397) concluído com sucesso para 3e7ad3f.
- Pages conferido em 20/11/2026: 1.7.0, SHA-256 da fonte `5af9381eddcafa26fd671adbca39cc27bb879549f8e4a85500db962ac151a6d7`; HTML e quatro atlas com hashes idênticos aos validados. Roundtrip e HTML portátil preservados.
- Arte e gameplay aprovados no head e4f5158; publicação recompilou a composição e repetiu as suítes. [Relatório e limites](../qa/boss-ground-fx-v1/PLAYTEST.md).

## Histórico da publicação — Beta 1.6

- [Workflow Publish playtest](https://github.com/ryusarto/Torii-Hutukara/actions/runs/44227852940): concluído com sucesso para o commit bf1c2dc.
- [Jogo online](https://ryusarto.github.io/Torii-Hutukara/): build-info retornou versão 1.6.0 e SHA-256 `517715fe2e742bf3e19b2e238f0286378e5c63335002a1e116cf62fe3b10b845`.
- HTML portátil informado pela frente: 401.631.199 bytes. A exportação conserva prova de roundtrip; o site contém o renderer desértico e os protagonistas/variantes.
- Evidência da frente responsável: 137/137 verificações estáticas, 14/14 suítes, 88 casos de geometria, 13 de compatibilidade, 26 câmeras e 19 estados revisados.
- Conferência desta coordenação: sucesso do workflow, GET do site/build-info, presença do renderer desértico e ausência do inimigo prematuro do corredor. Revisão visual limitada às capturas consultadas; não foi executada uma nova campanha manual por esta coordenação.
- Suites em navegador isolado e emulação não equivalem a teste em aparelhos ou controles físicos.

## Regras de integração

1. Produzir código, arte e documentação em paralelo, com posse explícita dos arquivos e saídas locais separadas.
2. Serializar merge/publicação. Neste estado, FX1.7 incorpora músicos1.6.1, cenários1.6 e inimigos/bosses1.5.
3. Se a ordem mudar novamente, distribuir o próximo número livre antes da publicação. Nunca baixar a versão da main ou reutilizar uma pasta pública com conteúdo diferente.
4. Antes de integrar, reler main e reconciliar por trechos gerador, exportador, runtime e camadas de arte. Não restaurar arquivos inteiros de uma base antiga sobre as mudanças recentes.
5. O relatório final identifica versão e SHA-256 do executável efetivamente executado. Mudança de fonte compilada/versão exige nova build e evidência; relatórios anteriores permanecem históricos. Um commit exclusivamente documental não muda por si o hash do executável.
6. A exportação streaming conserva prova exata de roundtrip por SHA-256, detecção de mídia ausente e estados. Otimização de memória não elimina a prova.
7. Validar a composição final com cenários, geometria, inimigos/bosses, músicos, protagonistas, controles, saves e site; registrar limites de campanha e hardware.
8. Testes/aceite aprovados autorizam integração automática conforme orientação do autor, sem novo aceite manual repetido.

## Recuperação e computação local

A frente de cenários informou recuperação de seus assets após limpeza/reinício de /private/tmp. Seu diretório ativo é /private/tmp/torii-cenarios-final-recovery; a frente continua dona do renderer e dos PNGs. Não modificar nem apagar seu trabalho por esta coordenação.

Combinar o início de builds Ruby, exportações grandes e suites de navegador locais: uma frente pesada por vez. Preparação leve e CI remoto podem prosseguir em paralelo. A frente informou que encerrou a rodada local pesada da 1.6; a janela foi liberada. Combinar a próxima execução entre as frentes; este registro não é um bloqueio permanente.

Não encerrar processos ou apagar arquivos de outra frente. Limpeza é restrita aos temporários próprios, encerrados e comprovadamente recuperáveis. Conferir espaço disponível ao executar. A amostra antiga em8791 não é a entrega final.

## Limites

Este arquivo modifica somente a coordenação documental. Não altera game/VERSION.json, runtime, assets ou o site. A publicação 1.7 acima foi confirmada; versões futuras continuam exigindo conferência real antes da promoção.
