import type {
	InputRenderable,
	SelectRenderable,
	TextareaRenderable,
	TextRenderable,
} from "@opentui/core";
import type { SkillInput } from "../../../core/skill/skill-input";

type FormElement = {
	readonly input: SkillInput;
	readonly label: TextRenderable;
	readonly element: InputRenderable | SelectRenderable | TextareaRenderable;
	readonly errorLabel: TextRenderable;
};

export type { FormElement };
