# Starts MySQL (if needed), the API and the Vite dev server as detached processes,
# so they keep running even if the terminal or the editor session is restarted.
# Usage: right-click > "Run with PowerShell", or:  powershell -ExecutionPolicy Bypass -File start-dev.ps1

$ErrorActionPreference = 'SilentlyContinue'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$node = 'C:\Program Files\nodejs\node.exe'
$logDir = Join-Path $env:TEMP 'opencode\logs'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

function Test-Listening([int]$port) {
  return [bool](Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue)
}

# --- MySQL ---
if (-not (Test-Listening 3306)) {
  Write-Host 'Starting MySQL...'
  Start-Process -FilePath 'C:\xampp\mysql\bin\mysqld.exe' -ArgumentList '--defaults-file=C:\xampp\mysql\bin\my.ini', '--console' -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logDir 'mysql.log') -RedirectStandardError (Join-Path $logDir 'mysql.err.log')
  Start-Sleep -Seconds 6
} else {
  Write-Host 'MySQL already running on 3306'
}

# --- Backend API ---
if (-not (Test-Listening 5001)) {
  Write-Host 'Starting backend on 5001...'
  Start-Process -FilePath $node -ArgumentList 'server.js' -WorkingDirectory (Join-Path $root '02-BACKEND') -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logDir 'backend.log') -RedirectStandardError (Join-Path $logDir 'backend.err.log')
} else {
  Write-Host 'Backend already running on 5001'
}

# --- Vite dev server ---
if (-not (Test-Listening 5173)) {
  Write-Host 'Starting Vite on 5173...'
  Start-Process -FilePath $node -ArgumentList 'node_modules\vite\bin\vite.js', '--port', '5173', '--host', '127.0.0.1', '--strictPort' -WorkingDirectory $root -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logDir 'vite.log') -RedirectStandardError (Join-Path $logDir 'vite.err.log')
} else {
  Write-Host 'Vite already running on 5173'
}

# Give both servers time to boot, then probe them over HTTP.
Start-Sleep -Seconds 10

$checks = @(
  @{ Name = 'Frontend'; Url = 'http://127.0.0.1:5173/' },
  @{ Name = 'Admin'; Url = 'http://127.0.0.1:5173/admin' },
  @{ Name = 'API'; Url = 'http://127.0.0.1:5001/api/health' }
)

foreach ($check in $checks) {
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $check.Url -TimeoutSec 15
    Write-Host ("{0,-9} {1}" -f $check.Name, $response.StatusCode)
  } catch {
    Write-Host ("{0,-9} DOWN" -f $check.Name)
  }
}

Write-Host ''
Write-Host 'Website : http://localhost:5173/'
Write-Host 'Admin   : http://localhost:5173/admin'
Write-Host 'API     : http://localhost:5001/api/health'
Write-Host "Logs    : $logDir"
