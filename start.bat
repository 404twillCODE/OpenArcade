@echo off
setlocal
cd /d "%~dp0"
title OpenArcade Launcher

set "LAUNCHER=%~dp0scripts\start.ps1"
if not exist "%LAUNCHER%" (
  echo.
  echo   Launcher script not found: scripts\start.ps1
  echo.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%LAUNCHER%"

echo.
echo   Server stopped.
echo.
pause
endlocal
