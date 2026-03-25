import { BoxRenderable, type CliRenderer, type KeyEvent, TextRenderable } from "@opentui/core";
import { KeyHelp } from "../components/key-help";
import { clearScreen } from "./clear-screen";

const CONTAINER_ID = "empty-state-container";

/**
 * スキルが0件の場合に案内画面を表示する。
 * ユーザーが Esc を押すと終了する。
 */
export async function showEmptyState(renderer: CliRenderer): Promise<void> {
	return new Promise((resolve) => {
		clearScreen(renderer);

		const container = new BoxRenderable(renderer, {
			id: CONTAINER_ID,
			width: "100%",
			height: "100%",
			borderStyle: "rounded",
			title: "taskp",
			padding: 1,
			flexDirection: "column",
			justifyContent: "flex-start",
		});

		const message = new TextRenderable(renderer, {
			id: "empty-message",
			content: "No skills found.",
			fg: "#FFFFFF",
			marginBottom: 1,
		});

		const hint1 = new TextRenderable(renderer, {
			id: "empty-hint-init",
			content: "taskp init <name>    Create a new skill",
			fg: "#888888",
			marginLeft: 2,
		});

		const hint2 = new TextRenderable(renderer, {
			id: "empty-hint-setup",
			content: "taskp setup          Set up project configuration",
			fg: "#888888",
			marginLeft: 2,
		});

		const help = KeyHelp([{ key: "Esc", description: "Quit" }]);

		container.add(message);
		container.add(hint1);
		container.add(hint2);
		container.add(help);
		renderer.root.add(container);

		const keyHandler = (key: KeyEvent) => {
			if (key.name === "escape") {
				cleanup();
				resolve();
			}
		};

		renderer.keyInput.on("keypress", keyHandler);

		function cleanup(): void {
			renderer.keyInput.off("keypress", keyHandler);
			renderer.root.remove(CONTAINER_ID);
		}
	});
}
