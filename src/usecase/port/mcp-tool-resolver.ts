import type { ToolSet } from "ai";
import type { McpToolRef } from "../../core/execution/mcp-tool-ref";
import type { DomainError } from "../../core/types/errors";
import type { Result } from "../../core/types/result";

export type ResolvedMcpToolSet = {
	readonly server: string;
	readonly tools: ToolSet;
};

export type McpToolResolverPort = {
	readonly resolveTools: (
		refs: readonly McpToolRef[],
	) => Promise<Result<readonly ResolvedMcpToolSet[], DomainError>>;

	readonly closeAll: () => Promise<void>;
};
