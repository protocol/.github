#!/usr/bin/env bash

set -euo pipefail -o nounset

for f in $(jq -r '.config.files[]' <<< "$CONTEXT"); do
  echo -e "\nProcessing $f."
  # add DO NOT EDIT header
  tmp=$(mktemp)
  cat protocol/.github/templates/header.yml protocol/.github/templates/$f > $tmp
  # render template
  ./protocol/.github/scripts/render-template.sh "$tmp" "$CONTEXT" "$tmp"
  # create commit, if necessary
  commit_msg=""
  if [[ ! -f "$REPO/$f" ]]; then
    echo "First deployment.\n"
    commit_msg="chore: add $f"
  elif [[ "$f" == "version.json" ]]; then
    echo "Version file. Skipping."
    continue
  else
    status=$(cmp --silent $REPO/$f $tmp; echo $?)
    if [[ $status -ne 0 ]]; then
      echo "Update needed."
      commit_msg="chore: update $f"
    else
      echo "File identical. Skipping."
      continue
    fi
  fi
  mkdir -p "$REPO/$(dirname $f)"
  mv $tmp $REPO/$f
  pushd $REPO > /dev/null
  git add $f
  git commit -m "$commit_msg"
  popd > /dev/null
done
