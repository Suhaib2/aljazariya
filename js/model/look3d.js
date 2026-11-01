// Освещение и материалы 3D-модели. Модель рассечена по средней линии, как анатомический муляж:
// плоскость clip отсекает ближнюю половину, а внутренняя сторона каждого тела заливается цветом
// его среза. Полости (рот, нос, глотка) показывают свои стенки изнутри и темнеют вглубь.
export const COL = {
  skin: "#dfae92", skinCut: "#d99a86", bone: "#ece2cb", boneCut: "#e6d5ae", brain: "#e5c0b8", brainCut: "#e2bdb3",
  cord: "#efdcc0", disc: "#c9d4da", cart: "#d8e1e5", cartCut: "#e1e8ea", mucosa: "#d27279", mucosaCut: "#c0656b",
  tongue: "#c4555f", tongueCut: "#a7434c", lip: "#bd5f62", lipCut: "#ad5157", tooth: "#f3eee1", toothCut: "#ecdfc2",
  gum: "#df858a", gumCut: "#cc7075", cavity: "#7b3940", nasal: "#8a464c", muscle: "#b8575a",
};

// Прозрачный двусторонний материал Three.js рисует изнанку отдельным проходом с FLIP_SIDED,
// и тогда изнанка считается «лицевой» — учитываем это.
const CAP = `#include <output_fragment>
#ifdef FLIP_SIDED
bool jzBack = gl_FrontFacing;
#else
bool jzBack = !gl_FrontFacing;
#endif
if (jzBack) {
  if (uCapOn < 0.5) discard;
  float n = fract(sin(dot(floor(vWP * 90.0), vec3(12.9898, 78.233, 37.719))) * 43758.5453);
  float f = 0.5 + 0.5 * sin(vWP.x * 55.0 + sin(vWP.y * 21.0) * 2.0);
  gl_FragColor = vec4(uCap * (0.92 + 0.05 * n + 0.04 * f), gl_FragColor.a);
}`;
const CAV = `#include <output_fragment>
gl_FragColor.rgb *= mix(1.0, 0.3, smoothstep(0.02, 0.75, -vWP.z));`;

function noiseTex(T, { dots = 1600, r = [0.8, 2.2], lines = 0, rep = [4, 4] } = {}) {
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = "#808080"; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < dots; i++) {
    const v = 140 + Math.random() * 90 | 0;
    g.fillStyle = `rgb(${v},${v},${v})`;
    g.beginPath(); g.arc(Math.random() * 256, Math.random() * 256, r[0] + Math.random() * (r[1] - r[0]), 0, 7); g.fill();
  }
  g.strokeStyle = "rgba(60,60,60,.5)";
  for (let i = 0; i < lines; i++) { const x = Math.random() * 256; g.lineWidth = 0.6 + Math.random(); g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (Math.random() - 0.5) * 20, 256); g.stroke(); }
  const t = new T.CanvasTexture(c);
  t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(...rep);
  return t;
}

function envMap(T, renderer) {
  const s = new T.Scene();
  const geo = new T.SphereGeometry(10, 32, 16), pos = geo.attributes.position, col = [];
  for (let i = 0; i < pos.count; i++) { const y = pos.getY(i) / 10, k = 0.18 + 0.5 * Math.max(0, y) + 0.06 * Math.max(0, -y); col.push(k * 1.05, k, k * 0.95); }
  geo.setAttribute("color", new T.Float32BufferAttribute(col, 3));
  s.add(new T.Mesh(geo, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide })));
  for (const [w, h, x, y, z, k] of [[7, 5, 4, 6, 7, 4], [5, 3, -7, 2, 3, 1.8], [5, 6, 1, 3, -8, 1.3], [8, 2, 0, -6, 2, 0.5]]) {
    const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(k, k, k * 0.96), side: T.DoubleSide }));
    m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m);
  }
  const pm = new T.PMREMGenerator(renderer);
  const tex = pm.fromScene(s, 0.035).texture;
  pm.dispose(); s.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); });
  return tex;
}

export function makeLook(T, renderer) {
  if (T.ColorManagement) T.ColorManagement.legacyMode = false;
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.physicallyCorrectLights = true;
  renderer.localClippingEnabled = true;
  // Плоскость разреза: остаётся всё, что не ближе к зрителю, чем z = clip.constant.
  const clip = new T.Plane(new T.Vector3(0, 0, -1), 0);
  const capOn = { value: 1 };
  const owned = [];
  const capify = (m, cap, cavity) => {
    const capCol = new T.Color(cap);
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uCap = { value: capCol }; sh.uniforms.uCapOn = capOn;
      sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vWP;")
        .replace("#include <project_vertex>", "#include <project_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;");
      sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec3 vWP;\nuniform vec3 uCap;\nuniform float uCapOn;")
        .replace("#include <output_fragment>", cavity ? CAV : CAP);
    };
    m.customProgramCacheKey = () => (cavity ? "jz-cav" : "jz-cap");
    owned.push(m);
    return m;
  };
  // Ткань: лицевая сторона — поверхность, изнанка — срез.
  const tissue = (color, cap, o = {}) => capify(new T.MeshPhysicalMaterial({ color: new T.Color(color), roughness: 0.5, metalness: 0, side: T.DoubleSide, transparent: true, clippingPlanes: [clip], ...o }), cap, false);
  // Полость: видна только изнутри, влажные стенки темнеют вглубь.
  const cavity = (color, o = {}) => capify(new T.MeshPhysicalMaterial({ color: new T.Color(color), roughness: 0.4, clearcoat: 0.7, clearcoatRoughness: 0.25, side: T.BackSide, transparent: true, clippingPlanes: [clip], ...o }), color, true);
  const tex = { papillae: noiseTex(T, { dots: 2600, r: [0.7, 1.8], rep: [5, 3] }), pores: noiseTex(T, { dots: 900, r: [0.4, 1.1], rep: [14, 10] }), lip: noiseTex(T, { dots: 200, lines: 70, rep: [3, 1] }) };
  const env = envMap(T, renderer);
  return {
    clip, capOn, env, tissue, cavity, tex,
    dispose() { owned.forEach((m) => m.dispose()); Object.values(tex).forEach((t) => t.dispose()); env.dispose(); },
  };
}
