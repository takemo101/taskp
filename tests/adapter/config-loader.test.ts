import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createConfigLoader } from "../../src/adapter/config-loader";

function writeConfig(root: string, content: string): void {
	const dir = join(root, ".taskp");
	mkdirSync(dir, { recursive: true });
	writeFileSync(join(dir, "config.toml"), content);
}

describe("ConfigLoader", () => {
	let globalRoot: string;
	let projectRoot: string;

	beforeEach(() => {
		globalRoot = mkdtempSync(join(tmpdir(), "taskp-global-"));
		projectRoot = mkdtempSync(join(tmpdir(), "taskp-project-"));
	});

	afterEach(() => {
		rmSync(globalRoot, { recursive: true, force: true });
		rmSync(projectRoot, { recursive: true, force: true });
	});

	function createLoader() {
		return createConfigLoader({ projectRoot, globalRoot });
	}

	it("loads global config only", async () => {
		writeConfig(
			globalRoot,
			`
[ai]
default_provider = "anthropic"
default_model = "claude-sonnet-4-20250514"

[ai.providers.anthropic]
api_key_env = "ANTHROPIC_API_KEY"
`,
		);

		const result = await createLoader().load();

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.ai?.default_provider).toBe("anthropic");
		expect(result.value.ai?.default_model).toBe("claude-sonnet-4-20250514");
		expect(result.value.ai?.providers?.anthropic?.api_key_env).toBe("ANTHROPIC_API_KEY");
	});

	it("merges project config over global config", async () => {
		writeConfig(
			globalRoot,
			`
[ai]
default_provider = "anthropic"
default_model = "claude-sonnet-4-20250514"

[ai.providers.anthropic]
api_key_env = "ANTHROPIC_API_KEY"
`,
		);

		writeConfig(
			projectRoot,
			`
[ai]
default_provider = "ollama"
default_model = "qwen2.5-coder:14b"
`,
		);

		const result = await createLoader().load();

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.ai?.default_provider).toBe("ollama");
		expect(result.value.ai?.default_model).toBe("qwen2.5-coder:14b");
		expect(result.value.ai?.providers?.anthropic?.api_key_env).toBe("ANTHROPIC_API_KEY");
	});

	it("returns empty config when no config files exist", async () => {
		const result = await createLoader().load();

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value).toEqual({});
	});

	it("returns error for invalid TOML", async () => {
		writeConfig(globalRoot, "this is not valid [[[toml");

		const result = await createLoader().load();

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error.type).toBe("CONFIG_ERROR");
		expect(result.error.message).toContain("Failed to parse TOML");
	});

	it("merges providers from both configs", async () => {
		writeConfig(
			globalRoot,
			`
[ai.providers.anthropic]
api_key_env = "ANTHROPIC_API_KEY"
`,
		);

		writeConfig(
			projectRoot,
			`
[ai.providers.ollama]
base_url = "http://localhost:11434/v1"
default_model = "qwen2.5-coder:32b"
`,
		);

		const result = await createLoader().load();

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.ai?.providers?.anthropic?.api_key_env).toBe("ANTHROPIC_API_KEY");
		expect(result.value.ai?.providers?.ollama?.base_url).toBe("http://localhost:11434/v1");
		expect(result.value.ai?.providers?.ollama?.default_model).toBe("qwen2.5-coder:32b");
	});
});
