#!/bin/bash

# ====================================================
#   SysNotes Dependency Downloader (Linux / macOS)
# ====================================================

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

echo "===================================================="
echo " SysNotes Dependency Downloader"
echo "===================================================="
echo "This script will download required Python packages"
echo "into the offline_packages folder for offline install."
echo "Note: Run this on a machine WITH internet access."
echo ""

mkdir -p "$SCRIPT_DIR/offline_packages"

# Download packages for the current platform
pip download -r "$SCRIPT_DIR/requirements.txt" -d "$SCRIPT_DIR/offline_packages"

echo ""
echo "Download complete! You can now copy this entire folder to the offline server."
