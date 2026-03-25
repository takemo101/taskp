import type { LanguageModelV3 } from "@ai-sdk/provider";
import {
	BoxRenderable,
	type CliRenderer,
	type KeyEvent,
	MarkdownRenderable,
	ScrollBoxRenderable,
	SyntaxStyle,
	TextRenderable,
} from "@opentui/core";
import type { ModelSpec } from "../../adapter/ai-provider";
import type { Skill } from "../../core/skill/skill";
import { KeyHelp } from "../components/key-help";
import { SPINNER_FRAMES, SPINNER_INTERVAL_MS } from "../components/spinner";
import { ToolStatusDisplay } from "../components/tool-status";
import type { ExecutionViewPort } from "../tui-stream-writer";
import { clearScreen } from "./clear-screen";
import { type ExecutionDeps, runExecution } from "./execution-runner";

export type {
	ExecutionDeps,
	PromptCollectorFactory,
	SkillRepositoryFactory,
} from "./execution-runner";
export { createPresetPromptCollector, createSingleSkillRepository } from "./execution-runner";

const CONTAINER_ID = "exec-container";

export type ExecutionParams = {
	readonly skill: Skill;
	readonly variables: Readonly<Record<string, string>>;
	readonly model: LanguageModelV3 | null;
	readonly modelSpec: ModelSpec | null;
	readonly actionName?: string;
};

export async function showExecution(
	renderer: CliRenderer,
	params: ExecutionParams,
	deps: ExecutionDeps,
): Promise<"back" | "exit"> {
	const { skill, variables, model, modelSpec, actionName } = params;
	return new Promise((resolve) => {
		clearScreen(renderer);

		const modelLabel = modelSpec ? ` ─── ${modelSpec.provider}/${modelSpec.model}` : "";
		const skillLabel = actionName ? `${skill.metadata.name}:${actionName}` : skill.metadata.name;

		const container = new BoxRenderable(renderer, {
			id: CONTAINER_ID,
			width: "100%",
			height: "100%",
			borderStyle: "rounded",
			title: `${skillLabel} [Running]${modelLabel}`,
			padding: 1,
			flexDirection: "column",
			justifyContent: "flex-start",
		});

		const toolStatus = new ToolStatusDisplay(renderer, "tool-status");
		container.add(toolStatus.renderable);

		const scrollbox = new ScrollBoxRenderable(renderer, {
			id: "output-scroll",
			width: "100%",
			flexGrow: 1,
			stickyScroll: true,
			stickyStart: "bottom",
		});

		const contextInfo = new TextRenderable(renderer, {
			id: "context-info",
			width: "100%",
			content: "",
			fg: "#666666",
			visible: false,
		});

		const markdown = new MarkdownRenderable(renderer, {
			id: "output-markdown",
			width: "100%",
			content: "",
			syntaxStyle: SyntaxStyle.create(),
			streaming: true,
		});

		scrollbox.add(contextInfo);
		scrollbox.add(markdown);
		container.add(scrollbox);

		// サマリー＋ヘルプ用の固定領域を確保し、scrollbox と重ならないようにする
		const footer = new BoxRenderable(renderer, {
			id: "exec-footer",
			width: "100%",
			flexDirection: "column",
			flexShrink: 0,
		});

		const summaryText = new TextRenderable(renderer, {
			id: "summary",
			content: "",
		});
		footer.add(summaryText);

		const stopSpinner = startSpinner(summaryText);

		const helpBox = new BoxRenderable(renderer, {
			id: "exec-help",
			visible: false,
		});
		helpBox.add(
			KeyHelp([
				{ key: "Enter", description: "Back" },
				{ key: "Esc", description: "Quit" },
			]),
		);
		footer.add(helpBox);
		container.add(footer);

		renderer.root.add(container);
		container.focus();

		let contextBuffer = "";

		const viewPort: ExecutionViewPort = {
			appendContext(text: string) {
				contextInfo.visible = true;
				contextBuffer += text;
				contextInfo.content = contextBuffer;
			},
			appendOutput(text: string) {
				markdown.content += text;
			},
			showToolStatus(toolName: string, args: Record<string, unknown>) {
				toolStatus.show(toolName, args);
			},
			clearToolStatus() {
				toolStatus.clear();
			},
			showSummary(elapsedMs: number, steps: number) {
				stopSpinner();
				const seconds = (elapsedMs / 1000).toFixed(1);
				summaryText.content = `Done in ${seconds}s (${steps} steps)`;
				container.title = `${skillLabel} [Done]${modelLabel}`;
				helpBox.visible = true;
			},
		};

		runExecution(skill, variables, model, viewPort, deps, actionName).then(() => {
			const doneHandler = (key: KeyEvent) => {
				if (key.name === "return") {
					cleanup(doneHandler);
					resolve("back");
				}
				if (key.name === "escape") {
					cleanup(doneHandler);
					resolve("exit");
				}
			};
			renderer.keyInput.on("keypress", doneHandler);
		});

		function cleanup(handler: (key: KeyEvent) => void): void {
			renderer.keyInput.off("keypress", handler);
			stopSpinner();
			toolStatus.destroy();
			renderer.root.remove(CONTAINER_ID);
		}
	});
}

function startSpinner(text: TextRenderable): () => void {
	text.fg = "#888888";
	let index = 0;
	let interval: ReturnType<typeof setInterval> | null = setInterval(() => {
		const frame = SPINNER_FRAMES[index % SPINNER_FRAMES.length];
		text.content = `${frame} Generating...`;
		index++;
	}, SPINNER_INTERVAL_MS);

	return () => {
		if (interval === null) return;
		clearInterval(interval);
		interval = null;
		text.fg = "#FFFFFF";
		text.content = "";
	};
}
