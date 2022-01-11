#!/bin/bash

set -e

config="$1"
if [ -f "$config" ]; then config="$(cat "$config")"; fi

repository_defaults='{
  "files": [],
  "extra_files": []
}'
repository_defaults="$(jq -c "$repository_defaults + .defaults" <<< "$config")"

file_defaults='if type=="string" then {"source": .} else . end | {
  "source": .source,
  "destination": .source,
  "update": true
}'

repository_override='{
  "files": [.files[] | '$file_defaults' + .],
  "extra_files": [.extra_files[] | '$file_defaults' + .],
}'

# values defined in the repository object will override the default values
# e.g. { "files": ["a", "b"] } + { "files": ["c"] } = { "files": ["c"] }
jq "[.repositories[] | $repository_defaults + . | . + $repository_override]" <<< "$config"
