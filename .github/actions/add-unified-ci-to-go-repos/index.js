const core = require('@actions/core');
const github = require('@actions/github');
const exec = require('@actions/exec');

const fs = require('fs');

async function main() {
  try {
    const GITHUB_TOKEN = core.getInput('GITHUB_TOKEN', { required: true });
    const repositories = JSON.parse(core.getInput('repos', { required: true }));
    const branch = `go-repos-without-unified-ci/${github.context.runId}`;

    const octokit = new github.getOctokit(GITHUB_TOKEN);

    core.info('Finding contributors...');
    const contributors = await Promise.all(repositories.flatMap(async repo => {
      return await octokit.rest.repos.listContributors({
        owner: repo.split('/')[0],
        repo: repo.split('/').slice(1).join('/'),
        per_page: 1
      });
    }));
    const contributorsChecklist = [...new Set(contributors)].map(contributor => {
      return `- [ ] @${contributor.login}`
    }).join('\n');

    core.info('Updating configs/go.json...')
    const goConfig = JSON.parse(fs.readFileSync('configs/go.json'));
    goConfig.repositories.push(...repositories.map(repo => ({ target: repo })));
    goConfig.repositories.sort((a, b) => a.target.localeCompare(b.target));
    fs.writeFileSync('configs/go.json', JSON.stringify(goConfig, null, 2));

    core.info(`Pushing changes to ${branch}...`)
    await exec.exec(`git config --global user.email web3-bot@users.noreply.github.com`);
    await exec.exec(`git config --global user.name web3-bot`);
    await exec.exec(`git branch ${branch}`);
    await exec.exec(`git checkout ${branch}`);
    await exec.exec(`git add configs/go.json`);
    await exec.exec(`git commit -m "chore: add Unified CI to new Go repositories"`);
    await exec.exec(`git push origin ${branch}`);

    core.info('Creating pull request...')
    const response = await octokit.rest.pulls.create({
      owner: process.env['GITHUB_REPOSITORY_OWNER'],
      repo: process.env['GITHUB_REPOSITORY'].substring(process.env['GITHUB_REPOSITORY_OWNER'].length + 1),
      head: branch,
      base: 'master',
      title: 'Add Unified CI to new Go repositories',
      body: ```
        The bot has detected new Go repositories that do not have Unified CI set up yet.

        Trying to add Unified CI to these repositories in this PR.

        Tagging the most active contributors for the new repositories:
        ${contributorsChecklist}
      ```,
      draft: true
    });
    core.info(JSON.stringify(response));
  } catch (error) {
    core.setFailed(error.message);
  }
}

main();
