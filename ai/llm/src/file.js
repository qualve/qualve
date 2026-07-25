import { createHash } from "node:crypto";
import * as path from "node:path";
import File from "qualve/file";
import { addFilenameSuffix } from "qualve/util";
import { JsonFormat } from "qualve/format";
import * as prompts from "./prompts.js";

/**
 * JSON variant tuned for LLM uploads: no indentation, null/undefined values
 * stripped via a replacer (both saves tokens). Unregistered (`latent: true`)
 * so it doesn't shadow the default JSON format for `.json` files.
 */
export const compactJson = new JsonFormat({
	indent: null,
	replacer: (k, v) => v ?? undefined,
	latent: true,
});

/**
 * File subclass for LLM tasks.
 * Handles serialization, upload, remote file management, and prompt description.
 * Provider subclasses (ClaudeFile, GeminiFile, OpenAIFile) implement the provider-specific methods.
 */
export default class LLMFile extends File {
	/** Remote file object from the provider. Set after upload(). */
	remoteFile;

	/**
	 * Format used for serializing this file for LLM upload.
	 * Defaults to compact JSON (null-stripping, no indentation — token-efficient).
	 * Overridable per-file or per-subclass (e.g. JSONL).
	 */
	get uploadFormat () {
		return compactJson;
	}

	/**
	 * Whether this file is binary media (an image, etc.) that must be uploaded
	 * as-is under its own MIME type rather than text-serialized via {@link uploadFormat}.
	 * Keyed off the format's `binary` flag, so SVG — a text format despite being an
	 * image — is (correctly) not treated as media and goes through the text path.
	 */
	get isMedia () {
		return this.format.binary === true;
	}

	/**
	 * MIME type to declare when uploading to a provider.
	 * - Media (images): its real type (e.g. `image/png`), so the provider treats it as an image.
	 * - Already-text content (e.g. SVG, plain text): `text/plain`, so it's uploaded as text
	 *   rather than under an image type a provider's file API may reject (`image/svg+xml`).
	 * - Everything else (structured data): unchanged from {@link File#mimeType}, preserving
	 *   existing behavior for JSON/CSV/etc.
	 */
	get uploadMimeType () {
		if (this.isMedia) {
			return this.mimeType;
		}
		return typeof this.contents === "string" ? "text/plain" : this.mimeType;
	}

	/** Serialize contents for LLM upload using the upload format. */
	toString () {
		let contents = this.contents;
		if (typeof contents === "string") {
			return contents;
		}
		if (this.isMedia) {
			// Binary media has no text serialization — callers must use toBlob().
			// Defer to the base File, which throws a clear error for binary formats.
			return super.toString();
		}
		return this.uploadFormat.serialize(contents);
	}

	/**
	 * Wrap contents in a Blob for upload. Media (binary) files pass their bytes
	 * through untouched under their real MIME type; everything else is serialized
	 * with the upload format.
	 */
	toBlob () {
		if (this.isMedia) {
			return new Blob([this.contents], { type: this.mimeType });
		}
		let contents = this.contents;
		if (typeof contents === "string") {
			// Already text (e.g. SVG, plain text): upload verbatim, not JSON-wrapped.
			return new Blob([contents], { type: this.uploadMimeType });
		}
		let f = this.uploadFormat;
		return new Blob([f.serialize(contents)], { type: f.mimeType });
	}

	#remoteFilename;

	/**
	 * Remote filename for upload: a readable stem from the file's path plus a short
	 * content hash, so identity follows content. A byte-identical file keeps the same
	 * remote name across every invocation — the property prompt caching needs to reuse
	 * a shared document (e.g. a codebook referenced across every question of a survey) —
	 * while changed content yields a new name, and thus a fresh upload, on its own.
	 * Separators → "-" so the name is slash-free for every provider.
	 * Hash goes before the extension so the name still ends in a real extension
	 * (some providers, e.g. OpenAI, validate uploads by trailing extension).
	 * Memoized; assumes contents are resolved, which holds wherever upload runs
	 * (getRemoteFiles awaits contents before calling upload).
	 */
	get remoteFilename () {
		if (this.#remoteFilename === undefined) {
			// Identity is content-derived, so contents must be resolved. Fail loud rather
			// than hash a pending Promise into a poisoned (and memoized) name.
			if (typeof this.contents?.then === "function") {
				throw new Error(
					`remoteFilename for ${this.path} requires resolved contents; await contents before upload.`,
				);
			}

			let stem = this.path.split(path.sep).join("-");
			// Hash the raw bytes for media (which has no text serialization), the
			// serialized text otherwise. Either way, identity follows content.
			let hash = createHash("sha256")
				.update(this.isMedia ? this.contents : this.toString())
				.digest("hex")
				.slice(0, 12);
			this.#remoteFilename = addFilenameSuffix(stem, `-${hash}`);
		}

		return this.#remoteFilename;
	}

	/**
	 * Idempotent, content-addressed upload. No-op if already uploaded this run;
	 * otherwise reuses a matching remote file when one exists (its name encodes the
	 * content, so a name match is a content match) and uploads only when absent.
	 * Staleness needs no special handling: changed content yields a new name (see
	 * {@link remoteFilename}) and thus a fresh upload on its own.
	 * NOTE: superseded remote files (older content hashes) are left in place, so
	 * distinct versions accumulate on the provider; cleanup is a separate concern.
	 * @returns {object} Remote file object (provider-specific)
	 */
	async upload () {
		if (this.remoteFile) {
			return this.remoteFile;
		}

		this.remoteFile = await this.getRemote();

		if (!this.remoteFile) {
			this.context?.info(`Uploading ${this.path} ...`);
			this.remoteFile = await this.doUpload();
		}

		this.context?.info(`Source file ${this.path} ready`);
		return this.remoteFile;
	}

	/**
	 * Describe this file for inclusion in an LLM prompt.
	 * @param {object} [options]
	 * @param {"input" | "output"} [options.role="input"]
	 */
	describe ({ role = "input" } = {}) {
		let fn = role === "output" ? prompts.outputFile : prompts.inputFile;
		return fn.call(this.context, this);
	}

	/** Provider-specific upload implementation. Override in subclass. */
	async doUpload () {
		throw new Error("Not implemented");
	}

	/** Check if this file exists on the provider. Override in subclass. */
	async getRemote () {
		throw new Error("Not implemented");
	}
}
