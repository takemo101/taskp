import {
	type ContextSource,
	getContextSourceValue,
	withResolvedValue,
} from "../core/skill/context-source";
import type { DomainError } from "../core/types/errors";
import type { Result } from "../core/types/result";
import { ok } from "../core/types/result";
import type { ReservedVars } from "../core/variable/template-renderer";
import { renderTemplate } from "../core/variable/template-renderer";
import type { CollectedContext, ContextCollectorPort } from "./port/context-collector";

export async function collectSkillContext(
	sources: readonly ContextSource[],
	variables: Record<string, string>,
	reserved: ReservedVars,
	contextCollector: ContextCollectorPort,
	cwd: string,
): Promise<Result<readonly CollectedContext[], DomainError>> {
	const resolved = resolveContextSources(sources, variables, reserved);
	if (!resolved.ok) return resolved;

	return contextCollector.collect(resolved.value, cwd);
}

export function resolveContextSources(
	sources: readonly ContextSource[],
	variables: Record<string, string>,
	reserved: ReservedVars,
): Result<readonly ContextSource[], DomainError> {
	const resolved: ContextSource[] = [];

	for (const source of sources) {
		const raw = getContextSourceValue(source);
		const renderResult = renderTemplate(raw, variables, reserved);
		if (!renderResult.ok) {
			return renderResult;
		}
		resolved.push(withResolvedValue(source, renderResult.value));
	}

	return ok(resolved);
}
