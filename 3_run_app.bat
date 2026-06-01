@echo off
echo =============================================
echo  Sysadmin Commands & Notes App - Launcher
echo =============================================
echo  Starting Flask server on http://0.0.0.0:5005
echo  Access it at: http://localhost:5005
echo  Press Ctrl+C to stop.
echo =============================================
echo.
call venv\Scripts\activate.bat
python app.py
pause
