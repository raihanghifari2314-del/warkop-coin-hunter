# =========================================================
#  Warkop Coin Hunter - server lokal sederhana (PowerShell murni)
#  Tidak butuh Node / Python. Jalankan:  ./server.ps1
#  Lalu buka http://localhost:8080 di browser.
# =========================================================
param(
    [int]$Port = 8080
)

$root = $PSScriptRoot
$prefix = "http://localhost:$Port/"

$mime = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
}

$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add($prefix)

try {
    $listener.Start()
} catch {
    Write-Host "Gagal menjalankan di port $Port. Coba port lain: ./server.ps1 -Port 8090" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "  Warkop Coin Hunter berjalan di:  $prefix" -ForegroundColor Green
Write-Host "  Membuka browser otomatis..." -ForegroundColor Yellow
Write-Host "  Tekan Ctrl+C untuk berhenti." -ForegroundColor DarkGray
Write-Host ""

Start-Process $prefix

try {
    while ($listener.IsListening) {
        $ctx = $listener.GetContext()
        $req = $ctx.Request
        $res = $ctx.Response

        $path = [System.Uri]::UnescapeDataString($req.Url.AbsolutePath)
        if ($path -eq "/") { $path = "/index.html" }
        $file = Join-Path $root ($path.TrimStart("/") -replace "/", "\")

        if ((Test-Path $file) -and -not (Get-Item $file).PSIsContainer) {
            $ext = [System.IO.Path]::GetExtension($file).ToLower()
            $res.ContentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { "application/octet-stream" }
            $bytes = [System.IO.File]::ReadAllBytes($file)
            $res.ContentLength64 = $bytes.Length
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $res.StatusCode = 404
            $msg = [System.Text.Encoding]::UTF8.GetBytes("404 - Tidak ditemukan: $path")
            $res.OutputStream.Write($msg, 0, $msg.Length)
        }
        $res.OutputStream.Close()
    }
} finally {
    $listener.Stop()
}
