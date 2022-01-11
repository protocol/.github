#!/bin/bash

set -e

template="$1"
if [ -f "$template" ]; then template="$(cat "$template")"; fi
context="$2"
if [ -f "$context" ]; then context="$(cat "$context")"; fi

# regexp matches trimmed string between template context delimiters
regexp='\${{{\s*(.*?)\s*}}}'
# replacement is a perl script that:
#   1. prepends . to the matched string to create a filter
#   2. escapes single quotes by replacing ' with '"'"' in filter
#   3. prints context escaped in the same manner
#   4. applies jq with filter to the stdout
replacement="\$filter = \".\$1\"; \$filter =~ s/'/'\"'\"'/g; \`echo '${context//\'/\'\"\'\"\'}' | jq -jc '\$filter'\`"

# replace template contexts with values from the JSON context object
perl -p -e "s#$regexp#$replacement#ge" <<< "$template"
