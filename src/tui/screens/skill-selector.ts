import {
	BoxRenderable,
	type CliRenderer,
	InputRenderable,
	InputRenderableEvents,
	type KeyEvent,
	type SelectOption,
	SelectRenderable,
	SelectRenderableEvents,
} from "@opentui/core";
import type { Skill } from "../../core/skill/skill";
import { filterSkills, type SkillOption } from "../components/fuzzy-select";
import { KeyHelp } from "../components/key-help";
import { flatSelectStyle } from "../components/styles";

const CONTAINER_ID = "selector-container";

export async function showSkillSelector(
	renderer: CliRenderer,
	skills: readonly Skill[],
): Promise<Skill | null> {
	return new Promise((resolve) => {
		clearScreen(renderer);

		const skillOptions: SkillOption[] = skills.map((s) => ({
			name: s.metadata.name,
			description: s.metadata.description,
		}));

		const toSelectOptions = (filtered: SkillOption[]): SelectOption[] =>
			filtered.map((s) => ({
				name: s.name,
				description: s.description,
				value: s.name,
			}));

		const container = new BoxRenderable(renderer, {
			id: CONTAINER_ID,
			width: "100%",
			height: "100%",
			borderStyle: "rounded",
			title: "taskp",
			padding: 1,
			flexDirection: "column",
			justifyContent: "flex-start",
		});

		const searchInput = new InputRenderable(renderer, {
			id: "search-input",
			width: "100%",
			placeholder: "Search skills...",
		});

		const selectList = new SelectRenderable(renderer, {
			id: "skill-list",
			width: "100%",
			flexGrow: 1,
			options: toSelectOptions(skillOptions),
			showDescription: true,
			wrapSelection: true,
			...flatSelectStyle,
		});

		const help = KeyHelp([
			{ key: "↑↓", description: "移動" },
			{ key: "Enter", description: "選択" },
			{ key: "Esc", description: "終了" },
		]);

		container.add(searchInput);
		container.add(selectList);
		container.add(help);
		renderer.root.add(container);

		// ファジー検索: 入力ごとにリストを更新
		searchInput.on(InputRenderableEvents.INPUT, (query: string) => {
			const filtered = filterSkills(query, skillOptions);
			selectList.options = toSelectOptions(filtered);
		});

		// Enter でスキル選択を確定
		selectList.on(SelectRenderableEvents.ITEM_SELECTED, (_index: number, option: SelectOption) => {
			cleanup();
			const selected = skills.find((s) => s.metadata.name === option.value);
			resolve(selected ?? null);
		});

		const keyHandler = (key: KeyEvent) => {
			if (key.name === "escape") {
				cleanup();
				resolve(null);
				return;
			}

			// 検索入力にフォーカス中、↑↓ でリストにフォーカス移動
			if (searchInput.focused && (key.name === "down" || key.name === "up")) {
				selectList.focus();
				return;
			}

			// リストにフォーカス中、文字入力で検索入力にフォーカス移動
			if (selectList.focused && key.name.length === 1 && !key.ctrl && !key.meta) {
				searchInput.focus();
			}
		};

		renderer.keyInput.on("keypress", keyHandler);

		function cleanup(): void {
			renderer.keyInput.off("keypress", keyHandler);
			renderer.root.remove(CONTAINER_ID);
		}

		searchInput.focus();
	});
}

function clearScreen(renderer: CliRenderer): void {
	for (const child of renderer.root.getChildren()) {
		renderer.root.remove(child.id);
	}
}
