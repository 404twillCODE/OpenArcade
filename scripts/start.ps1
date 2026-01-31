#Requires -Version 5.1
<#
.SYNOPSIS
  OpenArcade Launcher - setup, build, and start the hub.
  Called by start.bat in repo root. Do not run directly unless you know what you're doing.
#>

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent

function Write-Header {
  param([string]$Title, [string]$Subtitle = "")
  Write-Host ""
  Write-Host "  $Title" -ForegroundColor Cyan
  if ($Subtitle) {
    Write-Host "  $Subtitle" -ForegroundColor DarkGray
  }
  Write-Host ""
}

function Write-Step {
  param([string]$Text, [int]$Num, [int]$Total = 5)
  Write-Host "  [$Num/$Total] " -NoNewline -ForegroundColor DarkGray
  Write-Host $Text -ForegroundColor White
}

function Write-OK { param([string]$Text) Write-Host "        " -NoNewline; Write-Host $Text -ForegroundColor DarkGray }
function Write-URL { param([string]$Label, [string]$Url) Write-Host "  " -NoNewline; Write-Host $Label -NoNewline -ForegroundColor DarkGray; Write-Host " $Url" -ForegroundColor Cyan }
function Write-Fail {
  param([string]$Message, [string]$Detail = "")
  Write-Host ""
  Write-Host "  ---" -ForegroundColor Red
  Write-Host "  $Message" -ForegroundColor Red
  if ($Detail) { Write-Host "  $Detail" -ForegroundColor DarkGray }
  Write-Host "  ---" -ForegroundColor Red
  Write-Host ""
  exit 1
}

function Get-LocalIPv4 {
  try {
    $addrs = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
      Where-Object { $_.IPAddress -notmatch "^127\." -and $_.IPAddress -notmatch "^169\.254" -and $_.InterfaceAlias -notmatch "Loopback" }
    $first = $addrs | Select-Object -First 1
    if ($first) { return $first.IPAddress }
  } catch {}
  return $null
}

function Get-ActiveGameId {
  $statePath = Join-Path $Root "hub\data\state.json"
  if (-not (Test-Path $statePath)) { return "unknown" }
  try {
    $state = Get-Content $statePath -Raw | ConvertFrom-Json
    if ($state.activeGameId) { return $state.activeGameId }
  } catch {}
  return "unknown"
}

function Invoke-Step {
  param([scriptblock]$Block, [string]$StepName, [int]$Num, [int]$Total = 5)
  Write-Step $StepName $Num $Total
  try {
    & $Block
  } catch {
    Write-Fail "Step failed: $StepName" $_.Exception.Message
  }
}

# ---- Main ----
Write-Header "OpenArcade Launcher" "Local-first game hub"

Write-Host "  A few quick questions (you can just press Enter for the defaults):" -ForegroundColor DarkGray
Write-Host ""

# Port - user friendly
Write-Host "  Where should the hub run?" -ForegroundColor White
Write-Host "  (The default is 3000. Just press Enter unless you know you need something else.)" -ForegroundColor DarkGray
$portPrompt = Read-Host "  Your choice"
$PORT = if ([string]::IsNullOrWhiteSpace($portPrompt)) { "3000" } else { $portPrompt.Trim() }
Write-Host ""

# Play URL - user friendly with examples
Write-Host "  Share link so friends can play (optional):" -ForegroundColor White
Write-Host ""
Write-Host "  Your hub runs on this PC. To let others join from the internet, you need" -ForegroundColor DarkGray
Write-Host "  a public link. Two common ways:" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  1. Port forwarding (your router):" -ForegroundColor DarkGray
Write-Host "     - Find your public IP (e.g. search 'what is my IP')." -ForegroundColor DarkGray
Write-Host "     - In your router settings, forward port $PORT to this PC's IP." -ForegroundColor DarkGray
Write-Host "     - Your link: " -NoNewline -ForegroundColor DarkGray
Write-Host "http://YOUR_PUBLIC_IP:$PORT/play" -ForegroundColor Cyan
Write-Host "     - Example: http://203.0.113.42:$PORT/play" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  2. A tunnel (no router changes):" -ForegroundColor DarkGray
Write-Host "     - ngrok: run " -NoNewline -ForegroundColor DarkGray
Write-Host "ngrok http $PORT" -ForegroundColor Cyan
Write-Host "       (install from https://ngrok.com). You get a URL like https://abc123.ngrok-free.app" -ForegroundColor DarkGray
Write-Host "       Share: " -NoNewline -ForegroundColor DarkGray
Write-Host "https://abc123.ngrok-free.app/play" -ForegroundColor Cyan
Write-Host "     - Similar: Play.it, localtunnel, cloudflared - they give you a public URL to localhost." -ForegroundColor DarkGray
Write-Host ""
Write-Host "  If you don't have a link yet, press Enter. You can set this up later and share from the hub." -ForegroundColor DarkGray
$PLAY_URL = Read-Host "  Paste your share link (or Enter to skip)"
if ($PLAY_URL) { $PLAY_URL = $PLAY_URL.Trim() } else { $PLAY_URL = "" }
Write-Host ""

# Install - user friendly
Write-Host "  First time here? We can install everything the hub needs." -ForegroundColor White
Write-Host "  (Press Enter for yes - recommended. Type n only if you already ran this before.)" -ForegroundColor DarkGray
$installPrompt = Read-Host "  Install? (Enter = yes, n = skip)"
$doInstall = $installPrompt -notmatch '^n$|^N$'

Write-Host ""

$HubPath = Join-Path $Root "hub"
$AppPath = Join-Path $Root "hub\app"

# [1/5] Node
Invoke-Step -Num 1 -Total 5 -StepName "Checking Node..." -Block {
  try {
    $v = node -v 2>&1
    if ($LASTEXITCODE -ne 0) { throw "not found" }
  } catch {
    throw "Node.js wasn't found. Install it from https://nodejs.org (pick the LTS version), then run this again."
  }
  Write-OK "Node $v"
}

if ($doInstall) {
  Invoke-Step -Num 2 -Total 5 -StepName "Installing hub dependencies..." -Block {
    Push-Location $HubPath
    try {
      if (Test-Path "package-lock.json") { npm ci 2>&1 | Out-Null } else { npm install 2>&1 | Out-Null }
      if ($LASTEXITCODE -ne 0) { throw "npm failed" }
      Write-OK "Hub dependencies ready"
    } finally { Pop-Location }
  }

  Invoke-Step -Num 3 -Total 5 -StepName "Installing UI dependencies..." -Block {
    Push-Location $AppPath
    try {
      if (Test-Path "package-lock.json") { npm ci 2>&1 | Out-Null } else { npm install 2>&1 | Out-Null }
      if ($LASTEXITCODE -ne 0) { throw "npm failed" }
      Write-OK "UI dependencies ready"
    } finally { Pop-Location }
  }

  Invoke-Step -Num 4 -Total 5 -StepName "Building UI..." -Block {
    Push-Location $HubPath
    try {
      npm run build:ui 2>&1 | Out-Null
      if ($LASTEXITCODE -ne 0) { throw "build:ui failed" }
      Write-OK "UI built"
    } finally { Pop-Location }
  }
} else {
  Write-Step "Skipping hub dependencies" 2 5
  Write-Step "Skipping UI dependencies" 3 5
  Write-Step "Skipping UI build" 4 5
}

# [5/5] Start
Write-Step "Starting Hub..." 5 5

$lanIp = Get-LocalIPv4
$activeGame = Get-ActiveGameId

Write-Host ""
Write-Host "  All set! Open these in your browser:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Home (your hub):     " -NoNewline -ForegroundColor DarkGray
Write-Host "http://localhost:$PORT/" -ForegroundColor Cyan
if ($lanIp) {
  Write-Host "  Home (for friends):   " -NoNewline -ForegroundColor DarkGray
  Write-Host "http://${lanIp}:$PORT/" -ForegroundColor Cyan
}
Write-Host "  Pick a game (admin): " -NoNewline -ForegroundColor DarkGray
Write-Host "http://localhost:$PORT/admin" -ForegroundColor Cyan
Write-Host "  Play the game:       " -NoNewline -ForegroundColor DarkGray
Write-Host "http://localhost:$PORT/play" -ForegroundColor Cyan
if ($PLAY_URL) {
  Write-Host "  Share with friends:  " -NoNewline -ForegroundColor DarkGray
  Write-Host $PLAY_URL -ForegroundColor Cyan
}
Write-Host ""
Write-Host "  Current game: " -NoNewline -ForegroundColor DarkGray
Write-Host $activeGame -ForegroundColor Cyan
Write-Host ""
Write-Host "  To stop the hub, press Ctrl+C in this window." -ForegroundColor DarkGray
Write-Host ""

$env:PORT = $PORT
if ($PLAY_URL) { $env:PLAY_URL = $PLAY_URL }

Push-Location $HubPath
try {
  node src/index.js
} catch {
  Write-Fail "Hub failed to start." $_.Exception.Message
} finally {
  Pop-Location
}
