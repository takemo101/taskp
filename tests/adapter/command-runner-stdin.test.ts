import { describe, expect, it } from "vitest";
import { createCommandRunner } from "../../src/adapter/command-runner";

const EOF_SENSITIVE_COMMAND = "read ignored; echo stdin-closed";

describe("CommandRunner stdin handling", () => {
	it("lets EOF-sensitive commands complete promptly", async () => {
		const runner = createCommandRunner();

		const result = await runner.execute(EOF_SENSITIVE_COMMAND, { timeout: 500 });

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.stdout).toBe("stdin-closed");
	});
});
