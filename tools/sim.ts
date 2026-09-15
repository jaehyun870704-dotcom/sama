/**
 * 밸런스 시뮬레이션 러너.
 *   node --experimental-strip-types tools/sim.ts [stageId] [runs]
 *
 * 각 스테이지를 AI 자동 플레이로 N회 돌려 클리어율·평균 턴·인장 획득률을 낸다.
 * 목표 클리어율(stage.difficulty[*].targetClearRate)에서 크게 벗어나면
 * 종료 코드 1을 반환한다 — CI에서 밸런스 회귀를 잡는다. (PRD R6, §11)
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { assemble, type RosterEntry } from "../packages/core/src/loader.ts";
import { simulate } from "../packages/core/src/sim.ts";
import type { StageDef, Difficulty } from "../packages/core/src/stage.ts";
import type { MapFile } from "../packages/core/src/mapio.ts";
import type { StrategyDef } from "../packages/core/src/types.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readJson = <T>(p: string): T => JSON.parse(readFileSync(p, "utf8")) as T;

const STRATEGIES = new Map<string, StrategyDef>([
  ["windDragon", {
    id: "windDragon", name: "풍룡", element: "wind", shape: "spread",
    range: 4, radius: 1, mpCost: 12, power: 130, targetSides: ["enemy"],
  }],
]);

/**
 * 임시 로스터. 육성 시스템이 붙기 전까지 권장 레벨 기준으로 대체한다.
 * 스테이지의 강제 출진 목록에서 필요한 장수만 만들어 준다.
 */
const CHARACTERS: Record<string, { name: string; unitClass: RosterEntry["unitClass"]; strategies?: string[] }> = {
  sima_yi:   { name: "사마의", unitClass: "strategist", strategies: ["windDragon"] },
  sima_lang: { name: "사마랑", unitClass: "fengshui" },
  cao_zhen:  { name: "조진", unitClass: "cavalry" },
  cao_pi:    { name: "조비", unitClass: "archer" },
  zhang_he:  { name: "장합", unitClass: "cavalry" },
};

function roster(ids: readonly string[], level: number): RosterEntry[] {
  return ids.map((id) => {
    const c = CHARACTERS[id] ?? { name: id, unitClass: "infantry" as const };
    return {
      id,
      name: c.name,
      unitClass: c.unitClass,
      level,
      ...(c.strategies ? { strategies: c.strategies } : {}),
    };
  });
}

const [stageFilter, runsArg] = process.argv.slice(2);
const runs = Number(runsArg ?? 100);
const stagesDir = join(root, "packages/data/stages");
const files = readdirSync(stagesDir)
  .filter((f) => f.endsWith(".json"))
  .filter((f) => !stageFilter || f.startsWith(stageFilter));

let failures = 0;
console.log(`스테이지 ${files.length}개 × ${runs}회 시뮬레이션\n`);

for (const f of files) {
  const stage = readJson<StageDef>(join(stagesDir, f));
  const map = readJson<MapFile>(join(root, `packages/data/maps/${stage.mapId}.json`));

  for (const difficulty of ["normal", "extreme"] as Difficulty[]) {
    const tier = stage.difficulty[difficulty];
    const result = simulate({
      runs,
      difficulty,
      setup: (seed) => ({
        state: assemble({ stage, map, difficulty, seed, roster: roster(stage.deployment.forced, tier.recommendedLevel) }),
        options: { seed, strategies: STRATEGIES, maxTurns: 60 },
      }),
    });

    const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
    const target = tier.targetClearRate;
    const line =
      `${stage.id} [${difficulty.padEnd(7)}] ` +
      `클리어 ${pct(result.clearRate).padStart(6)} | ` +
      `평균 ${result.avgTurns.toFixed(1).padStart(5)}턴 | ` +
      `인장2 ${pct(result.sealRates[2] ?? 0).padStart(6)} | ` +
      `인장3 ${pct(result.sealRates[3] ?? 0).padStart(6)}` +
      (result.timeouts > 0 ? ` | 타임아웃 ${result.timeouts}` : "");

    // AI 자동 플레이는 사람 실력의 하한선 근사치다. 목표치를 그대로 요구하지 않고
    // "AI가 전혀 못 깬다"(0%)를 과난이도 신호로 본다.
    if (result.clearRate === 0) {
      console.log(`❌ ${line}   ← AI가 한 번도 클리어하지 못함`);
      failures++;
    } else if (target !== undefined && result.clearRate > Math.min(1, target + 0.4)) {
      console.log(`⚠️  ${line}   ← 목표(${pct(target)}) 대비 과도하게 쉬움`);
    } else {
      console.log(`✅ ${line}`);
    }
  }
}

console.log();
if (failures > 0) {
  console.error(`${failures}건의 난이도 이상 감지`);
  process.exit(1);
}
