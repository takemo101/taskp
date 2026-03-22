import { getPrimaryArgKey } from "../../core/execution/agent-tools";

const TRUNCATE_LENGTH = 60;

export function formatToolArgs(toolName: string, args: Record<string, unknown>): string {
	const key = getPrimaryArgKey(toolName);
	if (key) return truncate(String(args[key]), TRUNCATE_LENGTH);
	return truncate(JSON.stringify(args), TRUNCATE_LENGTH);
}

function truncate(text: string, maxLength: number): string {
	return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}
