import { describe, expect, it } from "vitest";
import { calculateDelay, type RetryConfig, withRetry } from "../../src/adapter/retry";

describe("calculateDelay", () => {
	const config: RetryConfig = { maxRetries: 3, baseDelayMs: 100, maxDelayMs: 1000 };

	it("doubles delay for each attempt", () => {
		expect(calculateDelay(0, config)).toBe(100);
		expect(calculateDelay(1, config)).toBe(200);
		expect(calculateDelay(2, config)).toBe(400);
	});

	it("caps at maxDelayMs", () => {
		expect(calculateDelay(10, config)).toBe(1000);
	});
});

describe("withRetry", () => {
	const fastConfig: RetryConfig = { maxRetries: 2, baseDelayMs: 1, maxDelayMs: 10 };

	it("returns result on first success", async () => {
		const result = await withRetry(
			() => Promise.resolve("ok"),
			() => true,
			fastConfig,
		);

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value).toBe("ok");
	});

	it("retries on retryable error and succeeds", async () => {
		let attempts = 0;
		const fn = () => {
			attempts++;
			if (attempts < 3) throw new Error("transient");
			return Promise.resolve("recovered");
		};

		const result = await withRetry(fn, () => true, fastConfig);

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value).toBe("recovered");
		expect(attempts).toBe(3);
	});

	it("stops immediately on non-retryable error", async () => {
		let attempts = 0;
		const fn = () => {
			attempts++;
			throw new Error("fatal");
		};

		const result = await withRetry(fn, () => false, fastConfig);

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error.message).toContain("fatal");
		expect(attempts).toBe(1);
	});

	it("returns error after max retries exceeded", async () => {
		let attempts = 0;
		const fn = () => {
			attempts++;
			throw new Error("always fails");
		};

		const result = await withRetry(fn, () => true, fastConfig);

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error.message).toContain("Max retries (2) exceeded");
		expect(attempts).toBe(3);
	});
});
