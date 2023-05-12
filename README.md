# CI Workflows

This repository contains GitHub Actions workflows used by various Protocol Labs repositories.
By storing them in a central place (here), and distributing them in an automated way, we solve multiple problems:
1. Consistency: Every participating repository uses the same workflow, ensuring that our code adheres to the same coding standards and is properly tested.
2. Maintainability: Workflows change over time. We need to be able to make changes without manually updating dozens of repositories.

## Customization

### Additional Setup Steps

Most repositories won't need any customization, and the workflows defined here will just work fine.

#### Configuration Variables

Some aspects of Unified CI workflows are configurable through [configuration variables](https://docs.github.com/en/actions/learn-github-actions/variables#creating-configuration-variables-for-a-repository).

You can customise the runner type for `go-test` through `UCI_GO_TEST_RUNNER_UBUNTU`, `UCI_GO_TEST_RUNNER_WINDOWS` and `UCI_GO_TEST_RUNNER_MACOS` configuration variables. This option will be useful for repositories wanting to use more powerful, [PL self-hosted GitHub Actions runners](https://github.com/pl-strflt/tf-aws-gh-runner). Make sure the value of the variable is valid JSON.

#### Setup Actions

Some repositories may require some pre-setup steps to be run before tests (or code checks) can be run. Setup steps for `go-test` are defined in `.github/actions/go-test-setup/action.yml`, and setup steps for `go-check` are defined in `.github/actions/go-check-setup/action.yml`, in the following format:

```yml
runs:
  using: "composite"
  steps:
    - name: Step 1
      shell: bash
      run: echo "do some initial setup"
    - name: Step 2
      shell: bash
      run: echo "do some Linux-specific setup"
      if: ${{ matrix.os == 'ubuntu' }}
```

These setup steps are run after the repository has been checked out and after Go has been installed, but before any tests or checks are run.
If you need to access the GitHub Token in a setup action, you can do so through `github.token` variable in the [`github` context](https://docs.github.com/en/actions/learn-github-actions/contexts#github-context). Unfortunately, the actions do not have access to the [`secrets` context](https://docs.github.com/en/actions/learn-github-actions/contexts#secrets-context).

### Configuration

`go-check` contains an optional step that checks that running `go generate` doesn't change any files.
This is useful to make sure that the generated code stays in sync.

This check will be run in repositories that set `gogenerate` to `true` in `.github/workflows/go-check-config.json`:
```json
{
  "gogenerate": true
}
```

Note that depending on the code generators used, it might be necessary to [install those first](#additional-setup-steps).
The generators must also be deterministic, to prevent CI from getting different results each time.

`go-test` offers an option to completely disable running 32-bit tests.
This option is useful when a project or its upstream dependencies are not 32-bit compatible.
Typically, such tests can be disabled using [build constraints](https://pkg.go.dev/cmd/go#hdr-Build_constraints).
However, the constraints must be set per go file, which can be cumbersome for a project with many files.
Using this option, 32-bit tests can be skipped entirely without having to specify build constraints per file.

To completely disable running 32-bit tests set `skip32bit` to `true` in `.github/workflows/go-test-config.json`:
```json
{
  "skip32bit": true
}
```

If your project cannot be built on one of the supported operating systems, you can disable it by setting `skipOSes` to a list of operating systems in `.github/workflows/go-test-config.json`:
```json
{
  "skipOSes": ["windows", "macos"]
}
```

If you want to disable verbose logging or test shuffling, you can do so by setting `verbose` or `shuffle` to `false` in `.github/workflows/go-test-config.json`:
```json
{
  "verbose": false,
  "shuffle": false
}
```

## Technical Preview

You can opt-in to receive early updates from the `next` branch in-between official Unified CI releases.

To do so you have to set `source_ref` property to `next` on your repository target object in the configuration file.
```json
{
  "repositories": [
    {
      "target": "pl-strflt/example",
      "source_ref": "next"
    }
  ]
}
```

_Warning_: `next` branch updates are much more frequent than those from `master`.

## Technical Details

This repository currently defines two workflows for Go repositories:
* [go-check](templates/.github/workflows/go-check.yml): Performs static analysis, style, and formatting checks to help improve the code quality.
* [go-test](templates/.github/workflows/go-test.yml): Runs all tests, using different compiler versions and operating systems.

Whenever one of these workflows is changed, this repository runs the [copy workflow](.github/workflows/copy-workflow.yml). This workflow creates a pull request in every participating repository to update *go-check* and *go-test*.
In order to help with the distribution of these workflows, this repository defines two additional workflows that are distributed across participating repositories:
* [automerge](templates/.github/workflows/automerge.yml): In most cases, an update to the workflows will not cause CI to fail in most participating repositories. To make our life easier, *automerge* automatically merges the pull request if all checks succeed.

## Usage

Workflows are distributed to all repositories listed in [configs/go.json](configs/go.json).

If you want your project to participle, please send a PR which adds your repository to the config! Remember to ensure [@web3-bot](https://github.com/web3-bot) has write access to your repository.

## Development

### Branches

The `master` branch contains currently deployed workflows.
When we make minor changes to these workflows, we don't always want these changes to get deployed to all hundreds of repositories, as this creates a lot of unnecessary noise. Minor changes to the workflows are therefore merged into the [`next`](https://github.com/protocol/.github/tree/next) branch. When the time has come, we create a PR from the `next` branch to `master` to trigger a deployment to all repositores.

### IDE

If you're using [Visual Studio Code](https://code.visualstudio.com/) for development, you might want to install the [YAML](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml) extension. It is configured to perform GitHub workflow/action linting out-of-the-box. If you're using a different IDE, you can check if a [client](https://github.com/redhat-developer/yaml-language-server#clients) for it exists.
