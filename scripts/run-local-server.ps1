$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$LogDirectory = Join-Path $ProjectRoot ".data"
$OutputLogPath = Join-Path $LogDirectory "local-server.out.log"
$ErrorLogPath = Join-Path $LogDirectory "local-server.err.log"
$NextCliPath = Join-Path $ProjectRoot "node_modules\\next\\dist\\bin\\next"
$NodePath = (Get-Command node.exe -ErrorAction Stop).Source

New-Item -ItemType Directory -Path $LogDirectory -Force | Out-Null
Set-Location $ProjectRoot

$env:NODE_ENV = "production"
$env:PORT = "3000"
$env:HOSTNAME = "127.0.0.1"

& $NodePath $NextCliPath start --hostname 127.0.0.1 --port 3000 1>> $OutputLogPath 2>> $ErrorLogPath
