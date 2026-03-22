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
import {
	buildSkillOptionsWithActions,
	filterSkills,
	type SkillOption,
} from "../components/fuzzy-select";
import { KeyHelp } from "../components/key-help";
import { flatSelectStyle } from "../components/styles";

const CONTAINER_ID = "selector-container";

export type SkillSelection = {
	readonly skill: Skill;
	readonly actionName?: string;
};

export async function showSkillSelector(
	renderer: CliRenderer,
	skills: readonly Skill[],
): Promise<SkillSelection | null> {
	return new Promise((resolve) => {
		clearScreen(renderer);

		const allOptions = buildSkillOptionsWithActions(
			skills.map((s) => ({
				name: s.metadata.name,
				description: s.metadata.description,
				actions: s.metadata.actions,
			})),
		);

		const skillsWithActions = new Set(
			skills.filter((s) => s.metadata.actions).map((s) => s.metadata.name),
		);

		const expandedSkills = new Set<string>();

		const getVisibleOptions = (options: readonly SkillOption[]): SkillOption[] =>
			options.filter((opt) => {
				if (!opt.parentSkillName) return true;
				return expandedSkills.has(opt.parentSkillName);
			});

		const toSelectOptions = (filtered: SkillOption[]): SelectOption[] =>
			filtered.map((s) => {
				const indicator = getExpandIndicator(s, skillsWithActions, expandedSkills);
				return {
					name: s.name,
					description: `${s.description}${indicator}`,
					value: s.name,
				};
			});

		let currentFiltered = getVisibleOptions(allOptions);
		let isSearchActive = false;

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
			options: toSelectOptions(currentFiltered),
			showDescription: true,
			wrapSelection: true,
			...flatSelectStyle,
		});

		const help = KeyHelp([
			{ key: "↑↓", description: "Navigate" },
			{ key: "Enter", description: "Select/Expand" },
			{ key: "Esc", description: "Quit" },
		]);

		container.add(searchInput);
		container.add(selectList);
		container.add(help);
		renderer.root.add(container);

		const refreshList = () => {
			currentFiltered = getVisibleOptions(
				isSearchActive ? filterSkills(searchInput.value, allOptions) : allOptions,
			);
			selectList.options = toSelectOptions(currentFiltered);
		};

		searchInput.on(InputRenderableEvents.INPUT, (query: string) => {
			isSearchActive = query !== "";
			if (isSearchActive) {
				autoExpandForSearch(query, allOptions, expandedSkills);
			}
			refreshList();
		});

		selectList.on(SelectRenderableEvents.ITEM_SELECTED, (_index: number, option: SelectOption) => {
			const selected = currentFiltered.find((o) => o.name === option.value);
			if (!selected) return;

			if (!selected.parentSkillName && skillsWithActions.has(selected.name)) {
				toggleExpand(selected.name, expandedSkills);
				refreshList();
				return;
			}

			cleanup();

			const skill = skills.find(
				(s) => s.metadata.name === (selected.parentSkillName ?? selected.name),
			);
			if (!skill) {
				resolve(null);
				return;
			}

			resolve({
				skill,
				actionName: selected.actionName,
			});
		});

		const keyHandler = (key: KeyEvent) => {
			if (key.name === "escape") {
				cleanup();
				resolve(null);
				return;
			}

			if (searchInput.focused && (key.name === "down" || key.name === "up")) {
				selectList.focus();
				return;
			}

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

function getExpandIndicator(
	option: SkillOption,
	skillsWithActions: Set<string>,
	expandedSkills: Set<string>,
): string {
	if (option.parentSkillName) return "";
	if (!skillsWithActions.has(option.name)) return "";
	return expandedSkills.has(option.name) ? "  ▼" : "  ▶";
}

function toggleExpand(skillName: string, expandedSkills: Set<string>): void {
	if (expandedSkills.has(skillName)) {
		expandedSkills.delete(skillName);
	} else {
		expandedSkills.add(skillName);
	}
}

function autoExpandForSearch(
	query: string,
	allOptions: readonly SkillOption[],
	expandedSkills: Set<string>,
): void {
	const matched = filterSkills(query, allOptions);
	for (const opt of matched) {
		if (opt.parentSkillName) {
			expandedSkills.add(opt.parentSkillName);
		}
	}
}

function clearScreen(renderer: CliRenderer): void {
	for (const child of renderer.root.getChildren()) {
		renderer.root.remove(child.id);
	}
}
