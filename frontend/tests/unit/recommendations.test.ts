/**
 * Unit tests for `buildRecommendations`. The function is pure and has
 * no React / DOM dependencies, so we can call it directly with the
 * existing fixtures and a hand-built `DatasetUploadResponse`.
 *
 * These tests focus on the FOUR new data-quality branches added in
 * Gap 3 — the original five (fit, ANOVA, t-tests, top predictor,
 * Cook's) keep working because the early `return recs` in each
 * branch hasn't moved.
 */

import { describe, expect, it } from "vitest";

import { buildRecommendations } from "@/components/recommendations/recommendations-panel";
import type { DatasetUploadResponse, TrainResponse } from "@/lib/types";

import { trainResponseFixture } from "../msw/fixtures";

const baseStat = {
  mean: 0,
  median: 0,
  std: 1,
  min: 0,
  max: 1,
  missing: 0,
  unique: 30,
};

function makeDataset(
  overrides: Partial<DatasetUploadResponse> = {},
): DatasetUploadResponse {
  const cols = ["YearsExperience", "Salary"];
  return {
    dataset_id: "ds_test",
    filename: "test.csv",
    columns: cols,
    numeric_columns: cols,
    categorical_columns: [],
    dtypes: { YearsExperience: "float64", Salary: "float64" },
    shape: [30, cols.length],
    missing: { YearsExperience: 0, Salary: 0 },
    preview: [],
    stats: {
      YearsExperience: { ...baseStat },
      Salary: { ...baseStat, std: 25_000 },
    },
    correlation_matrix: { columns: cols, matrix: [[1, 0.97], [0.97, 1]] },
    created_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("buildRecommendations — original five branches", () => {
  it("emits exactly five recommendations when dataset is omitted", () => {
    const recs = buildRecommendations(trainResponseFixture);
    expect(recs).toHaveLength(5);
    expect(recs.map((r) => r.id)).toEqual([
      "fit",
      "anova",
      "ttests",
      "top-predictor",
      "cooks",
    ]);
  });
});

describe("buildRecommendations — Gap 3 data-quality branches", () => {
  it("flags missing values with INFO tone when ≤ 5% are missing", () => {
    const dataset = makeDataset({
      shape: [100, 2],
      missing: { YearsExperience: 4, Salary: 0 }, // 4% missing
    });
    const recs = buildRecommendations(trainResponseFixture, dataset);
    const missing = recs.find((r) => r.id === "dq-missing");
    expect(missing).toBeDefined();
    expect(missing?.tone).toBe("info");
    expect(missing?.title).toMatch(/Missing values/);
  });

  it("flags missing values with WARNING tone when > 5% are missing", () => {
    const dataset = makeDataset({
      shape: [100, 2],
      missing: { YearsExperience: 12, Salary: 0 }, // 12% missing
    });
    const recs = buildRecommendations(trainResponseFixture, dataset);
    const missing = recs.find((r) => r.id === "dq-missing");
    expect(missing?.tone).toBe("warning");
  });

  it("does not emit a missing-values rec when nothing is missing", () => {
    const dataset = makeDataset({ missing: { YearsExperience: 0, Salary: 0 } });
    const recs = buildRecommendations(trainResponseFixture, dataset);
    expect(recs.find((r) => r.id === "dq-missing")).toBeUndefined();
  });

  it("warns about tiny datasets (< 30 rows)", () => {
    const dataset = makeDataset({ shape: [12, 2] });
    const recs = buildRecommendations(trainResponseFixture, dataset);
    const small = recs.find((r) => r.id === "dq-small");
    expect(small).toBeDefined();
    expect(small?.tone).toBe("warning");
    expect(small?.title).toMatch(/12 rows/);
  });

  it("does not warn about sample size when n ≥ 30", () => {
    const dataset = makeDataset({ shape: [30, 2] });
    const recs = buildRecommendations(trainResponseFixture, dataset);
    expect(recs.find((r) => r.id === "dq-small")).toBeUndefined();
  });

  it("flags near-constant predictors (unique ≤ 2)", () => {
    const dataset = makeDataset({
      stats: {
        YearsExperience: { ...baseStat, unique: 2 },
        Salary: { ...baseStat },
      },
    });
    const recs = buildRecommendations(trainResponseFixture, dataset);
    const nc = recs.find((r) => r.id === "dq-near-constant");
    expect(nc).toBeDefined();
    expect(nc?.title).toMatch(/YearsExperience/);
  });

  it("flags scale disparity when max(std)/min(std) > 100", () => {
    const trainTwoX: TrainResponse = {
      ...trainResponseFixture,
      x_cols: ["a", "b"],
    };
    const dataset = makeDataset({
      shape: [100, 3],
      stats: {
        a: { ...baseStat, std: 0.01 },
        b: { ...baseStat, std: 50 }, // 5000× larger
      },
      missing: { a: 0, b: 0 },
    });
    const recs = buildRecommendations(trainTwoX, dataset);
    const scale = recs.find((r) => r.id === "dq-scale");
    expect(scale).toBeDefined();
    expect(scale?.tone).toBe("info");
  });

  it("does not flag scale disparity when ratios are reasonable", () => {
    const trainTwoX: TrainResponse = {
      ...trainResponseFixture,
      x_cols: ["a", "b"],
    };
    const dataset = makeDataset({
      shape: [100, 3],
      stats: {
        a: { ...baseStat, std: 1 },
        b: { ...baseStat, std: 5 }, // only 5×
      },
      missing: { a: 0, b: 0 },
    });
    const recs = buildRecommendations(trainTwoX, dataset);
    expect(recs.find((r) => r.id === "dq-scale")).toBeUndefined();
  });

  it("appends multiple data-quality recs when several conditions trigger", () => {
    const dataset = makeDataset({
      shape: [10, 2], // tiny
      missing: { YearsExperience: 3, Salary: 0 }, // 30% missing
    });
    const recs = buildRecommendations(trainResponseFixture, dataset);
    const ids = recs.map((r) => r.id);
    expect(ids).toContain("dq-missing");
    expect(ids).toContain("dq-small");
    // Original five still present.
    expect(ids).toContain("fit");
    expect(ids).toContain("anova");
  });
});
