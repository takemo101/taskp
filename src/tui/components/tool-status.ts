import { type CliRenderer, TextRenderable } from "@opentui/core";

const SPINNER_FRAMES = ["⣾", "⣽", "⣻", "⢿", "⡿", "⣟", "⣯", "⣷"];
const SPINNER_INTERVAL_MS = 80;

export class ToolStatusDisplay {
	private readonly text: TextRenderable;
	private spinnerIndex = 0;
	private spinnerInterval: ReturnType<typeof setInterval> | null = null;
	private currentTool = "";
	private currentSummary = "";

	constructor(renderer: CliRenderer, id: string) {
		this.text = new TextRenderable(renderer, {
			id,
			content: "",
			fg: "#888888",
		});
	}

	get renderable(): TextRenderable {
		return this.text;
	}

	show(toolName: string, args: Record<string, unknown>): void {
		this.currentTool = toolName;
		this.currentSummary = formatToolArgs(toolName, args);
		this.spinnerIndex = 0;
		this.updateContent();

		if (this.spinnerInterval !== null) {
			clearInterval(this.spinnerInterval);
		}

		this.spinnerInterval = setInterval(() => {
			this.spinnerIndex = (this.spinnerIndex + 1) % SPINNER_FRAMES.length;
			this.updateContent();
		}, SPINNER_INTERVAL_MS);
	}

	clear(): void {
		if (this.spinnerInterval !== null) {
			clearInterval(this.spinnerInterval);
			this.spinnerInterval = null;
		}
		this.text.content = "";
	}

	destroy(): void {
		this.clear();
	}

	private updateContent(): void {
		const frame = SPINNER_FRAMES[this.spinnerIndex];
		this.text.content = `${frame} [${this.currentTool}] ${this.currentSummary}`;
	}
}

const MAX_ARGS_LENGTH = 60;

function formatToolArgs(toolName: string, args: Record<string, unknown>): string {
	switch (toolName) {
		case "bash":
			return truncate(String(args.command), MAX_ARGS_LENGTH);
		case "read":
			return String(args.path);
		case "write":
			return String(args.path);
		case "glob":
			return String(args.pattern);
		case "ask_user":
			return truncate(String(args.question), MAX_ARGS_LENGTH);
		default:
			return truncate(JSON.stringify(args), MAX_ARGS_LENGTH);
	}
}

function truncate(text: string, maxLength: number): string {
	if (text.length <= maxLength) {
		return text;
	}
	return `${text.slice(0, maxLength)}...`;
}
