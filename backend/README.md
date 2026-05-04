# Smart Regression System — Backend

Production-grade FastAPI service providing dataset profiling, simple/multiple linear regression training, prediction, and PDF report export.

> **Contract stability:** The API under `/api/v1/...` is stable. Breaking changes require mounting a new `/api/v2` prefix. The frontend (see `../frontEnd.md`) consumes this contract as-is.

## Requirements

- Python **3.11+**
- pip

## Setup (local venv)

From the repository root:

```bash
# Windows
.\start.bat

# macOS / Linux
./start.sh
```

Or manually:

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Unix:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env         # Windows: copy .env.example .env
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Then open:

- Swagger UI: <http://localhost:8000/docs>
- ReDoc: <http://localhost:8000/redoc>
- Health: <http://localhost:8000/api/v1/health>

## Setup (Docker)

```bash
cd backend
docker build -t srs-backend:1.0.0 .
docker run --rm -p 8000:8000 --env-file .env srs-backend:1.0.0
```

## Environment variables

See `.env.example`. All are overridable via OS env vars.

| Variable | Default | Purpose |
|---|---|---|
| `APP_ENV` | `development` | `development` \| `production` |
| `API_V1_PREFIX` | `/api/v1` | Route prefix |
| `CORS_ORIGINS` | `http://localhost:3000,http://localhost:5173,http://localhost:8080` | CSV list |
| `MAX_UPLOAD_MB` | `25` | Upload size limit |
| `MAX_ROWS` | `200000` | Maximum rows per CSV |
| `REGISTRY_TTL_MINUTES` | `120` | In-memory dataset/model lifetime |
| `LOG_LEVEL` | `INFO` | Python logging level |
| `VERSION` | `1.0.0` | Reported by `/health` |

## API endpoints

All routes are mounted under `/api/v1`.

### `GET /health`

```bash
curl http://localhost:8000/api/v1/health
```

### `POST /datasets/upload`

```bash
curl -F "file=@csv_test/housing.csv" http://localhost:8000/api/v1/datasets/upload
```

Returns `DatasetUploadResponse` (see OpenAPI docs for full schema). Key fields:

- `dataset_id` — use in subsequent train calls
- `numeric_columns`, `categorical_columns`
- `preview` (first 10 rows), `stats`, `missing`
- `correlation_matrix` (Pearson, all numeric columns)

### `GET /datasets/{dataset_id}`

Retrieve the cached profile. `404` if expired.

### `POST /models/train`

```bash
curl -X POST http://localhost:8000/api/v1/models/train \
  -H "Content-Type: application/json" \
  -d '{
    "dataset_id": "<id>",
    "x_cols": ["sqft"],
    "y_col": "price",
    "model_type": "simple",
    "confidence_level": 0.95
  }'
```

Returns `TrainResponse` with coefficients, metrics, ANOVA, t-tests, CIs, feature importance, correlation matrix (restricted to `x_cols + [y_col]`), Cook's distance, and per-sample predictions (each containing `x_values`, `y_actual`, `y_predicted`, `residual`).

### `GET /models/{model_id}`

Retrieve the cached training result. `404` if expired.

### `POST /models/{model_id}/predict`

```bash
curl -X POST http://localhost:8000/api/v1/models/<model_id>/predict \
  -H "Content-Type: application/json" \
  -d '{"x_values": {"sqft": 1800}}'
```

Returns `PredictResponse` with `prediction`, `prediction_interval`, `confidence_level`, and a pre-formatted `interpretation` string (the frontend must render this verbatim).

### `GET /models/{model_id}/report.pdf`

```bash
curl -o report.pdf http://localhost:8000/api/v1/models/<model_id>/report.pdf
```

Streams a `reportlab`-generated PDF.

## Error model

Every non-2xx response has the shape:

```json
{"detail": "...", "code": "...", "field": "..."}
```

Codes currently emitted: `validation_error`, `invalid_data`, `dataset_not_found`, `model_not_found`, `singular_matrix`, `categorical_x_unsupported`, `file_too_large`, `internal_error`.

## Tests

```bash
cd backend
pip install -r requirements-dev.txt
pytest -q
```

Tests cover:

- Health endpoint
- Upload happy path + rejections
- Train happy path, multiple regression, validation errors
- Numerical accuracy against `scikit-learn.LinearRegression`
- Predict + prediction interval
- PDF export

## How the frontend connects

- Base URL: `http://localhost:8000/api/v1`
- The frontend types in `frontend/lib/types.ts` mirror the Pydantic schemas in `backend/schemas/` exactly.
- Do not modify field names or types within `v1`.

## Known limitations (v1)

- **Ephemeral in-memory storage** — all datasets and models are lost on restart or after `REGISTRY_TTL_MINUTES`. Swap the `Registry` class in `state.py` for Redis/Postgres in a future revision.
- **Numeric-only X variables** — categorical X columns are rejected with `categorical_x_unsupported`. Encoding (one-hot, target-encoding) is intentionally out of scope to keep the statistical contract unambiguous.
- **No authentication** — reserved for `v2` (`Authorization: Bearer ...`).

## Project layout

```
backend/
  main.py
  config.py
  state.py
  routers/        health, datasets, models
  schemas/        common, dataset, model
  services/       data_service, regression_service, report_service
  utils/          errors, json_safe
  tests/          conftest + test_* files
  requirements.txt
  requirements-dev.txt
  .env.example
  Dockerfile
  README.md
```
