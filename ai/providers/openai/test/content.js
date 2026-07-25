import OpenAIFile from "../src/file.js";

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

function withRemote (source, remoteId = "file_1") {
	let f = OpenAIFile.get(source, { capabilities: {} });
	f.remoteFile = { id: remoteId };
	return f;
}

// An OpenAIFile whose upload captures the args passed to files.create.
function uploadCapture (source) {
	let captured;
	let f = OpenAIFile.get(source, {
		capabilities: {},
		client: { files: { create: async args => (captured = args) } },
	});
	return async () => (await f.doUpload(), captured);
}

export default {
	name: "OpenAI provider",
	tests: [
		{
			name: "toContentPart",
			tests: [
				{
					name: "Image renders a describe text block then an input_image block",
					run: () => withRemote({ filename: "logo.png", contents: PNG }).toContentPart(),
					expect: [
						{ type: "input_text", text: "`logo.png`." },
						{ type: "input_image", file_id: "file_1", detail: "auto" },
					],
				},
				{
					name: "Data file renders a describe text block then an input_file block",
					run: () =>
						withRemote({ filename: "data.json", contents: { a: 1 } }).toContentPart(),
					expect: [
						{ type: "input_text", text: "`data.json`." },
						{ type: "input_file", file_id: "file_1" },
					],
				},
			],
		},
		{
			name: "doUpload purpose and MIME type",
			tests: [
				{
					name: "Image uploads with the vision purpose and its real image type",
					run: async () => {
						let a = await uploadCapture({ filename: "logo.png", contents: PNG })();
						return [a.purpose, a.file.type];
					},
					expect: ["vision", "image/png"],
				},
				{
					name: "Data file uploads as user_data",
					run: async () => {
						let a = await uploadCapture({
							filename: "data.json",
							contents: { a: 1 },
						})();
						return a.purpose;
					},
					expect: "user_data",
				},
			],
		},
	],
};
