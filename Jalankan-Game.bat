@echo off
REM ===== Warkop Coin Hunter - peluncur =====
REM Dobel-klik file ini untuk menjalankan game lewat server lokal.
cd /d "%~dp0"
echo Menjalankan Warkop Coin Hunter...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause
