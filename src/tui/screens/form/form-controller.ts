import { FocusManager } from "./focus-manager";
import type { FormElement } from "./form-element";
import type { FormValidationError, FormValidator } from "./form-validator";
import { RenderStateManager } from "./render-state-manager";
import { ValueStore } from "./value-store";

type FormControllerOptions = {
	readonly onComplete: (result: Record<string, string>) => void;
	readonly validator?: FormValidator;
	readonly onValidationError?: (error: FormValidationError) => void;
};

class FormController {
	private readonly focusManager: FocusManager;
	private readonly valueStore: ValueStore;
	private readonly renderState: RenderStateManager;
	private elements: readonly FormElement[] = [];
	private readonly onComplete: (result: Record<string, string>) => void;
	private readonly validator: FormValidator | undefined;
	private readonly onValidationError: ((error: FormValidationError) => void) | undefined;

	constructor(options: FormControllerOptions) {
		this.onComplete = options.onComplete;
		this.validator = options.validator;
		this.onValidationError = options.onValidationError;
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
		const values = this.valueStore.collect(this.elements);

		if (this.validator) {
			const error = this.validator(values);
			if (error !== undefined) {
				this.onValidationError?.(error);
				const index = this.elements.findIndex((e) => e.input.name === error.name);
				if (index !== -1) {
					this.focusManager.setIndex(index);
					this.syncView();
				}
				return;
			}
		}

		this.onComplete(values);
	}
}

export { FormController };
