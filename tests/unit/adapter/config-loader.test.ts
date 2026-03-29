import { describe, expect, it } from "vitest";
import {
	type McpConfig,
	mcpConfigSchema,
	mcpServerConfigSchema,
	mergeMcpConfig,
} from "../../../src/adapter/config-loader";

describe("mcpServerConfigSchema", () => {
	it("stdio 設定のパースが成功すること", () => {
		const input = {
			transport: "stdio",
			command: "npx",
			args: ["-y", "some-server"],
			env: { API_KEY: "MY_API_KEY" },
		};

		const result = mcpServerConfigSchema.safeParse(input);

		expect(result.success).toBe(true);
		expect(result.data).toEqual(input);
	});

	it("http 設定のパースが成功すること", () => {
		const input = {
			transport: "http",
			url: "https://example.com/mcp",
			headers_env: { Authorization: "AUTH_TOKEN" },
		};

		const result = mcpServerConfigSchema.safeParse(input);

		expect(result.success).toBe(true);
		expect(result.data).toEqual(input);
	});

	it("sse 設定のパースが成功すること", () => {
		const input = {
			transport: "sse",
			url: "https://example.com/sse",
			headers_env: { Authorization: "AUTH_TOKEN" },
		};

		const result = mcpServerConfigSchema.safeParse(input);

		expect(result.success).toBe(true);
		expect(result.data).toEqual(input);
	});

	it("stdio で command がない場合にバリデーションエラーになること", () => {
		const input = {
			transport: "stdio",
		};

		const result = mcpServerConfigSchema.safeParse(input);

		expect(result.success).toBe(false);
	});

	it("http で url がない場合にバリデーションエラーになること", () => {
		const input = {
			transport: "http",
		};

		const result = mcpServerConfigSchema.safeParse(input);

		expect(result.success).toBe(false);
	});

	it("不正な transport 値でエラーになること", () => {
		const input = {
			transport: "websocket",
			url: "ws://example.com",
		};

		const result = mcpServerConfigSchema.safeParse(input);

		expect(result.success).toBe(false);
	});

	it("stdio で command が空文字の場合にバリデーションエラーになること", () => {
		const input = {
			transport: "stdio",
			command: "",
		};

		const result = mcpServerConfigSchema.safeParse(input);

		expect(result.success).toBe(false);
	});

	it("http で url が不正な形式の場合にバリデーションエラーになること", () => {
		const input = {
			transport: "http",
			url: "not-a-url",
		};

		const result = mcpServerConfigSchema.safeParse(input);

		expect(result.success).toBe(false);
	});

	it("stdio でオプションフィールドが省略可能であること", () => {
		const input = {
			transport: "stdio",
			command: "npx",
		};

		const result = mcpServerConfigSchema.safeParse(input);

		expect(result.success).toBe(true);
		expect(result.data).toEqual(input);
	});

	it("http でオプションフィールドが省略可能であること", () => {
		const input = {
			transport: "http",
			url: "https://example.com/mcp",
		};

		const result = mcpServerConfigSchema.safeParse(input);

		expect(result.success).toBe(true);
		expect(result.data).toEqual(input);
	});
});

describe("mcpConfigSchema", () => {
	it("servers を持つ設定のパースが成功すること", () => {
		const input = {
			servers: {
				myServer: {
					transport: "stdio",
					command: "npx",
					args: ["-y", "my-server"],
				},
			},
		};

		const result = mcpConfigSchema.safeParse(input);

		expect(result.success).toBe(true);
		expect(result.data).toEqual(input);
	});

	it("servers が省略可能であること", () => {
		const result = mcpConfigSchema.safeParse({});

		expect(result.success).toBe(true);
		expect(result.data).toEqual({});
	});

	it("複数サーバーのパースが成功すること", () => {
		const input = {
			servers: {
				stdio: {
					transport: "stdio" as const,
					command: "npx",
				},
				http: {
					transport: "http" as const,
					url: "https://example.com/mcp",
				},
				sse: {
					transport: "sse" as const,
					url: "https://example.com/sse",
				},
			},
		};

		const result = mcpConfigSchema.safeParse(input);

		expect(result.success).toBe(true);
		expect(result.data).toEqual(input);
	});
});

describe("mergeMcpConfig", () => {
	it("global と project のマージで project が優先されること", () => {
		const global: McpConfig = {
			servers: {
				serverA: { transport: "stdio", command: "global-cmd" },
			},
		};
		const project: McpConfig = {
			servers: {
				serverB: { transport: "http", url: "https://project.com/mcp" },
			},
		};

		const result = mergeMcpConfig(global, project);

		expect(result.servers).toEqual({
			serverA: { transport: "stdio", command: "global-cmd" },
			serverB: { transport: "http", url: "https://project.com/mcp" },
		});
	});

	it("同名サーバーの丸ごと上書きが正しく動作すること", () => {
		const global: McpConfig = {
			servers: {
				shared: {
					transport: "stdio",
					command: "global-cmd",
					args: ["--verbose"],
					env: { KEY: "GLOBAL_KEY" },
				},
			},
		};
		const project: McpConfig = {
			servers: {
				shared: {
					transport: "http",
					url: "https://project.com/mcp",
				},
			},
		};

		const result = mergeMcpConfig(global, project);

		expect(result.servers).toEqual({
			shared: {
				transport: "http",
				url: "https://project.com/mcp",
			},
		});
	});

	it("global のみの場合は global がそのまま返ること", () => {
		const global: McpConfig = {
			servers: {
				serverA: { transport: "stdio", command: "cmd" },
			},
		};
		const project: McpConfig = {};

		const result = mergeMcpConfig(global, project);

		expect(result.servers).toEqual({
			serverA: { transport: "stdio", command: "cmd" },
		});
	});

	it("project のみの場合は project がそのまま返ること", () => {
		const global: McpConfig = {};
		const project: McpConfig = {
			servers: {
				serverA: { transport: "stdio", command: "cmd" },
			},
		};

		const result = mergeMcpConfig(global, project);

		expect(result.servers).toEqual({
			serverA: { transport: "stdio", command: "cmd" },
		});
	});

	it("両方 servers が undefined の場合は undefined が返ること", () => {
		const result = mergeMcpConfig({}, {});

		expect(result.servers).toBeUndefined();
	});
});
