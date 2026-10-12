/** 제갈량전 장 묶음 모음: 장·규칙·레벨·출진 명부·NPC·인물을 묶음마다 모아 한곳에서 내보낸다. */
import a from './batch-a.ts';
import b from './batch-b.ts';
import c from './batch-c.ts';
import d from './batch-d.ts';
import {ZHUGE_PEOPLE} from './people.ts';
import type {ZhugeBatch,ZhugePerson} from './types.ts';

export const ZHUGE_BATCHES:readonly ZhugeBatch[]=[a,b,c,d];
/** 제갈량전에서 새로 장수록에 오르는 인물(공용 + 묶음마다). */
export const ZHUGE_PEOPLE_ALL:readonly ZhugePerson[]=[...ZHUGE_PEOPLE,...ZHUGE_BATCHES.flatMap(x=>x.people??[])];
