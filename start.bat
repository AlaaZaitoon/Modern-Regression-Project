@echo off
REM ================================================================
REM  Smart Regression System :: Full-Stack Launcher (Windows)
REM  Starts both Backend (FastAPI) and Frontend (Next.js) together.
REM  Press Ctrl+C in either window to stop that service.
REM ================================================================
setlocal

set "ROOT=%~dp0"

REM ── Backend Setup & Launch ─────────────────────────────────────
echo.
echo ========================================
echo   Starting Backend (FastAPI)...
echo ========================================

pushd "%ROOT%backend"

if not exist venv (
  echo [start.bat] Creating virtual environment...
  REM Prefer Python 3.12 (contract-pinned); fall back to 3.11; fail otherwise.
  py -3.12 -c "import sys" >NUL 2>&1 && (
    py -3.12 -m venv venv || goto :error
  ) || py -3.11 -c "import sys" >NUL 2>&1 && (
    py -3.11 -m venv venv || goto :error
  ) || (
    echo [start.bat] ERROR: Python 3.11 or 3.12 is required. Install via: winget install Python.Python.3.12
    goto :error
  )
)

call venv\Scripts\activate.bat || goto :error

echo [start.bat] Installing backend dependencies...
pip install --quiet -r requirements.txt || goto :error

if not exist .env (
  echo [start.bat] .env not found, copying from .env.example
  copy /Y .env.example .env >NUL
)

REM Launch backend in a NEW window (so this script continues)
echo [start.bat] Backend starting on http://localhost:8000
start "Backend - FastAPI" cmd /k "cd /d "%ROOT%backend" && venv\Scripts\activate.bat && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

popd

REM ── Frontend Setup & Launch ────────────────────────────────────
echo.
echo ========================================
echo   Starting Frontend (Next.js)...
echo ========================================

pushd "%ROOT%frontend"

if not exist node_modules (
  echo [start.bat] Installing frontend dependencies...
  npm install || goto :error
)

REM Launch frontend in a NEW window
echo [start.bat] Frontend starting on http://localhost:3000
start "Frontend - Next.js" cmd /k "cd /d "%ROOT%frontend" && npm run dev"

popd

REM ── Done ───────────────────────────────────────────────────────
echo.
echo ========================================
echo   All services started!
echo ========================================
echo.
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:3000
echo   API Docs: http://localhost:8000/docs
echo.
echo   Close the terminal windows to stop.
echo ========================================

REM Open the frontend in the default browser after a short delay
timeout /t 3 /nobreak >NUL
start http://localhost:3000

goto :eof

:error
echo [start.bat] FAILED
popd
exit /b 1
