/**
 * 이름있는 장수 고유특성 묶음 B: 장수마다 셋(첫째는 처음부터 · 둘째는 2차 병종 진화 · 셋째는 3차 병종 진화에서 열린다).
 * 수치는 병종 단계에 따라 커진다(sigMul: ×1 · ×1.3 · ×1.6 · ×2). 조각은 signature-kit.ts에서 가져온다.
 */
import type { Signature } from "./signature-kit.ts";

const SET: Record<string, [Signature, Signature, Signature]> = {
};
export default SET;
