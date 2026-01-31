@echo off
setlocal
cd /d "%~dp0"
title OpenArcade Dev Launcher

set "LAUNCHER=%~dp0scripts\start-dev.ps1"
if not exist "%LAUNCHER%" (
  echo.
  echo   Dev launcher script not found: scripts\start-dev.ps1
  echo.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%LAUNCHER%"

echo.
echo   Dev launcher stopped.
echo.
pause
endlocal
