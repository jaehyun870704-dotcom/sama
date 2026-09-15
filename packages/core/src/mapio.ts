/**
 * 맵 파일 포맷 — ASCII 행 + 범례.
 *
 * 맵 에디터가 나오기 전까지 기획자가 텍스트로 직접 그릴 수 있어야 한다.
 * 각 문자가 지형 하나에 대응하고, heights/regions를 별도로 겹쳐 얹는다.
 */
import { BattleMap } from "./grid.ts";
import type { Tile, TerrainKind, Coord } from "./types.ts";

export interface MapFile {
  id: string;
  name?: string;
  /** 각 문자 → 지형. 예: { ".": "plain", "^": "mountain" } */
  legend: Record<string, TerrainKind>;
  /** 지형 행. 모든 행의 길이가 같아야 한다. */
  rows: string[];
  /** 고도 행 (선택). 0~9 숫자 문자. 생략 시 전부 0. */
  heights?: string[];
  /** 이름 붙은 영역. 좌표 배열 또는 사각 영역. */
  regions?: Record<string, Coord[] | { x: number; y: number; w: number; h: number }>;
}

export function loadMap(file: MapFile): BattleMap {
  const height = file.rows.length;
  if (height === 0) throw new Error(`맵 ${file.id}: 행이 없음`);
  const width = file.rows[0]!.length;

  file.rows.forEach((row, y) => {
    if (row.length !== width) {
      throw new Error(`맵 ${file.id}: ${y}번 행의 길이가 ${row.length} (기대 ${width})`);
    }
  });

  const tiles: Tile[] = [];
  for (let y = 0; y < height; y++) {
    const row = file.rows[y]!;
    const hRow = file.heights?.[y];
    for (let x = 0; x < width; x++) {
      const ch = row[x]!;
      const terrain = file.legend[ch];
      if (!terrain) {
        throw new Error(`맵 ${file.id}: (${x},${y})의 문자 "${ch}"가 범례에 없음`);
      }
      tiles.push({
        terrain,
        height: hRow ? Number(hRow[x] ?? 0) : 0,
        hazard: "none",
        hazardTurns: 0,
      });
    }
  }

  const regions = new Map<string, Coord[]>();
  for (const [name, spec] of Object.entries(file.regions ?? {})) {
    regions.set(name, expandRegion(name, spec, width, height));
  }

  return new BattleMap(width, height, tiles, regions);
}

function expandRegion(
  name: string,
  spec: Coord[] | { x: number; y: number; w: number; h: number },
  width: number,
  height: number,
): Coord[] {
  const coords: Coord[] = Array.isArray(spec)
    ? spec
    : Array.from({ length: spec.w * spec.h }, (_, i) => ({
        x: spec.x + (i % spec.w),
        y: spec.y + Math.floor(i / spec.w),
      }));

  for (const c of coords) {
    if (c.x < 0 || c.y < 0 || c.x >= width || c.y >= height) {
      throw new Error(`영역 "${name}"의 좌표 (${c.x},${c.y})가 맵 범위를 벗어남`);
    }
  }
  return coords;
}
