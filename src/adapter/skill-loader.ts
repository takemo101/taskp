import { readdir, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import type { Skill, SkillScope } from "../core/skill/skill";
import { parseSkill } from "../core/skill/skill";
import { type SkillNotFoundError, skillNotFoundError } from "../core/types/errors";
import type { Result } from "../core/types/result";
import { err } from "../core/types/result";
import type { SkillRepository } from "../usecase/port/skill-repository";

const SKILL_DIR_NAME = ".taskp/skills";
const SKILL_FILE_NAME = "SKILL.md";

type SkillLoaderDeps = {
	readonly localRoot: string;
	readonly globalRoot: string;
};

export function createSkillLoader(deps: SkillLoaderDeps): SkillRepository {
	const localSkillsDir = resolve(deps.localRoot, SKILL_DIR_NAME);
	const globalSkillsDir = resolve(deps.globalRoot, SKILL_DIR_NAME);

	return {
		findByName: (name) => findByName(name, localSkillsDir, globalSkillsDir),
		listAll: () => listAll(localSkillsDir, globalSkillsDir),
		listLocal: () => scanDirectory(localSkillsDir, "local"),
		listGlobal: () => scanDirectory(globalSkillsDir, "global"),
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
): Promise<Result<Skill, SkillNotFoundError>> {
	const localPath = join(localSkillsDir, name, SKILL_FILE_NAME);
	const localResult = await tryLoadSkill(localPath, "local");
	if (localResult !== undefined) {
		return localResult;
	}

	const globalPath = join(globalSkillsDir, name, SKILL_FILE_NAME);
	const globalResult = await tryLoadSkill(globalPath, "global");
	if (globalResult !== undefined) {
		return globalResult;
	}

	return err(skillNotFoundError(name));
}

async function listAll(localSkillsDir: string, globalSkillsDir: string): Promise<Skill[]> {
	const [localSkills, globalSkills] = await Promise.all([
		scanDirectory(localSkillsDir, "local"),
		scanDirectory(globalSkillsDir, "global"),
	]);

	const localNames = new Set(localSkills.map((s) => s.metadata.name));
	const uniqueGlobalSkills = globalSkills.filter((s) => !localNames.has(s.metadata.name));

	return [...localSkills, ...uniqueGlobalSkills];
}

async function scanDirectory(skillsDir: string, scope: SkillScope): Promise<Skill[]> {
	const entries = await readdir(skillsDir, { withFileTypes: true }).catch(() => []);

	const results = await Promise.all(
		entries
			.filter((entry) => entry.isDirectory())
			.map(async (entry) => {
				const skillPath = join(skillsDir, entry.name, SKILL_FILE_NAME);
				return tryLoadSkill(skillPath, scope);
			}),
	);

	return results
		.filter((r): r is Result<Skill, never> & { ok: true } => r !== undefined && r.ok === true)
		.map((r) => r.value);
}

async function tryLoadSkill(
	path: string,
	scope: SkillScope,
): Promise<Result<Skill, never> | undefined> {
	const raw = await readFile(path, "utf-8").catch(() => undefined);
	if (raw === undefined) {
		return undefined;
	}

	const result = parseSkill(raw, path, scope);
	if (!result.ok) {
		return undefined;
	}

	return result as Result<Skill, never> & { ok: true };
}
