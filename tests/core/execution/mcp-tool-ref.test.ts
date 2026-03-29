import { describe, expect, it } from "vitest";
import {
	isMcpToolRef,
	parseMcpToolRef,
	partitionToolRefs,
} from "../../../src/core/execution/mcp-tool-ref";

describe("isMcpToolRef", () => {
	it("mcp: プレフィックスを持つ文字列に true を返す", () => {
		expect(isMcpToolRef("mcp:github")).toBe(true);
	});

	it("mcp:server/tool 形式に true を返す", () => {
		expect(isMcpToolRef("mcp:slack/post_message")).toBe(true);
	});

	it("mcp: プレフィックスのない文字列に false を返す", () => {
		expect(isMcpToolRef("bash")).toBe(false);
	});

	it("空文字列に false を返す", () => {
		expect(isMcpToolRef("")).toBe(false);
	});

	it("mcp を含むが mcp: で始まらない文字列に false を返す", () => {
		expect(isMcpToolRef("my-mcp:test")).toBe(false);
	});
});

describe("parseMcpToolRef", () => {
	it("mcp:server を all 型としてパースする", () => {
		const result = parseMcpToolRef("mcp:github");

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value).toStrictEqual({ type: "all", server: "github" });
	});

	it("mcp:server/tool を specific 型としてパースする", () => {
		const result = parseMcpToolRef("mcp:slack/post_message");

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value).toStrictEqual({
			type: "specific",
			server: "slack",
			tool: "post_message",
		});
	});

	it("空サーバー名 mcp: でエラーを返す", () => {
		const result = parseMcpToolRef("mcp:");

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error.type).toBe("PARSE_ERROR");
		expect(result.error.message).toContain("empty server name");
	});

	it("空サーバー名・空ツール名 mcp:/ でエラーを返す", () => {
		const result = parseMcpToolRef("mcp:/");

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error.type).toBe("PARSE_ERROR");
		expect(result.error.message).toContain("empty server name");
	});

	it("空ツール名 mcp:github/ でエラーを返す", () => {
		const result = parseMcpToolRef("mcp:github/");

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error.type).toBe("PARSE_ERROR");
		expect(result.error.message).toContain("empty tool name");
	});
});

describe("partitionToolRefs", () => {
	it("組み込みツールと MCP 参照を分離する", () => {
		const result = partitionToolRefs(["bash", "read", "mcp:github"]);

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value).toStrictEqual({
			builtins: ["bash", "read"],
			mcpRefs: [{ type: "all", server: "github" }],
		});
	});

	it("MCP 参照のみの配列を正しく分離する", () => {
		const result = partitionToolRefs(["mcp:github", "mcp:slack/post_message"]);

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value).toStrictEqual({
			builtins: [],
			mcpRefs: [
				{ type: "all", server: "github" },
				{ type: "specific", server: "slack", tool: "post_message" },
			],
		});
	});

	it("組み込みツールのみの配列を正しく処理する", () => {
		const result = partitionToolRefs(["bash", "read", "write"]);

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value).toStrictEqual({
			builtins: ["bash", "read", "write"],
			mcpRefs: [],
		});
	});

	it("空配列を正しく処理する", () => {
		const result = partitionToolRefs([]);

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value).toStrictEqual({
			builtins: [],
			mcpRefs: [],
		});
	});

	it("不正な MCP 参照でエラーを返す", () => {
		const result = partitionToolRefs(["bash", "mcp:", "read"]);

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error.type).toBe("PARSE_ERROR");
		expect(result.error.message).toContain("empty server name");
	});
});
