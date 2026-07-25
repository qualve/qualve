import LLMFile from "@qualve/llm/file";
import { toFile } from "@anthropic-ai/sdk";

export default class ClaudeFile extends LLMFile {
	async doUpload () {
		let { client } = this.context;
		// The Claude Files API doesn't support JSON files directly, so data files are
		// uploaded under a text/plain MIME type that Claude accepts. Media (images) keeps
		// its real type so Claude ingests it as an image rather than as text.
		// See https://platform.claude.com/docs/en/build-with-claude/files#file-types-and-content-blocks
		let type = this.isMedia ? this.uploadMimeType : "text/plain";
		return client.beta.files.upload({
			file: await toFile(this.toBlob(), this.remoteFilename, { type }),
		});
	}

	async getRemote () {
		let list = await this.context.listFiles();
		return list.find(f => f.filename === this.remoteFilename);
	}

	/**
	 * Render this file as Anthropic content blocks referencing the uploaded file.
	 * Data files become a single `document` block carrying their description as `context`.
	 * Images become an `image` block (file source) preceded by a text block naming them —
	 * image blocks have no `context` field of their own. Returns an array so callers
	 * flatten uniformly and attach any cache breakpoint to the final block.
	 */
	toContentPart () {
		let file_id = this.remoteFile.id;

		if (this.isMedia) {
			return [
				{ type: "text", text: this.describe() },
				{ type: "image", source: { type: "file", file_id } },
			];
		}

		return [{ type: "document", context: this.describe(), source: { type: "file", file_id } }];
	}
}
