# 첫 화면 줌 영상

창고 → 라벨 → 폰 화면 시점 스캔(첫 라벨은 막대 묶음이 숫자로 풀리는 해독, 이어서 연속 모드로 QR·Code 128) → 폰에서 바로 앞 PC로 금색 빛, 두 번째 빛은 지붕 위로 → 지구로 줌아웃, 태평양을 건너 LA 사무실 PC(같은 세션, 현지 시각) → 다시 지구를 건너 서울 창고. 38초, 끊김 없이 반복. 장면 셋(창고·지구·LA 사무실)을 겹쳐 잇는다.
`scene.html` 의 `renderAt(t)` 가 시각 t 한 장면을 그리는 순수 함수라, 같은 t 는 언제나 같은 그림이다.

## 다시 만들기

```bash
# 정지 화면 확인 (초 단위)
node stills.cjs /tmp/zoom-stills 0 5 7.6 10.4 11.5 13.6 17 21   # 영어: LANG_HUD=en node stills.cjs ...

# 1140 프레임 × 2 (폰 화면·머리글이 언어별이라 한국어·영어 따로, M1 에서 약 2분)
node render.cjs /Volumes/T7/dev-cache/zoom/frames

# 웹용 인코딩 (720×900, 약 2.4 MB)
for l in ko en; do
  ffmpeg -y -framerate 30 -i frames/$l/%04d.jpg -vf scale=720:900:flags=lanczos \
    -c:v libx264 -preset slow -crf 27 -pix_fmt yuv420p -movflags +faststart -an public/landing/zoom-$l.mp4
  ffmpeg -y -framerate 30 -i frames/$l/%04d.jpg -vf scale=720:900:flags=lanczos \
    -c:v libvpx-vp9 -b:v 0 -crf 40 -row-mt 1 -an public/landing/zoom-$l.webm
done
# 포스터: 0번 프레임을 cwebp 로 public/landing/zoom-poster-<언어>.webp
```

- Playwright(playwright-core)와 시스템 Chrome 을 쓴다. 헤드리스에서도 GPU(Metal)로 그린다.
- 브라우저에서 `scene.html?t=8.6` 처럼 열면 그 순간에서 멈춘다 (`&lang=en` 으로 영어 머리글·폰 화면).
- 장(章) 머리글과 사실 문장은 `CH` 배열, 카메라 동선은 `KEYS`(시각·바라보는 점·방향·거리, 거리는 로그로 보간).
- 색은 사이트 토큰: 종이 #f4f4f5, 먹 #18181b, 강조 #f2b230 하나.


## 지구 점 데이터
`land-dots.js` 는 Natural Earth 1:50m 육지(공개 영역)를 world-atlas(ISC) + d3-geo 로 0.8° 간격 점으로 바꾼 것이다. 다시 만들 때는 d3-geo·topojson-client·world-atlas@2 를 설치한 폴더에서 위도 -58~82°, 경도 간격 0.8°/cos(위도)로 `geoContains` 를 돌려 `window.LAND_DOTS = [위도×10, 경도×10, ...]` 로 저장한다.
## 가로판 (첫 화면 배경)
`FMT=wide node render.cjs <폴더>` 로 16:9 판을 렌더한다. 피사체를 가로 66% 지점에 두고(왼쪽은 페이지 문구 자리), 장 머리글·워드마크는 그리지 않는다.
웹용은 1920×1080 그대로(crf 34, -tune animation)  `public/landing/zoom-wide-{ko,en}.{mp4,webm}` + `zoom-wide-poster-*.webp`. 페이지에서는 `object-position: 66% 50%` 로 카드 비율이 달라도 피사체가 같은 자리에 오게 한다.

## Anatomy 화풍 (첫 화면에 쓰는 판)
`STYLE=anatomy node render.cjs <폴더>` (가로판은 `FMT=wide` 도 함께). 창고·LA 사무실의 면을 종이색 4단 툰 음영으로 바꾸고 모서리마다 윤곽선(EdgesGeometry 28°)을 긋는다. 그림자·톤매핑은 끄고, 강조색은 금색 하나만 남긴다(LA 창밖도 흑백).
윤곽선은 `LineSegments2`(굵기 1.25 × SS px)로 그린다. WebGL 기본 선은 1px 고정이라 줄이거나 늘려 보이면 흐려진다. 선이 많아 1080p 인코딩은 crf 34 · VP9 crf 52 로 맞춘다(언어별 약 3~3.7 MB).

## 35초 판 (현재)
장면 시각은 38초 그대로 두고 `renderFrame` 이 영상 시각 → 장면 시각(`WARP`)으로 바꿔 35초에 담는다. 스캔 구간은 그대로, 창고 진입·PC 이후를 조금 빠르게.
연속 스캔은 이웃이 둘 있는 한쪽으로만 이어 간다(첫 라벨을 다시 지나치지 않게). 도로망은 끔. Anatomy 판의 지구는 점 대신 해안선(`coast.js`, Natural Earth 1:110m)과 30° 경위선을 먹선으로 그린다.
두 PC 화면 오른쪽 위에 금색 '실시간' 점이 깜빡인다. 프레임 폴더를 다시 쓸 때는 지난 렌더의 남은 프레임이 섞이지 않게 ffmpeg 에 `-frames:v 1050` 을 준다.
LA 화면에서 32.0~33.6 s(장면 시각)에 '엑셀 내보내기' 단추가 눌리고 표가 XLSX 문서 아이콘으로 접혀 '저장됨' 칸으로 내려간다. 그동안 카메라는 모니터 쪽으로 다가간다. 연속 스캔에서 라벨 사이를 지날 때는 POV_D × 2.7 까지 물러나 상자 틈만 보이지 않게 한다.
라벨에서 다음 라벨로는 옆으로 훑지 않고 0.4초 겹쳐 넘긴다(`DISSOLVE`). 지구 위 도시 이름은 알약 모양 이름표. 폰→PC 구간(18.2 s)은 솟는 두 빛이 위에서 잘리지 않게 크게 물린다.
