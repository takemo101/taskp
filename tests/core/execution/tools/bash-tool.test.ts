import { describe, expect, it } from "vitest";
import { bashTool } from "../../../../src/core/execution/tools/bash-tool";

const EOF_SENSITIVE_COMMAND = "read ignored; echo stdin-closed";

describe("bashTool stdin handling", () => {
	it("lets EOF-sensitive commands complete promptly", async () => {
		expect(bashTool.execute).toBeDefined();
		if (!bashTool.execute) {
			throw new Error("bashTool.execute is undefined");
		}

		const result = await bashTool.execute(
			{ command: EOF_SENSITIVE_COMMAND, timeout: 500 },
			{} as never,
		);

		expect(Symbol.asyncIterator in result).toBe(false);
		if (Symbol.asyncIterator in result) {
			throw new Error("bashTool.execute returned a stream unexpectedly");
		}

		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.data.stdout).toBe("stdin-closed");
	});
});
