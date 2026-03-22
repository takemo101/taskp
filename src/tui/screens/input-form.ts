import {
	BoxRenderable,
	type CliRenderer,
	dim,
	green,
	InputRenderable,
	InputRenderableEvents,
	type KeyEvent,
	ScrollBoxRenderable,
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

class FormController {
	private focusIndex = 0;
	private readonly values: Record<string, string> = {};
	private elements: readonly FormElement[] = [];
	private readonly onComplete: (result: Record<string, string>) => void;

	constructor(onComplete: (result: Record<string, string>) => void) {
		this.onComplete = onComplete;
	}

	setElements(elements: readonly FormElement[]): void {
		this.elements = elements;
	}

	advanceFocus(): void {
		if (this.focusIndex < this.elements.length - 1) {
			this.focusIndex++;
			this.applyFocus();
		} else {
			this.completeForm();
		}
	}

	moveFocusForward(): void {
		if (this.focusIndex >= this.elements.length - 1) return;
		this.focusIndex++;
		this.applyFocus();
	}

	retreatFocus(): void {
		if (this.focusIndex <= 0) return;
		this.focusIndex--;
		delete this.values[this.elements[this.focusIndex].input.name];
		this.applyFocus();
	}

	setValue(name: string, value: string): void {
		this.values[name] = value;
		const el = this.elements.find((e) => e.input.name === name);
		if (el) {
			el.label.content = t`${green("✔")} ${el.input.message}`;
		}
	}

	applyFocus(): void {
		for (let i = 0; i < this.elements.length; i++) {
			const el = this.elements[i];
			if (el.input.name in this.values) continue;
			if (i === this.focusIndex) {
				el.label.content = t`${green("?")} ${el.input.message}`;
			} else {
				el.label.content = t`${dim("○")} ${el.input.message}`;
			}
		}
		this.elements[this.focusIndex].element.focus();
	}

	private completeForm(): void {
		const result: Record<string, string> = {};
		for (const { input } of this.elements) {
			if (input.name in this.values) {
				result[input.name] = this.values[input.name];
			} else if (input.default !== undefined) {
				result[input.name] = String(input.default);
			} else {
				result[input.name] = "";
			}
		}
		this.onComplete(result);
	}
}

function createFormElements(
	renderer: CliRenderer,
	inputs: readonly SkillInput[],
	controller: FormController,
): FormElement[] {
	return inputs.map((input) => {
		const label = new TextRenderable(renderer, {
			id: `label-${input.name}`,
			content: t`${dim("○")} ${input.message}`,
		});

		const element = createInputElement(renderer, input, (value) => {
			controller.setValue(input.name, value);
			controller.advanceFocus();
		});

		return { input, label, element };
	});
}

function buildFormUI(
	renderer: CliRenderer,
	skill: Skill,
	elements: readonly FormElement[],
): BoxRenderable {
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

	// 入力項目が多い場合にターミナル高さを超えても操作できるよう、
	// スクロール可能なコンテナに入力グループを配置する
	const scrollbox = new ScrollBoxRenderable(renderer, {
		id: "form-scrollbox",
		width: "100%",
		flexGrow: 1,
		stickyScroll: true,
		stickyStart: "top",
	});

	for (const { input, label, element } of elements) {
		const group = new BoxRenderable(renderer, {
			id: `group-${input.name}`,
			width: "100%",
			flexDirection: "column",
			marginBottom: 1,
		});
		group.add(label);
		group.add(element);
		scrollbox.add(group);
	}

	container.add(scrollbox);

	container.add(
		KeyHelp([
			{ key: "Tab", description: "Next" },
			{ key: "Shift+Tab", description: "Prev" },
			{ key: "Esc", description: "Back" },
		]),
	);

	return container;
}

function createKeyHandler(
	controller: FormController,
	onCancel: () => void,
): (key: KeyEvent) => void {
	return (key: KeyEvent) => {
		if (key.name === "escape") {
			onCancel();
			return;
		}
		if (key.name === "tab") {
			if (key.shift) {
				controller.retreatFocus();
			} else {
				controller.moveFocusForward();
			}
		}
	};
}

export async function showInputForm(
	renderer: CliRenderer,
	skill: Skill,
	inputsOverride?: readonly SkillInput[],
): Promise<Readonly<Record<string, string>> | null> {
	const inputs = inputsOverride ?? skill.metadata.inputs;
	if (inputs.length === 0) {
		return {};
	}

	return new Promise((resolve) => {
		clearScreen(renderer);

		const cleanup = () => {
			renderer.keyInput.off("keypress", keyHandler);
			renderer.root.remove(CONTAINER_ID);
		};

		const controller = new FormController((result) => {
			cleanup();
			resolve(result);
		});

		const elements = createFormElements(renderer, inputs, controller);
		controller.setElements(elements);

		const ui = buildFormUI(renderer, skill, elements);
		const keyHandler = createKeyHandler(controller, () => {
			cleanup();
			resolve(null);
		});

		renderer.root.add(ui);
		renderer.keyInput.on("keypress", keyHandler);

		controller.applyFocus();
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
