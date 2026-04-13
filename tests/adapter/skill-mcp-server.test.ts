import { describe, expect, it, vi } from "vitest";
import type { Skill } from "../../src/core/skill/skill";
import { buildSkillMcpTools, createSkillMcpCli } from "../../src/adapter/skill-mcp-server";

function createSkill(
	overrides: Partial<Skill["metadata"]> & { name: string; description: string },
): Skill {
	return {
		metadata: {
			name: overrides.name,
			description: overrides.description,
			mode: overrides.mode ?? "template",
			inputs: overrides.inputs ?? [],
			model: overrides.model,
			timeout: overrides.timeout,
			tools: overrides.tools ?? [],
			context: overrides.context ?? [],
			actions: overrides.actions,
			hooks: overrides.hooks,
		},
		body: {
			content: "",
			extractCodeBlocks: () => [],
			extractActionSection: () => ({
				ok: false,
				error: { type: "EXECUTION_ERROR", message: "n/a" },
			}),
			extractActionCodeBlocks: () => [],
		},
		location: `/skills/${overrides.name}/SKILL.md`,
		scope: "local",
	};
}

async function mcpRequest(
	cli: { fetch(req: Request): Promise<Response> },
	body: unknown,
	sessionId?: string,
) {
	const headers: Record<string, string> = {
		"content-type": "application/json",
		accept: "application/json, text/event-stream",
	};
	if (sessionId) headers["mcp-session-id"] = sessionId;
	return cli.fetch(
		new Request("http://localhost/mcp", {
			method: "POST",
			headers,
			body: JSON.stringify(body),
		}),
	);
}

async function initSession(cli: { fetch(req: Request): Promise<Response> }) {
	const res = await mcpRequest(cli, {
		jsonrpc: "2.0",
		id: 1,
		method: "initialize",
		params: {
			protocolVersion: "2025-03-26",
			capabilities: {},
			clientInfo: { name: "test-client", version: "1.0.0" },
		},
	});
	const sessionId = res.headers.get("mcp-session-id");
	await mcpRequest(
		cli,
		{ jsonrpc: "2.0", method: "notifications/initialized" },
		sessionId ?? undefined,
	);
	return sessionId ?? "";
}

describe("buildSkillMcpTools", () => {
	it("shrinks MCP tool descriptions under the shared budget", () => {
		const tools = buildSkillMcpTools(
			[
				createSkill({
					name: "deploy",
					description: "アプリケーションを安全にデプロイするための長い説明文",
				}),
				createSkill({ name: "release", description: "リリース作業全体を実行するための長い説明文" }),
			],
			{ budgetChars: 22, maxDescriptionChars: 40, minDescriptionChars: 12 },
		);

		expect(tools[0]?.description === undefined || tools[0]?.description.includes("…")).toBe(true);
		expect(tools[1]?.description === undefined || tools[1]?.description.includes("…")).toBe(true);
	});

	it("creates action-level MCP tools", () => {
		const tools = buildSkillMcpTools(
			[
				createSkill({
					name: "task",
					description: "Task operations",
					actions: {
						add: { description: "Add task", mode: "template" },
						list: { description: "List tasks", mode: "template" },
					},
				}),
			],
			{ budgetChars: 200, maxDescriptionChars: 80 },
		);

		expect(tools.map((tool) => tool.toolName)).toEqual(["task__add", "task__list"]);
	});

	it("fails fast on normalized MCP tool name collisions", () => {
		expect(() =>
			buildSkillMcpTools(
				[
					createSkill({ name: "review__fix", description: "Skill" }),
					createSkill({
						name: "review",
						description: "Review",
						actions: { fix: { description: "Fix", mode: "template" } },
					}),
				],
				{ budgetChars: 200, maxDescriptionChars: 80 },
			),
		).toThrow("Duplicate MCP tool name after normalization");
	});
});

describe("createSkillMcpCli", () => {
	it("exposes budgeted skill tools through MCP tools/list", async () => {
		const cli = createSkillMcpCli({
			version: "0.1.14",
			skills: [
				createSkill({
					name: "deploy",
					description: "アプリケーションを安全にデプロイするための長い説明文",
					inputs: [{ name: "env", type: "text", message: "Environment" }],
				}),
				createSkill({
					name: "release",
					description: "リリース作業全体を実行するための長い説明文",
				}),
			],
			budgetOptions: { budgetChars: 50, maxDescriptionChars: 40, minDescriptionChars: 12 },
			executeSkill: vi.fn().mockResolvedValue({ ok: true }),
		});

		const sessionId = await initSession(cli);
		const res = await mcpRequest(
			cli,
			{ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} },
			sessionId,
		);
		const body = (await res.json()) as {
			result: {
				tools: Array<{
					name: string;
					description?: string;
					inputSchema?: { properties?: Record<string, unknown> };
				}>;
			};
		};
		const tools = body.result.tools.map(
			(tool: {
				name: string;
				description?: string;
				inputSchema?: { properties?: Record<string, unknown> };
			}) => ({
				name: tool.name,
				description: tool.description,
				hasInputSchema: Object.keys(tool.inputSchema?.properties ?? {}).length > 0,
			}),
		);

		expect(tools).toEqual([
			{ name: "deploy", description: expect.any(String), hasInputSchema: true },
			{ name: "release", description: expect.any(String), hasInputSchema: false },
		]);
		expect(tools[0]?.description).toContain("…");
	});

	it("returns MCP tool errors without crashing when skill execution throws", async () => {
		const cli = createSkillMcpCli({
			version: "0.1.14",
			skills: [createSkill({ name: "deploy", description: "Deploy" })],
			budgetOptions: { budgetChars: 200, maxDescriptionChars: 80 },
			executeSkill: vi.fn().mockRejectedValue(new Error("skill failed")),
		});

		const sessionId = await initSession(cli);
		const res = await mcpRequest(
			cli,
			{
				jsonrpc: "2.0",
				id: 3,
				method: "tools/call",
				params: { name: "deploy", arguments: {} },
			},
			sessionId,
		);
		const body = (await res.json()) as {
			result: { content: Array<{ text: string }>; isError?: boolean };
		};

		expect(res.status).toBe(200);
		expect(body.result.isError).toBe(true);
		expect(body.result.content[0]?.text).toContain("skill failed");
	});
});
