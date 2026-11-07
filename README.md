# Qualve

Monorepo for [Qualve](https://npmjs.com/package/qualve), a pluggable data processing framework, and its official plugins.

## Packages

| Package | Path | Description |
| --- | --- | --- |
| [qualve](https://npmjs.com/package/qualve) | `core/` | Core framework and CLI |
| [@qualve/ai](https://npmjs.com/package/@qualve/ai) | `ai/` | Meta-package installing LLM support with all providers |
| [@qualve/llm](https://npmjs.com/package/@qualve/llm) | `ai/llm/` | Core LLM task framework |
| [@qualve/anthropic](https://npmjs.com/package/@qualve/anthropic) | `ai/providers/anthropic/` | Anthropic Claude provider |
| [@qualve/openai](https://npmjs.com/package/@qualve/openai) | `ai/providers/openai/` | OpenAI provider |
| [@qualve/googleai](https://npmjs.com/package/@qualve/googleai) | `ai/providers/googleai/` | Google Gemini provider |
| [@qualve/graphql](https://npmjs.com/package/@qualve/graphql) | `graphql/` | GraphQL inputs for tasks |
| [@qualve/formats](https://npmjs.com/package/@qualve/formats) | `formats/` | Meta-package for format plugins |
| [@qualve/csv](https://npmjs.com/package/@qualve/csv) | `formats/csv/` | CSV and TSV format plugin |
| [@qualve/yaml](https://npmjs.com/package/@qualve/yaml) | `formats/yaml/` | YAML format plugin |

Each package has its own README with installation and usage details.

## Development

Requires Node.js 24 or later.

```sh
npm install
npm test
```

Releases are cut from the root with `npm run release`, which versions all workspaces together.
