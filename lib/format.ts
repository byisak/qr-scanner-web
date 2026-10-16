// 글자 도우미: 한국어 조사, 상대 시간

/* ─── 한국어 조사 ───
 * 낱말의 마지막 글자 받침에 맞춰 조사를 붙인다.
 *   eul("세션")  → "세션을"      eul("스캔 기록") → "스캔 기록을"   eul("QR") → "QR을(를)"
 *   ga("파일")   → "파일이"      eun("사용자")    → "사용자는"
 *   wa("세션")   → "세션과"      euro("서울")     → "서울로"  (ㄹ 받침은 "로")
 * 한글로 끝나지 않으면(영문·숫자 등) 두 형태를 함께 적는다: "QR을(를)".
 */
type Pair = readonly [withBatchim: string, withoutBatchim: string]

const EUL: Pair = ["을", "를"]
const GA: Pair = ["이", "가"]
const EUN: Pair = ["은", "는"]
const WA: Pair = ["과", "와"]
const EURO: Pair = ["으로", "로"]

function lastHangul(word: string): number | null {
  const t = word.trim()
  if (!t) return null
  const c = t.charCodeAt(t.length - 1)
  return c >= 0xac00 && c <= 0xd7a3 ? (c - 0xac00) % 28 : null
}

/** 받침 여부에 맞는 조사만 돌려준다 (낱말은 붙이지 않음). 한글이 아니면 "을(를)" 꼴 */
export function particle(word: string, [withB, withoutB]: Pair, rieulAsVowel = false): string {
  const jong = lastHangul(word)
  if (jong === null) return `${withB}(${withoutB})`
  if (jong === 0) return withoutB
  if (rieulAsVowel && jong === 8) return withoutB // ㄹ 받침 + (으)로 → "로"
  return withB
}

/** 을/를 */
export const eul = (word: string) => word + particle(word, EUL)
/** 이/가 */
export const ga = (word: string) => word + particle(word, GA)
/** 은/는 */
export const eun = (word: string) => word + particle(word, EUN)
/** 과/와 */
export const wa = (word: string) => word + particle(word, WA)
/** 으로/로 (ㄹ 받침은 "로") */
export const euro = (word: string) => word + particle(word, EURO, true)

/** 빈 상태 제목: emptyTitle("세션") → "아직 세션이 없어요" */
export const emptyTitle = (noun: string) => `아직 ${ga(noun)} 없어요`

/* ─── 상대 시간 ───
 * timeAgo(iso, "ko") → "방금 전", "3시간 전", "어제" …  (Intl.RelativeTimeFormat 사용, 모든 로케일)
 * 지금 시각에 따라 달라지므로 화면에서는 <TimeAgo>(브라우저에서만 계산)로 쓴다.
 */
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
]

export function timeAgo(value: string | number | Date, locale = "ko", now = Date.now()): string {
  const t = value instanceof Date ? value.getTime() : new Date(value).getTime()
  if (Number.isNaN(t)) return ""
  const diffSec = Math.round((t - now) / 1000)
  const abs = Math.abs(diffSec)
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" })
  if (abs < 45) return rtf.format(0, "second") // "지금" / "now"
  for (const [unit, sec] of UNITS) {
    if (abs >= sec) return rtf.format(Math.round(diffSec / sec), unit)
  }
  return rtf.format(Math.round(diffSec / 60), "minute")
}
