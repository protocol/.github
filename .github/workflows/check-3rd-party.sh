#!/bin/bash

set -e

FILE=$1
status=0

for line in `sed -ne 's/[[:space:]-]*uses:[[:space:]]*//p' $1 | sed -e 's/\s*#.*$//'`; do
  author=`echo $line | awk -F/ '{print $1}'`
  # We trust:
  # - .: local workflows
  # "actions": workflows authored by GitHub
  # "protocol": workflows published in the protocol org
  # "ipfs": workflows published in the ipfs org
  if [[ $author == "." || $author == "actions" || $author == "protocol" || $author == "ipfs" ]]; then continue; fi
  version=`echo $line | awk -F@ '{print $2}' | awk '{print $1}'`
  if ! [[ "$version" =~ ^[a-f0-9]{40}$ ]]; then
    status=1
    echo "$FILE includes $line and doesn't use commit hash"
  fi
done

exit $status
