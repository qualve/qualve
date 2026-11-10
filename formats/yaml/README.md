# @qualve/yaml

YAML format plugin for [Qualve](https://npmjs.com/package/qualve).

## Setup

Requires **Node.js v23+**.

```sh
npm install @qualve/yaml
```

## Usage

```js
import "@qualve/yaml";
```

Importing the package registers the `yaml` format with Qualve, handling `.yaml` and `.yml` files (MIME type `application/yaml`).

The format instance is also exported if you need it directly:

```js
import { yaml } from "@qualve/yaml";
```

Parsing and serialization are powered by the [yaml](https://eemeli.org/yaml/) package.
