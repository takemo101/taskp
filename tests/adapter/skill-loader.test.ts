import { chmodSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
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

	beforeEach(() => {
		localRoot = mkdtempSync(join(tmpdir(), "taskp-local-"));
		globalRoot = mkdtempSync(join(tmpdir(), "taskp-global-"));
	});

	afterEach(() => {
		rmSync(localRoot, { recursive: true, force: true });
		rmSync(globalRoot, { recursive: true, force: true });
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

		it("スキルディレクトリが存在しない場合は空配列を返す", async () => {
			const loader = createSkillLoader({ localRoot, globalRoot });

			const { skills, failures } = await loader.listAll();

			expect(skills).toEqual([]);
			expect(failures).toEqual([]);
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
	});

	describe("symlink", () => {
		const externalDirs: string[] = [];

		afterEach(() => {
			for (const dir of externalDirs) {
				rmSync(dir, { recursive: true, force: true });
			}
			externalDirs.length = 0;
		});

		it("シンボリックリンクされたスキルディレクトリを読み込める", async () => {
			const externalDir = mkdtempSync(join(tmpdir(), "taskp-external-"));
			externalDirs.push(externalDir);
			const externalSkillDir = join(externalDir, "my-skill");
			mkdirSync(externalSkillDir, { recursive: true });
			writeFileSync(join(externalSkillDir, "SKILL.md"), makeSkillMd("my-skill", "外部スキル"));

			const skillsDir = join(localRoot, ".taskp", "skills");
			mkdirSync(skillsDir, { recursive: true });
			symlinkSync(externalSkillDir, join(skillsDir, "my-skill"));

			const loader = createSkillLoader({ localRoot, globalRoot });
			const { skills } = await loader.listLocal();

			expect(skills).toHaveLength(1);
			expect(skills[0].metadata.name).toBe("my-skill");
		});

		it("シンボリックリンクされたスキルを findByName で検索できる", async () => {
			const externalDir = mkdtempSync(join(tmpdir(), "taskp-external-"));
			externalDirs.push(externalDir);
			const externalSkillDir = join(externalDir, "linked-skill");
			mkdirSync(externalSkillDir, { recursive: true });
			writeFileSync(
				join(externalSkillDir, "SKILL.md"),
				makeSkillMd("linked-skill", "リンクスキル"),
			);

			const skillsDir = join(globalRoot, ".taskp", "skills");
			mkdirSync(skillsDir, { recursive: true });
			symlinkSync(externalSkillDir, join(skillsDir, "linked-skill"));

			const loader = createSkillLoader({ localRoot, globalRoot });
			const result = await loader.findByName("linked-skill");

			expect(result.ok).toBe(true);
			if (!result.ok) return;
			expect(result.value.metadata.name).toBe("linked-skill");
			expect(result.value.scope).toBe("global");
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

		it("ファイルへのシンボリックリンクは failures に記録される", async () => {
			const externalDir = mkdtempSync(join(tmpdir(), "taskp-external-"));
			externalDirs.push(externalDir);
			const externalFile = join(externalDir, "not-a-dir.md");
			writeFileSync(externalFile, makeSkillMd("oops", "ファイルリンク"));

			const skillsDir = join(localRoot, ".taskp", "skills");
			mkdirSync(skillsDir, { recursive: true });
			symlinkSync(externalFile, join(skillsDir, "file-link"));

			const loader = createSkillLoader({ localRoot, globalRoot });
			const { skills, failures } = await loader.listLocal();

			// ファイルへの symlink は file-link/SKILL.md を readFile → ENOTDIR で失敗する
			expect(skills).toHaveLength(0);
			expect(failures).toHaveLength(1);
			expect(failures[0].path).toMatch(/file-link/);
		});
	});
});
