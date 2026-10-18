# 첫 화면 줌 영상

창고 선반 → 상자 라벨 → 바코드 막대 하나(0.33 mm) → 와이어프레임 손(촘촘한 사각 격자, ?hand= 로 다른 모양)에 든 폰이 앱으로 스캔(폰 카메라가 라벨을 실제로 찍어 화면에 표시) → 폰에서 PC로 가는 금색 빛 → 세션 표의 새 줄 → 다시 창고. 24초, 끊김 없이 반복.
`scene.html` 의 `renderAt(t)` 가 시각 t 한 장면을 그리는 순수 함수라, 같은 t 는 언제나 같은 그림이다.

## 다시 만들기

```bash
# 정지 화면 확인 (초 단위)
node stills.cjs /tmp/zoom-stills 0 5 7.6 10.4 11.5 13.6 17 21   # 영어: LANG_HUD=en node stills.cjs ...

# 720 프레임 × 2 (폰 화면·머리글이 언어별이라 한국어·영어 따로, M1 에서 약 90초)
node render.cjs /Volumes/T7/dev-cache/zoom/frames

# 웹용 인코딩 (720×900, 약 1.7 MB)
for l in ko en; do
  ffmpeg -y -framerate 30 -i frames/$l/%04d.jpg -vf scale=720:900:flags=lanczos \
    -c:v libx264 -preset slow -crf 25 -pix_fmt yuv420p -movflags +faststart -an public/landing/zoom-$l.mp4
  ffmpeg -y -framerate 30 -i frames/$l/%04d.jpg -vf scale=720:900:flags=lanczos \
    -c:v libvpx-vp9 -b:v 0 -crf 38 -row-mt 1 -an public/landing/zoom-$l.webm
done
# 포스터: 0번 프레임을 cwebp 로 public/landing/zoom-poster-<언어>.webp
```

- Playwright(playwright-core)와 시스템 Chrome 을 쓴다. 헤드리스에서도 GPU(Metal)로 그린다.
- 브라우저에서 `scene.html?t=8.6` 처럼 열면 그 순간에서 멈춘다 (`&lang=en` 으로 영어 머리글·폰 화면).
- 장(章) 머리글과 사실 문장은 `CH` 배열, 카메라 동선은 `KEYS`(시각·바라보는 점·방향·거리, 거리는 로그로 보간).
- 색은 사이트 토큰: 종이 #f4f4f5, 먹 #18181b, 강조 #f2b230 하나.
