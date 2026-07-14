@echo off
echo Starting SysNotes Server...
start "SysNotesServer" cmd /k "title SysNotesServer && python app.py"
echo Server started.
