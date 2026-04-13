import { describe, expect, it } from "vitest";
import { createDefaultContextCollectorDeps } from "../../src/adapter/context-collector-deps";

const EOF_SENSITIVE_COMMAND = "read ignored; echo stdin-closed";

describe("createDefaultContextCollectorDeps stdin handling", () => {
	it("lets EOF-sensitive context commands complete promptly", async () => {
		const deps = await createDefaultContextCollectorDeps();

		const result = await deps.executeCommand(EOF_SENSITIVE_COMMAND, "/tmp");

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value).toBe("stdin-closed");
	});
});
