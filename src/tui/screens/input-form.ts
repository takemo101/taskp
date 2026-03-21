import {
	BoxRenderable,
	type CliRenderer,
	dim,
	green,
	InputRenderable,
	InputRenderableEvents,
	type KeyEvent,
	type SelectOption,
	SelectRenderable,
	SelectRenderableEvents,
	TextareaRenderable,
	TextRenderable,
	t,
} from "@opentui/core";
import type { Skill } from "../../core/skill/skill";
import type { SkillInput } from "../../core/skill/skill-input";
import { KeyHelp } from "../components/key-help";
import { flatSelectStyle } from "../components/styles";

const CONTAINER_ID = "form-container";
const TEXTAREA_DEFAULT_HEIGHT = 5;

type FormElement = {
	readonly input: SkillInput;
	readonly label: TextRenderable;
	readonly element: InputRenderable | SelectRenderable | TextareaRenderable;
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
			justifyContent: "flex-start",
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
			const group = new BoxRenderable(renderer, {
				id: `group-${input.name}`,
				width: "100%",
				flexDirection: "column",
				marginBottom: 1,
			});

			const label = new TextRenderable(renderer, {
				id: `label-${input.name}`,
				content: t`${dim("○")} ${input.message}`,
			});
			group.add(label);

			const element = createInputElement(renderer, input, (value) => {
				values[input.name] = value;
				label.content = t`${green("✔")} ${input.message}`;
				advanceFocus();
			});

			group.add(element);
			container.add(group);
			elements.push({ input, label, element });
		}

		container.add(
			KeyHelp([
				{ key: "Tab", description: "Next" },
				{ key: "Shift+Tab", description: "Prev" },
				{ key: "Esc", description: "Back" },
			]),
		);

		renderer.root.add(container);

		let focusIndex = 0;

		function focusCurrent(): void {
			for (let i = 0; i < elements.length; i++) {
				const el = elements[i];
				if (el.input.name in values) continue; // 回答済み（✔）はそのまま
				if (i === focusIndex) {
					el.label.content = t`${green("?")} ${el.input.message}`;
				} else {
					el.label.content = t`${dim("○")} ${el.input.message}`;
				}
			}
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
					const prevIndex = focusIndex - 1;
					if (prevIndex < 0) return; // 先頭では何もしない
					focusIndex = prevIndex;
					// 戻った先が回答済みなら回答を取り消して再入力可能にする
					delete (values as Record<string, string>)[elements[focusIndex].input.name];
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
): InputRenderable | SelectRenderable | TextareaRenderable {
	switch (input.type) {
		case "select":
			return createSelectElement(renderer, input, onConfirm);
		case "confirm":
			return createConfirmElement(renderer, input, onConfirm);
		case "textarea":
			return createTextareaElement(renderer, input, onConfirm);
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
		height: choices.length,
		marginLeft: 2,
		options,
		showDescription: false,
		...flatSelectStyle,
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
		height: 2,
		marginLeft: 2,
		options,
		showDescription: false,
		...flatSelectStyle,
	});

	select.on(SelectRenderableEvents.ITEM_SELECTED, (_index: number, option: SelectOption) => {
		onConfirm(option.value);
	});

	return select;
}

function createTextareaElement(
	renderer: CliRenderer,
	input: SkillInput,
	onConfirm: (value: string) => void,
): TextareaRenderable {
	const textarea = new TextareaRenderable(renderer, {
		id: `input-${input.name}`,
		width: "100%",
		height: TEXTAREA_DEFAULT_HEIGHT,
		marginLeft: 2,
		wrapMode: "word",
	});

	if (input.default !== undefined) {
		textarea.initialValue = String(input.default);
	}

	// Meta+Enter（macOS: Cmd+Enter, Linux/Windows: Alt+Enter）で確定
	textarea.onSubmit = () => {
		// getTextRange で全テキストを取得（endOffset に十分大きい値を渡す）
		const text = textarea.getTextRange(0, Number.MAX_SAFE_INTEGER);
		onConfirm(text);
	};

	return textarea;
}

function createTextInputElement(
	renderer: CliRenderer,
	input: SkillInput,
	onConfirm: (value: string) => void,
): InputRenderable {
	const inputElement = new InputRenderable(renderer, {
		id: `input-${input.name}`,
		width: "100%",
		marginLeft: 2,
		placeholder: input.default !== undefined ? String(input.default) : "",
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
