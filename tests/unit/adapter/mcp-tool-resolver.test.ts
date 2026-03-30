import { describe, expect, it, vi } from "vitest";
import type { McpServerConfig } from "../../../src/adapter/config-loader";
import type { McpToolRef } from "../../../src/core/execution/mcp-tool-ref";
import type { Logger } from "../../../src/usecase/port/logger";

const mockTools = vi.fn();
const mockClose = vi.fn();
const mockCreateMCPClient = vi.fn();

vi.mock("@ai-sdk/mcp", () => ({
	createMCPClient: (...args: unknown[]) => mockCreateMCPClient(...args),
}));

vi.mock("@modelcontextprotocol/sdk/client/stdio.js", () => ({
	StdioClientTransport: vi.fn().mockImplementation((opts: unknown) => ({
		type: "stdio",
		...Object.assign({}, opts),
	})),
}));

const { createMcpToolResolver } = await import("../../../src/adapter/mcp-tool-resolver");
const { StdioClientTransport: MockStdioTransport } = await import(
	"@modelcontextprotocol/sdk/client/stdio.js"
);
const mockStdioTransport = MockStdioTransport as unknown as ReturnType<typeof vi.fn>;

function createMockLogger(): Logger {
	return {
		debug: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
	};
}

function createMockClient() {
	const client = {
		tools: mockTools,
		close: mockClose,
	};
	return client;
}

describe("createMcpToolResolver", () => {
	const logger = createMockLogger();

	beforeEach(() => {
		mockCreateMCPClient.mockReset();
		mockTools.mockReset();
		mockClose.mockReset();
		mockClose.mockResolvedValue(undefined);
	});

	describe("resolveTools", () => {
		it("正しいサーバーにのみ接続すること（重複排除）", async () => {
			const toolSet = { tool_a: { execute: vi.fn() }, tool_b: { execute: vi.fn() } };
			const client = createMockClient();
			mockCreateMCPClient.mockResolvedValue(client);
			mockTools.mockResolvedValue(toolSet);

			const configs: Record<string, McpServerConfig> = {
				github: { transport: "stdio", command: "npx", args: ["-y", "github-mcp"] },
			};

			const resolver = createMcpToolResolver(configs, logger);
			const refs: readonly McpToolRef[] = [
				{ type: "all", server: "github" },
				{ type: "specific", server: "github", tool: "tool_a" },
			];

			const result = await resolver.resolveTools(refs);

			expect(result.ok).toBe(true);
			expect(mockCreateMCPClient).toHaveBeenCalledTimes(1);
		});

		it("specific 参照で正しくフィルタされること", async () => {
			const toolSet = {
				get_pr: { execute: vi.fn() },
				list_issues: { execute: vi.fn() },
				create_issue: { execute: vi.fn() },
			};
			const client = createMockClient();
			mockCreateMCPClient.mockResolvedValue(client);
			mockTools.mockResolvedValue(toolSet);

			const configs: Record<string, McpServerConfig> = {
				github: { transport: "stdio", command: "npx" },
			};

			const resolver = createMcpToolResolver(configs, logger);
			const refs: readonly McpToolRef[] = [
				{ type: "specific", server: "github", tool: "get_pr" },
				{ type: "specific", server: "github", tool: "list_issues" },
			];

			const result = await resolver.resolveTools(refs);

			expect(result.ok).toBe(true);
			if (result.ok) {
				const tools = result.value[0].tools;
				expect(Object.keys(tools)).toEqual(["get_pr", "list_issues"]);
				expect(tools).not.toHaveProperty("create_issue");
			}
		});

		it("all と specific 混在時は all が優先されること", async () => {
			const toolSet = {
				get_pr: { execute: vi.fn() },
				list_issues: { execute: vi.fn() },
				create_issue: { execute: vi.fn() },
			};
			const client = createMockClient();
			mockCreateMCPClient.mockResolvedValue(client);
			mockTools.mockResolvedValue(toolSet);

			const configs: Record<string, McpServerConfig> = {
				github: { transport: "stdio", command: "npx" },
			};

			const resolver = createMcpToolResolver(configs, logger);
			const refs: readonly McpToolRef[] = [
				{ type: "all", server: "github" },
				{ type: "specific", server: "github", tool: "get_pr" },
			];

			const result = await resolver.resolveTools(refs);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(Object.keys(result.value[0].tools)).toEqual([
					"get_pr",
					"list_issues",
					"create_issue",
				]);
			}
		});

		it("存在しないサーバー名で ConfigError が返ること", async () => {
			const configs: Record<string, McpServerConfig> = {};
			const resolver = createMcpToolResolver(configs, logger);
			const refs: readonly McpToolRef[] = [{ type: "all", server: "nonexistent" }];

			const result = await resolver.resolveTools(refs);

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error.type).toBe("CONFIG_ERROR");
				if (result.error.type === "CONFIG_ERROR") {
					expect(result.error.message).toContain("nonexistent");
				}
			}
		});

		it("接続失敗時に全クライアントがクリーンアップされること", async () => {
			const successClient = createMockClient();
			let callCount = 0;
			mockCreateMCPClient.mockImplementation(() => {
				callCount++;
				if (callCount === 1) return Promise.resolve(successClient);
				return Promise.reject(new Error("connection refused"));
			});

			const configs: Record<string, McpServerConfig> = {
				server_a: { transport: "stdio", command: "cmd-a" },
				server_b: { transport: "stdio", command: "cmd-b" },
			};

			const resolver = createMcpToolResolver(configs, logger);
			const refs: readonly McpToolRef[] = [
				{ type: "all", server: "server_a" },
				{ type: "all", server: "server_b" },
			];

			const result = await resolver.resolveTools(refs);

			expect(result.ok).toBe(false);
			if (!result.ok) {
				expect(result.error.type).toBe("EXECUTION_ERROR");
				if (result.error.type === "EXECUTION_ERROR") {
					expect(result.error.message).toContain("MCP connection failed");
				}
			}
			expect(mockClose).toHaveBeenCalled();
		});

		it("複数サーバーのツールが正しく返ること", async () => {
			const githubTools = { get_pr: { execute: vi.fn() } };
			const slackTools = { post_message: { execute: vi.fn() } };
			let callCount = 0;

			mockCreateMCPClient.mockImplementation(() => {
				callCount++;
				const client = createMockClient();
				if (callCount === 1) {
					mockTools.mockResolvedValueOnce(githubTools);
				} else {
					mockTools.mockResolvedValueOnce(slackTools);
				}
				return Promise.resolve(client);
			});

			const configs: Record<string, McpServerConfig> = {
				github: { transport: "stdio", command: "github-mcp" },
				slack: { transport: "http", url: "https://slack-mcp.example.com/mcp" },
			};

			const resolver = createMcpToolResolver(configs, logger);
			const refs: readonly McpToolRef[] = [
				{ type: "all", server: "github" },
				{ type: "all", server: "slack" },
			];

			const result = await resolver.resolveTools(refs);

			expect(result.ok).toBe(true);
			if (result.ok) {
				expect(result.value).toHaveLength(2);
				expect(result.value[0].server).toBe("github");
				expect(result.value[1].server).toBe("slack");
			}
		});

		it("stdio トランスポートで ${VAR} 形式の env が解決されること", async () => {
			const client = createMockClient();
			mockCreateMCPClient.mockResolvedValue(client);
			mockTools.mockResolvedValue({});

			const originalEnv = process.env.MY_TOKEN;
			process.env.MY_TOKEN = "secret-value";

			try {
				const configs: Record<string, McpServerConfig> = {
					test: {
						transport: "stdio",
						command: "npx",
						args: ["-y", "test-server"],
						env: { API_KEY: "${MY_TOKEN}" },
					},
				};

				const resolver = createMcpToolResolver(configs, logger);
				await resolver.resolveTools([{ type: "all", server: "test" }]);

				const transportOpts = mockStdioTransport.mock.calls.at(-1)?.[0] as Record<string, unknown>;
				expect(transportOpts.env).toEqual({ API_KEY: "secret-value" });
			} finally {
				if (originalEnv === undefined) {
					delete process.env.MY_TOKEN;
				} else {
					process.env.MY_TOKEN = originalEnv;
				}
			}
		});

		it("stdio トランスポートで env のリテラル値がそのまま渡されること", async () => {
			const client = createMockClient();
			mockCreateMCPClient.mockResolvedValue(client);
			mockTools.mockResolvedValue({});

			const configs: Record<string, McpServerConfig> = {
				test: {
					transport: "stdio",
					command: "npx",
					args: ["-y", "test-server"],
					env: { DIRECT_FLAG: "1", MODE: "production" },
				},
			};

			const resolver = createMcpToolResolver(configs, logger);
			await resolver.resolveTools([{ type: "all", server: "test" }]);

			const transportOpts = mockStdioTransport.mock.calls.at(-1)?.[0] as Record<string, unknown>;
			expect(transportOpts.env).toEqual({ DIRECT_FLAG: "1", MODE: "production" });
		});

		it("stdio トランスポートで env のリテラル値と ${VAR} を混在できること", async () => {
			const client = createMockClient();
			mockCreateMCPClient.mockResolvedValue(client);
			mockTools.mockResolvedValue({});

			const originalEnv = process.env.SECRET_KEY;
			process.env.SECRET_KEY = "s3cret";

			try {
				const configs: Record<string, McpServerConfig> = {
					test: {
						transport: "stdio",
						command: "npx",
						env: { MODE: "production", API_KEY: "${SECRET_KEY}" },
					},
				};

				const resolver = createMcpToolResolver(configs, logger);
				await resolver.resolveTools([{ type: "all", server: "test" }]);

				const transportOpts = mockStdioTransport.mock.calls.at(-1)?.[0] as Record<string, unknown>;
				expect(transportOpts.env).toEqual({
					MODE: "production",
					API_KEY: "s3cret",
				});
			} finally {
				if (originalEnv === undefined) {
					delete process.env.SECRET_KEY;
				} else {
					process.env.SECRET_KEY = originalEnv;
				}
			}
		});

		it("http トランスポートで headers_env が解決されること", async () => {
			const client = createMockClient();
			mockCreateMCPClient.mockResolvedValue(client);
			mockTools.mockResolvedValue({});

			const originalEnv = process.env.AUTH_TOKEN;
			process.env.AUTH_TOKEN = "Bearer xyz";

			try {
				const configs: Record<string, McpServerConfig> = {
					remote: {
						transport: "http",
						url: "https://mcp.example.com/mcp",
						headers_env: { Authorization: "${AUTH_TOKEN}" },
					},
				};

				const resolver = createMcpToolResolver(configs, logger);
				await resolver.resolveTools([{ type: "all", server: "remote" }]);

				const callArg = mockCreateMCPClient.mock.calls[0][0];
				expect(callArg.transport.type).toBe("http");
				expect(callArg.transport.url).toBe("https://mcp.example.com/mcp");
				expect(callArg.transport.headers).toEqual({ Authorization: "Bearer xyz" });
			} finally {
				if (originalEnv === undefined) {
					delete process.env.AUTH_TOKEN;
				} else {
					process.env.AUTH_TOKEN = originalEnv;
				}
			}
		});

		it("headers_env のリテラル値がそのまま渡されること", async () => {
			const client = createMockClient();
			mockCreateMCPClient.mockResolvedValue(client);
			mockTools.mockResolvedValue({});

			const configs: Record<string, McpServerConfig> = {
				remote: {
					transport: "http",
					url: "https://mcp.example.com/mcp",
					headers_env: { "X-Custom": "static-value" },
				},
			};

			const resolver = createMcpToolResolver(configs, logger);
			await resolver.resolveTools([{ type: "all", server: "remote" }]);

			const callArg = mockCreateMCPClient.mock.calls[0][0];
			expect(callArg.transport.headers).toEqual({ "X-Custom": "static-value" });
		});

		it("sse トランスポートで正しく接続されること", async () => {
			const client = createMockClient();
			mockCreateMCPClient.mockResolvedValue(client);
			mockTools.mockResolvedValue({});

			const configs: Record<string, McpServerConfig> = {
				local: { transport: "sse", url: "http://localhost:3001/sse" },
			};

			const resolver = createMcpToolResolver(configs, logger);
			await resolver.resolveTools([{ type: "all", server: "local" }]);

			const callArg = mockCreateMCPClient.mock.calls[0][0];
			expect(callArg.transport.type).toBe("sse");
			expect(callArg.transport.url).toBe("http://localhost:3001/sse");
		});

		it("未設定の環境変数はスキップされること", async () => {
			const client = createMockClient();
			mockCreateMCPClient.mockResolvedValue(client);
			mockTools.mockResolvedValue({});

			const originalEnv = process.env.NONEXISTENT_VAR_FOR_TEST;
			delete process.env.NONEXISTENT_VAR_FOR_TEST;

			try {
				const configs: Record<string, McpServerConfig> = {
					remote: {
						transport: "http",
						url: "https://mcp.example.com/mcp",
						headers_env: { Authorization: "${NONEXISTENT_VAR_FOR_TEST}" },
					},
				};

				const resolver = createMcpToolResolver(configs, logger);
				await resolver.resolveTools([{ type: "all", server: "remote" }]);

				const callArg = mockCreateMCPClient.mock.calls[0][0];
				expect(callArg.transport.headers).toEqual({});
			} finally {
				if (originalEnv !== undefined) {
					process.env.NONEXISTENT_VAR_FOR_TEST = originalEnv;
				}
			}
		});
	});

	describe("closeAll", () => {
		it("全クライアントを close すること", async () => {
			const client = createMockClient();
			mockCreateMCPClient.mockResolvedValue(client);
			mockTools.mockResolvedValue({});

			const configs: Record<string, McpServerConfig> = {
				server_a: { transport: "stdio", command: "cmd-a" },
				server_b: { transport: "stdio", command: "cmd-b" },
			};

			const resolver = createMcpToolResolver(configs, logger);
			await resolver.resolveTools([
				{ type: "all", server: "server_a" },
				{ type: "all", server: "server_b" },
			]);

			mockClose.mockResolvedValue(undefined);
			await resolver.closeAll();

			expect(mockClose).toHaveBeenCalledTimes(2);
		});

		it("close でエラーが発生しても握り潰されること", async () => {
			const client = createMockClient();
			mockCreateMCPClient.mockResolvedValue(client);
			mockTools.mockResolvedValue({});

			const configs: Record<string, McpServerConfig> = {
				server: { transport: "stdio", command: "cmd" },
			};

			const resolver = createMcpToolResolver(configs, logger);
			await resolver.resolveTools([{ type: "all", server: "server" }]);

			mockClose.mockRejectedValue(new Error("close failed"));

			await expect(resolver.closeAll()).resolves.toBeUndefined();
		});
	});
});
