#!/bin/bash

FILE=$1
status=0

while read -r line; do
  src=`echo $line | sed -E "s/(.*)uses://g" | xargs`
  author=`echo $src | awk -F/ '{print $1}'`
  if [ $author == "actions" ]; then continue; fi
  version=`echo $src | awk -F@ '{print $2}' | awk '{print $1}'`
  if [ ${#version} != 40 ]; then
    status=1
    echo "$FILE includes $src and doesn't use commit hash"
  fi
done < <(grep "uses:" $FILE)

exit $status
