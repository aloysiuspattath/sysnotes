@echo off
:loop
echo Starting SysNotes Server...
venv\Scripts\python run_prod.py
echo Server ended. Restarting in 1 second...
timeout /t 1 /nobreak >nul
goto loop
