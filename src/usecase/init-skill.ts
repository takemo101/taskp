import type { ExecutionMode } from "../core/execution/execution-mode";
import type { DomainError } from "../core/types/errors";
import { configError } from "../core/types/errors";
import type { Result } from "../core/types/result";
import { err, ok } from "../core/types/result";
import type { SkillInitializer } from "./port/skill-initializer";
import type { SkillRepository } from "./port/skill-repository";

export type InitOutput = {
	readonly name: string;
	readonly path: string;
	readonly mode: ExecutionMode;
};

export type InitSkillInput = {
	readonly name: string;
	readonly global: boolean;
	readonly mode: ExecutionMode;
};

type Deps = {
	readonly skillRepository: SkillRepository;
	readonly skillInitializer: SkillInitializer;
};

export async function initSkill(
	deps: Deps,
	input: InitSkillInput,
): Promise<Result<InitOutput, DomainError>> {
	const conflictResult = await checkNameConflict(deps.skillRepository, input.name);
	if (!conflictResult.ok) {
		return conflictResult;
	}

	const createResult = await deps.skillInitializer.create(input.name, {
		mode: input.mode,
		description: `${input.name} skill`,
	});

	if (!createResult.ok) {
		return err(configError(createResult.error.message));
	}

	return ok({
		name: input.name,
		path: createResult.value,
		mode: input.mode,
	});
}

async function checkNameConflict(
	repository: SkillRepository,
	name: string,
): Promise<Result<void, DomainError>> {
	const { skills } = await repository.listAll();
	const exists = skills.some((s) => s.metadata.name === name);
	if (exists) {
		return err(configError(`Skill "${name}" already exists`));
	}
	return ok(undefined);
}
