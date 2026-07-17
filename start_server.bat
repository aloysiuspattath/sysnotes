@echo off
set PYTHON_BIN=python
set SCRIPT=app.py
if exist venv\Scripts\python.exe (
    set PYTHON_BIN=venv\Scripts\python.exe
    set SCRIPT=run_prod.py
)
echo Starting SysNotes Server...
start "SysNotesServer" cmd /k "title SysNotesServer && %PYTHON_BIN% %SCRIPT%"
echo Server started.
