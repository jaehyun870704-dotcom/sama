/**
 * 대사의 분위기 — 이야기 장면의 흉상 표정, 대화창 빛깔, 무대 인물의 몸짓이 모두 이 한 판단을 쓴다
 * (예전에는 셋이 따로 골라, 화난 대사에 웃는 얼굴이 나오거나 대화창이 표정을 아예 고르지 못했다).
 */
export type LineMood='angry'|'smile'|'sad'|'surprise'|'deferent'|'neutral';
const ANGRY=/분노|격노|이놈|닥쳐|물러서|베어라|쳐라|용서.*못|죽여(?! 주)|가만두지|감히|[!！]{2,}/;
const SMILE=/하하|허허|후후|크하하|기쁘|반갑|잘했|좋[군소다아]|웃|고맙|다행/;
const SAD=/슬프|눈물|미안|송구|애통|원통|아프|그립|…$|흑/;
const SURPRISE=/^[^가-힣]*[!！?？]+$|무엇이|어찌 이런|설마|큰일|뭐라고|정말인가/;
const DEFERENT=/주공|승상|폐하|전하|아뢰|분부|받들|명을 따르|소인|신이 /;
export function lineMood(line:string):LineMood{
  if(ANGRY.test(line))return 'angry';
  if(SURPRISE.test(line))return 'surprise';
  if(SAD.test(line))return 'sad';
  if(SMILE.test(line))return 'smile';
  if(DEFERENT.test(line))return 'deferent';
  return /[!！]$/.test(line)?'surprise':'neutral';
}
/** 흉상 그림의 세 표정(평상·격앙·미소)으로 줄인다. */
export const bustExpression=(m:LineMood)=>m==='angry'?'angry' as const:m==='smile'?'smile' as const:'neutral' as const;
/** 무대 인물의 몸짓(story-stage react 종류). */
export const moodReaction=(m:LineMood)=>({angry:'shake',surprise:'jolt',sad:'droop',smile:'bounce',deferent:'nod',neutral:''} as const)[m];
