# 인물열전 채색 초상화 보강

기준: 기존 사마의·사마방의 사실적인 채색 인물화, 어두운 배경과 읽기 쉬운 얼굴. 인물마다 하나씩 제작·연결·검증하고 개별 커밋을 원격에 반영한다. 신장수의 사용자 제작 얼굴은 유지한다.

제작 도구: 내장 image_gen (CLI/API 대체 경로 사용 없음).

## 왕릉 — 완료

파일: `packages/web/public/portraits/wang-ling.png`. 백발의 노신, 긴 수염과 청록색 관복. 단독 인물·복식·얼굴 육안 확인, manifest 연결.

### 생성 프롬프트

Use case historical-scene. Single square premium Three Kingdoms game portrait of Wang Ling (왕릉), elderly Wei statesman and military governor, original semi-realistic digital oil painting matching polished Sima Fang / Sima Yi dark historical portraits. Lean East Asian man around  seventy, long angular face, high cheekbones, weathered warm skin and deep forehead lines, stern concerned deep-set eyes, thick silver eyebrows, elegant long silver-gray beard and mustache. Black ribbed Han official guan cap with small aged bronze plaque, dark muted teal official robes layered over barely visible worn iron lamellar at shoulders, restrained brown woven collar. Upright proud posture, three-quarter looking to left, calm resolve. Headgear and beard fully within square, shoulders and chest filling bottom, face large enough for tiny game thumbnail. Warm chiaroscuro light on face, subtle cool rim, softly painted dark olive charcoal background, meticulous aged skin and silk texture, painterly naturalism, sober dignified mood. No text, no name strip, no frame, no watermark, no extra person, no modern clothing, no anime, no vector art. One finished square portrait.

## 조상 — 완료

파일: `packages/web/public/portraits/cao-shuang.png`. 둥근 얼굴, 검은 관모, 자주색 비단과 의장 갑옷. 단독 인물과 얼굴·복식 육안 확인, manifest 연결.

### 생성 프롬프트

Use case historical-scene. One square bust portrait of Cao Shuang (조상), Wei imperial clansman and grand general aged about 40. Premium semi-realistic digital oil painting for a Three Kingdoms strategy game matching dark painterly Sima Yi and Sima Fang portraits. Distinct East Asian man with full rounded cheeks, pale warm skin, broad softly rounded nose, small carefully groomed mustache and short neat chin beard, intelligent but complacent slightly anxious eyes. Broad imposing build. Tall formal black guan cap with restrained gold fittings, rich dark burgundy silk robes over subtle gold-edged ceremonial lamellar armor. No helmet, no crown of a king. Head and chest composition, three-quarter turned slightly right, eyes toward viewer, entire cap inside frame with breathing room, face large readable at 60px, chest cropped bottom. Deep charcoal brown smoky background, warm side light, fine silk embroidery and realistic face brushwork, exquisite historical game character illustration, understated luxury. Single person only, no writing, no borders, no symbols, no watermark, no anime, no flat vector, no photo. Square 1024x1024.

## 조휴 — 완료

파일: `packages/web/public/portraits/cao-xiu.png`. 배포 manifest의 조휴 항목에 연결. 이미지 육안 확인: 단독 인물, 갑옷·얼굴 정상, 글자 없음. 인물열전은 공통 초상화 로더에서 이 파일을 읽는다.

### 생성 프롬프트

Use case: historical-scene. Asset: square premium Three Kingdoms strategy game officer portrait, single bust of Cao Xiu (조휴), Wei cavalry commander. Original semi-realistic masterful digital oil painting, rich detailed natural face and historically inspired late Han clothing, matching a mature Sima Yi / elderly Sima Fang portrait collection. Cao Xiu is an East Asian man in his late 40s, lean broad-cheeked face, strong slightly hooked nose, close black mustache and short forked beard, proud alert eyes with restrained weariness. Dark iron cavalry helmet with small restrained bronze crest, indigo cloak over intricate dark lamellar armor and muted bronze clasps. Three-quarter pose looking slightly left, face fully visible and brightly readable even as a 60px icon. Head and shoulders fill square, helmet fully inside frame, face in upper middle third, chest cropped below. Dramatic soft warm light from upper left, subtle cool rim, deep near-black navy smoky background, painterly realism with fine skin, cloth and metal textures. Serious historical illustrated character, not photograph, not cartoon, not anime, not flat vector, no giant fantasy pauldrons. No letters, names, border, logos, watermark, weapons crossing face or other people. Output one finished 1024x1024 square portrait.
