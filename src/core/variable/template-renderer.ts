import { dirname } from "node:path";
import { type RenderError, renderError } from "../types/errors";
import { err, ok, type Result } from "../types/result";

export type ReservedVars = {
	readonly cwd: string;
	readonly skillDir: string;
	readonly date: string;
	readonly timestamp: string;
};

export function buildReservedVars(skillLocation: string): ReservedVars {
	return {
		cwd: process.cwd(),
		skillDir: dirname(skillLocation),
		date: new Date().toISOString().split("T")[0],
		timestamp: new Date().toISOString(),
	};
}

const VARIABLE_PATTERN = /\{\{(\w+)\}\}/g;

// {{#if var}}...{{else}}...{{/if}} のパターン（else 節は省略可能）
// ネスト非対応: 内側に別の {{#if}} を含めることはできない（KISS）
const CONDITIONAL_PATTERN = /\{\{#if\s+(\w+)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g;

const NESTED_IF_PATTERN = /\{\{#if\s+\w+\}\}/;

// 閉じタグ忘れ・孤立した {{else}} / {{/if}} を検出するためのパターン
const OPENING_IF_PATTERN = /\{\{#if\s+\w+\}\}/g;
const CLOSING_IF_PATTERN = /\{\{\/if\}\}/g;
const ELSE_PATTERN = /\{\{else\}\}/g;

// 条件ブロックの構文バリデーション。
// CONDITIONAL_PATTERN による展開はペアが揃った場合のみマッチするため、
// 不正な構文がサイレントに残るのを防ぐ。
function validateConditionalSyntax(template: string): RenderError | undefined {
	const opens = [...template.matchAll(OPENING_IF_PATTERN)].length;
	const closes = [...template.matchAll(CLOSING_IF_PATTERN)].length;
	const elses = [...template.matchAll(ELSE_PATTERN)].length;

	if (opens > closes) {
		return renderError("Unclosed {{#if}} block: missing {{/if}}");
	}
	if (opens < closes) {
		return renderError("Unexpected {{/if}} without matching {{#if}}");
	}
	if (elses > opens) {
		return renderError("Unexpected {{else}} without matching {{#if}}");
	}
	return undefined;
}

// 予約変数は __ で囲むことでユーザー定義変数との衝突を防止
const RESERVED_VAR_MAP: Record<string, keyof ReservedVars> = {
	__cwd__: "cwd",
	__skill_dir__: "skillDir",
	__date__: "date",
	__timestamp__: "timestamp",
};

function resolveVariable(
	name: string,
	variables: Record<string, string>,
	reserved: ReservedVars,
): string | undefined {
	const reservedKey = RESERVED_VAR_MAP[name];
	if (reservedKey !== undefined) {
		return reserved[reservedKey];
	}
	return variables[name];
}

// テンプレート変数の文字列値を真偽値にパースする。
// confirm 型の "false" と未入力の空文字を false として扱う。
function parseBooleanLike(value: string): boolean {
	return value !== "" && value !== "false";
}

function checkForNestedIfs(template: string): RenderError | undefined {
	for (const match of template.matchAll(CONDITIONAL_PATTERN)) {
		const ifBlock = match[2];
		const elseBlock = match[3] ?? "";
		if (NESTED_IF_PATTERN.test(ifBlock) || NESTED_IF_PATTERN.test(elseBlock)) {
			return renderError("Nested {{#if}} blocks are not supported");
		}
	}
	return undefined;
}

function expandConditionals(
	template: string,
	variables: Record<string, string>,
	reserved: ReservedVars,
): Result<string, RenderError> {
	const nestedError = checkForNestedIfs(template);
	if (nestedError !== undefined) {
		return err(nestedError);
	}

	const undefinedConditionVars: string[] = [];

	const expanded = template.replace(
		CONDITIONAL_PATTERN,
		(_match, name: string, ifBlock: string, elseBlock: string | undefined) => {
			const value = resolveVariable(name, variables, reserved);
			if (value === undefined) {
				undefinedConditionVars.push(name);
				return "";
			}
			return parseBooleanLike(value) ? ifBlock : (elseBlock ?? "");
		},
	);

	if (undefinedConditionVars.length > 0) {
		const unique = [...new Set(undefinedConditionVars)];
		return err(renderError(`Undefined variables: ${unique.join(", ")}`));
	}

	return ok(expanded);
}

function findUndefinedVariables(
	template: string,
	variables: Record<string, string>,
	reserved: ReservedVars,
): readonly string[] {
	const undefined_: string[] = [];
	for (const match of template.matchAll(VARIABLE_PATTERN)) {
		const name = match[1];
		if (resolveVariable(name, variables, reserved) === undefined) {
			undefined_.push(name);
		}
	}
	return [...new Set(undefined_)];
}

export function renderTemplate(
	template: string,
	variables: Record<string, string>,
	reserved: ReservedVars,
): Result<string, RenderError> {
	// 1. 条件ブロックの構文バリデーション（閉じタグ忘れ等を早期検出）
	const syntaxError = validateConditionalSyntax(template);
	if (syntaxError !== undefined) {
		return err(syntaxError);
	}

	// 2. 条件ブロックを展開し、選択されなかった分岐内の変数を除外する
	const conditionalResult = expandConditionals(template, variables, reserved);
	if (!conditionalResult.ok) {
		return conditionalResult;
	}
	const expanded = conditionalResult.value;

	// 3. 残りの変数で未定義チェック
	// （Parse, Don't Validate の原則: docs/arch/design-principles.md）
	const undefinedVars = findUndefinedVariables(expanded, variables, reserved);
	if (undefinedVars.length > 0) {
		return err(renderError(`Undefined variables: ${undefinedVars.join(", ")}`));
	}

	const rendered = expanded.replace(VARIABLE_PATTERN, (_, name: string) => {
		const value = resolveVariable(name, variables, reserved);
		if (value === undefined) {
			throw new Error(`unreachable: variable '${name}' was validated but is undefined`);
		}
		return value;
	});

	return ok(rendered);
}
