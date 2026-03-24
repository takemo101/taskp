import type { LanguageModelV3 } from "@ai-sdk/provider";
import { describe, expect, it, vi } from "vitest";
import type { Skill } from "../../src/core/skill/skill";
import { ok } from "../../src/core/types/result";
import type { AgentExecutorPort } from "../../src/usecase/port/agent-executor";
import type { ContextCollectorPort } from "../../src/usecase/port/context-collector";
import type { HookContext, HookExecutorPort } from "../../src/usecase/port/hook-executor";
import type { PromptCollector } from "../../src/usecase/port/prompt-collector";
import type { SkillRepository } from "../../src/usecase/port/skill-repository";
import type { SystemPromptResolver } from "../../src/usecase/port/system-prompt-resolver";
import { runAgentSkill } from "../../src/usecase/run-agent-skill";

const mockModel = {} as LanguageModelV3;

function createAgentSkill(overrides?: Partial<Skill["metadata"]>): Skill {
	return {
		metadata: {
			name: "test-agent",
			description: "A test agent skill",
			mode: "agent",
			inputs: [],
			model: undefined,
			tools: ["bash", "read"],
			context: [],
			...overrides,
		},
		body: {
			content: "You are a helpful assistant.",
			extractCodeBlocks: () => [],
			extractActionSection: () => undefined,
			extractActionCodeBlocks: () => [],
		},
		location: "/tmp/test",
		scope: "local",
	};
}

function createMockDeps(skill: Skill) {
	const skillRepository: SkillRepository = {
		findByName: vi.fn().mockResolvedValue(ok(skill)),
		listAll: vi.fn().mockResolvedValue({ skills: [], failures: [] }),
		listLocal: vi.fn().mockResolvedValue({ skills: [], failures: [] }),
		listGlobal: vi.fn().mockResolvedValue({ skills: [], failures: [] }),
	};

	const promptCollector: PromptCollector = {
		collect: vi.fn().mockResolvedValue(ok({})),
	};

	const contextCollector: ContextCollectorPort = {
		collect: vi.fn().mockResolvedValue(
			ok([
				{
					kind: "text" as const,
					source: { type: "file" as const, path: "README.md" },
					content: "collected context",
				},
			]),
		),
	};

	const agentExecutor: AgentExecutorPort = {
		execute: vi.fn().mockResolvedValue(ok({ output: "agent output", steps: 3, elapsedMs: 1500 })),
	};

	const systemPromptResolver: SystemPromptResolver = {
		resolve: vi.fn().mockResolvedValue("You are a task execution agent for taskp."),
	};

	return {
		skillRepository,
		promptCollector,
		contextCollector,
		agentExecutor,
		systemPromptResolver,
	};
}

describe("runAgentSkill", () => {
	it("executes agent and returns result", async () => {
		const skill = createAgentSkill();
		const deps = createMockDeps(skill);

		const result = await runAgentSkill({ name: "test-agent", presets: {}, model: mockModel }, deps);

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.value.skillName).toBe("test-agent");
		expect(result.value.result.output).toBe("agent output");
		expect(result.value.result.steps).toBe(3);
		expect(result.value.result.elapsedMs).toBe(1500);
	});

	it("passes correct input to agent executor", async () => {
		const skill = createAgentSkill();
		const deps = createMockDeps(skill);

		await runAgentSkill({ name: "test-agent", presets: {}, model: mockModel }, deps);

		const executorCall = (deps.agentExecutor.execute as ReturnType<typeof vi.fn>).mock.calls[0][0];
		expect(executorCall.model).toBe(mockModel);
		// systemPrompt は taskp の基盤プロンプト（ツール使用ルール等）が入る
		expect(executorCall.systemPrompt).toContain("task execution agent");
		// contentParts に SKILL.md 本文が含まれる
		expect(executorCall.contentParts).toEqual([
			{ type: "text", text: expect.stringContaining("You are a helpful assistant.") },
		]);
		expect(executorCall.toolNames).toEqual(["bash", "read"]);
		expect(executorCall.maxSteps).toBe(50);
	});

	it("collects context from skill context sources", async () => {
		const skill = createAgentSkill({
			context: [{ type: "file", path: "README.md" }],
		});
		const deps = createMockDeps(skill);

		const result = await runAgentSkill({ name: "test-agent", presets: {}, model: mockModel }, deps);

		expect(result.ok).toBe(true);
		expect(deps.contextCollector.collect).toHaveBeenCalledWith(
			[{ type: "file", path: "README.md" }],
			process.cwd(),
		);

		// contentParts にスキル本文（先頭）と context ソース出力が別々の part として含まれる
		const executorCall = (deps.agentExecutor.execute as ReturnType<typeof vi.fn>).mock.calls[0][0];
		expect(executorCall.contentParts[0]).toEqual({
			type: "text",
			text: expect.stringContaining("You are a helpful assistant."),
		});
		expect(executorCall.contentParts[1]).toEqual({
			type: "text",
			text: "collected context",
		});
	});

	it("converts image CollectedContext to ImagePart in contentParts", async () => {
		const skill = createAgentSkill({
			context: [{ type: "image", path: "mockup.png" }],
		});
		const deps = createMockDeps(skill);
		const imageData = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
		(deps.contextCollector.collect as ReturnType<typeof vi.fn>).mockResolvedValue(
			ok([
				{
					kind: "image" as const,
					source: { type: "image" as const, path: "mockup.png" },
					data: imageData,
					mediaType: "image/png",
				},
			]),
		);

		await runAgentSkill({ name: "test-agent", presets: {}, model: mockModel }, deps);

		const executorCall = (deps.agentExecutor.execute as ReturnType<typeof vi.fn>).mock.calls[0][0];
		expect(executorCall.contentParts).toHaveLength(2);
		expect(executorCall.contentParts[0].type).toBe("text");
		expect(executorCall.contentParts[1]).toEqual({
			type: "image",
			data: imageData,
			mediaType: "image/png",
		});
	});

	it("preserves source definition order in contentParts", async () => {
		const skill = createAgentSkill({
			context: [
				{ type: "file", path: "README.md" },
				{ type: "image", path: "mockup.png" },
			],
		});
		const deps = createMockDeps(skill);
		const imageData = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
		(deps.contextCollector.collect as ReturnType<typeof vi.fn>).mockResolvedValue(
			ok([
				{
					kind: "text" as const,
					source: { type: "file" as const, path: "README.md" },
					content: "readme content",
				},
				{
					kind: "image" as const,
					source: { type: "image" as const, path: "mockup.png" },
					data: imageData,
					mediaType: "image/png",
				},
			]),
		);

		await runAgentSkill({ name: "test-agent", presets: {}, model: mockModel }, deps);

		const executorCall = (deps.agentExecutor.execute as ReturnType<typeof vi.fn>).mock.calls[0][0];
		expect(executorCall.contentParts).toHaveLength(3);
		expect(executorCall.contentParts[0]).toEqual({
			type: "text",
			text: expect.stringContaining("You are a helpful assistant."),
		});
		expect(executorCall.contentParts[1]).toEqual({
			type: "text",
			text: "readme content",
		});
		expect(executorCall.contentParts[2]).toEqual({
			type: "image",
			data: imageData,
			mediaType: "image/png",
		});
	});

	it("skips context collection when no context sources defined", async () => {
		const skill = createAgentSkill({ context: [] });
		const deps = createMockDeps(skill);

		await runAgentSkill({ name: "test-agent", presets: {}, model: mockModel }, deps);

		expect(deps.contextCollector.collect).not.toHaveBeenCalled();
	});

	it("propagates skill-not-found error", async () => {
		const result = await runAgentSkill(
			{ name: "missing", presets: {}, model: mockModel },
			{
				...createMockDeps(createAgentSkill()),
				skillRepository: {
					findByName: vi.fn().mockResolvedValue({
						ok: false,
						error: { type: "SKILL_NOT_FOUND", name: "missing" },
					}),
					listAll: vi.fn().mockResolvedValue({ skills: [], failures: [] }),
					listLocal: vi.fn().mockResolvedValue({ skills: [], failures: [] }),
					listGlobal: vi.fn().mockResolvedValue({ skills: [], failures: [] }),
				},
			},
		);

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error.type).toBe("SKILL_NOT_FOUND");
	});

	it("propagates context collection error", async () => {
		const skill = createAgentSkill({
			context: [{ type: "file", path: "nonexistent.md" }],
		});

		const result = await runAgentSkill(
			{ name: "test-agent", presets: {}, model: mockModel },
			{
				...createMockDeps(skill),
				contextCollector: {
					collect: vi.fn().mockResolvedValue({
						ok: false,
						error: { type: "EXECUTION_ERROR", message: "Failed to read file" },
					}),
				},
			},
		);

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error.type).toBe("EXECUTION_ERROR");
	});

	it("propagates agent execution error", async () => {
		const skill = createAgentSkill();

		const result = await runAgentSkill(
			{ name: "test-agent", presets: {}, model: mockModel },
			{
				...createMockDeps(skill),
				agentExecutor: {
					execute: vi.fn().mockResolvedValue({
						ok: false,
						error: { type: "EXECUTION_ERROR", message: "Agent loop exceeded maximum steps" },
					}),
				},
			},
		);

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error.type).toBe("EXECUTION_ERROR");
	});

	describe("hooks", () => {
		function stubHookExecutor(): HookExecutorPort & {
			calls: { commands: readonly string[]; context: HookContext }[];
		} {
			const calls: { commands: readonly string[]; context: HookContext }[] = [];
			return {
				calls,
				execute: vi.fn(async (commands, context) => {
					calls.push({ commands, context });
					return commands.map((cmd: string) => ({ command: cmd, success: true }));
				}),
			};
		}

		it("calls on_success hook after successful agent execution", async () => {
			const skill = createAgentSkill();
			const hookExecutor = stubHookExecutor();
			const deps = {
				...createMockDeps(skill),
				hookExecutor,
				hooksConfig: { on_success: ["echo agent-done"], on_failure: ["echo agent-fail"] },
			};

			const result = await runAgentSkill(
				{ name: "test-agent", presets: {}, model: mockModel },
				deps,
			);

			expect(result.ok).toBe(true);
			expect(hookExecutor.execute).toHaveBeenCalledOnce();
			expect(hookExecutor.calls[0].context.status).toBe("success");
			expect(hookExecutor.calls[0].context.mode).toBe("agent");
			expect(hookExecutor.calls[0].context.skillName).toBe("test-agent");
			expect(hookExecutor.calls[0].context.durationMs).toBeGreaterThanOrEqual(0);
			expect(hookExecutor.calls[0].commands).toEqual(["echo agent-done"]);
		});

		it("calls on_failure hook after failed agent execution", async () => {
			const skill = createAgentSkill();
			const hookExecutor = stubHookExecutor();
			const deps = {
				...createMockDeps(skill),
				hookExecutor,
				hooksConfig: { on_success: ["echo ok"], on_failure: ["echo fail"] },
				agentExecutor: {
					execute: vi.fn().mockResolvedValue({
						ok: false,
						error: { type: "EXECUTION_ERROR", message: "Agent crashed" },
					}),
				},
			};

			const result = await runAgentSkill(
				{ name: "test-agent", presets: {}, model: mockModel },
				deps,
			);

			expect(result.ok).toBe(false);
			expect(hookExecutor.execute).toHaveBeenCalledOnce();
			expect(hookExecutor.calls[0].context.status).toBe("failed");
			expect(hookExecutor.calls[0].context.error).toBe("Agent crashed");
			expect(hookExecutor.calls[0].commands).toEqual(["echo fail"]);
		});

		it("works without hookExecutor and hooksConfig (backward compatible)", async () => {
			const skill = createAgentSkill();
			const deps = createMockDeps(skill);

			const result = await runAgentSkill(
				{ name: "test-agent", presets: {}, model: mockModel },
				deps,
			);

			expect(result.ok).toBe(true);
		});

		it("does not call executor when on_success is empty", async () => {
			const skill = createAgentSkill();
			const hookExecutor = stubHookExecutor();
			const deps = {
				...createMockDeps(skill),
				hookExecutor,
				hooksConfig: { on_success: [], on_failure: [] },
			};

			await runAgentSkill({ name: "test-agent", presets: {}, model: mockModel }, deps);

			expect(hookExecutor.execute).not.toHaveBeenCalled();
		});

		it("returns original error result even when hooks are configured", async () => {
			const skill = createAgentSkill();
			const hookExecutor = stubHookExecutor();
			const deps = {
				...createMockDeps(skill),
				hookExecutor,
				hooksConfig: { on_failure: ["notify"] },
				agentExecutor: {
					execute: vi.fn().mockResolvedValue({
						ok: false,
						error: { type: "EXECUTION_ERROR", message: "Agent timeout" },
					}),
				},
			};

			const result = await runAgentSkill(
				{ name: "test-agent", presets: {}, model: mockModel },
				deps,
			);

			expect(result.ok).toBe(false);
			if (result.ok) return;
			expect(result.error.type).toBe("EXECUTION_ERROR");
			if (result.error.type === "EXECUTION_ERROR") {
				expect(result.error.message).toBe("Agent timeout");
			}
		});
	});

	describe("action support", () => {
		function createActionSkill(): Skill {
			return {
				metadata: {
					name: "multi-action",
					description: "A skill with actions",
					mode: "agent",
					inputs: [{ name: "global_var", type: "text", message: "Global input" }],
					model: undefined,
					tools: ["bash", "read"],
					context: [{ type: "file", path: "global.md" }],
					actions: {
						review: {
							description: "Code review",
							inputs: [{ name: "target", type: "text", message: "Review target" }],
							tools: ["bash", "read", "write"],
							context: [{ type: "file", path: "review-rules.md" }],
						},
						analyze: {
							description: "Analyze code",
						},
					},
				},
				body: {
					content:
						"Global instructions.\n\n## action:review\n\nReview the code in {{target}}.\n\n## action:analyze\n\nAnalyze the codebase.\n",
					extractCodeBlocks: () => [],
					extractActionSection: (name: string) => {
						const sections: Record<string, string> = {
							review: "## action:review\n\nReview the code in {{target}}.",
							analyze: "## action:analyze\n\nAnalyze the codebase.",
						};
						return sections[name];
					},
					extractActionCodeBlocks: () => [],
				},
				location: "/tmp/test",
				scope: "local",
			};
		}

		it("uses action section content as prompt", async () => {
			const skill = createActionSkill();
			const deps = createMockDeps(skill);

			await runAgentSkill(
				{ name: "multi-action", action: "analyze", presets: {}, model: mockModel },
				deps,
			);

			const executorCall = (deps.agentExecutor.execute as ReturnType<typeof vi.fn>).mock
				.calls[0][0];
			const textContent = executorCall.contentParts[0].text;
			expect(textContent).toContain("Analyze the codebase.");
			expect(textContent).not.toContain("Global instructions.");
		});

		it("uses action-specific tools", async () => {
			const skill = createActionSkill();
			const deps = createMockDeps(skill);
			(deps.promptCollector.collect as ReturnType<typeof vi.fn>).mockResolvedValue(
				ok({ target: "src/" }),
			);

			await runAgentSkill(
				{ name: "multi-action", action: "review", presets: { target: "src/" }, model: mockModel },
				deps,
			);

			const executorCall = (deps.agentExecutor.execute as ReturnType<typeof vi.fn>).mock
				.calls[0][0];
			expect(executorCall.toolNames).toEqual(["bash", "read", "write"]);
		});

		it("uses action-specific inputs", async () => {
			const skill = createActionSkill();
			const deps = createMockDeps(skill);
			(deps.promptCollector.collect as ReturnType<typeof vi.fn>).mockResolvedValue(
				ok({ target: "src/" }),
			);

			await runAgentSkill(
				{ name: "multi-action", action: "review", presets: { target: "src/" }, model: mockModel },
				deps,
			);

			expect(deps.promptCollector.collect).toHaveBeenCalledWith(
				[{ name: "target", type: "text", message: "Review target" }],
				{ target: "src/" },
				{ noInput: undefined },
			);
		});

		it("uses action-specific context sources", async () => {
			const skill = createActionSkill();
			const deps = createMockDeps(skill);
			(deps.promptCollector.collect as ReturnType<typeof vi.fn>).mockResolvedValue(
				ok({ target: "src/" }),
			);

			await runAgentSkill(
				{ name: "multi-action", action: "review", presets: { target: "src/" }, model: mockModel },
				deps,
			);

			expect(deps.contextCollector.collect).toHaveBeenCalledWith(
				[{ type: "file", path: "review-rules.md" }],
				process.cwd(),
			);
		});

		it("falls back to skill-level tools/context when action omits them", async () => {
			const skill = createActionSkill();
			const deps = createMockDeps(skill);

			await runAgentSkill(
				{ name: "multi-action", action: "analyze", presets: {}, model: mockModel },
				deps,
			);

			const executorCall = (deps.agentExecutor.execute as ReturnType<typeof vi.fn>).mock
				.calls[0][0];
			// analyze action has no tools override, falls back to skill-level
			expect(executorCall.toolNames).toEqual(["bash", "read"]);
			// analyze action has no context override, falls back to skill-level
			expect(deps.contextCollector.collect).toHaveBeenCalledWith(
				[{ type: "file", path: "global.md" }],
				process.cwd(),
			);
		});

		it("returns error for undefined action", async () => {
			const skill = createActionSkill();
			const deps = createMockDeps(skill);

			const result = await runAgentSkill(
				{ name: "multi-action", action: "nonexistent", presets: {}, model: mockModel },
				deps,
			);

			expect(result.ok).toBe(false);
			if (result.ok) return;
			expect(result.error.type).toBe("EXECUTION_ERROR");
		});

		it("returns error when action section is missing in body", async () => {
			const skill: Skill = {
				metadata: {
					name: "bad-skill",
					description: "Missing section",
					mode: "agent",
					inputs: [],
					model: undefined,
					tools: ["bash"],
					context: [],
					actions: {
						deploy: { description: "Deploy" },
					},
				},
				body: {
					content: "No action sections here.",
					extractCodeBlocks: () => [],
					extractActionSection: () => undefined,
					extractActionCodeBlocks: () => [],
				},
				location: "/tmp/test",
				scope: "local",
			};
			const deps = createMockDeps(skill);

			const result = await runAgentSkill(
				{ name: "bad-skill", action: "deploy", presets: {}, model: mockModel },
				deps,
			);

			expect(result.ok).toBe(false);
			if (result.ok) return;
			expect(result.error.type).toBe("EXECUTION_ERROR");
		});

		it("renders variables in action section content", async () => {
			const skill = createActionSkill();
			const deps = createMockDeps(skill);
			(deps.promptCollector.collect as ReturnType<typeof vi.fn>).mockResolvedValue(
				ok({ target: "src/main.ts" }),
			);

			await runAgentSkill(
				{
					name: "multi-action",
					action: "review",
					presets: { target: "src/main.ts" },
					model: mockModel,
				},
				deps,
			);

			const executorCall = (deps.agentExecutor.execute as ReturnType<typeof vi.fn>).mock
				.calls[0][0];
			expect(executorCall.contentParts[0].text).toContain("Review the code in src/main.ts.");
		});
	});

	describe("image context E2E integration", () => {
		it("sends image contentPart when skill uses image context with variable expansion", async () => {
			const skill: Skill = {
				metadata: {
					name: "analyze-image",
					description: "画像を分析してフィードバックを返す",
					mode: "agent",
					inputs: [
						{ name: "image_path", type: "text", message: "分析する画像のパスは？" },
						{
							name: "focus",
							type: "text",
							message: "何に注目して分析しますか？（空欄で全般）",
							required: false,
						},
					],
					model: undefined,
					tools: ["read"],
					context: [{ type: "image", path: "{{image_path}}" }],
				},
				body: {
					content: "# 画像分析\n\n提供された画像を分析してください。\n",
					extractCodeBlocks: () => [],
					extractActionSection: () => undefined,
					extractActionCodeBlocks: () => [],
				},
				location: "/tmp/skills/analyze-image/SKILL.md",
				scope: "local",
			};

			const imageData = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
			const deps = createMockDeps(skill);
			(deps.promptCollector.collect as ReturnType<typeof vi.fn>).mockResolvedValue(
				ok({ image_path: "screenshot.png", focus: "" }),
			);
			(deps.contextCollector.collect as ReturnType<typeof vi.fn>).mockResolvedValue(
				ok([
					{
						kind: "image" as const,
						source: { type: "image" as const, path: "screenshot.png" },
						data: imageData,
						mediaType: "image/png",
					},
				]),
			);

			const result = await runAgentSkill(
				{ name: "analyze-image", presets: { image_path: "screenshot.png" }, model: mockModel },
				deps,
			);

			expect(result.ok).toBe(true);

			// context collector receives resolved path (variable expanded)
			expect(deps.contextCollector.collect).toHaveBeenCalledWith(
				[{ type: "image", path: "screenshot.png" }],
				process.cwd(),
			);

			// contentParts: [TextPart(skill body), ImagePart(context)]
			const executorCall = (deps.agentExecutor.execute as ReturnType<typeof vi.fn>).mock
				.calls[0][0];
			expect(executorCall.contentParts).toHaveLength(2);
			expect(executorCall.contentParts[0]).toEqual({
				type: "text",
				text: expect.stringContaining("画像分析"),
			});
			expect(executorCall.contentParts[1]).toEqual({
				type: "image",
				data: imageData,
				mediaType: "image/png",
			});
		});

		it("preserves definition order: skill body → text context → image context", async () => {
			const skill = createAgentSkill({
				context: [
					{ type: "file", path: "README.md" },
					{ type: "image", path: "mockup.png" },
					{ type: "command", run: "git log -5" },
				],
			});
			const deps = createMockDeps(skill);
			const imageData = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
			(deps.contextCollector.collect as ReturnType<typeof vi.fn>).mockResolvedValue(
				ok([
					{
						kind: "text" as const,
						source: { type: "file" as const, path: "README.md" },
						content: "readme content",
					},
					{
						kind: "image" as const,
						source: { type: "image" as const, path: "mockup.png" },
						data: imageData,
						mediaType: "image/png",
					},
					{
						kind: "text" as const,
						source: { type: "command" as const, run: "git log -5" },
						content: "commit log",
					},
				]),
			);

			await runAgentSkill({ name: "test-agent", presets: {}, model: mockModel }, deps);

			const executorCall = (deps.agentExecutor.execute as ReturnType<typeof vi.fn>).mock
				.calls[0][0];
			expect(executorCall.contentParts).toHaveLength(4);
			expect(executorCall.contentParts[0].type).toBe("text"); // skill body
			expect(executorCall.contentParts[1]).toEqual({
				type: "text",
				text: "readme content",
			});
			expect(executorCall.contentParts[2]).toEqual({
				type: "image",
				data: imageData,
				mediaType: "image/png",
			});
			expect(executorCall.contentParts[3]).toEqual({
				type: "text",
				text: "commit log",
			});
		});

		it("text-only skills produce only TextPart contentParts (no regression)", async () => {
			const skill = createAgentSkill({
				context: [{ type: "file", path: "src/main.ts" }],
			});
			const deps = createMockDeps(skill);
			(deps.contextCollector.collect as ReturnType<typeof vi.fn>).mockResolvedValue(
				ok([
					{
						kind: "text" as const,
						source: { type: "file" as const, path: "src/main.ts" },
						content: "const x = 1;",
					},
				]),
			);

			await runAgentSkill({ name: "test-agent", presets: {}, model: mockModel }, deps);

			const executorCall = (deps.agentExecutor.execute as ReturnType<typeof vi.fn>).mock
				.calls[0][0];
			expect(executorCall.contentParts).toHaveLength(2);
			for (const part of executorCall.contentParts) {
				expect(part.type).toBe("text");
			}
		});
	});

	it("resolves model priority: CLI model takes precedence", async () => {
		const skill = createAgentSkill();
		const deps = createMockDeps(skill);

		await runAgentSkill({ name: "test-agent", presets: {}, model: mockModel }, deps);

		const executorCall = (deps.agentExecutor.execute as ReturnType<typeof vi.fn>).mock.calls[0][0];
		expect(executorCall.model).toBe(mockModel);
	});

	it("passes noInput option to prompt collector", async () => {
		const skill = createAgentSkill();
		const deps = createMockDeps(skill);

		await runAgentSkill({ name: "test-agent", presets: {}, model: mockModel, noInput: true }, deps);

		expect(deps.promptCollector.collect).toHaveBeenCalledWith(
			expect.anything(),
			expect.anything(),
			{ noInput: true },
		);
	});
});
