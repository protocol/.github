const DefaultArtifactClient = require('@actions/artifact');
const github = require('@actions/github');
const Zip = require('adm-zip');
const fs = require('fs');

module.exports = class ArtifactClient {
  constructor(token) {
    this.artifactClient = DefaultArtifactClient.create();
    this.githubClient = github.getOctokit(token);
  }

  async filterArtifacts(filter) {
    return await this.githubClient.paginate(this.githubClient.rest.actions.listArtifactsForRepo, {
      owner: process.env['GITHUB_REPOSITORY_OWNER'],
      repo: process.env['GITHUB_REPOSITORY'].substring(process.env['GITHUB_REPOSITORY_OWNER'].length + 1)
    }).then(artifacts => {
      return artifacts.filter(filter);
    });
  }

  async extractArtifact(artifact, path, options) {
    const folder = options?.createArtifactFolder ? `${path}/${artifact.name}` : path;
    if (options?.createArtifactFolder) {
      fs.mkdirSync(folder);
    }
    const { data } = await this.githubClient.rest.actions.downloadArtifact({
      owner: process.env['GITHUB_REPOSITORY_OWNER'],
      repo: process.env['GITHUB_REPOSITORY'].substring(process.env['GITHUB_REPOSITORY_OWNER'].length + 1),
      artifact_id: artifact.id,
      archive_format: 'zip'
    });
    const zip = new Zip(Buffer.from(data));
    zip.extractAllTo(folder);
    return {
      artifactName: artifact.name,
      downloadPath: folder
    };
  }

  async uploadArtifact(name, files, rootDirectory = process.env['GITHUB_WORKSPACE'], options) {
    return await this.artifactClient.uploadArtifact(name, files, rootDirectory, options);
  }

  async downloadArtifact(name, path = process.env['GITHUB_WORKSPACE'], options) {
    const artifacts = await this.filterArtifacts(artifact => {
      return artifact.name == name && (!options?.filter || options.filter(artifact));
    })
    if (artifacts.length > 0) {
      return await this.extractArtifact(artifacts[0], path, options);
    } else {
      return undefined;
    }
  }

  async downloadAllArtifacts(path = process.env['GITHUB_WORKSPACE'], options) {
    const artifacts = await this.filterArtifacts(options.filter);
    return await Promise.all(artifacts.map(async artifact => {
      return await this.extractArtifact(artifact, path, options);
    }));
  }
}
