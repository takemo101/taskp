import { join } from "node:path";
import { execaCommand } from "execa";
import { describe, expect, it } from "vitest";

const VERIFY_SCRIPT = join(import.meta.dirname, "key-help-verify.ts");

describe("KeyHelp", () => {
	it("returns VNode for various binding inputs", async () => {
		const result = await execaCommand(`bun run ${VERIFY_SCRIPT}`, {
			reject: false,
		});

		expect(result.exitCode).toBe(0);
		expect(result.stdout).toContain("ALL CHECKS PASSED");
		expect(result.stdout).toContain("PASS: KeyHelp returned a VNode");
		expect(result.stdout).toContain("PASS: KeyHelp([]) returned a VNode for empty bindings");
		expect(result.stdout).toContain("PASS: KeyHelp with single binding returned a VNode");
	});
});
