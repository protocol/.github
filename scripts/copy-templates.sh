#!/usr/bin/env bash

set -euo pipefail -o nounset

force="$(jq -r '.force' <<< "$CONTEXT")"

root="$(pwd)"

pushd "$REPO" > /dev/null

for f in $(jq -r '.config.files[]' <<< "$CONTEXT"); do
  if [[ -f "$f" && "$force" != "true" ]]; then
    echo "$f already exists. Skipping."
    continue
  fi

  echo "Rendering template..."
  $root/protocol/.github/scripts/render-template.sh "$root/protocol/.github/templates/$f" "$CONTEXT" "$f"

  git add "$f"
  git commit -m "chore: add or force update $f"
done

if [[ "$force" != "true" ]]; then
  if [[ -f ".github/dependabot.yml" ]]; then
    gha="$(yq '.updates | map(select(.package-ecosystem == "github-actions")) | length' .github/dependabot.yml)"
    if [[ "$gha" -gt 0 ]]; then
      echo "Dependabot is already configured to update GitHub Actions. Skipping."
      exit 0
    fi
  fi

  # https://gist.github.com/mattt/e09e1ecd76d5573e0517a7622009f06f
  gh gist view --raw e09e1ecd76d5573e0517a7622009f06f | bash

  tmp="$(mktemp)"

  dependabot update github_actions  "$REPO" --local "$REPO" --output "$tmp"

  branch="$(git branch --show-current)"
  sha="$(git rev-parse HEAD)"

  for pr in $(yq -c '.output | map(select(.type == "create_pull_request")) | .[]' "$tmp"); do
    title="$(jq -r '.pr-title' <<< "$pr")"
    git checkout -b "$title" "$branch"
    for f in $(jq -r '.updated-dependency-files[]' <<< "$pr"); do
      jq -r '.content' <<< "$f" > "$REPO/$(jq -r '.name' <<< "$f")"
    done
    git add .
    git commit -m "$(jq -r '.commit-message' <<< "$pr")"
    git checout "$branch"
    git merge "$title" --strategy-option theirs
  done

  git reset "$sha"

  for f in $(jq -r '.config.files[]' <<< "$CONTEXT"); do
    if [[ ! -f "$REPO/$f" ]]; then
      echo "$f does not exist. Skipping."
      continue
    fi

    git add "$f"
    git commit -m "chore: update $f"
  done

  git reset --hard
fi

popd > /dev/null
