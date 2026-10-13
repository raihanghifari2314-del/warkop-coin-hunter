/* =========================================================
   storage.js — save/load progress.
   "cloud save" disimulasikan via localStorage dengan slot
   terpisah + timestamp, agar aman saat offline.
   ========================================================= */
window.Store = (function () {
  const KEY = "warkop_coin_hunter_save_v1";
  const CLOUD_KEY = "warkop_coin_hunter_cloud_v1";

  const DEFAULT = {
    version: 1,
    coins: 0,
    gems: 0,
    level: 1,
    inventory: {},        // { coinId: count }
    owned: {},            // { shopItemId: true }
    albumFusions: {},     // { fusionId: true }
    npcDone: {},          // { npcId: true }
    mysterySolved: 0,
    settings: {
      season: "auto",
      reduceEffects: false,
      highContrast: false,
      uiScale: 1,
      cloudSave: true,
    },
    savedAt: null,
  };

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return clone(DEFAULT);
      const data = JSON.parse(raw);
      return Object.assign(clone(DEFAULT), data, {
        settings: Object.assign(clone(DEFAULT.settings), data.settings || {}),
      });
    } catch (e) {
      console.warn("Save korup, pakai default:", e);
      return clone(DEFAULT);
    }
  }

  function save(state) {
    state.savedAt = Date.now();
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
      if (state.settings.cloudSave) syncCloud(state);
      return true;
    } catch (e) {
      console.warn("Gagal menyimpan:", e);
      return false;
    }
  }

  // Simulasi cloud save: slot cadangan terpisah.
  function syncCloud(state) {
    try { localStorage.setItem(CLOUD_KEY, JSON.stringify(state)); } catch (e) {}
  }
  function hasCloud() { return !!localStorage.getItem(CLOUD_KEY); }
  function restoreCloud() {
    const raw = localStorage.getItem(CLOUD_KEY);
    if (!raw) return null;
    try {
      const data = JSON.parse(raw);
      localStorage.setItem(KEY, raw);
      return Object.assign(clone(DEFAULT), data);
    } catch (e) { return null; }
  }

  function reset() {
    localStorage.removeItem(KEY);
    return clone(DEFAULT);
  }

  return { load, save, reset, hasCloud, restoreCloud, DEFAULT };
})();
