# Repo List

List all PL repos. Currently, this script lists all Go & JavaScript repos in the following orgs:

- ipfs
- ipfs-shipyard
- ipld
- libp2p
- multiformats

It outputs them as a JSON array.

## Install

Before usage, you'll need to install the dependencies.

```bash
$ npm install
```

## Usage

```bash
$ node index.js
```

If you run into GitHub's rate limits, try setting the GITHUB_TOKEN environment variable:
```bash
$ GITHUB_TOKEN=your_token node index.js
```
