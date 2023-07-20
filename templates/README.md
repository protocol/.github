# Templates

This directory contains template files that can be expanded and copied over to the configured repositories.

## Header

The [header](header.yml) is prepended to all the files before they are copied to the target repositories.

## Contexts

You can access context information during template expansion (before copy is performed).

### About contexts

Contexts are a way to access information about the repository configuration object and repository GitHub settings. Contexts use the following syntax:

```
${{{ <context> }}}
```

| Context name | Type | Description |
| --- | --- | --- |
| `config` | `object` | Configuration object because of which the file is being copied. For more information, see [config context](#config-context) |
| `github` | `object` | Information about the target repository the file is being copied to. For more information, see [github context](#github-context) |

The context container is generated automatically before template expansion is performed.

#### `config` context

The `config` context is the configuration object because of which the file is being copied. It is created by merging the `defaults` object with a `repository` object (from the `repositories` array) from a JSON configuration file.

| Property name | Type | Always present | Description |
| --- | --- | --- | --- |
| `config` | `object` | `true` | The top-level context. | true |
| `config.files` | `array` | `true` | The files that are being copied. |
| `config.extra_files` | `array` | `false` | The additional files that are also being copied. |
| `config.target` | `string` | `true` | The name of the target repository in `{owner}/{repo}` format. |
| `config.deploy_go` | `boolean` | `false` | Flag controling if Go specific setup should be applied to the repository. |
| `config.deploy_versioning` | `boolean` | `false` | Flag controling if `versions.json` file should be deployed to the repository. |
| `config.dist` | `string` | `false` | The name of the distribution built from the repository. |

#### `github` context

The `github` context contains information about the target repository the file is being copied to. It is created on the fly before template expansion is performed.

| Property name | Type | Always present | Description |
| --- | --- | --- | --- |
| `github` | `object` | `true` | The top-level context. |
| `github.default_branch` | `string` | `true` | The name of the default branch of the target repository. |

### Examples

#### JSON configuration

```json
{
  "defaults": {
    "files": [".github/workflows/example1.yml"],
    "is_example": false
  },
  "repositories": [
    {
      "target": "protocol/.github-test-target",
      "extra_files": [".github/workflows/example2.yml"],
      "example": {
        "greeting": "Hello"
      },
      "is_example": true
    }
  ]
}
```

#### Context container

*created automatically before template expansion is performed*

```json
{
  "config": {
    "target": "protocol/.github-test-target",
    "files": [".github/workflows/example1.yml"],
    "extra_files": [".github/workflows/example2.yml"],
    "example": {
      "greeting": "Hello"
    },
    "is_example": true
  },
  "github": {
    "default_branch": "master"
  }
}
```

#### Template

```yaml
name: Hello
on:
  push:
    branches:
      - ${{{ github.default_branch }}}
jobs:
  echo:
    runs-on: ubuntu-latest
    steps:
      - run: echo ${{{ config.example.greeting }}}
        shell: bash
```

#### Expanded template

```yaml
name: Hello
on:
  push:
    branches:
      - master
jobs:
  echo:
    runs-on: ubuntu-latest
    steps:
      - run: echo Hello
        shell: bash
```
