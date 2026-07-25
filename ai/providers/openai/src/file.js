import LLMFile from "@qualve/llm/file";

export default class OpenAIFile extends LLMFile {
	async doUpload () {
		let { client } = this.context;
		return client.files.create({
			file: new File([this.toBlob()], this.remoteFilename, { type: this.uploadMimeType }),
			// Images are uploaded for vision; all other input is generic user data.
			purpose: this.isMedia ? "vision" : "user_data",
		});
	}

	async getRemote () {
		let list = await this.context.listFiles();
		return list.find(f => f.filename === this.remoteFilename);
	}

	/**
	 * Render this file as OpenAI Responses content blocks: a text block naming/describing
	 * the file, then the file itself — an `input_image` for images, `input_file` otherwise.
	 */
	toContentPart () {
		let file_id = this.remoteFile.id;
		let describe = { type: "input_text", text: this.describe() };

		return this.isMedia
			? [describe, { type: "input_image", file_id, detail: "auto" }]
			: [describe, { type: "input_file", file_id }];
	}
}
