import type { LanguageModelV3 } from "@ai-sdk/provider";
import { createCliRenderer } from "@opentui/core";
import { createLanguageModel, resolveModelSpec } from "../adapter/ai-provider";
import { createDefaultConfigLoader } from "../adapter/config-loader";
import { createDefaultSkillLoader } from "../adapter/skill-loader";
import { copyToClipboard } from "./clipboard";
import { showExecution } from "./screens/execution-view";
import { showInputForm } from "./screens/input-form";
import { showSkillSelector } from "./screens/skill-selector";

export async function startTui(): Promise<void> {
	const renderer = await createCliRenderer({
		exitOnCtrlC: true,
		targetFps: 30,
	});

	renderer.on("selection", (selection) => {
		const text = selection.getSelectedText();
		if (text) {
			copyToClipboard(text);
		}
	});

	const skillRepository = createDefaultSkillLoader(process.cwd());
	const skills = await skillRepository.listAll();

	if (skills.length === 0) {
		renderer.destroy();
		console.log("No skills found.");
		return;
	}

	const model = await resolveModel();

	while (true) {
		const skill = await showSkillSelector(renderer, skills);
		if (!skill) break;

		const variables = await showInputForm(renderer, skill);
		if (!variables) continue;

		const action = await showExecution(renderer, skill, variables, model);
		if (action === "exit") break;
	}

	renderer.destroy();
}

// config.toml からデフォルトの LLM モデルを解決する。
// いずれかの段階で失敗した場合は null を返す（agent モード実行時にエラー表示）
async function resolveModel(): Promise<LanguageModelV3 | null> {
	const configLoader = createDefaultConfigLoader(process.cwd());
	const configResult = await configLoader.load();
	if (!configResult.ok) return null;

	const aiConfig = configResult.value.ai ?? {};
	const specResult = resolveModelSpec({ config: aiConfig });
	if (!specResult.ok) return null;

	const modelResult = createLanguageModel(specResult.value, aiConfig);
	if (!modelResult.ok) return null;

	return modelResult.value;
}
