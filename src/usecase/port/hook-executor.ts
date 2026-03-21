export type HookContext = {
	readonly skillName: string;
	readonly mode: "template" | "agent";
	readonly status: "success" | "failed";
	readonly durationMs: number;
	readonly error?: string;
};

export type HookResult = {
	readonly command: string;
	readonly success: boolean;
	readonly error?: string;
};

export interface HookExecutorPort {
	execute(commands: readonly string[], context: HookContext): Promise<readonly HookResult[]>;
}
