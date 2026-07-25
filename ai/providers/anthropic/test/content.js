import ClaudeFile from "../src/file.js";

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

// A ClaudeFile with a stubbed remote handle, ready to render content blocks.
function withRemote (source, remoteId = "file_1") {
	let f = ClaudeFile.get(source, { capabilities: {} });
	f.remoteFile = { id: remoteId };
	return f;
}

// A ClaudeFile whose upload captures the file arg passed to the Files API.
function uploadCapture (source) {
	let captured;
	let f = ClaudeFile.get(source, {
		capabilities: {},
		client: { beta: { files: { upload: async ({ file }) => (captured = file) } } },
	});
	return async () => (await f.doUpload(), captured);
}

export default {
	name: "Claude provider",
	tests: [
		{
			name: "toContentPart",
			tests: [
				{
					name: "Image renders a label text block then a file image block",
					run: () => withRemote({ filename: "logo.png", contents: PNG }).toContentPart(),
					expect: [
						{ type: "text", text: "`logo.png`." },
						{ type: "image", source: { type: "file", file_id: "file_1" } },
					],
				},
				{
					name: "Data file renders a single document block with its description as context",
					run: () =>
						withRemote({ filename: "data.json", contents: { a: 1 } }).toContentPart(),
					expect: [
						{
							type: "document",
							context: "`data.json`.",
							source: { type: "file", file_id: "file_1" },
						},
					],
				},
			],
		},
		{
			name: "doUpload MIME type",
			tests: [
				{
					name: "Image is uploaded under its real image type",
					run: async () =>
						(await uploadCapture({ filename: "logo.png", contents: PNG })()).type,
					expect: "image/png",
				},
				{
					name: "Data file is uploaded as text/plain",
					run: async () =>
						(await uploadCapture({ filename: "data.json", contents: { a: 1 } })()).type,
					expect: "text/plain",
				},
			],
		},
	],
};
