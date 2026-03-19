import { describe, expect, it } from "vitest";
import type { Result } from "../../../src/core/types/result";
import { err, flatMap, isErr, isOk, map, ok } from "../../../src/core/types/result";

describe("Result", () => {
	describe("ok", () => {
		it("ok値を持つResultを生成する", () => {
			const result = ok(42);
			expect(result).toStrictEqual({ ok: true, value: 42 });
		});
	});

	describe("err", () => {
		it("エラー値を持つResultを生成する", () => {
			const result = err("something failed");
			expect(result).toStrictEqual({ ok: false, error: "something failed" });
		});
	});

	describe("isOk", () => {
		it("ok Resultに対してtrueを返す", () => {
			const result: Result<number, string> = ok(1);
			expect(isOk(result)).toBe(true);
		});

		it("err Resultに対してfalseを返す", () => {
			const result: Result<number, string> = err("fail");
			expect(isOk(result)).toBe(false);
		});

		it("型ガードとして機能する", () => {
			const result: Result<number, string> = ok(42);
			if (isOk(result)) {
				const value: number = result.value;
				expect(value).toBe(42);
			}
		});
	});

	describe("isErr", () => {
		it("err Resultに対してtrueを返す", () => {
			const result: Result<number, string> = err("fail");
			expect(isErr(result)).toBe(true);
		});

		it("ok Resultに対してfalseを返す", () => {
			const result: Result<number, string> = ok(1);
			expect(isErr(result)).toBe(false);
		});

		it("型ガードとして機能する", () => {
			const result: Result<number, string> = err("fail");
			if (isErr(result)) {
				const error: string = result.error;
				expect(error).toBe("fail");
			}
		});
	});

	describe("map", () => {
		it("ok Resultの値を変換する", () => {
			const result: Result<number, string> = ok(2);
			const mapped = map(result, (v) => v * 3);
			expect(mapped).toStrictEqual({ ok: true, value: 6 });
		});

		it("err Resultはそのまま返す", () => {
			const result: Result<number, string> = err("fail");
			const mapped = map(result, (v) => v * 3);
			expect(mapped).toStrictEqual({ ok: false, error: "fail" });
		});
	});

	describe("flatMap", () => {
		it("ok Resultに対して関数を適用する", () => {
			const result: Result<number, string> = ok(10);
			const chained = flatMap(result, (v) => (v > 0 ? ok(v.toString()) : err("must be positive")));
			expect(chained).toStrictEqual({ ok: true, value: "10" });
		});

		it("ok Resultに対してerrを返す関数を適用できる", () => {
			const result: Result<number, string> = ok(-1);
			const chained = flatMap(result, (v) => (v > 0 ? ok(v.toString()) : err("must be positive")));
			expect(chained).toStrictEqual({ ok: false, error: "must be positive" });
		});

		it("err Resultはそのまま返す", () => {
			const result: Result<number, string> = err("initial error");
			const chained = flatMap(result, (v) => ok(v.toString()));
			expect(chained).toStrictEqual({ ok: false, error: "initial error" });
		});
	});
});
