#!/bin/bash

set -e

file=$1
entries=$(mktemp)
entries_sorted=$(mktemp)

jq -r ".[].target" $file > $entries
sort -u $entries > $entries_sorted
status=0
if ! output=$(diff -y $entries $entries_sorted); then
  echo "Targets in configs/go.json not sorted alphabetically:"
  echo "$output"
  status=1
fi

rm $entries $entries_sorted
exit $status
