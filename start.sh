#!/usr/bin/env bash
# Smart Regression System :: backend launcher (Unix)
set -euo pipefail

cd "$(dirname "$0")/backend"

if [ ! -d venv ]; then
  echo "[start.sh] Creating virtual environment..."
  # Prefer python3.12 (contract-pinned); fall back to 3.11; fail otherwise.
  if command -v python3.12 >/dev/null 2>&1; then
    python3.12 -m venv venv
  elif command -v python3.11 >/dev/null 2>&1; then
    python3.11 -m venv venv
  else
    echo "[start.sh] ERROR: Python 3.11 or 3.12 is required but not found on PATH."
    exit 1
  fi
fi

# shellcheck disable=SC1091
source venv/bin/activate

echo "[start.sh] Installing dependencies..."
pip install --quiet -r requirements.txt

if [ ! -f .env ]; then
  echo "[start.sh] .env not found, copying from .env.example"
  cp .env.example .env
fi

echo "[start.sh] Starting FastAPI on http://localhost:8000"
exec uvicorn main:app --reload --host 0.0.0.0 --port 8000
