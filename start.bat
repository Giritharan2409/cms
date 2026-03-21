@echo off
setlocal EnableDelayedExpansion

set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%backend"
set "FRONTEND_DIR=%ROOT_DIR%frontend"
set "PYTHON_CMD="
set "BACKEND_APP="

if exist "%ROOT_DIR%..\.venv\Scripts\python.exe" (
  set "PYTHON_CMD=%ROOT_DIR%..\.venv\Scripts\python.exe"
) else if exist "%ROOT_DIR%.venv\Scripts\python.exe" (
  set "PYTHON_CMD=%ROOT_DIR%.venv\Scripts\python.exe"
) else (
  for /f "delims=" %%P in ('where python 2^>nul') do (
    set "PYTHON_CMD=%%P"
    goto :python_found
  )
)

:python_found

if not defined PYTHON_CMD (
  echo [ERROR] Python was not found. Install Python or create .venv before running this script.
  exit /b 1
)

echo [INFO] Using Python command: %PYTHON_CMD%

if exist "%BACKEND_DIR%\main.py" (
  set "BACKEND_APP=main:app"
) else if exist "%BACKEND_DIR%\app.py" (
  set "BACKEND_APP=app:app"
) else (
  echo [ERROR] backend\main.py or backend\app.py not found. FastAPI backend cannot start.
  exit /b 1
)

echo [INFO] Backend entrypoint: %BACKEND_APP%

if not defined MONGODB_URI (
  set "MONGODB_URI=mongodb://localhost:27017/College_db"
  echo [INFO] MONGODB_URI not set. Defaulting to local MongoDB: mongodb://localhost:27017/College_db
  echo [INFO] Set MONGODB_URI in your environment or a .env file to use a different database.
)

echo =============================================
echo MIT Connect startup script
echo =============================================
echo.

cd /d "%ROOT_DIR%"
if errorlevel 1 (
  echo Failed to switch to root directory.
  exit /b 1
)

if not exist "%FRONTEND_DIR%\package.json" (
  echo frontend\package.json not found. Frontend startup cannot continue.
  exit /b 1
)

echo [1/5] Installing frontend dependencies...
cd /d "%FRONTEND_DIR%"
call npm install
if errorlevel 1 (
  echo Frontend dependency installation failed.
  exit /b 1
)

if exist "%BACKEND_DIR%\requirements.txt" (
  echo [2/5] Backend will run with FastAPI Python stack.
  echo [3/5] Installing backend Python dependencies...
  cd /d "%BACKEND_DIR%"
  call "%PYTHON_CMD%" -m pip install -r requirements.txt
  if errorlevel 1 (
    echo Backend dependency installation failed.
    exit /b 1
  )
) else (
  echo [3/5] Skipping backend Python dependency install - requirements.txt not found.
)

echo [4/5] Cleaning up any existing processes on port 8000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do (
  taskkill /PID %%a /F 2>nul
)
timeout /t 1 /nobreak

echo [4/5] Starting backend server...
start "MIT Connect Backend (FastAPI)" /D "%BACKEND_DIR%" powershell -NoExit -ExecutionPolicy Bypass -Command ^
  "try { & '%PYTHON_CMD%' -m uvicorn %BACKEND_APP% --host 127.0.0.1 --port 8000 } catch { Write-Host 'Backend failed' ; Read-Host 'Press Enter to exit' }"

timeout /t 2 /nobreak

echo [5/5] Starting frontend server...
start "MIT Connect Frontend" /D "%FRONTEND_DIR%" cmd /k "npm run dev"

echo.
echo =============================================
echo Both services are starting in separate windows
echo =============================================
echo Frontend: http://localhost:5173
echo Backend API: http://localhost:8000
echo Backend Docs: http://localhost:8000/docs
echo.
echo Please wait 5-10 seconds for services to fully initialize.
echo Close terminal windows to stop servers.
echo.

endlocal
