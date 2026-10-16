import localFont from "next/font/local";

// Pretendard Variable 자체 호스팅 (npm `pretendard`, 꿀앱과 같은 방식). 외부 CDN 요청 없음.
// 일본어·중국어 글자는 globals.css 의 font-family 대체 순서(시스템/Noto)로 이어서 그린다.
export const pretendard = localFont({
  src: "../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
  variable: "--font-pretendard",
  weight: "45 920",
  display: "swap",
});

// 브라우저 주소창 색: 라이트/다크 배경 토큰과 같게
export const themeColor = [
  { media: "(prefers-color-scheme: light)", color: "#f4f4f5" },
  { media: "(prefers-color-scheme: dark)", color: "#111113" },
];
