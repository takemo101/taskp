import { type ParseError, parseError } from "../types/errors";
import { err, ok, type Result } from "../types/result";

const MCP_PREFIX = "mcp:";

export type McpToolRef =
	| { readonly type: "all"; readonly server: string }
	| { readonly type: "specific"; readonly server: string; readonly tool: string };

export function isMcpToolRef(value: string): boolean {
	return value.startsWith(MCP_PREFIX);
}

export function parseMcpToolRef(value: string): Result<McpToolRef, ParseError> {
	const body = value.slice(MCP_PREFIX.length);
	const slashIndex = body.indexOf("/");

	if (slashIndex === -1) {
		if (body === "") {
			return err(parseError(`Invalid MCP tool reference "${value}": empty server name`));
		}
		return ok({ type: "all", server: body });
	}

	const server = body.slice(0, slashIndex);
	const tool = body.slice(slashIndex + 1);

	if (server === "") {
		return err(parseError(`Invalid MCP tool reference "${value}": empty server name`));
	}
	if (tool === "") {
		return err(parseError(`Invalid MCP tool reference "${value}": empty tool name`));
	}

	return ok({ type: "specific", server, tool });
}

export type PartitionedToolRefs = {
	readonly builtins: readonly string[];
	readonly mcpRefs: readonly McpToolRef[];
};

export function partitionToolRefs(
	tools: readonly string[],
): Result<PartitionedToolRefs, ParseError> {
	const builtins: string[] = [];
	const mcpRefs: McpToolRef[] = [];

	for (const tool of tools) {
		if (!isMcpToolRef(tool)) {
			builtins.push(tool);
			continue;
		}

		const result = parseMcpToolRef(tool);
		if (!result.ok) {
			return result;
		}
		mcpRefs.push(result.value);
	}

	return ok({ builtins, mcpRefs });
}
