@echo off
echo ====================================================
echo   SysNotes Server Startup
echo ====================================================
echo.
echo Starting Production Web Server...
echo.

python "%~dp0run_prod.py"

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] The server crashed or failed to start.
    echo Make sure Python is installed and you have run install.bat first!
    pause
)
