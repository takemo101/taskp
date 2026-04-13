import { chmodSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSkillLoader } from "../../src/adapter/skill-loader";

function createSkillFile(baseDir: string, name: string, content: string): void {
	const dir = join(baseDir, ".taskp", "skills", name);
	mkdirSync(dir, { recursive: true });
	writeFileSync(join(dir, "SKILL.md"), content);
}

function makeSkillMd(name: string, description: string): string {
	return [
		"---",
		`name: ${name}`,
		`description: "${description}"`,
		"mode: template",
		"---",
		"",
		`# ${name}`,
	].join("\n");
}

describe("SkillLoader", () => {
	let localRoot: string;
	let globalRoot: string;
	const extraCleanup: string[] = [];

	beforeEach(() => {
		localRoot = mkdtempSync(join(tmpdir(), "taskp-local-"));
		globalRoot = mkdtempSync(join(tmpdir(), "taskp-global-"));
	});

	afterEach(() => {
		rmSync(localRoot, { recursive: true, force: true });
		rmSync(globalRoot, { recursive: true, force: true });
		for (const path of extraCleanup) {
			rmSync(path, { recursive: true, force: true });
		}
		extraCleanup.length = 0;
	});

	describe("findByName", () => {
		it("ローカルスキルを読み込める", async () => {
			createSkillFile(localRoot, "deploy", makeSkillMd("deploy", "デプロイする"));
			const loader = createSkillLoader({ localRoot, globalRoot });

			const result = await loader.findByName("deploy");

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value.metadata.name).toBe("deploy");
			expect(result.value.scope).toBe("local");
		});

		it("グローバルスキルを読み込める", async () => {
			createSkillFile(globalRoot, "lint", makeSkillMd("lint", "リントする"));
			const loader = createSkillLoader({ localRoot, globalRoot });

			const result = await loader.findByName("lint");

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value.metadata.name).toBe("lint");
			expect(result.value.scope).toBe("global");
		});

		it("ローカルがグローバルより優先される", async () => {
			createSkillFile(localRoot, "deploy", makeSkillMd("deploy", "ローカル版"));
			createSkillFile(globalRoot, "deploy", makeSkillMd("deploy", "グローバル版"));
			const loader = createSkillLoader({ localRoot, globalRoot });

			const result = await loader.findByName("deploy");

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value.metadata.description).toBe("ローカル版");
			expect(result.value.scope).toBe("local");
		});

		it("存在しないスキルでエラーを返す", async () => {
			const loader = createSkillLoader({ localRoot, globalRoot });

			const result = await loader.findByName("nonexistent");

			expect(result.ok).toBe(false);
			if (result.ok) return;
			expect(result.error.type).toBe("SKILL_NOT_FOUND");
			expect(result.error.name).toBe("nonexistent");
		});

		it("複数の親ディレクトリに同名スキルがある場合は最も近いものを優先する", async () => {
			globalRoot = mkdtempSync(join(tmpdir(), "taskp-home-"));
			localRoot = join(globalRoot, "workspace", "packages", "frontend", "src");
			mkdirSync(localRoot, { recursive: true });

			createSkillFile(
				join(globalRoot, "workspace"),
				"deploy",
				makeSkillMd("deploy", "ワークスペース版"),
			);
			createSkillFile(
				join(globalRoot, "workspace", "packages", "frontend"),
				"deploy",
				makeSkillMd("deploy", "フロントエンド版"),
			);
			createSkillFile(globalRoot, "deploy", makeSkillMd("deploy", "グローバル版"));

			const loader = createSkillLoader({ localRoot, globalRoot });
			const result = await loader.findByName("deploy");

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value.metadata.description).toBe("フロントエンド版");
			expect(result.value.scope).toBe("parent");
		});

		it("プロジェクト側で見つからない場合は最後にグローバルへフォールバックする", async () => {
			globalRoot = mkdtempSync(join(tmpdir(), "taskp-home-"));
			localRoot = join(globalRoot, "workspace", "packages", "frontend", "src");
			mkdirSync(localRoot, { recursive: true });

			createSkillFile(globalRoot, "lint", makeSkillMd("lint", "グローバル版"));

			const loader = createSkillLoader({ localRoot, globalRoot });
			const result = await loader.findByName("lint");

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value.metadata.description).toBe("グローバル版");
			expect(result.value.scope).toBe("global");
		});
	});

	describe("listAll", () => {
		it("ローカルとグローバルの両方をリストする", async () => {
			createSkillFile(localRoot, "deploy", makeSkillMd("deploy", "デプロイ"));
			createSkillFile(globalRoot, "lint", makeSkillMd("lint", "リント"));
			const loader = createSkillLoader({ localRoot, globalRoot });

			const { skills } = await loader.listAll();

			expect(skills).toHaveLength(2);
			const names = skills.map((s) => s.metadata.name);
			expect(names).toContain("deploy");
			expect(names).toContain("lint");
		});

		it("同名スキルはローカルが優先される", async () => {
			createSkillFile(localRoot, "deploy", makeSkillMd("deploy", "ローカル版"));
			createSkillFile(globalRoot, "deploy", makeSkillMd("deploy", "グローバル版"));
			const loader = createSkillLoader({ localRoot, globalRoot });

			const { skills } = await loader.listAll();

			expect(skills).toHaveLength(1);
			expect(skills[0].metadata.description).toBe("ローカル版");
		});

		it("local と global が同じ SKILL.md を指す場合は discovery 順の先頭だけを残す", async () => {
			createSkillFile(globalRoot, "shared-skill", makeSkillMd("shared-skill", "共有スキル"));

			const localSkillsDir = join(localRoot, ".taskp", "skills");
			mkdirSync(localSkillsDir, { recursive: true });
			symlinkSync(
				join(globalRoot, ".taskp", "skills", "shared-skill"),
				join(localSkillsDir, "shared-skill"),
			);

			const loader = createSkillLoader({ localRoot, globalRoot });
			const { skills } = await loader.listAll();

			expect(skills).toHaveLength(1);
			expect(skills[0].metadata.name).toBe("shared-skill");
			expect(skills[0].scope).toBe("local");
		});

		it("スキルディレクトリが存在しない場合は空配列を返す", async () => {
			const loader = createSkillLoader({ localRoot, globalRoot });

			const { skills, failures } = await loader.listAll();

			expect(skills).toEqual([]);
			expect(failures).toEqual([]);
		});

		it("親ディレクトリをまたいだ同名スキルは最初に見つかったものだけを残す", async () => {
			globalRoot = mkdtempSync(join(tmpdir(), "taskp-home-"));
			localRoot = join(globalRoot, "workspace", "packages", "frontend", "src");
			mkdirSync(localRoot, { recursive: true });

			createSkillFile(
				join(globalRoot, "workspace"),
				"deploy",
				makeSkillMd("deploy", "ワークスペース版"),
			);
			createSkillFile(
				join(globalRoot, "workspace", "packages", "frontend"),
				"deploy",
				makeSkillMd("deploy", "フロントエンド版"),
			);
			createSkillFile(
				join(globalRoot, "workspace"),
				"review",
				makeSkillMd("review", "親ディレクトリ固有"),
			);
			createSkillFile(globalRoot, "deploy", makeSkillMd("deploy", "グローバル版"));
			createSkillFile(globalRoot, "lint", makeSkillMd("lint", "グローバル固有"));

			const loader = createSkillLoader({ localRoot, globalRoot });
			const { skills } = await loader.listAll();

			expect(skills.map((skill) => [skill.metadata.name, skill.metadata.description])).toEqual([
				["deploy", "フロントエンド版"],
				["review", "親ディレクトリ固有"],
				["lint", "グローバル固有"],
			]);
		});

		it("globalRoot 配下にいない場合は無関係な親ディレクトリまで探索しない", async () => {
			globalRoot = mkdtempSync(join(tmpdir(), "taskp-home-"));
			const outsideRoot = mkdtempSync(join(tmpdir(), "taskp-outside-"));
			extraCleanup.push(outsideRoot);
			localRoot = join(outsideRoot, "project", "src");
			mkdirSync(localRoot, { recursive: true });

			createSkillFile(localRoot, "build", makeSkillMd("build", "カレントディレクトリ版"));
			createSkillFile(
				join(outsideRoot, "project"),
				"review",
				makeSkillMd("review", "親ディレクトリ版"),
			);
			createSkillFile(globalRoot, "lint", makeSkillMd("lint", "グローバル版"));

			const loader = createSkillLoader({ localRoot, globalRoot });
			const { skills } = await loader.listAll();

			expect(skills.map((skill) => [skill.metadata.name, skill.scope])).toEqual([
				["build", "local"],
				["lint", "global"],
			]);
		});

		it("シンボリックリンク経由の cwd でもグローバルスキルを parent と誤分類しない", async () => {
			const realHome = mkdtempSync(join(tmpdir(), "taskp-real-home-"));
			const linkedHome = join(tmpdir(), `taskp-linked-home-${Date.now()}`);
			extraCleanup.push(realHome, linkedHome);
			mkdirSync(join(realHome, "workspace", "packages", "app", "src"), { recursive: true });
			symlinkSync(realHome, linkedHome);

			globalRoot = linkedHome;
			localRoot = join(linkedHome, "workspace", "packages", "app", "src");

			createSkillFile(
				join(realHome, "workspace", "packages", "app"),
				"deploy",
				makeSkillMd("deploy", "アプリ版"),
			);
			createSkillFile(realHome, "lint", makeSkillMd("lint", "グローバル版"));

			const loader = createSkillLoader({ localRoot, globalRoot });
			const { skills } = await loader.listAll();

			expect(skills.map((skill) => [skill.metadata.name, skill.scope])).toEqual([
				["deploy", "parent"],
				["lint", "global"],
			]);
		});
	});

	describe("listLocal", () => {
		it("ローカルスキルのみリストする", async () => {
			createSkillFile(localRoot, "deploy", makeSkillMd("deploy", "デプロイ"));
			createSkillFile(globalRoot, "lint", makeSkillMd("lint", "リント"));
			const loader = createSkillLoader({ localRoot, globalRoot });

			const { skills } = await loader.listLocal();

			expect(skills).toHaveLength(1);
			expect(skills[0].metadata.name).toBe("deploy");
		});

		it("現在地に近いスコープと親スコープを含み、グローバルは含めない", async () => {
			globalRoot = mkdtempSync(join(tmpdir(), "taskp-home-"));
			localRoot = join(globalRoot, "workspace", "packages", "frontend", "src");
			mkdirSync(localRoot, { recursive: true });

			createSkillFile(
				join(globalRoot, "workspace", "packages", "frontend"),
				"deploy",
				makeSkillMd("deploy", "フロントエンド版"),
			);
			createSkillFile(
				join(globalRoot, "workspace"),
				"review",
				makeSkillMd("review", "ワークスペース版"),
			);
			createSkillFile(globalRoot, "lint", makeSkillMd("lint", "グローバル版"));

			const loader = createSkillLoader({ localRoot, globalRoot });
			const { skills } = await loader.listLocal();

			expect(skills.map((skill) => [skill.metadata.name, skill.scope])).toEqual([
				["deploy", "parent"],
				["review", "parent"],
			]);
		});
	});

	describe("listGlobal", () => {
		it("グローバルスキルのみリストする", async () => {
			createSkillFile(localRoot, "deploy", makeSkillMd("deploy", "デプロイ"));
			createSkillFile(globalRoot, "lint", makeSkillMd("lint", "リント"));
			const loader = createSkillLoader({ localRoot, globalRoot });

			const { skills } = await loader.listGlobal();

			expect(skills).toHaveLength(1);
			expect(skills[0].metadata.name).toBe("lint");
		});

		it("同じ SKILL.md を指すシンボリックリンクは listGlobal で重複排除する", async () => {
			const skillsDir = join(globalRoot, ".taskp", "skills");
			mkdirSync(skillsDir, { recursive: true });

			const actualDir = join(skillsDir, "shared-skill");
			mkdirSync(actualDir, { recursive: true });
			writeFileSync(join(actualDir, "SKILL.md"), makeSkillMd("shared-skill", "共有スキル"));

			symlinkSync(actualDir, join(skillsDir, "shared-skill-alias"));

			const debug = vi.fn();
			const loader = createSkillLoader({
				localRoot,
				globalRoot,
				logger: { debug, warn: vi.fn() },
			});

			const { skills } = await loader.listGlobal();

			expect(skills).toHaveLength(1);
			expect(skills[0].metadata.name).toBe("shared-skill");
			expect(debug).toHaveBeenCalledWith(expect.stringContaining("Skipping duplicate skill file"));
		});
	});

	describe("failures", () => {
		it("パースエラー時に failures に記録する", async () => {
			createSkillFile(localRoot, "broken", "---\ninvalid: :\n  bad: [\n---\n# Broken");
			const loader = createSkillLoader({ localRoot, globalRoot });

			const { skills, failures } = await loader.listAll();

			expect(skills).toHaveLength(0);
			expect(failures).toHaveLength(1);
			expect(failures[0].path).toMatch(/broken/);
			expect(failures[0].error).toBeTruthy();
		});

		it("パースエラーがあっても他のスキルは読み込める", async () => {
			createSkillFile(localRoot, "broken", "---\ninvalid: :\n  bad: [\n---\n# Broken");
			createSkillFile(localRoot, "valid", makeSkillMd("valid", "正常なスキル"));
			const loader = createSkillLoader({ localRoot, globalRoot });

			const { skills, failures } = await loader.listAll();

			expect(skills).toHaveLength(1);
			expect(skills[0].metadata.name).toBe("valid");
			expect(failures).toHaveLength(1);
		});

		it("ファイル読み取りエラー時に failures に記録する", async () => {
			createSkillFile(localRoot, "unreadable", makeSkillMd("unreadable", "読み取れない"));
			const filePath = join(localRoot, ".taskp", "skills", "unreadable", "SKILL.md");
			chmodSync(filePath, 0o000);
			const loader = createSkillLoader({ localRoot, globalRoot });

			const { skills, failures } = await loader.listLocal();

			chmodSync(filePath, 0o644);
			expect(skills).toHaveLength(0);
			expect(failures).toHaveLength(1);
			expect(failures[0].path).toMatch(/unreadable/);
			expect(failures[0].error).toMatch(/Failed to read skill file/);
		});

		it("ファイル不在時は failures に記録しない", async () => {
			const loader = createSkillLoader({ localRoot, globalRoot });

			const { skills, failures } = await loader.listAll();

			expect(skills).toHaveLength(0);
			expect(failures).toHaveLength(0);
		});

		it("ローカルとグローバル両方の failures を集約する", async () => {
			createSkillFile(localRoot, "broken-local", "---\nbad: [\n---\n# Broken");
			createSkillFile(globalRoot, "broken-global", "---\nbad: [\n---\n# Broken");
			const loader = createSkillLoader({ localRoot, globalRoot });

			const { failures } = await loader.listAll();

			expect(failures).toHaveLength(2);
			expect(failures.some((f) => f.path.includes("broken-local"))).toBe(true);
			expect(failures.some((f) => f.path.includes("broken-global"))).toBe(true);
		});

		it("listLocal で failures を返す", async () => {
			createSkillFile(localRoot, "broken", "---\nbad: [\n---\n# Broken");
			const loader = createSkillLoader({ localRoot, globalRoot });

			const { failures } = await loader.listLocal();

			expect(failures).toHaveLength(1);
		});

		it("listGlobal で failures を返す", async () => {
			createSkillFile(globalRoot, "broken", "---\nbad: [\n---\n# Broken");
			const loader = createSkillLoader({ localRoot, globalRoot });

			const { failures } = await loader.listGlobal();

			expect(failures).toHaveLength(1);
		});

		it("複数の親スコープとグローバルの failures をまとめて返す", async () => {
			globalRoot = mkdtempSync(join(tmpdir(), "taskp-home-"));
			localRoot = join(globalRoot, "workspace", "packages", "frontend", "src");
			mkdirSync(localRoot, { recursive: true });

			createSkillFile(join(globalRoot, "workspace"), "broken-parent", "---\nbad: [\n---\n# Broken");
			createSkillFile(
				join(globalRoot, "workspace", "packages", "frontend"),
				"broken-local",
				"---\nbad: [\n---\n# Broken",
			);
			createSkillFile(globalRoot, "broken-global", "---\nbad: [\n---\n# Broken");

			const loader = createSkillLoader({ localRoot, globalRoot });
			const { failures } = await loader.listAll();

			expect(failures).toHaveLength(3);
			expect(failures.some((failure) => failure.path.includes("broken-local"))).toBe(true);
			expect(failures.some((failure) => failure.path.includes("broken-parent"))).toBe(true);
			expect(failures.some((failure) => failure.path.includes("broken-global"))).toBe(true);
		});

		it("同じ壊れた SKILL.md を指すシンボリックリンクは failures でも重複排除する", async () => {
			const skillsDir = join(globalRoot, ".taskp", "skills");
			mkdirSync(skillsDir, { recursive: true });

			const actualDir = join(skillsDir, "broken-shared");
			mkdirSync(actualDir, { recursive: true });
			writeFileSync(join(actualDir, "SKILL.md"), "---\ninvalid: :\n  bad: [\n---\n# Broken");

			symlinkSync(actualDir, join(skillsDir, "broken-shared-alias"));

			const loader = createSkillLoader({ localRoot, globalRoot });
			const { skills, failures } = await loader.listGlobal();

			expect(skills).toHaveLength(0);
			expect(failures).toHaveLength(1);
			expect(failures[0].path).toContain("broken-shared");
		});

		it("ホームディレクトリ配下でもグローバルスコープを二重に数えない", async () => {
			globalRoot = mkdtempSync(join(tmpdir(), "taskp-home-"));
			localRoot = join(globalRoot, "workspace", "packages", "frontend", "src");
			mkdirSync(localRoot, { recursive: true });

			createSkillFile(globalRoot, "deploy", makeSkillMd("deploy", "グローバル版"));

			const loader = createSkillLoader({ localRoot, globalRoot });
			const { skills } = await loader.listAll();

			expect(skills).toHaveLength(1);
			expect(skills[0].scope).toBe("global");
		});
	});

	describe("symlink", () => {
		const externalDirs: string[] = [];

		afterEach(() => {
			for (const dir of externalDirs) {
				rmSync(dir, { recursive: true, force: true });
			}
			externalDirs.length = 0;
		});

		it("スキルルート内へのシンボリックリンクされたディレクトリを読み込める", async () => {
			const skillsDir = join(localRoot, ".taskp", "skills");
			mkdirSync(skillsDir, { recursive: true });

			const actualDir = join(skillsDir, "_source", "my-skill");
			mkdirSync(actualDir, { recursive: true });
			writeFileSync(join(actualDir, "SKILL.md"), makeSkillMd("my-skill", "内部スキル"));

			symlinkSync(actualDir, join(skillsDir, "my-skill"));

			const loader = createSkillLoader({ localRoot, globalRoot });
			const { skills } = await loader.listLocal();

			const mySkill = skills.find((s) => s.metadata.name === "my-skill");
			expect(mySkill).toBeDefined();
		});

		it("スキルルート内へのシンボリックリンクを findByName で検索できる", async () => {
			const skillsDir = join(globalRoot, ".taskp", "skills");
			mkdirSync(skillsDir, { recursive: true });

			const actualDir = join(skillsDir, "_source", "linked-skill");
			mkdirSync(actualDir, { recursive: true });
			writeFileSync(join(actualDir, "SKILL.md"), makeSkillMd("linked-skill", "リンクスキル"));

			symlinkSync(actualDir, join(skillsDir, "linked-skill"));

			const loader = createSkillLoader({ localRoot, globalRoot });
			const result = await loader.findByName("linked-skill");

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value.metadata.name).toBe("linked-skill");
			expect(result.value.scope).toBe("global");
		});

		it("スキルルート外へのシンボリックリンクを findByName で読み込める", async () => {
			const externalDir = mkdtempSync(join(tmpdir(), "taskp-external-"));
			externalDirs.push(externalDir);
			const externalSkillDir = join(externalDir, "external-skill");
			mkdirSync(externalSkillDir, { recursive: true });
			writeFileSync(
				join(externalSkillDir, "SKILL.md"),
				makeSkillMd("external-skill", "外部スキル"),
			);

			const skillsDir = join(localRoot, ".taskp", "skills");
			mkdirSync(skillsDir, { recursive: true });
			symlinkSync(externalSkillDir, join(skillsDir, "external-skill"));

			const loader = createSkillLoader({ localRoot, globalRoot });
			const result = await loader.findByName("external-skill");

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value.metadata.name).toBe("external-skill");
			expect(result.value.scope).toBe("local");
		});

		it("壊れたシンボリックリンクはスキップされる", async () => {
			const skillsDir = join(localRoot, ".taskp", "skills");
			mkdirSync(skillsDir, { recursive: true });
			symlinkSync("/nonexistent/path/to/skill", join(skillsDir, "broken-link"));

			const loader = createSkillLoader({ localRoot, globalRoot });
			const { skills, failures } = await loader.listLocal();

			expect(skills).toHaveLength(0);
			expect(failures).toHaveLength(0);
		});

		it("壊れたシンボリックリンクを findByName で指定すると SKILL_NOT_FOUND を返す", async () => {
			const skillsDir = join(localRoot, ".taskp", "skills");
			mkdirSync(skillsDir, { recursive: true });
			symlinkSync("/nonexistent/path/to/skill", join(skillsDir, "broken-link"));

			const loader = createSkillLoader({ localRoot, globalRoot });
			const result = await loader.findByName("broken-link");

			expect(result.ok).toBe(false);
			if (result.ok) return;
			expect(result.error.type).toBe("SKILL_NOT_FOUND");
		});

		it("ファイルへのシンボリックリンクを findByName で指定すると SKILL_NOT_FOUND を返す", async () => {
			const externalDir = mkdtempSync(join(tmpdir(), "taskp-external-"));
			externalDirs.push(externalDir);
			const externalFile = join(externalDir, "not-a-dir.md");
			writeFileSync(externalFile, makeSkillMd("oops", "ファイルリンク"));

			const skillsDir = join(localRoot, ".taskp", "skills");
			mkdirSync(skillsDir, { recursive: true });
			symlinkSync(externalFile, join(skillsDir, "file-link"));

			const loader = createSkillLoader({ localRoot, globalRoot });
			const result = await loader.findByName("file-link");

			expect(result.ok).toBe(false);
			if (result.ok) return;
			expect(result.error.type).toBe("SKILL_NOT_FOUND");
		});

		it("スキルルート外へのシンボリックリンクを読み込める", async () => {
			const externalDir = mkdtempSync(join(tmpdir(), "taskp-external-"));
			externalDirs.push(externalDir);
			const externalSkillDir = join(externalDir, "external-skill");
			mkdirSync(externalSkillDir, { recursive: true });
			writeFileSync(
				join(externalSkillDir, "SKILL.md"),
				makeSkillMd("external-skill", "スキルルート外"),
			);

			const skillsDir = join(localRoot, ".taskp", "skills");
			mkdirSync(skillsDir, { recursive: true });
			symlinkSync(externalSkillDir, join(skillsDir, "external-skill"));

			const loader = createSkillLoader({ localRoot, globalRoot });
			const { skills, failures } = await loader.listLocal();

			expect(skills).toHaveLength(1);
			expect(skills[0].metadata.name).toBe("external-skill");
			expect(failures).toHaveLength(0);
		});

		it("スキルルート外へのシンボリックリンクと通常スキルが共存できる", async () => {
			const externalDir = mkdtempSync(join(tmpdir(), "taskp-external-"));
			externalDirs.push(externalDir);
			const externalSkillDir = join(externalDir, "external-skill");
			mkdirSync(externalSkillDir, { recursive: true });
			writeFileSync(
				join(externalSkillDir, "SKILL.md"),
				makeSkillMd("external-skill", "スキルルート外"),
			);

			const skillsDir = join(localRoot, ".taskp", "skills");
			mkdirSync(skillsDir, { recursive: true });
			symlinkSync(externalSkillDir, join(skillsDir, "external-skill"));
			createSkillFile(localRoot, "valid-skill", makeSkillMd("valid-skill", "正常スキル"));

			const loader = createSkillLoader({ localRoot, globalRoot });
			const { skills, failures } = await loader.listLocal();

			expect(skills).toHaveLength(2);
			const names = skills.map((s) => s.metadata.name);
			expect(names).toContain("external-skill");
			expect(names).toContain("valid-skill");
			expect(failures).toHaveLength(0);
		});

		it("グローバル側のスキルルート外へのシンボリックリンクを listGlobal で読み込める", async () => {
			const externalDir = mkdtempSync(join(tmpdir(), "taskp-external-"));
			externalDirs.push(externalDir);
			const externalSkillDir = join(externalDir, "global-external");
			mkdirSync(externalSkillDir, { recursive: true });
			writeFileSync(
				join(externalSkillDir, "SKILL.md"),
				makeSkillMd("global-external", "グローバル外部スキル"),
			);

			const skillsDir = join(globalRoot, ".taskp", "skills");
			mkdirSync(skillsDir, { recursive: true });
			symlinkSync(externalSkillDir, join(skillsDir, "global-external"));

			const loader = createSkillLoader({ localRoot, globalRoot });
			const { skills, failures } = await loader.listGlobal();

			expect(skills).toHaveLength(1);
			expect(skills[0].metadata.name).toBe("global-external");
			expect(skills[0].scope).toBe("global");
			expect(failures).toHaveLength(0);
		});

		it("グローバル側のスキルルート外へのシンボリックリンクを findByName で読み込める", async () => {
			const externalDir = mkdtempSync(join(tmpdir(), "taskp-external-"));
			externalDirs.push(externalDir);
			const externalSkillDir = join(externalDir, "global-external");
			mkdirSync(externalSkillDir, { recursive: true });
			writeFileSync(
				join(externalSkillDir, "SKILL.md"),
				makeSkillMd("global-external", "グローバル外部スキル"),
			);

			const skillsDir = join(globalRoot, ".taskp", "skills");
			mkdirSync(skillsDir, { recursive: true });
			symlinkSync(externalSkillDir, join(skillsDir, "global-external"));

			const loader = createSkillLoader({ localRoot, globalRoot });
			const result = await loader.findByName("global-external");

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value.metadata.name).toBe("global-external");
			expect(result.value.scope).toBe("global");
		});

		it("スキルルート内のサブディレクトリへのシンボリックリンクは読み込める", async () => {
			const skillsDir = join(localRoot, ".taskp", "skills");
			mkdirSync(skillsDir, { recursive: true });

			const innerDir = join(skillsDir, "_shared", "inner-skill");
			mkdirSync(innerDir, { recursive: true });
			writeFileSync(join(innerDir, "SKILL.md"), makeSkillMd("inner-skill", "内部リンク"));

			symlinkSync(innerDir, join(skillsDir, "inner-skill"));

			const loader = createSkillLoader({ localRoot, globalRoot });
			const { skills } = await loader.listLocal();

			const innerSkill = skills.find((s) => s.metadata.name === "inner-skill");
			expect(innerSkill).toBeDefined();
		});

		it("ファイルへのシンボリックリンクはスキルとして読み込まれない", async () => {
			const externalDir = mkdtempSync(join(tmpdir(), "taskp-external-"));
			externalDirs.push(externalDir);
			const externalFile = join(externalDir, "not-a-dir.md");
			writeFileSync(externalFile, makeSkillMd("oops", "ファイルリンク"));

			const skillsDir = join(localRoot, ".taskp", "skills");
			mkdirSync(skillsDir, { recursive: true });
			symlinkSync(externalFile, join(skillsDir, "file-link"));

			const loader = createSkillLoader({ localRoot, globalRoot });
			const { skills, failures } = await loader.listLocal();

			expect(skills).toHaveLength(0);
			expect(failures).toHaveLength(0);
		});
	});
});
