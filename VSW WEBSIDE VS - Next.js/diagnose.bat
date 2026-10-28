@echo off
setlocal
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0"

set "LOG=%~dp0startup-log.txt"
echo Starting diagnostics... > "%LOG%"
echo Date: %date% %time% >> "%LOG%"

echo === node version === >> "%LOG%"
node --version >> "%LOG%" 2>&1
echo exit: %errorlevel% >> "%LOG%"

echo === npm version === >> "%LOG%"
npm --version >> "%LOG%" 2>&1
echo exit: %errorlevel% >> "%LOG%"

echo === root npm install === >> "%LOG%"
call npm install >> "%LOG%" 2>&1
echo exit: %errorlevel% >> "%LOG%"

echo === backend npm install === >> "%LOG%"
cd 02-BACKEND
call npm install >> "%LOG%" 2>&1
echo exit: %errorlevel% >> "%LOG%"
cd ..

echo === starting dev:all === >> "%LOG%"
call npm run dev:all >> "%LOG%" 2>&1
echo exit: %errorlevel% >> "%LOG%"

echo.
echo ============================================
echo   Done. Open startup-log.txt in this folder
echo   and paste its contents here.
echo ============================================
pause
