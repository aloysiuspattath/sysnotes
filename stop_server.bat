@echo off
echo Stopping SysNotes Server...
taskkill /FI "WINDOWTITLE eq SysNotesServer*" /T /F
echo Server stopped.
