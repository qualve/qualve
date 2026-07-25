import LLMFile from "../src/file.js";
import * as prompts from "../src/prompts.js";

// Stand-in for the LLMTask `this` that prompts.inputFile is called with.
const noCapabilities = { capabilities: {} };
const describe = file => prompts.inputFile.call(noCapabilities, file);

// A tiny PNG byte signature — enough to exercise the binary path.
const PNG_BYTES = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const image = () => LLMFile.get({ filename: "logo.png", contents: PNG_BYTES });
const svg = () => LLMFile.get({ filename: "icon.svg", contents: "<svg></svg>" });
const data = () => LLMFile.get({ filename: "answers.json", contents: { a: 1 } });

export default {
	name: "LLMFile media handling",
	tests: [
		{
			name: "classification (isMedia)",
			tests: [
				{
					name: "Binary image is media",
					run: () => image().isMedia,
					expect: true,
				},
				{
					name: "SVG is not media (uploaded as text)",
					run: () => svg().isMedia,
					expect: false,
				},
				{
					name: "JSON data is not media",
					run: () => data().isMedia,
					expect: false,
				},
			],
		},
		{
			name: "uploadMimeType",
			tests: [
				{
					name: "Image declares its real image type",
					run: () => image().uploadMimeType,
					expect: "image/png",
				},
				{
					name: "SVG declares text/plain",
					run: () => svg().uploadMimeType,
					expect: "text/plain",
				},
				{
					name: "JSON data keeps its own MIME type",
					run: () => data().uploadMimeType,
					expect: "application/json",
				},
			],
		},
		{
			name: "toBlob",
			tests: [
				{
					name: "Image blob carries the image type",
					run: () => image().toBlob().type,
					expect: "image/png",
				},
				{
					name: "Image blob passes bytes through unchanged",
					run: () => image().toBlob().size,
					expect: PNG_BYTES.length,
				},
				{
					name: "SVG blob is verbatim text, not JSON-wrapped",
					run: async () => await svg().toBlob().text(),
					expect: "<svg></svg>",
				},
				{
					name: "SVG blob carries text/plain",
					run: () => svg().toBlob().type,
					expect: "text/plain",
				},
			],
		},
		{
			name: "toString",
			tests: [
				{
					name: "Throws for binary media (has no text form)",
					run: () => image().toString(),
					throws: true,
				},
				{
					name: "Returns raw text for SVG",
					run: () => svg().toString(),
					expect: "<svg></svg>",
				},
			],
		},
		{
			name: "describe (prompt text)",
			tests: [
				{
					name: "Image is named without JSON-schema language",
					run: () => describe(image()),
					expect: "`logo.png`.",
				},
				{
					name: "Image includes its description when present",
					run: () =>
						describe(
							LLMFile.get({
								filename: "logo.png",
								contents: PNG_BYTES,
								description: "the brand logo",
							}),
						),
					expect: "`logo.png` containing the brand logo.",
				},
				{
					name: 'Schema-less SVG is named cleanly (no dangling "which")',
					run: () => describe(svg()),
					expect: "`icon.svg`.",
				},
			],
		},
		{
			name: "remoteFilename",
			tests: [
				{
					name: "Media names hash bytes without throwing",
					run: () => image().remoteFilename,
					check: name => /^logo-[0-9a-f]{12}\.png$/.test(name),
				},
				{
					name: "Identity follows content (same bytes → same name)",
					run: () => image().remoteFilename === image().remoteFilename,
					expect: true,
				},
			],
		},
	],
};
