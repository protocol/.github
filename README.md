# Unified CI: Streamlining GitHub Workflows Across Repositories

Welcome to Unified CI, your key to deploying and managing GitHub Actions workflows across an extensive network of repositories. Unified CI takes the helm in orchestrating both the initial deployment and ongoing updates of workflows, providing a seamless solution to streamline your projects' lifecycle.

With Unified CI at your side, Protocol Labs can effortlessly oversee GitHub Actions workflows throughout numerous organizations and hundreds of repositories. This automated system guarantees:

1. **Consistency**: Through the utilization of identical GitHub Actions workflow definitions across participating repositories, Unified CI assures that code maintains the highest standard and undergoes thorough testing.
2. **Maintainability**: Workflow definitions are constantly refreshed under Unified CI's management. Any changes in the definitions are instantly relayed to all participating repositories, guaranteeing up-to-date operations.

## Availability and Future Directions

Unified CI is currently available for both Go and JavaScript (JS), providing a wide array of automated services for each:

- **Go**: Unified CI's Go support includes testing with the current and previous versions of Go, and performing tests on Windows, macOS, and Linux. It ensures comprehensive testing, including on 32-bit infrastructure, and for race conditions. Besides testing, it also handles linting and formatting for Go code, providing a well-rounded CI solution. Moreover, the release process is also automated via GitHub Releases.

- **JavaScript**: For JavaScript, Unified CI ensures testing across various platforms: Windows, Linux, and macOS. It also conducts tests in multiple environments, including Node, Chrome, Firefox, Webkit, WebWorkers, and Electron. Similar to Go, it also automates the release process, ensuring a streamlined workflow.

We understand the growing needs of different programming languages in the development community, and we're excited to share that we have plans to extend Unified CI support to Rust and Python. This will allow us to provide our robust CI solution to an even broader range of developers. Stay tuned for future updates on this expansion!

## Fine-tuning Your Unified CI Experience

Most repositories won't need any customization, and the workflows defined here will just work fine.

### Configuration Variables

Some aspects of Unified CI workflows are configurable through [configuration variables](https://docs.github.com/en/actions/learn-github-actions/variables#creating-configuration-variables-for-a-repository).

You can customise the runner type for `go-test` through `UCI_GO_TEST_RUNNER_UBUNTU`, `UCI_GO_TEST_RUNNER_WINDOWS` and `UCI_GO_TEST_RUNNER_MACOS` configuration variables. This option will be useful for repositories wanting to use more powerful, [PL self-hosted GitHub Actions runners](https://github.com/pl-strflt/tf-aws-gh-runner). Make sure the value of the variable is valid JSON.

`UCI_*_RUNNER_*` variables expect the values to be JSON formatted. For example, if you want the `MacOS` runner used in `Go Test` workflow to be `macos-12` specifically, you'd set `UCI_GO_TEST_RUNNER_MACOS` to `"macos-12"` (notice the `"` around the string); and if you want your `Ubuntu` runner to be a self hosted machine with labels `this`, `is`, `my`, `self-hosted`, `runner`, you'd set `UCI_GO_TEST_RUNNER_UBUNTU` to `["this", "is", "my", "self-hosted", "runner"]`.

### Setup Actions

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

### Configuration Files

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

## Usage

Workflows are distributed to all repositories listed in [configs/go.json](configs/go.json).

If you want your project to participle, please send a PR which adds your repository to the config! Remember to ensure [@web3-bot](https://github.com/web3-bot) has write access to your repository.

## Development

### Branches

The `master` branch contains currently deployed workflows.
When we make minor changes to these workflows, we don't always want these changes to get deployed to all hundreds of repositories, as this creates a lot of unnecessary noise. Minor changes to the workflows are therefore merged into the [`next`](https://github.com/protocol/.github/tree/next) branch. When the time has come, we create a PR from the `next` branch to `master` to trigger a deployment to all repositores.

### IDE

If you're using [Visual Studio Code](https://code.visualstudio.com/) for development, you might want to install the [YAML](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml) extension. It is configured to perform GitHub workflow/action linting out-of-the-box. If you're using a different IDE, you can check if a [client](https://github.com/redhat-developer/yaml-language-server#clients) for it exists.
