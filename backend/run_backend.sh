#!/bin/bash
# Start script for TBM Backend API Server
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

echo "Checking Python dependencies..."
python3 -m pip install -q -r requirements.txt

echo "Starting Flask Server on http://localhost:5000..."
python3 app.py
