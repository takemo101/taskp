import { join } from "node:path";
import { execaCommand } from "execa";
import { describe, expect, it } from "vitest";

const CLI_PATH = join(import.meta.dirname, "../../src/cli.ts");

describe("taskp tui command", () => {
	it("is registered and shown in help output", async () => {
		const result = await execaCommand(`bun run ${CLI_PATH} --help`, {
			reject: false,
		});

		expect(result.exitCode).toBe(0);
		expect(result.stdout).toContain("tui");
		expect(result.stdout).toContain("Launch interactive TUI");
	});
});
