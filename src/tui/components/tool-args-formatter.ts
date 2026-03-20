const TRUNCATE_LENGTH = 60;

export function formatToolArgs(toolName: string, args: Record<string, unknown>): string {
	switch (toolName) {
		case "bash":
			return truncate(String(args.command), TRUNCATE_LENGTH);
		case "read":
			return String(args.path);
		case "write":
			return String(args.path);
		case "glob":
			return String(args.pattern);
		default:
			return truncate(JSON.stringify(args), TRUNCATE_LENGTH);
	}
}

function truncate(text: string, maxLength: number): string {
	return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}
