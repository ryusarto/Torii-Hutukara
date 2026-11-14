# Limpeza do histórico do git

As builds antigas já saíram dos arquivos do projeto, mas continuam guardadas no **histórico** do git. Por isso, quem clona o repositório ainda baixa ~204 MB. Este passo remove essas builds do histórico e deixa o clone com ~134 MB.

Precisa ser feito por quem tem acesso de administrador, no próprio computador. O ambiente do Claude não pode substituir o histórico do `main` nem as tags.

## O que muda
- Saem do histórico: `game/builds/` (todas as builds HTML), dois HTMLs de outros projetos em `design/chapter-03/` e `docs/SHA256SUMS.txt`.
- O conteúdo atual do `main` **não muda**: o script compara o conteúdo antes e depois e cancela se houver qualquer diferença.
- As tags `alpha-*` continuam existindo, apontando para as mesmas versões do código, só que sem as pastas de build.
- As builds antigas (Alpha 1.0 a 1.2.4) são copiadas para a pasta `torii-builds-antigas/` no seu computador antes da limpeza.
- Os branches `claude/arquivo-builds-ate-1.2.4` e `claude/analise-roteiro` são apagados (o segundo já estará no `main`).

## Passo a passo
1. Faça o merge do pull request da limpeza no `main`.
2. Em **Actions → Publish playtest**, espere a publicação terminar com sucesso e abra o site para conferir.
3. Instale o `git-filter-repo`:
   ```bash
   pip install git-filter-repo
   ```
4. Numa pasta vazia, baixe e rode o script **sem enviar nada** (só prepara e confere):
   ```bash
   curl -sLO https://raw.githubusercontent.com/ryusarto/Torii-Hutukara/main/production/limpar_historico.sh
   bash limpar_historico.sh
   ```
   Deve terminar com "Conteúdo idêntico ao main atual" e "Nada foi enviado".
5. Se estiver tudo certo, rode de novo enviando:
   ```bash
   bash limpar_historico.sh --enviar
   ```
6. Opcional: guarde as builds antigas de `torii-builds-antigas/` num Release do GitHub (**Releases → Draft a new release**, anexando os HTMLs) ou em outro lugar seguro.
7. Quem tiver uma cópia antiga do repositório (inclusive o Franco) deve apagar e clonar de novo.

## Travas de segurança do script
- Para se o `main` ainda tiver `game/builds/` (merge não feito).
- Para se existir algum branch além dos esperados, para não perder trabalho.
- Para se `claude/analise-roteiro` tiver algo que não está no `main`.
- Para se o conteúdo final do `main` for diferente do original.
- Só envia com `--enviar`.

## Observação
O GitHub pode continuar mostrando o tamanho antigo do repositório por um tempo, porque guarda os commits antigos ligados a pull requests já fechados. Isso não afeta quem clona: o clone já vem com o tamanho novo.

Testado em 14/11/2026 com uma cópia completa do repositório num remoto local: clone de 204 MB → 134 MB, árvore final idêntica (`0d3f3ac5…`), 9 builds antigas salvas na pasta local.
