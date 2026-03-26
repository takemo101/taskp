import type { FormElement } from "./form-element";

class FocusManager {
	private focusIndex = 0;
	private elements: readonly FormElement[] = [];

	setElements(elements: readonly FormElement[]): void {
		this.elements = elements;
	}

	get currentIndex(): number {
		return this.focusIndex;
	}

	get elementCount(): number {
		return this.elements.length;
	}

	isAtLast(): boolean {
		return this.focusIndex >= this.elements.length - 1;
	}

	moveNext(): boolean {
		if (this.isAtLast()) return false;
		this.focusIndex++;
		return true;
	}

	movePrevious(): boolean {
		if (this.focusIndex <= 0) return false;
		this.focusIndex--;
		return true;
	}

	focusCurrent(): void {
		this.elements[this.focusIndex].element.focus();
	}
}

export { FocusManager };
