# 병종 전용 그림 우선 제작

사용자 지시: 병종 그림 전체를 먼저 완성하고 인물 초상화는 그 다음에 재개한다.

## 등갑병 계통
- 등갑병 / 정예 등갑병 / 오과국 등갑병: 3행, 각 행 대기·공격·이동·피격 4열.
- 파일: packages/web/public/troops-rattan-v2.png
- 내장 image_gen, 투명 배경. 그림 검수 후 spriteAtlas로 실루엣을 분리해 도감·진화표·전장·전투 상세에 연결.
- 보병 그림 재사용 및 금속 갑옷 덧씌우기를 전용 그림으로 대체.

### 생성 프롬프트

Game production sprite atlas, original Three Kingdoms tactical RPG. TRUE TRANSPARENT BACKGROUND. One landscape image with EXACTLY 12 isolated full-body soldier sprites arranged in precise regular grid: 3 equal rows and 4 equal columns. Each sprite stays entirely within own cell with generous transparent padding. No text, labels, grid lines, scenery, shadows on ground or border. Semi-realistic hand-painted 2D game sprites, detailed but readable at 80px, slightly elevated three-quarter camera facing bottom-right, full body feet visible, believable East Asian adults with slightly enlarged heads. RATTAN INFANTRY evolution family: every soldier wears unmistakable interwoven honey-brown rattan body armor and woven rattan helmet, round woven wicker shield in left hand and single curved dao sword in right hand. Row1 basic rattan soldier: plain wicker armor and green cloth, small shield. Row2 elite rattan: denser layered dark wicker armor, reinforced broad wicker shield and deep green shoulder cape. Row3 Wuguo veteran rattan: intricate dark woven armor with restrained brass bindings, ochre cape, taller woven helmet and large reinforced woven shield; still wicker, NOT metallic plate. EACH ROW depicts SAME soldier in four distinct action frames: col1 steady idle shield forward sword lowered; col2 sword slash attack with sword extended forward, shield held near torso; col3 walking forward with one leg advanced and sword lowered; col4 recoiling hit pose with knees bent and shield raised, no blood. Consistent scale within rows, clean separated silhouettes, sword and shield physically connected to hands. All 12 figures and weapons fully inside cells, not cropped. No extra floating objects or effects. Render as one clean 4-column by 3-row sprite sheet on alpha transparency.

## 이후 제작
현재 전용 3단계 그림을 갖추지 않은 다른 계통을 순차 제작한다. 초상화 추가 제작은 모든 병종 완료 뒤 재개한다.
