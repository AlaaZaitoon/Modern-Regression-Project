@echo off
REM Smart Regression System :: backend launcher (Windows)
setlocal

pushd "%~dp0backend"

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

echo [start.bat] Installing dependencies...
pip install --quiet -r requirements.txt || goto :error

if not exist .env (
  echo [start.bat] .env not found, copying from .env.example
  copy /Y .env.example .env >NUL
)

echo [start.bat] Starting FastAPI on http://localhost:8000
uvicorn main:app --reload --host 0.0.0.0 --port 8000
goto :eof

:error
echo [start.bat] FAILED
popd
exit /b 1
