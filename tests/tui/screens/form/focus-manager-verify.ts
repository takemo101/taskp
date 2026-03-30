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

// setIndex
const fm3 = new FocusManager();
fm3.setElements(createMockElements(5));

fm3.setIndex(3);
if ((fm3.currentIndex as number) !== 3) throw new Error("FAIL: setIndex(3) should set index to 3");
console.log("PASS: setIndex sets correct index");

fm3.setIndex(0);
if ((fm3.currentIndex as number) !== 0) throw new Error("FAIL: setIndex(0) should set index to 0");
console.log("PASS: setIndex(0) sets to first");

fm3.setIndex(4);
if ((fm3.currentIndex as number) !== 4)
	throw new Error("FAIL: setIndex(4) should set index to last");
console.log("PASS: setIndex to last element");

fm3.setIndex(-1);
if ((fm3.currentIndex as number) !== 0) throw new Error("FAIL: setIndex(-1) should clamp to 0");
console.log("PASS: setIndex(-1) clamps to 0");

fm3.setIndex(100);
if ((fm3.currentIndex as number) !== 4) throw new Error("FAIL: setIndex(100) should clamp to last");
console.log("PASS: setIndex(100) clamps to last");

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
