#!/bin/bash

file="./CHANGELOG.md"
regex='^## \[([0-9]+)\.([0-9]+)\.([0-9]+)\] - ([0-9]{4}-[0-9]{2}-[0-9]{2})$'

version=''
log=()

while read line; do
    if [[ $line =~ $regex ]]; then
        if [[ -z "$version" ]]; then
            major="${BASH_REMATCH[1]}"
            minor="${BASH_REMATCH[2]}"
            patch="${BASH_REMATCH[3]}"
            version="$major.$minor.$patch"
            date="${BASH_REMATCH[4]}"
        else
            break
        fi
    elif [[ ! -z "$version" ]]; then
        log+=("$line")
    fi
done <<< "$(cat "$file")"
