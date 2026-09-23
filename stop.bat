@echo off
setlocal

cd /d "%~dp0"

echo [CAT Safety Copilot] Stopping Docker containers...
docker-compose down

echo [CAT Safety Copilot] Closing service windows...
taskkill /FI "WINDOWTITLE eq CAT-Backend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq CAT-Frontend*" /T /F >nul 2>&1

echo [CAT Safety Copilot] Freeing specific application ports...

:: Free Backend port (8000)
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8000" ^| find "LISTENING"') do (
    echo Terminating PID %%a holding Port 8000...
    taskkill /PID %%a /T /F >nul 2>&1
)

:: Free Frontend port (3000)
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do (
    echo Terminating PID %%a holding Port 3000...
    taskkill /PID %%a /T /F >nul 2>&1
)

echo [CAT Safety Copilot] All services and ports have been stopped and freed successfully.
endlocal
