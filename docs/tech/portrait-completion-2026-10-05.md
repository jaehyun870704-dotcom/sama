# 인물열전 채색 초상화 보강

기준: 기존 사마의·사마방의 사실적인 채색 인물화, 어두운 배경과 읽기 쉬운 얼굴. 인물마다 하나씩 제작·연결·검증하고 개별 커밋을 원격에 반영한다. 신장수의 사용자 제작 얼굴은 유지한다.

제작 도구: 내장 image_gen (CLI/API 대체 경로 사용 없음).

## 조휴 — 완료

파일: `packages/web/public/portraits/cao-xiu.png`. 배포 manifest의 조휴 항목에 연결. 이미지 육안 확인: 단독 인물, 갑옷·얼굴 정상, 글자 없음. 인물열전은 공통 초상화 로더에서 이 파일을 읽는다.

### 생성 프롬프트

Use case: historical-scene. Asset: square premium Three Kingdoms strategy game officer portrait, single bust of Cao Xiu (조휴), Wei cavalry commander. Original semi-realistic masterful digital oil painting, rich detailed natural face and historically inspired late Han clothing, matching a mature Sima Yi / elderly Sima Fang portrait collection. Cao Xiu is an East Asian man in his late 40s, lean broad-cheeked face, strong slightly hooked nose, close black mustache and short forked beard, proud alert eyes with restrained weariness. Dark iron cavalry helmet with small restrained bronze crest, indigo cloak over intricate dark lamellar armor and muted bronze clasps. Three-quarter pose looking slightly left, face fully visible and brightly readable even as a 60px icon. Head and shoulders fill square, helmet fully inside frame, face in upper middle third, chest cropped below. Dramatic soft warm light from upper left, subtle cool rim, deep near-black navy smoky background, painterly realism with fine skin, cloth and metal textures. Serious historical illustrated character, not photograph, not cartoon, not anime, not flat vector, no giant fantasy pauldrons. No letters, names, border, logos, watermark, weapons crossing face or other people. Output one finished 1024x1024 square portrait.
