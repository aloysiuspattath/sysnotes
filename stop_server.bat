@echo off
echo ====================================================
echo   SysNotes Server Stopper (Windows)
echo ====================================================
echo.
echo Searching for process running on port 5005...

set "pid="
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5005') do (
    set "pid=%%a"
)

if "%pid%"=="" (
    echo [INFO] No active SysNotes server found on port 5005.
) else (
    echo Found process ID: %pid%
    echo Killing process...
    taskkill /f /pid %pid%
    if %errorlevel% equ 0 (
        echo [SUCCESS] SysNotes server has been stopped.
    ) else (
        echo [ERROR] Failed to stop the process.
    )
)

echo.
pause
