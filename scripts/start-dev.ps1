#Requires -Version 5.1
<#
.SYNOPSIS
  OpenArcade Dev Launcher - hub + website in one window. No prompts; kills ports, installs, builds, starts both, then shows clean summary. Press R to relaunch.
  Called by start-dev.bat in repo root.
#>

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
$HubPath = Join-Path $Root "hub"
$AppPath = Join-Path $Root "hub\app"
$WebsitePath = Join-Path $Root "website"
$Script:AlreadyOpenedBrowsers = $false
$Script:LastLaunchTime = $null

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
  param([string]$Text, [int]$Num, [int]$Total = 6)
  Write-Host "  [$Num/$Total] " -NoNewline -ForegroundColor DarkGray
  Write-Host $Text -ForegroundColor White
}

function Write-OK { param([string]$Text) Write-Host "        " -NoNewline; Write-Host $Text -ForegroundColor DarkGray }
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

function Focus-BrowserWindow {
  try {
    $shell = New-Object -ComObject WScript.Shell
    # Try to activate by window title (partial match) - Chrome/Edge often have "localhost" or "OpenArcade" in the title
    $titles = @("localhost", "OpenArcade", "Chrome", "Microsoft Edge")
    foreach ($t in $titles) {
      if ($shell.AppActivate($t)) { return }
    }
    # Fallback: bring first browser process with a main window to foreground
    try {
      Add-Type -TypeDefinition @"
    using System;
    using System.Runtime.InteropServices;
    public class Win32SetForeground {
      [DllImport("user32.dll")]
      public static extern bool SetForegroundWindow(IntPtr hWnd);
    }
"@ -ErrorAction Stop
    } catch {
      if ($_.Exception.Message -notmatch "already exists") { throw }
    }
    $browsers = @("chrome", "msedge", "firefox")
    foreach ($name in $browsers) {
      $procs = Get-Process -Name $name -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne [IntPtr]::Zero }
      # Prefer a process whose window title contains localhost or OpenArcade
      $proc = $procs | Where-Object { $_.MainWindowTitle -match "localhost|OpenArcade" } | Select-Object -First 1
      if (-not $proc) { $proc = $procs | Select-Object -First 1 }
      if ($proc) {
        [void][Win32SetForeground]::SetForegroundWindow($proc.MainWindowHandle)
        break
      }
    }
  } catch { }
}

function Stop-Ports {
  foreach ($p in @(3000, 5173)) {
    try {
      Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue | Where-Object { $_.State -eq "Listen" } | ForEach-Object {
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
      }
    } catch { }
  }
  Start-Sleep -Seconds 2
}

function Get-SourceFilesMaxWriteTime {
  $paths = @(
    (Join-Path $HubPath "app\src"),
    (Join-Path $WebsitePath "src")
  )
  $max = $null
  foreach ($p in $paths) {
    if (Test-Path $p) {
      $files = Get-ChildItem -Path $p -Recurse -File -ErrorAction SilentlyContinue
      foreach ($f in $files) {
        if ($null -eq $max -or $f.LastWriteTime -gt $max) { $max = $f.LastWriteTime }
      }
    }
  }
  return $max
}

function Test-SourceFilesChangedSince {
  param([DateTime]$Since)
  if ($null -eq $Since) { return $false }
  $max = Get-SourceFilesMaxWriteTime
  if ($null -eq $max) { return $false }
  return $max -gt $Since
}

function Show-Summary {
  $host.UI.RawUI.WindowTitle = "OpenArcade Dev Launcher"
  Clear-Host
  Write-Host ""
  Write-Host "  All set! Open these in your browser:" -ForegroundColor Cyan
  Write-Host ""
  Write-Host "  Home (your hub):       " -NoNewline -ForegroundColor DarkGray
  Write-Host "http://localhost:3000/" -ForegroundColor Cyan
  Write-Host "  Pick a game (admin):   " -NoNewline -ForegroundColor DarkGray
  Write-Host "http://localhost:3000/admin" -ForegroundColor Cyan
  Write-Host "  Play the game:         " -NoNewline -ForegroundColor DarkGray
  Write-Host "http://localhost:3000/play" -ForegroundColor Cyan
  Write-Host "  Website (dev):         " -NoNewline -ForegroundColor DarkGray
  Write-Host "http://localhost:5173/OpenArcade/" -ForegroundColor Cyan
  Write-Host ""
  Write-Host "  GitHub:                " -NoNewline -ForegroundColor DarkGray
  Write-Host "https://github.com/404twillCODE/OpenArcade" -ForegroundColor Cyan
  Write-Host "  GitHub Pages site:     " -NoNewline -ForegroundColor DarkGray
  Write-Host "https://404twillcode.github.io/OpenArcade/" -ForegroundColor Cyan
  Write-Host ""
  if ($Script:LastLaunchTime -ne $null -and (Test-SourceFilesChangedSince -Since $Script:LastLaunchTime)) {
    Write-Host "  Source files changed. Press R to relaunch and pick up changes." -ForegroundColor Yellow
    Write-Host ""
  }
  Write-Host "  Press R to relaunch, or any other key to close." -ForegroundColor DarkGray
  Write-Host ""
  $Script:LastLaunchTime = Get-Date
}

function Run-DevLauncher {
  Clear-Host
  $host.UI.RawUI.WindowTitle = "OpenArcade Dev Launcher"
  Write-Header "OpenArcade Dev Launcher" "Hub + website"

  # [1/6] Node
  Write-Step "Checking Node..." 1 6
  try {
    $v = node -v 2>&1
    if ($LASTEXITCODE -ne 0) { throw "not found" }
  } catch {
    Write-Fail "Node.js wasn't found." "Install from https://nodejs.org (LTS), then run again."
  }
  Write-OK "Node $v"

  # [2/6] Free ports
  Write-Step "Freeing ports 3000 and 5173..." 2 6
  Stop-Ports
  Write-OK "Ports ready"

  # [3/6] Hub install + build
  Write-Step "Installing and building hub..." 3 6
  Push-Location $HubPath
  try {
    if (Test-Path "package-lock.json") { npm ci 2>&1 | Out-Null } else { npm install 2>&1 | Out-Null }
    if ($LASTEXITCODE -ne 0) { throw "hub install failed" }
    npm run build:ui 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "build:ui failed" }
    Write-OK "Hub ready"
  } finally { Pop-Location }

  Write-Step "Starting hub in background..." 4 6
  Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "set PORT=3000 && node src/index.js" -WorkingDirectory $HubPath -WindowStyle Hidden -PassThru | Out-Null
  Start-Sleep -Milliseconds 500

  # [5/6] Website install
  Write-Step "Installing website..." 5 6
  Push-Location $WebsitePath
  try {
    if (Test-Path "package-lock.json") { npm ci 2>&1 | Out-Null } else { npm install 2>&1 | Out-Null }
    if ($LASTEXITCODE -ne 0) { throw "website install failed" }
    Write-OK "Website ready"
  } finally { Pop-Location }

  Write-Step "Starting website in background..." 6 6
  $websiteProc = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory $WebsitePath -WindowStyle Hidden -PassThru
  Write-OK "Servers starting"

  Write-Host ""
  Write-Host "  Waiting for servers to be ready..." -ForegroundColor DarkGray
  Start-Sleep -Seconds 8

  # Only open browser tabs if we haven't already this session (avoids duplicate tabs on R relaunch)
  if (-not $Script:AlreadyOpenedBrowsers) {
    # Website first, then hub
    Start-Process "http://localhost:5173/OpenArcade/"
    Start-Process "http://localhost:3000/"
    $Script:AlreadyOpenedBrowsers = $true
  } else {
    # Already opened: bring browser back to foreground
    Focus-BrowserWindow
  }

  Show-Summary
}

do {
  Run-DevLauncher
  $key = [System.Console]::ReadKey($true).KeyChar
} while ($key -eq "r" -or $key -eq "R")

Write-Host "  Bye." -ForegroundColor DarkGray
Write-Host ""
