import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createConfigLoader } from "../../src/adapter/config-loader";
import { createSkillLoader } from "../../src/adapter/skill-loader";
import { type ReservedVars, renderTemplate } from "../../src/core/variable/template-renderer";

function createSkillFile(baseDir: string, name: string, content: string): void {
	const dir = join(baseDir, ".taskp", "skills", name);
	mkdirSync(dir, { recursive: true });
	writeFileSync(join(dir, "SKILL.md"), content);
}

function writeConfig(root: string, content: string): void {
	const dir = join(root, ".taskp");
	mkdirSync(dir, { recursive: true });
	writeFileSync(join(dir, "config.toml"), content);
}

describe("Adapter Integration", () => {
	let localRoot: string;
	let globalRoot: string;

	beforeEach(() => {
		localRoot = mkdtempSync(join(tmpdir(), "taskp-integ-local-"));
		globalRoot = mkdtempSync(join(tmpdir(), "taskp-integ-global-"));
	});

	afterEach(() => {
		rmSync(localRoot, { recursive: true, force: true });
		rmSync(globalRoot, { recursive: true, force: true });
	});

	describe("SkillLoader → Skill.parse → TemplateRenderer", () => {
		it("スキルを読み込みテンプレート変数を展開できる", async () => {
			const skillMd = [
				"---",
				"name: deploy",
				'description: "デプロイする"',
				"mode: template",
				"inputs:",
				"  - name: environment",
				"    type: select",
				'    message: "環境を選択"',
				"    choices: [staging, production]",
				"  - name: branch",
				"    type: text",
				'    message: "ブランチ名"',
				"    default: main",
				"---",
				"",
				"# Deploy to {{environment}}",
				"",
				"{{environment}} に {{branch}} をデプロイします。",
				"",
				"```bash",
				"git checkout {{branch}}",
				"npm run deploy:{{environment}}",
				"```",
			].join("\n");

			createSkillFile(localRoot, "deploy", skillMd);
			const loader = createSkillLoader({ localRoot, globalRoot });

			const result = await loader.findByName("deploy");
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			const skill = result.value;
			expect(skill.metadata.name).toBe("deploy");
			expect(skill.metadata.inputs).toHaveLength(2);
			expect(skill.scope).toBe("local");

			const reserved: ReservedVars = {
				cwd: "/project",
				skillDir: join(localRoot, ".taskp", "skills", "deploy"),
				date: "2026-03-19",
				timestamp: "1710000000",
			};

			const rendered = renderTemplate(
				skill.body.content,
				{ environment: "staging", branch: "main" },
				reserved,
			);

			expect(rendered.ok).toBe(true);
			if (!rendered.ok) return;
			expect(rendered.value).toContain("Deploy to staging");
			expect(rendered.value).toContain("staging に main をデプロイします。");
			expect(rendered.value).toContain("git checkout main");
			expect(rendered.value).toContain("npm run deploy:staging");
		});

		it("予約変数を含むテンプレートを展開できる", async () => {
			const skillMd = [
				"---",
				"name: info",
				'description: "情報表示"',
				"mode: template",
				"---",
				"",
				"# Info",
				"",
				"CWD: {{__cwd__}}",
				"Skill Dir: {{__skill_dir__}}",
				"Date: {{__date__}}",
			].join("\n");

			createSkillFile(globalRoot, "info", skillMd);
			const loader = createSkillLoader({ localRoot, globalRoot });

			const result = await loader.findByName("info");
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			const skillDir = join(globalRoot, ".taskp", "skills", "info");
			const reserved: ReservedVars = {
				cwd: "/my/project",
				skillDir,
				date: "2026-03-19",
				timestamp: "1710000000",
			};

			const rendered = renderTemplate(result.value.body.content, {}, reserved);

			expect(rendered.ok).toBe(true);
			if (!rendered.ok) return;
			expect(rendered.value).toContain("CWD: /my/project");
			expect(rendered.value).toContain(`Skill Dir: ${skillDir}`);
			expect(rendered.value).toContain("Date: 2026-03-19");
		});

		it("未定義変数がある場合エラーを返す", async () => {
			const skillMd = [
				"---",
				"name: broken",
				'description: "壊れたテンプレート"',
				"mode: template",
				"---",
				"",
				"# {{title}}",
				"",
				"{{undefined_var}} を使用",
			].join("\n");

			createSkillFile(localRoot, "broken", skillMd);
			const loader = createSkillLoader({ localRoot, globalRoot });

			const result = await loader.findByName("broken");
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			const reserved: ReservedVars = {
				cwd: "/project",
				skillDir: join(localRoot, ".taskp", "skills", "broken"),
				date: "2026-03-19",
				timestamp: "1710000000",
			};

			const rendered = renderTemplate(result.value.body.content, {}, reserved);

			expect(rendered.ok).toBe(false);
			if (rendered.ok) return;
			expect(rendered.error.type).toBe("RENDER_ERROR");
		});

		it("コードブロックを抽出できる", async () => {
			const skillMd = [
				"---",
				"name: multi-block",
				'description: "複数コードブロック"',
				"mode: template",
				"---",
				"",
				"# Commands",
				"",
				"```bash",
				"echo hello",
				"```",
				"",
				"```bash",
				"echo world",
				"```",
			].join("\n");

			createSkillFile(localRoot, "multi-block", skillMd);
			const loader = createSkillLoader({ localRoot, globalRoot });

			const result = await loader.findByName("multi-block");
			expect(result.ok).toBe(true);
			if (!result.ok) return;

			const blocks = result.value.body.extractCodeBlocks("bash");
			expect(blocks).toHaveLength(2);
			expect(blocks[0].code).toBe("echo hello");
			expect(blocks[1].code).toBe("echo world");
		});
	});

	describe("ConfigLoader ファイル I/O", () => {
		it("プロジェクト設定がグローバル設定のプロバイダを拡張する", async () => {
			writeConfig(
				globalRoot,
				[
					"[ai]",
					'default_provider = "anthropic"',
					"",
					"[ai.providers.anthropic]",
					'api_key_env = "ANTHROPIC_API_KEY"',
					'default_model = "claude-sonnet-4-20250514"',
				].join("\n"),
			);

			writeConfig(
				localRoot,
				[
					"[ai]",
					'default_provider = "ollama"',
					'default_model = "qwen2.5-coder:14b"',
					"",
					"[ai.providers.ollama]",
					'base_url = "http://localhost:11434/v1"',
				].join("\n"),
			);

			const loader = createConfigLoader({
				projectRoot: localRoot,
				globalRoot,
			});
			const result = await loader.load();

			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(result.value.ai?.default_provider).toBe("ollama");
			expect(result.value.ai?.default_model).toBe("qwen2.5-coder:14b");
			expect(result.value.ai?.providers?.anthropic?.api_key_env).toBe("ANTHROPIC_API_KEY");
			expect(result.value.ai?.providers?.ollama?.base_url).toBe("http://localhost:11434/v1");
		});

		it("同一プロバイダのフィールドがマージされる", async () => {
			writeConfig(
				globalRoot,
				[
					"[ai.providers.anthropic]",
					'api_key_env = "ANTHROPIC_API_KEY"',
					'default_model = "claude-sonnet-4-20250514"',
				].join("\n"),
			);

			writeConfig(
				localRoot,
				["[ai.providers.anthropic]", 'default_model = "claude-haiku-35"'].join("\n"),
			);

			const loader = createConfigLoader({
				projectRoot: localRoot,
				globalRoot,
			});
			const result = await loader.load();

			expect(result.ok).toBe(true);
			if (!result.ok) return;

			const anthropic = result.value.ai?.providers?.anthropic;
			expect(anthropic?.api_key_env).toBe("ANTHROPIC_API_KEY");
			expect(anthropic?.default_model).toBe("claude-haiku-35");
		});

		it("不正なスキーマの設定ファイルでエラーを返す", async () => {
			writeConfig(globalRoot, ["[ai]", "default_provider = 123"].join("\n"));

			const loader = createConfigLoader({
				projectRoot: localRoot,
				globalRoot,
			});
			const result = await loader.load();

			expect(result.ok).toBe(false);
			if (result.ok) return;
			expect(result.error.type).toBe("CONFIG_ERROR");
			expect(result.error.message).toContain("Invalid config");
		});
	});
});
