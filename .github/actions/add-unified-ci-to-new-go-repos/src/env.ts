function getOrThrow(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Environment variable ${name} is not set`)
  }
  return value
}

function getWorkspace(): string {
  return getOrThrow('GITHUB_WORKSPACE')
}

function getOwner(): string {
  return getOrThrow('GITHUB_REPOSITORY').split('/')[0]
}

function getRepo(): string {
  return getOrThrow('GITHUB_REPOSITORY').split('/').slice(1).join('/')
}

export {getWorkspace, getOwner, getRepo}
