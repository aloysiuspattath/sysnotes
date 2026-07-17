@echo off
set PORT=5005
if exist .env (
    for /f "tokens=2 delims==" %%i in ('findstr /I "PORT=" .env') do set PORT=%%i
)
echo Stopping SysNotes Server on port %PORT%...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr "LISTENING" ^| findstr ":%PORT%"') do (
    taskkill /F /PID %%a
)
echo Server stopped.
