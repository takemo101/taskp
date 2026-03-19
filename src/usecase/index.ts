// Use cases

export type { InitOutput, InitSkillInput } from "./init-skill";
export { initSkill } from "./init-skill";

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
