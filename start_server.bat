@echo off
echo ====================================================
echo   SysNotes Server Startup
echo ====================================================
echo.

if not exist "%~dp0venv\Scripts\activate.bat" (
    echo [ERROR] Virtual environment not found! 
    echo Please double-click install.bat first to set it up.
    echo.
    pause
    exit /b 1
)

echo Activating Virtual Environment...
call "%~dp0venv\Scripts\activate.bat"

echo.
echo Starting Production Web Server...
echo.

python "%~dp0run_prod.py"

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] The server crashed or failed to start.
    pause
)
