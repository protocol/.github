import {Octokit} from '@octokit/rest'
import { Command } from 'commander/esm.mjs';

const program = new Command();
program.option('-l, --languages [lang...]', 'languages (e.g. JavaScript, Go)', ['JavaScript', 'Go'])
program.parse(process.argv);
const opts = program.opts();

const LANGUAGES = opts.languages;
const ORGS = ["ipfs", "ipfs-shipyard", "ipld", "libp2p", "multiformats"]

const options = {}
if (process.env.GITHUB_TOKEN) {
  options.auth = process.env.GITHUB_TOKEN
}

const octokit = new Octokit(options)

async function list_repos(orgs, langs) {
  let results = []
  for (const org of orgs) {
    for await (const resp of octokit.paginate.iterator(octokit.rest.repos.listForOrg, {org})) {
      for (const repo of resp.data) {
        if (repo.private || repo.archived) {
          continue
        }
        if (!langs.includes(repo.language)) {
          continue
        }
        results.push(repo.full_name)
      }
    }
  }
  return results.sort((a, b) => a.full_name < b.full_name)
}

(async () => {
  let repos = await list_repos(ORGS, LANGUAGES)
  console.log(JSON.stringify(repos))
})()
