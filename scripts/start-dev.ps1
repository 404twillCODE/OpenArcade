#Requires -Version 5.1
<#
.SYNOPSIS
  OpenArcade dev launcher - start hub only (no install/build).
  For developers. Called from scripts folder. Do not run directly unless you know what you're doing.
#>

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
$HubPath = Join-Path $Root "hub"

Write-Host ""
Write-Host "  OpenArcade Dev" -ForegroundColor Cyan
Write-Host "  Start hub only (skips install and build)" -ForegroundColor DarkGray
Write-Host ""

$portPrompt = Read-Host "  PORT [3000]"
$PORT = if ([string]::IsNullOrWhiteSpace($portPrompt)) { "3000" } else { $portPrompt.Trim() }

$env:PORT = $PORT

Write-Host ""
Write-Host "  Landing: http://localhost:$PORT/" -ForegroundColor Cyan
Write-Host "  Admin:   http://localhost:$PORT/admin" -ForegroundColor Cyan
Write-Host "  Play:    http://localhost:$PORT/play" -ForegroundColor Cyan
Write-Host ""

Push-Location $HubPath
try {
  node src/index.js
} finally {
  Pop-Location
}
