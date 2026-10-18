// ScanView 를 한 대의 기계로: 레일 위 대차가 라벨을 폰 렌즈 밑으로 옮기면, 폰 화면에 숫자가 한 자리씩 차고,
// 케이블 두 가닥이 바로 옆 서울 단말과 지구본 너머 LA 단말에 같은 줄을 찍는다.
// Anatomy 스킬(~/.agents/skills/anatomy)의 kit 으로 그린다. 사용: node build.mjs <출력폴더> [--light]
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const SKILL = join(homedir(), ".agents/skills/anatomy");
const k = await import(join(SKILL, "kit/iso-kit.mjs"));
const G = await import(join(SKILL, "kit/lathe.mjs"));
const { kitScript } = await import(join(SKILL, "scripts/inline-kit.mjs"));

const OUT = process.argv[2] || ".";
const theme = process.argv.includes("--light") ? "light" : "dark";
const WIDTH = 640, HEIGHT = 420;

// ───────── 세계 (단위 ≈ 1 px, z 위) ─────────
const PLATE = { x: -150, y: -64, w: 304, d: 120, r: 9 };
const PLATE_H = 10, FOOT_H = 5;
const RAIL_Y = [-30, -8], RAIL_FROM = -142, RAIL_TO = -18;
const CART = { x: -15, y: -36, w: 30, d: 34, r: 2.4 };        // 대차 (x=0 기준, 움직인다)
const CART_Z = 3, CART_TOP = 8;
const LABEL = { x: -12, y: -33, w: 24, d: 28, r: 1 };
const LABEL_TOP = CART_TOP + 0.6;
const HOME = -118, UNDER = -66, PAST = -36;                    // 대차가 멈추는 곳: 싣는 곳 · 렌즈 밑 · 지나감
const GX = -66;                                                // 받침대(아치) x
const POSTS = [[GX, -46], [GX, 10]];
const BEAM = { x: GX - 7, y: -50, w: 14, d: 64, r: 2 };
const BEAM_Z = 50, BEAM_TOP = 57;
const LENS = [GX, -19];
const PHONE = { x: GX - 19, y: -8, w: 38, d: 5, r: 3 };       // 받침대 위에 세운 폰, 화면은 +y 면
const PHONE_Z = BEAM_TOP + 3, PHONE_TOP = PHONE_Z + 66;
const PH_FRONT = PHONE.y + PHONE.d;
const SEOUL = { x: -4, y: 2, w: 50, d: 38, r: 4 };             // 서울 단말 (바로 앞 PC)
const SEOUL_TOP = 52;
const GLOBE = [58, -40], GLOBE_R = 17, GLOBE_Z = 44;
const LA = { x: 108, y: -4, w: 40, d: 34, r: 4 };               // LA 단말 (지구본 건너)
const LA_TOP = 44;
const CODES = [
  { code: "8801234001014", kind: "EAN-13" },
  { code: "8801234002028", kind: "EAN-13" },
  { code: "8801234003032", kind: "EAN-13" },
];

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [PHONE.x, PHONE.y, PHONE_TOP], [PHONE.x + PHONE.w, PH_FRONT, PHONE_TOP], [GLOBE[0], GLOBE[1], GLOBE_Z + GLOBE_R + 6]],
  WIDTH, HEIGHT, { pad: 30, azimuth: 48 },
);
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (pts, style) => k.dotsSvg(pts, style);
const depth = (x, y, z = 0) => k.depthOf([x, y, z], P);
const byDepth = (pts) => [...pts].sort((a, b) => depth(a[0], a[1]) - depth(b[0], b[1]));
const planeOf = (y) => k.sideMatrix([0, y], 0, P, "left");
const flat = (x0, z0, x1, z1, r, steps = 6) => k.pathOf(k.roundedPlan({ x: x0, y: z0, w: x1 - x0, d: z1 - z0, r }, steps).map(([u, z]) => [u, -z]), true);

// 면에 판 창 (desk-computer 의 recess 를 줄인 것): 둥근 사각 구멍, 안쪽 벽은 면에 따라 음영
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
  // 앞쪽 눈금자: 대차가 지나는 길
  const strip = { x: RAIL_FROM, y: PLATE.y + PLATE.d - 16, w: RAIL_TO - RAIL_FROM, d: 7, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const t = k.topTicks(strip.x + 3, strip.x + strip.w - 3, 4, 5, strip.y + 0.8, 0.6, [2, 3.6], P);
  out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
  // 이름판 (글자를 대신하는 세 줄)
  const label = { x: 70, y: PLATE.y + PLATE.d - 17, w: 46, d: 10, r: 1.2 };
  out.push(S(k.slabOf(label, 0, 0.8, P, 3), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(label, 1.4), 0.8, P, 3), { tone: "faint" }));
  out.push(L([32, 24, 14].map((w, i) => k.lineOnTop([label.x + 4, label.y + 2.6 + i * 2.4], [label.x + 4 + w, label.y + 2.6 + i * 2.4], 0.8, P)).join(""), { tone: "lo", free: true }));
  out.push(D([at([label.x + label.w - 3, label.y + 2.4, 0.8]), at([label.x + label.w - 3, label.y + label.d - 2.4, 0.8])], { size: 0.45 }));
  return out.join("");
}

// ───────── 레일과 멈추개 ─────────
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

// ───────── 대차 + 라벨 카드 (x=0 에 만들고 움직인다) ─────────
function barsOf(code) { // EAN-13 모듈 (실제 부호화)
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
const MOD = 0.2, BAR_Y0 = LABEL.y + 6, BAR_Y1 = LABEL.y + 20;   // 막대는 대차가 가는 방향(x)에 수직
function barcode(code) {
  const m = barsOf(code), x0 = -(95 * MOD) / 2, out = [];
  for (let i = 0; i < 95;) {
    if (m[i] !== "1") { i++; continue; }
    let j = i; while (m[j] === "1") j++;
    const guard = i < 3 || (i >= 45 && i < 50) || i >= 92;
    const a = x0 + i * MOD, b = x0 + j * MOD, y1 = guard ? BAR_Y1 + 1.4 : BAR_Y1;
    out.push(k.onTop([[a, BAR_Y0], [b, BAR_Y0], [b, y1], [a, y1]], LABEL_TOP, P, true));
    i = j;
  }
  return out.join("");
}
function cart() {
  const out = [];
  out.push(`<path class="iso-halo" d="${k.haloOf(CART, CART_Z, 3, P)}"/>`);
  // 부싱 네 개 (레일을 문다)
  for (const [x, y] of byDepth([[-10, RAIL_Y[0]], [10, RAIL_Y[0]], [-10, RAIL_Y[1]], [10, RAIL_Y[1]]])) {
    out.push(S(k.slabOf({ x: x - 4, y: y - 3.4, w: 8, d: 6.8, r: 1.2 }, 2.2, 3.4, P, 3, 0.3), { tone: "lo" }));
  }
  out.push(S(k.slabOf(CART, CART_Z + 1.4, CART_TOP - CART_Z - 1.4, P, 5, 0.6), { tone: "mid" }));
  out.push(D(byDepth(k.corners(CART, 2.6)).map(([x, y]) => at([x, y, CART_TOP])), { size: 0.45 }));
  // 손잡이: 앞면의 목 + 널링 꼭지
  out.push(S(k.slabOf({ x: CART.x + CART.w, y: -22, w: 3, d: 6, r: 0.8 }, 4.4, 2.6, P, 2), { tone: "mid" }));
  out.push(S(k.cylinder(CART.x + CART.w + 5.6, -19, 2.8, 3.6, 4.4, P, 20), { tone: "mid" }));
  out.push(L(k.knurl(CART.x + CART.w + 5.6, -19, 2.8, 3.6, 8, 14, P), { tone: "lo" }));
  // 라벨 카드 (주인공): 위치 코드 줄 + 바코드
  out.push(S(k.slabOf(LABEL, CART_TOP, 0.6, P, 3), { tone: "hi", crease: "lo" }));
  out.push(L(k.lineOnTop([LABEL.x + 2.5, LABEL.y + 3], [LABEL.x + 12, LABEL.y + 3], LABEL_TOP, P), { tone: "mid", free: true }));
  out.push(L(k.lineOnTop([LABEL.x + LABEL.w - 7, LABEL.y + 3], [LABEL.x + LABEL.w - 2.5, LABEL.y + 3], LABEL_TOP, P), { tone: "mid", free: true }));
  out.push(`<g data-part="bars">${CODES.map((c, i) => `<path class="sc-bars" data-code="${i}" d="${barcode(c.code)}"${i ? ' style="display:none"' : ""}/>`).join("")}</g>`);
  out.push(L(k.lineOnTop([-7, LABEL.y + 23.5], [7, LABEL.y + 23.5], LABEL_TOP, P), { tone: "lo", free: true }));
  return `<g class="sc-cart" data-part="cart">${out.join("")}</g>`;
}

// ───────── 받침대 (아치) + 렌즈 + 폰 ─────────
function post([x, y]) {
  return [
    S(k.cylinder(x, y, 5.2, 0, 3, P, 28, 0.4), { tone: "lo" }),
    S(k.cylinder(x, y, 3.2, 3, BEAM_Z - 3, P, 28), { tone: "mid", crease: "none" }),
    L(k.sideArc(x, y, 3.2, 14, P, 16) + k.sideArc(x, y, 3.2, BEAM_Z - 10, P, 16), { tone: "faint" }),
  ].join("");
}
function lensAndBeam() {
  const [x, y] = LENS;
  const out = [];
  out.push(S(k.cylinder(x, y, 5.6, BEAM_Z - 6, 6, P, 32, 0.4), { tone: "mid" }));
  out.push(L(k.knurl(x, y, 5.6, BEAM_Z - 5, BEAM_Z - 1, 22, P), { tone: "lo" }));
  out.push(S(k.cylinder(x, y, 3.4, BEAM_Z - 8, 2, P, 24), { tone: "hi" }));
  // 읽는 빛: 렌즈에서 라벨까지 부채꼴 + 라벨 위를 가로지르는 선 (불이 켜질 때만)
  const fan = k.pathOf([at([x, y, BEAM_Z - 8]), at([x - 0.4, LABEL.y + 4, LABEL_TOP]), at([x + 0.4, LABEL.y + 4, LABEL_TOP]), at([x + 0.4, LABEL.y + 24, LABEL_TOP]), at([x - 0.4, LABEL.y + 24, LABEL_TOP])], true);
  out.push(`<g data-part="beam" style="opacity:0"><path class="sc-fan" d="${fan}"/>${L(k.pathOf([at([x, LABEL.y + 4, LABEL_TOP + 0.05]), at([x, LABEL.y + 24, LABEL_TOP + 0.05])]), { tone: "lit", className: "sc-scan" })}</g>`);
  return out.join("");
}
function beam() {
  const out = [];
  out.push(S(k.slabOf(BEAM, BEAM_Z, BEAM_TOP - BEAM_Z, P, 4, 0.8), { tone: "mid" }));
  out.push(L(k.sideSeam(BEAM, BEAM_Z + 2.4, P, 4), { tone: "faint" }));
  out.push(D(POSTS.map(([x, y]) => at([x, y, BEAM_TOP])), { size: 0.5 }));
  out.push(L(POSTS.map(([x, y]) => k.ring(x, y, 2.4, BEAM_TOP, P, 14)).join(""), { tone: "lo" }));
  // 폰 거치대: 두 집게 + 바닥판
  out.push(S(k.slabOf({ x: PHONE.x - 3, y: PHONE.y - 4, w: PHONE.w + 6, d: PHONE.d + 8, r: 2 }, BEAM_TOP, 3, P, 4, 0.5), { tone: "lo" }));
  for (const x of [PHONE.x - 3, PHONE.x + PHONE.w])
    out.push(S(k.slabOf({ x, y: PHONE.y - 3, w: 3, d: PHONE.d + 6, r: 0.8 }, BEAM_TOP + 3, 14, P, 2, 0.4), { tone: "mid" }));
  return out.join("");
}
const DIG = { x0: PHONE.x + 4, x1: PHONE.x + PHONE.w - 4, z0: PHONE_Z + 6, z1: PHONE_TOP - 6 };
function phone() {
  const out = [];
  out.push(S(k.slabOf(PHONE, PHONE_Z, PHONE_TOP - PHONE_Z, P, 5, 0.6), { tone: "mid" }));
  // 옆 버튼 두 개 (+x 면)
  out.push(S(k.slabOf({ x: PHONE.x + PHONE.w, y: PHONE.y + 1.2, w: 0.8, d: 2.6, r: 0.4 }, PHONE_TOP - 22, 8, P, 2), { tone: "lo" }));
  out.push(S(k.slabOf({ x: PHONE.x + PHONE.w, y: PHONE.y + 1.2, w: 0.8, d: 2.6, r: 0.4 }, PHONE_TOP - 12, 5, P, 2), { tone: "lo" }));
  // 화면: 앱 스캔 화면 (그룹 줄, 숫자 칸, 연속 버튼)
  const cx = (DIG.x0 + DIG.x1) / 2;
  const back = [
    `<path class="iso-line" data-tone="lo" d="${flat(cx - 9, DIG.z1 - 6.4, cx + 9, DIG.z1 - 2.6, 1.9)}"/>`,
    `<path class="iso-line" data-tone="mid" d="M${cx - 6} ${-(DIG.z1 - 4.5)}H${cx + 6}" data-free="true"/>`,
    // 조준 모서리
    ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => { const x = cx + sx * 11, z = (DIG.z0 + DIG.z1) / 2 + 6 + sz * 9; return `<path class="iso-line sc-corner" data-tone="hi" d="M${x} ${-(z - sz * 3.4)}V${-z}H${x - sx * 3.4}"/>`; }),
    `<path class="sc-scanline" data-part="pscan" d="M${cx - 10} 0H${cx + 10}" style="opacity:0"/>`,
    `<path class="sc-chip" d="${flat(DIG.x0 + 0.6, DIG.z0 + 8.6, DIG.x1 - 0.6, DIG.z0 + 14.6, 3)}"/>`,
    `<text class="sc-digits" data-part="digits" x="${cx}" y="${-(DIG.z0 + 10.4)}" text-anchor="middle" font-size="3.5"></text>`,
    `<path class="iso-line" data-tone="lo" d="${flat(cx - 12, DIG.z0 + 1.2, cx + 12, DIG.z0 + 5.4, 2.1)}"/>`,
    `<path class="sc-seg" d="${flat(cx + 4.2, DIG.z0 + 1.7, cx + 11.6, DIG.z0 + 4.9, 1.6)}"/>`,
  ].join("");
  out.push(recess({ ...DIG, r: 2.6, depth: 0.8 }, PH_FRONT, back, "sc-glass"));
  // 뒷면 카메라 범프는 라벨을 본다: 폰 아래 렌즈와 이어진 줄
  out.push(D([at([PHONE.x + PHONE.w - 4, PH_FRONT, PHONE_TOP - 3])], { size: 0.55, tone: "hi" }));
  return out.join("");
}

// ───────── 단말 (서울 · LA): 받침 + 몸체 + 앞면 화면 ─────────
function terminal(plan, top, id, rows) {
  const out = [`<path class="iso-halo" d="${k.haloOf(plan, 0, 6, P)}"/>`];
  out.push(S(k.slabOf(k.insetPlan(plan, 3), 0, 5, P, 6), { tone: "lo" }));
  out.push(S(k.slabOf(plan, 5, top - 5, P, 6, 1.2), { tone: "mid" }));
  out.push(L(k.sideSeam(plan, top - 6, P, 6), { tone: "faint" }));
  const front = plan.y + plan.d;
  const W = { x0: plan.x + 5, x1: plan.x + plan.w - 5, z0: 14, z1: top - 9 };
  const rowH = (W.z1 - W.z0 - 7) / rows;
  const back = [
    `<path class="iso-line" data-tone="lo" d="M${W.x0} ${-(W.z1 - 5)}H${W.x1}"/>`,
    `<text class="sc-term" data-part="${id}-head" x="${W.x0 + 2}" y="${-(W.z1 - 2.6)}" font-size="2.6"></text>`,
    ...Array.from({ length: rows }, (_, i) => {
      const z = W.z1 - 7 - i * rowH;
      return `<rect class="sc-row" data-part="${id}-hl-${i}" x="${W.x0}" y="${-z}" width="${W.x1 - W.x0}" height="${rowH}" style="opacity:0"/>` +
        `<text class="sc-term" data-part="${id}-row-${i}" x="${W.x0 + 2}" y="${-(z - rowH * 0.66)}" font-size="${Math.min(2.7, rowH * 0.62).toFixed(2)}"></text>` +
        (i < rows - 1 ? `<path class="iso-line" data-tone="faint" d="M${W.x0} ${-(z - rowH)}H${W.x1}"/>` : "");
    }),
  ].join("");
  out.push(recess({ ...W, r: 2.4, depth: 1.4 }, front, back, "sc-glass"));
  // 전원 표시등과 통풍 구멍 (윗면)
  out.push(D([at([plan.x + plan.w - 5, front, 9.5])], { size: 0.7, tone: "hi" }));
  out.push(L(Array.from({ length: 5 }, (_, i) => k.planOutline({ x: plan.x + 6, y: plan.y + 5 + i * 3.2, w: plan.w * 0.42, d: 1.3, r: 0.6 }, top, P, 3)).join(""), { tone: "faint" }));
  // 케이블 받는 단자 (윗면 뒤쪽)
  const port = { x: plan.x + plan.w - 14, y: plan.y + 4, w: 8, d: 6, r: 1.2 };
  out.push(S(k.slabOf(port, top, 3, P, 3, 0.3), { tone: "lo" }));
  return { svg: `<g data-part="${id}">${out.join("")}</g>`, port: [port.x + 4, port.y + 3, top + 3] };
}

// ───────── 지구본 (받침·축·자오환) ─────────
function globe() {
  const [x, y] = GLOBE;
  const out = [`<path class="iso-halo" d="${k.haloOf({ x: x - 12, y: y - 12, w: 24, d: 24, r: 12 }, 0, 3, P)}"/>`];
  out.push(S(k.cylinder(x, y, 12, 0, 3, P, 40, 0.6), { tone: "lo" }));
  out.push(S(k.cylinder(x, y, 2, 3, GLOBE_Z - GLOBE_R - 3 + 0.6, P, 16), { tone: "mid", crease: "none" }));
  out.push(S(G.sphereOf([x, y, GLOBE_Z], GLOBE_R, P, { steps: 56 }), { tone: "hi" }));
  // 위도선·경도선: 보이는 쪽만
  const V = G.viewOf(P);
  const vis = (p) => (p[0] - x) * V[0] + (p[1] - y) * V[1] + (p[2] - GLOBE_Z) * V[2] > 0.5;
  const arcs = [];
  const draw = (fn) => { let run = []; for (let i = 0; i <= 96; i++) { const p = fn(i / 96 * Math.PI * 2); if (vis(p)) run.push(at(p)); else { if (run.length > 1) arcs.push(k.pathOf(run)); run = []; } } if (run.length > 1) arcs.push(k.pathOf(run)); };
  for (const lat of [-50, -25, 0, 25, 50]) { const a = lat * Math.PI / 180, rr = GLOBE_R * Math.cos(a), z = GLOBE_Z + GLOBE_R * Math.sin(a); draw((t) => [x + rr * Math.cos(t), y + rr * Math.sin(t), z]); }
  for (let m = 0; m < 6; m++) { const b = m * Math.PI / 6; draw((t) => [x + GLOBE_R * Math.cos(t) * Math.cos(b), y + GLOBE_R * Math.cos(t) * Math.sin(b), GLOBE_Z + GLOBE_R * Math.sin(t)]); }
  out.push(L(arcs.join(""), { tone: "faint" }));
  // 서울 · LA 점 (구 위)
  const ll = (lat, lon) => { const a = lat * Math.PI / 180, b = lon * Math.PI / 180; return [x + GLOBE_R * Math.cos(a) * Math.cos(b), y + GLOBE_R * Math.cos(a) * Math.sin(b), GLOBE_Z + GLOBE_R * Math.sin(a)]; };
  const SEO = ll(37, 200), LAp = ll(34, 285);
  out.push(D([at(SEO), at(LAp)], { size: 0.9, tone: "hi" }));
  return { svg: out.join(""), seo: SEO, la: LAp };
}

// ───────── 케이블 (3D 곡선을 투영) ─────────
function curve(pts, n = 80) { // Catmull-Rom
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let s = 0; s < n / (pts.length - 1); s++) {
      const t = s / (n / (pts.length - 1)), t2 = t * t, t3 = t2 * t;
      out.push([0, 1, 2].map((c) => 0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3)));
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
function cable(pts, id) {
  const d = k.pathOf(curve(pts).map(at));
  const [a, b] = [at(pts[0]), at(pts[pts.length - 1])];
  return `<g class="sc-cable" data-part="${id}">${L(d, { tone: "mid", className: "sc-cord" })}<path class="sc-pulse" data-part="${id}-pulse" d="${d}"/>` +
    `<circle class="iso-wire-end" cx="${a[0].toFixed(1)}" cy="${a[1].toFixed(1)}" r="1.1"/><circle class="iso-wire-end" cx="${b[0].toFixed(1)}" cy="${b[1].toFixed(1)}" r="1.1"/></g>`;
}

// ───────── 조립 (뒤에서 앞으로) ─────────
const seoul = terminal(SEOUL, SEOUL_TOP, "seoul", 4);
const la = terminal(LA, LA_TOP, "la", 3);
const gl = globe();
const BACKPLUG = [PHONE.x + PHONE.w - 6, PHONE.y, PHONE_TOP - 8];   // 폰 뒷면 단자
const cableSeoul = cable([BACKPLUG, [BACKPLUG[0] + 6, PHONE.y - 5, PHONE_TOP - 18], [BACKPLUG[0] + 14, PHONE.y - 6, BEAM_TOP + 14], [seoul.port[0] - 8, seoul.port[1] - 2, seoul.port[2] + 8], seoul.port], "c-seoul");
const cableLA = cable([BACKPLUG, [BACKPLUG[0] + 8, PHONE.y - 4, PHONE_TOP + 6], [20, -30, GLOBE_Z + GLOBE_R + 30], [GLOBE[0], GLOBE[1], GLOBE_Z + GLOBE_R + 9], [la.port[0] - 12, la.port[1] - 4, la.port[2] + 16], la.port], "c-la");

const body = [
  plate(),
  rails(),
  post(POSTS[0]),
  cart(),
  lensAndBeam(),
  post(POSTS[1]),
  beam(),
  phone(),
  gl.svg,
  cableLA,
  la.svg,
  seoul.svg,
  cableSeoul,
];

const svg = k.figureSvg({
  width: WIDTH, height: HEIGHT,
  label: "레일 위 대차가 바코드 라벨을 받침대에 세운 폰의 렌즈 밑으로 옮기고, 폰 화면에 13자리가 차오른 뒤, 케이블 두 가닥이 바로 옆 서울 단말과 지구본 너머 LA 단말에 같은 줄을 찍는 기계.",
  body,
});

const live = `
const P = ${JSON.stringify(P)};
const CODES = ${JSON.stringify(CODES)};
const HOME = ${HOME}, UNDER = ${UNDER}, PAST = ${PAST};
const DIG_Z0 = ${DIG.z0}, DIG_Z1 = ${DIG.z1};
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const $ = (p) => svg.querySelector('[data-part="' + p + '"]');
const cartEl = $("cart"), beamEl = $("beam"), digits = $("digits"), pscan = $("pscan");
const bars = [...svg.querySelectorAll("[data-code]")];
const pulses = [$("c-seoul-pulse"), $("c-la-pulse")];
const lens = pulses.map((p) => p.getTotalLength());
const readout = document.querySelector("[data-readout]");
const status = document.querySelector("[data-status]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const ease = (u) => { u = Math.min(1, Math.max(0, u)); return u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
// 한 번의 스캔 (초): 싣는 곳 → 렌즈 밑 (1.4) → 읽기 (0.5) → 숫자 13자리 (1.3) → 서울 (0.7) · LA (1.6) → 지나감 → 되돌아옴
const T = { move: 1.4, read: 0.5, digits: 1.3, seoul: 0.7, la: 1.6, hold: 1.4, back: 1.1 };
const T_READ = T.move, T_DIG = T_READ + T.read, T_SEND = T_DIG + T.digits, T_END = T_SEND + T.la + T.hold, T_ALL = T_END + T.back;
const SEOUL_ROWS = 4, LA_ROWS = 3;
let rows = []; // 받은 순서 (최근이 앞)
let n = 0, clock = still.matches ? T_SEND + T.la + 0.01 : 0, frame = 0, prev = 0, visible = false, touring = !still.matches, idle = 0, sent = { seoul: false, la: false };
function hhmmss(base, i) { return base + ":" + String((14 + (i - 129) * 7) % 60).padStart(2, "0"); }
function paintTerm(id, max, head, base) {
  $(id + "-head").textContent = head;
  for (let i = 0; i < max; i++) {
    const r = rows[i], el = $(id + "-row-" + i);
    el.textContent = r ? (r.idx + "  " + r.code + "  " + hhmmss(base, r.idx)) : "";
    $(id + "-hl-" + i).style.opacity = r && i === 0 && r.fresh[id] ? "1" : "0";
  }
}
function paint() {
  paintTerm("seoul", SEOUL_ROWS, "서울 · 세션 A-0312", "09:41");
  paintTerm("la", LA_ROWS, "LA · 같은 세션", "17:41");
}
function frameAt(t) {
  const c = CODES[n % CODES.length];
  bars.forEach((b, i) => (b.style.display = i === n % CODES.length ? "" : "none"));
  // 대차
  let x = HOME;
  if (t < T_READ) x = HOME + (UNDER - HOME) * ease(t / T.move);
  else if (t < T_END) x = UNDER + (t > T_SEND + 0.4 ? (PAST - UNDER) * ease((t - T_SEND - 0.4) / 1.2) : 0);
  else x = PAST + (HOME - PAST) * ease((t - T_END) / T.back);
  const [dx, dy] = axisVector(P, [x, 0, 0]);
  cartEl.setAttribute("transform", "translate(" + dx.toFixed(2) + " " + dy.toFixed(2) + ")");
  // 읽는 빛
  const b = t < T_READ ? 0 : t < T_DIG ? Math.sin(Math.PI * (t - T_READ) / T.read) : 0;
  beamEl.style.opacity = b.toFixed(3);
  // 폰 화면: 스캔 선 → 숫자 한 자리씩
  const sp = (t - T_READ) / T.read;
  pscan.style.opacity = sp > 0 && sp < 1 ? "1" : "0";
  pscan.setAttribute("transform", "translate(0 " + (-(DIG_Z0 + 18 + 12 * (1 - sp))).toFixed(2) + ")");
  const shown = t < T_DIG ? 0 : Math.min(13, Math.floor((t - T_DIG) / T.digits * 13) + 1);
  digits.textContent = t < T_DIG ? "" : c.code.slice(0, shown);
  digits.toggleAttribute("data-done", shown === 13);
  // 전송: 금색 맥이 케이블을 따라 간다
  [[0, T.seoul, "seoul"], [1, T.la, "la"]].forEach(([i, dur, id]) => {
    const u = (t - T_SEND) / dur, L = lens[i];
    const on = u > 0 && u < 1.15;
    pulses[i].style.opacity = on ? "1" : "0";
    pulses[i].style.strokeDasharray = "14 " + L;
    pulses[i].style.strokeDashoffset = (14 - (L + 14) * Math.min(1, ease(u))).toFixed(1);
    if (u >= 1 && !sent[id]) {
      sent[id] = true;
      if (id === "seoul") rows.unshift({ code: c.code, idx: 128 + count(), fresh: { seoul: true, la: false } });
      else if (rows[0]) rows[0].fresh.la = true;
      rows = rows.slice(0, 6);
      paint();
      say();
    }
  });
  if (t >= T_END && rows[0]) { rows[0].fresh = { seoul: false, la: false }; paint(); }
}
let total = 0;
function count() { return ++total; }
function say() {
  const r = rows[0], c = CODES[n % CODES.length];
  const text = r ? total + "건 · " + r.code + " · 서울 " + hhmmss("09:41", r.idx) + (sent.la ? " · LA " + hhmmss("17:41", r.idx) : " · LA 전송 중") : "대기 · 라벨을 실어요";
  if (readout.textContent !== text) readout.textContent = text;
}
function next() { n++; clock = 0; sent = { seoul: false, la: false }; status.textContent = "다음 라벨을 스캔해요."; run(); }
function tick(now) {
  const dt = prev ? Math.min((now - prev) / 1000, 1 / 30) : 1 / 60;
  prev = now;
  clock += dt;
  if (clock >= T_ALL) { if (touring) next(); else clock = T_ALL; }
  frameAt(clock);
  frame = visible && (touring || clock < T_ALL) ? requestAnimationFrame(tick) : 0;
}
function run() { if (!frame && visible) { prev = 0; frame = requestAnimationFrame(tick); } }
function takeOver() { touring = false; clearTimeout(idle); idle = setTimeout(() => { if (!still.matches) { touring = true; run(); } }, 9000); }
new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
stage.addEventListener("click", () => { takeOver(); if (clock >= T_SEND) next(); stage.focus({ preventScroll: true }); });
stage.addEventListener("keydown", (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); takeOver(); if (clock >= T_SEND) next(); } });
paint(); frameAt(clock); say();
`;

const css = `<style>
.sc-glass{fill:var(--anatomy-shade-0)}
.sc-bars{fill:var(--anatomy-hi)}
.sc-fan{fill:var(--anatomy-lit);opacity:.12}
.sc-scan{stroke-width:1.2px}
.sc-scanline{fill:none;stroke:var(--sc-gold);stroke-width:.9px;stroke-linecap:round}
.sc-chip{fill:var(--anatomy-top);stroke:var(--anatomy-lo);stroke-width:.4px;vector-effect:non-scaling-stroke}
.sc-seg{fill:var(--anatomy-lo)}
.sc-digits{fill:var(--anatomy-hi);font-family:var(--anatomy-mono);font-weight:700;letter-spacing:-.02em}
.sc-digits[data-done]{fill:var(--sc-gold)}
.sc-term{fill:var(--anatomy-hi);font-family:var(--anatomy-mono);letter-spacing:.01em}
.sc-row{fill:var(--sc-gold);opacity:0;transition:opacity .5s var(--anatomy-ease)}
.sc-row[style*="opacity: 1"]{fill-opacity:.22}
.sc-cord{stroke-width:1.1px}
.sc-pulse{fill:none;stroke:var(--sc-gold);stroke-width:2.2px;stroke-linecap:round;opacity:0;filter:drop-shadow(0 0 2px var(--sc-gold))}
.iso{--sc-gold:#f2b230}
.iso[data-theme="light"]{--sc-gold:#c98a0e}
.sc-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.iso-stage{cursor:pointer;touch-action:pan-y}
.iso-stage:focus{outline:none}
.iso-stage:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:6px}
</style>`;

const page = css + k.plateHtml({
  fig: "Fig 1",
  title: "스캔 한 번, PC 두 대",
  hint: "누르면 다음 라벨 · Space",
  readout: "대기 · 라벨을 실어요",
  keys: [
    { mark: "lit", label: "렌즈의 빛: 막대를 읽는 순간만 켜져요" },
    { mark: "raised", label: "대차와 라벨 카드: EAN-13 막대를 실제 부호대로 새겼어요" },
    { mark: "edge", label: "케이블 두 가닥: 바로 옆 서울 단말, 지구본 너머 LA 단말" },
  ],
  caption: "레일 위 대차가 라벨을 받침대 위 폰의 렌즈 밑으로 옮기면, 빛이 막대를 한 번 훑고 폰 화면에 13자리가 한 자리씩 차요. 숫자가 다 차면 금색 맥이 케이블 두 가닥을 따라가 바로 옆 서울 단말과 지구본 너머 LA 단말에 같은 줄을 찍어요. 시각은 서울 09:41, LA는 전날 17:41이에요. 누르거나 Space를 누르면 다음 라벨을 실어요.",
  body: `<div class="iso-stage" tabindex="0" role="group" aria-label="스캔 기계. 누르면 다음 라벨을 스캔해요.">${svg}<span class="sc-sr" role="status" aria-live="polite" data-status></span></div>`,
});

const name = theme === "light" ? "scan-machine-light.html" : "scan-machine.html";
writeFileSync(join(OUT, name), k.pageHtml({ title: "스캔 한 번, PC 두 대", theme, body: page, script: kitScript() + live }));
console.log("wrote", join(OUT, name));
