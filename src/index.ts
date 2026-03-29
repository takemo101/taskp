// taskp public API

// MCP tool references
export type { McpToolRef } from "./core/execution/mcp-tool-ref";
export { isMcpToolRef, parseMcpToolRef, partitionToolRefs } from "./core/execution/mcp-tool-ref";
// Core domain types
export type { Skill, SkillScope } from "./core/skill/skill";
export { parseSkill } from "./core/skill/skill";
export type { SkillBody } from "./core/skill/skill-body";
export type { InputType } from "./core/skill/skill-input";
export { parseSkillInput } from "./core/skill/skill-input";
export type {
	ContextSource,
	SkillInput,
	SkillMetadata,
	SkillMode,
} from "./core/skill/skill-metadata";
export { parseSkillMetadata } from "./core/skill/skill-metadata";
// Error types
export type {
	ConfigError,
	DomainError,
	ExecutionError,
	ParseError,
	RenderError,
	SkillNotFoundError,
} from "./core/types/errors";
export {
	configError,
	ErrorType,
	executionError,
	parseError,
	renderError,
	skillNotFoundError,
} from "./core/types/errors";
// Result type
export type { Result } from "./core/types/result";
export { err, flatMap, isErr, isOk, map, ok } from "./core/types/result";
export type { InitOutput, InitSkillInput } from "./usecase/init-skill";
// Use cases
export { initSkill } from "./usecase/init-skill";
export type { ListOutput, ListSkillsFilter, ListSkillsUseCase } from "./usecase/list-skills";
export { createListSkillsUseCase } from "./usecase/list-skills";
export type {
	AgentExecutorInput,
	AgentExecutorPort,
	AgentExecutorResult,
} from "./usecase/port/agent-executor";
export type { CommandExecutor, ExecOptions, ExecResult } from "./usecase/port/command-executor";
export type { ContextCollectorPort } from "./usecase/port/context-collector";
export type {
	McpToolResolverPort,
	ResolvedMcpToolSet,
} from "./usecase/port/mcp-tool-resolver";
export type { PromptCollector } from "./usecase/port/prompt-collector";
export type { InitOptions, SkillInitializer } from "./usecase/port/skill-initializer";
// Port interfaces
export type {
	SkillLoadFailure,
	SkillLoadResult,
	SkillRepository,
} from "./usecase/port/skill-repository";
export type {
	RunAgentSkillDeps,
	RunAgentSkillInput,
	RunAgentSkillOutput,
} from "./usecase/run-agent-skill";
export { runAgentSkill } from "./usecase/run-agent-skill";
export type { CommandResult, RunOutput, RunSkillDeps, RunSkillInput } from "./usecase/run-skill";
export { runSkill } from "./usecase/run-skill";
export type { ShowOutput } from "./usecase/show-skill";
export { showSkill } from "./usecase/show-skill";
