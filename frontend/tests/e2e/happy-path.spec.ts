/**
 * End-to-end happy path — Upload → Configure → Visualize → Results →
 * Predict → Report. Uses the real FastAPI backend on :8000, so make sure
 * `uvicorn main:app --port 8000` is running before `npm run test:e2e`.
 *
 * Dataset: `csv_test/Salary_Data.csv` at the repo root (30 rows, two
 * numeric columns). Simple linear regression → R² ≈ 0.957.
 */

import path from "node:path";
import { expect, test } from "@playwright/test";

const SALARY_CSV = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "csv_test",
  "Salary_Data.csv",
);

test.describe("happy path", () => {
  test("completes all five steps and renders the report", async ({ page }) => {
    // 1 — Upload --------------------------------------------------------
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /smart regression/i })).toBeVisible();

    // The dropzone exposes a hidden <input type="file">. Set files directly.
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(SALARY_CSV);

    await expect(page.getByText(/YearsExperience/i).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Salary/i).first()).toBeVisible();

    // 2 — Configure -----------------------------------------------------
    await page.getByRole("button", { name: /continue|configure/i }).first().click();

    // Pick YearsExperience as X and Salary as Y. The form uses shadcn
    // Selects (Radix), whose options are rendered in a portal.
    await page.getByLabel(/target|y column/i).click();
    await page.getByRole("option", { name: "Salary" }).click();

    await page.getByLabel(/predictor|x column/i).click();
    await page.getByRole("option", { name: "YearsExperience" }).click();

    await page.getByRole("button", { name: /train/i }).click();

    // 3 — Visualize -----------------------------------------------------
    await expect(page.getByRole("heading", { name: /visualizations/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole("tab", { name: /scatter/i })).toBeVisible();
    await page.getByRole("button", { name: /continue to results/i }).click();

    // 4 — Results + predict --------------------------------------------
    await expect(page.getByRole("heading", { name: /results/i })).toBeVisible();
    await expect(page.getByText(/Salary = /i)).toBeVisible();

    // The R² should be roughly 95.7%. Assert on a stable substring.
    await expect(page.getByText(/95\./).first()).toBeVisible();

    const yearsInput = page.getByLabel("YearsExperience");
    await yearsInput.fill("7");
    await page.getByRole("button", { name: /predict/i }).click();
    await expect(page.getByText(/predicted salary/i)).toBeVisible({ timeout: 10_000 });

    // 5 — Report --------------------------------------------------------
    await page.getByRole("button", { name: /continue to report/i }).click();
    await expect(page.getByRole("heading", { name: /report/i })).toBeVisible();

    // Opening in a new tab is nicer for humans but clutters the test —
    // navigate directly instead.
    await page.goto("/report");
    await expect(page.getByRole("heading", { name: /smart regression report/i })).toBeVisible();
    await expect(page.getByText(/model id/i)).toBeVisible();
  });
});
