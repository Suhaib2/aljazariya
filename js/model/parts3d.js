// Части 3D-модели: кожа, череп и мозг, позвоночник, полости, язык, зубы, дёсны, губы, нёбо, гортань.
// Формы строятся по контурам 2D-разреза, поэтому срез модели совпадает с рисунком.
import { HEAD, TONGUE, TURB, EPI, PALATE, VELUM, UP_INC, LO_INC, UP_GUM, LO_GUM, MANDIBLE, UP_LIP, LO_LIP, NASAL } from "./anatomy.js";
import { X, Y, sample, xAtY, slice, lerpT, sp, grid, loft, sweep, profileOf, archStations, SKULL, BRAIN, CEREB, ORAL, CORD, PHAR } from "./shape3d.js";
import { COL } from "./look3d.js";

export const TW = [[140, 3], [146, 14], [160, 26], [180, 36], [200, 42], [230, 46], [260, 48], [285, 44], [296, 38], [303, 6]];
const TONGUE_POLY = sample(TONGUE, true, 6);
export function tongueTopY(x, z = 0) {
  const s = slice(TONGUE_POLY, x);
  if (!s) return 350;
  const yc = (s[0] + s[1]) / 2, b = (s[1] - s[0]) / 2, a = lerpT(TW, x) / 100;
  const q = Math.min(0.999, Math.abs(z) / a);
  return yc - b * Math.pow(1 - Math.pow(q, 2.6), 1 / 2.6);
}

// Зубные дуги (x разреза, z) от середины к второму моляру и ширины зубов (мезиодистально).
const UP_ARCH = [[135, 0], [138, 0.13], [146, 0.27], [160, 0.42], [178, 0.53], [200, 0.62], [226, 0.7], [256, 0.76]];
const LO_ARCH = [[134, 0], [137, 0.12], [145, 0.25], [159, 0.4], [177, 0.51], [199, 0.6], [225, 0.68], [254, 0.74]];
const UP_MD = [0.23, 0.176, 0.203, 0.19, 0.176, 0.27, 0.244], LO_MD = [0.136, 0.149, 0.19, 0.19, 0.19, 0.298, 0.285];
// Профиль коронки жевательного зуба: скруглённый прямоугольник с бороздой на жевательной стороне.
function postProfile(bl, h, up) {
  const pts = [];
  for (let i = 0; i < 28; i++) {
    const t = (i / 28) * Math.PI * 2, u = 0.5 * bl * sp(Math.cos(t), 3.4);
    let v = 0.5 * h * sp(Math.sin(t), 3.4);
    const occl = up ? v < 0 : v > 0;
    if (occl) v += (up ? 1 : -1) * 0.028 * Math.exp(-Math.pow(u / (0.16 * bl), 2));
    pts.push([u, v]);
  }
  return pts;
}

export function buildParts(T, look, add) {
  const { tissue, cavity, tex } = look;
  const mat = {
    skin: tissue(COL.skin, COL.skinCut, { roughness: 0.55, sheen: 0.5, sheenRoughness: 0.6, sheenColor: new T.Color("#ffcfb5"), bumpMap: tex.pores, bumpScale: 0.0015 }),
    bone: tissue(COL.bone, COL.boneCut, { roughness: 0.6 }),
    brain: tissue(COL.brain, COL.brainCut, { roughness: 0.7 }),
    cereb: tissue("#d9aea6", "#d3a49c", { roughness: 0.7 }),
    cord: tissue(COL.cord, "#e7d1b2", { roughness: 0.6 }),
    disc: tissue(COL.disc, "#c3cfd6", { roughness: 0.5 }),
    tongue: tissue(COL.tongue, COL.tongueCut, { roughness: 0.5, clearcoat: 0.6, clearcoatRoughness: 0.35, bumpMap: tex.papillae, bumpScale: 0.004 }),
    lip: tissue("#ffffff", COL.lipCut, { vertexColors: true, roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.3, sheen: 0.3, sheenColor: new T.Color("#ffb0b0"), bumpMap: tex.lip, bumpScale: 0.002 }),
    palate: tissue(COL.mucosa, COL.boneCut, { roughness: 0.45, clearcoat: 0.4 }),
    velum: tissue(COL.mucosa, COL.mucosaCut, { roughness: 0.45, clearcoat: 0.5 }),
    concha: tissue(COL.mucosa, COL.mucosaCut, { roughness: 0.45, clearcoat: 0.5 }),
    phar: tissue(COL.mucosa, COL.mucosaCut, { roughness: 0.45, clearcoat: 0.5 }),
    cart: tissue(COL.cart, COL.cartCut, { roughness: 0.4, clearcoat: 0.3 }),
    muscle: tissue(COL.muscle, "#9c4a4e", { roughness: 0.5 }),
    mouth: cavity(COL.cavity), nasal: cavity(COL.nasal), airway: cavity(COL.cavity),
  };
  const teethMat = () => tissue(COL.tooth, COL.toothCut, { roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08 });
  const gumMat = () => tissue(COL.gum, COL.gumCut, { roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.3 });
  const mesh = (g, m) => new T.Mesh(g, m);
  const tube = (pts, r, seg = 48, rad = 14) => new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(([x, y, z = 0]) => new T.Vector3(X(x), Y(y), z))), seg, r, rad, false);

  // ---------- кожа ----------
  // Лицевой контур кожи идёт позади губ и носа: их дают отдельные тела, иначе губы тянулись бы валиком по всему лицу.
  const FACE = [...HEAD.slice(13, 25), [124, 402], [121, 390], [120, 378], [120, 366], [119, 352], [118, 340], HEAD[33], [122, 300], [127, 262], ...HEAD.slice(40), HEAD[0]];
  const front = sample(FACE, false, 6), back = sample(HEAD.slice(0, 13), false, 6);
  const HW = [[38, 10], [60, 92], [100, 138], [150, 158], [200, 166], [250, 168], [300, 162], [340, 150], [380, 136], [420, 120], [450, 108], [480, 102], [500, 106], [560, 112], [640, 114]];
  const headRows = [];
  for (let y = 40; y <= 640; y += 6) {
    const xf = xAtY(front, y), xb = xAtY(back, y);
    if (xf == null || xb == null) continue;
    const cx = (xf + xb) / 2, a = (xb - xf) / 2, w = lerpT(HW, y), ring = [];
    for (let i = 0; i < 72; i++) {
      const th = (i / 72) * Math.PI * 2, u = Math.cos(th), v = Math.sin(th);
      ring.push([X(cx - a * sp(u, 2.4)), Y(y), (w * sp(v, 2.4) * (u > 0 ? 1 - 0.24 * u * u : 1)) / 100]);
    }
    headRows.push(ring);
  }
  add("skin", mesh(grid(T, headRows, { caps: true }), mat.skin));
  const noseP = sample([[116, 329], [104, 325], [92, 317], [86, 304], [90, 292], [104, 270], [118, 246], [128, 226]], false, 6);
  const faceL = sample([[116, 329], [122, 300], [127, 262], [128, 226]], false, 6);
  const NW = [[226, 6], [250, 10], [275, 14], [300, 22], [315, 31], [324, 27], [329, 16]];
  const noseRows = [];
  for (let y = 228; y <= 328; y += 3) {
    const xn = xAtY(noseP, y), xf = xAtY(faceL, y), wn = lerpT(NW, y), ring = [];
    if (xn == null || xf == null) continue;
    for (let i = 0; i <= 16; i++) { const ph = -Math.PI / 2 + (i / 16) * Math.PI; ring.push([X(xf + 3 - (xf + 3 - xn) * Math.pow(Math.max(0, Math.cos(ph)), 1.3)), Y(y), (wn * Math.sin(ph)) / 100]); }
    noseRows.push(ring);
  }
  add("skin", mesh(grid(T, noseRows, { ring: false }), mat.skin));
  for (const s of [1, -1]) {
    const ear = mesh(new T.SphereGeometry(1, 24, 16), mat.skin);
    ear.scale.set(0.22, 0.36, 0.07); ear.position.set(X(376), Y(270), s * 1.67); ear.rotation.set(0, s * 0.35, -0.12);
    add("skin", ear);
    const rim = mesh(new T.TorusGeometry(0.2, 0.035, 10, 40, Math.PI * 1.55), mat.skin);
    rim.scale.set(1, 1.6, 1); rim.position.set(X(378), Y(268), s * 1.7); rim.rotation.set(0, s * 0.35, -1.2);
    add("skin", rim);
  }

  // ---------- череп, мозг, позвоночник, челюсть ----------
  add("inner", mesh(loft(T, SKULL, [[126, 60], [160, 116], [220, 136], [300, 140], [400, 134], [470, 108], [512, 56]], { p: 2.3 }), mat.bone));
  add("inner", mesh(loft(T, BRAIN, [[140, 50], [170, 104], [220, 124], [300, 128], [400, 122], [460, 96], [496, 46]], { p: 2.3 }), mat.brain));
  add("inner", mesh(loft(T, CEREB, 72, { p: 2.2, step: 2 }), mat.cereb));
  add("inner", mesh(tube(CORD.slice(0, 5), 0.11, 24, 14), mat.cord));
  add("inner", mesh(tube(CORD.slice(4), 0.065, 32, 12), mat.cord));
  for (let y0 = 334; y0 < 640; y0 += 38) {
    add("inner", mesh(loft(T, [[346, y0], [388, y0], [388, y0 + 28], [346, y0 + 28]], 26, { p: 4, step: 2 }), mat.bone));
    add("inner", mesh(loft(T, [[347, y0 + 28], [387, y0 + 28], [387, y0 + 37], [347, y0 + 37]], 24, { p: 4, step: 2 }), mat.disc));
    add("inner", mesh(loft(T, [[412, y0 + 6], [438, y0 + 16], [438, y0 + 24], [412, y0 + 19]], 6, { p: 3, step: 1.5 }), mat.bone));
  }
  const lo = archStations(LO_ARCH, 420, 70, { ext: 1 });
  // Тело нижней челюсти идёт снаружи от языка: сзади отодвигаем его к щекам и делаем тоньше.
  add("inner", mesh(sweep(T, profileOf(MANDIBLE, 134, 420), lo.stations.map((s) => {
    const k = Math.abs(s.s - 0.5) * 2, out = 0.12 * k;
    return { ...s, p: [s.p[0] - s.b[0] * out, s.p[1] - 0.05 - 0.04 * k, s.p[2] - s.b[2] * out], sx: s.sx * (1 - 0.35 * k) };
  })), mat.bone));

  // ---------- полости ----------
  add("mouth", mesh(loft(T, ORAL, [[148, 14], [160, 28], [180, 40], [205, 50], [230, 56], [260, 56], [290, 46], [300, 30]], { p: 2.2, step: 2 }), mat.mouth), 1, "jawf");
  add("nasal", mesh(loft(T, NASAL, [[100, 8], [112, 14], [130, 20], [170, 25], [230, 27], [290, 24], [322, 12]], { p: 2.4, step: 2.5 }), mat.nasal), 1, "nose");
  TURB.forEach((t, i) => { for (const z of [-0.17, 0.17]) add("nasal", mesh(tube(t.map(([x, y]) => [x, y, z]), 0.036 + 0.006 * i, 28, 10), mat.concha), 1, "nose"); });
  const phar = mesh(tube(PHAR, 0.19, 40, 18), mat.airway); phar.geometry.scale(1, 1, 1.3); add("phar", phar, 1, "throat");
  add("phar", mesh(tube([[304, 494], [300, 520], [299, 600], [299, 640]], 0.14, 24, 16), mat.airway), 1, "throat");
  const eso = mesh(tube([[329, 498], [330, 560], [330, 640]], 0.085, 16, 14), mat.muscle); eso.geometry.scale(1, 1, 1.4); add("phar", eso, 1, "throat");
  add("phar", mesh(loft(T, EPI, 13, { byY: true, p: 2.2, step: 1.5 }), mat.phar), 1, "throat");
  const thy = mesh(new T.CylinderGeometry(0.32, 0.27, 0.4, 32, 1, true, Math.PI * 1.2, Math.PI * 0.6), mat.cart);
  thy.position.set(X(300), Y(486), 0); add("phar", thy, 1, "throat");
  for (const z of [0.05, -0.05]) { const f = mesh(new T.SphereGeometry(1, 20, 12), mat.phar); f.scale.set(0.13, 0.022, 0.04); f.position.set(X(302), Y(489), z); add("phar", f, 1, "throat"); }
  const cric = mesh(new T.TorusGeometry(0.16, 0.022, 8, 32), mat.cart); cric.rotation.x = Math.PI / 2; cric.position.set(X(300), Y(512), 0); add("phar", cric, 1, "throat");
  for (let y = 526; y < 640; y += 17) { const r = mesh(new T.TorusGeometry(0.155, 0.014, 6, 28, Math.PI * 1.6), mat.cart); r.rotation.set(Math.PI / 2, 0, 0.2 * Math.PI); r.position.set(X(299), Y(y), 0); add("phar", r, 1, "throat"); }
  const hy = mesh(new T.TorusGeometry(0.2, 0.022, 6, 24, Math.PI), mat.bone); hy.rotation.set(Math.PI / 2, 0, Math.PI / 2); hy.position.set(X(270), Y(452), 0); add("inner", hy);

  // ---------- нёбо ----------
  const PAL = sample(PALATE, true, 6), palRows = [];
  const archZ = (x) => lerpT(UP_ARCH.map(([ax, z]) => [ax, z]), x);
  for (let x = 148; x <= 254; x += 3) {
    const s = slice(PAL, x); if (!s) continue;
    const w = Math.max(0.05, archZ(x) - 0.1), ring = [];
    for (let j = 0; j <= 16; j++) { const z = -w + (2 * w * j) / 16; ring.push([X(x), Y(s[1] + (345 - s[1]) * Math.pow(Math.abs(z / w), 2.2)), z]); }
    for (let j = 16; j >= 0; j--) { const z = -w + (2 * w * j) / 16; ring.push([X(x), Y(s[0]), z * 1.02]); }
    palRows.push(ring);
  }
  add("palate", mesh(grid(T, palRows, { caps: true }), mat.palate), 1, "tongue");
  add("palate", mesh(loft(T, VELUM, [[252, 44], [275, 34], [292, 18], [302, 8], [312, 5]], { p: 2.2, step: 1.5 }), mat.velum), 1, "throat");

  // ---------- язык ----------
  const tRows = [];
  for (let x = 140.5; x <= 302.5; x += 2) {
    const s = slice(TONGUE_POLY, x); if (!s) continue;
    const yc = (s[0] + s[1]) / 2, b = (s[1] - s[0]) / 2, a = lerpT(TW, x) / 100, ring = [];
    const gk = Math.max(0, Math.min(1, (x - 150) / 40)) * (x < 282 ? 1 : 0);
    for (let i = 0; i < 48; i++) {
      const th = (i / 48) * Math.PI * 2, u = sp(Math.cos(th), 2.6), z = a * sp(Math.sin(th), 2.6);
      ring.push([X(x), Y(yc - b * u + (u > 0 ? 1.6 * gk * Math.exp(-Math.pow(z / 0.07, 2)) : 0)), z]);
    }
    tRows.push(ring);
  }
  add("tongue", mesh(grid(T, tRows, { caps: true }), mat.tongue), 1, "tongue");

  // ---------- зубы и дёсны ----------
  for (const [arch, y, md, grp, inc, post, gum, gy] of [
    [UP_ARCH, 357, UP_MD, "upT", profileOf(UP_INC, 135, 357), [[0.24, 0.21], [0.3, 0.19]], UP_GUM, 336],
    [LO_ARCH, 378, LO_MD, "loT", profileOf(LO_INC, 134.5, 378), [[0.21, 0.2], [0.28, 0.18]], LO_GUM, 399],
  ]) {
    const up = grp === "upT", tm = teethMat(), A = archStations(arch, y, 3);
    const total = A.stations[0].len;
    for (const side of [1, -1]) {
      let d = 0;
      md.forEach((w, k) => {
        const s = 0.5 + (side * (d + w / 2)) / total; d += w;
        const c = A.at(s), e1 = A.at(s - 0.004), e2 = A.at(s + 0.004);
        const tx = e2.p[0] - e1.p[0], tz = e2.p[2] - e1.p[2], tl = Math.hypot(tx, tz) || 1;
        const prof = k < 2 ? inc : k === 2 ? inc.map(([u, v]) => [u * 1.15, v * 1.12 - (up ? 0.012 : -0.012)]) : postProfile(...post[k < 5 ? 0 : 1], up);
        const st = [];
        for (let j = 0; j <= 8; j++) {
          const f = -1 + j / 4, sc = Math.pow(1 - Math.pow(Math.abs(f), 5), 1 / 5) * 0.86 + 0.14;
          st.push({ p: [c.p[0] + (tx / tl) * f * w * 0.47, c.p[1], c.p[2] + (tz / tl) * f * w * 0.47], b: c.b, sx: sc, sy: 0.55 + 0.45 * sc });
        }
        add(grp, mesh(sweep(T, prof, st), tm), 1, "teeth");
      });
    }
    const G = archStations(arch, gy, 80, { ext: 1 });
    add(grp, mesh(sweep(T, profileOf(gum, arch[0][0], gy), G.stations.map((s) => ({ ...s, sx: s.sx * (1 + 0.25 * Math.abs(s.s - 0.5) * 2) }))), gumMat()), 1, "teeth");
  }

  // ---------- губы ----------
  const cLip = new T.Color(COL.lip), cSkin = new T.Color(COL.skin), clamp01 = (v) => Math.max(0, Math.min(1, v));
  for (const [poly, oy, dy, red] of [[UP_LIP, 348, 14, (x, y) => Math.max(clamp01((y - 349) / 6), clamp01((x - 119) / 4))], [LO_LIP, 386, -12, (x, y) => Math.max(clamp01((389 - y) / 6), clamp01((x - 120) / 4))]]) {
    const base = profileOf(poly, 118, oy), prof = base.map(([u, v]) => [u * 1.03, v * 1.03]), st = [];
    const tint = base.map(([u, v]) => cSkin.clone().lerp(cLip, red(118 + u * 100, oy - v * 100)));
    for (let i = 0; i <= 40; i++) {
      const z = -0.44 + (0.88 * i) / 40, k = Math.pow(z / 0.44, 2), dxdz = (2 * 0.46 * z) / (0.44 * 0.44), n = Math.hypot(1, dxdz);
      st.push({ p: [X(118 + 46 * k), Y(oy + dy * k), z], b: [1 / n, 0, -dxdz / n], sx: 1 - 0.72 * Math.pow(k, 1.5), sy: 1 - 0.7 * Math.pow(k, 1.5) });
    }
    const g = sweep(T, prof, st), col = [];
    for (let i = 0; i < st.length; i++) for (const c of tint) col.push(c.r, c.g, c.b);
    col.push(cLip.r, cLip.g, cLip.b, cLip.r, cLip.g, cLip.b);
    g.setAttribute("color", new T.Float32BufferAttribute(col, 3));
    add("lips", mesh(g, mat.lip), 1, "lips");
  }
  return mat;
}
