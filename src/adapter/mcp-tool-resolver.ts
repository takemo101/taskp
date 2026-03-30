import { createMCPClient, type MCPClient } from "@ai-sdk/mcp";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { ToolSet } from "ai";
import type { McpToolRef } from "../core/execution/mcp-tool-ref";
import { configError, executionError } from "../core/types/errors";
import { err, ok } from "../core/types/result";
import type { Logger } from "../usecase/port/logger";
import type { McpToolResolverPort } from "../usecase/port/mcp-tool-resolver";
import type { McpServerConfig } from "./config-loader";

export function createMcpToolResolver(
	serverConfigs: Readonly<Record<string, McpServerConfig>>,
	logger: Logger,
): McpToolResolverPort {
	const clients = new Map<string, MCPClient>();

	return {
		async resolveTools(refs) {
			const serverNames = [...new Set(refs.map((r) => r.server))];

			for (const name of serverNames) {
				if (!(name in serverConfigs)) {
					return err(configError(`MCP server "${name}" not found in config`));
				}
			}

			const connectResults = await Promise.allSettled(
				serverNames.map(async (name) => {
					const client = await connectByTransport(serverConfigs[name], logger);
					clients.set(name, client);
					return { name, client };
				}),
			);

			for (const result of connectResults) {
				if (result.status === "rejected") {
					await closeAllClients(clients);
					return err(executionError(`MCP connection failed: ${String(result.reason)}`));
				}
			}

			const toolSets = await Promise.all(
				serverNames.map(async (name) => {
					const client = clients.get(name) as MCPClient;
					// McpToolSet<'automatic'> → ToolSet: MCP SDK のツールは AI SDK ToolSet と
					// ランタイム互換だが、ジェネリクスの variance で型が合わない
					const allTools = (await client.tools()) as ToolSet;
					return { server: name, tools: filterTools(allTools, refs, name) };
				}),
			);

			return ok(toolSets);
		},

		async closeAll() {
			await closeAllClients(clients);
		},
	};
}

function connectByTransport(config: McpServerConfig, logger: Logger): Promise<MCPClient> {
	switch (config.transport) {
		case "stdio": {
			logger.debug(`Connecting to MCP server via stdio: ${config.command}`);
			// MCP サーバーの stderr を inherit するとターミナル（TUI 画面）に
			// ログが漏れるため、pipe で受けて破棄する
			const transport = new StdioClientTransport({
				command: config.command,
				args: config.args,
				env: resolveEnvMap(config.env),
				stderr: "pipe",
			});
			transport.stderr?.on("data", () => {});
			return createMCPClient({ transport });
		}
		case "http":
			logger.debug(`Connecting to MCP server via HTTP: ${config.url}`);
			return createMCPClient({
				transport: {
					type: "http",
					url: config.url,
					headers: resolveHeadersEnv(config.headers_env),
				},
			});
		case "sse":
			logger.debug(`Connecting to MCP server via SSE: ${config.url}`);
			return createMCPClient({
				transport: {
					type: "sse",
					url: config.url,
					headers: resolveHeadersEnv(config.headers_env),
				},
			});
	}
}

function resolveEnvMap(
	envMap: Record<string, string> | undefined,
): Record<string, string> | undefined {
	if (envMap === undefined) return undefined;

	const resolved: Record<string, string> = {};
	for (const [key, envVarName] of Object.entries(envMap)) {
		const value = process.env[envVarName];
		if (value !== undefined) {
			resolved[key] = value;
		}
	}
	return resolved;
}

function resolveHeadersEnv(
	headersEnv: Record<string, string> | undefined,
): Record<string, string> | undefined {
	if (headersEnv === undefined) return undefined;

	const resolved: Record<string, string> = {};
	for (const [header, envVarName] of Object.entries(headersEnv)) {
		const value = process.env[envVarName];
		if (value !== undefined) {
			resolved[header] = value;
		}
	}
	return resolved;
}

function filterTools(allTools: ToolSet, refs: readonly McpToolRef[], serverName: string): ToolSet {
	const serverRefs = refs.filter((r) => r.server === serverName);
	const hasAll = serverRefs.some((r) => r.type === "all");

	if (hasAll) return allTools;

	const specificNames = new Set(
		serverRefs
			.filter((r): r is Extract<McpToolRef, { type: "specific" }> => r.type === "specific")
			.map((r) => r.tool),
	);

	return Object.fromEntries(Object.entries(allTools).filter(([name]) => specificNames.has(name)));
}

async function closeAllClients(clients: Map<string, MCPClient>): Promise<void> {
	const promises = [...clients.values()].map((c) => c.close().catch(() => {}));
	await Promise.allSettled(promises);
	clients.clear();
}
