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

type SkillCandidate = {
	readonly path: string;
	readonly scope: SkillScope;
};

export function createSkillLoader(deps: SkillLoaderDeps): SkillRepository {
	const canonicalLocalRoot = canonicalizePath(deps.localRoot);
	const canonicalGlobalRoot = canonicalizePath(deps.globalRoot);
	const projectSkillDirs = discoverProjectSkillDirs(canonicalLocalRoot, canonicalGlobalRoot);
	const globalSkillDir = createGlobalSkillDir(canonicalGlobalRoot);

	const { logger } = deps;

	// listAll はエージェントモード実行中に複数回呼ばれるため、
	// 同一インスタンス内ではキャッシュして I/O を節約する
	let listAllCache: Promise<SkillLoadResult> | undefined;

	return {
		findByName: (name) => findByName(name, [...projectSkillDirs, globalSkillDir], logger),
		listAll: () => {
			if (listAllCache === undefined) {
				listAllCache = loadFromDirectories([...projectSkillDirs, globalSkillDir], logger);
			}
			return listAllCache;
		},
		listProject: () => loadFromDirectories(projectSkillDirs, logger),
		listGlobal: () => loadFromDirectories([globalSkillDir], logger),
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

async function loadFromDirectories(
	skillDirs: readonly SkillDirectory[],
	logger?: SkillLogger,
): Promise<SkillLoadResult> {
	const candidateGroups = await Promise.all(
		skillDirs.map((skillDir) => collectSkillCandidates(skillDir.path, skillDir.scope, logger)),
	);
	const candidates = deduplicateSkillCandidates(candidateGroups.flat(), logger);
	const attempts = await Promise.all(
		candidates.map((candidate) => tryLoadSkill(candidate.path, candidate.scope, logger)),
	);

	return createSkillLoadResult(candidates, attempts);
}

function createSkillLoadResult(
	candidates: readonly SkillCandidate[],
	attempts: readonly SkillLoadAttempt[],
): SkillLoadResult {
	const skills: Skill[] = [];
	const failures: { path: string; error: string }[] = [];
	const seen = new Set<string>();

	for (const [index, attempt] of attempts.entries()) {
		if (attempt.type === "not_found") {
			continue;
		}

		if (attempt.type === "error") {
			failures.push({ path: candidates[index]?.path ?? "", error: attempt.error.message });
			continue;
		}

		const skill = attempt.value;
		if (seen.has(skill.metadata.name)) {
			continue;
		}

		seen.add(skill.metadata.name);
		skills.push(skill);
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

async function collectSkillCandidates(
	skillsDir: string,
	scope: SkillScope,
	logger?: SkillLogger,
): Promise<readonly SkillCandidate[]> {
	const entries = await readdir(skillsDir, { withFileTypes: true }).catch(() => []);
	const candidates: SkillCandidate[] = [];

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

		candidates.push({ path: join(skillsDir, entry.name, SKILL_FILE_NAME), scope });
	}

	return candidates;
}

function deduplicateSkillCandidates(
	candidates: readonly SkillCandidate[],
	logger?: SkillLogger,
): readonly SkillCandidate[] {
	const uniqueCandidates: SkillCandidate[] = [];
	const seenCanonicalPaths = new Set<string>();

	for (const candidate of candidates) {
		const canonicalPath = getCanonicalPath(candidate.path);
		if (canonicalPath === null) {
			uniqueCandidates.push(candidate);
			continue;
		}

		if (seenCanonicalPaths.has(canonicalPath)) {
			logger?.debug?.(
				`Skipping duplicate skill file: ${candidate.path} (canonical: ${canonicalPath})`,
			);
			continue;
		}

		seenCanonicalPaths.add(canonicalPath);
		uniqueCandidates.push(candidate);
	}

	return uniqueCandidates;
}

function getCanonicalPath(path: string): string | null {
	try {
		return realpathSync(path);
	} catch {
		return null;
	}
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
