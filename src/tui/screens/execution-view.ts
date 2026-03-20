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
import { createAgentExecutor } from "../../adapter/agent-executor";
import { createCommandRunner } from "../../adapter/command-runner";
import { createContextCollector } from "../../adapter/context-collector";
import type { Skill } from "../../core/skill/skill";
import type { DomainError } from "../../core/types/errors";
import { ok } from "../../core/types/result";
import type { PromptCollector } from "../../usecase/port/prompt-collector";
import type { SkillRepository } from "../../usecase/port/skill-repository";
import { runAgentSkill } from "../../usecase/run-agent-skill";
import { runSkill } from "../../usecase/run-skill";
import { KeyHelp } from "../components/key-help";
import { SPINNER_FRAMES, SPINNER_INTERVAL_MS } from "../components/spinner";
import { ToolStatusDisplay } from "../components/tool-status";
import { createTuiStreamWriter, type ExecutionViewPort } from "../tui-stream-writer";

const CONTAINER_ID = "exec-container";

export async function showExecution(
	renderer: CliRenderer,
	skill: Skill,
	variables: Readonly<Record<string, string>>,
	model: LanguageModelV3 | null,
): Promise<"back" | "exit"> {
	return new Promise((resolve) => {
		clearScreen(renderer);

		const container = new BoxRenderable(renderer, {
			id: CONTAINER_ID,
			width: "100%",
			height: "100%",
			borderStyle: "rounded",
			title: `${skill.metadata.name} [Running]`,
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

		const markdown = new MarkdownRenderable(renderer, {
			id: "output-markdown",
			width: "100%",
			content: "",
			syntaxStyle: SyntaxStyle.create(),
			streaming: true,
		});

		scrollbox.add(markdown);
		container.add(scrollbox);

		const summaryText = new TextRenderable(renderer, {
			id: "summary",
			content: "",
		});
		container.add(summaryText);

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
		container.add(helpBox);

		renderer.root.add(container);
		container.focus();

		const viewPort: ExecutionViewPort = {
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
				container.title = `${skill.metadata.name} [Done]`;
				helpBox.visible = true;
			},
		};

		runExecution(skill, variables, model, viewPort).then(() => {
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

async function runExecution(
	skill: Skill,
	variables: Readonly<Record<string, string>>,
	model: LanguageModelV3 | null,
	viewPort: ExecutionViewPort,
): Promise<void> {
	if (skill.metadata.mode === "agent" && model === null) {
		viewPort.appendOutput("Error: LLM model not configured.\n");
		viewPort.appendOutput("Set default_provider and default_model in .taskp/config.toml\n");
		viewPort.showSummary(0, 0);
		return;
	}

	try {
		if (skill.metadata.mode === "agent" && model !== null) {
			await executeAgentMode(skill, variables, model, viewPort);
		} else {
			await executeTemplateMode(skill, variables, viewPort);
		}
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		viewPort.appendOutput(`\nError: ${message}\n`);
		viewPort.showSummary(0, 0);
	}
}

function buildSkillRepository(skill: Skill): SkillRepository {
	return {
		findByName: async () => ok(skill),
		listAll: async () => [],
		listLocal: async () => [],
		listGlobal: async () => [],
	};
}

function buildPromptCollector(variables: Readonly<Record<string, string>>): PromptCollector {
	return {
		collect: async () => ok(variables as Record<string, string>),
	};
}

async function executeAgentMode(
	skill: Skill,
	variables: Readonly<Record<string, string>>,
	model: LanguageModelV3,
	viewPort: ExecutionViewPort,
): Promise<void> {
	const writer = createTuiStreamWriter(viewPort);
	const agentExecutor = createAgentExecutor(writer);

	const contextCollector = createContextCollector({
		executeCommand: async (command, cwd) => {
			const { execaCommand } = await import("execa");
			const result = await execaCommand(command, { shell: true, cwd, reject: false });
			return ok(result.stdout);
		},
		fetchUrl: async (url) => {
			const response = await fetch(url);
			return ok(await response.text());
		},
		scanGlob: async (pattern, cwd) => {
			const { glob } = await import("node:fs/promises");
			const matches: string[] = [];
			for await (const entry of glob(pattern, { cwd })) {
				matches.push(entry);
			}
			return matches;
		},
	});

	const result = await runAgentSkill(
		{ name: skill.metadata.name, presets: variables, model },
		{
			skillRepository: buildSkillRepository(skill),
			promptCollector: buildPromptCollector(variables),
			contextCollector,
			agentExecutor,
		},
	);

	if (!result.ok) {
		viewPort.appendOutput(`\nError: ${formatDomainError(result.error)}\n`);
		viewPort.showSummary(0, 0);
	}
}

async function executeTemplateMode(
	skill: Skill,
	variables: Readonly<Record<string, string>>,
	viewPort: ExecutionViewPort,
): Promise<void> {
	const commandExecutor = createCommandRunner();

	const result = await runSkill(
		{ name: skill.metadata.name, presets: variables, dryRun: false, force: false },
		{
			skillRepository: buildSkillRepository(skill),
			promptCollector: buildPromptCollector(variables),
			commandExecutor,
		},
	);

	if (result.ok) {
		for (const cmd of result.value.commands) {
			viewPort.appendOutput(`\n$ ${cmd.command}\n`);
			if (cmd.result.stdout) {
				viewPort.appendOutput(cmd.result.stdout);
			}
			if (cmd.result.stderr) {
				viewPort.appendOutput(cmd.result.stderr);
			}
		}
		viewPort.showSummary(0, result.value.commands.length);
	} else {
		viewPort.appendOutput(`\nError: ${formatDomainError(result.error)}\n`);
		viewPort.showSummary(0, 0);
	}
}

function formatDomainError(error: DomainError): string {
	if (error.type === "SKILL_NOT_FOUND") {
		return `Skill "${error.name}" not found`;
	}
	return error.message;
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

function clearScreen(renderer: CliRenderer): void {
	for (const child of renderer.root.getChildren()) {
		renderer.root.remove(child.id);
	}
}
