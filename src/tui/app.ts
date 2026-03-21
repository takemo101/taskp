import type { LanguageModelV3 } from "@ai-sdk/provider";
import { createCliRenderer } from "@opentui/core";
import { createLanguageModel, resolveModelSpec } from "../adapter/ai-provider";
import { createCommandRunner } from "../adapter/command-runner";
import { createDefaultConfigLoader } from "../adapter/config-loader";
import { createHookExecutor } from "../adapter/hook-executor";
import { createDefaultSkillLoader } from "../adapter/skill-loader";
import type { HooksConfig } from "../usecase/hook-runner";
import { copyToClipboard } from "./clipboard";
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
	readonly provider?: string;
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
			console.log("No skills found.");
			return;
		}

		const { model, hooksConfig, commandTimeoutMs } = await resolveModelAndConfig(options);

		const commandExecutor = createCommandRunner({ defaultTimeoutMs: commandTimeoutMs });
		const hookExecutor = createHookExecutor(commandExecutor);
		const executionDeps: ExecutionDeps = {
			commandExecutor,
			hookExecutor,
			hooksConfig,
			skillRepositoryFactory: createSingleSkillRepository,
			promptCollectorFactory: createPresetPromptCollector,
		};

		while (true) {
			const skill = await showSkillSelector(renderer, skills);
			if (!skill) break;

			const variables = await showInputForm(renderer, skill);
			if (!variables) continue;

			const action = await showExecution(renderer, skill, variables, model, executionDeps);
			if (action === "exit") break;
		}
	} finally {
		renderer.destroy();
	}
}

type ModelAndConfig = {
	readonly model: LanguageModelV3 | null;
	readonly hooksConfig: HooksConfig | undefined;
	readonly commandTimeoutMs: number | undefined;
};

// config.toml からデフォルトの LLM モデルとフック設定を解決する。
// モデル解決がいずれかの段階で失敗した場合は null を返す（agent モード実行時にエラー表示）
async function resolveModelAndConfig(options?: TuiOptions): Promise<ModelAndConfig> {
	const configLoader = createDefaultConfigLoader(process.cwd());
	const configResult = await configLoader.load();
	if (!configResult.ok) return { model: null, hooksConfig: undefined, commandTimeoutMs: undefined };

	const hooksConfig = configResult.value.hooks;
	const commandTimeoutMs = configResult.value.cli?.command_timeout_ms;

	const aiConfig = configResult.value.ai ?? {};
	const specResult = resolveModelSpec({
		cliModel: options?.model,
		cliProvider: options?.provider,
		config: aiConfig,
	});
	if (!specResult.ok) return { model: null, hooksConfig, commandTimeoutMs };

	const modelResult = createLanguageModel(specResult.value, aiConfig);
	if (!modelResult.ok) return { model: null, hooksConfig, commandTimeoutMs };

	return { model: modelResult.value, hooksConfig, commandTimeoutMs };
}
