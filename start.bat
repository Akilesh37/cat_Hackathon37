@echo off
setlocal

cd /d "%~dp0"

echo [CAT Safety Copilot] Checking prerequisites...
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH.
    pause
    exit /b 1
)

where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: Python is not installed or not in PATH.
    pause
    exit /b 1
)

where docker >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: Docker is not installed or not in PATH. Postgres and Redis require Docker.
    pause
    exit /b 1
)

if not exist ".env" (
    echo WARNING: .env file is missing in the root directory! Application may lack required API keys.
)

echo [CAT Safety Copilot] Starting databases (Postgres, Redis)...
docker-compose up -d

echo [CAT Safety Copilot] Checking and installing Backend dependencies...
if not exist "backend\venv" (
    echo Creating Python virtual environment in backend\venv...
    python -m venv backend\venv
)
call backend\venv\Scripts\activate.bat
if not exist "backend\venv\Lib\site-packages\fastapi" (
    echo Installing backend dependencies...
    pip install -r backend\requirements.txt
) else (
    echo Backend dependencies already installed.
)
deactivate

echo [CAT Safety Copilot] Checking and installing Frontend dependencies...
if not exist "frontend\node_modules" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
) else (
    echo Frontend dependencies already installed.
)

echo [CAT Safety Copilot] Checking ports...
netstat -ano | findstr :8000 | findstr LISTENING >nul
if %ERRORLEVEL% equ 0 (
    echo WARNING: Port 8000 is already in use. Backend may fail to start.
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000 ^| findstr LISTENING') do echo Process ID holding port 8000: %%a
)
netstat -ano | findstr :3000 | findstr LISTENING >nul
if %ERRORLEVEL% equ 0 (
    echo WARNING: Port 3000 is already in use. Frontend may fail to start.
    for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do echo Process ID holding port 3000: %%a
)

echo [CAT Safety Copilot] Starting Services...
:: Note: The Simulator and RAG service are integrated as modules/tasks within the FastAPI backend process.
:: They will start automatically with the backend.
echo Starting Backend (includes Simulator and RAG)...
start "CAT-Backend" cmd /k "cd backend && call venv\Scripts\activate.bat && python main.py"

:: Wait briefly for the backend to initialize before starting the frontend
timeout /t 5 /nobreak >nul

echo Starting Frontend...
start "CAT-Frontend" cmd /k "cd frontend && npm run dev"

echo [CAT Safety Copilot] Waiting for frontend to become available...
timeout /t 5 /nobreak >nul
start http://localhost:3000

echo All services started successfully!
endlocal
