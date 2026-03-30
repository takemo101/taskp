import { FormController } from "../../../../src/tui/screens/form/form-controller";
import type { FormElement } from "../../../../src/tui/screens/form/form-element";
import type { FormValidationError } from "../../../../src/tui/screens/form/form-validator";

function createMockElements(count: number): readonly FormElement[] {
	return Array.from({ length: count }, (_, i) => ({
		input: { name: `field-${i}`, message: `Field ${i}`, type: "text" as const },
		label: { content: "" },
		element: { focus: () => {} },
		errorLabel: { content: "" },
	})) as unknown as FormElement[];
}

// without validator: onComplete is called
{
	let completed = false;
	let completedValues: Record<string, string> = {};
	const controller = new FormController({
		onComplete: (result) => {
			completed = true;
			completedValues = result;
		},
	});

	const elements = createMockElements(2);
	controller.setElements(elements);

	controller.setValue("field-0", "a");
	controller.setValue("field-1", "b");
	controller.advanceFocus(); // field-0 → field-1
	controller.advanceFocus(); // field-1 → isAtLast → completeForm

	if (!completed) throw new Error("FAIL: onComplete should be called without validator");
	if (completedValues["field-0"] !== "a") throw new Error("FAIL: field-0 should be 'a'");
	if (completedValues["field-1"] !== "b") throw new Error("FAIL: field-1 should be 'b'");
	console.log("PASS: without validator, onComplete is called with correct values");
}

// with validator: validation failure blocks onComplete
{
	let completed = false;
	const validationErrors: FormValidationError[] = [];
	const controller = new FormController({
		onComplete: () => {
			completed = true;
		},
		validator: (values) => {
			if (!values["field-0"]) {
				return { name: "field-0", message: "field-0 is required" };
			}
			return undefined;
		},
		onValidationError: (error) => {
			validationErrors.push(error);
		},
	});

	const elements = createMockElements(2);
	controller.setElements(elements);

	// field-0 is not set, field-1 is set
	controller.setValue("field-1", "b");
	controller.advanceFocus(); // field-0 → field-1
	controller.advanceFocus(); // field-1 → isAtLast → completeForm → validator fails

	if (completed) throw new Error("FAIL: onComplete should NOT be called when validation fails");
	if (validationErrors.length !== 1) throw new Error("FAIL: should have 1 validation error");
	if (validationErrors[0].name !== "field-0") throw new Error("FAIL: error should be on field-0");
	if (validationErrors[0].message !== "field-0 is required")
		throw new Error("FAIL: error message mismatch");
	console.log("PASS: validation failure blocks onComplete and calls onValidationError");
}

// with validator: validation success calls onComplete
{
	let completed = false;
	const controller = new FormController({
		onComplete: () => {
			completed = true;
		},
		validator: () => undefined,
	});

	const elements = createMockElements(1);
	controller.setElements(elements);

	controller.setValue("field-0", "a");
	controller.advanceFocus(); // isAtLast → completeForm → validator passes

	if (!completed) throw new Error("FAIL: onComplete should be called when validation passes");
	console.log("PASS: validation success calls onComplete");
}

// with validator: focus moves to failing element
{
	let focusedElements: string[] = [];
	const mockElements = Array.from({ length: 3 }, (_, i) => ({
		input: { name: `field-${i}`, message: `Field ${i}`, type: "text" as const },
		label: { content: "" },
		element: {
			focus: () => {
				focusedElements.push(`field-${i}`);
			},
		},
		errorLabel: { content: "" },
	})) as unknown as FormElement[];

	const controller = new FormController({
		onComplete: () => {},
		validator: (values) => {
			if (!values["field-1"]) {
				return { name: "field-1", message: "required" };
			}
			return undefined;
		},
		onValidationError: () => {},
	});

	controller.setElements(mockElements);

	controller.setValue("field-0", "a");
	controller.setValue("field-2", "c");
	// field-1 is NOT set

	controller.advanceFocus(); // 0→1
	controller.advanceFocus(); // 1→2
	focusedElements = []; // reset tracking
	controller.advanceFocus(); // 2→isAtLast→completeForm→fails→focus to field-1

	if (!focusedElements.includes("field-1"))
		throw new Error("FAIL: focus should move to field-1 after validation failure");
	console.log("PASS: focus moves to failing element on validation error");
}

console.log("ALL CHECKS PASSED");
