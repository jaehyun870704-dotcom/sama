# 초상화 상업 이용·출처 점검

점검일: 2026-10-11

## 결론

- 배포 초상 53개는 모두 512×512 이상 정사각이며 완전 중복 파일이 없다.
- 파일·커밋·제작 문서에서 타사 게임 원화, 로고, 워터마크, 상표 또는 실존 배우를 입력으로 쓴 기록은 발견되지 않았다.
- 출처 기록이 없던 `meng-da.webp`, `xu-chu.webp`는 배포 폴더에서 격리하고 내장 OpenAI `image_gen`으로 만든 독창적 신규 초상으로 교체했다.
- 절차 생성 초상을 쓰던 장비는 전용 신규 초상 `zhang-fei.png`로 교체했다.
- Canva AI 초상은 Canva AI 출력물로 기록되어 있다. Canva의 2026-06-26 AI Product Terms는, Canva 라이브러리 콘텐츠를 포함하지 않은 출력에 대해 이용자가 출력물을 소유하고 합법적인 목적으로 사용할 수 있다고 설명한다. 다만 출력의 비침해를 보증하지 않으므로 출시 전 법률 자문과 유사성 검토가 필요하다.
- OpenAI 생성 초상은 내장 `image_gen` 출력이다. OpenAI Terms of Use는 허용되는 범위에서 이용자가 출력을 소유한다고 설명하지만, 출력의 적법한 사용 책임과 비고유성 가능성은 이용자에게 남는다.

이 문서는 법률 의견이나 제3자 권리 비침해 보증이 아니다. 상업 출시 전에는 관할 지역의 변호사 검토와 주요 삼국지 게임·영화·방송물에 대한 별도 유사성 검토를 권장한다.

## 출처별 목록

### Canva AI — 28개

근거 커밋: `cc98e6e`, `c9755bb`.

`cao-cao.webp`, `cao-pi.webp`, `cao-zhen.webp`, `cao-zhi.webp`, `deng-ai.webp`, `gao-lan.webp`, `guo-huai.webp`, `guo-jia.webp`, `jia-xu.webp`, `jiang-ji.webp`, `jiang-wei.webp`, `ju-shou.webp`, `sima-fang.webp`, `sima-fu.webp`, `sima-lang.webp`, `sima-shi.webp`, `sima-yi.webp`, `sima-zhao.webp`, `wei-yan.webp`, `wen-chou.webp`, `xiahou-yuan.webp`, `xu-huang.webp`, `xun-yu.webp`, `yang-xiu.webp`, `zhang-chunhua.webp`, `zhang-he.webp`, `zhang-liao.webp`, `zhuge-liang.webp`.

조건부 판정: 제작 기록상 Canva AI 출력이며 타사 라이브러리 콘텐츠를 입력으로 사용했다는 기록은 없다. Canva 계정의 당시 생성·내보내기 기록은 저장소만으로 재검증할 수 없다.

### OpenAI 내장 image_gen — 기존 22개

근거: `docs/tech/portrait-completion-2026-10-05.md`와 각 파일의 개별 Codex 커밋.

`cao-ren.png`, `cao-rui.png`, `cao-shuang.png`, `cao-xi.png`, `cao-xiu.png`, `chen-tai.png`, `dai-ling.png`, `hao-zhao.png`, `he-yan.png`, `hu-zun.png`, `huan-fan.png`, `jia-kui.png`, `qian-zhao.png`, `sun-li.png`, `tian-chou.png`, `wang-ji.png`, `wang-ling.png`, `wen-qin.png`, `xiahou-dun.png`, `yu-jin.png`, `zang-ba.png`, `zhong-hui.png`.

### OpenAI 내장 image_gen — 2026-10-11 신규·교체 3개

- `zhang-fei.png`: 장비 전용 신규 초상. 기존 게임·영화·배우·프랜차이즈 디자인을 참조하거나 모사하지 않도록 생성.
- `meng-da.png`: 출처 미확인 `meng-da.webp` 대체.
- `xu-chu.png`: 출처 미확인 `xu-chu.webp` 대체. 기존 파일의 호피 표현을 재사용하지 않음.

원본 생성 파일은 Codex 생성 이미지 저장소에 보존되어 있으며, 프로젝트용 사본을 `packages/web/public/portraits/`에 배치했다.

### 저장 파일이 없는 나머지 장수

`manifest.json`에 전용 파일이 없는 장수는 외부 그림을 불러오지 않는다. `packages/web/src/portrait.ts`의 저장소 자체 Canvas 도형·색상·난수 시드 코드가 이름과 병종을 바탕으로 초상을 그린다. 따라서 이 경로에서 배포되는 초상은 저장소 코드로 새로 렌더링되는 독창적 조합이며, 별도 제3자 이미지 라이선스는 없다. 사용자가 게임 안에서 직접 업로드하는 초상은 사용자 제공 콘텐츠이므로 이 점검의 범위에서 제외한다.

## 격리 파일

상업 배포에 사용하지 않는 과거 파일:

- `docs/art-quarantine/portraits/meng-da-unverified.webp`
- `docs/art-quarantine/portraits/xu-chu-unverified.webp`

두 파일은 출처·도구·사용권 기록이 커밋에 없어 배포 폴더에서 제거했다. 비교와 복구를 위해 삭제하지 않고 격리했다.

## 자동 검사

- 대상: `packages/web/public/portraits/`의 이미지 53개.
- 정사각·최소 해상도: 전부 통과.
- SHA-256 완전 중복: 없음.
- 상단 8% 밝기: 중앙의 밝은 관모가 포함된 `yang-xiu.webp`가 전체 띠 평균 97.8로 탐지됐으나, 좌우 배경 영역 평균은 49.2로 배경 기준 60 이하를 충족한다.

## 적용 약관 확인 위치

- Canva AI Product Terms: https://www.canva.com/policies/ai-product-terms/
- OpenAI Terms of Use: https://openai.com/policies/row-terms-of-use/
