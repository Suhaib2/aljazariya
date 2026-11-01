// 3D-модель головы на Three.js — анатомический муляж, рассечённый по средней линии.
// В боковых видах ближняя половина отрезана и виден срез; язык (сверху) и губы (спереди)
// показываются целыми. Буквы — HTML-маркеры поверх холста.
import { loadScript } from "../lib.js";
import { FLOW, NOSE_FLOW, MARKS, HOTSPOTS, TALL } from "./anatomy.js";
import { X, Y } from "./shape3d.js";
import { makeLook } from "./look3d.js";
import { buildParts, tongueTopY } from "./parts3d.js";
import { MAKHRAJ_BY_ID, LETTER_BY_KEY, MAKHARIJ } from "../data/index.js";
import { L } from "../core/i18n.js";

const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js";
const KCOLOR = { jawf: "--k-madd", throat: "--k-waqf", tongue: "--k-mkh", teeth: "--k-rule", lips: "--k-sfa", nose: "--k-nun" };

const VIEWS3 = {
  overview: { t: [X(292), Y(338), 0], r: 11.4, az: 0.34, pol: 1.48 },
  tongue: { t: [X(206), Y(352), 0], r: 3.7, az: 0, pol: 0.07 },
  teeth: { t: [X(138), Y(360), 0], r: 1.75, az: 0.3, pol: 1.5 },
  lips: { t: [X(112), Y(370), 0], r: 2.4, az: -1.42, pol: 1.5 },
  throat: { t: [X(312), Y(428), 0], r: 3.3, az: 0.32, pol: 1.52 },
  nose: { t: [X(205), Y(272), 0], r: 3.6, az: 0.3, pol: 1.45 },
  jawf: { t: [X(232), Y(382), 0], r: 5.8, az: 0.28, pol: 1.52 },
};
// cut: 0 — модель рассечена, 1 — целая. Остальное — непрозрачность групп.
const ALL = { cut: 0, skin: 1, inner: 1, palate: 1, upT: 1, loT: 1, tongue: 1, lips: 1, nasal: 1, phar: 1, mouth: 1, glow: 0 };
const VIS = {
  overview: ALL, teeth: ALL, throat: ALL, nose: ALL,
  jawf: { ...ALL, glow: 1 },
  tongue: { cut: 1, skin: 0.1, inner: 0, palate: 0, upT: 0.85, loT: 0.35, tongue: 1, lips: 0.25, nasal: 0, phar: 0, mouth: 0, glow: 0 },
  lips: { cut: 1, skin: 0.62, inner: 0, palate: 0.2, upT: 1, loT: 0.7, tongue: 0.4, lips: 1, nasal: 0, phar: 0, mouth: 0, glow: 0 },
};
const tt = (x, z = 0) => [X(x), Y(tongueTopY(x, z)) + 0.04, z];
const CUSTOM = {
  tongue: [
    { mk: "qaf", p: tt(290) }, { mk: "kaf", p: tt(268) }, { mk: "wasat_lisan", p: tt(224) },
    { mk: "hafa", p: tt(214, 0.4) }, { mk: "hafa", p: tt(214, -0.4), ghost: true },
    { mk: "lam", p: tt(168, 0.22) }, { mk: "lam", p: tt(168, -0.22) },
    { mk: "ra", p: tt(160), off: [-120, -100] }, { mk: "nun", p: tt(153), off: [-150, -50] }, { mk: "nitiya", p: tt(148), off: [-165, 0] },
    { mk: "lithawiya", p: tt(143), off: [-150, 50] }, { mk: "safir", p: tt(145, 0.03), off: [-120, 100] },
  ],
  lips: [
    { mk: "shafatan", only: ["ba"], p: [X(108), Y(367), -0.22] }, { mk: "shafatan", only: ["mim"], p: [X(108), Y(367), 0.22] },
    { mk: "fa", p: [X(114), Y(386), 0], off: [0, 52] }, { mk: "shafatan", only: ["waw"], p: [X(104), Y(350), 0], off: [0, -58] },
  ],
};

export async function mount(host, cb) {
  await loadScript(THREE_URL);
  const T = window.THREE;
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || "#888888";
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-label", L("3D-модель головы: махраджи букв", "3D head model: makharij of the letters", "نموذج ثلاثي الأبعاد للرأس: مخارج الحروف"));
  host.prepend(canvas);
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  const look = makeLook(T, renderer);
  const scene = new T.Scene();
  scene.environment = look.env;
  const camera = new T.PerspectiveCamera(32, 1, 0.05, 100);
  scene.add(new T.HemisphereLight(0xfff4ec, 0x39424a, 0.9));
  const key = new T.DirectionalLight(0xfff1e6, 2.4); key.position.set(3, 5, 6); scene.add(key);
  const fill = new T.DirectionalLight(0xdbe8ff, 0.8); fill.position.set(-5, 1, 3); scene.add(fill);
  const rim = new T.DirectionalLight(0xffffff, 1.2); rim.position.set(-2, 3, -6); scene.add(rim);

  const groups = {};
  const disposables = [];
  const add = (grp, mesh, base = 1, organ = null) => {
    mesh.userData = { grp, base, organ };
    (groups[grp] = groups[grp] || []).push(mesh);
    scene.add(mesh);
    disposables.push(mesh.geometry, mesh.material);
    return mesh;
  };
  buildParts(T, look, add);

  const C = { air: css("--lapis") };
  const glowMat = new T.MeshBasicMaterial({ color: new T.Color(C.air), transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending });
  const glow = new T.Mesh(new T.SphereGeometry(1, 24, 16), glowMat); glow.scale.set(0.72, 0.13, 0.38); glow.position.set(X(212), Y(338), 0);
  add("glow", glow, 0.45, "jawf");
  const particles = (pts, color) => {
    const curve = new T.CatmullRomCurve3(pts.map(([x, y]) => new T.Vector3(X(x), Y(y), 0)));
    const N = 46, geo = new T.BufferGeometry(), arr = new Float32Array(N * 3);
    geo.setAttribute("position", new T.BufferAttribute(arr, 3));
    const mat = new T.PointsMaterial({ color: new T.Color(color), size: 0.06, transparent: true, opacity: 0, depthWrite: false });
    const p = new T.Points(geo, mat); scene.add(p); disposables.push(geo, mat);
    return { p, curve, N, arr, geo };
  };
  const flowJ = particles(FLOW, C.air), flowN = particles(NOSE_FLOW, css("--k-nun"));

  // ---------- камера и управление ----------
  const cam = { t: new T.Vector3(...VIEWS3.overview.t), r: VIEWS3.overview.r, az: VIEWS3.overview.az, pol: VIEWS3.overview.pol };
  let tween = null, dirty = true, view = "overview", sel = null, hoverOrgan = null, compact = false, marksReady = false;
  // На узком экране общий вид показывает не 17 групп букв, а по кнопке на орган — как в 2D.
  const isCompact = () => host.clientWidth < 560 && view === "overview";
  const vis = { ...VIS.overview };
  const applyCam = () => {
    const s = Math.sin(cam.pol);
    camera.position.set(cam.t.x + cam.r * s * Math.sin(cam.az), cam.t.y + cam.r * Math.cos(cam.pol), cam.t.z + cam.r * s * Math.cos(cam.az));
    camera.lookAt(cam.t);
  };
  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix(); dirty = true;
    if (marksReady && isCompact() !== compact) buildMarkers();
  };
  const ro = new ResizeObserver(resize); ro.observe(host); resize();

  const ptrs = new Map();
  let drag = null;
  const ray = new T.Raycaster(), ndc = new T.Vector2();
  const pickables = () => Object.entries(groups).filter(([g]) => g !== "skin" && g !== "inner").flatMap(([, l]) => l).filter((m) => m.visible && m.material.opacity > 0.25 && m.userData.organ);
  const pick = (cx, cy) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    // Отрезанная половина не видна — попадания в неё не считаются.
    const hit = ray.intersectObjects(pickables(), false).find((h) => h.point.z <= look.clip.constant + 1e-3);
    return hit?.object.userData.organ || null;
  };
  const onDown = (e) => { canvas.setPointerCapture?.(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]); drag = { x: e.clientX, y: e.clientY, moved: 0, button: e.button, shift: e.shiftKey, d: null }; tween = null; };
  const onMove = (e) => {
    if (!ptrs.has(e.pointerId)) {
      if (e.pointerType === "mouse") { const o = pick(e.clientX, e.clientY); if (o !== hoverOrgan) { hoverOrgan = o; canvas.style.cursor = o ? "pointer" : "grab"; highlight(); } }
      return;
    }
    const prev = ptrs.get(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]);
    const dx = e.clientX - prev[0], dy = e.clientY - prev[1];
    drag.moved += Math.abs(dx) + Math.abs(dy);
    if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      if (drag.d) cam.r = Math.max(0.8, Math.min(14, cam.r * (drag.d / d)));
      drag.d = d;
    } else if (drag.button === 2 || drag.shift) {
      const k = cam.r * 0.0016, right = new T.Vector3(), up = new T.Vector3();
      camera.matrix.extractBasis(right, up, new T.Vector3());
      cam.t.addScaledVector(right, -dx * k).addScaledVector(up, dy * k);
    } else {
      cam.az -= dx * 0.008;
      cam.pol = Math.max(0.05, Math.min(Math.PI - 0.05, cam.pol - dy * 0.008));
    }
    dirty = true;
  };
  const onUp = (e) => {
    ptrs.delete(e.pointerId);
    if (drag && drag.moved < 6 && ptrs.size === 0) { const o = pick(e.clientX, e.clientY); if (o && o !== view) cb.onView(o); }
    if (ptrs.size === 0) drag = null;
  };
  const onWheel = (e) => { e.preventDefault(); cam.r = Math.max(0.8, Math.min(14, cam.r * Math.pow(1.0015, e.deltaY))); tween = null; dirty = true; };
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  canvas.addEventListener("wheel", onWheel, { passive: false });
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  canvas.addEventListener("dblclick", () => setView(view));
  canvas.style.cursor = "grab";

  const hl = new T.Color(C.air), black = new T.Color(0);
  function highlight() {
    for (const list of Object.values(groups)) for (const m of list) {
      if (!m.material.emissive || m.material.side === T.BackSide || m === glow) continue;
      m.material.emissive.copy(m.userData.organ && m.userData.organ === hoverOrgan ? hl : black);
      m.material.emissiveIntensity = 0.35;
    }
    dirty = true;
  }

  // ---------- маркеры ----------
  const layer = document.createElement("div"); layer.className = "marks";
  const lines = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  lines.setAttribute("class", "marks"); lines.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none";
  host.appendChild(lines); host.appendChild(layer);
  let items = [];
  function buildMarkers() {
    layer.innerHTML = ""; lines.innerHTML = ""; items = [];
    marksReady = true; compact = isCompact();
    if (compact) {
      for (const hs of HOTSPOTS) {
        const el = document.createElement("div"), b = document.createElement("button");
        el.className = "mk"; el.style.setProperty("--k", `var(${KCOLOR[hs.o]})`);
        b.className = "gh"; b.textContent = `${L(...hs.t)} · ${MAKHARIJ.filter((m) => m.organ === hs.o).reduce((a, m) => a + m.letters.length, 0)}`;
        b.addEventListener("click", () => cb.onView(hs.o));
        el.appendChild(b); layer.appendChild(el);
        const off = hs.o === "teeth" || hs.o === "lips" ? [-40, 0] : hs.o === "jawf" ? [12, 0] : null;
        items.push({ el, d: { off }, line: null, v: new T.Vector3(X(hs.at[0]), Y(hs.at[1]), 0), to: null });
      }
      dirty = true;
      return;
    }
    const defs = CUSTOM[view] || (MARKS[view] || []).map((m) => ({ mk: m.mk, only: m.only, ghost: m.ghost, p: [X(m.at[0]), Y(m.at[1]), 0], to: m.to ? [X(m.to[0]), Y(m.to[1]), 0] : null }));
    for (const d of defs) {
      const M = MAKHRAJ_BY_ID[d.mk], el = document.createElement("div");
      el.className = "mk" + (view === "overview" ? " sm" : " big");
      el.style.setProperty("--k", `var(${KCOLOR[M.organ]})`);
      if (d.ghost) el.style.opacity = ".55";
      for (const k of d.only || M.letters) {
        const Lt = LETTER_BY_KEY[k], b = document.createElement("button");
        b.textContent = Lt.disp || Lt.ch; b.setAttribute("aria-label", Lt.name); b.dataset.k = k;
        if (k === "ghunna") b.className = "gh";
        else if (TALL.test(Lt.disp || "")) b.className = "tall";
        b.addEventListener("click", () => cb.onSelect(k));
        b.addEventListener("pointerenter", () => { const r = b.getBoundingClientRect(), s = host.getBoundingClientRect(); cb.onTip(k, r.left + r.width / 2 - s.left, r.top - s.top); });
        b.addEventListener("pointerleave", () => cb.onTip(null));
        el.appendChild(b);
      }
      layer.appendChild(el);
      let line = null;
      if (d.to || d.off) { line = document.createElementNS("http://www.w3.org/2000/svg", "line"); line.setAttribute("style", "stroke:var(--ink-3);stroke-width:1;opacity:.75"); lines.appendChild(line); }
      items.push({ el, d, line, v: new T.Vector3(...d.p), to: d.to ? new T.Vector3(...d.to) : null });
    }
    markSel();
    dirty = true;
  }
  function markSel() { layer.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.k === sel)); }
  const proj = (v, w, h) => { const p = v.clone().project(camera); return [(p.x + 1) / 2 * w, (1 - p.y) / 2 * h, p.z < 1 && p.z > -1]; };
  function placeMarkers() {
    const w = host.clientWidth, h = host.clientHeight;
    const hide = !!tween && tween.cross;
    for (const it of items) {
      const [ax, ay, ok] = proj(it.v, w, h);
      let x = ax, y = ay;
      if (it.d.off) { x += it.d.off[0]; y += it.d.off[1]; }
      it.el.style.left = x + "px"; it.el.style.top = y + "px";
      it.el.classList.toggle("hide", !ok || hide);
      if (it.line) {
        const [tx, ty] = it.to ? proj(it.to, w, h) : [ax, ay];
        it.line.setAttribute("x1", x); it.line.setAttribute("y1", y); it.line.setAttribute("x2", tx); it.line.setAttribute("y2", ty);
        it.line.style.display = !ok || hide ? "none" : "";
      }
    }
  }

  // ---------- переходы ----------
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  function setView(v, instant) {
    const target = VIEWS3[v] || VIEWS3.overview;
    const from = { t: cam.t.clone(), r: cam.r, az: cam.az, pol: cam.pol, vis: { ...vis } };
    let daz = target.az - from.az;
    daz = ((daz + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
    view = v; buildMarkers();
    tween = { t0: performance.now(), dur: instant ? 1 : 1300, from, to: { ...target, az: from.az + daz }, cross: v !== "overview" || from.r < 6, vis: VIS[v] || VIS.overview };
  }
  function applyVis() {
    // Плоскость разреза уходит вперёд, пока модель «собирается» целиком, и возвращается обратно.
    look.clip.constant = vis.cut * 2.6;
    look.capOn.value = vis.cut < 0.99 ? 1 : 0;
    for (const [g, list] of Object.entries(groups)) for (const m of list) {
      const o = Math.min(1, m.userData.base * (vis[g] ?? 1));
      m.material.opacity = o; m.material.depthWrite = o > 0.95 && g !== "glow"; m.visible = o > 0.01;
    }
  }

  let raf = 0, last = performance.now();
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (tween) {
      const k = Math.min(1, (now - tween.t0) / tween.dur), e = ease(k);
      cam.t.lerpVectors(tween.from.t, new T.Vector3(...tween.to.t), e);
      cam.r = tween.from.r + (tween.to.r - tween.from.r) * e;
      cam.az = tween.from.az + (tween.to.az - tween.from.az) * e;
      cam.pol = tween.from.pol + (tween.to.pol - tween.from.pol) * e;
      for (const g of Object.keys(ALL)) vis[g] = tween.from.vis[g] + ((tween.vis[g] ?? 1) - tween.from.vis[g]) * e;
      applyVis(); dirty = true;
      if (k >= 1) { tween = null; placeMarkers(); }
    }
    const fl = [[flowJ, view === "jawf"], [flowN, view === "nose"]];
    for (const [f, on] of fl) {
      const target = on ? 0.9 : 0;
      if (Math.abs(f.p.material.opacity - target) > 0.01 || on) {
        f.p.material.opacity += (target - f.p.material.opacity) * Math.min(1, dt * 4);
        for (let i = 0; i < f.N; i++) { const p = f.curve.getPointAt((now / 1000 * 0.16 + i / f.N) % 1); f.arr[i * 3] = p.x; f.arr[i * 3 + 1] = p.y; f.arr[i * 3 + 2] = p.z + Math.sin(i * 7.3) * 0.05; }
        f.geo.attributes.position.needsUpdate = true; dirty = true;
      }
    }
    if (!dirty || document.hidden) return;
    applyCam(); renderer.render(scene, camera); placeMarkers(); dirty = false;
  }
  applyVis(); applyCam(); buildMarkers(); raf = requestAnimationFrame(frame);

  const recolor = () => { C.air = css("--lapis"); hl.set(C.air); glowMat.color.set(C.air); flowJ.p.material.color.set(C.air); flowN.p.material.color.set(css("--k-nun")); dirty = true; };
  const mo = new MutationObserver(recolor); mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  return {
    setView: (v, instant) => setView(v, instant),
    setSel: (k) => { sel = k; markSel(); },
    destroy() {
      cancelAnimationFrame(raf); ro.disconnect(); mo.disconnect();
      new Set(disposables).forEach((d) => d?.dispose?.()); look.dispose(); renderer.dispose();
      canvas.remove(); layer.remove(); lines.remove();
    },
  };
}
