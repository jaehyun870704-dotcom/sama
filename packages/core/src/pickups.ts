/**
 * 전장 소모품 줍기(조조전처럼): 마을·병영에는 회복의 콩, 성채에는 회복의 쌀, 보물고·창고·관문에는 신비로운 물이 놓여 있고,
 * 아군(직접 움직이는 편)이 그 칸에 처음 들어가 멈추면 부대 공용 보관함에 들어간다. 한 곳에서 한 번만 줍는다.
 * 복숭아·술은 적 우두머리가 처음 선 자리에만 드물게 놓인다(우두머리가 비운 뒤 들어가면 줍는다).
 *
 * 놓는 곳은 지형·영역으로 정한다: 같은 시설(이어진 성채 칸 · 한 영역)마다 한 칸, 그 시설의 가운데에 가장 가까운 지나갈 수 있는 칸.
 * 아군 출진 칸(player_start)에는 두지 않는다. 난수(state.rng)를 쓰지 않아 전투의 흐름은 그대로이고, 같은 전장·같은 씨앗이면 늘 같다.
 */
import type { BattleState } from "./state.ts";
import type { Coord } from "./types.ts";
import { key } from "./grid.ts";

/** 영역 이름 → 놓을 소모품. 「북쪽_병영」처럼 앞에 이름이 붙어도 된다(꼬리표·호위 영역은 빼고). */
const REGION_ITEMS: ReadonlyArray<[RegExp, string]> = [
  [/^(?:[a-z]+_)*(?:village|town|camp|barracks)$/, "bean"],
  [/^(?:[a-z]+_)*(?:depot|warehouse|armory|grain|granary|treasury)$/, "water"],
];
/** 우두머리 자리에 드물게 놓이는 것. */
export const BOSS_PICKUP_CHANCE = 0.25;

/** 씨앗·문자열로 정하는 0~1 값(전투 난수와 따로). */
function hash01(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 15; h = Math.imul(h, 2246822507); h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

/** 이어진(상하좌우) 같은 지형 칸 묶음. */
function components(state: BattleState, terrain: string): Coord[][] {
  const { width, height } = state.map, seen = new Set<string>(), out: Coord[][] = [];
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const start = { x, y };
    if (seen.has(key(start)) || state.map.tileAt(start).terrain !== terrain) continue;
    const group: Coord[] = [], stack = [start];
    seen.add(key(start));
    while (stack.length) {
      const c = stack.pop()!;
      group.push(c);
      for (const n of [{ x: c.x + 1, y: c.y }, { x: c.x - 1, y: c.y }, { x: c.x, y: c.y + 1 }, { x: c.x, y: c.y - 1 }]) {
        if (!state.map.inBounds(n) || seen.has(key(n)) || state.map.tileAt(n).terrain !== terrain) continue;
        seen.add(key(n));
        stack.push(n);
      }
    }
    out.push(group);
  }
  return out;
}

/** 전장 위의 소모품 자리를 정해 state.pickups에 둔다. 이미 놓였으면 다시 놓지 않는다. */
export function placePickups(state: BattleState, seed: number): void {
  if (state.pickups.size) return;
  const start = new Set(state.map.regionCoords("player_start").map(key));
  const open = (c: Coord) => state.map.inBounds(c) && !start.has(key(c)) && Number.isFinite(state.map.moveCost("infantry", c));
  const features: Array<{ cells: Coord[]; item: string }> = [];
  for (const [name, cells] of state.map.regions) {
    const hit = REGION_ITEMS.find(([re]) => re.test(name));
    if (hit && cells.length) features.push({ cells, item: hit[1] });
  }
  for (const group of components(state, "fort")) features.push({ cells: group, item: "rice" });
  for (const group of components(state, "gate")) features.push({ cells: group, item: "water" });
  for (const f of features) {
    if (f.cells.some((c) => state.pickups.has(key(c)))) continue;
    const cx = f.cells.reduce((n, c) => n + c.x, 0) / f.cells.length, cy = f.cells.reduce((n, c) => n + c.y, 0) / f.cells.length;
    const spot = f.cells.filter(open).sort((a, b) => Math.hypot(a.x - cx, a.y - cy) - Math.hypot(b.x - cx, b.y - cy) || a.y - b.y || a.x - b.x)[0];
    if (spot) state.pickups.set(key(spot), f.item);
  }
  // 우두머리 자리: 승리 조건의 적장(없으면 가장 레벨 높은 적 하나)이 선 칸에 드물게 복숭아·술.
  const named = state.victory.filter((c) => c.type === "retreat" && c.unit).map((c) => state.find(c.unit!)).filter((u) => u?.alive && u.side === "enemy");
  const bosses = named.length ? named : [state.living("enemy").filter((u) => u.stats.movement > 0 && !/^(gate|tower|barricade)_/.test(u.id)).sort((a, b) => b.level - a.level || (a.id < b.id ? -1 : 1))[0]];
  for (const boss of bosses) {
    if (!boss || !state.map.inBounds(boss.pos)) continue;
    const roll = hash01(`${state.stage.id}|${seed}|${boss.id}`);
    if (roll < BOSS_PICKUP_CHANCE) state.pickups.set(key(boss.pos), roll < BOSS_PICKUP_CHANCE / 2 ? "peach" : "wine");
  }
}
