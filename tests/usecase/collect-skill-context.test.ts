import { describe, expect, it, vi } from "vitest";
import type { ContextSource } from "../../src/core/skill/context-source";
import type { DomainError } from "../../src/core/types/errors";
import type { Result } from "../../src/core/types/result";
import { ok } from "../../src/core/types/result";
import type { ReservedVars } from "../../src/core/variable/template-renderer";
import {
	collectSkillContext,
	resolveContextSources,
} from "../../src/usecase/collect-skill-context";
import type {
	CollectedContext,
	ContextCollectorPort,
} from "../../src/usecase/port/context-collector";

const reserved: ReservedVars = {
	cwd: "/cwd",
	skillDir: "/path/to/skill",
	date: "2026-03-26",
	timestamp: "2026-03-26T00:00:00.000Z",
};

describe("resolveContextSources", () => {
	it("resolves variables in file source paths", () => {
		const sources: readonly ContextSource[] = [
			{ type: "file", path: "{{__skill_dir__}}/data.txt" },
		];

		const result = resolveContextSources(sources, {}, reserved);

		expect(result).toEqual(ok([{ type: "file", path: "/path/to/skill/data.txt" }]));
	});

	it("resolves variables in command sources", () => {
		const sources: readonly ContextSource[] = [{ type: "command", run: "cat {{name}}.txt" }];

		const result = resolveContextSources(sources, { name: "readme" }, reserved);

		expect(result).toEqual(ok([{ type: "command", run: "cat readme.txt" }]));
	});

	it("resolves variables in glob sources", () => {
		const sources: readonly ContextSource[] = [{ type: "glob", pattern: "{{__skill_dir__}}/*.md" }];

		const result = resolveContextSources(sources, {}, reserved);

		expect(result).toEqual(ok([{ type: "glob", pattern: "/path/to/skill/*.md" }]));
	});

	it("resolves variables in url sources", () => {
		const sources: readonly ContextSource[] = [
			{ type: "url", url: "https://example.com/{{name}}" },
		];

		const result = resolveContextSources(sources, { name: "page" }, reserved);

		expect(result).toEqual(ok([{ type: "url", url: "https://example.com/page" }]));
	});

	it("resolves variables in image sources", () => {
		const sources: readonly ContextSource[] = [
			{ type: "image", path: "{{__skill_dir__}}/screenshot.png" },
		];

		const result = resolveContextSources(sources, {}, reserved);

		expect(result).toEqual(ok([{ type: "image", path: "/path/to/skill/screenshot.png" }]));
	});

	it("returns error when template rendering fails", () => {
		const sources: readonly ContextSource[] = [{ type: "file", path: "{{undefined_var}}" }];

		const result = resolveContextSources(sources, {}, reserved);

		expect(result.ok).toBe(false);
	});

	it("resolves multiple sources", () => {
		const sources: readonly ContextSource[] = [
			{ type: "file", path: "{{__skill_dir__}}/a.txt" },
			{ type: "command", run: "echo {{name}}" },
		];

		const result = resolveContextSources(sources, { name: "hello" }, reserved);

		expect(result).toEqual(
			ok([
				{ type: "file", path: "/path/to/skill/a.txt" },
				{ type: "command", run: "echo hello" },
			]),
		);
	});

	it("returns empty array for empty sources", () => {
		const result = resolveContextSources([], {}, reserved);

		expect(result).toEqual(ok([]));
	});
});

describe("collectSkillContext", () => {
	it("resolves sources and collects context", async () => {
		const sources: readonly ContextSource[] = [
			{ type: "file", path: "{{__skill_dir__}}/data.txt" },
		];
		const collected: readonly CollectedContext[] = [
			{ kind: "text", source: { type: "file", path: "/path/to/skill/data.txt" }, content: "data" },
		];
		const contextCollector: ContextCollectorPort = {
			collect: vi.fn().mockResolvedValue(ok(collected)),
		};

		const result = await collectSkillContext(sources, {}, reserved, contextCollector, "/cwd");

		expect(result).toEqual(ok(collected));
		expect(contextCollector.collect).toHaveBeenCalledWith(
			[{ type: "file", path: "/path/to/skill/data.txt" }],
			"/cwd",
		);
	});

	it("returns error when source resolution fails", async () => {
		const sources: readonly ContextSource[] = [{ type: "file", path: "{{missing}}" }];
		const contextCollector: ContextCollectorPort = {
			collect: vi.fn(),
		};

		const result = await collectSkillContext(sources, {}, reserved, contextCollector, "/cwd");

		expect(result.ok).toBe(false);
		expect(contextCollector.collect).not.toHaveBeenCalled();
	});

	it("returns error when collector fails", async () => {
		const sources: readonly ContextSource[] = [{ type: "file", path: "test.txt" }];
		const collectorError: Result<readonly CollectedContext[], DomainError> = {
			ok: false,
			error: { type: "EXECUTION_ERROR", message: "file not found" },
		};
		const contextCollector: ContextCollectorPort = {
			collect: vi.fn().mockResolvedValue(collectorError),
		};

		const result = await collectSkillContext(sources, {}, reserved, contextCollector, "/cwd");

		expect(result).toEqual(collectorError);
	});
});
