# Add Unified CI to new Go repositories

This action accepts `GITHUB_TOKEN` as an input.

It finds all the unarchived, Go repositories that the token has access to.

It filters out the repositories that are already defined in `configs/go.json` and those which it has seen during a previous run.

Finally, it adds the remaining repositories to `configs/go.json`, creates a PR and tags the most active contributors of the newly added repositories in it.

## Contributing

Before pushing your changes run `npm run all`.

## Credits

Based on [TypeScript Action](https://github.com/actions/typescript-action) repository.
