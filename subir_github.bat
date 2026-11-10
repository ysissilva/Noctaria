@echo off
set "PATH=%LOCALAPPDATA%\Programs\MinGit\cmd;%PATH%"
cd /d "c:\Users\maria\Desktop\Duda\Noctaria"
echo ==============================================
echo       Enviando alteracoes para o GitHub...
echo       Branch: duda
echo       Usuario: eduardarodriguesz
echo ==============================================
echo.
git push origin duda
echo.
echo ==============================================
pause

