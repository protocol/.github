# Inspect Releaser

This action inspects the releaser workflow and makes the information about the created release readily accessible.

## Inputs

- `artifacts_url`: The URL to the artifacts of the release. Defaults to `${{ github.event.workflow_run.artifacts_url }}`. If the workflow run in which this action is called is triggered by the releaser workflow run event, this input is not required.

## Outputs

- `id`: The ID of the release. Empty string if the release was not created.
- `url`: The URL of the release. Empty string if the release was not created.
- `draft`: Whether the release is a draft. Empty string if the release was not created.
- `version`: The tag name of the release. Empty string if the release was not created.
- `upload_url`: The URL to upload assets to the release. Empty string if the release was not created.
- `assets`: The assets of the release. `[]` if the release was not created.

## Example usage

```yaml
name: Inspect Releaser

on:
  workflow_dispatch:
    inputs:
      artifacts-url:
        description: The artifacts_url of the workflow run to download the release artifact from.
        required: true
  workflow_run:
    workflows: [Releaser]
    types:
      - completed

jobs:
  test:
    if: github.event.inputs.artifacts-url != '' || github.event.workflow_run.conclusion == 'success'
    runs-on: ubuntu-latest
    steps:
      - id: releaser
        uses: protocol/.github/shared/.github/actions/inspect-releaser@v1.0
        with:
          artifacts-url: ${{ github.event.inputs.artifacts-url || github.event.workflow_run.artifacts_url }}
      - if: ${{ steps.releaser.outputs.id == '' }}
        run: echo "The releaser job did not create a new release."
      - if: ${{ steps.releaser.outputs.id != '' }}
        env:
          DRAFT: ${{ steps.releaser.outputs.draft }}
          VERSION: ${{ steps.releaser.outputs.version }}
          URL: ${{ steps.releaser.outputs.url }}
        run: |
          echo 'The releaser job created a new release:'
          echo "  draft: $DRAFT"
          echo "  version: $VERSION"
          echo "  url: $URL"
```
