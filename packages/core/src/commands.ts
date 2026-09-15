/**
 * 명령(Command) — 전투 상태를 바꾸는 유일한 통로.
 *
 * 플레이어 입력, AI 결정, 리플레이가 모두 같은 명령 타입을 통과한다.
 * 덕분에 다음 세 가지가 하나의 메커니즘으로 해결된다:
 *   1. 무르기(S-09)  — 실행 전 스냅샷 복원
 *   2. 리플레이      — 시드 + 명령 시퀀스 재생
 *   3. 밸런스 시뮬   — 헤드리스로 명령을 쏟아붓고 결과 집계 (R6)
 */
import type { Coord } from "./types.ts";

export type Command =
  | { kind: "move"; unit: string; to: Coord }
  | { kind: "attack"; unit: string; target: string }
  | { kind: "strategy"; unit: string; strategy: string; at: Coord }
  | { kind: "item"; unit: string; item: string; target?: string }
  | { kind: "wait"; unit: string }
  | { kind: "capture"; unit: string; region: string }
  | { kind: "choose"; nodeId: string; optionId: string }
  | { kind: "endPhase" };

export interface CommandResult {
  ok: boolean;
  error?: string;
}

export const ok: CommandResult = { ok: true };
export const fail = (error: string): CommandResult => ({ ok: false, error });
