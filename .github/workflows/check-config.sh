#!/bin/bash

set -e

file=$1
source=${2:-$file}
entries=$(mktemp)
entries_sorted=$(mktemp)

jq -r ".repositories[].target" $file > $entries
sort -u $entries > $entries_sorted
status=0
if ! output=$(diff -y $entries $entries_sorted); then
  echo "Targets in $source not sorted alphabetically:"
  echo "$output"
  status=1
fi

rm $entries $entries_sorted
exit $status
