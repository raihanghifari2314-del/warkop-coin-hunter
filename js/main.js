/* =========================================================
   main.js — orkestrasi: boot, routing layar, state, aksi.
   Dipublikasikan sebagai window.App agar UI bisa memanggil.
   ========================================================= */
window.App = (function () {
  const $ = (s) => document.querySelector(s);

  let state = Store.load();
  let pickupSinceSave = 0;
  const NPC_SPAWN_EVERY = 25; // tiap sekian koin, NPC rahasia muncul
  let coinsPicked = 0;

  /* ---------------- Season handling ---------------- */
  function currentSeason() {
    const s = state.settings.season;
    return s === "auto" ? DATA.autoSeason() : s;
  }

  function applyTheme() {
    const season = currentSeason();
    document.body.dataset.theme = season;
    document.documentElement.style.setProperty("--ui-scale", state.settings.uiScale);
    document.documentElement.style.setProperty("--fx", state.settings.reduceEffects ? 0 : 1);
    document.body.style.filter = state.settings.highContrast ? "contrast(1.15) saturate(1.1)" : "";
    Game.setSeason(season);
    Game.setReduceFx(state.settings.reduceEffects);
  }

  /* ---------------- Screen routing ---------------- */
  function show(id) {
    ["menu", "game"].forEach((s) => $("#" + s).classList.toggle("hidden", s !== id));
  }
  function toMenu() {
    Game.stop();
    show("menu");
    UI.syncMenu(state);
  }
  function toGame() {
    show("game");
    UI.syncHud(state);
    // sinkron tampilan waktu dengan state engine
    const t = Game.getTime();
    $("#hudTime").textContent = t === "night" ? "🌙 Malam" : "🌞 Siang";
    document.body.dataset.time = t;
    Game.start();
  }

  /* ---------------- Core: pickup koin ---------------- */
  function handlePickup(def) {
    if (def.id === "mystery") {
      Game.stop();
      const p = DATA.PUZZLES[Math.floor(Math.random() * DATA.PUZZLES.length)];
      UI.puzzle(p);
      return;
    }
    state.inventory[def.id] = (state.inventory[def.id] || 0) + 1;
    state.coins += def.value;
    coinsPicked++;
    UI.syncHud(state);
    UI.toast(`+${def.value} 🪙 ${def.name}`, "good");
    UI.announce(`Mengambil ${def.name}, dapat ${def.value} koin`);
    autosave();

    // Secret NPC muncul sesekali
    if (coinsPicked % NPC_SPAWN_EVERY === 0) maybeSpawnNpc();
  }

  function answerPuzzle(p, raw) {
    const val = (raw || "").trim().toLowerCase();
    const ok = p.answer.map((a) => a.toLowerCase()).includes(val);
    if (ok) {
      state.coins += p.reward;
      state.mysterySolved++;
      UI.puzzleFeedback(true, `✅ Benar! +${p.reward} 🪙`);
      UI.syncHud(state);
      autosave();
      setTimeout(() => { UI.closeModal(); Game.start(); }, 1100);
    } else {
      UI.puzzleFeedback(false, "❌ Belum tepat, coba lagi.");
    }
  }

  /* ---------------- Secret NPC ---------------- */
  function maybeSpawnNpc() {
    const pending = DATA.NPCS.filter((n) => !state.npcDone[n.id]);
    if (!pending.length) return;
    const npcDef = pending[Math.floor(Math.random() * pending.length)];
    UI.toast(`${npcDef.emoji} Pengunjung misterius datang!`, "gem");
    setTimeout(() => { Game.stop(); UI.npc(npcDef, state); }, 500);
  }

  function npcCanComplete(npcDef) {
    return Object.entries(npcDef.need).every(([k, v]) => {
      if (k === "_mysterySolved") return state.mysterySolved >= v;
      if (k === "_hasFusion") return !!state.albumFusions[v];
      return (state.inventory[k] || 0) >= v;
    });
  }

  function completeNpc(id) {
    const npcDef = DATA.NPCS.find((n) => n.id === id);
    if (!npcDef || !npcCanComplete(npcDef)) return;
    // konsumsi koin bahan (hanya syarat berupa koin asli)
    for (const [k, v] of Object.entries(npcDef.need)) {
      if (!k.startsWith("_")) state.inventory[k] -= v;
    }
    if (npcDef.reward.gems) state.gems += npcDef.reward.gems;
    if (npcDef.reward.coins) state.coins += npcDef.reward.coins;
    state.npcDone[id] = true;
    UI.toast(`Misi selesai! +${npcDef.reward.gems || 0}💎`, "gem");
    autosave();
    UI.npc(npcDef, state); // tampilkan dialog "done"
  }

  /* ---------------- Fusion ---------------- */
  function doFusion(id) {
    const f = DATA.FUSIONS.find((x) => x.id === id);
    if (!f) return;
    const can = Object.entries(f.need).every(([cid, n]) => (state.inventory[cid] || 0) >= n);
    if (!can) { UI.toast("Koin bahan belum cukup.", ""); return; }
    for (const [cid, n] of Object.entries(f.need)) state.inventory[cid] -= n;
    state.gems += f.gems;
    const isNew = !state.albumFusions[f.id];
    state.albumFusions[f.id] = true;
    UI.toast(`${f.face} ${f.name} tercipta! +${f.gems}💎`, "gem");
    if (isNew) UI.announce(`Koin baru masuk album: ${f.name}`);
    autosave();
    UI.fusion(state); // refresh
    UI.syncHud(state);
  }

  /* ---------------- Shop / warkop ---------------- */
  function buyItem(id) {
    const it = DATA.SHOP.find((x) => x.id === id);
    if (!it || state.owned[id]) return;
    if (state.coins < it.price) { UI.toast("Koin belum cukup.", ""); return; }
    state.coins -= it.price;
    state.owned[id] = true;
    state.level = Math.max(state.level, it.level);
    UI.toast(`${it.emoji} ${it.name} terpasang!`, "good");
    autosave();
    UI.warkop(state);
    UI.syncHud(state);
  }

  /* ---------------- Settings ---------------- */
  function setSetting(key, val) {
    state.settings[key] = val;
    applyTheme();
    UI.syncMenu(state);
    Store.save(state);
    UI.announce("Pengaturan disimpan");
  }
  function restoreCloud() {
    const restored = Store.restoreCloud();
    if (restored) { state = restored; applyTheme(); UI.syncHud(state); UI.syncMenu(state); UI.toast("☁️ Progres dipulihkan.", "good"); UI.closeModal(); }
    else UI.toast("Tidak ada cadangan.", "");
  }
  function resetProgress() {
    if (!confirm("Yakin reset semua progres? Tindakan ini tidak bisa dibatalkan.")) return;
    state = Store.reset();
    applyTheme(); UI.syncHud(state); UI.syncMenu(state); UI.closeModal();
    UI.toast("Progres direset.", "");
  }

  /* ---------------- Save ---------------- */
  function autosave() {
    pickupSinceSave++;
    if (pickupSinceSave >= 1) { Store.save(state); pickupSinceSave = 0; }
  }

  /* ---------------- Time of day ---------------- */
  function toggleTime() {
    const next = Game.getTime() === "day" ? "night" : "day";
    Game.setTime(next);
    $("#hudTime").textContent = next === "night" ? "🌙 Malam" : "🌞 Siang";
    document.body.dataset.time = next;
  }

  /* ---------------- Online/offline badge ---------------- */
  function updateNet() {
    const online = navigator.onLine;
    const el = $("#netBadge");
    if (el) {
      el.textContent = online ? "● Online (cloud aktif)" : "● Offline Mode";
      el.style.color = online ? "var(--good)" : "var(--ink-dim)";
    }
  }

  /* ---------------- Wiring events ---------------- */
  function bind() {
    document.body.addEventListener("click", (e) => {
      const t = e.target.closest("[data-action]");
      if (!t) return;
      switch (t.dataset.action) {
        case "play": toGame(); break;
        case "menu": toMenu(); break;
        case "warkop": UI.warkop(state); break;
        case "album": UI.album(state); break;
        case "fusion": UI.fusion(state); break;
        case "settings": UI.settings(state); break;
        case "inventory": Game.stop(); UI.inventory(state); break;
        case "toggleTime": toggleTime(); break;
        case "close": UI.closeModal(); if (!$("#game").classList.contains("hidden")) Game.start(); break;
      }
    });
    // tutup modal via overlay klik di luar
    $("#overlay").addEventListener("click", (e) => {
      if (e.target.id === "overlay") {
        UI.closeModal();
        if (!$("#game").classList.contains("hidden")) Game.start();
      }
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !$("#overlay").classList.contains("hidden")) {
        UI.closeModal();
        if (!$("#game").classList.contains("hidden")) Game.start();
      }
    });
    window.addEventListener("online", updateNet);
    window.addEventListener("offline", updateNet);
    window.addEventListener("beforeunload", () => Store.save(state));
  }

  /* ---------------- Boot ---------------- */
  function boot() {
    const fill = $(".boot__fill");
    let pct = 0;
    const timer = setInterval(() => {
      pct = Math.min(100, pct + 12 + Math.random() * 18);
      fill.style.width = pct + "%";
      if (pct >= 100) {
        clearInterval(timer);
        setTimeout(() => {
          $("#boot").classList.add("hidden");
          $("#menu").classList.remove("hidden");
        }, 350);
      }
    }, 160);
  }

  function start() {
    Game.init($("#scene"), { onPickup: handlePickup });
    applyTheme();
    bind();
    updateNet();
    UI.syncHud(state);
    UI.syncMenu(state);
    boot();
  }

  document.addEventListener("DOMContentLoaded", start);

  return {
    currentSeason, buyItem, doFusion, answerPuzzle,
    completeNpc, npcCanComplete, setSetting, restoreCloud, resetProgress,
  };
})();
