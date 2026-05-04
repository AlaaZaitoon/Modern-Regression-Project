/**
 * Default MSW handlers. Tests may override any of these with
 * `server.use(...)` to exercise error paths (404, validation_error, etc.).
 *
 * The base URL must match `NEXT_PUBLIC_API_URL` (defaults to
 * http://localhost:8000/api/v1 — defined in `lib/api.ts`).
 */

import { HttpResponse, http } from "msw";

import type { ErrorResponse, PredictRequest, TrainRequest } from "@/lib/types";

import {
  datasetFixture,
  healthFixture,
  makePredictResponse,
  trainResponseFixture,
} from "./fixtures";

export const BASE_URL = "http://localhost:8000/api/v1";

/** Build a backend-shape error payload. */
export function errorPayload(
  status: number,
  code: string,
  detail: string,
  field?: string,
) {
  const body: ErrorResponse = { detail, code, field: field ?? null };
  return HttpResponse.json(body, { status });
}

export const defaultHandlers = [
  http.get(`${BASE_URL}/health`, () => HttpResponse.json(healthFixture)),

  http.post(`${BASE_URL}/datasets/upload`, () => {
    // We deliberately don't inspect the multipart body here — the jsdom
    // FormData global isn't round-trip compatible with undici's request
    // parser. Contract-level multipart validation is covered by the
    // Playwright E2E that hits the real FastAPI backend.
    return HttpResponse.json(datasetFixture);
  }),

  http.get(`${BASE_URL}/datasets/:datasetId`, ({ params }) => {
    if (params.datasetId !== datasetFixture.dataset_id) {
      return errorPayload(404, "dataset_not_found", "Dataset not found.");
    }
    return HttpResponse.json(datasetFixture);
  }),

  http.post(`${BASE_URL}/models/train`, async ({ request }) => {
    const body = (await request.json()) as TrainRequest;
    if (!body.x_cols || body.x_cols.length === 0) {
      return errorPayload(
        422,
        "validation_error",
        "At least one predictor is required.",
        "x_cols",
      );
    }
    return HttpResponse.json({
      ...trainResponseFixture,
      dataset_id: body.dataset_id,
      x_cols: body.x_cols,
      y_col: body.y_col,
      model_type: body.model_type,
    });
  }),

  http.get(`${BASE_URL}/models/:modelId`, ({ params }) => {
    if (params.modelId !== trainResponseFixture.model_id) {
      return errorPayload(404, "model_not_found", "Model not found.");
    }
    return HttpResponse.json(trainResponseFixture);
  }),

  http.post(`${BASE_URL}/models/:modelId/predict`, async ({ params, request }) => {
    if (params.modelId !== trainResponseFixture.model_id) {
      return errorPayload(404, "model_not_found", "Model not found.");
    }
    const body = (await request.json()) as PredictRequest;
    const x = Number(body.x_values.YearsExperience ?? 0);
    return HttpResponse.json(makePredictResponse(x));
  }),
];
