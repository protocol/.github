# CI Workflows

This repository contains GitHub Actions workflows used by various Protocol Labs repositories.
By storing them in a central place (here), and distributing them in an automated way, we solve multiple problems:
1. Consistency: Every participating repository uses the same workflow, ensuring that our code adheres to the same coding standards and is properly tested.
2. Maintainability: Workflows change over time. We need to be able to make changes without manually updating dozens of repositories.

## Technical Details

This repository currently defines two workflows for Go repositories:
* [go-check](workflow-templates/go-check.yml): Performs static analysis, style, and formatting checks to help improve the code quality.
* [go-test](workflow-templates/go-test.yml): Runs all tests, using different compiler versions and operating systems.

Whenever one of these workflows is changed, this repository runs the [copy workflow](.github/workflows/copy-workflow.yml). This workflow creates a pull request in every participating repository to update *go-check* and *go-test*.
In order to help with the distribution of these workflows, this repository defines two additional workflows that are distributed across participating repositories:
* [autorebase](workflow-templates/autorebase.yml): Assume that we update *go-test* here, and this change uncovers a bug in one of the repositories. After this bug has to be fixed in that repo, commenting `@web3-bot rebase` on the pull request will trigger a rebase of that PR, such that we can be sure that the intended fix actually allows this workflow to pass.
* [automerge](workflow-templates/automerge.yml): In most cases, an update to the workflows will not cause CI to fail in most participating repositories. To make our life easier, *automerge* automatically merges the pull request if all checks succeed.

## Usage

Workflows are distributed to all repositories listed in [config.json](.github/workflows/config.json).
If you want your project to participle, please send a PR!
