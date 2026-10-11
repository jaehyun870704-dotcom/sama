import type {EffectKind,UnitEffectNote} from '../../core/src/index.ts';

const O='stroke="#24160e" stroke-width="2.6" stroke-linejoin="round"';
const svg=(body:string)=>`<svg viewBox="0 0 48 48" aria-hidden="true">${body}</svg>`;
const ICON:Record<EffectKind,string>={
  power:svg(`<path d="M10 39 34 15l5-5 1 7-5 5-24 24z" fill="#8fe8ff" ${O}/><path d="m8 33 8 8M25 17l7 7" stroke="#fff1bf" stroke-width="3"/>`),
  reduction:svg(`<path d="M24 5 40 11v12c0 11-7 17-16 21C15 40 8 34 8 23V11z" fill="#8566ad" ${O}/><path d="M24 10v28M13 17h22" stroke="#ead9ff" stroke-width="3"/>`),
  critical:svg(`<path d="m24 3 5 13 14-2-10 10 10 9-14-1-5 13-5-13-14 1 10-9L5 14l14 2z" fill="#ffcb55" ${O}/><circle cx="24" cy="24" r="6" fill="#fff0b0"/>`),
  accuracy:svg(`<circle cx="24" cy="24" r="17" fill="#277f9f" ${O}/><circle cx="24" cy="24" r="10" fill="none" stroke="#baf4ff" stroke-width="3"/><circle cx="24" cy="24" r="3" fill="#fff1bf"/><path d="M24 3v10M24 35v10M3 24h10M35 24h10" stroke="#fff1bf" stroke-width="2.5"/>`),
  evade:svg(`<path d="M10 38c5-12 8-20 14-26 6 3 10 9 14 18-8-3-15 1-20 10z" fill="#704b9a" ${O}/><path d="M8 13h15M5 20h13M4 27h10" stroke="#d8c8ff" stroke-width="3"/>`),
  pierce:svg(`<path d="M5 39 36 8" stroke="#f2d073" stroke-width="5"/><path d="m31 6 12-2-2 12z" fill="#fff0b0" ${O}/><path d="m10 32 6 6" stroke="#9e482d" stroke-width="5"/>`),
  regenHp:svg(`<circle cx="24" cy="24" r="19" fill="#367d55" ${O}/><path d="M20 10h8v10h10v8H28v10h-8V28H10v-8h10z" fill="#c7f0c8" ${O}/>`),
  regenMp:svg(`<path d="M26 4c2 10-8 12-8 22 0 5 3 9 7 10-1-6 5-8 7-14 5 5 8 10 5 17-3 6-14 8-21 2C5 32 11 20 26 4z" fill="#63c8ff" ${O}/><path d="M24 25c-5 6-3 12 2 14 4-3 5-8 2-13z" fill="#d8f6ff"/>`),
  lifesteal:svg(`<path d="M24 4C18 15 10 24 10 32a14 14 0 0 0 28 0c0-8-8-17-14-28z" fill="#b9363e" ${O}/><path d="M18 32c2 5 7 7 12 4" fill="none" stroke="#ffd0c8" stroke-width="3"/>`),
  spiritBonus:svg(`<circle cx="24" cy="25" r="14" fill="#8151ae" ${O}/><path d="M24 7c3 6 8 8 8 14 0 5-4 9-8 9s-8-4-8-9c0-6 5-8 8-14z" fill="#d7b8ff"/><path d="M24 14v22M15 25h18" stroke="#fff0cf" stroke-width="2.5"/>`)
};

export function effectIcon(note:Pick<UnitEffectNote,'kind'|'effectKind'>){return note.effectKind?ICON[note.effectKind]:note.kind==='famed'?svg(`<path d="m24 4 6 13 14 2-10 10 3 14-13-7-13 7 3-14L4 19l14-2z" fill="#e0b758" ${O}/>`):svg(`<circle cx="24" cy="24" r="18" fill="#8a6238" ${O}/><path d="M24 10v28M10 24h28" stroke="#ffe6a8" stroke-width="4"/>`)};
export function effectTone(note:Pick<UnitEffectNote,'kind'|'effectKind'>){return note.effectKind??(note.kind==='signature'?'signature':note.kind==='famed'?'famed':'officer');}
