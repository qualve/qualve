# @qualve/llm

Core LLM task framework for [Qualve](https://npmjs.com/package/qualve).
Provides the `LLMTask` base class that all LLM provider adapters extend.

If you want all providers out of the box, install [@qualve/llms](https://npmjs.com/package/@qualve/llms) instead.

## Setup

Requires **Node.js v23+**.

```sh
npm install @qualve/llm
```

## Usage

Import alongside a provider to register the `llm` task type:

```js
import "@qualve/anthropic"; // or @qualve/openai, @qualve/googleai
```

### Image input

Add an image to a task's `input` like any other file — the file extension drives
how it's handled:

```js
export default {
	type: "llm",
	llm: "gemini", // image input is currently Gemini-only
	prompt: "Describe what's in this diagram.",
	input: ["diagram.png", { name: "data", schema: mySchema }],
	output: { name: "summary" },
};
```

- **Recognized image types** (`png`, `jpeg`, `gif`, `webp`, `heic`, `heif`) are
  uploaded as-is under their real MIME type and sent to the model as native image
  parts — never serialized to JSON.
- **`svg`** is technically an image but is uploaded as **text** (its XML source),
  since models read markup well.
- Any other binary type is rejected with a clear error rather than silently
  uploaded as a JSON byte dump.

Image input is gated by the provider `imageInput` capability. Providers without it
(currently Claude and OpenAI) **fail fast** at task setup with an actionable message
rather than mis-sending the image. Images are excluded from `--dry-run` token counts.

### Writing a custom provider

```js
import { LLMTask } from "@qualve/llm";

export default class MyProvider extends LLMTask {
	static id = "my-provider";
	static name = "My Provider";
	static models = ["my-model-v1"];
	static capabilities = {};

	// Required: implement these abstract methods
	async uploadFile (filepath, { mimeType, contents }) {
		/* ... */
	}
	async getFile (filepath) {
		/* ... */
	}
	async deleteFile (filepath) {
		/* ... */
	}
	async listFiles () {
		/* ... */
	}
	async createStream () {
		/* ... */
	}
}

LLMTask.register(MyProvider);
```

## API

### `LLMTask`

Extends the base Qualve `Task` class with LLM-specific functionality:

- **Provider dispatch** — `LLMTask.create()` routes to the registered provider based on `task.llm`
- **File management** — Upload, retrieve, and manage files on the provider
- **Streaming** — `handleStream()` writes streamed responses to disk with backpressure handling
- **Prompt helpers** — `file.describe()` generates prompt text describing task I/O files
- **Thinking levels** — Normalized across providers via `thinkingLevels` and per-provider `levelMap`
- **Stop reasons** — Normalized stop reasons (`COMPLETE`, `MAX_TOKENS`, `ABORTED`, `UNKNOWN`)

### Abstract methods (providers must implement)

| Method                                         | Description                                                                              |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `uploadFile(filepath, { mimeType, contents })` | Upload data to the provider                                                              |
| `getFile(filepath)`                            | Retrieve a previously uploaded file, or `null`                                           |
| `deleteFile(filepath)`                         | Delete a previously uploaded file                                                        |
| `listFiles()`                                  | List all uploaded files                                                                  |
| `createStream()`                               | Create the streaming API call; returns `{ stream, transformChunk, onChunk?, onFinish? }` |

### Optional overrides

| Method             | Description                                            |
| ------------------ | ------------------------------------------------------ |
| `getStatus(chunk)` | Extract a human-readable status from a streaming chunk |
| `countTokens()`    | Count input tokens for a dry run                       |
