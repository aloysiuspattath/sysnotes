#!/bin/bash

# ====================================================
#   SysNotes Server Startup (Linux / macOS)
# ====================================================

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
VENV_DIR="$SCRIPT_DIR/venv"

if [ ! -f "$VENV_DIR/bin/activate" ]; then
    echo "[ERROR] Virtual environment not found!"
    echo "Please run ./install.sh first to set it up."
    exit 1
fi

echo "Activating Virtual Environment..."
source "$VENV_DIR/bin/activate"

echo ""
echo "Starting Production Web Server (Waitress)..."
echo ""

python "$SCRIPT_DIR/run_prod.py"
