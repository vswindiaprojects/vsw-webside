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

echo === Seeding admin account from 02-BACKEND/.env ===
call npm run seed:admin
if errorlevel 1 (
  echo ERROR: seed failed. Make sure MySQL is running and admins table exists.
  pause
  exit /b 1
)
echo.
echo Done. Admin login URL: http://localhost:5180/admin
pause
