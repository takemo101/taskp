import { lstat, readdir, readFile, realpath } from "node:fs/promises";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import type { Skill, SkillLogger, SkillScope } from "../core/skill/skill";
import { parseSkill } from "../core/skill/skill";
import type { ParseError } from "../core/types/errors";
import { parseError, type SkillNotFoundError, skillNotFoundError } from "../core/types/errors";
import type { Result } from "../core/types/result";
import { err } from "../core/types/result";
import type { SkillLoadResult, SkillRepository } from "../usecase/port/skill-repository";

const SKILL_DIR_NAME = ".taskp/skills";
const SKILL_FILE_NAME = "SKILL.md";
// Node.js file system error code for "file not found"
const FILE_NOT_FOUND_CODE = "ENOENT";

type SkillLoadAttempt =
	| { readonly type: "found"; readonly ok: true; readonly value: Skill }
	| { readonly type: "not_found" }
	| { readonly type: "error"; readonly ok: false; readonly error: ParseError };

type SkillLoaderDeps = {
	readonly localRoot: string;
	readonly globalRoot: string;
	readonly logger?: SkillLogger;
};

export function createSkillLoader(deps: SkillLoaderDeps): SkillRepository {
	const localSkillsDir = resolve(deps.localRoot, SKILL_DIR_NAME);
	const globalSkillsDir = resolve(deps.globalRoot, SKILL_DIR_NAME);

	const { logger } = deps;
	return {
		findByName: (name) => findByName(name, localSkillsDir, globalSkillsDir, logger),
		listAll: () => listAll(localSkillsDir, globalSkillsDir, logger),
		listLocal: () => scanDirectory(localSkillsDir, "local", logger),
		listGlobal: () => scanDirectory(globalSkillsDir, "global", logger),
	};
}

export function createDefaultSkillLoader(projectRoot: string): SkillRepository {
	return createSkillLoader({
		localRoot: projectRoot,
		globalRoot: homedir(),
	});
}

async function findByName(
	name: string,
	localSkillsDir: string,
	globalSkillsDir: string,
	logger?: SkillLogger,
): Promise<Result<Skill, SkillNotFoundError>> {
	const localDir = join(localSkillsDir, name);
	if (await isSymlinkOutsideRoot(localDir, localSkillsDir)) {
		logger?.warn(`Skipping symlink outside skills root: ${localDir}`);
	} else {
		const localPath = join(localDir, SKILL_FILE_NAME);
		const localResult = await tryLoadSkill(localPath, "local", logger);
		if (localResult.type === "found") {
			return localResult;
		}
	}

	const globalDir = join(globalSkillsDir, name);
	if (await isSymlinkOutsideRoot(globalDir, globalSkillsDir)) {
		logger?.warn(`Skipping symlink outside skills root: ${globalDir}`);
	} else {
		const globalPath = join(globalDir, SKILL_FILE_NAME);
		const globalResult = await tryLoadSkill(globalPath, "global", logger);
		if (globalResult.type === "found") {
			return globalResult;
		}
	}

	return err(skillNotFoundError(name));
}

async function listAll(
	localSkillsDir: string,
	globalSkillsDir: string,
	logger?: SkillLogger,
): Promise<SkillLoadResult> {
	const [localResult, globalResult] = await Promise.all([
		scanDirectory(localSkillsDir, "local", logger),
		scanDirectory(globalSkillsDir, "global", logger),
	]);

	const localNames = new Set(localResult.skills.map((s) => s.metadata.name));
	const uniqueGlobalSkills = globalResult.skills.filter((s) => !localNames.has(s.metadata.name));

	return {
		skills: [...localResult.skills, ...uniqueGlobalSkills],
		failures: [...localResult.failures, ...globalResult.failures],
	};
}

async function scanDirectory(
	skillsDir: string,
	scope: SkillScope,
	logger?: SkillLogger,
): Promise<SkillLoadResult> {
	const entries = await readdir(skillsDir, { withFileTypes: true }).catch(() => []);

	const skills: Skill[] = [];
	const failures: { path: string; error: string }[] = [];

	// Node.js の readdir({ withFileTypes: true }) はシンボリックリンクを stat-follow しないため、
	// symlink 先がディレクトリでも isDirectory() が false を返す。isSymbolicLink() を併用して
	// symlink 先ディレクトリも走査対象に含める。
	for (const entry of entries.filter((e) => e.isDirectory() || e.isSymbolicLink())) {
		if (entry.isSymbolicLink()) {
			const entryPath = join(skillsDir, entry.name);
			const withinRoot = await isWithinRoot(entryPath, skillsDir);
			if (!withinRoot) {
				logger?.warn(`Skipping symlink outside skills root: ${entryPath}`);
				continue;
			}
		}

		const skillPath = join(skillsDir, entry.name, SKILL_FILE_NAME);
		const result = await tryLoadSkill(skillPath, scope, logger);
		if (result.type === "not_found") {
			continue;
		}
		if (result.type === "found") {
			skills.push(result.value);
		} else {
			failures.push({ path: skillPath, error: result.error.message });
		}
	}

	return { skills, failures };
}

async function tryLoadSkill(
	path: string,
	scope: SkillScope,
	logger?: SkillLogger,
): Promise<SkillLoadAttempt> {
	let raw: string;
	try {
		raw = await readFile(path, "utf-8");
	} catch (e: unknown) {
		if (isFileNotFound(e)) {
			return { type: "not_found" };
		}
		return { type: "error", ok: false, error: parseError(`Failed to read skill file: ${path}`) };
	}

	const parseResult = parseSkill(raw, path, scope, logger);
	if (!parseResult.ok) {
		return { type: "error", ...parseResult };
	}
	return { type: "found", ...parseResult };
}

function isFileNotFound(e: unknown): boolean {
	return e instanceof Error && "code" in e && e.code === FILE_NOT_FOUND_CODE;
}

async function isWithinRoot(symlinkPath: string, rootDir: string): Promise<boolean> {
	try {
		const resolved = await realpath(symlinkPath);
		const normalizedRoot = await realpath(rootDir);
		return resolved.startsWith(`${normalizedRoot}/`);
	} catch {
		return false;
	}
}

async function isSymlinkOutsideRoot(path: string, rootDir: string): Promise<boolean> {
	try {
		const stat = await lstat(path);
		if (!stat.isSymbolicLink()) {
			return false;
		}
		return !(await isWithinRoot(path, rootDir));
	} catch {
		return false;
	}
}
