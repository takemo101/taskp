import type { Tool } from "ai";
import { z } from "zod";
import { zodToJsonSchema } from "./schema-helper";

export const MAX_FETCH_LENGTH = 50_000;
const FETCH_TIMEOUT_MS = 30_000;

const PRIVATE_IP_PREFIXES = ["10.", "172.", "192.168."] as const;
const BLOCKED_HOSTNAMES = [
	"localhost",
	"127.0.0.1",
	"[::1]",
	"0.0.0.0",
	"169.254.169.254",
] as const;

export function validateFetchUrl(url: string): void {
	const parsed = new URL(url);

	if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
		throw new Error(`Unsupported protocol: ${parsed.protocol}. Only http and https are allowed.`);
	}

	const { hostname } = parsed;
	const isBlocked =
		(BLOCKED_HOSTNAMES as readonly string[]).includes(hostname) ||
		PRIVATE_IP_PREFIXES.some((prefix) => hostname.startsWith(prefix));

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

type FetchResult = {
	readonly content: string;
	readonly truncated: boolean;
	readonly length: number;
};

function isTextContentType(contentType: string): boolean {
	return (
		contentType.includes("text/") ||
		contentType.includes("application/json") ||
		contentType.includes("application/xml")
	);
}

export const fetchTool: Tool<FetchInput, FetchResult> = {
	description:
		"Fetch text content from a URL (http/https only). Useful for reading documentation, API references, or web pages.",
	inputSchema: zodToJsonSchema(fetchParams),
	execute: async ({ url, maxLength }) => {
		validateFetchUrl(url);

		const response = await fetch(url, {
			signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		const contentType = response.headers.get("content-type") ?? "";
		if (!isTextContentType(contentType)) {
			throw new Error(`Non-text content type: ${contentType}. Only text content is supported.`);
		}

		const text = await response.text();
		const limit = maxLength ?? MAX_FETCH_LENGTH;
		const truncated = text.length > limit;
		const content = truncated ? text.slice(0, limit) : text;

		return { content, truncated, length: text.length };
	},
};
