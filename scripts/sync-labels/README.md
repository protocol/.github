# Issue Label Syncer

Manually sync issue labels.

## Install

Before usage, you'll need to install the dependencies.

```go
$ npm install
```

## Usage

To sync issue labels to all repos listed in `.config/workflows/config.json`, run:

```bash
$ node index.js
```

You can also sync labels to a specific repo:

```bash
$ node index.js my-org/my-repo
```
