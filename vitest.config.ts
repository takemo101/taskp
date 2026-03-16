import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		globals: true,
		include: ["tests/**/*.test.ts"],
		passWithNoTests: true,
		fileParallelism: true,
		pool: "forks",
		clearMocks: true,
		mockReset: true,
		restoreMocks: true,
		isolate: true,
		coverage: {
			provider: "v8",
			reporter: ["text", "html", "json-summary"],
			include: ["src/**/*.ts"],
			exclude: ["src/types/**", "src/**/*.d.ts"],
		},
	},
});
