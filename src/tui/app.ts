import { createCliRenderer } from "@opentui/core";
import { createDefaultSkillLoader } from "../adapter/skill-loader";
import { showSkillSelector } from "./screens/skill-selector";

export async function startTui(): Promise<void> {
	const renderer = await createCliRenderer({
		exitOnCtrlC: true,
		targetFps: 30,
	});

	const skillRepository = createDefaultSkillLoader(process.cwd());
	const skills = await skillRepository.listAll();

	if (skills.length === 0) {
		renderer.destroy();
		console.log("No skills found.");
		return;
	}

	while (true) {
		const skill = await showSkillSelector(renderer, skills);
		if (!skill) break;

		// TODO: 入力フォーム → 実行（後続 Issue で実装）
	}

	renderer.destroy();
}
