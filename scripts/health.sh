#!/bin/bash

to_status() {
  if [[ $1 == 0 ]]; then
    printf "✅"
    return
  fi
  printf "❌"
}

check_go_mod_tidy() {
  if [[ ! -f go.mod || ! -f go.sum ]]; then
    echo 1
    return
  fi
  cp go.mod go.mod.orig
  cp go.sum go.sum.orig
  go mod tidy &> /dev/null
  diff go.mod go.mod.orig > /dev/null
  if [[ $? != 0 ]]; then
    echo 1
    return
  fi
  diff go.sum go.sum.orig > /dev/null
  echo $?
}

check_go_fmt() {
  out=$(gofmt -l . | xargs)
  if [[ -z "$out" ]]; then
    echo 0
    return
  fi
  echo 1
}

for repo in $(node get-repos/index.js -l Go | jq -r '.[]'); do
  tmp=$(mktemp -d)
  pushd $tmp > /dev/null
  git clone -q https://github.com/$repo .
  if [[ ! -f .github/workflows/go-check.yml ]]; then # if the workflows aren't deployed yet
    numcommits=$(git rev-list --count --since="Oct 1 2020" --all --no-merges)
    pr=$(git branch -r --no-merged | grep -c web3-bot/sync)
    if [[ $pr == 0 ]]; then # if there's no PR to add the workflows
      gomodtidy=$(check_go_mod_tidy)
      gofmt=$(check_go_fmt)
      go test -failfast ./... &> /dev/null
      gotest=$?
      go test -failfast -race ./... &> /dev/null
      gotestrace=$?
      go vet ./... &> /dev/null
      govet=$?
      staticcheck ./... &> /dev/null
      staticcheck=$?
      echo "$repo $numcommits false $(to_status $gomodtidy) $(to_status $gofmt) $(to_status $gotest) $(to_status $gotestrace) $(to_status $govet) $(to_status $staticcheck)"
    else
      echo "$repo $numcommits true"
    fi
  fi
  popd > /dev/null
  rm -rf $tmp
done

