import type { ContextSource } from "../core/skill/context-source";
import type { SkillInput } from "../core/skill/skill-input";
import type { ProgressWriter } from "../usecase/port/progress-writer";

/** 入力定義と回答済み変数を「✔ 質問文 回答」の形式でフォーマットする */
export function formatInputs(
	inputs: readonly SkillInput[],
	variables: Readonly<Record<string, string>>,
): string {
	if (inputs.length === 0) return "";
	const lines: string[] = [];
	for (const input of inputs) {
		const value = variables[input.name];
		if (value === undefined) continue;
		lines.push(`✔ ${input.message} ${value}`);
	}
	return lines.length > 0 ? `${lines.join("\n")}\n` : "";
}

/** コンテキストソースの一覧をフォーマットする */
export function formatContextSources(sources: readonly ContextSource[]): string {
	if (sources.length === 0) return "";
	const lines: string[] = [];
	for (const source of sources) {
		switch (source.type) {
			case "command":
				lines.push(`$ ${source.run}`);
				break;
			case "file":
				lines.push(`📄 ${source.path}`);
				break;
			case "glob":
				lines.push(`📂 ${source.pattern}`);
				break;
			case "url":
				lines.push(`🔗 ${source.url}`);
				break;
		}
	}
	return `${lines.join("\n")}\n`;
}

/** CLI（stdout）向けの ProgressWriter。ANSI dim で表示する */
export function createCliProgressWriter(output: NodeJS.WritableStream): ProgressWriter {
	return {
		writeInputs(inputs, variables) {
			const text = formatInputs(inputs, variables);
			if (text) output.write(`\x1b[2m${text}\x1b[0m`);
		},
		writeContextSources(sources) {
			const text = formatContextSources(sources);
			if (text) output.write(`\x1b[2m${text}\x1b[0m`);
		},
	};
}
