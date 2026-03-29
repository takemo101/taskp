const MCP_PREFIX = "mcp:";

export type McpToolRef = {
	readonly server: string;
};

export type PartitionedToolRefs = {
	readonly builtins: readonly string[];
	readonly mcpRefs: readonly McpToolRef[];
};

export function isMcpToolRef(name: string): boolean {
	return name.startsWith(MCP_PREFIX);
}

export function parseMcpToolRef(name: string): McpToolRef {
	return { server: name.slice(MCP_PREFIX.length) };
}

export function partitionToolRefs(toolNames: readonly string[]): PartitionedToolRefs {
	const builtins: string[] = [];
	const mcpRefs: McpToolRef[] = [];

	for (const name of toolNames) {
		if (isMcpToolRef(name)) {
			mcpRefs.push(parseMcpToolRef(name));
		} else {
			builtins.push(name);
		}
	}

	return { builtins, mcpRefs };
}
