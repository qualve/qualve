import GeminiFile from "../src/file.js";

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

function withRemote (source, remote) {
	let f = GeminiFile.get(source, { capabilities: {} });
	f.remoteFile = remote;
	return f;
}

export default {
	name: "Gemini provider",
	tests: [
		{
			name: "toContentPart",
			tests: [
				{
					name: "Renders a single file-URI part from the uploaded file (image)",
					run: () =>
						withRemote(
							{ filename: "logo.png", contents: PNG },
							{ uri: "https://g/abc", mimeType: "image/png" },
						).toContentPart(),
					expect: [{ fileData: { fileUri: "https://g/abc", mimeType: "image/png" } }],
				},
				{
					name: "SVG carries the uploaded text/plain MIME type",
					run: () =>
						withRemote(
							{ filename: "icon.svg", contents: "<svg></svg>" },
							{ uri: "https://g/svg", mimeType: "text/plain" },
						).toContentPart(),
					expect: [{ fileData: { fileUri: "https://g/svg", mimeType: "text/plain" } }],
				},
			],
		},
	],
};
