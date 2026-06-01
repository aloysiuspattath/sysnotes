@echo off
echo ========================================================
echo Sysadmin Commands & Notes App - Dependency Downloader
echo ========================================================
echo This script will download all required Python packages
echo into the "packages" folder for offline installation later.
echo Note: You MUST run this on a machine WITH internet access.
echo.

if not exist packages mkdir packages
pip download -r requirements.txt -d packages

echo.
echo Download complete!
echo You can now copy this entire project folder to the offline server.
pause
