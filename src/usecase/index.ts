// Use cases

// Ports (interfaces for adapters)
export type {
	CommandExecutor,
	ExecOptions,
	ExecResult,
	InitOptions,
	PromptCollector,
	SkillInitializer,
	SkillRepository,
} from "./port";
export type { CommandResult, RunOutput, RunSkillDeps, RunSkillInput } from "./run-skill";
export { runSkill } from "./run-skill";
