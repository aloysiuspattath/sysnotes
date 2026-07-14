@echo off
echo Restarting SysNotes Server...
call stop_server.bat
timeout /t 2 /nobreak >nul
call start_server.bat
echo Restart complete.
