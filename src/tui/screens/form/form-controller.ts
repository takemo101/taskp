import { FocusManager } from "./focus-manager";
import type { FormElement } from "./form-element";
import { RenderStateManager } from "./render-state-manager";
import { ValueStore } from "./value-store";

class FormController {
	private readonly focusManager: FocusManager;
	private readonly valueStore: ValueStore;
	private readonly renderState: RenderStateManager;
	private elements: readonly FormElement[] = [];
	private readonly onComplete: (result: Record<string, string>) => void;

	constructor(onComplete: (result: Record<string, string>) => void) {
		this.onComplete = onComplete;
		this.focusManager = new FocusManager();
		this.valueStore = new ValueStore();
		this.renderState = new RenderStateManager(this.focusManager, this.valueStore);
	}

	setElements(elements: readonly FormElement[]): void {
		this.elements = elements;
		this.focusManager.setElements(elements);
	}

	advanceFocus(): void {
		if (this.focusManager.isAtLast()) {
			this.completeForm();
			return;
		}
		this.focusManager.moveNext();
		this.syncView();
	}

	moveFocusForward(): void {
		if (!this.focusManager.moveNext()) return;
		this.syncView();
	}

	retreatFocus(): void {
		if (!this.focusManager.movePrevious()) return;
		this.syncView();
	}

	setValue(name: string, value: string): void {
		this.valueStore.set(name, value);
		const el = this.elements.find((e) => e.input.name === name);
		if (el) {
			this.renderState.markCompleted(el);
		}
	}

	applyFocus(): void {
		this.syncView();
	}

	private syncView(): void {
		this.renderState.updateLabels(this.elements);
		this.focusManager.focusCurrent();
	}

	private completeForm(): void {
		this.onComplete(this.valueStore.collect(this.elements));
	}
}

export { FormController };
