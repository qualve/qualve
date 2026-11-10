# @qualve/csv

CSV and TSV format plugin for [Qualve](https://npmjs.com/package/qualve).

## Setup

Requires **Node.js v23+**.

```sh
npm install @qualve/csv
```

## Usage

```js
import "@qualve/csv";
```

Importing the package registers two formats with Qualve:

| Format | Extensions | MIME type |
| --- | --- | --- |
| `csv` | `.csv` | `text/csv` |
| `tsv` | `.tsv` | `text/tab-separated-values` |

Files with these extensions are then parsed into arrays of objects (using the first row as column headers) and serialized back with a header row.
When serializing, cells that hold an array of primitives are joined with `, `.

The format instances are also exported if you need them directly:

```js
import { csv, tsv } from "@qualve/csv";
```

Parsing and serialization are powered by [csv-parse](https://csv.js.org/parse/) and [csv-stringify](https://csv.js.org/stringify/), and accept their options.
