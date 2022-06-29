const core = require('@actions/core');
const github = require('@actions/github');

const ArtifactClient = require('./artifact');

const fs = require('fs');

async function main() {
  try {
    const GITHUB_TOKEN = core.getInput('GITHUB_TOKEN', { required: true });

    const octokit = new github.getOctokit(GITHUB_TOKEN);

    const web3BotOrgs = await octokit.paginate(octokit.rest.orgs.listForAuthenticatedUser).then(orgs => {
      return orgs.map(org => org.login);
    });

    const allGoRepos = await octokit.paginate(octokit.rest.search.repos, {
      q: `${web3BotOrgs.map(org => `org:${org}`).join(' ')} language:go archived:false`
    }).then(repos => {
      return repos.map(repo => repo.full_name);
    });

    const goReposWithUnifiedCI = JSON.parse(fs.readFileSync('configs/go.json')).repositories.map(repo => repo.target);
    const goReposWithoutUnifiedCI = allGoRepos.filter(repo => !goReposWithUnifiedCI.includes(repo));

    const artifactClient = new ArtifactClient(GITHUB_TOKEN);
    const artifactExists = await artifactClient.downloadArtifact('go-repos-without-unified-ci');
    const oldGoReposWithoutUnifiedCI = artifactExists ? JSON.parse(fs.readFileSync('go-repos-without-unified-ci.json')) : [];
    const newGoReposWithoutUnifiedCI = goReposWithoutUnifiedCI.filter(repo => !oldGoReposWithoutUnifiedCI.includes(repo));

    fs.writeFileSync('go-repos-without-unified-ci.json', JSON.stringify(goReposWithoutUnifiedCI, null, 2));
    await artifactClient.uploadArtifact('go-repos-without-unified-ci', ['go-repos-without-unified-ci.json']);

    core.setOutput('all', JSON.stringify(goReposWithoutUnifiedCI));
    core.setOutput('new', JSON.stringify(newGoReposWithoutUnifiedCI));
  } catch (error) {
    core.setFailed(error.message);
  }
}

main();
