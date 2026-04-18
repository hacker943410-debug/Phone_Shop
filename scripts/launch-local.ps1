$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$DataDirectory = Join-Path $ProjectRoot ".data"
$PidFilePath = Join-Path $DataDirectory "local-server.pid"
$OutLogPath = Join-Path $DataDirectory "local-server.out.log"
$ErrLogPath = Join-Path $DataDirectory "local-server.err.log"
$BuildIdPath = Join-Path $ProjectRoot ".next\\BUILD_ID"
$LaunchUrl = "http://localhost:3000/login"
$ServerUrl = "http://127.0.0.1:3000/login"
$NextCliPath = Join-Path $ProjectRoot "node_modules\\next\\dist\\bin\\next"
$NodePath = (Get-Command node.exe -ErrorAction Stop).Source

function Test-PhoneShopHealthy {
  try {
    $statusCode = curl.exe `
      --silent `
      --show-error `
      --output NUL `
      --write-out "%{http_code}" `
      --max-time 3 `
      $ServerUrl
    return $statusCode -eq "200"
  } catch {
    return $false
  }
}

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

function Sync-PidFileFromRunningServer {
  $runningPid = Get-PhoneShopServerPid

  if ($runningPid) {
    Set-Content -LiteralPath $PidFilePath -Value $runningPid
    return $runningPid
  }

  return $null
}

function Stop-ExistingPidIfNeeded {
  if (-not (Test-Path -LiteralPath $PidFilePath)) {
    return
  }

  $existingPid = (Get-Content -LiteralPath $PidFilePath -ErrorAction SilentlyContinue | Select-Object -First 1).Trim()

  if (-not $existingPid) {
    Remove-Item -LiteralPath $PidFilePath -Force -ErrorAction SilentlyContinue
    return
  }

  $existingProcess = Get-Process -Id $existingPid -ErrorAction SilentlyContinue

  if ($existingProcess) {
    if (Test-PhoneShopHealthy) {
      Start-Process $LaunchUrl
      exit 0
    }

    taskkill.exe /PID $existingPid /T /F | Out-Null
  }

  Remove-Item -LiteralPath $PidFilePath -Force -ErrorAction SilentlyContinue
}

New-Item -ItemType Directory -Path $DataDirectory -Force | Out-Null

if (Test-PhoneShopHealthy) {
  Sync-PidFileFromRunningServer | Out-Null
  Start-Process $LaunchUrl
  exit 0
}

Stop-ExistingPidIfNeeded

if (-not (Test-Path -LiteralPath $BuildIdPath)) {
  Set-Location $ProjectRoot
  pnpm build
}

Remove-Item -LiteralPath $OutLogPath -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $ErrLogPath -Force -ErrorAction SilentlyContinue

$startedProcess = Start-Process `
  -FilePath $NodePath `
  -ArgumentList @(
    $NextCliPath,
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3000"
  ) `
  -WorkingDirectory $ProjectRoot `
  -RedirectStandardOutput $OutLogPath `
  -RedirectStandardError $ErrLogPath `
  -WindowStyle Hidden `
  -PassThru

Set-Content -LiteralPath $PidFilePath -Value $startedProcess.Id

for ($attempt = 0; $attempt -lt 60; $attempt += 1) {
  Start-Sleep -Milliseconds 500

  if (Test-PhoneShopHealthy) {
    Sync-PidFileFromRunningServer | Out-Null
    Start-Process $LaunchUrl
    exit 0
  }

  if (-not (Get-Process -Id $startedProcess.Id -ErrorAction SilentlyContinue)) {
    break
  }
}

throw "PhoneShop local server did not start. Check logs: $OutLogPath"
