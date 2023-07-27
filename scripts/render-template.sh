#!/usr/bin/env bash

# This script is used to render GitHub Workflow templates.

set -euo pipefail

# Check the number of arguments. 2 or 3 are expected.
if [ $# -lt 2 ] || [ $# -gt 3 ]; then
  echo "Usage: render.sh <template> <context> <output>"
  exit 1
fi

template="$1"
context="$2"
output="${3:-}"

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
export context
# If template and output are the same, perform the rendering in-place.
if [ "$template" = "$output" ]; then
  perl -p -i -e "$engine" "$template"
# Otherwise, if output is not specified, print the result to stdout.
elif [ -z "$output" ]; then
  perl -p -e "$engine" "$template"
# Otherwise, write the result to the specified output file.
else
  perl -p -e "$engine" "$template" > "$output"
fi
