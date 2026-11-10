# @qualve/formats

Meta-package for [Qualve](https://npmjs.com/package/qualve) format plugins.
Installs all official format plugins in one go.

## Setup

Requires **Node.js v23+**.

```sh
npm install @qualve/formats
```

This installs:
- [@qualve/csv](https://npmjs.com/package/@qualve/csv) — CSV and TSV
- [@qualve/yaml](https://npmjs.com/package/@qualve/yaml) — YAML

If you only need specific formats, install them individually instead.

## Usage

```js
import "@qualve/formats";
```

Importing the package registers every format with Qualve, so files with those extensions are parsed and serialized automatically.

You can also import individual formats via sub-paths:

```js
import "@qualve/formats/csv";
import "@qualve/formats/yaml";
```
