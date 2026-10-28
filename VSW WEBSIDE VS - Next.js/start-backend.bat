@echo off
setlocal
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0"

echo === Checking Node.js ===
where node >nul 2>&1
if errorlevel 1 (
  echo ERROR: node.exe not found. Install Node.js from https://nodejs.org
  pause
  exit /b 1
)

echo === Installing backend dependencies ===
cd 02-BACKEND
call npm install
if errorlevel 1 (
  echo ERROR: npm install failed.
  pause
  exit /b 1
)
cd ..

echo === Starting backend API (port 5000) ===
call npm run backend:dev
pause
