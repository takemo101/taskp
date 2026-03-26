import type { Dirent } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import type { FileSystemPort } from "../../../src/adapter/file-system-port";
import { createProjectInitializer } from "../../../src/adapter/project-initializer";

function createMockFs(overrides?: Partial<FileSystemPort>): FileSystemPort {
	return {
		mkdir: vi.fn<FileSystemPort["mkdir"]>().mockResolvedValue(undefined),
		readdir: vi.fn<FileSystemPort["readdir"]>().mockResolvedValue([]),
		stat: vi.fn<FileSystemPort["stat"]>().mockRejectedValue(new Error("ENOENT")),
		symlink: vi.fn<FileSystemPort["symlink"]>().mockResolvedValue(undefined),
		writeFile: vi.fn<FileSystemPort["writeFile"]>().mockResolvedValue(undefined),
		...overrides,
	};
}

function createMockDirent(name: string, isDir: boolean): Dirent {
	return {
		name,
		isDirectory: () => isDir,
		isFile: () => !isDir,
		isBlockDevice: () => false,
		isCharacterDevice: () => false,
		isFIFO: () => false,
		isSocket: () => false,
		isSymbolicLink: () => false,
		parentPath: "",
		path: "",
	} as Dirent;
}

describe("createProjectInitializer", () => {
	describe("project setup", () => {
		it("必要なディレクトリとファイルを作成する", async () => {
			const fs = createMockFs();

			const initializer = createProjectInitializer({
				baseDir: "/test",
				location: "project",
				fs,
			});

			const result = await initializer.setup({ force: false });

			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(fs.mkdir).toHaveBeenCalledWith("/test/.taskp", { recursive: true });
			expect(fs.mkdir).toHaveBeenCalledWith("/test/.taskp/skills", { recursive: true });
			expect(fs.writeFile).toHaveBeenCalledWith(
				"/test/.taskp/config.toml",
				expect.stringContaining("# default_provider"),
				"utf-8",
			);
			expect(fs.writeFile).toHaveBeenCalledWith(
				"/test/.taskp/config.schema.json",
				expect.stringContaining('"properties"'),
				"utf-8",
			);
			expect(fs.writeFile).toHaveBeenCalledWith(
				"/test/.taplo.toml",
				expect.stringContaining("config.toml"),
				"utf-8",
			);

			expect(result.value.location).toBe("project");
			expect(result.value.created).toContain(".taskp");
			expect(result.value.created).toContain(".taskp/skills");
			expect(result.value.created).toContain(".taskp/config.toml");
			expect(result.value.created).toContain(".taskp/config.schema.json");
			expect(result.value.created).toContain(".taplo.toml");
		});

		it("既存ファイルをスキップする（force なし）", async () => {
			const fs = createMockFs({
				stat: vi.fn<FileSystemPort["stat"]>().mockResolvedValue({
					isDirectory: () => true,
				}),
			});

			const initializer = createProjectInitializer({
				baseDir: "/test",
				location: "project",
				fs,
			});

			const result = await initializer.setup({ force: false });

			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(result.value.skipped).toContain(".taskp/config.toml");
			expect(result.value.skipped).toContain(".taskp/config.schema.json");
			expect(result.value.skipped).toContain(".taplo.toml");
			expect(fs.writeFile).not.toHaveBeenCalled();
		});

		it("force オプションで既存ファイルを上書きする", async () => {
			const fs = createMockFs({
				stat: vi.fn<FileSystemPort["stat"]>().mockResolvedValue({
					isDirectory: () => true,
				}),
			});

			const initializer = createProjectInitializer({
				baseDir: "/test",
				location: "project",
				fs,
			});

			const result = await initializer.setup({ force: true });

			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(result.value.created).toContain(".taskp/config.toml");
			expect(fs.writeFile).toHaveBeenCalledWith(
				"/test/.taskp/config.toml",
				expect.any(String),
				"utf-8",
			);
		});
	});

	describe("global setup", () => {
		it("スキーマと taplo を生成しない", async () => {
			const fs = createMockFs();

			const initializer = createProjectInitializer({
				baseDir: "/home/user",
				location: "global",
				fs,
			});

			const result = await initializer.setup({ force: false });

			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(result.value.location).toBe("global");

			const writtenPaths = (fs.writeFile as ReturnType<typeof vi.fn>).mock.calls.map(
				(call: unknown[]) => call[0],
			);
			expect(writtenPaths).toContain("/home/user/.taskp/config.toml");
			expect(writtenPaths).not.toContain("/home/user/.taskp/config.schema.json");
			expect(writtenPaths).not.toContain("/home/user/.taplo.toml");
		});
	});

	describe("bundled skills linking", () => {
		it("bundledSkillsDir からスキルをシンボリックリンクする", async () => {
			const fs = createMockFs({
				stat: vi.fn<FileSystemPort["stat"]>().mockImplementation(async (path: string) => {
					if (path === "/bundled/skills") {
						return { isDirectory: () => true };
					}
					throw new Error("ENOENT");
				}),
				readdir: vi
					.fn<FileSystemPort["readdir"]>()
					.mockResolvedValue([
						createMockDirent("default-skill", true),
						createMockDirent("README.md", false),
					]),
			});

			const initializer = createProjectInitializer({
				baseDir: "/test",
				location: "project",
				bundledSkillsDir: "/bundled/skills",
				fs,
			});

			const result = await initializer.setup({ force: false });

			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(result.value.linked).toContain("default-skill");
			expect(fs.symlink).toHaveBeenCalledTimes(1);
		});

		it("skills ディレクトリが既存の場合はリンクしない", async () => {
			const statCalls: string[] = [];
			const fs = createMockFs({
				stat: vi.fn<FileSystemPort["stat"]>().mockImplementation(async (path: string) => {
					statCalls.push(path);
					if (path === "/test/.taskp/skills") {
						return { isDirectory: () => true };
					}
					if (path === "/test/.taskp") {
						return { isDirectory: () => true };
					}
					throw new Error("ENOENT");
				}),
			});

			const initializer = createProjectInitializer({
				baseDir: "/test",
				location: "project",
				bundledSkillsDir: "/bundled/skills",
				fs,
			});

			const result = await initializer.setup({ force: false });

			expect(result.ok).toBe(true);
			if (!result.ok) return;

			expect(result.value.linked).toEqual([]);
			expect(fs.symlink).not.toHaveBeenCalled();
		});
	});

	describe("error handling", () => {
		it("ファイルシステムエラー時に Result.error を返す", async () => {
			const fs = createMockFs({
				mkdir: vi.fn<FileSystemPort["mkdir"]>().mockRejectedValue(new Error("EPERM")),
			});

			const initializer = createProjectInitializer({
				baseDir: "/test",
				location: "project",
				fs,
			});

			const result = await initializer.setup({ force: false });

			expect(result.ok).toBe(false);
			if (result.ok) return;
			expect(result.error.message).toContain("Failed to setup project");
		});
	});
});
