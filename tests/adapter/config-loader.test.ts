import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	createConfigLoader,
	mergeAiConfig,
	mergeCliConfig,
	mergeHooksConfig,
	mergeOptional,
	mergeProviders,
} from "../../src/adapter/config-loader";

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

	describe("hooks", () => {
		it("parses config without hooks section", async () => {
			writeConfig(
				globalRoot,
				`
[ai]
default_provider = "anthropic"
`,
			);

			const result = await createLoader().load();

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value.hooks).toBeUndefined();
		});

		it("parses on_success only", async () => {
			writeConfig(
				globalRoot,
				`
[hooks]
on_success = ["echo done"]
`,
			);

			const result = await createLoader().load();

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value.hooks?.on_success).toEqual(["echo done"]);
			expect(result.value.hooks?.on_failure).toBeUndefined();
		});

		it("parses on_failure only", async () => {
			writeConfig(
				globalRoot,
				`
[hooks]
on_failure = ["notify-failure"]
`,
			);

			const result = await createLoader().load();

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value.hooks?.on_success).toBeUndefined();
			expect(result.value.hooks?.on_failure).toEqual(["notify-failure"]);
		});

		it("parses both on_success and on_failure", async () => {
			writeConfig(
				globalRoot,
				`
[hooks]
on_success = ["echo ok", "notify-success"]
on_failure = ["echo fail"]
`,
			);

			const result = await createLoader().load();

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value.hooks?.on_success).toEqual(["echo ok", "notify-success"]);
			expect(result.value.hooks?.on_failure).toEqual(["echo fail"]);
		});

		it("returns error for empty string in on_success", async () => {
			writeConfig(
				globalRoot,
				`
[hooks]
on_success = [""]
`,
			);

			const result = await createLoader().load();

			expect(result.ok).toBe(false);
			if (result.ok) return;
			expect(result.error.type).toBe("CONFIG_ERROR");
		});

		it("returns error for non-array on_success", async () => {
			writeConfig(
				globalRoot,
				`
[hooks]
on_success = "not-an-array"
`,
			);

			const result = await createLoader().load();

			expect(result.ok).toBe(false);
			if (result.ok) return;
			expect(result.error.type).toBe("CONFIG_ERROR");
		});

		it("merges hooks: project on_success overrides global, global on_failure preserved", async () => {
			writeConfig(
				globalRoot,
				`
[hooks]
on_success = ["global-success"]
on_failure = ["global-failure"]
`,
			);

			writeConfig(
				projectRoot,
				`
[hooks]
on_success = ["project-success"]
`,
			);

			const result = await createLoader().load();

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value.hooks?.on_success).toEqual(["project-success"]);
			expect(result.value.hooks?.on_failure).toEqual(["global-failure"]);
		});

		it("merges hooks: project overrides both", async () => {
			writeConfig(
				globalRoot,
				`
[hooks]
on_success = ["global-success"]
on_failure = ["global-failure"]
`,
			);

			writeConfig(
				projectRoot,
				`
[hooks]
on_success = ["project-success"]
on_failure = ["project-failure"]
`,
			);

			const result = await createLoader().load();

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value.hooks?.on_success).toEqual(["project-success"]);
			expect(result.value.hooks?.on_failure).toEqual(["project-failure"]);
		});

		it("merges hooks: global only when project has no hooks", async () => {
			writeConfig(
				globalRoot,
				`
[hooks]
on_success = ["global-success"]
on_failure = ["global-failure"]
`,
			);

			writeConfig(
				projectRoot,
				`
[ai]
default_provider = "ollama"
`,
			);

			const result = await createLoader().load();

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value.hooks?.on_success).toEqual(["global-success"]);
			expect(result.value.hooks?.on_failure).toEqual(["global-failure"]);
		});
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

	describe("[cli] section", () => {
		it("loads command_timeout_ms", async () => {
			writeConfig(
				projectRoot,
				`
[cli]
command_timeout_ms = 60000
`,
			);

			const result = await createLoader().load();

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value.cli?.command_timeout_ms).toBe(60000);
		});

		it("project cli config overrides global", async () => {
			writeConfig(
				globalRoot,
				`
[cli]
command_timeout_ms = 30000
`,
			);
			writeConfig(
				projectRoot,
				`
[cli]
command_timeout_ms = 120000
`,
			);

			const result = await createLoader().load();

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value.cli?.command_timeout_ms).toBe(120000);
		});

		it("falls back to global cli config when project has none", async () => {
			writeConfig(
				globalRoot,
				`
[cli]
command_timeout_ms = 45000
`,
			);

			const result = await createLoader().load();

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value.cli?.command_timeout_ms).toBe(45000);
		});

		it("rejects non-positive command_timeout_ms", async () => {
			writeConfig(
				projectRoot,
				`
[cli]
command_timeout_ms = -1
`,
			);

			const result = await createLoader().load();

			expect(result.ok).toBe(false);
		});

		it("loads max_agent_steps", async () => {
			writeConfig(
				projectRoot,
				`
[cli]
max_agent_steps = 100
`,
			);

			const result = await createLoader().load();

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value.cli?.max_agent_steps).toBe(100);
		});

		it("rejects max_agent_steps below 1", async () => {
			writeConfig(
				projectRoot,
				`
[cli]
max_agent_steps = 0
`,
			);

			const result = await createLoader().load();

			expect(result.ok).toBe(false);
		});

		it("rejects max_agent_steps above 200", async () => {
			writeConfig(
				projectRoot,
				`
[cli]
max_agent_steps = 201
`,
			);

			const result = await createLoader().load();

			expect(result.ok).toBe(false);
		});
	});
});

describe("mergeOptional", () => {
	const concat = (a: string, b: string) => a + b;

	it("returns undefined when both are undefined", () => {
		expect(mergeOptional(undefined, undefined, concat)).toBeUndefined();
	});

	it("returns project when global is undefined", () => {
		expect(mergeOptional(undefined, "project", concat)).toBe("project");
	});

	it("returns global when project is undefined", () => {
		expect(mergeOptional("global", undefined, concat)).toBe("global");
	});

	it("calls merge when both are defined", () => {
		expect(mergeOptional("global", "project", concat)).toBe("globalproject");
	});
});

describe("mergeProviders", () => {
	it("merges non-overlapping providers", () => {
		const global = { anthropic: { api_key_env: "KEY" } };
		const project = { ollama: { base_url: "http://localhost" } };

		const result = mergeProviders(global, project);

		expect(result).toEqual({
			anthropic: { api_key_env: "KEY" },
			ollama: { base_url: "http://localhost" },
		});
	});

	it("merges overlapping provider fields", () => {
		const global = { openai: { api_key_env: "KEY", default_model: "gpt-4" } };
		const project = { openai: { default_model: "gpt-5" } };

		const result = mergeProviders(global, project);

		expect(result).toEqual({
			openai: { api_key_env: "KEY", default_model: "gpt-5" },
		});
	});

	it("project provider replaces global when global has no entry", () => {
		const global = {};
		const project = { ollama: { base_url: "http://localhost" } };

		const result = mergeProviders(global, project);

		expect(result).toEqual({ ollama: { base_url: "http://localhost" } });
	});
});

describe("mergeAiConfig", () => {
	it("project fields override global fields", () => {
		const global = { default_provider: "anthropic" as const, default_model: "claude" };
		const project = { default_provider: "ollama" as const };

		const result = mergeAiConfig(global, project);

		expect(result.default_provider).toBe("ollama");
		expect(result.default_model).toBe("claude");
	});

	it("merges providers from both configs", () => {
		const global = { providers: { anthropic: { api_key_env: "KEY" } } };
		const project = { providers: { ollama: { base_url: "http://localhost" } } };

		const result = mergeAiConfig(global, project);

		expect(result.providers?.anthropic?.api_key_env).toBe("KEY");
		expect(result.providers?.ollama?.base_url).toBe("http://localhost");
	});
});

describe("mergeHooksConfig", () => {
	it("project on_success overrides global", () => {
		const global = { on_success: ["global"], on_failure: ["fail"] };
		const project = { on_success: ["project"] };

		const result = mergeHooksConfig(global, project);

		expect(result.on_success).toEqual(["project"]);
		expect(result.on_failure).toEqual(["fail"]);
	});
});

describe("mergeCliConfig", () => {
	it("project command_timeout_ms overrides global", () => {
		const result = mergeCliConfig({ command_timeout_ms: 30000 }, { command_timeout_ms: 60000 });

		expect(result.command_timeout_ms).toBe(60000);
	});

	it("falls back to global when project is undefined", () => {
		const result = mergeCliConfig({ command_timeout_ms: 30000 }, {});

		expect(result.command_timeout_ms).toBe(30000);
	});

	it("project max_agent_steps overrides global", () => {
		const result = mergeCliConfig(
			{ command_timeout_ms: 30000, max_agent_steps: 50 },
			{ max_agent_steps: 100 },
		);

		expect(result.command_timeout_ms).toBe(30000);
		expect(result.max_agent_steps).toBe(100);
	});

	it("falls back to global max_agent_steps when project is undefined", () => {
		const result = mergeCliConfig({ max_agent_steps: 50 }, {});

		expect(result.max_agent_steps).toBe(50);
	});
});
