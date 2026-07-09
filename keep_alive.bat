@echo off
:loop
echo Starting SysNotes Server and SSL Proxy...
venv\Scripts\python start_all.py
echo Server ended. Restarting in 1 second...
timeout /t 1 /nobreak >nul
goto loop
