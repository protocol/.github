# Workflow Dispatch Configs

This directory contains config files used for workflow dispatch.

| name | description |
| --- | --- |
| go | repositories containing Go code |
| js | repositories containing JS code |
| testing | repositories used for testing Unified CI workflows |

## Adding new repository to existing config file

To add a new repository to an existing config file, add a new JSON object to the `repositories` key in the file.

_**IMPORTANT**: Please remember to keep `repositories` sorted alphabetically by `target` value._

*JSON object example:*
```json
{ "target": "NEW REPOSITORY NAME" }
```

After the PR with your change is merged, a copy workflow that runs in this repository will copy files(as defined by the `defaults.files` key of the config file or an overriden `files` key of your newly added object) to your repository.

## Adding new config file

When adding a new JSON config file, please follow the structure of other config files. In particular, `defaults.files` array and `repositories` array are required fields.

*JSON config file example:*
```json
{
    "defaults": { "files": [] },
    "repositories": []
}
```

To customise the copy workflow further, you can add more fields to the `defaults` object. See `deploy_versioning` or `deploy_go` in [go.json](go.json) and how they are used in [copy-workflow.yml](../.github/workflows/copy-workflow.yml) for example.

## Testing

You can use [testing](https://github.com/protocol/.github/tree/testing) branch for worklow/configuration testing. Once you push your changes to the branch, a [dispatch](../.github/workflows/dispatch.yml) workflow will be triggered. The workflow will use [testing.json](testing.json) configuration file only. You can manipalate that configuration file as needed(you can copy all the `defaults` from [go.json](go.json) for [example](https://github.com/protocol/.github/commit/43476995428996a90ca95bf838f084ba1a710c68)).

## Upgrading Go

To upgrade Go, modify the `defaults.go.versions` array in the [Go config](go.json).

Remember to:
- Keep the array sorted in increasing order,
- Upgrade versions incrementally. Do not skip a version,
- never pin the patch version (`"1.19.x"` is correct, `"1.19.8"` is incorrect).
