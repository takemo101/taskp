import { Box, createCliRenderer, Text } from "@opentui/core";

export async function startTui(): Promise<void> {
	const renderer = await createCliRenderer({
		exitOnCtrlC: true,
		targetFps: 30,
	});

	renderer.root.add(
		Box(
			{
				width: "100%",
				height: "100%",
				borderStyle: "rounded",
				title: "taskp",
				padding: 1,
				flexDirection: "column",
				justifyContent: "center",
				alignItems: "center",
			},
			Text({ content: "taskp TUI - Press Ctrl+C to exit", fg: "#888888" }),
		),
	);

	// renderer は exitOnCtrlC: true で Ctrl+C 時に自動 destroy するため、
	// プロセス終了まで待機する
	await new Promise(() => {});
}
