/**
 * 결정론적 난수 생성기.
 *
 * 전투의 모든 확률 판정은 이 RNG만을 사용한다. Math.random() 사용 금지.
 * 시드 + 명령 시퀀스가 같으면 항상 같은 전투 결과가 나오며, 이것이
 * 무르기(S-09) · 리플레이 · 헤드리스 밸런스 시뮬레이션(R6)의 기반이다.
 *
 * 알고리즘: mulberry32 (32bit state, 빠르고 분포 품질 충분)
 */
export class Rng {
  private state: number;
  /** 호출 횟수. 스냅샷/복원 검증 및 디버깅용. */
  private calls = 0;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /** [0, 1) 실수 */
  next(): number {
    this.calls++;
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** [min, max] 정수 */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** 백분율 판정. percent >= 100 이면 RNG를 소비하지 않고 true. */
  chance(percent: number): boolean {
    if (percent >= 100) return true;
    if (percent <= 0) return false;
    return this.next() * 100 < percent;
  }

  /** 배열에서 하나 선택 */
  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error("Rng.pick: 빈 배열");
    return items[this.int(0, items.length - 1)]!;
  }

  /** 제자리 셔플 (Fisher-Yates) */
  shuffle<T>(items: T[]): T[] {
    for (let i = items.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [items[i], items[j]] = [items[j]!, items[i]!];
    }
    return items;
  }

  snapshot(): RngSnapshot {
    return { state: this.state, calls: this.calls };
  }

  restore(snap: RngSnapshot): void {
    this.state = snap.state;
    this.calls = snap.calls;
  }

  static from(snap: RngSnapshot): Rng {
    const r = new Rng(0);
    r.restore(snap);
    return r;
  }
}

export interface RngSnapshot {
  readonly state: number;
  readonly calls: number;
}
