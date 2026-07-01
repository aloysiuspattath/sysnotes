#!/bin/bash

# ====================================================
#   SysNotes Installer (Linux / macOS)
# ====================================================

echo "===================================================="
echo " SysNotes Offline/Online Dependencies Installer"
echo "===================================================="

# Check if python3 is installed
if ! command -v python3 &> /dev/null; then
    echo ""
    echo "[ERROR] Python 3 is not installed or not in PATH."
    exit 1
fi

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
VENV_DIR="$SCRIPT_DIR/venv"

echo "Creating Python Virtual Environment (venv)..."
python3 -m venv "$VENV_DIR"
if [ $? -ne 0 ]; then
    echo ""
    echo "[ERROR] Failed to create virtual environment."
    exit 1
fi

echo "Activating Virtual Environment..."
source "$VENV_DIR/bin/activate"

echo ""
echo "Installing Python packages..."
echo ""

# Try offline installation first
if [ -d "$SCRIPT_DIR/offline_packages" ]; then
    echo "Attempting offline installation from offline_packages..."
    pip install --no-index --find-links="$SCRIPT_DIR/offline_packages" -r "$SCRIPT_DIR/requirements.txt"
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "[SUCCESS] Dependencies installed successfully offline!"
        echo "You can now run ./start_server.sh to boot the production server."
        exit 0
    else
        echo ""
        echo "[WARNING] Offline installation failed (likely due to platform-specific packages)."
        echo "Attempting online installation fallback from PyPI..."
    fi
fi

# Fallback to online installation
pip install -r "$SCRIPT_DIR/requirements.txt"
if [ $? -ne 0 ]; then
    echo ""
    echo "[ERROR] Failed to install dependencies online."
    exit 1
fi

echo ""
echo "[SUCCESS] Dependencies installed successfully online!"
echo "You can now run ./start_server.sh to boot the production server."
exit 0
