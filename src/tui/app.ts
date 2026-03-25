import type { LanguageModelV3 } from "@ai-sdk/provider";
import { createCliRenderer } from "@opentui/core";
import { createLanguageModel, type ModelSpec, resolveModelSpec } from "../adapter/ai-provider";
import { createCommandRunner } from "../adapter/command-runner";
import { createDefaultConfigLoader } from "../adapter/config-loader";
import { createConsoleLogger } from "../adapter/console-logger";
import { createHookExecutor } from "../adapter/hook-executor";
import { createDefaultSkillLoader } from "../adapter/skill-loader";
import { createSystemPromptResolver } from "../adapter/system-prompt-resolver";
import { resolveActionConfig } from "../core/skill/action";
import type { Skill } from "../core/skill/skill";
import type { SkillInput } from "../core/skill/skill-input";
import type { HooksConfig } from "../usecase/hook-runner";
import { copyToClipboard } from "./clipboard";
import { showEmptyState } from "./screens/empty-state";
import {
	createPresetPromptCollector,
	createSingleSkillRepository,
	type ExecutionDeps,
	showExecution,
} from "./screens/execution-view";
import { showInputForm } from "./screens/input-form";
import { showSkillSelector } from "./screens/skill-selector";

export type TuiOptions = {
	readonly model?: string;
};

export async function startTui(options?: TuiOptions): Promise<void> {
	const renderer = await createCliRenderer({
		exitOnCtrlC: true,
		targetFps: 30,
	});

	try {
		renderer.on("selection", (selection) => {
			const text = selection.getSelectedText();
			if (text) {
				copyToClipboard(text);
			}
		});

		const skillRepository = createDefaultSkillLoader(process.cwd());
		const { skills } = await skillRepository.listAll();

		if (skills.length === 0) {
			await showEmptyState(renderer);
			return;
		}

		const { model, modelSpec, hooksConfig, commandTimeoutMs } =
			await resolveModelAndConfig(options);

		const commandExecutor = createCommandRunner({ defaultTimeoutMs: commandTimeoutMs });
		const logger = createConsoleLogger();
		const hookExecutor = createHookExecutor(commandExecutor, logger);
		const executionDeps: ExecutionDeps = {
			commandExecutor,
			hookExecutor,
			hooksConfig,
			skillRepositoryFactory: createSingleSkillRepository,
			promptCollectorFactory: createPresetPromptCollector,
			systemPromptResolver: createSystemPromptResolver(process.cwd()),
		};

		while (true) {
			const selection = await showSkillSelector(renderer, skills);
			if (!selection) break;

			const { skill, actionName } = selection;

			const actionInputs = resolveActionInputs(skill, actionName);
			const variables = await showInputForm(renderer, skill, actionInputs);
			if (!variables) continue;

			const navAction = await showExecution(
				renderer,
				{ skill, variables, model, modelSpec, actionName },
				executionDeps,
			);
			if (navAction === "exit") break;
		}
	} finally {
		renderer.destroy();
	}
}

type ModelAndConfig = {
	readonly model: LanguageModelV3 | null;
	readonly modelSpec: ModelSpec | null;
	readonly hooksConfig: HooksConfig | undefined;
	readonly commandTimeoutMs: number | undefined;
};

// config.toml からデフォルトの LLM モデルとフック設定を解決する。
// モデル解決がいずれかの段階で失敗した場合は null を返す（agent モード実行時にエラー表示）
async function resolveModelAndConfig(options?: TuiOptions): Promise<ModelAndConfig> {
	const configLoader = createDefaultConfigLoader(process.cwd());
	const configResult = await configLoader.load();
	if (!configResult.ok)
		return { model: null, modelSpec: null, hooksConfig: undefined, commandTimeoutMs: undefined };

	const hooksConfig = configResult.value.hooks;
	const commandTimeoutMs = configResult.value.cli?.command_timeout_ms;

	const aiConfig = configResult.value.ai ?? {};
	const specResult = resolveModelSpec({
		cliModel: options?.model,
		config: aiConfig,
	});
	if (!specResult.ok) return { model: null, modelSpec: null, hooksConfig, commandTimeoutMs };

	const modelResult = createLanguageModel(specResult.value, aiConfig);
	if (!modelResult.ok) return { model: null, modelSpec: null, hooksConfig, commandTimeoutMs };

	return { model: modelResult.value, modelSpec: specResult.value, hooksConfig, commandTimeoutMs };
}

function resolveActionInputs(skill: Skill, actionName?: string): readonly SkillInput[] | undefined {
	if (!actionName || !skill.metadata.actions) return undefined;
	const action = skill.metadata.actions[actionName];
	if (!action) return undefined;
	return resolveActionConfig(action, skill.metadata).inputs;
}
