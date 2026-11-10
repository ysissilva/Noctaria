@echo off
cd /d "%~dp0"
echo ==============================================
echo       Iniciando o jogo Noctaria...
echo ==============================================
start http://localhost:5173
call npm.cmd run dev -- --host
pause
