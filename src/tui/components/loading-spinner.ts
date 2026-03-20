import { type CliRenderer, TextRenderable } from "@opentui/core";
import { SPINNER_FRAMES, SPINNER_INTERVAL_MS } from "./spinner";

export type LoadingSpinner = {
	readonly renderable: TextRenderable;
	readonly stop: () => void;
};

export function createLoadingSpinner(renderer: CliRenderer): LoadingSpinner {
	const text = new TextRenderable(renderer, {
		id: "loading-spinner",
		content: "",
		fg: "#888888",
	});

	let index = 0;
	let interval: ReturnType<typeof setInterval> | null = setInterval(() => {
		const frame = SPINNER_FRAMES[index % SPINNER_FRAMES.length];
		text.content = `${frame} Generating...`;
		index++;
	}, SPINNER_INTERVAL_MS);

	return {
		renderable: text,
		stop() {
			if (interval === null) return;
			clearInterval(interval);
			interval = null;
			text.content = "";
		},
	};
}
