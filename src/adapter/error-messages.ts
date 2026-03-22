// エラーメッセージを一元管理し、将来の多言語対応を可能にする
export const ErrorMessages = {
	OLLAMA_NOT_RUNNING: "Ollama is not running. Start it with:\n\n  ollama serve\n",
	NETWORK_ERROR: "Network error: unable to reach the API server. Check your internet connection.",
	RATE_LIMITED: "Rate limited by the API. Retrying with exponential backoff...",
	ollamaModelMissing: (model: string): string =>
		`Model not found. Download it with:\n\n  ollama pull ${model}\n`,
	serverError: (status: number): string => `Server error (${status}). Retrying...`,
	apiKeyMissingWithEnv: (envVar: string): string =>
		`API key is invalid or missing. Set the ${envVar} environment variable:\n\n  export ${envVar}=your-api-key\n`,
	apiKeyMissingGeneric: (provider: string): string =>
		`API key is invalid or missing for provider "${provider}".`,
} as const;
