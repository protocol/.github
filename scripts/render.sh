#!/usr/bin/env bash

# This script is used to render GitHub Workflow templates.

set -euo pipefail

if [ "$#" -ne 3 ]; then
  echo "Usage: render.sh <template> <context> <output>"
  exit 1
fi

template="$1"
context="$2"
output="$3"

engine='
  s#\$\{\{\{\s*\.?(.*?)\s*\}\}\}#
    my $key = $1;
    my $result = `jq -cjn '"'"'env.context | fromjson | .$key'"'"'`;
    if($? != 0) {
      print STDERR "jq: error on line: $_";
      exit 1;
    }
    $result
  #gex
'

# Render the template.
# If template and output are the same, perform the rendering in-place.
if [ "$template" = "$output" ]; then
  perl -p -i -e "$engine" "$template"
else
  perl -p -e "$engine" "$template" > "$output"
fi
