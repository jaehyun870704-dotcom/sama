import {describe,expect,it} from 'vitest';
import {existsSync,readFileSync} from 'node:fs';
// 장수 그림 한 벌(디자인 지시서: SD 1400×280)이 들어온 장수는 병종과 무관하게 그 시트를 쓴다.
// 새 일기토가 들어온 장수는 그 시트를 쓴다(옛 -v1은 지운다). 파일 이름(판 번호)은 장수마다 UNIFIED_SD_FILES에 적혀 있다.
import {DUEL_PENDING,SD_V8_ONLY_IDS,UNIFIED_SD_FILES,UNIFIED_SD_IDS,officerBattleSheet,officerDuelModel,officerDuelModelStyle,officerDuelMounted,officerEntry,officerManifest,officerModelSheets} from '../src/officer-models.ts';
// 4차 납품에서 통합 SD가 아닌 장수 8명은 일기토만 SD 비례 duel-v2로 바뀌었다.
const DUEL_V2=['bi_yan','gongsun_yuan','lu_fan','meng_yan','sun_shao','wang_ling','yang_ang','zhuge_ke'];
const duelFile=(id:string)=>UNIFIED_SD_FILES[id]?.duel??`${id}-duel-v${DUEL_V2.includes(id)?2:1}.webp`;
const hasSd=(id:string)=>!!UNIFIED_SD_FILES[id]||(SD_V8_ONLY_IDS as readonly string[]).includes(id);
const sdFile=(id:string)=>UNIFIED_SD_FILES[id]?.sd??`${id}-sd-v8.webp`;

const lordIds=['cao_cao','cao_pi','cao_rui','liu_bei','sun_quan','gongsun_yuan','yuan_tan','yuan_shang','liu_bang','xiang_yu'] as const;
const priorityDuelIds=['huang_zhong','zhao_yun','sun_quan','lu_meng','wei_yan','lu_xun','gongsun_yuan','yang_ang','lu_fan','sun_shao','meng_da','ma_su','wang_ping','gao_xiang','meng_yan','bi_yan','zhu_ran','zhuge_ke','wang_ling'] as const;
const secondaryDuelIds=['guan_yu','zhang_liao','zhang_he','xiahou_dun','jiang_wei','xiahou_yuan','xu_huang','cao_ren','liu_bei','cao_rui','yuan_tan','yuan_shang','gan_ning','huang_gai','zhu_rong','meng_huo','lu_su','pang_tong','xun_yu','wooden_zhuge'] as const;
const secondaryFullIds=['gao_shou','guo_huai','dai_ling','zhang_zhao','zhuge_jin','zhang_ba','cao_xiu','cao_shuang'] as const;
const secondaryBattle=[
  ['gao_shou','bandit',1120,224],['guo_huai','archer',1120,224],['dai_ling','infantry',1120,224],['zhang_zhao','strategist',1120,224],
  ['zhuge_jin','strategist',1120,224],['zhang_ba','cavalry',1120,224],['cao_xiu','cavalry',1120,224],['cao_shuang','cavalry',1120,224],
] as const;
const priorityBattle=[
  ['yang_ang','infantry',1120,224],['lu_fan','crossbow',1120,224],['sun_shao','crossbow',1120,224],['meng_da','infantry',1120,224],['ma_su','strategist',1120,224],['wang_ping','infantry',1120,224],
  ['gao_xiang','infantry',1120,224],['meng_yan','cavalry',1120,224],['bi_yan','cavalry',1120,224],['zhu_ran','infantry',1120,224],['zhuge_ke','strategist',1120,224],['wang_ling','infantry',1120,224],
] as const;
const namedBattle=[
  ['jia_xu','wheelSage'],['yu_jin','spearman'],['yue_jin','infantry'],['deng_ai','infantry'],['zhong_hui','fengshui'],['hao_zhao','crossbow'],['cao_hong','infantry'],
  ['cao_zhang','cavalry'],['wen_ping','spearman'],['guan_ping','infantry'],['ma_dai','infantry'],['xu_sheng','spearman'],['ding_feng','infantry'],['yan_liang','cavalry'],
  ['wen_chou','cavalry'],['ju_shou','strategist'],['tian_feng','strategist'],['shen_pei','strategist'],['han_xin','spearman'],['zhang_liang','strategist'],['xiao_he','fengshui'],
  ['ying_bu','cavalry'],['peng_yue','infantry'],
  ['fan_kuai','cavalry'],['chen_ping','strategist'],['fan_zeng','strategist'],['zhongli_mo','cavalry'],['ji_bu','infantry'],
] as const;
function webpSize(file:URL){
  const b=readFileSync(file),at=(tag:string)=>b.indexOf(Buffer.from(tag)),n=(i:number)=>b[i]!|(b[i+1]!<<8)|(b[i+2]!<<16);
  const vp8x=at('VP8X');if(vp8x>=0)return [n(vp8x+12)+1,n(vp8x+15)+1] as const;
  const lossless=at('VP8L');if(lossless>=0){const v=b.readUInt32LE(lossless+9);return [(v&0x3fff)+1,((v>>14)&0x3fff)+1] as const;}
  const lossy=at('VP8 ');expect(lossy).toBeGreaterThanOrEqual(0);
  return [b.readUInt16LE(lossy+14)&0x3fff,b.readUInt16LE(lossy+16)&0x3fff] as const;
}

describe('장수별 전투 SD와 대결 모델',()=>{
  const players=[['sima_yi','사마의'],['cao_zhen','조진'],['sima_lang','사마랑'],['sima_fang','사마방'],['sima_shi','사마사'],['sima_zhao','사마소']] as const;

  it('대상 94명(이야기 전신 전용 인물 2명 포함)과 모든 공개 시트를 색인한다',()=>{
    // 코덱스가 장수를 늘려 가므로 줄지만 않는지 본다(2026-10-15: 177명).
    expect(officerManifest.length).toBeGreaterThanOrEqual(177);expect(new Set(officerManifest.map(e=>e.id)).size).toBe(officerManifest.length);
    const sheets=new Set(officerModelSheets.map(s=>s.id));
    for(const entry of officerManifest)for(const battle of Object.values(entry.battle))expect(sheets.has(battle.sheet),battle.sheet).toBe(true);
  });

  it('플레이어 장수 6명은 전투 SD 4줄(통합 SD가 온 장수는 한 줄)이며 정확한 셀 규격을 쓴다',()=>{
    for(const [id,name] of players){
      const model=officerBattleSheet({id,name})!;
      if(hasSd(id)){expect(model.action.sheet,id).toBe(`officers/${sdFile(id)}`);expect(model.action.rows,id).toBe(1);expect(model.action.cell,id).toEqual([350,280]);continue;}
      expect(model.action.rows,id).toBe(4);
      expect(model.action.cell?.[0],id).toBe(id==='cao_zhen'||id==='sima_zhao'?350:280);
      expect(model.action.cell?.[1],id).toBe(id==='cao_zhen'||id==='sima_zhao'?280:224);
      expect(model.action.sheet,id).toMatch(/^officers\//);
    }
  });

  it('진화 병종도 원래 계통 시트의 같은 모습(첫 줄)을 쓴다',()=>{
    // 통합 SD가 없는 책사(장량)로 본다 — 순욱은 2026-10-15 통합 SD로 바뀌었다.
    const strategist=officerBattleSheet({id:'zhang_liang',name:'장량',unitClass:'mastermind'})!;
    expect(strategist.action.sheet).toContain('battle-strategist');
    expect(strategist.action.row).toBe(0);
    // 고순은 2026-10-15 통합 SD로 바뀌어 병종이 진화해도 같은 SD 한 벌을 쓴다.
    const infantry=officerBattleSheet({id:'gao_shun',name:'고순',unitClass:'ironInfantry'})!;
    expect(infantry.action.sheet).toMatch(/^officers\/gao_shun-sd-v\d+\.webp$/);
    expect(infantry.action.row).toBe(0);
  });

  it('군주 10명은 군주 전 계통에서 전용 기마 시트를 찾는다',()=>{
    for(const id of lordIds)for(const unitClass of ['lord','hegemon','sovereign','sonOfHeaven'] as const){
      const model=officerBattleSheet({id,name:id,unitClass})!;
      expect(model.action.sheet,`${id}/${unitClass}`).toBe(hasSd(id)?`officers/${sdFile(id)}`:`officers/${id}-battle-lord-v1.webp`);
      expect(model.action.cell,`${id}/${unitClass}`).toEqual(hasSd(id)?[350,280]:[280,224]);
    }
  });

  it('군주 10명의 전투 시트는 1120×224(280×224 × 4칸), 새 SD 한 벌은 1400×280이다',()=>{
    for(const id of lordIds)if(hasSd(id))expect(webpSize(new URL(`../public/officers/${sdFile(id)}`,import.meta.url)),id).toEqual([1400,280]);else expect(webpSize(new URL(`../public/officers/${id}-battle-lord-v1.webp`,import.meta.url)),id).toEqual([1120,224]);
  });

  it('id, 환영, wooden_zhuge, boss의 연의 이름 순서로 찾는다',()=>{
    expect(officerEntry({id:'chen_gong',name:'무명'})?.name).toBe('진궁');
    expect(officerEntry({id:'story_enemy',name:'진궁의 환영'})?.id).toBe('chen_gong');
    expect(officerEntry({id:'wooden_zhuge',name:'목우 제갈'})?.name).toBe('제갈량');
    expect(officerEntry({id:'boss',name:'관우'})?.id).toBe('guan_yu');
    expect(officerBattleSheet({id:'wooden_zhuge',name:'제갈량',unitClass:'strategist'})?.action.sheet).toContain('wooden_zhuge-sd-v2'); // 사륜거는 통합 SD 안에 그려졌다(따로 쓰던 수레 판은 지움)
  });

  it('전투 SD와 대결 모델은 다른 파일을 쓴다',()=>{
    for(const [id,name] of [...players,['lu_bu','여포'] as const]){
      const battle=officerBattleSheet({id,name})!;
      const duel=officerDuelModel({id,name});
      if(duel)expect(duel.sheet,id).not.toBe(battle.action.sheet);
    }
    expect(officerDuelModelStyle({id:'lu_bu',name:'여포'})).toContain('--officer-x');
    expect(officerDuelModel({id:'lu_bu',name:'여포'})?.sheet).toMatch(/^officers\/lu_bu-duel-v\d+\.webp$/);
    expect(officerDuelModel({id:'cao_cao',name:'조조'})?.sheet).toMatch(/^officers\/cao_cao-duel-v\d+\.webp$/);
    expect(officerDuelModel({id:'cao_pi',name:'조비'})?.sheet).toMatch(/^officers\/cao_pi-duel-v\d+\.webp$/);
    expect(officerDuelModel({id:'xiang_yu',name:'항우'})?.sheet).toMatch(/^officers\/xiang_yu-duel-v\d+\.webp$/);
  });

  it('우선순위 장수 19명은 각자 1024×256 전용 대결 시트를 쓴다',()=>{
    for(const id of priorityDuelIds){
      expect(officerDuelModel({id,name:id})?.sheet,id).toBe(`officers/${duelFile(id)}`);
      expect(webpSize(new URL(`../public/officers/${duelFile(id)}`,import.meta.url)),id).toEqual([1024,256]);
    }
  });

  it('2차 장수 20명은 각자 1024×256 전용 대결 시트를 쓴다',()=>{
    for(const id of secondaryDuelIds){
      expect(officerDuelModel({id,name:id})?.sheet,id).toBe(`officers/${duelFile(id)}`);
      expect(webpSize(new URL(`../public/officers/${duelFile(id)}`,import.meta.url)),id).toEqual([1024,256]);
    }
  });

  it('2차 추가 장수 8명도 각자 1024×256 전용 대결 시트를 쓴다',()=>{
    for(const id of secondaryFullIds){
      expect(officerDuelModel({id,name:id})?.sheet,id).toBe(`officers/${duelFile(id)}`);
      expect(webpSize(new URL(`../public/officers/${duelFile(id)}`,import.meta.url)),id).toEqual([1024,256]);
    }
  });

  it('2차 추가 장수 8명은 병종별 전투 시트 규격을 지킨다',()=>{
    for(const [id,unitClass,width,height] of secondaryBattle){
      const model=officerBattleSheet({id,name:id,unitClass})!;
      if(hasSd(id)){expect(model.action.sheet,id).toBe(`officers/${sdFile(id)}`);expect(model.action.cell,id).toEqual([350,280]);continue;}
      expect(model.action.sheet,id).toBe(`officers/${id}-battle-${unitClass}-v1.webp`);
      expect(model.action.cell,id).toEqual([width/4,height]);
      expect(webpSize(new URL(`../public/officers/${id}-battle-${unitClass}-v1.webp`,import.meta.url)),id).toEqual([width,height]);
    }
  });

  it('우선순위 장수 12명은 병종별 전투 시트 규격을 지킨다',()=>{
    for(const [id,unitClass,width,height] of priorityBattle){
      const model=officerBattleSheet({id,name:id,unitClass})!;
      if(hasSd(id)){expect(model.action.sheet,id).toBe(`officers/${sdFile(id)}`);expect(model.action.cell,id).toEqual([350,280]);continue;}
      expect(model.action.sheet,id).toBe(`officers/${id}-battle-${unitClass}-v1.webp`);
      expect(model.action.cell,id).toEqual([width/4,height]);
      expect(webpSize(new URL(`../public/officers/${id}-battle-${unitClass}-v1.webp`,import.meta.url)),id).toEqual([width,height]);
    }
  });

  it('이름있는 장수 28명은 병종별 표준 SD 시트를 쓴다',()=>{
    for(const [id,unitClass] of namedBattle){
      const model=officerBattleSheet({id,name:id,unitClass})!;
      // 장수 그림 한 벌(SD)이 들어온 장수는 그 시트 하나만 쓴다(옛 병종별 시트는 지웠다).
      if(hasSd(id)){expect(model.action.sheet,id).toBe(`officers/${sdFile(id)}`);expect(model.action.cell,id).toEqual([350,280]);continue;}
      expect(model.action.sheet,id).toBe(`officers/${id}-battle-${unitClass}-v1.webp`);
      expect(model.action.cell,id).toEqual([280,224]);
      expect(webpSize(new URL(`../public/officers/${id}-battle-${unitClass}-v1.webp`,import.meta.url)),id).toEqual([1120,224]);
    }
  });

  it('기마 대결 장수만 기마 연출을 사용한다',()=>{
    for(const id of ['zhao_yun','sun_quan','gongsun_yuan','meng_yan','bi_yan','meng_huo','yan_liang','cao_shuang'])expect(officerDuelMounted({id,name:id}),id).toBe(true);
    // 6차: 곽회·조홍·여몽·주연은 도보 판으로 합격했다.
    for(const id of ['lu_meng','guo_huai','cao_hong','zhu_ran'])expect(officerDuelMounted({id,name:id}),id).toBe(false);
    for(const id of ['huang_zhong','lu_xun','ma_su','zhuge_ke','wang_ling'])expect(officerDuelMounted({id,name:id}),id).toBe(false);
    // 2차 통합 SD: 말 탄 일기토 그림은 마대·사마사뿐이다.
    for(const id of ['ma_dai','sima_shi'])expect(officerDuelMounted({id,name:id}),id).toBe(true);
    for(const id of ['meng_da','huang_yueying','zhang_bao','guan_xing','zhuge_jin'])expect(officerDuelMounted({id,name:id}),id).toBe(false);
    // 3차 재납품: 조진·위연·사마사는 말 탄 일기토, 관색은 두 번째 칸만 말을 타 도보로 둔다.
    for(const id of ['cao_zhen','wei_yan','sima_shi'])expect(officerDuelMounted({id,name:id}),id).toBe(true);
    for(const id of ['guan_suo','sima_yi','sima_zhao','yan_yan','zhuge_jun'])expect(officerDuelMounted({id,name:id}),id).toBe(false);
  });

  it('장수가 부르는 일기토·전투 SD 파일은 모두 실제로 있다(없는 파일이면 대결 화면이 비어 보인다)',()=>{
    const missing:string[]=[];
    for(const e of officerManifest){
      const d=officerDuelModel({id:e.id,name:e.name});if(d&&!existsSync(new URL(`../public/${d.sheet}`,import.meta.url)))missing.push(d.sheet);
      const b=officerBattleSheet({id:e.id,name:e.name});if(b&&!existsSync(new URL(`../public/${b.action.sheet}`,import.meta.url)))missing.push(b.action.sheet);
    }
    expect(missing).toEqual([]);
  });

  it('통합 SD 장수는 1400×280 SD 한 벌·1024×256 일기토만 쓰고 옛 시트 파일은 없다',()=>{
    expect(UNIFIED_SD_IDS.length).toBeGreaterThanOrEqual(159);// 2026-10-15 SD 재제작 1·2차 뒤
    for(const id of UNIFIED_SD_IDS){
      const e=officerEntry({id,name:id})!;expect(e,id).toBeDefined();const f=UNIFIED_SD_FILES[id]!;
      expect(officerBattleSheet({id,name:id})!.action.sheet,id).toBe(`officers/${f.sd}`);
      expect(webpSize(new URL(`../public/officers/${f.sd}`,import.meta.url)),id).toEqual([1400,280]);
      if(DUEL_PENDING.has(id)){expect(officerDuelModel({id,name:id}),id).toBeUndefined();continue;}// 일기토 그림이 아직 없다 — 전투 SD로 선다
      expect(officerDuelModel({id,name:id})?.sheet,id).toBe(`officers/${f.duel}`);
      expect(webpSize(new URL(`../public/officers/${f.duel}`,import.meta.url)),id).toEqual([1024,256]);
      // 옛 일기토 파일(정보·장춘화·대릉의 -duel-v1)이 남아 있어도 위에서 본 대로 통합 그림이 쓰인다.
    }
    // 재납품(07e57d5)으로 판이 바뀐 장수: 옛 병종 시트·옛 판은 지웠다.
    for(const f of ['sima_shi-sd-v1','sima_shi-duel-v2','sima_yi-battle-strategist-v1','cao_zhen-battle-heavyCav-v1','sima_zhao-battle-crossbow-v1','wei_yan-battle-infantry-v1','yan_yan-battle-infantry-v1'])
      expect(existsSync(new URL(`../public/officers/${f}.webp`,import.meta.url)),f).toBe(false);
    expect(UNIFIED_SD_FILES.sima_shi?.sd).toMatch(/^sima_shi-sd-v\d+\.webp$/);expect(UNIFIED_SD_FILES.sima_shi?.duel).toMatch(/^sima_shi-duel-v\d+\.webp$/);
    // 제갈균은 파일 이름이 jun-*이고, 제갈량전 출진 id(z_jun)는 이름으로 찾는다.
    expect(officerDuelModel({id:'z_jun',name:'제갈균'})?.sheet).toMatch(/^officers\/jun-duel-v\d+\.webp$/);
    expect(officerBattleSheet({id:'z_guan_suo',name:'관색',unitClass:'infantry'})?.action.sheet).toBe('officers/guan_suo-sd-v2.webp');
    // 색인에 없던 촉 장수도 이름으로 찾는다(촉 출진 장수 id는 z_ 접두).
    expect(officerBattleSheet({id:'z_huang_yueying',name:'황월영',unitClass:'strategist'})?.action.sheet).toBe('officers/huang_yueying-sd-v1.webp');
    expect(officerDuelModel({id:'z_fei_yi',name:'비의'})?.sheet).toMatch(/^officers\/fei_yi-duel-v\d+\.webp$/);
  });

  it('4차 납품(2927c61·6d66aeb): 합격 15명은 통합 SD, 일기토만 다시 그린 장수는 새 판, 옛 그림은 지웠다',()=>{
    const fourth=['cao_pi','cao_rui','xu_chu','sima_fu','hu_zun','zhang_he','cao_ren','xiahou_dun','xiahou_yuan','zhang_liao','wang_shuang','lu_xun','chen_gong','zhu_rong','xu_shu'];
    for(const id of fourth)expect((UNIFIED_SD_IDS as readonly string[]).includes(id),id).toBe(true);
    expect(UNIFIED_SD_FILES.lu_xun?.sd).toMatch(/^lu_xun-sd-v\d+\.webp$/);expect(UNIFIED_SD_FILES.lu_xun?.duel).toMatch(/^lu_xun-duel-v\d+\.webp$/);
    expect(UNIFIED_SD_FILES.sima_zhao?.sd).toMatch(/^sima_zhao-sd-v\d+\.webp$/);expect(UNIFIED_SD_FILES.sima_zhao?.duel).toMatch(/^sima_zhao-duel-v\d+\.webp$/);
    expect(UNIFIED_SD_FILES.zhuge_jun?.sd).toMatch(/^jun-sd-v\d+\.webp$/);expect(UNIFIED_SD_FILES.zhuge_jun?.duel).toMatch(/^jun-duel-v\d+\.webp$/);
    expect(UNIFIED_SD_FILES.meng_da?.sd).toMatch(/^meng_da-sd-v\d+\.webp$/);expect(UNIFIED_SD_FILES.meng_da?.duel).toMatch(/^meng_da-duel-v\d+\.webp$/);
    expect(UNIFIED_SD_FILES.zhuge_jin?.sd).toMatch(/^zhuge_jin-sd-v\d+\.webp$/);expect(UNIFIED_SD_FILES.zhuge_jin?.duel).toMatch(/^zhuge_jin-duel-v\d+\.webp$/);
    // 4차 불합격 장수(주유 등)는 예전 그림 그대로다. 조조·손권·여포는 5차(f13bbec, 군주 기마)에 통합 SD로 들어왔다.
    for(const id of ['cao_cao','sun_quan','lu_bu'])expect((UNIFIED_SD_IDS as readonly string[]).includes(id),id).toBe(true);
    expect(UNIFIED_SD_FILES.sun_quan?.sd).toMatch(/^sun_quan-sd-v\d+\.webp$/);expect(UNIFIED_SD_FILES.sun_quan?.duel).toMatch(/^sun_quan-duel-v\d+\.webp$/);
    expect(UNIFIED_SD_FILES.wooden_zhuge?.sd).toMatch(/^wooden_zhuge-sd-v\d+\.webp$/);expect(UNIFIED_SD_FILES.wooden_zhuge?.duel).toMatch(/^wooden_zhuge-duel-v\d+\.webp$/);
    // 4차에 불합격했던 서황·등애·종회·대릉·악진은 2026-10-15 SD 재제작에서 통합 SD로 들어왔다.
    for(const id of ['xu_huang','deng_ai','zhong_hui','dai_ling','yue_jin'])expect((UNIFIED_SD_IDS as readonly string[]).includes(id),id).toBe(true);
    // 6차(9e662ab까지): 맹획·주유·올돌골 다시 그린 판, 조상·장소·안량, 곽회·조홍·여몽·주연(도보)은 통합 SD로 들어왔다.
    for(const id of ['zhou_yu','guo_huai','cao_hong','lu_meng','zhu_ran','meng_huo','wutugu','cao_shuang','zhang_zhao','yan_liang'])expect((UNIFIED_SD_IDS as readonly string[]).includes(id),id).toBe(true);
    expect(UNIFIED_SD_FILES.meng_huo?.sd).toMatch(/^meng_huo-sd-v\d+\.webp$/);expect(UNIFIED_SD_FILES.meng_huo?.duel).toMatch(/^meng_huo-duel-v\d+\.webp$/);
    expect(UNIFIED_SD_FILES.zhou_yu?.sd).toMatch(/^zhou_yu-sd-v\d+\.webp$/);expect(UNIFIED_SD_FILES.zhou_yu?.duel).toMatch(/^zhou_yu-duel-v\d+\.webp$/);
    // 통합 SD가 아닌 장수 8명은 일기토만 새 판.
    for(const id of DUEL_V2.filter(id=>!(UNIFIED_SD_IDS as readonly string[]).includes(id))){// 그 뒤 통합 SD로 바뀐 장수는 위 검사가 맡는다
      expect(officerDuelModel({id,name:id})?.sheet,id).toBe(`officers/${id}-duel-v2.webp`);
      // 옛 일기토 파일(정보·장춘화·대릉의 -duel-v1)이 남아 있어도 위에서 본 대로 통합 그림이 쓰인다.
    }
    for(const f of ['cao_pi-battle-lord-v1','cao_rui-duel-v1','xu_chu-battle-infantry-v1','chen_gong-battle-strategist-v1','zhang_liao-duel-v1','meng_da-sd-v1','meng_da-duel-v2','guan_suo-sd-v1','sima_zhao-duel-v3','jun-duel-v2','huang_zhong-duel-v2','zhao_yun-duel-v2'])
      expect(existsSync(new URL(`../public/officers/${f}.webp`,import.meta.url)),f).toBe(false);
    // 군주는 통합 SD로 바뀌어도 군주 병종으로 본다(전장 모습은 SD 한 벌).
    expect(officerBattleSheet({id:'cao_pi',name:'조비',unitClass:'lord'})?.action.sheet).toBe('officers/cao_pi-sd-v1.webp');
    for(const id of ['cao_pi','cao_rui','zhang_he','cao_ren','xiahou_dun','xiahou_yuan','zhang_liao','gongsun_yuan','meng_yan','bi_yan'])expect(officerDuelMounted({id,name:id}),id).toBe(true);
    for(const id of ['xu_chu','sima_fu','hu_zun','wang_shuang','lu_xun','chen_gong','zhu_rong','xu_shu','lu_fan','sun_shao','wang_ling','yang_ang','zhuge_ke'])expect(officerDuelMounted({id,name:id}),id).toBe(false);
  });
});
