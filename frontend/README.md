# Smart Regression System — Frontend

Production-grade analytics dashboard for the Smart Regression System. Consumes the FastAPI backend described in `../backEnd.md` at `/api/v1/*` — **no statistics are recomputed on the client.**

> **Contract stability:** This UI is pinned to `/api/v1`. Breaking schema changes require a `/api/v2` route on the backend.

## Stack (mandatory)

| Concern | Library |
|---|---|
| Framework | Next.js 14 App Router + React 18 + TypeScript 5 |
| Styling | Tailwind CSS 3.4 |
| Primitives | shadcn/ui (Radix) |
| Icons | lucide-react |
| Data fetching | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Client state | Zustand (`persist` to `sessionStorage`) |
| Charts (standard) | Recharts |
| Charts (heatmap / advanced) | Apache ECharts via `echarts-for-react` |
| Theme | next-themes |
| Toasts | sonner |
| Animation | Framer Motion |
| Unit tests | Vitest + React Testing Library |
| API mocks | MSW |
| E2E | Playwright |
| Lint / format | ESLint (`next/core-web-vitals`) + Prettier |

## Prerequisites

- **Node.js 20+** (tested with Node 24). Install via `winget install OpenJS.NodeJS.LTS` on Windows.
- Backend running at `http://localhost:8000`. Start it from the repo root with `.\start.bat` (Windows) or `./start.sh` (Unix).

## Setup

```bash
cd frontend
npm install
copy .env.example .env.local      # or: cp .env.example .env.local
npm run dev
```

Open <http://localhost:3000>. The badge in the top-right reflects live `/api/v1/health` status.

## Environment

`.env.example`:

```text
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_MAX_UPLOAD_MB=25
```

Any change to `NEXT_PUBLIC_*` requires restarting `npm run dev`.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start the Next.js dev server on :3000 with Fast Refresh. |
| `npm run build` | Production build. |
| `npm run start` | Run the production build. |
| `npm run lint` | ESLint (`next/core-web-vitals`). |
| `npm run type-check` | `tsc --noEmit`. |
| `npm run test` | Vitest unit tests. |
| `npm run test:watch` | Vitest in watch mode. |
| `npm run test:e2e` | Playwright E2E (auto-starts `next dev`). |
| `npm run format` | Prettier across the repo. |

CI gate: `lint`, `type-check`, `test`, `build` must pass; Playwright happy path green.

## Project layout

```
frontend/
├── app/
│   ├── layout.tsx            # Root layout + Providers + fonts
│   ├── page.tsx              # Dashboard shell
│   ├── loading.tsx
│   ├── error.tsx
│   └── globals.css           # Tailwind + design tokens (brand navy + gold)
├── components/
│   ├── providers.tsx         # TanStack Query + next-themes + Toaster
│   ├── layout/               # HealthIndicator, ThemeToggle, sidebar, step progress (M2+)
│   └── ui/                   # shadcn primitives: button, card, badge, skeleton, …
├── lib/
│   ├── api.ts                # Typed fetch client + ApiError
│   ├── types.ts              # 1:1 mirror of backend Pydantic schemas
│   ├── query-client.ts       # TanStack Query config
│   ├── formatters.ts         # Number / percent / p-value / scientific
│   └── utils.ts              # cn()
├── hooks/
│   └── use-health.ts         # More hooks added in M2–M4
├── store/
│   └── workflow-store.ts     # Zustand + sessionStorage persist
├── tests/
│   ├── setup.ts              # Vitest + jest-dom
│   ├── unit/                 # Vitest unit tests
│   └── e2e/                  # Playwright specs (M5)
├── components.json           # shadcn config
├── tailwind.config.ts        # Brand tokens, chart palette
├── playwright.config.ts
├── vitest.config.ts
└── .env.example
```

## Backend contract (consumed as-is)

Defined in `lib/types.ts`. Mirrors every Pydantic schema from the backend exactly — field names, optionality, enum values. If a display needs a field the backend does not provide, see **Backend Change Requests** below.

Endpoints used:

- `GET  /health`
- `POST /datasets/upload` (multipart)
- `GET  /datasets/{dataset_id}`
- `POST /models/train`
- `GET  /models/{model_id}`
- `POST /models/{model_id}/predict`
- `GET  /models/{model_id}/report.pdf`

Errors are parsed into `ApiError { status, code, detail, field? }`. Typical codes: `validation_error`, `invalid_data`, `dataset_not_found`, `model_not_found`, `singular_matrix`, `categorical_x_unsupported`, `file_too_large`.

## Milestone status

| Milestone | Scope | State |
|---|---|---|
| **M1** | Scaffold, types, API client, workflow store, theme, health indicator | ✅ Complete |
| **M2** | Step 1 (Upload) + Step 2 (Model Config) | ✅ Complete |
| **M3** | Step 3 — Visualizations (6 charts) | ✅ Complete |
| **M4** | Step 4 (Results + Prediction) + Step 5 (Report + PDF export) | ✅ Complete |
| **M5** | MSW integration tests, Playwright happy path, polish | ✅ Complete |
| **M6** | Manual data entry · Recommendations button · Data-quality recs · CarPrice sample | ✅ Complete |

## Sample datasets (`csv_test/`)

Bundled CSV files for quick demos. All are public-domain or hand-curated.

| File | Rows | Suggested target | Use case |
|---|---|---|---|
| `Salary_Data.csv` | 30 | `Salary` | Simple linear regression — single predictor (`YearsExperience`). |
| `Advertising.csv` | 200 | `Sales` | Multiple regression — three predictors (`TV`, `Radio`, `Newspaper`). |
| `housing.csv` | 20,640 | `median_house_value` | California housing — 8 numeric predictors (location, rooms, income, …) plus one categorical `ocean_proximity` column. |
| `CarPrice.csv` | 30 | `Price_USD` | Car-price prediction — `Year`, `Mileage_km`, `Engine_L`, `Horsepower`, `Owners`. Hand-curated for demos and the manual-entry tab parity check. |
| `weatherHistory.csv` | many | `Temperature (C)` | Stress-test for the upload pipeline with a larger file. |

## Backend Change Requests

None. The contract currently covers every planned visualization. If a future milestone needs data not present in the backend schemas, log it here with:

- The component that needs it.
- The exact proposed field name.
- The minimal schema change required in `backEnd.md`.

Do **not** recompute missing statistics client-side.

