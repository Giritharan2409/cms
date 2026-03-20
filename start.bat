@echo off
setlocal EnableDelayedExpansion

set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%backend"
set "PYTHON_CMD="

if exist "%ROOT_DIR%.venv\Scripts\python.exe" (
  set "PYTHON_CMD=%ROOT_DIR%.venv\Scripts\python.exe"
) else (
  where py >nul 2>nul
  if !errorlevel! EQU 0 (
    set "PYTHON_CMD=py"
  ) else (
    where python >nul 2>nul
    if !errorlevel! EQU 0 (
      set "PYTHON_CMD=python"
    )
  )
)

if not defined PYTHON_CMD (
  echo [ERROR] Python was not found. Install Python or create .venv before running this script.
  exit /b 1
)

echo [INFO] Using Python command: %PYTHON_CMD%

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

echo [1/4] Installing frontend dependencies...
call npm install
if errorlevel 1 (
  echo Frontend dependency installation failed.
  exit /b 1
)

if exist "%BACKEND_DIR%\requirements.txt" (
  echo [2/4] Backend will run with FastAPI Python stack.
  echo [3/4] Installing backend Python dependencies...
  cd /d "%BACKEND_DIR%"
  call "%PYTHON_CMD%" -m pip install -r requirements.txt
  if errorlevel 1 (
    echo Backend dependency installation failed.
    exit /b 1
  )
) else (
  echo [3/4] Skipping backend Python dependency install - requirements.txt not found.
)

echo [4/4] Starting backend and frontend servers...

if exist "%BACKEND_DIR%\main.py" (
  start "MIT Connect Backend (FastAPI)" cmd /k "cd /d "%ROOT_DIR%" && "%PYTHON_CMD%" -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 5000"
) else (
  echo backend\main.py not found. FastAPI backend was not started.
)

start "MIT Connect Frontend" cmd /k "cd /d ""%ROOT_DIR%"" && npm run dev"

echo.
echo Both services were started in separate terminal windows.
echo Close those windows to stop the servers.
echo.

endlocal
