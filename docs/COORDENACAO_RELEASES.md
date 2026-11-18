# Coordenação de releases — Torii & Hutukara

Atualizado em 17/11/2026 pela coordenação do jogo. Reservas de produção e versões integradas são distinguidas abaixo. O estado do site exige conferir o workflow e o build-info, além do merge.

## Base consultada

Main `47039cdd94f86dd0c9a253bc4fcf4a2c809acb81`: PR #13 integrado, game/VERSION.json declara **Beta 1.5.0** com inimigos e ataques animados dos quatro chefes. Os músicos da Beta 1.3 permanecem no histórico integrado.

## Estado e próxima entrega

| Versão | Frente responsável | Escopo | Situação |
|---|---|---|---|
| Beta 1.3.0 | Músicos | Músicos chibi e paleta canônica | Integrada antes do PR #13; preservar |
| Beta 1.5.0 | NPCs/inimigos e bosses | Inimigos próprios e ataques animados dos quatro chefes | PR #13 integrado em 47039cdd; confirmar publicação pelo workflow/site |
| Beta 1.6.0 | Cenários / Analisar build HTML TORII Hutukara | Direção desértica do C3, biblioteca, integração e exportação | Próxima candidata; incorporar main1.5, recompilar e revalidar o conjunto |

A reserva anterior **1.4.0 para cenários foi realocada para 1.6.0**, pois a main avançou para 1.5 antes da conclusão dos cenários. Os assets recuperados continuam válidos. Não promover a build de cenários1.4 por cima da main1.5 nem simplesmente renomear seu executável.

O checkpoint de cenários permanece recuperável na branch art/cenarios-deserto-v1 e nos backups próprios. Os executáveis e relatórios anteriores são evidências das respectivas fontes, não validação da próxima composição1.6.

## Regras de integração

1. Produzir código, arte e documentação em paralelo, com posse explícita dos arquivos e saídas locais separadas.
2. Serializar merge/publicação. Neste estado, cenários1.6 incorpora músicos1.3 e inimigos/bosses1.5.
3. Se a ordem mudar novamente, distribuir o próximo número livre antes da publicação. Nunca baixar a versão da main ou reutilizar uma pasta pública com conteúdo diferente.
4. Antes de integrar, reler main e reconciliar por trechos gerador, exportador, runtime e camadas de arte. Não restaurar arquivos inteiros de uma base antiga sobre as mudanças recentes.
5. O relatório final identifica versão e SHA-256 do executável efetivamente executado. Mudança de fonte compilada/versão exige nova build e evidência; relatórios anteriores permanecem históricos. Um commit exclusivamente documental não muda por si o hash do executável.
6. A exportação streaming conserva prova exata de roundtrip por SHA-256, detecção de mídia ausente e estados. Otimização de memória não elimina a prova.
7. Validar a composição final com cenários, geometria, inimigos/bosses, músicos, protagonistas, controles, saves e site; registrar limites de campanha e hardware.
8. Testes/aceite aprovados autorizam integração automática conforme orientação do autor, sem novo aceite manual repetido.

## Recuperação e computação local

A frente de cenários informou recuperação de seus assets após limpeza/reinício de /private/tmp. Seu diretório ativo é /private/tmp/torii-cenarios-final-recovery; a frente continua dona do renderer e dos PNGs. Não modificar nem apagar seu trabalho por esta coordenação.

Combinar o início de builds Ruby, exportações grandes e suites de navegador locais: uma frente pesada por vez. Preparação leve e CI remoto podem prosseguir em paralelo. Cenários tem a próxima rodada pesada para fechar a recuperação/integração1.6; confirmar sua conclusão antes de iniciar outra rodada. Isto é uma fila datada, não um bloqueio permanente.

Não encerrar processos ou apagar arquivos de outra frente. Limpeza é restrita aos temporários próprios, encerrados e comprovadamente recuperáveis. Conferir espaço disponível ao executar. A amostra antiga em8791 não é a entrega final.

## Limites

Este arquivo modifica somente a coordenação documental. Não altera game/VERSION.json, runtime, assets ou o site. A Beta1.6 não é declarada publicada aqui. Preservar os avanços da main e confirmar o estado real antes de promover.
