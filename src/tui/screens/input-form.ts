import {
	BoxRenderable,
	type CliRenderer,
	InputRenderable,
	InputRenderableEvents,
	type KeyEvent,
	type SelectOption,
	SelectRenderable,
	SelectRenderableEvents,
	TextRenderable,
} from "@opentui/core";
import type { Skill } from "../../core/skill/skill";
import type { SkillInput } from "../../core/skill/skill-metadata";
import { KeyHelp } from "../components/key-help";

const CONTAINER_ID = "form-container";

type InputElement = InputRenderable | SelectRenderable;

export async function showInputForm(
	renderer: CliRenderer,
	skill: Skill,
): Promise<Readonly<Record<string, string>> | null> {
	const inputs = skill.metadata.inputs;

	if (inputs.length === 0) {
		return {};
	}

	return new Promise((resolve) => {
		clearScreen(renderer);

		const container = new BoxRenderable(renderer, {
			id: CONTAINER_ID,
			width: "100%",
			height: "100%",
			borderStyle: "rounded",
			title: skill.metadata.name,
			padding: 1,
			flexDirection: "column",
		});

		container.add(
			new TextRenderable(renderer, {
				id: "form-description",
				content: skill.metadata.description,
				fg: "#888888",
			}),
		);

		const elements: { input: SkillInput; element: InputElement }[] = [];
		const values: Record<string, string> = {};

		for (const input of inputs) {
			container.add(
				new TextRenderable(renderer, {
					id: `label-${input.name}`,
					content: input.message,
					fg: "#e2e8f0",
				}),
			);

			const element = createInputElement(renderer, input, values, focusNext);
			container.add(element);
			elements.push({ input, element });
		}

		container.add(
			KeyHelp([
				{ key: "Tab", description: "次へ" },
				{ key: "Shift+Tab", description: "前へ" },
				{ key: "Esc", description: "戻る" },
			]),
		);

		renderer.root.add(container);

		let focusIndex = 0;

		function focusCurrent(): void {
			elements[focusIndex]?.element.focus();
		}

		function focusNext(): void {
			if (focusIndex < elements.length - 1) {
				focusIndex++;
				focusCurrent();
			} else {
				fillDefaults(elements, values);
				cleanup();
				resolve(values);
			}
		}

		const keyHandler = (key: KeyEvent) => {
			if (key.name === "escape") {
				cleanup();
				resolve(null);
				return;
			}

			if (key.name === "tab") {
				if (key.shift) {
					focusIndex = Math.max(0, focusIndex - 1);
				} else {
					focusIndex = Math.min(elements.length - 1, focusIndex + 1);
				}
				focusCurrent();
			}
		};

		renderer.keyInput.on("keypress", keyHandler);

		function cleanup(): void {
			renderer.keyInput.off("keypress", keyHandler);
			renderer.root.remove(CONTAINER_ID);
		}

		focusCurrent();
	});
}

function createInputElement(
	renderer: CliRenderer,
	input: SkillInput,
	values: Record<string, string>,
	focusNext: () => void,
): InputElement {
	if (input.type === "select" && input.choices) {
		return createSelectElement(renderer, input, values, focusNext);
	}

	if (input.type === "confirm") {
		return createConfirmElement(renderer, input, values, focusNext);
	}

	return createTextElement(renderer, input, values, focusNext);
}

function createSelectElement(
	renderer: CliRenderer,
	input: SkillInput,
	values: Record<string, string>,
	focusNext: () => void,
): SelectRenderable {
	const options: SelectOption[] = (input.choices ?? []).map((c) => ({
		name: c,
		description: "",
		value: c,
	}));

	const sel = new SelectRenderable(renderer, {
		id: `input-${input.name}`,
		width: "100%",
		height: Math.min((input.choices ?? []).length + 1, 8),
		options,
		backgroundColor: "#1a1a2e",
		focusedBackgroundColor: "#16213e",
		textColor: "#e2e8f0",
		selectedBackgroundColor: "#3b82f6",
		selectedTextColor: "#ffffff",
	});

	sel.on(SelectRenderableEvents.ITEM_SELECTED, (_i: number, opt: SelectOption) => {
		values[input.name] = opt.value;
		focusNext();
	});

	return sel;
}

function createConfirmElement(
	renderer: CliRenderer,
	input: SkillInput,
	values: Record<string, string>,
	focusNext: () => void,
): SelectRenderable {
	const sel = new SelectRenderable(renderer, {
		id: `input-${input.name}`,
		width: "100%",
		height: 3,
		options: [
			{ name: "Yes", description: "", value: "true" },
			{ name: "No", description: "", value: "false" },
		],
		backgroundColor: "#1a1a2e",
		focusedBackgroundColor: "#16213e",
		textColor: "#e2e8f0",
		selectedBackgroundColor: "#3b82f6",
		selectedTextColor: "#ffffff",
	});

	sel.on(SelectRenderableEvents.ITEM_SELECTED, (_i: number, opt: SelectOption) => {
		values[input.name] = opt.value;
		focusNext();
	});

	return sel;
}

function createTextElement(
	renderer: CliRenderer,
	input: SkillInput,
	values: Record<string, string>,
	focusNext: () => void,
): InputRenderable {
	const inp = new InputRenderable(renderer, {
		id: `input-${input.name}`,
		width: "100%",
		placeholder: input.default !== undefined ? String(input.default) : "",
		backgroundColor: "#1a1a2e",
		focusedBackgroundColor: "#16213e",
		textColor: "#e2e8f0",
		cursorColor: "#00FF00",
	});

	inp.on(InputRenderableEvents.ENTER, (val: string) => {
		values[input.name] = val !== "" ? val : String(input.default ?? "");
		focusNext();
	});

	return inp;
}

function fillDefaults(
	elements: readonly { input: SkillInput; element: InputElement }[],
	values: Record<string, string>,
): void {
	for (const { input } of elements) {
		if (!(input.name in values)) {
			values[input.name] = input.default !== undefined ? String(input.default) : "";
		}
	}
}

function clearScreen(renderer: CliRenderer): void {
	for (const child of renderer.root.getChildren()) {
		renderer.root.remove(child.id);
	}
}
