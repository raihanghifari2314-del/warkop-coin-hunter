/* =========================================================
   game.js — core gameplay: engine canvas, gerakan karakter,
   pengambilan koin, map warkop, siang/malam + ambiance.
   Tidak butuh internet (offline mode).
   ========================================================= */
window.Game = (function () {
  let canvas, ctx, W, H;
  let raf = null, lastT = 0;
  let running = false;

  // dunia logis (koordinat) -> digambar diskalakan ke ukuran canvas
  const WORLD = { w: 960, h: 540 };

  const player = { x: 480, y: 360, r: 16, speed: 230, dx: 0, dy: 0, face: 1 };
  const keys = {};
  let coins = [];        // koin aktif di map
  let particles = [];
  let timeOfDay = "day"; // day | night
  let season = "default";
  let reduceFx = false;

  // callback ke luar (ui/main)
  let onPickup = () => {};

  /* ---------------- Setup ---------------- */
  function init(canvasEl, opts = {}) {
    canvas = canvasEl;
    ctx = canvas.getContext("2d");
    W = canvas.width; H = canvas.height;
    onPickup = opts.onPickup || onPickup;
    bindInput();
    spawnInitialCoins();
  }

  function setTime(t) { timeOfDay = t; }
  function getTime() { return timeOfDay; }
  function setSeason(s) { season = s; }
  function setReduceFx(v) { reduceFx = v; }

  /* ---------------- Input ---------------- */
  function bindInput() {
    window.addEventListener("keydown", (e) => {
      if (!running) return;
      const k = e.key.toLowerCase();
      if (["arrowup","w","arrowdown","s","arrowleft","a","arrowright","d"].includes(k)) {
        keys[k] = true; e.preventDefault();
      }
    });
    window.addEventListener("keyup", (e) => { keys[e.key.toLowerCase()] = false; });

    // Pointer / touch: gerak menuju titik sentuh
    let dragging = false;
    const toWorld = (clientX, clientY) => {
      const rect = canvas.getBoundingClientRect();
      const x = (clientX - rect.left) / rect.width * WORLD.w;
      const y = (clientY - rect.top) / rect.height * WORLD.h;
      return { x, y };
    };
    const moveTo = (clientX, clientY) => {
      const p = toWorld(clientX, clientY);
      player.targetX = p.x; player.targetY = p.y;
    };
    canvas.addEventListener("pointerdown", (e) => { dragging = true; moveTo(e.clientX, e.clientY); });
    canvas.addEventListener("pointermove", (e) => { if (dragging) moveTo(e.clientX, e.clientY); });
    window.addEventListener("pointerup", () => { dragging = false; player.targetX = null; player.targetY = null; });

    // D-pad mobile
    document.querySelectorAll(".pad__btn").forEach((btn) => {
      const dir = btn.dataset.dir;
      const map = { up: "w", down: "s", left: "a", right: "d" };
      const set = (v) => { keys[map[dir]] = v; };
      btn.addEventListener("pointerdown", (e) => { e.preventDefault(); set(true); });
      btn.addEventListener("pointerup", () => set(false));
      btn.addEventListener("pointerleave", () => set(false));
    });
  }

  /* ---------------- Koin spawning ---------------- */
  const SPAWN_TABLE = [
    { id: "sen",     w: 36 },
    { id: "gobang",  w: 26 },
    { id: "ketip",   w: 16 },
    { id: "benggol", w: 12 },
    { id: "ringgit", w: 6 },
    { id: "mystery", w: 4 },
  ];
  function pickCoinId() {
    const total = SPAWN_TABLE.reduce((a, b) => a + b.w, 0);
    let r = Math.random() * total;
    for (const row of SPAWN_TABLE) { if ((r -= row.w) <= 0) return row.id; }
    return "sen";
  }
  function spawnCoin() {
    const id = pickCoinId();
    const def = DATA.coinById(id);
    coins.push({
      id, def,
      x: 60 + Math.random() * (WORLD.w - 120),
      y: 120 + Math.random() * (WORLD.h - 180),
      r: id === "mystery" ? 15 : 12,
      bob: Math.random() * Math.PI * 2,
    });
  }
  function spawnInitialCoins() {
    coins = [];
    for (let i = 0; i < 7; i++) spawnCoin();
  }

  /* ---------------- Loop ---------------- */
  function start() {
    running = true;
    lastT = performance.now();
    if (!raf) raf = requestAnimationFrame(loop);
  }
  function stop() {
    running = false;
    if (raf) { cancelAnimationFrame(raf); raf = null; }
  }
  function loop(t) {
    const dt = Math.min(0.05, (t - lastT) / 1000);
    lastT = t;
    if (running) { update(dt); render(); }
    raf = requestAnimationFrame(loop);
  }

  function update(dt) {
    // input arah
    let ix = 0, iy = 0;
    if (keys["w"] || keys["arrowup"]) iy -= 1;
    if (keys["s"] || keys["arrowdown"]) iy += 1;
    if (keys["a"] || keys["arrowleft"]) ix -= 1;
    if (keys["d"] || keys["arrowright"]) ix += 1;

    // target pointer
    if (player.targetX != null) {
      const tx = player.targetX - player.x, ty = player.targetY - player.y;
      const d = Math.hypot(tx, ty);
      if (d > 4) { ix = tx / d; iy = ty / d; }
    }

    const len = Math.hypot(ix, iy) || 1;
    player.x += (ix / len) * player.speed * dt;
    player.y += (iy / len) * player.speed * dt;
    if (ix !== 0) player.face = ix > 0 ? 1 : -1;

    // batas map (area dalam warkop)
    player.x = Math.max(40, Math.min(WORLD.w - 40, player.x));
    player.y = Math.max(100, Math.min(WORLD.h - 40, player.y));

    // pickup
    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i];
      c.bob += dt * 4;
      if (Math.hypot(c.x - player.x, c.y - player.y) < player.r + c.r + 6) {
        coins.splice(i, 1);
        burst(c.x, c.y, c.def.color);
        onPickup(c.def);
        setTimeout(spawnCoin, 400 + Math.random() * 1200);
      }
    }
    // jaga minimal koin
    if (coins.length < 5 && Math.random() < 0.02) spawnCoin();

    // particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }

  function burst(x, y, color) {
    if (reduceFx) return;
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * Math.PI * 2, s = 60 + Math.random() * 120;
      particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, life: .5 + Math.random() * .3, color });
    }
  }

  /* ---------------- Render ---------------- */
  function render() {
    const sx = W / WORLD.w, sy = H / WORLD.h;
    ctx.save();
    ctx.scale(sx, sy);
    drawRoom();
    drawCoins();
    drawPlayer();
    drawParticles();
    drawAmbiance();
    ctx.restore();
  }

  function drawRoom() {
    const night = timeOfDay === "night";
    // lantai
    const floor = night ? "#2a2018" : "#4a382a";
    ctx.fillStyle = floor;
    ctx.fillRect(0, 0, WORLD.w, WORLD.h);
    // ubin
    ctx.strokeStyle = night ? "rgba(255,255,255,.04)" : "rgba(0,0,0,.12)";
    ctx.lineWidth = 2;
    for (let x = 0; x <= WORLD.w; x += 60) { ctx.beginPath(); ctx.moveTo(x, 90); ctx.lineTo(x, WORLD.h); ctx.stroke(); }
    for (let y = 90; y <= WORLD.h; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WORLD.w, y); ctx.stroke(); }

    // dinding atas + rak
    const wall = night ? "#1d1610" : "#6b4a30";
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, WORLD.w, 90);
    // papan nama warkop
    ctx.fillStyle = night ? "#3a2a1e" : "#8a5a35";
    ctx.fillRect(WORLD.w / 2 - 150, 18, 300, 48);
    ctx.fillStyle = DATA.SEASONS[season] ? "#ffcf6b" : "#ffcf6b";
    ctx.font = "bold 26px 'Baloo 2', sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("☕ WARKOP KITA", WORLD.w / 2, 42);

    // meja counter kiri
    ctx.fillStyle = night ? "#3a2a1e" : "#5a3d28";
    ctx.fillRect(60, 110, 180, 60);
    ctx.fillStyle = "#2e2016";
    ctx.fillRect(60, 170, 180, 10);
    // mesin kopi di counter
    ctx.font = "28px sans-serif"; ctx.fillText("☕", 100, 140); ctx.fillText("🫖", 150, 140); ctx.fillText("🧋", 200, 140);

    // meja-meja pelanggan
    drawTable(360, 220); drawTable(620, 220); drawTable(760, 380); drawTable(360, 420);

    // dekorasi musiman
    drawSeasonDecor();
  }

  function drawTable(x, y) {
    ctx.fillStyle = "#4a3324";
    ctx.beginPath(); ctx.ellipse(x, y, 42, 26, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#2e2016";
    ctx.beginPath(); ctx.ellipse(x, y + 6, 42, 20, 0, 0, Math.PI); ctx.fill();
    ctx.font = "20px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("☕", x, y - 2);
  }

  function drawSeasonDecor() {
    ctx.font = "26px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const topY = 78;
    if (season === "lebaran")      { ctx.fillText("🌙", 120, topY); ctx.fillText("🏮", WORLD.w - 120, topY); ctx.fillText("🕌", WORLD.w/2 - 220, topY); }
    else if (season === "kemerdekaan") { for (let i=0;i<8;i++) ctx.fillText(i%2?"🔴":"⚪", 120 + i*90, topY); }
    else if (season === "halloween")   { ctx.fillText("🎃", 120, topY); ctx.fillText("🦇", 300, topY); ctx.fillText("🕸️", WORLD.w-120, topY); ctx.fillText("👻", WORLD.w-300, topY); }
    else if (season === "tahunbaru")   { ctx.fillText("🎆", 120, topY); ctx.fillText("🎉", 300, topY); ctx.fillText("🎆", WORLD.w-120, topY); ctx.fillText("🥂", WORLD.w-300, topY); }
  }

  function drawCoins() {
    for (const c of coins) {
      const yoff = Math.sin(c.bob) * 3;
      // bayangan
      ctx.fillStyle = "rgba(0,0,0,.25)";
      ctx.beginPath(); ctx.ellipse(c.x, c.y + 12, c.r * .8, c.r * .35, 0, 0, Math.PI * 2); ctx.fill();
      // koin
      ctx.save();
      ctx.translate(c.x, c.y + yoff);
      ctx.beginPath(); ctx.arc(0, 0, c.r, 0, Math.PI * 2);
      ctx.fillStyle = c.def.color; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = "rgba(0,0,0,.35)"; ctx.stroke();
      ctx.font = `${c.r + 2}px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(c.id === "mystery" ? "?" : "", 0, 1);
      if (c.id === "mystery") { ctx.fillStyle = "#fff"; ctx.font = "bold 14px sans-serif"; ctx.fillText("?", 0, 1); }
      ctx.restore();
      // glow koin langka
      if (!reduceFx && (c.id === "ringgit" || c.id === "mystery")) {
        ctx.save(); ctx.globalAlpha = .25 + Math.sin(c.bob) * .1;
        ctx.fillStyle = c.def.color;
        ctx.beginPath(); ctx.arc(c.x, c.y + yoff, c.r + 7, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    }
  }

  function drawPlayer() {
    const { x, y, r, face } = player;
    ctx.fillStyle = "rgba(0,0,0,.3)";
    ctx.beginPath(); ctx.ellipse(x, y + r, r, r * .4, 0, 0, Math.PI * 2); ctx.fill();
    // badan
    ctx.save(); ctx.translate(x, y); ctx.scale(face, 1);
    ctx.font = "34px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("🧑", 0, -2);
    ctx.restore();
  }

  function drawParticles() {
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life * 2);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 4, 4);
    }
    ctx.globalAlpha = 1;
  }

  // ambiance: overlay cahaya siang/malam + vignette
  function drawAmbiance() {
    if (timeOfDay === "night") {
      const g = ctx.createRadialGradient(player.x, player.y, 40, player.x, player.y, 420);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, "rgba(5,2,15,.78)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, WORLD.w, WORLD.h);
      // nuansa biru malam
      ctx.fillStyle = "rgba(20,20,60,.18)"; ctx.fillRect(0, 0, WORLD.w, WORLD.h);
    } else {
      // sinar matahari hangat dari jendela
      ctx.fillStyle = "rgba(255,210,120,.08)";
      ctx.fillRect(0, 0, WORLD.w, WORLD.h);
    }
    // vignette
    const v = ctx.createRadialGradient(WORLD.w/2, WORLD.h/2, 200, WORLD.w/2, WORLD.h/2, 560);
    v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,.35)");
    ctx.fillStyle = v; ctx.fillRect(0, 0, WORLD.w, WORLD.h);
  }

  return { init, start, stop, setTime, getTime, setSeason, setReduceFx };
})();
