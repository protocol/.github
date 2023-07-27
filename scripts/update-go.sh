#!/usr/bin/env bash

set -euo pipefail -o nounset

language="$(jq -r '.github.languages[0]' <<< "$CONTEXT")"

if [[ "$language" != "Go" ]]; then
  echo "Not a Go project. Skipping."
  exit 0
fi

configured="$(jq -r '.config.version' <<< "$CONTEXT)"
configured_major="${configured%.*}"
configured_minor="${configured#*.}"
configured_patch="${configured_minor#*.}"

expected="$configured_major.$configured_minor"
if [[ "$configured_patch" != "x" ]]; then
  expected="$version.$configured_patch"
fi

tmp="$(mktemp -d)"
pushd "$tmp" > /dev/null
curl -sSfL "https://golang.org/dl/go$expected.linux-amd64.tar.gz" | tar -xz
export PATH="$tmp/go/bin:$PATH"
popd > /dev/null

expected="$(go version | awk '{print $3}')"

go install golang.org/x/tools/cmd/goimports@v0.5.0

pushd "$REPO" > /dev/null

while read file; do
  pushd "$(dirname "$file")" > /dev/null

  current="$(go list -m -f {{.GoVersion}})"

  if [[ "$current" == "$expected" ]]; then
    echo "Go version $expected already in use."
    continue
  fi

  go mod tidy -go="$current"
  go mod tidy -go="$expected"
  go mod tidy

  go fix ./...

  git add .

  if ! git diff-index --quiet HEAD; then
    git commit -m "chore: bump go.mod to Go $expected and run go fix"
  fi

  # As of Go 1.19 io/ioutil is deprecated
  # We automate its upgrade here because it is quite a widely used package
  while read file; do
    sed -i 's/ioutil.NopCloser/io.NopCloser/' "$file";
    sed -i 's/ioutil.ReadAll/io.ReadAll/' "$file";
    # ReadDir replacement might require manual intervention (https://pkg.go.dev/io/ioutil#ReadDir)
    sed -i 's/ioutil.ReadDir/os.ReadDir/' "$file";
    sed -i 's/ioutil.ReadFile/os.ReadFile/' "$file";
    sed -i 's/ioutil.TempDir/os.MkdirTemp/' "$file";
    sed -i 's/ioutil.TempFile/os.CreateTemp/' "$file";
    sed -i 's/ioutil.WriteFile/os.WriteFile/' "$file";
    sed -i 's/ioutil.Discard/io.Discard/' "$file";
  done <<< "$(find . -type f -name '*.go')"

  goimports -w .

  git add .
  if ! git diff-index --quiet HEAD; then
    git commit -m "fix: stop using the deprecated io/ioutil package"
  fi

  go mod tidy

  git add .
  if ! git diff-index --quiet HEAD; then
    git commit -m "chore: run go mod tidy"
  fi

  gofmt -s -w .

  git add .
  if ! git diff-index --quiet HEAD; then
    git commit -m "chore: run gofmt -s"
  fi

  popd > /dev/null
done <<< "$(find . -type f -name 'go.mod')"

popd > /dev/null
