/* =========================================================
   data.js — konten statis game (koin, item, NPC, seasonal)
   Semua lokal, tanpa API/database.
   ========================================================= */
window.DATA = (function () {

  /* ---------- Jenis koin yang bisa diburu di map ---------- */
  // rarity menentukan nilai & peluang muncul
  const COINS = [
    { id: "sen",      name: "Koin Sen",        face: "🪙", value: 1,  rarity: "common",   color: "#d7a94a",
      story: "Pecahan terkecil di laci warkop. Dulu cukup untuk sebatang permen di depan sekolah." },
    { id: "gobang",   name: "Gobang",          face: "🟤", value: 3,  rarity: "common",   color: "#b07b4e",
      story: "Koin tembaga berlubang tengah. Pelanggan lama suka meronce-nya jadi gantungan kunci." },
    { id: "ketip",    name: "Ketip",           face: "⚪", value: 5,  rarity: "uncommon", color: "#c9c9c9",
      story: "Perak kecil mengkilap. Konon membawa hoki kalau jatuh dengan sisi gambar menghadap atas." },
    { id: "benggol",  name: "Benggol",         face: "🟠", value: 8,  rarity: "uncommon", color: "#e08a3c",
      story: "Berat di tangan, hangat warnanya. Pemilik warkop pertama menyimpannya di toples kaca." },
    { id: "ringgit",  name: "Ringgit",         face: "🟡", value: 15, rarity: "rare",     color: "#ffcf6b",
      story: "Koin besar yang jarang muncul. Katanya hanya keluar saat aroma kopi paling pekat." },
    { id: "mystery",  name: "Mystery Coin",    face: "❓", value: 0,  rarity: "mystery",  color: "#9b5de5",
      story: "Simbol asing terukir di permukaannya. Harus dipecahkan dulu sebelum tahu nilainya." },
  ];

  /* ---------- Varian koin hasil FUSION ---------- */
  // butuh: map {coinId: jumlah}. Hasil: koin spesial masuk album.
  const FUSIONS = [
    { id: "fusi_perunggu", name: "Koin Perunggu Antik", face: "🥉", gems: 2,
      need: { gobang: 3, benggol: 1 },
      story: "Lelehan tiga gobang dan sekeping benggol. Permukaannya memantulkan lampu neon warkop." },
    { id: "fusi_perak", name: "Koin Perak Bulan", face: "🥈", gems: 4,
      need: { ketip: 3, ringgit: 1 },
      story: "Dingin seperti malam. Konon ditempa saat purnama di belakang warung." },
    { id: "fusi_emas", name: "Koin Emas Legenda", face: "🥇", gems: 8,
      need: { ringgit: 2, benggol: 2, ketip: 2 },
      story: "Koin terindah di album. Hanya peracik sabar yang pernah menyatukannya." },
  ];

  /* ---------- Teka-teki untuk Mystery Coin ---------- */
  const PUZZLES = [
    { symbol: "☕ + ☕ + ☕ = ?", answer: ["15"], hint: "Satu cangkir bernilai 5.", reward: 20 },
    { symbol: "Aku hitam, pahit, dan membuatmu melek. Apa aku?", answer: ["kopi"], hint: "Minuman khas warkop.", reward: 15 },
    { symbol: "7 → 14 → 28 → ?", answer: ["56"], hint: "Setiap angka dikali dua.", reward: 25 },
    { symbol: "Berapa huruf pada kata 'WARKOP'?", answer: ["6"], hint: "Hitung satu per satu.", reward: 10 },
    { symbol: "🪙🪙🪙🪙 - 🪙 = ?", answer: ["3"], hint: "Empat dikurangi satu.", reward: 12 },
  ];

  /* ---------- Item upgrade warkop (dibeli pakai koin) ---------- */
  // tier: urutan unlock. levelUp: menambah level warkop.
  const SHOP = [
    { id: "meja_kayu",   emoji: "🪑", name: "Meja & Kursi Kayu",   desc: "Set sederhana agar pelanggan betah duduk.",       price: 50,   level: 1 },
    { id: "kompor",      emoji: "🔥", name: "Kompor Kopi",         desc: "Rebus air lebih cepat, pelanggan tak menunggu lama.", price: 90,   level: 1 },
    { id: "lampu_neon",  emoji: "💡", name: "Lampu Neon",          desc: "Cahaya hangat yang bikin warkop hidup di malam hari.", price: 160,  level: 2 },
    { id: "sound",       emoji: "🔊", name: "Sound System",        desc: "Musik santai menemani obrolan pelanggan.",         price: 240,  level: 2 },
    { id: "mesin_kopi",  emoji: "☕", name: "Mesin Kopi Espresso", desc: "Naik kelas dari kopi tubruk ke espresso.",         price: 420,  level: 3 },
    { id: "dekorasi",    emoji: "🪴", name: "Dekorasi Unik",       desc: "Tanaman, lukisan, dan ornamen khas.",              price: 520,  level: 3 },
    { id: "parkir",      emoji: "🏍️", name: "Area Parkir Motor",   desc: "Pelanggan datang lebih banyak, lebih nyaman.",     price: 700,  level: 4 },
    { id: "modern",      emoji: "🏙️", name: "Renovasi Modern",     desc: "Ubah warung sederhana jadi warkop modern.",        price: 1200, level: 5 },
  ];

  /* ---------- Secret NPC pengunjung warkop ---------- */
  const NPCS = [
    { id: "pak_tua",  emoji: "👴", name: "Pak Tua Penikmat Kopi",
      line: "Nak, kumpulkan 10 Gobang untukku. Aku ingin meroncenya lagi seperti dulu.",
      need: { gobang: 10 }, reward: { gems: 3 },
      done: "Terima kasih. Ini batu permata simpananku, kau pantas menerimanya." },
    { id: "mbak_barista", emoji: "👩", name: "Mbak Barista Misterius",
      line: "Pecahkan satu Mystery Coin, lalu kembali padaku ya.",
      need: { _mysterySolved: 1 }, reward: { gems: 4, coins: 50 },
      done: "Hebat! Teka-teki memang bumbu paling nikmat. Ini hadiahmu." },
    { id: "anak_kecil", emoji: "🧒", name: "Anak Kecil Penasaran",
      line: "Kakak punya Koin Perunggu Antik hasil fusion? Aku mau lihat!",
      need: { _hasFusion: "fusi_perunggu" }, reward: { gems: 5 },
      done: "Keren banget! Nih, permata dari celenganku buat Kakak." },
  ];

  /* ---------- Seasonal themes ---------- */
  const SEASONS = {
    default:     { label: "Normal",       emoji: "🎏", decor: "" },
    lebaran:     { label: "Lebaran",      emoji: "🌙", decor: "ketupat & pelita" },
    kemerdekaan: { label: "Kemerdekaan",  emoji: "🇮🇩", decor: "umbul-umbul merah putih" },
    halloween:   { label: "Halloween",    emoji: "🎃", decor: "labu & kelelawar" },
    tahunbaru:   { label: "Akhir Tahun",  emoji: "🎆", decor: "kembang api" },
  };

  // Deteksi musim otomatis dari bulan (bisa dioverride di settings)
  function autoSeason(date = new Date()) {
    const m = date.getMonth() + 1;
    if (m === 8) return "kemerdekaan";
    if (m === 10) return "halloween";
    if (m === 12 || m === 1) return "tahunbaru";
    if (m === 3 || m === 4) return "lebaran";
    return "default";
  }

  function coinById(id) { return COINS.find(c => c.id === id); }

  return { COINS, FUSIONS, PUZZLES, SHOP, NPCS, SEASONS, autoSeason, coinById };
})();
