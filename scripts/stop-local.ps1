$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$PidFilePath = Join-Path $ProjectRoot ".data\\local-server.pid"

function Get-PhoneShopServerPid {
  $listenConnection = Get-NetTCPConnection `
    -LocalAddress "127.0.0.1" `
    -LocalPort 3000 `
    -State Listen `
    -ErrorAction SilentlyContinue |
    Select-Object -First 1

  if ($listenConnection) {
    return [string]$listenConnection.OwningProcess
  }

  return $null
}

$targetPid = $null

if (Test-Path -LiteralPath $PidFilePath) {
  $targetPid = (Get-Content -LiteralPath $PidFilePath -ErrorAction SilentlyContinue | Select-Object -First 1).Trim()
}

if (-not $targetPid) {
  $targetPid = Get-PhoneShopServerPid
}

if (-not $targetPid) {
  Write-Host "PhoneShop local server is not running."
  exit 0
}

$targetProcess = Get-Process -Id $targetPid -ErrorAction SilentlyContinue

if ($targetProcess) {
  taskkill.exe /PID $targetPid /T /F | Out-Null
}

Remove-Item -LiteralPath $PidFilePath -Force -ErrorAction SilentlyContinue
Write-Host "PhoneShop local server stopped."
