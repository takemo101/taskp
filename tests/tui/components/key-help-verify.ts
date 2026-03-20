import { type KeyBinding, KeyHelp } from "../../../src/tui/components/key-help";

const bindings: readonly KeyBinding[] = [
	{ key: "↑↓", description: "移動" },
	{ key: "Enter", description: "選択" },
	{ key: "Esc", description: "終了" },
];

const result = KeyHelp(bindings);

if (result === undefined || result === null) {
	console.error("FAIL: KeyHelp returned null/undefined");
	process.exit(1);
}

if (typeof result !== "object") {
	console.error(`FAIL: KeyHelp returned ${typeof result}, expected object (VNode)`);
	process.exit(1);
}

console.log("PASS: KeyHelp returned a VNode");
console.log(`PASS: VNode type = ${JSON.stringify(typeof result)}`);

const emptyResult = KeyHelp([]);
if (emptyResult === undefined || emptyResult === null) {
	console.error("FAIL: KeyHelp([]) returned null/undefined");
	process.exit(1);
}
console.log("PASS: KeyHelp([]) returned a VNode for empty bindings");

const singleResult = KeyHelp([{ key: "Enter", description: "確定" }]);
if (singleResult === undefined || singleResult === null) {
	console.error("FAIL: KeyHelp with single binding returned null/undefined");
	process.exit(1);
}
console.log("PASS: KeyHelp with single binding returned a VNode");

console.log("ALL CHECKS PASSED");
