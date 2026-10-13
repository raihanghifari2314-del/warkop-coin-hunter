/* =========================================================
   ui.js — rendering panel/modal & helper UI.
   Dipanggil oleh main.js. Semua state lewat window.App.
   ========================================================= */
window.UI = (function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const overlay = $("#overlay");
  const modalBody = $("#modalBody");
  const live = $("#live");

  function announce(msg) { live.textContent = ""; setTimeout(() => (live.textContent = msg), 30); }

  function openModal(html) {
    modalBody.innerHTML = html;
    overlay.classList.remove("hidden");
  }
  function closeModal() { overlay.classList.add("hidden"); }

  function toast(text, kind = "") {
    const wrap = $("#toasts");
    const el = document.createElement("div");
    el.className = "toast " + kind;
    el.textContent = text;
    wrap.appendChild(el);
    setTimeout(() => el.remove(), 3200);
  }

  /* ---------------- HUD ---------------- */
  function syncHud(s) {
    $("#hudCoins").textContent = s.coins;
    $("#hudGems").textContent = s.gems;
    $("#hudLevel").textContent = s.level;
  }
  function syncMenu(s) {
    const inv = Object.values(s.inventory).reduce((a, b) => a + b, 0);
    const album = Object.keys(s.albumFusions).length;
    $("#menuStats").innerHTML = `
      <span class="menu__stat">🪙 ${s.coins} koin</span>
      <span class="menu__stat">💎 ${s.gems} permata</span>
      <span class="menu__stat">⭐ Warkop Lv ${s.level}</span>
      <span class="menu__stat">🎒 ${inv} koin disimpan</span>
      <span class="menu__stat">📒 ${album}/${DATA.FUSIONS.length} album</span>`;
    const se = DATA.SEASONS[App.currentSeason()];
    $("#seasonBadge").textContent = `${se.emoji} Tema: ${se.label}`;
  }

  /* ---------------- Warkop (shop) ---------------- */
  function warkop(s) {
    const items = DATA.SHOP.map((it) => {
      const owned = !!s.owned[it.id];
      const canBuy = !owned && s.coins >= it.price;
      return `
        <div class="card">
          <div class="card__head">
            <span class="card__emoji">${it.emoji}</span>
            <div>
              <div class="card__title">${it.name}</div>
              <span class="tag ${owned ? "tag--owned" : ""}">Lv ${it.level}</span>
            </div>
          </div>
          <div class="card__desc">${it.desc}</div>
          <div class="card__meta">
            ${owned
              ? `<span class="tag tag--owned">✓ Terpasang</span>`
              : `<span class="price">🪙 ${it.price}</span>
                 <button class="btn btn--primary" data-buy="${it.id}" ${canBuy ? "" : "disabled"}>Beli</button>`}
          </div>
        </div>`;
    }).join("");

    openModal(`
      <h2>🏪 Kembangkan Warkop</h2>
      <p class="lead">Dari warung sederhana sampai warkop modern. Beli perlengkapan pakai koin yang kamu kumpulkan.</p>
      <div class="grid grid--2">${items}</div>`);

    $$("[data-buy]").forEach((b) =>
      b.addEventListener("click", () => App.buyItem(b.dataset.buy)));
  }

  /* ---------------- Album koleksi ---------------- */
  function album(s) {
    const coinCards = DATA.COINS.filter(c => c.id !== "mystery").map((c) => {
      const have = s.inventory[c.id] || 0;
      const unlocked = have > 0;
      return `
        <div class="coin-slot ${unlocked ? "" : "locked"}" data-story="coin:${c.id}">
          ${have ? `<span class="badge-count">${have}</span>` : ""}
          <span class="coin-face">${unlocked ? c.face : "❔"}</span>
          <span class="coin-name">${unlocked ? c.name : "???"}</span>
        </div>`;
    }).join("");

    const fusionCards = DATA.FUSIONS.map((f) => {
      const got = !!s.albumFusions[f.id];
      return `
        <div class="coin-slot ${got ? "" : "locked"}" data-story="fusion:${f.id}">
          <span class="coin-face">${got ? f.face : "❔"}</span>
          <span class="coin-name">${got ? f.name : "Belum terbuka"}</span>
        </div>`;
    }).join("");

    openModal(`
      <h2>📒 Album Koleksi</h2>
      <p class="lead">Setiap koin punya cerita. Klik koin yang sudah terkumpul untuk membaca kisahnya.</p>
      <h3>Koin Dasar</h3>
      <div class="grid grid--3">${coinCards}</div>
      <h3 style="margin-top:18px">Koin Fusion</h3>
      <div class="grid grid--3">${fusionCards}</div>
      <div id="storyBox" style="margin-top:16px"></div>`);

    $$("[data-story]").forEach((el) => el.addEventListener("click", () => {
      if (el.classList.contains("locked")) { toast("Koin ini belum terkumpul.", ""); return; }
      const [type, id] = el.dataset.story.split(":");
      const obj = type === "coin" ? DATA.coinById(id) : DATA.FUSIONS.find(f => f.id === id);
      $("#storyBox").innerHTML = `<div class="story">${obj.face} <b>${obj.name}</b> — ${obj.story}</div>`;
    }));
  }

  /* ---------------- Coin Fusion ---------------- */
  function fusion(s) {
    const rows = DATA.FUSIONS.map((f) => {
      const got = !!s.albumFusions[f.id];
      const needList = Object.entries(f.need).map(([cid, n]) => {
        const have = s.inventory[cid] || 0;
        const def = DATA.coinById(cid);
        const ok = have >= n;
        return `<span class="tag" style="color:${ok ? "var(--good)" : "var(--danger)"}">${def.face} ${def.name} ${have}/${n}</span>`;
      }).join(" ");
      const canFuse = Object.entries(f.need).every(([cid, n]) => (s.inventory[cid] || 0) >= n);
      return `
        <div class="card">
          <div class="card__head">
            <span class="card__emoji">${f.face}</span>
            <div><div class="card__title">${f.name}</div>
            <span class="tag">+💎 ${f.gems}</span></div>
          </div>
          <div class="card__desc">${f.story}</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px">${needList}</div>
          <div class="card__meta">
            ${got ? `<span class="tag tag--owned">✓ Sudah dibuat</span>` : ""}
            <button class="btn btn--primary" data-fuse="${f.id}" ${canFuse ? "" : "disabled"}>⚗️ Gabungkan</button>
          </div>
        </div>`;
    }).join("");

    openModal(`
      <h2>⚗️ Coin Fusion</h2>
      <p class="lead">Gabungkan beberapa koin tertentu untuk membuka varian baru. Koin bahan akan terpakai.</p>
      <div class="grid grid--2">${rows}</div>`);

    $$("[data-fuse]").forEach((b) =>
      b.addEventListener("click", () => App.doFusion(b.dataset.fuse)));
  }

  /* ---------------- Inventory ---------------- */
  function inventory(s) {
    const rows = DATA.COINS.filter(c => c.id !== "mystery").map((c) => {
      const n = s.inventory[c.id] || 0;
      return `
        <div class="coin-slot ${n ? "" : "locked"}">
          ${n ? `<span class="badge-count">${n}</span>` : ""}
          <span class="coin-face">${c.face}</span>
          <span class="coin-name">${c.name}</span>
          <small style="color:var(--gold);font-weight:800">${c.value} 🪙</small>
        </div>`;
    }).join("");
    const totalStored = Object.values(s.inventory).reduce((a, b) => a + b, 0);
    openModal(`
      <h2>🎒 Inventory</h2>
      <p class="lead">${totalStored} koin tersimpan. Koin terkumpul otomatis menambah saldo & bisa dipakai untuk fusion.</p>
      <div class="grid grid--3">${rows}</div>`);
  }

  /* ---------------- Secret NPC ---------------- */
  function npc(npcDef, s) {
    const done = !!s.npcDone[npcDef.id];
    const can = App.npcCanComplete(npcDef);
    const needText = Object.entries(npcDef.need).map(([k, v]) => {
      if (k === "_mysterySolved") return `Pecahkan ${v} Mystery Coin`;
      if (k === "_hasFusion") return `Punya koin fusion tertentu`;
      const def = DATA.coinById(k); return `${v}× ${def.name}`;
    }).join(", ");
    openModal(`
      <div style="text-align:center">
        <div style="font-size:3.4rem">${npcDef.emoji}</div>
        <h2>${npcDef.name}</h2>
      </div>
      <p class="story">${done ? npcDef.done : npcDef.line}</p>
      ${done ? `<p class="lead" style="text-align:center">Misi sudah selesai. Terima kasih! 🎉</p>`
             : `<p class="lead" style="text-align:center">Syarat: ${needText}</p>
                <div style="text-align:center">
                  <button class="btn btn--primary" id="npcDo" ${can ? "" : "disabled"}>Selesaikan Misi</button>
                  ${can ? "" : `<p style="color:var(--ink-dim);margin-top:8px">Syarat belum terpenuhi.</p>`}
                </div>`}`);
    if (!done) { const b = $("#npcDo"); if (b) b.addEventListener("click", () => App.completeNpc(npcDef.id)); }
  }

  /* ---------------- Mystery puzzle ---------------- */
  function puzzle(p) {
    openModal(`
      <div class="puzzle">
        <h2>❓ Mystery Coin</h2>
        <p class="lead">Pecahkan teka-teki untuk membuka nilai koin ini.</p>
        <div class="puzzle__symbol">${p.symbol}</div>
        <input class="puzzle__input" id="puzzleAns" placeholder="Jawabanmu..." autocomplete="off" />
        <div style="margin-top:14px;display:flex;gap:10px;justify-content:center">
          <button class="btn" id="puzzleHint">💡 Petunjuk</button>
          <button class="btn btn--primary" id="puzzleGo">Jawab</button>
        </div>
        <p id="puzzleMsg" style="margin-top:12px;font-weight:700;min-height:1.2em"></p>
      </div>`);
    const input = $("#puzzleAns"); input.focus();
    $("#puzzleHint").addEventListener("click", () => { $("#puzzleMsg").textContent = "💡 " + p.hint; });
    const submit = () => App.answerPuzzle(p, input.value);
    $("#puzzleGo").addEventListener("click", submit);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); });
  }
  function puzzleFeedback(ok, msg) {
    const el = $("#puzzleMsg"); if (!el) return;
    el.style.color = ok ? "var(--good)" : "var(--danger)";
    el.textContent = msg;
  }

  /* ---------------- Settings (accessibility) ---------------- */
  function settings(s) {
    const seasonOpts = Object.entries(DATA.SEASONS)
      .map(([k, v]) => `<option value="${k}" ${s.settings.season === k ? "selected" : ""}>${v.emoji} ${v.label}</option>`)
      .join("");
    openModal(`
      <h2>⚙️ Pengaturan</h2>
      <p class="lead">Aksesibilitas & tampilan. Perubahan langsung tersimpan.</p>

      <div class="setting-row">
        <label>Tema Musiman
          <small>Lebaran, Kemerdekaan, Halloween, Akhir Tahun</small></label>
        <select class="select" id="setSeason"><option value="auto" ${s.settings.season==="auto"?"selected":""}>🔄 Otomatis (ikut tanggal)</option>${seasonOpts}</select>
      </div>

      <div class="setting-row">
        <label>Ukuran Teks <small>Perbesar agar lebih mudah dibaca</small></label>
        <input class="range" type="range" id="setScale" min="0.9" max="1.4" step="0.05" value="${s.settings.uiScale}">
      </div>

      <div class="setting-row">
        <label>Kurangi Efek Visual <small>Matikan partikel, blur, dan animasi berat</small></label>
        <span class="switch"><input type="checkbox" id="setFx" ${s.settings.reduceEffects ? "checked" : ""}><span></span></span>
      </div>

      <div class="setting-row">
        <label>Kontras Tinggi <small>Teks lebih tegas dan terbaca</small></label>
        <span class="switch"><input type="checkbox" id="setContrast" ${s.settings.highContrast ? "checked" : ""}><span></span></span>
      </div>

      <div class="setting-row">
        <label>Cloud Save <small>Simpan progres cadangan agar aman saat ganti perangkat</small></label>
        <span class="switch"><input type="checkbox" id="setCloud" ${s.settings.cloudSave ? "checked" : ""}><span></span></span>
      </div>

      <div class="setting-row">
        <label>Progres <small>Pulihkan dari cadangan atau mulai ulang</small></label>
        <div style="display:flex;gap:8px">
          <button class="btn" id="setRestore" ${Store.hasCloud() ? "" : "disabled"}>☁️ Pulihkan</button>
          <button class="btn" id="setReset" style="color:var(--danger)">🗑️ Reset</button>
        </div>
      </div>`);

    $("#setSeason").addEventListener("change", (e) => App.setSetting("season", e.target.value));
    $("#setScale").addEventListener("input", (e) => App.setSetting("uiScale", parseFloat(e.target.value)));
    $("#setFx").addEventListener("change", (e) => App.setSetting("reduceEffects", e.target.checked));
    $("#setContrast").addEventListener("change", (e) => App.setSetting("highContrast", e.target.checked));
    $("#setCloud").addEventListener("change", (e) => App.setSetting("cloudSave", e.target.checked));
    $("#setRestore").addEventListener("click", () => App.restoreCloud());
    $("#setReset").addEventListener("click", () => App.resetProgress());
  }

  return {
    openModal, closeModal, toast, announce,
    syncHud, syncMenu,
    warkop, album, fusion, inventory, npc, puzzle, puzzleFeedback, settings,
  };
})();
