# Workflow Dispatch Configs

This directory contains config files used for workflow dispatch.

| name | description |
| --- | --- |
| go | repositories containing Go code |
| testing | repositories used for testing unified CI workflows |

## Adding new repository to existing config file

To add a new repository to an existing config file, add a new JSON object to the `repositories` key in the file.

_**IMPORTANT**: Please remember to keep `repositories` sorted alphabetically by `target` value._

*JSON object example:*
```
{ "target": "NEW REPOSITORY NAME" }
```

After the PR with your change is merged, a copy workflow that runs in this repository will copy files(as defined by the `defaults.files` key of the config file or an overriden `files` key of your newly added object) to your repository.

## Adding new config file

When adding a new JSON config file, please follow the structure of other config files. In particular, `defaults.files` array and `repositories` array are required fields.

*JSON config file example:*
```
{
    "defaults": { "files": [] },
    "repositories": []
}
```

To customise the copy workflow further, you can add more fields to the `defaults` object. See `deploy_versioning` or `deploy_go` in [go.json](go.json#L8-L9) and how they are used in [copy-workflow.yml](../.github/workflows/copy-workflow.yml#L100-L105) for example.
