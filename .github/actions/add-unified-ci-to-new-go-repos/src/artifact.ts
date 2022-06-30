import * as artifact from '@actions/artifact'
import * as env from './env'
import * as fs from 'fs'
import * as github from '@actions/github'
import AdmZip from 'adm-zip'

interface Artifact {
  id: string
  name: string
}

class ArtifactNotFoundError extends Error {}

class CrossRunArtifactClient implements artifact.ArtifactClient {
  artifactClient: artifact.ArtifactClient
  githubClient: any // eslint-disable-line @typescript-eslint/no-explicit-any
  workspace: string
  owner: string
  repo: string

  constructor(token: string) {
    this.workspace = env.getWorkspace()
    this.owner = env.getOwner()
    this.repo = env.getRepo()
    this.artifactClient = artifact.create()
    this.githubClient = github.getOctokit(token)
  }

  async uploadArtifact(
    name: string,
    files: string[],
    rootDirectory: string = this.workspace,
    options?: artifact.UploadOptions | undefined
  ): Promise<artifact.UploadResponse> {
    return this.artifactClient.uploadArtifact(
      name,
      files,
      rootDirectory,
      options
    )
  }

  async downloadArtifact(
    name: string,
    path?: string | undefined,
    options?: artifact.DownloadOptions | undefined
  ): Promise<artifact.DownloadResponse> {
    const definedPath: string = path ? path : this.workspace
    const destination: string = options?.createArtifactFolder
      ? `${definedPath}/${name}`
      : definedPath
    const artifacts: Artifact[] = await this.githubClient.paginate(
      this.githubClient.rest.actions.listArtifactsForRepo,
      {
        owner: this.owner,
        repo: this.repo
      }
    )
    const artifactToDownload: Artifact | undefined = artifacts.find(
      a => a.name === name
    )
    if (!artifactToDownload) {
      throw new ArtifactNotFoundError(`Artifact ${name} not found`)
    }
    const downloadedArtifact =
      await this.githubClient.rest.actions.downloadArtifact({
        owner: this.owner,
        repo: this.repo,
        artifact_id: artifactToDownload,
        archive_format: 'zip'
      })
    const zip = new AdmZip(Buffer.from(downloadedArtifact.data))
    if (options?.createArtifactFolder) {
      fs.mkdirSync(destination)
    }
    zip.extractAllTo(destination)
    return {
      artifactName: artifactToDownload.name,
      downloadPath: destination
    }
  }

  async downloadAllArtifacts(): Promise<artifact.DownloadResponse[]> {
    throw new Error('Method not implemented.')
  }
}

export {ArtifactNotFoundError, CrossRunArtifactClient}
