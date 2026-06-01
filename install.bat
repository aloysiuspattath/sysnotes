@echo off
echo ====================================================
echo   SysNotes Offline Dependencies Installer
echo ====================================================
echo.
echo Creating Python Virtual Environment (venv)...
python -m venv "%~dp0venv"
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to create virtual environment. Make sure Python is installed and added to PATH.
    pause
    exit /b %errorlevel%
)

echo Activating Virtual Environment...
call "%~dp0venv\Scripts\activate.bat"

echo.
echo Installing Python packages from the offline_packages folder...
echo.

python -m pip install --no-index --find-links="%~dp0offline_packages" -r "%~dp0requirements.txt"

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to install dependencies.
    pause
    exit /b %errorlevel%
)

echo.
echo [SUCCESS] All dependencies installed successfully inside the virtual environment!
echo You can now run start_server.bat to boot the production server.
echo.
pause
