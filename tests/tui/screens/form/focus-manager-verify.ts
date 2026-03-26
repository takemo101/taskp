import { FocusManager } from "../../../../src/tui/screens/form/focus-manager";
import type { FormElement } from "../../../../src/tui/screens/form/form-element";

function createMockElements(count: number): readonly FormElement[] {
	return Array.from({ length: count }, (_, i) => ({
		input: { name: `field-${i}`, message: `Field ${i}`, type: "text" as const },
		label: { content: "" },
		element: { focus: () => {} },
	})) as unknown as FormElement[];
}

const fm = new FocusManager();
const elements = createMockElements(3);
fm.setElements(elements);

// Initial state
if ((fm.currentIndex as number) !== 0) throw new Error("FAIL: initial index should be 0");
console.log("PASS: initial index is 0");

if (fm.isAtLast()) throw new Error("FAIL: should not be at last initially");
console.log("PASS: not at last initially");

// moveNext
if (!fm.moveNext()) throw new Error("FAIL: moveNext should return true");
if ((fm.currentIndex as number) !== 1) throw new Error("FAIL: index should be 1 after moveNext");
console.log("PASS: moveNext works");

// moveNext to last
fm.moveNext();
if (!fm.isAtLast()) throw new Error("FAIL: should be at last");
console.log("PASS: isAtLast works");

// moveNext beyond last
if (fm.moveNext()) throw new Error("FAIL: moveNext at last should return false");
if ((fm.currentIndex as number) !== 2) throw new Error("FAIL: index should stay at 2");
console.log("PASS: moveNext at last returns false");

// movePrevious
if (!fm.movePrevious()) throw new Error("FAIL: movePrevious should return true");
if ((fm.currentIndex as number) !== 1)
	throw new Error("FAIL: index should be 1 after movePrevious");
console.log("PASS: movePrevious works");

// movePrevious to beginning
fm.movePrevious();
if (fm.movePrevious()) throw new Error("FAIL: movePrevious at 0 should return false");
if ((fm.currentIndex as number) !== 0) throw new Error("FAIL: index should stay at 0");
console.log("PASS: movePrevious at 0 returns false");

// elementCount
if (fm.elementCount !== 3) throw new Error("FAIL: elementCount should be 3");
console.log("PASS: elementCount works");

// focusCurrent calls focus
let focusCalled = false;
const elements2 = [
	{
		input: { name: "f", message: "F", type: "text" as const },
		label: { content: "" },
		element: {
			focus: () => {
				focusCalled = true;
			},
		},
	},
] as unknown as FormElement[];
const fm2 = new FocusManager();
fm2.setElements(elements2);
fm2.focusCurrent();
if (!focusCalled) throw new Error("FAIL: focusCurrent should call element.focus()");
console.log("PASS: focusCurrent calls focus");

console.log("ALL CHECKS PASSED");
