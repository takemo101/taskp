import type { SkillInput } from "./skill-input";

// SkillInput の validate は Zod スキーマで正規表現として検証済みのため、
// ここでの new RegExp は必ず成功する。失敗は契約違反（Defect）
function checkInputError(input: SkillInput, value: string): string | undefined {
	if (value === "" && input.required !== false) {
		return `"${input.name}" is required`;
	}

	if (value !== "" && input.validate !== undefined) {
		const regex = new RegExp(input.validate);
		if (!regex.test(value)) {
			return `"${input.name}" must match pattern: ${input.validate}`;
		}
	}

	return undefined;
}

export { checkInputError };
