# CI Workflows

This repository contains GitHub Actions workflows used by various Protocol Labs repositories.
By storing them in a central place (here), and distributing them in an automated way, we solve multiple problems:
1. Consistency: Every participating repository uses the same workflow, ensuring that our code adheres to the same coding standards and is properly tested.
2. Maintainability: Workflows change over time. We need to be able to make changes without manually updating dozens of repositories.

## Customization

### Additional Setup Steps

Most repositories won't need any customization, and the workflows defined here will just work fine.
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

## Technical Details

This repository currently defines two workflows for Go repositories:
* [go-check](templates/.github/workflows/go-check.yml): Performs static analysis, style, and formatting checks to help improve the code quality.
* [go-test](templates/.github/workflows/go-test.yml): Runs all tests, using different compiler versions and operating systems.

Whenever one of these workflows is changed, this repository runs the [copy workflow](.github/workflows/copy-workflow.yml). This workflow creates a pull request in every participating repository to update *go-check* and *go-test*.
In order to help with the distribution of these workflows, this repository defines two additional workflows that are distributed across participating repositories:
* [automerge](templates/.github/workflows/automerge.yml): In most cases, an update to the workflows will not cause CI to fail in most participating repositories. To make our life easier, *automerge* automatically merges the pull request if all checks succeed.

## Usage

Workflows are distributed to all repositories listed in [configs/go.json](configs/go.json).

If you want your project to participle, please send a PR!

## Development

### Branches

The `master` branch contains currently deployed workflows.
When we make minor changes to these workflows, we don't always want these changes to get deployed to all hundreds of repositories, as this creates a lot of unnecessary noise. Minor changes to the workflows are therefore merged into the [`next`](https://github.com/protocol/.github/tree/next) branch. When the time has come, we create a PR from the `next` branch to `master` to trigger a deployment to all repositores.

### IDE

If you're using [Visual Studio Code](https://code.visualstudio.com/) for development, you might want to install the [YAML](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml) extension. It is configured to perform GitHub workflow/action linting out-of-the-box.
