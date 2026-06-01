@echo off
echo ========================================================
echo Sysadmin Commands & Notes App - Offline Setup
echo ========================================================
echo This script will create a virtual environment and
echo install the required packages from the "packages" folder.
echo Note: This can be run WITHOUT internet access.
echo.

if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo Installing packages offline...
pip install --no-index --find-links=packages -r requirements.txt

echo.
echo Setup complete!
echo To run the app, type:
echo   call venv\Scripts\activate.bat
echo   python app.py
echo.
pause
