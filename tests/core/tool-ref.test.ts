import { describe, expect, it } from "vitest";
import { isMcpToolRef, parseMcpToolRef, partitionToolRefs } from "../../src/core/tool-ref";

describe("isMcpToolRef", () => {
	it("returns true for mcp: prefixed string", () => {
		expect(isMcpToolRef("mcp:my-server")).toBe(true);
	});

	it("returns false for builtin tool name", () => {
		expect(isMcpToolRef("bash")).toBe(false);
	});

	it("returns false for empty string", () => {
		expect(isMcpToolRef("")).toBe(false);
	});
});

describe("parseMcpToolRef", () => {
	it("extracts server name from mcp: prefixed string", () => {
		expect(parseMcpToolRef("mcp:my-server")).toEqual({ server: "my-server" });
	});

	it("preserves slashes in server name", () => {
		expect(parseMcpToolRef("mcp:scope/server")).toEqual({ server: "scope/server" });
	});
});

describe("partitionToolRefs", () => {
	it("separates builtin names from MCP references", () => {
		const result = partitionToolRefs(["bash", "read", "mcp:my-server", "write", "mcp:another"]);

		expect(result.builtins).toEqual(["bash", "read", "write"]);
		expect(result.mcpRefs).toEqual([{ server: "my-server" }, { server: "another" }]);
	});

	it("returns only builtins when no MCP references exist", () => {
		const result = partitionToolRefs(["bash", "read", "write"]);

		expect(result.builtins).toEqual(["bash", "read", "write"]);
		expect(result.mcpRefs).toEqual([]);
	});

	it("returns only MCP references when no builtins exist", () => {
		const result = partitionToolRefs(["mcp:server-a", "mcp:server-b"]);

		expect(result.builtins).toEqual([]);
		expect(result.mcpRefs).toEqual([{ server: "server-a" }, { server: "server-b" }]);
	});

	it("handles empty array", () => {
		const result = partitionToolRefs([]);

		expect(result.builtins).toEqual([]);
		expect(result.mcpRefs).toEqual([]);
	});
});
