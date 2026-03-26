import type { Tool } from "ai";
import { z } from "zod";
import { zodToJsonSchema } from "./schema-helper";
import { DEFAULT_TOOL_TIMEOUT_MS } from "./tool-constants";
import { type ToolResult, toolFailure, toolSuccess } from "./tool-output";

export const MAX_FETCH_LENGTH = 50_000;

const PRIVATE_IP_PREFIXES = ["10.", "192.168."] as const;
const BLOCKED_HOSTNAMES = [
	"localhost",
	"127.0.0.1",
	"[::1]",
	"0.0.0.0",
	"169.254.169.254",
] as const;

/** RFC 1918: 172.16.0.0/12 (172.16.0.0 – 172.31.255.255) */
function isPrivate172Block(hostname: string): boolean {
	if (!hostname.startsWith("172.")) return false;
	const secondOctet = Number.parseInt(hostname.split(".")[1], 10);
	return secondOctet >= 16 && secondOctet <= 31;
}

export function validateFetchUrl(url: string): void {
	const parsed = new URL(url);

	if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
		throw new Error(`Unsupported protocol: ${parsed.protocol}. Only http and https are allowed.`);
	}

	const { hostname } = parsed;
	const isBlocked =
		(BLOCKED_HOSTNAMES as readonly string[]).includes(hostname) ||
		PRIVATE_IP_PREFIXES.some((prefix) => hostname.startsWith(prefix)) ||
		isPrivate172Block(hostname);

	if (isBlocked) {
		throw new Error(`Access to internal/private addresses is not allowed: ${hostname}`);
	}
}

export const fetchParams = z.object({
	url: z.string().url().describe("URL to fetch (http or https only)"),
	maxLength: z
		.number()
		.optional()
		.describe("Maximum response length in characters (default: 50000)"),
});

type FetchInput = z.infer<typeof fetchParams>;

type FetchData = {
	readonly content: string;
	readonly truncated: boolean;
	readonly length: number;
};

export type { FetchData };

/** @internal テスト用に export */
export function isTextContentType(contentType: string): boolean {
	return (
		contentType.includes("text/") ||
		contentType.includes("application/json") ||
		contentType.includes("application/xml") ||
		contentType.includes("+json") ||
		contentType.includes("+xml") ||
		contentType.includes("application/javascript")
	);
}

export const fetchTool: Tool<FetchInput, ToolResult<FetchData>> = {
	description:
		"Fetch text content from a URL (http/https only). Useful for reading documentation, API references, or web pages.",
	inputSchema: zodToJsonSchema(fetchParams),
	execute: async ({ url, maxLength }): Promise<ToolResult<FetchData>> => {
		try {
			validateFetchUrl(url);
		} catch (e) {
			return toolFailure(e instanceof Error ? e.message : String(e));
		}

		let response: Response;
		try {
			response = await fetch(url, {
				signal: AbortSignal.timeout(DEFAULT_TOOL_TIMEOUT_MS),
				redirect: "error",
			});
		} catch {
			return toolFailure(`Failed to fetch: ${url}`);
		}

		if (!response.ok) {
			return toolFailure(`HTTP ${response.status}: ${response.statusText}`);
		}

		const contentType = response.headers.get("content-type") ?? "";
		if (!isTextContentType(contentType)) {
			return toolFailure(`Non-text content type: ${contentType}. Only text content is supported.`);
		}

		const text = await response.text();
		const limit = maxLength ?? MAX_FETCH_LENGTH;
		const truncated = text.length > limit;
		const content = truncated ? text.slice(0, limit) : text;

		return toolSuccess({ content, truncated, length: text.length });
	},
};
