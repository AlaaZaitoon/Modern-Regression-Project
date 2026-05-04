# How to Run — Smart Regression & Data Insight System

End-to-end runbook for local development. The project is a two-tier app:
**FastAPI** backend (Python) on `:8000` and **Next.js 14** frontend on `:3000`.

---

## 1. Prerequisites

| Tool | Version | Check |
|---|---|---|
| Python | 3.12 (or 3.11) | `python --version` |
| Node.js | 18 LTS or newer | `node --version` |
| npm | 9+ | `npm --version` |
| PowerShell | 5.1+ (Windows default) | — |

> ⚠️ **Avoid Python 3.13 / 3.14** for now — several scientific wheels
> (NumPy / SciPy / pandas) don't have public binaries for those yet.

---

## 2. One-time setup

### 2a. Backend

```powershell
cd "c:\Users\Alaa Zaitoon\Desktop\Modern Regression Project\backend"
py -3.12 -m venv venv
.\venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt
```

### 2b. Frontend

```powershell
cd "c:\Users\Alaa Zaitoon\Desktop\Modern Regression Project\frontend"
npm install
```

### 2c. (Optional) Playwright browsers

Only needed if you'll run the end-to-end test:

```powershell
npx playwright install chromium
```

---

## 3. Daily run

### Option A — One-click launcher (recommended)

Double-click **`start.bat`** at the repo root (or run it from PowerShell).
It will:

1. Activate the backend venv and install any new dependencies
2. Start the **FastAPI backend** on `:8000` in a new terminal window
3. Install any new frontend packages with `npm install`
4. Start the **Next.js frontend** on `:3000` in a new terminal window
5. **Open your browser** at `http://localhost:3000` automatically

```powershell
cd "c:\Users\Alaa Zaitoon\Desktop\Modern Regression Project"
.\start.bat        # Windows
./start.sh         # macOS / Linux
```

> Close the terminal windows to stop the servers.

### Option B — Manual (two terminals)

If you prefer running each service separately:

#### Terminal 1 · Backend (`:8000`)

```powershell
cd "c:\Users\Alaa Zaitoon\Desktop\Modern Regression Project\backend"
.\venv\Scripts\Activate.ps1
python -m uvicorn main:app --reload --port 8000
```

Smoke-test:

- Health: <http://localhost:8000/api/v1/health>
- Swagger UI: <http://localhost:8000/docs>

#### Terminal 2 · Frontend (`:3000`)

```powershell
cd "c:\Users\Alaa Zaitoon\Desktop\Modern Regression Project\frontend"
npm run dev
```

Open: <http://localhost:3000>

> The frontend polls `/api/v1/health` and shows a **Backend offline**
> badge in the header if `:8000` isn't reachable.

---

## 4. Using the app

The dashboard is a 5-step workflow:

| Step | What you do |
|---|---|
| **1 — Add data** | Upload a CSV via drag-and-drop **or** type a small dataset in the manual-entry tab. |
| **2 — Configure** | Pick the target (Y), one or more predictors (X), and Simple/Multiple regression → **Train**. |
| **3 — Visualize** | Six interactive charts (scatter + regression line, actual vs predicted, residuals, feature importance, Cook's distance, correlation heatmap). |
| **4 — Results** | Equation, animated R² gauge, ANOVA, t-tests, confidence intervals, prediction form, **Generate recommendations** button. |
| **5 — Report** | Open `/report?model=<id>` (print-ready) or download the backend-generated PDF. |

### Sample datasets (in `csv_test/`)

| File | Suggested target | Use case |
|---|---|---|
| `Salary_Data.csv` | `Salary` | Simple linear regression. |
| `Advertising.csv` | `Sales` | Multiple regression, 3 predictors. |
| `housing.csv` | `price` | House-price prediction. |
| `CarPrice.csv` | `Price_USD` | Car-price prediction (5 predictors). |
| `weatherHistory.csv` | `Temperature (C)` | Stress-test for the upload pipeline. |

---

## 5. Available scripts

### Frontend (run from `frontend/`)

| Command | Purpose |
|---|---|
| `npm run dev` | Start the dev server on `:3000`. |
| `npm run build` | Production build; checks the 250 kB First Load JS budget. |
| `npm run start` | Serve the production build. |
| `npm run type-check` | `tsc --noEmit` — fails on any TypeScript error. |
| `npm run lint` | ESLint + Prettier. |
| `npm run test` | Vitest unit + integration suite (44 tests, MSW-mocked). |
| `npm run test:watch` | Vitest watch mode. |
| `npm run test:ui` | Vitest browser UI. |
| `npm run test:e2e` | Playwright happy-path E2E (needs the backend running). |
| `npm run format` | Prettier write-mode for the whole repo. |

### Backend (run from `backend/` with the venv active)

| Command | Purpose |
|---|---|
| `python -m uvicorn main:app --reload --port 8000` | Dev server with autoreload. |
| `pytest` | Run the backend test suite. |

---

## 6. Quick sanity check (≈ 30 seconds)

```powershell
# 1. Backend up
curl http://localhost:8000/api/v1/health

# 2. Frontend up
# Open http://localhost:3000 → should show Step 1 (Add a dataset)

# 3. Full frontend test suite
cd "c:\Users\Alaa Zaitoon\Desktop\Modern Regression Project\frontend"
npm run test          # expect 44 / 44 passing
npm run build         # expect / = 207 kB First Load JS
```

---

## 7. Architecture cheat-sheet

```
┌──────────────────────────────────────┐        ┌─────────────────────────────┐
│  Frontend  (Next.js 14, App Router)  │  HTTP  │  Backend  (FastAPI)         │
│                                      │ ─────▶ │                             │
│  • Tailwind + shadcn/ui              │        │  • pandas / numpy / scipy   │
│  • Zustand (in-memory only)          │  JSON  │  • In-memory dataset/model  │
│  • TanStack Query (HTTP cache)       │ ◀───── │    registries (no DB)       │
│  • ECharts (lazy-loaded)             │        │  • ReportLab → PDF export   │
│  • Framer Motion (R² gauge only)     │        │                             │
└──────────────────────────────────────┘        └─────────────────────────────┘
                                   localhost:3000  ─▶  localhost:8000/api/v1
```

**Key rules baked into the codebase**

- Backend is the only source of statistical truth.
  The frontend **never** computes R², MSE, t-stats, etc.
- Zustand has **no `persist` middleware** — state lives only in the
  active browser tab. Reports passed to a new tab use
  `?model=<id>` and re-fetch from the backend.
- Every ECharts component is `next/dynamic` with `ssr:false`.

---

## 8. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Header shows **Backend offline** | Backend isn't running on `:8000`, or CORS / firewall is blocking the health probe. Restart Terminal 1. |
| `model_not_found` toast on prediction | Backend was restarted — its in-memory model registry is empty. The UI will redirect you to Step 2 to retrain. |
| Charts blank or page white | Hard refresh (`Ctrl+Shift+R`) so the lazy ECharts chunk reloads. |
| Print PDF prints all white | Open the print dialog → **More settings → Background graphics: ON**. This toggles `print-color-adjust`. |
| `/report` says "No model loaded" | The store is empty in the new tab. Make sure you opened it via the **Step 5 → Open report in new tab** button (which appends `?model=<id>`). |
| `pip install` fails on a wheel | You're on Python 3.13/3.14 — switch to 3.12. |
| Port 3000 / 3001 / 8000 already in use | See **§ 8.1 Freeing a busy port** below. |
| `npx playwright install` is slow | One-time download (~150 MB). Re-run if it fails partway through. |

### 8.1 Freeing a busy port (3000 / 3001 / 8000)

Symptoms you'll see:

- `npm run dev` prints **"Port 3000 is in use, trying 3001 instead."** — Next.js fell back, but then the backend's CORS allow-list (which only includes `http://localhost:3000`) blocks the API and the header shows **Backend offline**.
- `uvicorn` exits with **`[Errno 10048] Only one usage of each socket address`** on `:8000`.

Always try the **clean way first**:

1. In every open terminal where a server is running, press **`Ctrl + C`** and confirm with **`Y`** if asked.
2. Close any leftover **PowerShell / CMD windows** that the `start.bat` launcher opened (each has a green-on-black banner from `uvicorn` or `next`).
3. If you have **Docker Desktop** or **another Next.js / FastAPI project** running, stop those — they're the most common silent culprits.

If the port is **still** held by a zombie process, use one of the snippets below.

#### Option A — find and kill by PID (works on any Windows)

Replace `3000` with `3001` or `8000` as needed.

```powershell
# 1. Find the process holding the port — last column is the PID
netstat -ano | findstr :3000

# 2. Kill it (use the PID from step 1)
taskkill /PID <pid> /F
```

#### Option B — one-liner that frees a single port

```powershell
# Kill whatever is listening on :3000 (PowerShell 5+)
Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

#### Option C — nuke all three project ports at once

```powershell
Get-NetTCPConnection -LocalPort 3000,3001,8000 -State Listen -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

#### Option D — last resort: kill every Node / Python dev server

> ⚠️ This will also stop **other** Node or Python apps on your machine. Use only if A–C fail.

```powershell
taskkill /IM node.exe /F
taskkill /IM python.exe /F
```

#### Verify the port is free

```powershell
netstat -ano | findstr :3000
# (no output = port is free, you can start the server again)
```

#### If you really must run on a different port

The frontend's API base URL and the backend's CORS allow-list are hard-wired to `localhost:3000` ↔ `localhost:8000`. If you change either, update **both**:

- Backend: `backend/.env` → `CORS_ORIGINS` must include the new frontend URL.
- Frontend: `frontend/.env.local` → `NEXT_PUBLIC_API_BASE_URL` must point to the new backend URL.

Then restart **both** servers. (Otherwise the **Backend offline** badge will stay red even though both are technically running.)

---

## 9. Test inventory (44 tests, all green)

| Suite | Tests | Type |
|---|---|---|
| `tests/unit/workflow-store.test.ts` | 4 | Unit — Zustand state transitions |
| `tests/unit/formatters.test.ts` | 10 | Unit — number / R² band helpers |
| `tests/unit/recommendations.test.ts` | 10 | Unit — `buildRecommendations` (incl. data-quality branches) |
| `tests/integration/api-client.test.ts` | 11 | Integration — typed API client × MSW |
| `tests/integration/predict-form.test.tsx` | 3 | Integration — RHF + Zod + mutation |
| `tests/integration/manual-entry.test.tsx` | 4 | Integration — manual data-entry grid |
| `tests/integration/recommendations-trigger.test.tsx` | 2 | Integration — recommendations button gating |
| `tests/e2e/happy-path.spec.ts` | 1 | Playwright — Upload → Configure → Visualize → Results → Predict → Report |

---

## 10. Stopping everything

```powershell
# Each terminal: Ctrl + C
# Or kill anything still listening:
Get-NetTCPConnection -LocalPort 3000,8000 -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```
