export type ToolOutput<T extends Record<string, unknown>> = {
	readonly success: true;
	readonly data: T;
};

export type ToolError = {
	readonly success: false;
	readonly error: string;
};

export type ToolResult<T extends Record<string, unknown>> = ToolOutput<T> | ToolError;

export function toolSuccess<T extends Record<string, unknown>>(data: T): ToolOutput<T> {
	return { success: true, data };
}

export function toolFailure(error: string): ToolError {
	return { success: false, error };
}
