// Ciel nocturne : satellites et étoiles filantes animés par-dessus une vraie photo.
// Si la photo manque, le ciel entier (Voie lactée, étoiles, relief) est généré.

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;

// --- Bruit procédural (value noise + fbm) ---------------------------------
function makeNoise(seed) {
  const p = new Uint8Array(512);
  let s = seed >>> 0;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const perm = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; }
  for (let i = 0; i < 512; i++) p[i] = perm[i & 255];
  const val = new Float32Array(256).map(() => rnd());
  const fade = (t) => t * t * (3 - 2 * t);
  function n2(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const X = xi & 255, Y = yi & 255;
    const a = val[p[p[X] + Y]], b = val[p[p[X + 1] + Y]];
    const c = val[p[p[X] + Y + 1]], d = val[p[p[X + 1] + Y + 1]];
    const u = fade(xf), v = fade(yf);
    return lerp(lerp(a, b, u), lerp(c, d, u), v);
  }
  return function fbm(x, y, oct = 5) {
    let sum = 0, amp = 0.5, f = 1, norm = 0;
    for (let i = 0; i < oct; i++) { sum += amp * n2(x * f, y * f); norm += amp; amp *= 0.5; f *= 2.03; }
    return sum / norm;
  };
}

// Couleur d'une étoile selon sa température (approximation réaliste)
function starColor(r) {
  if (r < 0.08) return [255, 190, 150];   // M/K, orangées
  if (r < 0.25) return [255, 222, 190];   // K
  if (r < 0.55) return [255, 244, 232];   // G/F
  if (r < 0.85) return [236, 242, 255];   // A
  return [205, 220, 255];                 // B, bleutées
}

// photo : <img> de fond (vraie photo). Si elle charge, on ne dessine que les
// satellites et les étoiles filantes par-dessus ; sinon on génère tout le ciel.
export function startSky(canvas, photo) {
  const ctx = canvas.getContext('2d');
  let photoMode = !!(photo && photo.complete && photo.naturalWidth);
  const skyLimit = parseFloat(photo?.dataset.sky || '0.5');   // part haute de la photo occupée par le ciel
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dim = parseFloat(canvas.dataset.dim || '1');
  const fbm = makeNoise(1337);
  const fbm2 = makeNoise(4242);

  let W, H, dpr, horizon, skyLayer, groundLayer, stars = [];
  let sats = [], meteors = [];
  let lastSpawn = 0, nextTrain = 90000 + Math.random() * 120000;
  let scrollFade = 1, groundShift = 0;


  function rand(a, b) { return a + Math.random() * (b - a); }

  // --- Couche statique : ciel, Voie lactée, étoiles faibles ---------------
  function buildSky() {
    skyLayer = document.createElement('canvas');
    skyLayer.width = W; skyLayer.height = H;
    const g = skyLayer.getContext('2d');

    const grad = g.createLinearGradient(0, 0, 0, horizon);
    grad.addColorStop(0, '#010208');
    grad.addColorStop(0.55, '#040917');
    grad.addColorStop(0.85, '#0b1428');
    grad.addColorStop(1, '#1d2236');
    g.fillStyle = grad; g.fillRect(0, 0, W, H);
    // halo de pollution lumineuse au ras de l'horizon (ville lointaine)
    const glow = g.createRadialGradient(W * 0.22, horizon, 0, W * 0.22, horizon, W * 0.55);
    glow.addColorStop(0, 'rgba(120, 92, 80, 0.22)');
    glow.addColorStop(1, 'rgba(120, 92, 80, 0)');
    g.fillStyle = glow; g.fillRect(0, 0, W, H);

    // Voie lactée calculée en basse résolution puis agrandie (flou naturel)
    const S = 3 * dpr;
    const w = Math.ceil(W / S), h = Math.ceil(horizon / S);
    const img = new ImageData(w, h);
    // axe de la bande : une diagonale qui traverse le ciel
    const ax = W * 0.05, ay = horizon * 1.05, bx = W * 0.95, by = -horizon * 0.35;
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy);
    const nx = -dy / len, ny = dx / len;
    const width = Math.min(W, H) * 0.16;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const px = x * S, py = y * S;
        const along = ((px - ax) * dx + (py - ay) * dy) / (len * len);
        const wob = (fbm2(along * 3, 0.5) - 0.5) * width * 0.9;
        const d = (px - ax) * nx + (py - ay) * ny + wob;
        const core = Math.exp(-((d / width) ** 2));
        const halo = Math.exp(-((d / (width * 2.4)) ** 2));
        const cloud = fbm(px / 140, py / 140, 6);
        const fine = fbm(px / 38 + 9, py / 38 - 3, 4);
        // poussières sombres le long du centre de la bande
        const dust = clamp((fbm2(px / 90, py / 90, 5) - 0.42) * 3.2, 0, 1) * Math.exp(-((d / (width * 0.45)) ** 2));
        // le cœur galactique est plus brillant d'un côté
        const bulge = 0.55 + 0.75 * Math.exp(-(((along - 0.3) / 0.22) ** 2));
        let I = (core * (0.55 * cloud + 0.45 * fine) * 1.25 + halo * 0.22 * cloud) * bulge;
        I *= 1 - 0.85 * dust;
        // l'extinction atmosphérique atténue la bande près de l'horizon
        I *= clamp(py / horizon < 0.92 ? 1 : (1 - py / horizon) * 12.5, 0, 1);
        const warm = Math.exp(-(((along - 0.3) / 0.18) ** 2)) * core;
        const i = (y * w + x) * 4;
        img.data[i] = 150 + 90 * warm;
        img.data[i + 1] = 165 + 50 * warm;
        img.data[i + 2] = 205 - 30 * warm;
        img.data[i + 3] = clamp(I * 0.5, 0, 1) * 255;
      }
    }
    const tmp = document.createElement('canvas'); tmp.width = w; tmp.height = h;
    tmp.getContext('2d').putImageData(img, 0, 0);
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.globalCompositeOperation = 'screen';
    g.drawImage(tmp, 0, 0, W, horizon);

    // Étoiles faibles : beaucoup plus nombreuses dans la bande
    g.globalCompositeOperation = 'lighter';
    const count = Math.round((W * horizon) / (dpr * dpr) / 90);
    for (let k = 0; k < count; k++) {
      let x = Math.random() * W, y = Math.random() * horizon;
      const along = ((x - ax) * dx + (y - ay) * dy) / (len * len);
      const d = (x - ax) * nx + (y - ay) * ny;
      if (Math.random() > 0.35 + 0.65 * Math.exp(-((d / (width * 1.3)) ** 2))) continue;
      const m = Math.random() ** 3;   // distribution en magnitude : surtout des étoiles très faibles
      const [r, gg, b] = starColor(Math.random());
      const ext = clamp((horizon - y) / (horizon * 0.12), 0.15, 1);
      g.fillStyle = `rgba(${r},${gg},${b},${(0.12 + 0.6 * m) * ext})`;
      const s = (0.35 + 0.8 * m) * dpr;
      g.fillRect(x, y, s, s);
    }
    g.globalCompositeOperation = 'source-over';
  }

  // --- Sol : relief en silhouette ----------------------------------------
  function ridge(seed, base, amp, scale) {
    const n = makeNoise(seed), pts = [];
    for (let x = 0; x <= W; x += 4 * dpr) pts.push([x, base - amp * n(x / scale, seed % 7, 5)]);
    return pts;
  }
  function buildGround() {
    groundLayer = document.createElement('canvas');
    groundLayer.width = W; groundLayer.height = H;
    const g = groundLayer.getContext('2d');
    const layers = [
      { pts: ridge(11, horizon + 2 * dpr, H * 0.05, 260 * dpr), fill: '#0b101c' },
      { pts: ridge(23, horizon + H * 0.045, H * 0.06, 180 * dpr), fill: '#06090f' },
      { pts: ridge(37, horizon + H * 0.09, H * 0.03, 120 * dpr), fill: '#020305' },
    ];
    for (const L of layers) {
      g.beginPath(); g.moveTo(0, H);
      for (const [x, y] of L.pts) g.lineTo(x, y);
      g.lineTo(W, H); g.closePath(); g.fillStyle = L.fill; g.fill();
    }
    // brume légère au pied des collines lointaines
    const haze = g.createLinearGradient(0, horizon - H * 0.03, 0, horizon + H * 0.06);
    haze.addColorStop(0, 'rgba(40,52,78,0)');
    haze.addColorStop(0.5, 'rgba(40,52,78,0.18)');
    haze.addColorStop(1, 'rgba(40,52,78,0)');
    g.fillStyle = haze; g.fillRect(0, horizon - H * 0.03, W, H * 0.09);
  }

  // --- Étoiles brillantes animées (scintillation) -------------------------
  function buildStars() {
    stars = [];
    const n = Math.round((W * horizon) / (dpr * dpr) / 5000);
    for (let i = 0; i < n; i++) {
      const m = Math.random() ** 2.2;
      stars.push({
        x: Math.random() * W, y: Math.random() * horizon * 0.96,
        m, c: starColor(Math.random()), ph: Math.random() * TAU, sp: rand(0.6, 2.2),
      });
    }
  }

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = canvas.width = Math.round(innerWidth * dpr);
    H = canvas.height = Math.round(innerHeight * dpr);
    canvas.style.width = innerWidth + 'px'; canvas.style.height = innerHeight + 'px';
    horizon = Math.round(H * (photoMode ? skyLimit : innerWidth < 700 ? 0.74 : 0.7));
    buildSky(); buildGround(); buildStars();
  }

  // --- Satellites ---------------------------------------------------------
  function spawnSat(now, opts = {}) {
    // trajectoire rectiligne qui traverse une partie du ciel
    const fromLeft = Math.random() < 0.5;
    const y0 = rand(0.05, 0.8) * horizon, y1 = rand(0.0, 0.85) * horizon;
    const x0 = fromLeft ? -20 * dpr : W + 20 * dpr, x1 = fromLeft ? W + 20 * dpr : -20 * dpr;
    const dur = opts.dur || rand(28000, 75000);
    const mag = opts.mag ?? Math.random() ** 1.6;
    sats.push({
      x0, y0, x1, y1, t0: now, dur, mag,
      // certains entrent dans l'ombre de la Terre en cours de route
      shadow: Math.random() < 0.35 ? rand(0.35, 0.8) : 2,
      flare: Math.random() < 0.12 ? rand(0.25, 0.75) : -1,
      delay: opts.delay || 0,
      id: 'NORAD ' + Math.floor(rand(20000, 61000)),
    });
  }
  function spawnTrain(now) {
    // un « train » Starlink fraîchement lancé : points alignés qui se suivent
    const dur = rand(40000, 60000), mag = 0.35;
    const fromLeft = Math.random() < 0.5;
    const y0 = rand(0.2, 0.6) * horizon, y1 = rand(0.1, 0.5) * horizon;
    for (let i = 0; i < 18; i++) {
      sats.push({
        x0: fromLeft ? -20 * dpr : W + 20 * dpr, y0, x1: fromLeft ? W + 20 * dpr : -20 * dpr, y1,
        t0: now + i * 900, dur, mag: mag * rand(0.7, 1.1), shadow: 2, flare: -1, delay: 0, id: 'STARLINK-' + Math.floor(rand(3000, 9000)),
      });
    }
  }
  function satPos(s, now) {
    const t = (now - s.t0) / s.dur;
    return { t, x: lerp(s.x0, s.x1, t), y: lerp(s.y0, s.y1, t) };
  }

  let last = performance.now(), running = true;

  function frame(now) {
    const dt = Math.min(100, now - last); last = now;
    ctx.globalAlpha = 1;
    if (photoMode) ctx.clearRect(0, 0, W, H);
    else ctx.drawImage(skyLayer, 0, 0);

    // étoiles brillantes : scintillation plus forte près de l'horizon
    if (!photoMode) for (const s of stars) {
      const turb = 0.08 + 0.35 * (s.y / horizon) ** 3;
      const a = (0.35 + 0.65 * s.m) * (1 - turb + turb * Math.sin(s.ph + now * 0.001 * s.sp * 3));
      const size = (0.6 + 1.5 * s.m) * dpr;
      ctx.fillStyle = `rgba(${s.c[0]},${s.c[1]},${s.c[2]},${a})`;
      ctx.beginPath(); ctx.arc(s.x, s.y, size * 0.6, 0, TAU); ctx.fill();
      if (s.m > 0.75) {
        const gr = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, size * 4);
        gr.addColorStop(0, `rgba(${s.c[0]},${s.c[1]},${s.c[2]},${a * 0.25})`);
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(s.x, s.y, size * 4, 0, TAU); ctx.fill();
      }
    }

    // apparition des satellites
    if (now - lastSpawn > 6000 && sats.length < 7) { spawnSat(now); lastSpawn = now + rand(-2000, 4000); }
    if (now > nextTrain) { spawnTrain(now); nextTrain = now + rand(150000, 260000); }
    sats = sats.filter((s) => now - s.t0 < s.dur);
    for (const s of sats) {
      const p = satPos(s, now);
      if (p.t < 0) continue;
      let a = 0.25 + 0.7 * s.mag;
      a *= clamp(p.t / 0.08, 0, 1) * clamp((1 - p.t) / 0.08, 0, 1);
      if (p.t > s.shadow) a *= clamp(1 - (p.t - s.shadow) / 0.05, 0, 1);       // entrée dans l'ombre
      let size = (0.8 + 0.9 * s.mag) * dpr;
      if (s.flare > 0) { const fl = Math.exp(-(((p.t - s.flare) / 0.012) ** 2)); a = Math.min(1, a + fl); size += fl * 2.5 * dpr; }
      if (a <= 0.01 || p.y > horizon) continue;
      const gr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 3.5);
      gr.addColorStop(0, `rgba(255,250,240,${a})`);
      gr.addColorStop(0.3, `rgba(255,245,230,${a * 0.35})`);
      gr.addColorStop(1, 'rgba(255,245,230,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(p.x, p.y, size * 3.5, 0, TAU); ctx.fill();
    }

    // étoiles filantes, rares
    if (Math.random() < dt / 45000) {
      meteors.push({ x: rand(0.1, 0.9) * W, y: rand(0.05, 0.4) * horizon, a: rand(0.35, 0.6) * Math.PI, t0: now, d: rand(500, 900), l: rand(80, 180) * dpr });
    }
    meteors = meteors.filter((m) => now - m.t0 < m.d);
    for (const m of meteors) {
      const t = (now - m.t0) / m.d, hx = m.x + Math.cos(m.a) * m.l * t, hy = m.y + Math.sin(m.a) * m.l * t;
      const tail = ctx.createLinearGradient(hx, hy, hx - Math.cos(m.a) * m.l * 0.5, hy - Math.sin(m.a) * m.l * 0.5);
      tail.addColorStop(0, `rgba(235,240,255,${0.8 * Math.sin(Math.PI * t)})`);
      tail.addColorStop(1, 'rgba(235,240,255,0)');
      ctx.strokeStyle = tail; ctx.lineWidth = 1.3 * dpr;
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx - Math.cos(m.a) * m.l * 0.5, hy - Math.sin(m.a) * m.l * 0.5); ctx.stroke();
    }

    if (!photoMode) ctx.drawImage(groundLayer, 0, groundShift);

    if (running && !reduce) requestAnimationFrame(frame);
  }

  function onScroll() {
    const t = clamp(scrollY / (innerHeight * 1.1), 0, 1);
    scrollFade = 1 - 0.72 * t;
    groundShift = t * H * 0.35;            // le sol s'enfonce : on lève les yeux vers le ciel
    canvas.style.opacity = String(scrollFade * dim);
    if (photo) {
      photo.style.opacity = String(scrollFade * dim);
      photo.style.transform = `translateY(${t * 6}vh) scale(1.06)`;   // léger parallaxe
    }
    if (reduce) frame(performance.now());
  }

  if (photo && photo.complete && !photo.naturalWidth) { photo.remove(); photo = null; }
  if (photo && !photoMode) {
    photo.addEventListener('load', () => { photoMode = true; resize(); }, { once: true });
    photo.addEventListener('error', () => { photo.remove(); }, { once: true });
  }
  resize(); onScroll();
  // préchauffage : quelques satellites déjà en vol à l'arrivée
  const t0 = performance.now();
  for (let i = 0; i < 3; i++) spawnSat(t0 - rand(5000, 25000));
  requestAnimationFrame(frame);

  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { resize(); if (reduce) frame(performance.now()); }, 200); });
  addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('visibilitychange', () => {
    const was = running; running = !document.hidden;
    if (running && !was && !reduce) { last = performance.now(); requestAnimationFrame(frame); }
  });
}
