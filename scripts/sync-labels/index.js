import githubLabelSync from 'github-label-sync'
import { readFile } from 'fs/promises'
import path from 'path'
import url from 'url'

const GH_TOKEN = process.env.GITHUB_TOKEN
if (!GH_TOKEN) {
  console.log('Error: Please set the GITHUB_TOKEN environment variable')
  process.exit(1)
}

const REPO_ROOT = path.join(path.dirname(url.fileURLToPath(import.meta.url)), '../../');

(async () => {
  let repos = process.argv.splice(2)
  // Apply to all repos if no repos are specified.
  if (repos.length == 0) {
    repos = JSON.parse(await readFile(path.join(REPO_ROOT, ".github/workflows/config.json")))
      .map(item => item.target)
  }

  let labels = JSON.parse(await readFile(path.join(REPO_ROOT, "templates/.github/issue-labels.json")))

  for (const repo of repos) {
    try {
      let diff = await githubLabelSync({
        accessToken: GH_TOKEN,
        repo: repo,
        allowAddedLabels: true,
        labels: labels
      })
      console.log(`updating ${repo}`)
      for (var change of diff) {
        switch (change.type) {
        case 'missing':
          console.log(`  added ${change.expected.name}`)
          break;
        case 'changed':
          if (change.actual.name !== change.expected.name) {
            console.log(`  renamed ${change.actual.name} to ${change.expected.name}`)
          } else if (change.actual.description !== change.expected.description) {
            console.log(`  changed ${change.actual.name} description to: ${change.expected.description}`)
          } else if (change.actual.color !== change.expected.color) {
            console.log(`  recolored ${change.actual.name}`)
          } else {
            console.log(`  updated ${change.actual.name}`)
          }
          break;
        case 'added':
          console.log(`  removed ${change.actual.name}`)
          break;
        default:
          console.log(`  unknown change ${diff}`)
        }
      }
    } catch (e) {
      console.log(`failed to update labels for ${repo}: ${e}`)
      console.dir(e, {depth: 4, colors: true})
    }
  }
})()
