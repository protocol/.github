#!/usr/bin/env bash

# array of strings with paths to legacy items to copy
declare -a legacy_items=(
  ".github/actions/read-config"
  ".github/workflows/release-check.yml"
  ".github/workflows/releaser.yml"
  ".github/workflows/tagpush.yml"
)

# loop through the array
for item in "${legacy_items[@]}"; do
  # if the item exists
  if [ -e "$item" ]; then
    # delete it
    rm -rf "$item"
  fi
  # copy the item from the shared folder
  cp -r "shared/$item" "$item"
done
