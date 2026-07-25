import { createHash } from "node:crypto";
import { createPartFromUri } from "@google/genai";
import LLMFile from "@qualve/llm/file";

export default class GeminiFile extends LLMFile {
	get remoteFilename () {
		let name = super.remoteFilename;
		// Gemini file ID: lowercase alphanumeric or dashes, no leading/trailing dashes.
		name = name.replace(/[_.]/g, "-").replace(/^-|-$/g, "");

		// Gemini file IDs are limited to 40 chars.
		// Batch slice inputs can exceed this (e.g. "ba-answers-normalized-unique-500-999-json").
		// Truncate with a hash suffix to preserve uniqueness.
		let maxLength = 40;
		if (name.length > maxLength) {
			let hash = createHash("sha256").update(name).digest("hex").slice(0, 6);
			name = name.slice(0, maxLength - 7) + "-" + hash;
		}

		return name;
	}

	/** Display name for the Gemini API (preserves original filename format). */
	get displayName () {
		return super.remoteFilename;
	}

	async doUpload () {
		let { client } = this.context;
		return client.files.upload({
			file: this.toBlob(),
			config: {
				name: this.remoteFilename,
				displayName: this.displayName,
				// Declare the upload type (image/* for media, text/plain for SVG/text),
				// not the raw file MIME, so Gemini accepts and interprets it correctly.
				mimeType: this.uploadMimeType,
			},
		});
	}

	/**
	 * Look up this file on Gemini, with error handling for not-found cases.
	 * Gemini returns 403 (not 404) when a file doesn't exist, so we disambiguate
	 * by listing files to check whether it's a real permission error.
	 * @returns {Promise<object|null>}
	 */
	async getRemote () {
		let name = "files/" + this.remoteFilename;

		try {
			// If we don't await here, the error is unhandled
			return await this.context.client.files.get({ name });
		}
		catch (e) {
			if (e.status === 403 || e.status === 404) {
				// 403 can mean "not found" on Gemini — verify by listing files.
				// 404 is a straightforward not-found.
				if (e.status === 403) {
					let files = await this.context.client.files.list();
					for await (let file of files) {
						if (file.name === name) {
							throw new Error(
								`You don't have permission to access file ${this.path}`,
								{ cause: e },
							);
						}
					}
				}
			}
			else {
				throw new Error(`Failed to get file ${this.path}`, { cause: e });
			}
		}

		// Not found
		return null;
	}

	/**
	 * Render this file as Gemini content parts. Gemini's part constructor is
	 * MIME-generic, so images, text, and data all use the same shape — the uploaded
	 * file's MIME type (image/* for media, text/plain for SVG) drives interpretation.
	 * Returns an array so callers flatten uniformly across providers.
	 */
	toContentPart () {
		return [createPartFromUri(this.remoteFile.uri, this.remoteFile.mimeType)];
	}
}
