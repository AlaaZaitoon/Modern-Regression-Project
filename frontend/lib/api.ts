/**
 * Typed HTTP client for the Smart Regression System backend.
 *
 * Usage:
 *   import { api } from "@/lib/api";
 *   const health = await api.health();
 *
 * All methods return parsed JSON matching `lib/types.ts`. Any non-2xx
 * response is thrown as an `ApiError` whose shape mirrors the backend's
 * `ErrorResponse` schema.
 */

import type {
  DatasetUploadResponse,
  ErrorResponse,
  HealthResponse,
  PredictResponse,
  TrainRequest,
  TrainResponse,
} from "@/lib/types";

const DEFAULT_BASE_URL = "http://localhost:8000/api/v1";

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL?.trim();
  return url && url.length > 0 ? url.replace(/\/$/, "") : DEFAULT_BASE_URL;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly field?: string | null;

  constructor(status: number, code: string, detail: string, field?: string | null) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.field = field;
  }
}

async function parseJsonSafe<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) {
    throw new ApiError(res.status, "empty_response", "Empty response body from backend.");
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError(res.status, "invalid_json", "Backend returned non-JSON payload.");
  }
}

async function handle<T>(res: Response): Promise<T> {
  if (res.ok) {
    return parseJsonSafe<T>(res);
  }
  let err: ErrorResponse | null = null;
  try {
    err = (await res.json()) as ErrorResponse;
  } catch {
    // Fallthrough to a synthetic error below.
  }
  if (err && typeof err.detail === "string" && typeof err.code === "string") {
    throw new ApiError(res.status, err.code, err.detail, err.field ?? null);
  }
  throw new ApiError(res.status, `http_${res.status}`, `Request failed with status ${res.status}.`);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  let res: Response;
  try {
    res = await fetch(url, { ...init, cache: "no-store" });
  } catch (cause) {
    throw new ApiError(
      0,
      "network_error",
      `Unable to reach backend at ${url}. Is the FastAPI server running?`,
    );
  }
  return handle<T>(res);
}

export const api = {
  health(): Promise<HealthResponse> {
    return request<HealthResponse>("/health");
  },

  uploadDataset(file: File): Promise<DatasetUploadResponse> {
    const body = new FormData();
    body.append("file", file);
    return request<DatasetUploadResponse>("/datasets/upload", {
      method: "POST",
      body,
    });
  },

  getDataset(datasetId: string): Promise<DatasetUploadResponse> {
    return request<DatasetUploadResponse>(`/datasets/${encodeURIComponent(datasetId)}`);
  },

  trainModel(req: TrainRequest): Promise<TrainResponse> {
    return request<TrainResponse>("/models/train", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
  },

  getModel(modelId: string): Promise<TrainResponse> {
    return request<TrainResponse>(`/models/${encodeURIComponent(modelId)}`);
  },

  predict(modelId: string, xValues: Record<string, number>): Promise<PredictResponse> {
    return request<PredictResponse>(`/models/${encodeURIComponent(modelId)}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ x_values: xValues }),
    });
  },

  /**
   * PDF export returns a direct URL; the browser streams it via an
   * anchor `href` + `download` attribute — no blob fetching needed.
   */
  exportPdfUrl(modelId: string): string {
    return `${getBaseUrl()}/models/${encodeURIComponent(modelId)}/report.pdf`;
  },
};

export type Api = typeof api;
