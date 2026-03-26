import { join } from "node:path";
import { execaCommand } from "execa";
import { describe, expect, it } from "vitest";

const VERIFY_SCRIPT = join(import.meta.dirname, "focus-manager-verify.ts");

describe("FocusManager", () => {
	it("manages focus navigation correctly", async () => {
		const result = await execaCommand(`bun run ${VERIFY_SCRIPT}`, {
			reject: false,
		});

		expect(result.exitCode).toBe(0);
		expect(result.stdout).toContain("ALL CHECKS PASSED");
	});
});
