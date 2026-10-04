@echo off
echo ===================================================
echo SafeSight AI - AI-Powered Workplace Safety Platform
echo ===================================================
echo.

cd /d "%~dp0"

echo [1/3] Setting up Backend...
cd backend
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)
call venv\Scripts\activate.bat
echo Installing backend dependencies...
pip install -r requirements.txt
cd ..

echo [2/3] Setting up Frontend...
cd frontend
if not exist node_modules (
    echo Installing frontend dependencies...
    call npm install
)
echo Building frontend...
call npm run build
cd ..

echo [3/3] Starting Application...
start http://127.0.0.1:8000
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000
pause
