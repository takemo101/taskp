// 文字列リテラル型ではなく const オブジェクトで定義することで、
// エラー型の判別と EXIT_CODE マッピングの両方で単一の定義を参照できる
export const ErrorType = {
	SkillNotFound: "SKILL_NOT_FOUND",
	Parse: "PARSE_ERROR",
	Render: "RENDER_ERROR",
	Execution: "EXECUTION_ERROR",
	Config: "CONFIG_ERROR",
} as const;

export type ErrorType = (typeof ErrorType)[keyof typeof ErrorType];

export type SkillNotFoundError = {
	readonly type: typeof ErrorType.SkillNotFound;
	readonly name: string;
};

export type ParseError = {
	readonly type: typeof ErrorType.Parse;
	readonly message: string;
};

export type RenderError = {
	readonly type: typeof ErrorType.Render;
	readonly message: string;
};

export type ExecutionError = {
	readonly type: typeof ErrorType.Execution;
	readonly message: string;
};

export type ConfigError = {
	readonly type: typeof ErrorType.Config;
	readonly message: string;
};

export type DomainError =
	| SkillNotFoundError
	| ParseError
	| RenderError
	| ExecutionError
	| ConfigError;

// 終了コードを種別ごとに分けることで、シェルスクリプトから
// エラー原因を判別できるようにしている（Render は Execution と同系統なので 1）
export const EXIT_CODE: Record<ErrorType, number> = {
	[ErrorType.Execution]: 1,
	[ErrorType.SkillNotFound]: 2,
	[ErrorType.Parse]: 3,
	[ErrorType.Config]: 4,
	[ErrorType.Render]: 1,
};

export function skillNotFoundError(name: string): SkillNotFoundError {
	return { type: ErrorType.SkillNotFound, name };
}

export function parseError(message: string): ParseError {
	return { type: ErrorType.Parse, message };
}

export function renderError(message: string): RenderError {
	return { type: ErrorType.Render, message };
}

export function executionError(message: string): ExecutionError {
	return { type: ErrorType.Execution, message };
}

export function configError(message: string): ConfigError {
	return { type: ErrorType.Config, message };
}
