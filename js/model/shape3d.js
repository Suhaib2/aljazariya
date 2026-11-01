// Геометрия 3D-модели: сплайны, «лофты» по сагиттальным контурам и протяжка профиля вдоль дуги.
// Координаты контуров — как в 2D-разрезе (x — назад, y — вниз); X() и Y() переводят их в мир.
export const X = (x) => (x - 300) / 100, Y = (y) => -(y - 340) / 100;

export function sample(pts, closed, per = 6) {
  const out = [], n = pts.length;
  const g = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    for (let s = 0; s < per; s++) {
      const t = s / per, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map((k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
    }
  }
  if (!closed) out.push(pts[n - 1]);
  return out;
}
export function xAtY(poly, y) {
  for (let i = 0; i < poly.length - 1; i++) {
    const [x1, y1] = poly[i], [x2, y2] = poly[i + 1];
    if ((y >= y1 && y <= y2) || (y >= y2 && y <= y1)) return y1 === y2 ? x1 : x1 + ((x2 - x1) * (y - y1)) / (y2 - y1);
  }
  return null;
}
// Отрезок, который вертикаль x (или горизонталь y при byY) высекает из замкнутого контура.
export function slice(poly, v, byY = false) {
  const a = byY ? 1 : 0, b = byY ? 0 : 1;
  let lo = Infinity, hi = -Infinity;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length];
    if ((v >= p[a] && v <= q[a]) || (v >= q[a] && v <= p[a])) {
      const u = p[a] === q[a] ? p[b] : p[b] + ((q[b] - p[b]) * (v - p[a])) / (q[a] - p[a]);
      lo = Math.min(lo, u); hi = Math.max(hi, u);
    }
  }
  return lo < hi ? [lo, hi] : null;
}
export function lerpT(tbl, v) {
  if (v <= tbl[0][0]) return tbl[0][1];
  for (let i = 0; i < tbl.length - 1; i++) { const [a, va] = tbl[i], [b, vb] = tbl[i + 1]; if (v >= a && v <= b) return va + ((vb - va) * (v - a)) / (b - a); }
  return tbl[tbl.length - 1][1];
}
export const sp = (v, p) => Math.sign(v) * Math.pow(Math.abs(v), 2 / p);
const smooth01 = (t) => t * t * (3 - 2 * t);

// Сетка из рядов точек. ring — ряды замкнуты в кольцо; caps — закрыть торцы веером.
export function grid(T, rows, { ring = true, caps = false } = {}) {
  const R = rows.length, C = rows[0].length, pos = [], uv = [];
  rows.forEach((row, r) => row.forEach((p, c) => { pos.push(p[0], p[1], p[2]); uv.push(c / C, r / Math.max(1, R - 1)); }));
  const idx = [], cols = ring ? C : C - 1;
  for (let r = 0; r < R - 1; r++) for (let c = 0; c < cols; c++) {
    const a = r * C + c, b = r * C + ((c + 1) % C), d = (r + 1) * C + c, e = (r + 1) * C + ((c + 1) % C);
    idx.push(a, d, b, b, d, e);
  }
  if (caps && ring) {
    for (const [r, flip] of [[0, false], [R - 1, true]]) {
      const ctr = [0, 1, 2].map((k) => rows[r].reduce((s, p) => s + p[k], 0) / C);
      const ci = pos.length / 3; pos.push(...ctr); uv.push(0.5, r ? 1 : 0);
      for (let c = 0; c < C; c++) { const i = r * C + c, j = r * C + ((c + 1) % C); flip ? idx.push(ci, j, i) : idx.push(ci, i, j); }
    }
  }
  const g = new T.BufferGeometry();
  g.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  orient(g);
  g.computeVertexNormals();
  return g;
}
// Треугольники замкнутого тела должны смотреть наружу: по знаку объёма решаем, переворачивать ли их.
export function orient(g) {
  const p = g.attributes.position.array, ix = g.index.array;
  let vol = 0;
  for (let i = 0; i < ix.length; i += 3) {
    const a = ix[i] * 3, b = ix[i + 1] * 3, c = ix[i + 2] * 3;
    vol += p[a] * (p[b + 1] * p[c + 2] - p[b + 2] * p[c + 1]) - p[a + 1] * (p[b] * p[c + 2] - p[b + 2] * p[c]) + p[a + 2] * (p[b] * p[c + 1] - p[b + 1] * p[c]);
  }
  if (vol < 0) for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; }
  return g;
}

// Тело из сагиттального контура: срезы поперёк оси (x или y), в срезе — суперэллипс шириной w.
export function loft(T, poly, widths, { byY = false, step = 3, seg = 32, p = 2.4, from, to, zc = 0, taper = 0 } = {}) {
  const P = sample(poly, true, 5);
  const ax = byY ? 1 : 0;
  const lo = from ?? Math.min(...P.map((q) => q[ax])) + 0.3, hi = to ?? Math.max(...P.map((q) => q[ax])) - 0.3;
  const rows = [];
  for (let v = lo; v <= hi + 1e-6; v += step) {
    const s = slice(P, v, byY);
    if (!s) continue;
    const c = (s[0] + s[1]) / 2, h = (s[1] - s[0]) / 2, w = (typeof widths === "number" ? widths : typeof widths === "function" ? widths(v) : lerpT(widths, v)) / 100, ring = [];
    for (let i = 0; i < seg; i++) {
      const th = (i / seg) * Math.PI * 2, u = sp(Math.cos(th), p), z = w * sp(Math.sin(th), p);
      const k = c - h * u * (1 - taper * Math.abs(z / (w || 1)));
      ring.push(byY ? [X(k), Y(v), zc + z] : [X(v), Y(k), zc + z]);
    }
    rows.push(ring);
  }
  return grid(T, rows, { caps: true });
}

// Протяжка профиля вдоль пути. Профиль — точки [вглубь, вверх] в мировых единицах;
// у станции: точка p, направление «вглубь» b (горизонтальное), масштабы sx, sy.
export function sweep(T, profile, stations) {
  const rows = stations.map(({ p, b, sx = 1, sy = 1 }) => profile.map(([u, v]) => [p[0] + b[0] * u * sx, p[1] + v * sy, p[2] + b[2] * u * sx]));
  return grid(T, rows, { caps: true });
}
// Профиль из 2D-контура относительно опорной точки (ox, oy) в координатах разреза.
export const profileOf = (poly, ox, oy, per = 4) => sample(poly, true, per).map(([x, y]) => [(x - ox) / 100, -(y - oy) / 100]);

// Зубная дуга: точки (x разреза, z) от середины к последнему моляру; станции по длине дуги.
export function archStations(half, y, n, { ext = 0 } = {}) {
  const pts = sample([...half.slice(1).reverse().map(([x, z]) => [x, -z]), ...half], false, 8);
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot((pts[i][0] - pts[i - 1][0]) / 100, pts[i][1] - pts[i - 1][1]));
  const total = L[L.length - 1], at = (s) => {
    const d = Math.max(0, Math.min(total, s * total));
    let i = 1; while (i < L.length - 1 && L[i] < d) i++;
    const k = (d - L[i - 1]) / (L[i] - L[i - 1] || 1), a = pts[i - 1], b = pts[i];
    const x = X(a[0] + (b[0] - a[0]) * k), z = a[1] + (b[1] - a[1]) * k;
    const tx = X(b[0]) - X(a[0]), tz = b[1] - a[1], tl = Math.hypot(tx, tz) || 1;
    // «Вглубь» — к языку: перпендикуляр к дуге, повёрнутый внутрь.
    let bx = -tz / tl, bz = tx / tl;
    if (bx * (X(250) - x) + bz * (0 - z) < 0) { bx = -bx; bz = -bz; }
    return { p: [x, Y(y), z], b: [bx, 0, bz], len: total };
  };
  const out = [];
  for (let i = 0; i < n; i++) {
    const s = i / (n - 1), st = at(s), e = Math.min(1, Math.min(s, 1 - s) / 0.04);
    out.push({ ...st, sx: ext ? 0.35 + 0.65 * smooth01(e) : 1, sy: ext ? 0.35 + 0.65 * smooth01(e) : 1, s });
  }
  return { stations: out, at };
}

// ---------- контуры, которых нет в 2D-разрезе ----------
export const SKULL = [[130, 204], [126, 186], [126, 164], [134, 136], [154, 102], [190, 72], [240, 54], [300, 46], [368, 51], [426, 78], [472, 122], [502, 180], [513, 244], [506, 306], [488, 346],
  [462, 352], [438, 338], [416, 322], [396, 314], [372, 298], [350, 276], [332, 258], [304, 244], [268, 236], [230, 230], [190, 224], [158, 218], [140, 212]];
export const BRAIN = [[146, 206], [140, 186], [141, 162], [149, 136], [168, 107], [200, 82], [244, 66], [300, 59], [362, 63], [416, 88], [456, 128], [484, 182], [496, 240], [492, 276], [476, 296],
  [446, 294], [414, 284], [384, 270], [356, 258], [326, 251], [296, 246], [262, 240], [226, 236], [190, 230], [162, 222]];
export const CEREB = [[410, 296], [446, 300], [476, 304], [492, 314], [488, 332], [468, 344], [440, 346], [416, 336], [402, 320], [402, 304]];
export const ORAL = [[148, 352], [154, 345], [168, 337], [192, 329], [224, 325], [255, 323], [268, 329], [283, 339], [295, 351], [300, 362], [294, 368], [282, 358], [264, 351],
  [242, 348], [218, 347], [194, 348], [172, 351], [156, 356], [148, 360]];
export const CORD = [[350, 254], [364, 276], [380, 298], [394, 318], [401, 340], [403, 420], [404, 520], [405, 640]];
export const PHAR = [[318, 292], [328, 322], [333, 356], [333, 400], [330, 440], [322, 474], [306, 500]];
