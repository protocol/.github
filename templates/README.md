# Templates

This directory contains template files that can be expanded and copied over to the configured repositories.

## Contexts

You can access context information during template expansion(before copy is performed).

### About contexts

Contexts are a way to access information about the repository configuration object and repository GitHub settings. Contexts use the following syntax:

```
${{{ <context> }}}
```

| Context name | Type | Description |
| --- | --- | --- |
| `config` | `object` | Configuration object because of which the file is being copied. For more information, see [config context](#config-context) |
| `github` | `object` | Information about the target repository the file is being copied to. For more information, see [github context](#github-context) |

#### `config` context

The `config` context is the configuration object because of which the file is being copied.

| Property name | Type | Description |
| --- | --- | --- |
| `config` | `object` | The top-level context. |
| `config.files` | `array` | The files that are being copied. |
| `config.extra_files` | `object` | The additional files that are also being copied. |
| `config.target` | `string` | The name of the target repository in `{owner}/{repo}` format. |

#### `github` context

The `github` context contains information about the target repository the file is being copied to.

| Property name | Type | Description |
| --- | --- | --- |
| `github` | `object` | The top-level context. |
| `github.default_branch` | `string` | The name of the default branch of the target repository. |

### Examples

#### Context container

```json
{
    "config": {
        "example": {
            "greeting": "Hello"
        },
        "files": [],
        "extra_files": [".github/workflows/example.yml"]
        "target": "protocol/.github-test-target"
    },
    "github": {
        "default_branch": "master"
    }
}
```

#### Template expanding context

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
