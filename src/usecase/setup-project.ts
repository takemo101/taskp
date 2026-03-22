import type { DomainError } from "../core/types/errors";
import { configError } from "../core/types/errors";
import type { Result } from "../core/types/result";
import { err } from "../core/types/result";
import type { ProjectInitializer, SetupResult } from "./port/project-initializer";

export type SetupOutput = SetupResult;

export type SetupProjectInput = {
	readonly global: boolean;
	readonly force: boolean;
};

type Deps = {
	readonly projectInitializer: ProjectInitializer;
};

export async function setupProject(
	deps: Deps,
	input: SetupProjectInput,
): Promise<Result<SetupOutput, DomainError>> {
	const result = await deps.projectInitializer.setup({
		force: input.force,
	});

	if (!result.ok) {
		return err(configError(result.error.message));
	}

	return result;
}
