@echo off
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel%==0 (
  py -3 local_server.py
  goto :done
)
where python >nul 2>nul
if %errorlevel%==0 (
  python local_server.py
  goto :done
)
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0local_server.ps1"
:done
if errorlevel 1 pause
