#!/usr/bin/env bash

set -euo pipefail

if [ $# -ne 2 ]; then
  echo "Usage: $0 <repo> <workflow>"
  exit 1
fi

repo=$1
workflow=$2

runs="$(gh api "repos/$repo/actions/workflows/$workflow/runs" -X GET | jq '.workflow_runs | map(.id) | .[]')"

echo "$runs"

for run in $runs; do
  echo "Deleting run $run"
  gh api "repos/$repo/actions/runs/$run" -X DELETE | jq .message
done
