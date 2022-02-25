# Versioning

Go versioning uses [Semantic Versioning 2.0.0](https://semver.org/).

On a high level, this means that given a version number MAJOR.MINOR.PATCH, one is supposed to increment the:

* MAJOR version when you make incompatible API changes,
* MINOR version when you add functionality in a backwards compatible manner, and
* PATCH version when you make backwards compatible bug fixes.

For `v0` versions, incompatible API changes only require a MINOR version bump.

The Go tooling uses version numbers to infer which upgrades are safe (in the sense that they don't result in breaking the build). For example `go get -u=patch` updates dependencies to the most recent patch release. Our downstream users also expect that their compilation won't break when they update to a patch release.

Special care has to be taken when cutting a new release after updating dependencies. Even though a dependency update might not change the API of a package and might therefore _look_ as if it was backwards-compatible change, this is not true if the update of that package is more than a patch release update (i.e., it is a minor or a major release): Go's Minimum Version Selection will force all downstream users to use the new version _of the dependency_, which in turn might lead to breakages in downstream code. Updating a dependency (other than patch releases) therefore MUST result in a bump of the minor version number.

It has turned out that manually assigning version numbers is easy to mess up. To make matters worse, GitHub doesn't give us the option to apply our code review process to releases: A new Go release is created everytime a tag starting with `v` is pushed. Once pushed, the release is picked up by the Google module proxy in a very short time frame, which means that in practice, it's not possible to delete an errorneous pushed tag.

Instead of manually tagging versions, we use GitHub Actions workflows to aid us picking the right version number.

## Using the Versioning Workflows

Every Go repository contains a `version.json` file in the root directory:
```json
{
  "version": "v0.4.2"
}
```

This version file defines the currently released version.

When cutting a new release, open a Pull Request that bumps the version number and have it review by your team mates.
The [release check workflow](.github/workflows/release-check.yml) will comment on the PR and post useful information (the output of `gorelease`, `gocompat` and a diff of the `go.mod` files(s)). It will also post a link to a draft GitHub Release.

As soon as the PR is merged into the default branch, the [releaser workflow](.github/workflows/releaser.yml) is run. This workflow cuts a new release on CI, publishes the GitHub Release and the tag.

### Modifying GitHub Release

All modification you make to the draft GitHub Release created by the release check workflow will be preserved. You can change its' name and body to describe the release in more detail.

If you do not wish for a GitHub Release to be published after a merge, you can delete the draft. If you do so, only a tag will be published after a merge.

### Using a Release Branch

Sometimes it's necessary to cut releases on a release branch. If you open a Pull Request targeting a branch other than the default branch, a new release will only be created if the PR has the `release` label.

### Dealing with Manual Pushes

Unfortunately, GitHub doesn't allow us to disable / restrict pushing of Git tags (see this long-standing [Feature Request](https://github.community/t/feature-request-protected-tags/1742), and consider upvoting it ;)). We can however run a [workflow](.github/workflows/tagpush.yml) when a version tag is pushed.

This workflow will open a new issue in the repository, asking the pusher to
1. double-check that the pushed tag complies with the Semantic Versioning rules described above
2. manually update `version.json` for consistency
