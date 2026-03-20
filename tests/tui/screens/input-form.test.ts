import { join } from "node:path";
import { execaCommand } from "execa";
import { describe, expect, it } from "vitest";

const VERIFY_SCRIPT = join(import.meta.dirname, "input-form-verify.ts");

describe("showInputForm", () => {
	it("handles inputs=0 and exports correctly", async () => {
		const result = await execaCommand(`bun run ${VERIFY_SCRIPT}`, {
			reject: false,
		});

		expect(result.exitCode).toBe(0);
		expect(result.stdout).toContain("ALL CHECKS PASSED");
		expect(result.stdout).toContain("PASS: inputs=0 returns empty record");
		expect(result.stdout).toContain("PASS: showInputForm is a function");
		expect(result.stdout).toContain("PASS: input-form module imported successfully");
	});
});
