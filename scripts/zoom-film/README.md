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