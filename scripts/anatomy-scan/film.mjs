// 첫 화면 영상의 Anatomy 판: 창고 선반 앞 대차에 라벨 세 장(EAN-13 · QR · Code 128)을 싣고, 받침대에 세운 폰이
// 첫 장은 막대를 숫자로 풀어 읽고 나머지 둘은 연속으로 읽는다. 결과 세 건이 금색 맥을 타고 바로 앞 서울 단말과
// 지구본 너머 LA 단말에 같은 세 줄로 찍힌다. 장면은 시각 t 의 순수 함수(window.renderAt)라 프레임마다 찍을 수 있다.
// 사용: node film.mjs <출력폴더> [--lang en] [--dark]   → film-<lang>.html (녹화용) + figure-<lang>.html (카드판)
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const SKILL = join(homedir(), ".agents/skills/anatomy");
const k = await import(join(SKILL, "kit/iso-kit.mjs"));
const G = await import(join(SKILL, "kit/lathe.mjs"));
const { kitScript } = await import(join(SKILL, "scripts/inline-kit.mjs"));

const OUT = process.argv[2] || ".";
const LANG = process.argv.includes("--lang") ? process.argv[process.argv.indexOf("--lang") + 1] : "ko";
const theme = process.argv.includes("--dark") ? "dark" : "light";
const WIDTH = 640, HEIGHT = 420;
const TX = {
  ko: { seoulHead: "서울 · 세션 A-0312", laHead: "LA · 같은 세션", group: "기본 그룹", mode: "연속", clock: "서울 09:41 · LA 17:41 (전날)" },
  en: { seoulHead: "Seoul · session A-0312", laHead: "LA · same session", group: "Default", mode: "Continuous", clock: "Seoul 09:41 · LA 17:41 (prev. day)" },
}[LANG];

// ───────── 세계 (단위 ≈ 1 px, z 위) ─────────
const PLATE = { x: -178, y: -66, w: 334, d: 124, r: 9 };
const PLATE_H = 10, FOOT_H = 5;
const RAIL_Y = [-30, -8], RAIL_FROM = -172, RAIL_TO = 2;
const GX = -66;                                                 // 받침대(아치) x = 렌즈 x
const SLOT = 25;                                                // 라벨 간격 (대차 위)
const CART = { x: -40, y: -36, w: 80, d: 34, r: 2.4 };         // 대차 (x=0 기준, 움직인다)
const CART_Z = 3, CART_TOP = 8;
const LABEL_W = 21, LABEL_D = 28;
const LABEL_TOP = CART_TOP + 0.6;
const LOCAL = [SLOT, 0, -SLOT];                                 // 라벨 1·2·3 의 대차 위 x (앞장선 것부터 읽는다)
const HOME = GX - SLOT - 30;                                    // 싣는 곳 (레일 안)
const AT = LOCAL.map((lx) => GX - lx);                          // 라벨 i 가 렌즈 밑에 올 때 대차 x
const POSTS = [[GX, -46], [GX, 10]];
const BEAM = { x: GX - 7, y: -50, w: 14, d: 64, r: 2 };
const BEAM_Z = 50, BEAM_TOP = 57;
const LENS = [GX, -19];
const PHONE = { x: GX - 20, y: -8, w: 40, d: 5, r: 3 };
const PHONE_Z = BEAM_TOP + 3, PHONE_TOP = PHONE_Z + 70;
const PH_FRONT = PHONE.y + PHONE.d;
const SEOUL = { x: 8, y: 6, w: 50, d: 38, r: 4 };
const SEOUL_TOP = 52;
const GLOBE = [64, -40], GLOBE_R = 17, GLOBE_Z = 44;
const LA = { x: 108, y: -2, w: 42, d: 34, r: 4 };
const LA_TOP = 46;
const RACK = { x: -168, y: -62, w: 96, d: 16 };                 // 뒤쪽 창고 선반
const SCANS = [
  { code: "8801234001014", kind: "EAN-13" },
  { code: "LOT-2611-B0418", kind: "QR" },
  { code: "BOX-C0527-03", kind: "CODE 128" },
];
const PREV = ["8801234006064", "BOX-A0312-07", "8801234002028"];

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [PHONE.x, PHONE.y, PHONE_TOP], [PHONE.x + PHONE.w, PH_FRONT, PHONE_TOP], [RACK.x, RACK.y, 92], [GLOBE[0], GLOBE[1], GLOBE_Z + GLOBE_R + 6]],
  WIDTH, HEIGHT, { pad: 26, azimuth: 48 },
);
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (pts, style) => k.dotsSvg(pts, style);
const depth = (x, y, z = 0) => k.depthOf([x, y, z], P);
const byDepth = (pts) => [...pts].sort((a, b) => depth(a[0], a[1]) - depth(b[0], b[1]));
const planeOf = (y) => k.sideMatrix([0, y], 0, P, "left");
const flat = (x0, z0, x1, z1, r, steps = 6) => k.pathOf(k.roundedPlan({ x: x0, y: z0, w: x1 - x0, d: z1 - z0, r }, steps).map(([u, z]) => [u, -z]), true);
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

let clips = 0;
function recess({ x0, x1, z0, z1, r, depth: dep }, y, back = "", backClass = "sc-glass") {
  const id = `sc-clip-${clips++}`;
  const ring = k.roundedPlan({ x: x0, y: z0, w: x1 - x0, d: z1 - z0, r }, 6);
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const { sinA } = k.cameraOf(P);
  const tops = [], sides = [[], [], [], []];
  ring.forEach(([ax, az], i) => {
    const [bx, bz] = ring[(i + 1) % ring.length];
    const len = Math.hypot(bx - ax, bz - az) || 1;
    let [nx, nz] = [(bz - az) / len, -(bx - ax) / len];
    if (nx * (cx - (ax + bx) / 2) + nz * (cz - (az + bz) / 2) < 0) [nx, nz] = [-nx, -nz];
    if (nx <= 0 && nz <= 0) return;
    const quad = k.pathOf([at([ax, y, az]), at([bx, y, bz]), at([bx, y - dep, bz]), at([ax, y - dep, az])], true);
    if (nz >= nx) tops.push(quad);
    else sides[Math.min(3, Math.max(0, Math.floor(((nx * -sinA + 1) / 2) * 4)))].push(quad);
  });
  const shape = flat(x0, z0, x1, z1, r);
  return [
    `<clipPath id="${id}"><path transform="${planeOf(y)}" d="${shape}"/></clipPath>`,
    `<g clip-path="url(#${id})">`,
    `<path class="iso-top" d="${tops.join("")}"/>`,
    ...sides.map((d, shade) => (d.length ? `<path class="iso-shade" data-shade="${shade}" d="${d.join("")}"/>` : "")),
    `<g transform="${planeOf(y - dep)}"><path class="${backClass}" d="${shape}"/>${back}<path class="iso-line" data-tone="faint" d="${shape}"/></g>`,
    `</g>`,
    `<g transform="${planeOf(y)}"><path class="iso-line" data-tone="lo" d="${shape}"/></g>`,
  ].join("");
}

// ───────── 받침판 ─────────
function plate() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(PLATE, 22))) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  const strip = { x: RAIL_FROM, y: PLATE.y + PLATE.d - 16, w: RAIL_TO - RAIL_FROM - 10, d: 7, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const t = k.topTicks(strip.x + 3, strip.x + strip.w - 3, 4, 5, strip.y + 0.8, 0.6, [2, 3.6], P);
  out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
  const label = { x: 84, y: PLATE.y + PLATE.d - 17, w: 46, d: 10, r: 1.2 };
  out.push(S(k.slabOf(label, 0, 0.8, P, 3), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(label, 1.4), 0.8, P, 3), { tone: "faint" }));
  out.push(L([32, 24, 14].map((w, i) => k.lineOnTop([label.x + 4, label.y + 2.6 + i * 2.4], [label.x + 4 + w, label.y + 2.6 + i * 2.4], 0.8, P)).join(""), { tone: "lo", free: true }));
  out.push(D([at([label.x + label.w - 3, label.y + 2.4, 0.8]), at([label.x + label.w - 3, label.y + label.d - 2.4, 0.8])], { size: 0.45 }));
  return out.join("");
}

// ───────── 창고 선반 (뒤쪽): 기둥 넷, 단 셋, 상자마다 작은 라벨 ─────────
function rack() {
  const out = [`<path class="iso-halo" d="${k.haloOf({ ...RACK, r: 2 }, 0, 6, P)}"/>`];
  const levels = [4, 34, 64];
  const posts = [[RACK.x + 2, RACK.y + 2], [RACK.x + RACK.w - 2, RACK.y + 2], [RACK.x + 2, RACK.y + RACK.d - 2], [RACK.x + RACK.w - 2, RACK.y + RACK.d - 2]];
  for (const [x, y] of byDepth(posts.slice(0, 2))) out.push(S(k.slabOf({ x: x - 1.6, y: y - 1.6, w: 3.2, d: 3.2, r: 0.4 }, 0, 92, P, 2), { tone: "mid" }));
  let sd = 5; const rnd = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
  for (const z of levels) {
    out.push(S(k.slabOf({ x: RACK.x, y: RACK.y, w: RACK.w, d: RACK.d, r: 1 }, z, 2, P, 3, 0.3), { tone: "lo" }));
    let x = RACK.x + 3;
    while (x < RACK.x + RACK.w - 14) {
      const w = 13 + rnd() * 8, h = 16 + rnd() * 9, d = 11 + rnd() * 2;
      if (x + w > RACK.x + RACK.w - 3) break;
      const box = { x, y: RACK.y + (RACK.d - d) / 2, w, d, r: 0.6 };
      out.push(S(k.slabOf(box, z + 2, h, P, 2, 0.3), { tone: "mid", inner: L(k.sideSeam({ ...box, r: 0.6 }, z + 2 + h - 0.1, P, 2), { tone: "faint" }) }));
      out.push(L(k.lineOnTop([box.x + w / 2, box.y], [box.x + w / 2, box.y + d], z + 2 + h, P), { tone: "faint" }));
      out.push(`<g transform="${planeOf(box.y + d)}"><path class="sc-tag" d="${flat(x + w * 0.55, z + 2 + h * 0.35, x + w * 0.9, z + 2 + h * 0.62, 0.4, 2)}"/></g>`);
      x += w + 2;
    }
  }
  for (const [x, y] of byDepth(posts.slice(2))) out.push(S(k.slabOf({ x: x - 1.6, y: y - 1.6, w: 3.2, d: 3.2, r: 0.4 }, 0, 92, P, 2), { tone: "mid" }));
  out.push(D(posts.map(([x, y]) => at([x, y, 92])), { size: 0.45 }));
  return out.join("");
}

// ───────── 레일 ─────────
function rails() {
  const out = [];
  for (const y of RAIL_Y) {
    out.push(S(k.slabOf({ x: RAIL_FROM, y: y - 2.5, w: RAIL_TO - RAIL_FROM, d: 5, r: 1 }, 0, 3, P, 3, 0.4), { tone: "mid" }));
    out.push(L(k.lineOnTop([RAIL_FROM + 1.5, y], [RAIL_TO - 1.5, y], 3, P), { tone: "faint" }));
  }
  for (const x of [RAIL_FROM - 5, RAIL_TO]) {
    out.push(S(k.slabOf({ x, y: RAIL_Y[0] - 6, w: 5, d: RAIL_Y[1] - RAIL_Y[0] + 12, r: 1.2 }, 0, 8, P, 3, 0.5), { tone: "mid" }));
    out.push(D([at([x + 2.5, RAIL_Y[0] - 3, 8]), at([x + 2.5, RAIL_Y[1] + 3, 8])], { size: 0.45 }));
  }
  return out.join("");
}

// ───────── 대차 + 라벨 세 장 ─────────
function ean(code) {
  const Lc = ["0001101", "0011001", "0010011", "0111101", "0100011", "0110001", "0101111", "0111011", "0110111", "0001011"];
  const Gc = ["0100111", "0110011", "0011011", "0100001", "0011101", "0111001", "0000101", "0010001", "0001001", "0010111"];
  const Rc = ["1110010", "1100110", "1101100", "1000010", "1011100", "1001110", "1010000", "1000100", "1001000", "1110100"];
  const PAR = ["LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG", "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"];
  const d = code.split("").map(Number), p = PAR[d[0]];
  let m = "101";
  for (let i = 1; i <= 6; i++) m += (p[i - 1] === "L" ? Lc : Gc)[d[i]];
  m += "01010";
  for (let i = 7; i <= 12; i++) m += Rc[d[i]];
  return m + "101";
}
const LY0 = -33;                                                 // 라벨 앞쪽 y
function labelArt(lx, kind, code) {
  const y0 = LY0 + 6, y1 = LY0 + 20, out = [];
  const rect = (a, b, c, d) => k.onTop([[a, c], [b, c], [b, d], [a, d]], LABEL_TOP, P, true);
  if (kind === "EAN-13") {
    const m = ean(code), MOD = 0.19, x0 = lx - (95 * MOD) / 2;
    for (let i = 0; i < 95;) { if (m[i] !== "1") { i++; continue; } let j = i; while (m[j] === "1") j++; const g = i < 3 || (i >= 45 && i < 50) || i >= 92; out.push(rect(x0 + i * MOD, x0 + j * MOD, y0, g ? y1 + 1.4 : y1)); i = j; }
  } else if (kind === "QR") {
    const n = 21, c = 0.66, x0 = lx - (n * c) / 2, yq = LY0 + 4.5;
    let sd = 11; const r = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
    const fin = [[0, 0], [n - 7, 0], [0, n - 7]];
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const f = fin.find(([a, b]) => i >= a && i < a + 7 && j >= b && j < b + 7);
      const on = f ? (() => { const u = i - f[0], v = j - f[1]; return u === 0 || u === 6 || v === 0 || v === 6 || (u >= 2 && u <= 4 && v >= 2 && v <= 4); })() : r() < 0.47;
      if (on) out.push(rect(x0 + i * c, x0 + (i + 1) * c, yq + j * c, yq + (j + 1) * c));
    }
  } else {
    let sd = 23; const r = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
    let x = lx - 8.5, on = true;
    while (x < lx + 8.5) { const w = (1 + Math.floor(r() * 4)) * 0.19; if (on) out.push(rect(x, Math.min(x + w, lx + 8.5), y0, y1)); x += w; on = !on; }
  }
  return out.join("");
}
function cart() {
  const out = [`<path class="iso-halo" d="${k.haloOf(CART, CART_Z, 3, P)}"/>`];
  const bush = [];
  for (const x of [-34, 34]) for (const y of RAIL_Y) bush.push([x, y]);
  for (const [x, y] of byDepth(bush)) out.push(S(k.slabOf({ x: x - 4, y: y - 3.4, w: 8, d: 6.8, r: 1.2 }, 2.2, 3.4, P, 3, 0.3), { tone: "lo" }));
  out.push(S(k.slabOf(CART, CART_Z + 1.4, CART_TOP - CART_Z - 1.4, P, 5, 0.6), { tone: "mid" }));
  out.push(D(byDepth(k.corners(CART, 2.6)).map(([x, y]) => at([x, y, CART_TOP])), { size: 0.45 }));
  out.push(S(k.slabOf({ x: CART.x + CART.w, y: -22, w: 3, d: 6, r: 0.8 }, 4.4, 2.6, P, 2), { tone: "mid" }));
  out.push(S(k.cylinder(CART.x + CART.w + 5.6, -19, 2.8, 3.6, 4.4, P, 20), { tone: "mid" }));
  out.push(L(k.knurl(CART.x + CART.w + 5.6, -19, 2.8, 3.6, 8, 14, P), { tone: "lo" }));
  LOCAL.forEach((lx, i) => {
    const plan = { x: lx - LABEL_W / 2, y: LY0, w: LABEL_W, d: LABEL_D, r: 1 };
    out.push(`<g data-part="label-${i}">${S(k.slabOf(plan, CART_TOP, 0.6, P, 3), { tone: "hi", crease: "lo" })}`);
    out.push(L(k.lineOnTop([plan.x + 2.2, LY0 + 2.6], [plan.x + 10, LY0 + 2.6], LABEL_TOP, P), { tone: "mid", free: true }));
    out.push(`<path class="sc-bars" d="${labelArt(lx, SCANS[i].kind, SCANS[i].code)}"/>`);
    out.push(`<path class="sc-read" data-part="read-${i}" d="${k.onTop(k.roundedPlan(k.insetPlan(plan, -0.6), 3), LABEL_TOP + 0.02, P, true)}" style="opacity:0"/></g>`);
  });
  return `<g data-part="cart">${out.join("")}</g>`;
}

// ───────── 받침대 + 렌즈 + 폰 ─────────
function post([x, y]) {
  return [
    S(k.cylinder(x, y, 5.2, 0, 3, P, 28, 0.4), { tone: "lo" }),
    S(k.cylinder(x, y, 3.2, 3, BEAM_Z - 3, P, 28), { tone: "mid", crease: "none" }),
    L(k.sideArc(x, y, 3.2, 14, P, 16) + k.sideArc(x, y, 3.2, BEAM_Z - 10, P, 16), { tone: "faint" }),
  ].join("");
}
function lensAndBeam() {
  const [x, y] = LENS, out = [];
  out.push(S(k.cylinder(x, y, 5.6, BEAM_Z - 6, 6, P, 32, 0.4), { tone: "mid" }));
  out.push(L(k.knurl(x, y, 5.6, BEAM_Z - 5, BEAM_Z - 1, 22, P), { tone: "lo" }));
  out.push(S(k.cylinder(x, y, 3.4, BEAM_Z - 8, 2, P, 24), { tone: "hi" }));
  const fan = k.pathOf([at([x, y, BEAM_Z - 8]), at([x - 9, LY0 + 3, LABEL_TOP]), at([x + 9, LY0 + 3, LABEL_TOP]), at([x + 9, LY0 + 25, LABEL_TOP]), at([x - 9, LY0 + 25, LABEL_TOP])], true);
  out.push(`<g data-part="beam" style="opacity:0"><path class="sc-fan" d="${fan}"/><path class="sc-sweep" data-part="sweep" d=""/></g>`);
  return out.join("");
}
function beamBar() {
  const out = [S(k.slabOf(BEAM, BEAM_Z, BEAM_TOP - BEAM_Z, P, 4, 0.8), { tone: "mid", inner: L(k.sideSeam(BEAM, BEAM_Z + 2.4, P, 4), { tone: "faint" }) })];
  out.push(D(POSTS.map(([x, y]) => at([x, y, BEAM_TOP])), { size: 0.5 }));
  out.push(L(POSTS.map(([x, y]) => k.ring(x, y, 2.4, BEAM_TOP, P, 14)).join(""), { tone: "lo" }));
  out.push(S(k.slabOf({ x: PHONE.x - 3, y: PHONE.y - 4, w: PHONE.w + 6, d: PHONE.d + 8, r: 2 }, BEAM_TOP, 3, P, 4, 0.5), { tone: "lo" }));
  for (const x of [PHONE.x - 3, PHONE.x + PHONE.w]) out.push(S(k.slabOf({ x, y: PHONE.y - 3, w: 3, d: PHONE.d + 6, r: 0.8 }, BEAM_TOP + 3, 14, P, 2, 0.4), { tone: "mid" }));
  return out.join("");
}
const SCR = { x0: PHONE.x + 3.5, x1: PHONE.x + PHONE.w - 3.5, z0: PHONE_Z + 5, z1: PHONE_TOP - 5 };
const SCX = (SCR.x0 + SCR.x1) / 2;
const AIM = { cz: SCR.z1 - 22, hw: 12, hh: 10 };               // 조준 영역 (화면 위쪽)
const CHIP = { z: AIM.cz - AIM.hh - 5.5, h: 5.2, gap: 1.3 };   // 결과 칸 (위가 최신)
function phone() {
  const out = [S(k.slabOf(PHONE, PHONE_Z, PHONE_TOP - PHONE_Z, P, 5, 0.6), { tone: "mid" })];
  out.push(S(k.slabOf({ x: PHONE.x + PHONE.w, y: PHONE.y + 1.2, w: 0.8, d: 2.6, r: 0.4 }, PHONE_TOP - 24, 8, P, 2), { tone: "lo" }));
  out.push(S(k.slabOf({ x: PHONE.x + PHONE.w, y: PHONE.y + 1.2, w: 0.8, d: 2.6, r: 0.4 }, PHONE_TOP - 13, 5, P, 2), { tone: "lo" }));
  const back = [
    `<path class="sc-pill" d="${flat(SCX - 10, SCR.z1 - 6.2, SCX + 10, SCR.z1 - 2.2, 2)}"/>`,
    `<text class="sc-ui" x="${SCX}" y="${-(SCR.z1 - 5.05)}" text-anchor="middle" font-size="2.5">${esc(TX.group)}</text>`,
    ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => { const x = SCX + sx * AIM.hw, z = AIM.cz + sz * AIM.hh; return `<path class="sc-corner" data-corner d="M${x} ${-(z - sz * 3.4)}V${-z}H${x - sx * 3.4}"/>`; }),
    `<path class="sc-scanline" data-part="pscan" d="M${SCX - AIM.hw + 1} 0H${SCX + AIM.hw - 1}" style="opacity:0"/>`,
    `<text class="sc-big" data-part="big" x="${SCX}" y="${-(AIM.cz - 1.2)}" text-anchor="middle" font-size="3.3"></text>`,
    ...[0, 1, 2].map((i) => { const z = CHIP.z - i * (CHIP.h + CHIP.gap); return `<g data-part="chip-${i}" style="opacity:0"><path class="sc-chip" d="${flat(SCR.x0 + 0.8, z - CHIP.h, SCR.x1 - 0.8, z, 2.4)}"/><circle class="sc-tick" cx="${SCR.x0 + 3.6}" cy="${-(z - CHIP.h / 2)}" r="1.25"/><text class="sc-chiptext" data-part="chiptext-${i}" x="${SCR.x0 + 6}" y="${-(z - CHIP.h / 2 - 1)}" font-size="2.55"></text></g>`; }),
    `<path class="sc-seg" d="${flat(SCX - 13, SCR.z0 + 1.2, SCX + 13, SCR.z0 + 5.6, 2.2)}"/>`,
    `<path class="sc-segon" d="${flat(SCX + (LANG === "en" ? 0.6 : 4.4), SCR.z0 + 1.7, SCX + 12.5, SCR.z0 + 5.1, 1.7)}"/>`,
    `<text class="sc-ui sc-dark" x="${SCX + (LANG === "en" ? 6.55 : 8.45)}" y="${-(SCR.z0 + 2.55)}" text-anchor="middle" font-size="${LANG === "en" ? 1.9 : 2.3}">${esc(TX.mode)}</text>`,
  ].join("");
  out.push(recess({ ...SCR, r: 2.6, depth: 0.8 }, PH_FRONT, back, "sc-glass"));
  out.push(D([at([PHONE.x + PHONE.w - 4, PH_FRONT, PHONE_TOP - 2.6])], { size: 0.55, tone: "hi" }));
  return out.join("");
}

// ───────── 단말 ─────────
function terminal(plan, top, id, rows, head) {
  const out = [`<path class="iso-halo" d="${k.haloOf(plan, 0, 6, P)}"/>`];
  out.push(S(k.slabOf(k.insetPlan(plan, 3), 0, 5, P, 6), { tone: "lo" }));
  out.push(S(k.slabOf(plan, 5, top - 5, P, 6, 1.2), { tone: "mid", inner: L(k.sideSeam(plan, top - 6, P, 6), { tone: "faint" }) }));
  const front = plan.y + plan.d;
  const W = { x0: plan.x + 4.5, x1: plan.x + plan.w - 4.5, z0: 13, z1: top - 8 };
  const rowH = (W.z1 - W.z0 - 6.5) / rows;
  const back = [
    `<path class="iso-line" data-tone="lo" d="M${W.x0} ${-(W.z1 - 4.6)}H${W.x1}"/>`,
    `<text class="sc-term" x="${W.x0 + 1.6}" y="${-(W.z1 - 3.4)}" font-size="2.5">${esc(head)}</text>`,
    ...Array.from({ length: rows }, (_, i) => {
      const z = W.z1 - 6.5 - i * rowH;
      return `<rect class="sc-row" data-part="${id}-hl-${i}" x="${W.x0}" y="${-z}" width="${W.x1 - W.x0}" height="${rowH}" style="opacity:0"/>` +
        `<text class="sc-term" data-part="${id}-row-${i}" x="${W.x0 + 1.6}" y="${-(z - rowH * 0.68)}" font-size="${Math.min(2.5, rowH * 0.6).toFixed(2)}"></text>` +
        (i < rows - 1 ? `<path class="iso-line" data-tone="faint" d="M${W.x0} ${-(z - rowH)}H${W.x1}"/>` : "");
    }),
  ].join("");
  out.push(recess({ ...W, r: 2.4, depth: 1.4 }, front, back, "sc-glass"));
  out.push(D([at([plan.x + plan.w - 5, front, 8.5])], { size: 0.7, tone: "hi" }));
  out.push(L(Array.from({ length: 5 }, (_, i) => k.planOutline({ x: plan.x + 6, y: plan.y + 5 + i * 3.2, w: plan.w * 0.42, d: 1.3, r: 0.6 }, top, P, 3)).join(""), { tone: "faint" }));
  out.push(D(byDepth(k.corners(plan, 3)).map(([x, y]) => at([x, y, top])), { size: 0.45 }));
  const port = { x: plan.x + plan.w - 14, y: plan.y + 4, w: 8, d: 6, r: 1.2 };
  out.push(S(k.slabOf(port, top, 3, P, 3, 0.3), { tone: "lo" }));
  return { svg: out.join(""), port: [port.x + 4, port.y + 3, top + 3] };
}

// ───────── 지구본 ─────────
function globe() {
  const [x, y] = GLOBE;
  const out = [`<path class="iso-halo" d="${k.haloOf({ x: x - 12, y: y - 12, w: 24, d: 24, r: 12 }, 0, 3, P)}"/>`];
  out.push(S(k.cylinder(x, y, 12, 0, 3, P, 40, 0.6), { tone: "lo" }));
  out.push(L(k.ring(x, y, 9, 3, P, 32), { tone: "faint" }));
  out.push(S(k.cylinder(x, y, 2, 3, GLOBE_Z - GLOBE_R - 3 + 0.6, P, 16), { tone: "mid", crease: "none" }));
  out.push(S(G.sphereOf([x, y, GLOBE_Z], GLOBE_R, P, { steps: 56 }), { tone: "hi" }));
  const V = G.viewOf(P);
  const vis = (p) => (p[0] - x) * V[0] + (p[1] - y) * V[1] + (p[2] - GLOBE_Z) * V[2] > 0.5;
  const arcs = [];
  const draw = (fn) => { let run = []; for (let i = 0; i <= 96; i++) { const p = fn(i / 96 * Math.PI * 2); if (vis(p)) run.push(at(p)); else { if (run.length > 1) arcs.push(k.pathOf(run)); run = []; } } if (run.length > 1) arcs.push(k.pathOf(run)); };
  for (const lat of [-50, -25, 0, 25, 50]) { const a = lat * Math.PI / 180, rr = GLOBE_R * Math.cos(a), z = GLOBE_Z + GLOBE_R * Math.sin(a); draw((t) => [x + rr * Math.cos(t), y + rr * Math.sin(t), z]); }
  for (let m = 0; m < 6; m++) { const b = m * Math.PI / 6; draw((t) => [x + GLOBE_R * Math.cos(t) * Math.cos(b), y + GLOBE_R * Math.cos(t) * Math.sin(b), GLOBE_Z + GLOBE_R * Math.sin(t)]); }
  out.push(L(arcs.join(""), { tone: "faint" }));
  return out.join("");
}

// ───────── 케이블 ─────────
function curve(pts, n = 90) {
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const m = Math.round(n / (pts.length - 1));
    for (let s = 0; s < m; s++) {
      const t = s / m, t2 = t * t, t3 = t2 * t;
      out.push([0, 1, 2].map((c) => 0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3)));
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
function cable(pts, id) {
  const d = k.pathOf(curve(pts).map(at));
  const [a, b] = [at(pts[0]), at(pts[pts.length - 1])];
  return `<g data-part="${id}">${L(d, { tone: "mid", className: "sc-cord" })}<path class="sc-pulse" data-part="${id}-pulse" d="${d}"/>` +
    `<circle class="iso-wire-end" cx="${a[0].toFixed(1)}" cy="${a[1].toFixed(1)}" r="1.1"/><circle class="iso-wire-end" cx="${b[0].toFixed(1)}" cy="${b[1].toFixed(1)}" r="1.1"/></g>`;
}

const seoul = terminal(SEOUL, SEOUL_TOP, "seoul", 5, TX.seoulHead);
const la = terminal(LA, LA_TOP, "la", 4, TX.laHead);
const PLUG = [PHONE.x + PHONE.w - 6, PHONE.y, PHONE_TOP - 9];
const cableSeoul = cable([PLUG, [PLUG[0] + 6, PHONE.y - 5, PHONE_TOP - 20], [PLUG[0] + 18, PHONE.y - 6, BEAM_TOP + 12], [seoul.port[0] - 8, seoul.port[1] - 4, seoul.port[2] + 8], seoul.port], "c-seoul");
const cableLA = cable([PLUG, [PLUG[0] + 8, PHONE.y - 4, PHONE_TOP + 6], [24, -32, GLOBE_Z + GLOBE_R + 32], [GLOBE[0], GLOBE[1], GLOBE_Z + GLOBE_R + 9], [la.port[0] - 14, la.port[1] - 6, la.port[2] + 16], la.port], "c-la");

const body = [plate(), rack(), rails(), post(POSTS[0]), cart(), lensAndBeam(), post(POSTS[1]), beamBar(), phone(), globe(), cableLA, la.svg, seoul.svg, cableSeoul];
const svg = k.figureSvg({ width: WIDTH, height: HEIGHT, label: "창고 선반 앞 대차에 실린 라벨 세 장을 받침대 위 폰이 차례로 읽고, 결과 세 건이 금색 맥을 타고 바로 앞 서울 단말과 지구본 너머 LA 단말에 같은 세 줄로 찍히는 기계.", body });

// 확대 영역 (폰 화면과 렌즈 밑) — viewBox 로 다가간다
const zoomPts = [[PHONE.x - 8, PH_FRONT, PHONE_TOP + 4], [PHONE.x + PHONE.w + 8, PH_FRONT, PHONE_TOP + 4], [GX - 30, LY0, LABEL_TOP], [GX + 30, LY0 + LABEL_D, LABEL_TOP]].map(at);
const zx0 = Math.min(...zoomPts.map((p) => p[0])), zx1 = Math.max(...zoomPts.map((p) => p[0]));
const zy0 = Math.min(...zoomPts.map((p) => p[1])), zy1 = Math.max(...zoomPts.map((p) => p[1]));
const ZOOM = { cx: (zx0 + zx1) / 2, cy: (zy0 + zy1) / 2, h: (zy1 - zy0) * 1.12 };
const sweepAt = (u) => k.pathOf([at([GX - 9 + 18 * u, LY0 + 3, LABEL_TOP + 0.05]), at([GX - 9 + 18 * u, LY0 + 25, LABEL_TOP + 0.05])]);
const SWEEP = Array.from({ length: 21 }, (_, i) => sweepAt(i / 20));

const live = `
const P = ${JSON.stringify(P)};
const SCANS = ${JSON.stringify(SCANS)}, PREV = ${JSON.stringify(PREV)};
const HOME = ${HOME}, AT = ${JSON.stringify(AT)}, PAST = ${AT[2] + 12};
const ZOOM = ${JSON.stringify(ZOOM)}, VB = [0, 0, ${WIDTH}, ${HEIGHT}];
const SWEEP = ${JSON.stringify(SWEEP)};
const AIM_LO = ${AIM.cz - AIM.hh + 1}, AIM_HI = ${AIM.cz + AIM.hh - 1};
const svg = document.querySelector("svg.iso-svg") || document.querySelector("svg");
const $ = (p) => svg.querySelector('[data-part="' + p + '"]');
const cartEl = $("cart"), beamEl = $("beam"), sweep = $("sweep"), pscan = $("pscan"), big = $("big");
const aimCorners = [...svg.querySelectorAll("[data-corner]")];
const pulses = [$("c-seoul-pulse"), $("c-la-pulse")];
const lens = pulses.map((p) => p.getTotalLength());
const ease = (u) => { u = Math.min(1, Math.max(0, u)); return u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
const cl = (u) => Math.min(1, Math.max(0, u));
// 한 바퀴 (초)
const T = { cycle: 16 };
const MOVE = [[0.3, 1.6], [4.1, 4.9], [6.0, 6.8]];         // 대차가 라벨 i 를 렌즈 밑으로
const READ = [[1.7, 2.2], [5.0, 5.35], [6.9, 7.25]];        // 빛이 훑는 구간
const DEC = [2.2, 0.085, 0.6];                              // 첫 장 해독: 시작, 자리 간격, 나는 시간
const DONE = [2.2 + 12 * 0.085 + 0.6, 5.4, 7.3];             // 결과 칸이 생기는 시각
const SEND = 7.8, TO_SEOUL = 0.8, TO_LA = 2.0;
const BACK = [12.6, 14.6], RESET = 15.2;
const ZIN = [1.4, 2.0], ZOUT = [7.4, 8.6];
function hhmmss(base, i) { return base + ":" + String(14 - i * 3).padStart(2, "0"); }
window.renderAt = (t) => {
  t = ((t % T.cycle) + T.cycle) % T.cycle;
  // 확대: 해독 동안 폰 쪽으로
  const z = t < ZIN[0] ? 0 : t < ZIN[1] ? ease((t - ZIN[0]) / (ZIN[1] - ZIN[0])) : t < ZOUT[0] ? 1 : 1 - ease((t - ZOUT[0]) / (ZOUT[1] - ZOUT[0]));
  const vh = VB[3] + (ZOOM.h - VB[3]) * z, vw = vh * VB[2] / VB[3];
  const cx = VB[2] / 2 + (ZOOM.cx - VB[2] / 2) * z, cy = VB[3] / 2 + (ZOOM.cy - VB[3] / 2) * z;
  svg.setAttribute("viewBox", (cx - vw / 2).toFixed(2) + " " + (cy - vh / 2).toFixed(2) + " " + vw.toFixed(2) + " " + vh.toFixed(2));
  // 대차
  let x = HOME;
  for (let i = 0; i < 3; i++) { const [a, b] = MOVE[i]; const from = i ? AT[i - 1] : HOME; if (t >= a) x = from + (AT[i] - from) * ease((t - a) / (b - a)); }
  if (t >= 8.2) x = AT[2] + (PAST - AT[2]) * ease((t - 8.2) / 1.2);
  if (t >= BACK[0]) x = PAST + (HOME - PAST) * ease((t - BACK[0]) / (BACK[1] - BACK[0]));
  const [dx, dy] = axisVector(P, [x, 0, 0]);
  cartEl.setAttribute("transform", "translate(" + dx.toFixed(2) + " " + dy.toFixed(2) + ")");
  // 빛과 폰 스캔 선
  let beam = 0, sw = -1, ps = -1;
  READ.forEach(([a, b]) => { if (t >= a && t < b) { const u = (t - a) / (b - a); beam = Math.sin(Math.PI * u); sw = u; ps = u; } });
  beamEl.style.opacity = beam.toFixed(3);
  sweep.setAttribute("d", sw >= 0 ? SWEEP[Math.round(sw * 20)] : "");
  pscan.style.opacity = ps >= 0 ? "1" : "0";
  pscan.setAttribute("transform", "translate(0 " + (-(AIM_HI - (AIM_HI - AIM_LO) * Math.max(0, ps))).toFixed(2) + ")");
  const hit = DONE.some((d) => t >= d - 0.05 && t < d + 0.35);
  aimCorners.forEach((c) => c.toggleAttribute("data-hit", hit));
  for (let i = 0; i < 3; i++) { const rd = $("read-" + i); rd.style.opacity = (t >= DONE[i] && t < BACK[0] ? 1 : 0).toString(); }
  // 첫 장: 숫자가 한 자리씩 큰 글자로 차고 결과 칸으로
  const n = t < DEC[0] ? 0 : Math.min(13, Math.floor((t - DEC[0]) / DEC[1]) + 1);
  big.textContent = t >= DEC[0] && t < DONE[0] ? SCANS[0].code.slice(0, n) : "";
  // 결과 목록 (위가 최신)
  const done = [0, 1, 2].filter((i) => t >= DONE[i] && t < RESET);
  for (let s = 0; s < 3; s++) {
    const i = done[done.length - 1 - s];
    const chip = $("chip-" + s);
    if (i === undefined) { chip.style.opacity = "0"; continue; }
    chip.style.opacity = s === 0 ? cl((t - DONE[i]) / 0.25).toFixed(2) : "1";
    $("chiptext-" + s).textContent = SCANS[i].code;
  }
  // 전송: 금색 맥
  [[0, TO_SEOUL], [1, TO_LA]].forEach(([i, dur]) => {
    const u = (t - SEND) / dur, L = lens[i];
    pulses[i].style.opacity = u > 0 && u < 1.12 ? "1" : "0";
    pulses[i].style.strokeDasharray = "16 " + (L + 20);
    pulses[i].style.strokeDashoffset = (16 - (L + 16) * ease(Math.min(1, u))).toFixed(1);
  });
  const paint = (id, rows, base, arrive) => {
    const got = t >= arrive && t < RESET;
    const list = got ? [SCANS[2].code, SCANS[1].code, SCANS[0].code, ...PREV] : PREV;
    for (let r = 0; r < rows; r++) {
      $(id + "-row-" + r).textContent = list[r] ? (got ? 131 - r : 128 - r) + "  " + list[r] + "  " + hhmmss(base, r) : "";
      const hl = got && r < 3 ? cl((t - arrive) / 0.3) * (1 - cl((t - arrive - 3.2) / 1.2)) : 0;
      $(id + "-hl-" + r).style.opacity = hl.toFixed(2);
    }
  };
  paint("seoul", 5, "09:41", SEND + TO_SEOUL);
  paint("la", 4, "17:41", SEND + TO_LA);
  const ro = document.querySelector("[data-readout]");
  if (ro) ro.textContent = t >= SEND + TO_LA && t < RESET ? "3건 · 서울 09:41 · LA 17:41 (전날)" : t >= DONE[0] ? "스캔 " + done.length + "건" : "라벨 세 장을 실어요";
};
window.CYCLE = T.cycle;
if (!window.FILM) {
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  let t0 = performance.now(), frame = 0, visible = false;
  const stage = document.querySelector(".iso-stage");
  const tick = (now) => { renderAt((now - t0) / 1000); frame = visible && !still.matches ? requestAnimationFrame(tick) : 0; };
  new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible && !frame) frame = requestAnimationFrame(tick); }).observe(stage);
  stage.addEventListener("click", () => { t0 = performance.now(); });
  renderAt(still.matches ? 9.9 : 0);
}
`;

const css = `<style>
.iso{--sc-gold:#f2b230}
.iso[data-theme="light"]{--sc-gold:#d08f12}
.sc-glass{fill:var(--anatomy-shade-0)}
.sc-bars{fill:var(--anatomy-hi)}
.sc-read{fill:none;stroke:var(--sc-gold);stroke-width:1.1px;vector-effect:non-scaling-stroke;transition:opacity .3s}
.sc-tag{fill:var(--anatomy-top);stroke:var(--anatomy-lo);stroke-width:.4px;vector-effect:non-scaling-stroke}
.sc-fan{fill:var(--sc-gold);opacity:.16}
.sc-sweep{fill:none;stroke:var(--sc-gold);stroke-width:1.4px;vector-effect:non-scaling-stroke;stroke-linecap:round}
.sc-scanline{fill:none;stroke:var(--sc-gold);stroke-width:.9px;stroke-linecap:round}
.sc-corner{fill:none;stroke:var(--anatomy-hi);stroke-width:.9px;stroke-linecap:round;stroke-linejoin:round}
.sc-corner[data-hit]{stroke:var(--sc-gold)}
.sc-pill{fill:var(--anatomy-lo)}
.sc-ui{fill:var(--anatomy-paper);font-family:var(--anatomy-sans,system-ui);font-weight:700}
.sc-dark{fill:var(--anatomy-hi)}
.sc-big{fill:var(--sc-gold);font-family:var(--anatomy-mono);font-weight:700;letter-spacing:-.02em}
.sc-chip{fill:var(--anatomy-top);stroke:var(--anatomy-lo);stroke-width:.4px;vector-effect:non-scaling-stroke}
.sc-tick{fill:var(--sc-gold)}
.sc-chiptext{fill:var(--anatomy-hi);font-family:var(--anatomy-mono);font-weight:700}
.sc-seg{fill:var(--anatomy-lo)}
.sc-segon{fill:var(--anatomy-top)}
.sc-term{fill:var(--anatomy-hi);font-family:var(--anatomy-mono)}
.sc-row{fill:var(--sc-gold);fill-opacity:.24}
.sc-cord{stroke-width:1.1px}
.sc-pulse{fill:none;stroke:var(--sc-gold);stroke-width:2.4px;stroke-linecap:round;opacity:0}
</style>`;

const figurePage = css + k.plateHtml({
  fig: "Fig 1", title: LANG === "ko" ? "스캔 세 번, PC 두 대" : "Three scans, two PCs",
  hint: LANG === "ko" ? "누르면 처음부터" : "Click to restart", readout: "",
  keys: [], caption: "",
  body: `<div class="iso-stage" tabindex="0" role="img" aria-label="스캔 기계">${svg}</div>`,
});
writeFileSync(join(OUT, `figure-${LANG}.html`), k.pageHtml({ title: "Scan machine", theme, body: figurePage, script: kitScript() + live }));

// 녹화용: 카드 없이 그림만, 바탕은 종이색. ?fmt=wide 면 오른쪽에 둔다
const filmBody = css + `<style>
html,body{margin:0;background:var(--anatomy-paper)}
#stage{position:fixed;inset:0;display:flex;align-items:center;justify-content:center}
#stage svg{width:100%;height:100%}
body[data-fmt="wide"] #stage{left:28%}
body[data-fmt="tall"] #stage{top:4%;bottom:4%;left:-6%;right:-6%}
</style><div id="stage" class="iso-stage">${svg}</div>`;
writeFileSync(join(OUT, `film-${LANG}.html`), k.pageHtml({ title: "Scan film", theme, body: filmBody, script: `window.FILM=true;document.body.dataset.fmt=new URLSearchParams(location.search).get("fmt")||"wide";` + kitScript() + live }));
console.log("wrote", OUT, LANG, theme);
