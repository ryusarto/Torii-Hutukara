#!/usr/bin/env bash
# Remove do HISTÓRICO do git as builds antigas e arquivos de outros projetos.
# Rode no seu computador, DEPOIS de o pull request da limpeza estar no main
# e o site ter publicado com sucesso. Guia: docs/LIMPEZA_HISTORICO.md
#
# Requisitos: git e git-filter-repo (pip install git-filter-repo).
# Uso:  bash limpar_historico.sh            (prepara e confere; não envia)
#       bash limpar_historico.sh --enviar   (prepara, confere e envia)
set -euo pipefail

REPO="${TORII_REPO:-https://github.com/ryusarto/Torii-Hutukara}"
WORK="torii-limpeza-$(date +%Y%m%d-%H%M%S)"
BUILDS_DIR="$PWD/torii-builds-antigas"
ARCHIVE_BRANCH="claude/arquivo-builds-ate-1.2.4"
# Branches que guardam o histórico antigo; apagados no fim (já estão no main).
OLD_BRANCHES="claude/arquivo-builds-ate-1.2.4 claude/analise-roteiro"
SEND="${1:-}"

command -v git-filter-repo >/dev/null || { echo "Instale antes: pip install git-filter-repo"; exit 1; }

echo "1/6 Baixando cópia completa..."
git clone -q "$REPO" "$WORK"
cd "$WORK"
git fetch -q origin '+refs/heads/*:refs/remotes/origin/*' --tags

echo "2/6 Conferindo se a limpeza já está no main..."
if git ls-tree -r --name-only origin/main | grep -q '^game/builds/'; then
  echo "PARE: o main ainda contém game/builds/. Faça o merge do pull request da limpeza primeiro."; exit 1
fi
TREE_BEFORE=$(git rev-parse 'origin/main^{tree}')
for b in $(git for-each-ref --format='%(refname:lstrip=3)' refs/remotes/origin | grep -v -E '^(main|HEAD)$'); do
  case " $OLD_BRANCHES " in *" $b "*) ;; *)
    echo "PARE: existe o branch '$b', que ainda guardaria o histórico antigo. Faça o merge ou apague-o antes."; exit 1;;
  esac
done
if git rev-parse -q --verify origin/claude/analise-roteiro >/dev/null && ! git merge-base --is-ancestor origin/claude/analise-roteiro origin/main \
   && [ "$(git rev-parse 'origin/claude/analise-roteiro^{tree}')" != "$TREE_BEFORE" ]; then
  echo "PARE: claude/analise-roteiro tem mudanças que não estão no main."; exit 1
fi

echo "3/6 Guardando as builds antigas em $BUILDS_DIR ..."
mkdir -p "$BUILDS_DIR"
if git rev-parse -q --verify "origin/$ARCHIVE_BRANCH" >/dev/null; then
  git archive "origin/$ARCHIVE_BRANCH" game/builds | tar -x -C "$BUILDS_DIR"
else
  echo "Aviso: branch $ARCHIVE_BRANCH não encontrado; builds antigas não foram copiadas."
fi

echo "4/6 Reescrevendo o histórico..."
git checkout -q -B main origin/main
TAGS=$(git tag)
git filter-repo --force --refs main $TAGS --invert-paths \
  --path game/builds/ \
  --path design/chapter-03/Assim_que_as_Flores_Crescem_Build_02.html \
  --path design/chapter-03/ikiru_painel_v4.html \
  --path docs/SHA256SUMS.txt

echo "5/6 Conferindo que o conteúdo atual não mudou..."
TREE_AFTER=$(git rev-parse 'main^{tree}')
if [ "$TREE_BEFORE" != "$TREE_AFTER" ]; then
  echo "PARE: o conteúdo do main mudou ($TREE_BEFORE -> $TREE_AFTER). Nada foi enviado."; exit 1
fi
for ref in main $TAGS; do
  if git ls-tree -r --name-only "$ref" | grep -q '^game/builds/'; then echo "PARE: $ref ainda tem builds."; exit 1; fi
done
git for-each-ref --format='%(refname)' | grep -v -E '^refs/(heads/main|tags/)' | xargs -r -n1 git update-ref -d
git reflog expire --expire=now --all && git gc -q --prune=now
echo "Conteúdo idêntico ao main atual. Tamanho do histórico limpo:"
git count-objects -vH | grep size-pack

if [ "$SEND" != "--enviar" ]; then
  echo "6/6 Nada foi enviado. Para enviar, rode de novo com --enviar."
  exit 0
fi

echo "6/6 Enviando (substitui o histórico no GitHub)..."
git remote add origin "$REPO" 2>/dev/null || git remote set-url origin "$REPO"
git push --force origin main
git push --force origin $TAGS
for b in $OLD_BRANCHES; do git push origin --delete "$b" || true; done
echo "Pronto. Quem tiver uma cópia antiga do repositório deve apagar e clonar de novo."
echo "Builds antigas guardadas em: $BUILDS_DIR"
