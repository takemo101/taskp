import { realpathSync } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
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

type SkillDirectory = {
	readonly path: string;
	readonly scope: SkillScope;
};

export function createSkillLoader(deps: SkillLoaderDeps): SkillRepository {
	const canonicalLocalRoot = canonicalizePath(deps.localRoot);
	const canonicalGlobalRoot = canonicalizePath(deps.globalRoot);
	const projectSkillDirs = discoverProjectSkillDirs(canonicalLocalRoot, canonicalGlobalRoot);
	const globalSkillDir = createGlobalSkillDir(canonicalGlobalRoot);

	const { logger } = deps;
	return {
		findByName: (name) => findByName(name, [...projectSkillDirs, globalSkillDir], logger),
		listAll: () => listAll([...projectSkillDirs, globalSkillDir], logger),
		listLocal: () => listAll(projectSkillDirs, logger),
		listGlobal: () => scanDirectory(globalSkillDir.path, globalSkillDir.scope, logger),
	};
}

export async function createDefaultSkillLoader(projectRoot: string): Promise<SkillRepository> {
	return createSkillLoader({
		localRoot: projectRoot,
		globalRoot: homedir(),
	});
}

async function findByName(
	name: string,
	skillDirs: readonly SkillDirectory[],
	logger?: SkillLogger,
): Promise<Result<Skill, SkillNotFoundError>> {
	for (const skillDir of skillDirs) {
		const skillPath = join(skillDir.path, name, SKILL_FILE_NAME);
		const result = await tryLoadSkill(skillPath, skillDir.scope, logger);
		if (result.type === "found") {
			return result;
		}
		if (result.type === "error") {
			logger?.warn(
				`Failed to load skill "${name}" from ${skillDir.scope}: ${result.error.message}`,
			);
		}
	}

	return err(skillNotFoundError(name));
}

async function listAll(
	skillDirs: readonly SkillDirectory[],
	logger?: SkillLogger,
): Promise<SkillLoadResult> {
	const results = await Promise.all(
		skillDirs.map((skillDir) => scanDirectory(skillDir.path, skillDir.scope, logger)),
	);

	return mergeSkillLoadResults(results);
}

function mergeSkillLoadResults(results: readonly SkillLoadResult[]): SkillLoadResult {
	const skills: Skill[] = [];
	const failures = results.flatMap((result) => result.failures);
	const seen = new Set<string>();

	for (const result of results) {
		for (const skill of result.skills) {
			if (seen.has(skill.metadata.name)) {
				continue;
			}
			seen.add(skill.metadata.name);
			skills.push(skill);
		}
	}

	return { skills, failures };
}

function createGlobalSkillDir(globalRoot: string): SkillDirectory {
	return {
		path: join(globalRoot, SKILL_DIR_NAME),
		scope: "global",
	};
}

function discoverProjectSkillDirs(
	localRoot: string,
	globalRoot: string,
): readonly SkillDirectory[] {
	if (!isWithinPath(localRoot, globalRoot)) {
		return [{ path: join(localRoot, SKILL_DIR_NAME), scope: "local" }];
	}

	const discovered: SkillDirectory[] = [];
	let current = localRoot;
	let scope: Exclude<SkillScope, "global"> = "local";

	while (current !== globalRoot) {
		discovered.push({ path: join(current, SKILL_DIR_NAME), scope });

		const parent = dirname(current);
		if (parent === current) {
			break;
		}

		current = parent;
		scope = "parent";
	}

	return discovered;
}

function canonicalizePath(path: string): string {
	const resolvedPath = resolve(path);
	try {
		return realpathSync(resolvedPath);
	} catch {
		return resolvedPath;
	}
}

function isWithinPath(path: string, boundary: string): boolean {
	const relation = relative(boundary, path);
	return relation === "" || (!relation.startsWith("..") && relation !== "..");
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
			const isDir = await stat(entryPath)
				.then((s) => s.isDirectory())
				.catch((e: unknown) => {
					if (!isFileNotFound(e)) {
						logger?.warn(`Failed to stat symlink: ${entryPath}`);
					}
					return false;
				});
			if (!isDir) continue;
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
