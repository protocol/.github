import * as core from '@actions/core'
import * as env from './env'
import * as exec from '@actions/exec'
import * as fs from 'fs'
import * as github from '@actions/github'
import {ArtifactNotFoundError, CrossRunArtifactClient} from './artifact'

interface Repository {
  target: string
}

interface Config {
  repositories: Repository[]
}

async function run(): Promise<void> {
  try {
    const GITHUB_TOKEN: string = core.getInput('GITHUB_TOKEN')
    const octokit = github.getOctokit(GITHUB_TOKEN)

    core.info('Finding orgs...')
    const web3BotOrgs = await octokit.paginate(
      octokit.rest.orgs.listForAuthenticatedUser
    )

    core.info('Finding Go repos...')
    const allGoRepos = (
      await Promise.all(
        web3BotOrgs.map(async org => {
          return await octokit.paginate(octokit.rest.repos.listForOrg, {
            org: org.login
          })
        })
      )
    )
      .flat()
      .filter(repo => repo.language === 'Go' && repo.archived === false)

    core.info('Finding Go repos with Unified CI...')
    const goConfigFile: string = fs.readFileSync('configs/go.json').toString()
    const goConfig: Config = JSON.parse(goConfigFile)
    const goReposWithUnifiedCI = goConfig.repositories.map(repo => repo.target)

    core.info('Finding Go repos without Unified CI...')
    const goReposWithoutUnifiedCI = [
      ...new Set(allGoRepos.map(repo => repo.full_name))
    ].filter(repo => !goReposWithUnifiedCI.includes(repo))

    core.info('Finding previously known Go repos without Unified CI...')
    const artifactClient = new CrossRunArtifactClient(GITHUB_TOKEN)
    const oldGoReposWithoutUnifiedCI: string[] = []
    try {
      await artifactClient.downloadArtifact('go-repos-without-unified-ci')
      oldGoReposWithoutUnifiedCI.push(
        ...JSON.parse(
          fs.readFileSync('go-repos-without-unified-ci.json').toString()
        )
      )
    } catch (error) {
      if (error instanceof ArtifactNotFoundError) {
        core.info(error.message)
      } else {
        throw error
      }
    }

    core.info('Finding newly created Go repos without Unified CI...')
    const newGoReposWithoutUnifiedCI: string[] = goReposWithoutUnifiedCI.filter(
      repo => !oldGoReposWithoutUnifiedCI.includes(repo)
    )

    core.info('Uploading known Go repos without Unified CI...')
    fs.writeFileSync(
      'go-repos-without-unified-ci.json',
      JSON.stringify(goReposWithoutUnifiedCI, null, 2)
    )
    await artifactClient.uploadArtifact('go-repos-without-unified-ci', [
      'go-repos-without-unified-ci.json'
    ])

    core.info(
      `All Go repos without Unified CI (${
        goReposWithoutUnifiedCI.length
      }): ${JSON.stringify(goReposWithoutUnifiedCI, null, 2)}`
    )
    core.info(
      `New Go repos without Unified CI (${
        newGoReposWithoutUnifiedCI.length
      }): ${JSON.stringify(newGoReposWithoutUnifiedCI, null, 2)}`
    )

    core.setOutput('all', JSON.stringify(goReposWithoutUnifiedCI))
    core.setOutput('new', JSON.stringify(newGoReposWithoutUnifiedCI))

    if (newGoReposWithoutUnifiedCI.length > 0) {
      core.info('Adding Unified CI to newly created Go repos...')
      const owner: string = env.getOwner()
      const repo: string = env.getRepo()
      const branch = `go-repos-without-unified-ci/${github.context.runId}`

      core.info('Finding contributors...')
      const contributors = await Promise.all(
        newGoReposWithoutUnifiedCI.map(async r => {
          const repos = await octokit.rest.repos.listContributors({
            owner: r.split('/')[0],
            repo: r.split('/').slice(1).join('/'),
            per_page: 1
          })
          return repos.data
        })
      )
      const contributorsChecklist: string = [
        ...new Set(contributors.flat().map(contributor => contributor.login))
      ]
        .map(login => {
          return `- [ ] @${login}`
        })
        .join('\n')
      const reposChecklist: string = newGoReposWithoutUnifiedCI
        .map(r => {
          return `- [ ] ${r}`
        })
        .join('\n')

      core.info('Updating configs/go.json...')
      goConfig.repositories.push(
        ...newGoReposWithoutUnifiedCI.map(r => ({target: r}))
      )
      goConfig.repositories.sort((a, b) => a.target.localeCompare(b.target))
      fs.writeFileSync('configs/go.json', JSON.stringify(goConfig, null, 2))

      core.info(`Pushing changes to ${branch}...`)
      await exec.exec(
        `git config --global user.email web3-bot@users.noreply.github.com`
      )
      await exec.exec(`git config --global user.name web3-bot`)
      await exec.exec(`git branch ${branch}`)
      await exec.exec(`git checkout ${branch}`)
      await exec.exec(`git add configs/go.json`)
      await exec.exec(
        `git commit -m "chore: add Unified CI to new Go repositories"`
      )
      await exec.exec(`git push origin ${branch}`)

      core.info('Creating pull request...')
      const response = await octokit.rest.pulls.create({
        owner,
        repo,
        head: branch,
        base: 'master',
        title: 'Add Unified CI to new Go repositories',
        body: `
The bot has detected new Go repositories that do not have Unified CI set up yet.

Trying to add Unified CI to these repositories:
${reposChecklist}

Tagging the most active contributors for the new repositories:
${contributorsChecklist}

Contributors, please let us know if you want Unified CI added to your repositories 🙇
        `,
        draft: false
      })
      core.info(`Created pull request: ${response.data.html_url}`)
      core.setOutput('pr', response.data.html_url)
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
