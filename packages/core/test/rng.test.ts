import { describe, it, expect } from "vitest";
import { Rng } from "../src/rng.ts";

describe("Rng", () => {
  it("같은 시드는 같은 수열을 낳는다", () => {
    const a = new Rng(12345);
    const b = new Rng(12345);
    const seqA = Array.from({ length: 50 }, () => a.next());
    const seqB = Array.from({ length: 50 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it("다른 시드는 다른 수열을 낳는다", () => {
    const a = new Rng(1);
    const b = new Rng(2);
    expect(a.next()).not.toBe(b.next());
  });

  it("스냅샷 복원 후 동일한 수열이 이어진다", () => {
    const r = new Rng(777);
    for (let i = 0; i < 10; i++) r.next();
    const snap = r.snapshot();
    const expected = Array.from({ length: 20 }, () => r.next());

    r.restore(snap);
    const actual = Array.from({ length: 20 }, () => r.next());
    expect(actual).toEqual(expected);
  });

  it("chance(100)은 RNG를 소비하지 않는다", () => {
    const r = new Rng(5);
    const before = r.snapshot().calls;
    expect(r.chance(100)).toBe(true);
    expect(r.snapshot().calls).toBe(before);
  });

  it("chance(0)은 항상 false", () => {
    const r = new Rng(5);
    for (let i = 0; i < 100; i++) expect(r.chance(0)).toBe(false);
  });

  it("분포가 대략 균등하다", () => {
    const r = new Rng(42);
    let hits = 0;
    const n = 20000;
    for (let i = 0; i < n; i++) if (r.chance(30)) hits++;
    expect(hits / n).toBeGreaterThan(0.28);
    expect(hits / n).toBeLessThan(0.32);
  });
});
