import { describe, expect, it } from "vitest";
import { ErrorType } from "../../src/core/types/errors";
import { err, ok } from "../../src/core/types/result";
import type { ProjectInitializer, SetupLocation } from "../../src/usecase/port/project-initializer";
import { setupProject } from "../../src/usecase/setup-project";

function stubInitializer(result: {
	location: SetupLocation;
	created: string[];
	skipped: string[];
}): ProjectInitializer {
	return {
		setup: () => Promise.resolve(ok(result)),
	};
}

function failingInitializer(message: string): ProjectInitializer {
	return {
		setup: () => Promise.resolve(err(new Error(message))),
	};
}

describe("setupProject", () => {
	it("returns created files for project setup", async () => {
		const initializer = stubInitializer({
			location: "project",
			created: [".taskp/config.toml", ".taskp/config.schema.json", ".taskp/skills", ".taplo.toml"],
			skipped: [],
		});

		const result = await setupProject(
			{ projectInitializer: initializer },
			{ global: false, force: false },
		);

		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.location).toBe("project");
			expect(result.value.created).toContain(".taskp/config.toml");
			expect(result.value.skipped).toHaveLength(0);
		}
	});

	it("returns created files for global setup", async () => {
		const initializer = stubInitializer({
			location: "global",
			created: ["~/.taskp/config.toml", "~/.taskp/skills"],
			skipped: [],
		});

		const result = await setupProject(
			{ projectInitializer: initializer },
			{ global: true, force: false },
		);

		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.location).toBe("global");
			expect(result.value.created).toHaveLength(2);
		}
	});

	it("returns skipped files when they already exist", async () => {
		const initializer = stubInitializer({
			location: "project",
			created: [],
			skipped: [".taskp/config.toml", ".taplo.toml"],
		});

		const result = await setupProject(
			{ projectInitializer: initializer },
			{ global: false, force: false },
		);

		expect(result.ok).toBe(true);
		if (result.ok) {
			expect(result.value.created).toHaveLength(0);
			expect(result.value.skipped).toContain(".taskp/config.toml");
		}
	});

	it("passes force option to initializer", async () => {
		let capturedForce: boolean | undefined;
		const initializer: ProjectInitializer = {
			setup: (options) => {
				capturedForce = options.force;
				return Promise.resolve(ok({ location: "project" as const, created: [], skipped: [] }));
			},
		};

		await setupProject({ projectInitializer: initializer }, { global: false, force: true });

		expect(capturedForce).toBe(true);
	});

	it("returns config error when initializer fails", async () => {
		const initializer = failingInitializer("Permission denied");

		const result = await setupProject(
			{ projectInitializer: initializer },
			{ global: false, force: false },
		);

		expect(result.ok).toBe(false);
		if (!result.ok) {
			expect(result.error.type).toBe(ErrorType.Config);
			expect((result.error as { message: string }).message).toContain("Permission denied");
		}
	});
});
