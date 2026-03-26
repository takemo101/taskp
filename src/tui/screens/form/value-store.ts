import type { FormElement } from "./form-element";

class ValueStore {
	private readonly values: Record<string, string> = {};

	set(name: string, value: string): void {
		this.values[name] = value;
	}

	has(name: string): boolean {
		return name in this.values;
	}

	collect(elements: readonly FormElement[]): Record<string, string> {
		const result: Record<string, string> = {};
		for (const { input } of elements) {
			if (this.has(input.name)) {
				result[input.name] = this.values[input.name];
			} else if (input.default !== undefined) {
				result[input.name] = String(input.default);
			} else {
				result[input.name] = "";
			}
		}
		return result;
	}
}

export { ValueStore };
