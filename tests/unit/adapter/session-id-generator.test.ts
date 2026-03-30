import { describe, expect, it } from "vitest";
import { generateSessionId } from "../../../src/adapter/session-id-generator";

describe("generateSessionId", () => {
	it("tskp_ プレフィックスで始まる", () => {
		const id = generateSessionId();
		expect(id.startsWith("tskp_")).toBe(true);
	});

	it("十分な長さを持つ", () => {
		const id = generateSessionId();
		expect(id.length).toBeGreaterThanOrEqual(17); // "tskp_" (5) + 12
	});

	it("呼び出しごとに異なる値を返す", () => {
		const ids = new Set(Array.from({ length: 100 }, () => generateSessionId()));
		expect(ids.size).toBe(100);
	});
});
