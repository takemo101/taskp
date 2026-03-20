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
import type { SkillInput } from "../../core/skill/skill-input";
import { KeyHelp } from "../components/key-help";

const CONTAINER_ID = "form-container";

type FormElement = {
	readonly input: SkillInput;
	readonly element: InputRenderable | SelectRenderable;
};

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

		const values: Record<string, string> = {};
		const elements: FormElement[] = [];

		for (const input of inputs) {
			container.add(
				new TextRenderable(renderer, {
					id: `label-${input.name}`,
					content: input.message,
					fg: "#e2e8f0",
				}),
			);

			const element = createInputElement(renderer, input, (value) => {
				values[input.name] = value;
				advanceFocus();
			});

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
			elements[focusIndex].element.focus();
		}

		function advanceFocus(): void {
			if (focusIndex < elements.length - 1) {
				focusIndex++;
				focusCurrent();
			} else {
				completeForm();
			}
		}

		function completeForm(): void {
			const result: Record<string, string> = {};
			for (const { input } of elements) {
				if (input.name in values) {
					result[input.name] = values[input.name];
				} else if (input.default !== undefined) {
					result[input.name] = String(input.default);
				} else {
					result[input.name] = "";
				}
			}
			cleanup();
			resolve(result);
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
	onConfirm: (value: string) => void,
): InputRenderable | SelectRenderable {
	switch (input.type) {
		case "select":
			return createSelectElement(renderer, input, onConfirm);
		case "confirm":
			return createConfirmElement(renderer, input, onConfirm);
		case "text":
		case "number":
		case "password":
			return createTextInputElement(renderer, input, onConfirm);
	}
}

function createSelectElement(
	renderer: CliRenderer,
	input: SkillInput,
	onConfirm: (value: string) => void,
): SelectRenderable {
	const choices = input.choices as string[];
	const options: SelectOption[] = choices.map((c) => ({
		name: c,
		description: "",
		value: c,
	}));

	const select = new SelectRenderable(renderer, {
		id: `input-${input.name}`,
		width: "100%",
		height: Math.min(choices.length + 1, 8),
		options,
		backgroundColor: "#1a1a2e",
		focusedBackgroundColor: "#16213e",
		textColor: "#e2e8f0",
		selectedBackgroundColor: "#3b82f6",
		selectedTextColor: "#ffffff",
	});

	select.on(SelectRenderableEvents.ITEM_SELECTED, (_index: number, option: SelectOption) => {
		onConfirm(option.value);
	});

	return select;
}

function createConfirmElement(
	renderer: CliRenderer,
	input: SkillInput,
	onConfirm: (value: string) => void,
): SelectRenderable {
	const options: SelectOption[] = [
		{ name: "Yes", description: "", value: "true" },
		{ name: "No", description: "", value: "false" },
	];

	const select = new SelectRenderable(renderer, {
		id: `input-${input.name}`,
		width: "100%",
		height: 3,
		options,
		backgroundColor: "#1a1a2e",
		focusedBackgroundColor: "#16213e",
		textColor: "#e2e8f0",
		selectedBackgroundColor: "#3b82f6",
		selectedTextColor: "#ffffff",
	});

	select.on(SelectRenderableEvents.ITEM_SELECTED, (_index: number, option: SelectOption) => {
		onConfirm(option.value);
	});

	return select;
}

function createTextInputElement(
	renderer: CliRenderer,
	input: SkillInput,
	onConfirm: (value: string) => void,
): InputRenderable {
	const inputElement = new InputRenderable(renderer, {
		id: `input-${input.name}`,
		width: "100%",
		placeholder: input.default !== undefined ? String(input.default) : "",
		backgroundColor: "#1a1a2e",
		focusedBackgroundColor: "#16213e",
		textColor: "#e2e8f0",
		cursorColor: "#00FF00",
	});

	inputElement.on(InputRenderableEvents.ENTER, (val: string) => {
		const value = val !== "" ? val : input.default !== undefined ? String(input.default) : "";
		onConfirm(value);
	});

	return inputElement;
}

function clearScreen(renderer: CliRenderer): void {
	for (const child of renderer.root.getChildren()) {
		renderer.root.remove(child.id);
	}
}
