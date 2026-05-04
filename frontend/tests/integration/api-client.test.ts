/**
 * Integration tests for the typed API client (`lib/api.ts`) exercised
 * against MSW-mocked backend responses. Covers the happy path for every
 * endpoint plus the most important error codes so changes to the
 * ErrorResponse → ApiError mapping can't silently regress.
 */

import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";

import { ApiError, api } from "@/lib/api";

import { BASE_URL, errorPayload } from "../msw/handlers";
import { DATASET_ID, MODEL_ID, datasetFixture, trainResponseFixture } from "../msw/fixtures";
import { server } from "../msw/server";

describe("api client — happy path", () => {
  it("hits /health", async () => {
    const res = await api.health();
    expect(res.status).toBe("ok");
    expect(res.version).toBe("1.0.0");
  });

  it("uploads a dataset via multipart", async () => {
    const file = new File(["a,b\n1,2\n"], "tiny.csv", { type: "text/csv" });
    const res = await api.uploadDataset(file);
    // The handler echoes the fixture; we mainly want to confirm the
    // multipart envelope was accepted (the Content-Type check in the
    // handler would 400 otherwise).
    expect(res.dataset_id).toBe(DATASET_ID);
    expect(res.numeric_columns).toContain("YearsExperience");
  });

  it("fetches a dataset by id", async () => {
    const res = await api.getDataset(DATASET_ID);
    expect(res).toEqual(datasetFixture);
  });

  it("trains a model and echoes the request shape", async () => {
    const res = await api.trainModel({
      dataset_id: DATASET_ID,
      x_cols: ["YearsExperience"],
      y_col: "Salary",
      model_type: "simple",
      confidence_level: 0.95,
    });
    expect(res.model_id).toBe(MODEL_ID);
    expect(res.metrics.r2).toBeCloseTo(0.957, 3);
    expect(res.equation_str).toMatch(/Salary/);
  });

  it("predicts from a model id", async () => {
    const res = await api.predict(MODEL_ID, { YearsExperience: 5 });
    // 25792.2 + 9449.96 * 5 = 73042
    expect(res.prediction).toBeCloseTo(73042, 0);
    expect(res.prediction_interval[0]).toBeLessThan(res.prediction);
    expect(res.prediction_interval[1]).toBeGreaterThan(res.prediction);
  });

  it("builds the PDF URL with the correct base", () => {
    expect(api.exportPdfUrl(MODEL_ID)).toBe(
      `${BASE_URL}/models/${MODEL_ID}/report.pdf`,
    );
  });
});

describe("api client — error mapping", () => {
  it("maps a structured 404 to ApiError with code + status", async () => {
    server.use(
      http.get(`${BASE_URL}/models/:id`, () =>
        errorPayload(404, "model_not_found", "Model not found."),
      ),
    );
    await expect(api.getModel("missing")).rejects.toMatchObject({
      name: "ApiError",
      status: 404,
      code: "model_not_found",
      message: "Model not found.",
    });
  });

  it("maps a 422 validation_error to ApiError with field", async () => {
    server.use(
      http.post(`${BASE_URL}/models/train`, () =>
        errorPayload(422, "validation_error", "x_cols required.", "x_cols"),
      ),
    );
    try {
      await api.trainModel({
        dataset_id: DATASET_ID,
        x_cols: [],
        y_col: "Salary",
        model_type: "simple",
      });
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      const apiErr = err as ApiError;
      expect(apiErr.status).toBe(422);
      expect(apiErr.code).toBe("validation_error");
      expect(apiErr.field).toBe("x_cols");
    }
  });

  it("synthesizes a network_error when fetch throws", async () => {
    server.use(
      http.get(`${BASE_URL}/health`, () => HttpResponse.error()),
    );
    await expect(api.health()).rejects.toMatchObject({
      status: 0,
      code: "network_error",
    });
  });

  it("maps an unparseable non-2xx payload to http_<status>", async () => {
    server.use(
      http.get(`${BASE_URL}/health`, () =>
        new HttpResponse("<html>gateway</html>", { status: 502 }),
      ),
    );
    await expect(api.health()).rejects.toMatchObject({
      status: 502,
      code: "http_502",
    });
  });

  it("uses the training fixture's correlation matrix on success", async () => {
    const res = await api.getModel(MODEL_ID);
    expect(res.correlation_matrix.columns).toEqual(
      trainResponseFixture.correlation_matrix.columns,
    );
  });
});
