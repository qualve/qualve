# @qualve/googleai

[Google Gemini](https://ai.google.dev/) provider for [Qualve](https://npmjs.com/package/qualve) LLM tasks.

## Setup

Requires **Node.js v23+**.

```sh
npm install @qualve/googleai
```

Set the `GEMINI_API_KEY` environment variable (or add it to `.env`).
Get a key at https://aistudio.google.com/api-keys.

## Usage

```js
import "@qualve/googleai";
```

Importing the package registers the `gemini` provider with the Qualve task system.

Then use `llm: "gemini"` in your task definitions:

```js
export default {
	type: "llm",
	llm: "gemini",
	system: "You are a helpful assistant.",
	prompt: "Summarize this data.",
	input: [{ name: "data", schema: mySchema }],
	output: { name: "summary", schema: summarySchema },
};
```

## Models

| Model                              | Context window | Max output |
| ---------------------------------- | -------------- | ---------- |
| `gemini-3.1-pro-preview` (default) | 1,048,576      | 65,536     |
| `gemini-3.5-flash`                 | 1,048,576      | 65,536     |
| `gemini-3.1-flash-lite`            | 1,048,576      | 65,536     |

## Capabilities

| Capability                      | Supported                                                         |
| ------------------------------- | ----------------------------------------------------------------- |
| Structured output (JSON schema) | Yes                                                               |
| Thinking levels                 | Yes (`minimal`, `low`, `medium`, `high`\*)                        |
| Web search                      | Yes (pro models only)                                             |
| Token counting                  | Yes                                                               |
| Image input                     | Yes (`png`, `jpeg`, `gif`, `webp`, `heic`, `heif`; `svg` as text) |

\* Default

## Image input

Add an image to a task's `input` and it's sent to Gemini as a native image part:

```js
export default {
	type: "llm",
	llm: "gemini",
	prompt: "Describe what's in this diagram.",
	input: ["diagram.png"],
	output: { name: "summary" },
};
```

`svg` is uploaded as text (its XML source), not a rendered image. Images are
excluded from `--dry-run` token counts. See the
[@qualve/llm](https://npmjs.com/package/@qualve/llm) docs for the full behavior.
