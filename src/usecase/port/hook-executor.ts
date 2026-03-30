import type { SessionId } from "../../core/execution/session";

export type HookContext = {
	readonly skillName: string;
	readonly actionName?: string;
	readonly mode: "template" | "agent";
	readonly status: "success" | "failed";
	readonly durationMs: number;
	readonly error?: string;
	readonly callerSkill?: string;
	readonly sessionId: SessionId;
};

/** before フック用コンテキスト（実行前なので status / durationMs / error を持たない） */
export type BeforeHookContext = {
	readonly skillName: string;
	readonly actionName?: string;
	readonly mode: "template" | "agent";
	readonly outputFile: string;
	readonly callerSkill?: string;
	readonly sessionId: SessionId;
};

/** after / on_failure フック用コンテキスト */
export type AfterHookContext = {
	readonly skillName: string;
	readonly actionName?: string;
	readonly mode: "template" | "agent";
	readonly status: "success" | "failed";
	readonly durationMs: number;
	readonly error?: string;
	readonly outputFile: string;
	readonly callerSkill?: string;
	readonly sessionId: SessionId;
};

export type HookResult = {
	readonly command: string;
	readonly success: boolean;
	readonly error?: string;
};

export type SkillHookContext = BeforeHookContext | AfterHookContext;

export type HookPhase = "before" | "after" | "on_failure";

export interface HookExecutorPort {
	execute(
		commands: readonly string[],
		context: HookContext | SkillHookContext,
		phase?: HookPhase,
	): Promise<readonly HookResult[]>;
}
