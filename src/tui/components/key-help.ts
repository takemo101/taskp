import { Box, Text, type VNode } from "@opentui/core";

export type KeyBinding = {
	readonly key: string;
	readonly description: string;
};

export function KeyHelp(bindings: readonly KeyBinding[]): VNode {
	const parts = bindings.map((b) =>
		Box(
			{ flexDirection: "row", gap: 1 },
			Text({ content: b.key, fg: "#FFFF00" }),
			Text({ content: b.description, fg: "#888888" }),
		),
	);

	return Box(
		{
			flexDirection: "row",
			gap: 2,
			paddingTop: 1,
		},
		...parts,
	);
}
