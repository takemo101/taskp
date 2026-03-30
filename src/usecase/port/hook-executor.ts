export type HookContext = {
	readonly sessionId: string;
	readonly skillName: string;
	readonly actionName?: string;
	readonly mode: "template" | "agent";
	readonly status: "success" | "failed";
	readonly durationMs: number;
	readonly error?: string;
	readonly callerSkill?: string;
};

export type HookResult = {
	readonly command: string;
	readonly success: boolean;
	readonly error?: string;
};

export interface HookExecutorPort {
	execute(commands: readonly string[], context: HookContext): Promise<readonly HookResult[]>;
}
