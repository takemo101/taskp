import { dim, green, t } from "@opentui/core";
import type { FocusManager } from "./focus-manager";
import type { FormElement } from "./form-element";
import type { ValueStore } from "./value-store";

class RenderStateManager {
	private readonly focusManager: FocusManager;
	private readonly valueStore: ValueStore;

	constructor(focusManager: FocusManager, valueStore: ValueStore) {
		this.focusManager = focusManager;
		this.valueStore = valueStore;
	}

	updateLabels(elements: readonly FormElement[]): void {
		for (let i = 0; i < elements.length; i++) {
			const el = elements[i];
			if (i === this.focusManager.currentIndex) {
				el.label.content = t`${green("?")} ${el.input.message}`;
			} else if (this.valueStore.has(el.input.name)) {
				// 値が設定済みのラベルはそのまま維持
			} else {
				el.label.content = t`${dim("○")} ${el.input.message}`;
			}
		}
	}

	markCompleted(element: FormElement): void {
		element.label.content = t`${green("✔")} ${element.input.message}`;
	}
}

export { RenderStateManager };
