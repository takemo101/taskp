import { type CliRenderer, TextRenderable } from "@opentui/core";
import { SPINNER_FRAMES, SPINNER_INTERVAL_MS } from "./spinner";
import { formatToolArgs } from "./tool-args-formatter";

type ToolState = {
	readonly tool: string;
	readonly summary: string;
};

export class ToolStatusDisplay {
	private readonly text: TextRenderable;
	private spinnerIndex = 0;
	private spinnerInterval: ReturnType<typeof setInterval> | null = null;
	private current: ToolState | null = null;

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
		this.current = {
			tool: toolName,
			summary: formatToolArgs(toolName, args),
		};
		this.spinnerIndex = 0;
		this.updateContent();

		if (this.spinnerInterval) clearInterval(this.spinnerInterval);
		this.spinnerInterval = setInterval(() => {
			this.spinnerIndex = (this.spinnerIndex + 1) % SPINNER_FRAMES.length;
			this.updateContent();
		}, SPINNER_INTERVAL_MS);
	}

	clear(): void {
		if (this.spinnerInterval) {
			clearInterval(this.spinnerInterval);
			this.spinnerInterval = null;
		}
		this.current = null;
		this.text.content = "";
	}

	destroy(): void {
		this.clear();
	}

	private updateContent(): void {
		if (!this.current) return;
		const frame = SPINNER_FRAMES[this.spinnerIndex % SPINNER_FRAMES.length];
		if (frame === undefined) return;
		this.text.content = `${frame} [${this.current.tool}] ${this.current.summary}`;
	}
}
