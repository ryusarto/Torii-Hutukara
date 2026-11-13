# Endereço provisório de testes

URL: https://ryusarto.github.io/Torii-Hutukara/

O mesmo endereço abre a Alpha 1.2.1 em computador, celular ou tablet. O jogo seleciona teclado ou interface de toque automaticamente e continua aceitando controles físicos.

Na entrada, um aviso mostra **PC** ou **MOBILE**, acompanhado da versão. Ele fica por quatro segundos, desaparece em 250 ms e é removido da página. Não retorna ao girar o aparelho, trocar de aplicativo ou conectar um controle, nem ocupa espaço no layout. O identificador descreve o modo selecionado pelo jogo; o parâmetro de teste `?input=mobile` ou `?input=desktop` pode forçá-lo.

A identificação acontece no próprio navegador. Não há analytics, contagem de acessos, identificador pessoal ou envio do tipo de aparelho para um servidor. Para depuração, a identificação da sessão permanece em `window.ToriiPlaytest` e no atributo `data-playtest-device` do HTML, sem aviso permanente na interface.

## Publicação

O usuário tornou o repositório principal público em 13/11/2026. O Pages está habilitado com HTTPS e publicação por GitHub Actions. O workflow `.github/workflows/playtest.yml` publica somente o diretório gerado `production/playtest-dist/`.

Uma atualização em `main` que afete a build, a configuração web, o exportador ou o workflow gera uma nova publicação no mesmo endereço. Também é possível executar **Publish playtest** manualmente na aba Actions. Uma falha na exportação interrompe a publicação e conserva a versão anterior.

Para escolher uma nova versão publicada:

1. Gerar e validar a nova build portátil e seu manifesto, preservando as versões anteriores.
2. Atualizar `web/playtest/build.json` com a versão e o caminho do manifesto.
3. Executar `ruby production/build_playtest.rb` e conferir o relatório gerado.
4. Testar a exportação servida por HTTP; registrar os resultados.
5. Enviar as alterações para `main` e conferir o workflow e o endereço ao vivo.

Não é necessário criar um novo repositório nem adicionar credenciais ao projeto.

## Carregamento e integridade

O exportador não modifica o HTML portátil. Verifica seu hash aprovado e extrai imagens e MP3 válidos para arquivos no mesmo site, com nomes baseados no conteúdo. As músicas externas são solicitadas quando necessárias, mantendo o cache de áudio do jogo. Não existe iframe ou camada permanente ao redor do jogo.

Antes de adicionar o aviso, o exportador reconstrói integralmente o HTML original a partir dos arquivos extraídos e exige igualdade byte a byte. O relatório público `build-info.json` registra os hashes do original, da página e de cada recurso publicado. O diretório gerado não entra no histórico do Git.

Na Alpha 1.2.1 o HTML de entrada cai de aproximadamente 97,9 MB para 5 MB. As imagens continuam com os mesmos pixels e as músicas com os mesmos bytes; os recursos completos somam aproximadamente 74,6 MB. Isso reduz o documento inicial e permite reutilizar arquivos em cache, sem prometer funcionamento offline.

Uma limitação preexistente foi preservada: a string de áudio `walk_talk_twin`, do chefe do capítulo 2, já contém Base64 inválido na build portátil. Essa faixa continua usando o ambiente sintetizado de reserva. O exportador reconhece somente o hash conhecido dessa exceção e rejeita outros áudios malformados; corrigir a faixa exige uma nova build do jogo.

## Saves e verificação

O progresso fica no navegador e no aparelho em que se joga. Não há sincronização entre aparelhos. Um save do arquivo local pode ser exportado no jogo e importado no site; é recomendável guardar o JSON antes de limpar os dados do navegador.

`qa/playtest_site.cjs` verifica a página em Chrome isolado com perfis de PC, iPhone e iPad com identificação de desktop. Confere seleção do layout, desaparecimento do aviso, rotação, janela estreita no PC, imagens, entrada no capítulo 3 e decodificação de músicas dos capítulos 1 e 3 e do chefe final. O relatório distingue emulação de testes em aparelhos reais. Safari iOS, Android e controles físicos continuam precisando de playtest.

A primeira publicação foi concluída e verificada no endereço ao vivo em 13/11/2026. O [workflow aprovado](https://github.com/ryusarto/Torii-Hutukara/actions/runs/43390076638) corresponde ao commit `3aead33e404c7047426d68b483db3aa36a96c2aa`. O relatório em `qa/playtest/SITE_TEST_RESULTS.json` registra a URL pública e o hash da build efetivamente carregada nos testes.
