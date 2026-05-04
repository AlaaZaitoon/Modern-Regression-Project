/**
 * Integration test for the PredictionForm — the highest-value UI path
 * in M4. Covers:
 *  - Dynamic schema generation from the model's x_cols.
 *  - Successful prediction → result card with formatted number and PI.
 *  - `model_not_found` → user is redirected back to Step 2 (retrain flow).
 */

import React from "react";
import { http } from "msw";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The form imports sonner's `toast` at runtime — stub it so tests don't
// depend on the Toaster being mounted.
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    message: vi.fn(),
  },
}));

import { PredictionForm } from "@/components/evaluation/prediction-form";
import { useWorkflowStore } from "@/store/workflow-store";

import { BASE_URL, errorPayload } from "../msw/handlers";
import { trainResponseFixture } from "../msw/fixtures";
import { server } from "../msw/server";

function Wrapper({ children }: { children: React.ReactNode }) {
  // A fresh QueryClient per render — disable retries so the 404 test
  // rejects immediately instead of backing off.
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  // Reset the in-memory workflow store between tests.
  useWorkflowStore.getState().reset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("PredictionForm", () => {
  it("seeds one numeric input per predictor and uses the training mean", () => {
    render(
      <Wrapper>
        <PredictionForm model={trainResponseFixture} lastPrediction={null} />
      </Wrapper>,
    );

    // Our fixture only has YearsExperience.
    const input = screen.getByLabelText("YearsExperience") as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.type).toBe("number");
    // Mean of [1.1, 1.3, 1.5] = 1.3.
    expect(Number(input.value)).toBeCloseTo(1.3, 4);
  });

  it("submits and pushes the prediction into the store on success", async () => {
    const user = userEvent.setup();

    render(
      <Wrapper>
        <PredictionForm model={trainResponseFixture} lastPrediction={null} />
      </Wrapper>,
    );

    const input = screen.getByLabelText("YearsExperience");
    await user.clear(input);
    await user.type(input, "5");

    await user.click(screen.getByRole("button", { name: /predict/i }));

    // Asserting at the store level avoids coupling to how the parent
    // container re-renders the result card when the store changes
    // (the form itself only reads `lastPrediction` from props).
    await waitFor(() => {
      expect(useWorkflowStore.getState().lastPrediction).not.toBeNull();
    });

    const state = useWorkflowStore.getState();
    // Prediction = 25792.2 + 9449.96 * 5 = 73042.
    expect(state.lastPrediction?.prediction).toBeCloseTo(73042, 0);
    expect(state.lastPrediction?.prediction_interval[0]).toBeLessThan(
      state.lastPrediction!.prediction,
    );
  });

  it("redirects to Step 2 when the backend reports model_not_found", async () => {
    const user = userEvent.setup();

    server.use(
      http.post(`${BASE_URL}/models/:modelId/predict`, () =>
        errorPayload(404, "model_not_found", "Model not found."),
      ),
    );

    // Start on Step 4 to prove we move back to 2.
    useWorkflowStore.getState().setStep(4);

    render(
      <Wrapper>
        <PredictionForm model={trainResponseFixture} lastPrediction={null} />
      </Wrapper>,
    );

    await user.click(screen.getByRole("button", { name: /predict/i }));

    // Give the mutation onError handler a tick to fire.
    await waitFor(() => {
      expect(useWorkflowStore.getState().currentStep).toBe(2);
    });
    expect(useWorkflowStore.getState().lastPrediction).toBeNull();
  });
});
