#!/usr/bin/env bash

set -euo pipefail -o nounset

for f in $(jq -r '.config.files[]' <<< "$CONTEXT"); do
  echo -e "\nProcessing $f."
  if [[ ! -f "$REPO/$f" ]]; then
    echo "$f does not exist. Skipping.\n"
    continue
  fi

  rm -rf "$REPO/$f"
done

pushd $REPO > /dev/null

git add .

if ! git diff-index --quiet HEAD; then
  git commit -m "chore: delete templates"
fi

popd > /dev/null
