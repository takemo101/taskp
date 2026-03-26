import type { FormElement } from "../../../../src/tui/screens/form/form-element";
import { ValueStore } from "../../../../src/tui/screens/form/value-store";

const store = new ValueStore();

// has returns false for unset
if (store.has("foo")) throw new Error("FAIL: has should return false for unset key");
console.log("PASS: has returns false for unset key");

// set and has
store.set("foo", "bar");
if (!store.has("foo")) throw new Error("FAIL: has should return true after set");
console.log("PASS: set and has work");

// collect with set values
const elements = [
	{ input: { name: "foo", message: "Foo", type: "text" as const } },
	{ input: { name: "baz", message: "Baz", type: "text" as const, default: "default-val" } },
	{ input: { name: "empty", message: "Empty", type: "text" as const } },
] as unknown as FormElement[];

const result = store.collect(elements);

if (result.foo !== "bar") throw new Error(`FAIL: foo should be 'bar', got '${result.foo}'`);
console.log("PASS: collect returns set value");

if (result.baz !== "default-val")
	throw new Error(`FAIL: baz should be 'default-val', got '${result.baz}'`);
console.log("PASS: collect falls back to default");

if (result.empty !== "") throw new Error(`FAIL: empty should be '', got '${result.empty}'`);
console.log("PASS: collect returns empty string for no default");

console.log("ALL CHECKS PASSED");
