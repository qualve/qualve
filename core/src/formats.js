import { Format, TextFormat, BinaryFormat } from "./format.js";

/** JSON format. */
export class JsonFormat extends TextFormat {
	extensions = ["json"];
	mimeTypes = ["application/json"];

	parse (text) {
		return JSON.parse(text);
	}

	serialize (data, { indent = "\t", replacer = null } = {}) {
		return JSON.stringify(data, replacer, indent);
	}
}

export const json = JsonFormat.default;

/** Generic plain-text format (`.txt`). */
export const text = new TextFormat({
	extension: "txt",
	mimeType: "text/plain",
});

/**
 * Raster image formats. Registered as binary so they are read as Buffers and
 * passed through verbatim (never text-serialized) when uploaded to an LLM.
 */
export const png = new BinaryFormat({ extension: "png", mimeType: "image/png" });
export const jpeg = new BinaryFormat({ extensions: ["jpg", "jpeg"], mimeType: "image/jpeg" });
export const gif = new BinaryFormat({ extension: "gif", mimeType: "image/gif" });
export const webp = new BinaryFormat({ extension: "webp", mimeType: "image/webp" });

/**
 * SVG. Technically an image, but XML text: registered as a text format so it is
 * read and uploaded as text (not as binary image media), while still carrying the
 * `image/svg+xml` MIME type for anything that inspects it.
 */
export const svg = new TextFormat({ extension: "svg", mimeType: "image/svg+xml" });

export * from "./format.js";
export default Format;
