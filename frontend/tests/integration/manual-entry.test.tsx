/**
 * Integration test for the manual data-entry path (Gap 1).
 *
 * The grid builds an in-memory CSV and reuses `useUploadDataset`, so a
 * successful submission must end with `lastDataset` populated and
 * `currentStep === 1` (the upload mutation keeps the user on Step 1 to
 * review the profile — the spec only requires the store to be
 * populated, which is what every downstream step relies on).
 */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    message: vi.fn(),
  },
}));

import { ManualEntryGrid } from "@/components/upload/manual-entry-grid";
import { useWorkflowStore } from "@/store/workflow-store";

import { DATASET_ID } from "../msw/fixtures";

function Wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  useWorkflowStore.getState().reset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("ManualEntryGrid", () => {
  it("renders 2 default columns and 5 default rows", () => {
    render(
      <Wrapper>
        <ManualEntryGrid />
      </Wrapper>,
    );
    // Default columns are named "x" and "y".
    expect(screen.getByDisplayValue("x")).toBeInTheDocument();
    expect(screen.getByDisplayValue("y")).toBeInTheDocument();
    // 5 default rows × 2 columns = 10 cell inputs that match the
    // "Row N column …" aria-label pattern.
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByLabelText(new RegExp(`Row ${i} column x$`, "i"))).toBeInTheDocument();
      expect(screen.getByLabelText(new RegExp(`Row ${i} column y$`, "i"))).toBeInTheDocument();
    }
  });

  it("disables submit until the row threshold is met", async () => {
    const user = userEvent.setup();
    render(
      <Wrapper>
        <ManualEntryGrid />
      </Wrapper>,
    );

    const submit = screen.getByRole("button", { name: /use this dataset/i });
    expect(submit).toBeDisabled();

    // Fill only 2 of the 5 rows — still disabled.
    const r1x = screen.getByLabelText(/Row 1 column x/i);
    const r1y = screen.getByLabelText(/Row 1 column y/i);
    await user.type(r1x, "1");
    await user.type(r1y, "10");
    expect(submit).toBeDisabled();
  });

  it("submits a 3-column × 6-row dataset and populates the store", async () => {
    const user = userEvent.setup();
    render(
      <Wrapper>
        <ManualEntryGrid />
      </Wrapper>,
    );

    // Add a third column.
    await user.click(screen.getByRole("button", { name: /add column/i }));
    // Add a sixth row.
    await user.click(screen.getByRole("button", { name: /add row/i }));

    // Fill all 18 cells with valid numerics. Names are x, y, col3.
    const fixtureRows = [
      [1, 10, 100],
      [2, 20, 200],
      [3, 30, 300],
      [4, 40, 400],
      [5, 50, 500],
      [6, 60, 600],
    ];
    const labels = ["x", "y", "col3"];
    for (let ri = 0; ri < fixtureRows.length; ri++) {
      for (let ci = 0; ci < labels.length; ci++) {
        const cell = screen.getByLabelText(
          new RegExp(`Row ${ri + 1} column ${labels[ci]}$`, "i"),
        );
        await user.type(cell, String(fixtureRows[ri][ci]));
      }
    }

    const submit = screen.getByRole("button", { name: /use this dataset/i });
    await waitFor(() => expect(submit).toBeEnabled());
    await user.click(submit);

    // The MSW handler returns the canned dataset fixture; the
    // useUploadDataset hook then writes it into the workflow store.
    await waitFor(() => {
      const state = useWorkflowStore.getState();
      expect(state.lastDataset).not.toBeNull();
      expect(state.datasetId).toBe(DATASET_ID);
      // Step is 1 (upload-mutation onSuccess explicitly stays on Step 1
      // so the user can review the dataset profile before moving on).
      expect(state.currentStep).toBe(1);
    });
  });

  it("flags non-numeric input on a numeric column with an inline error", async () => {
    const user = userEvent.setup();
    render(
      <Wrapper>
        <ManualEntryGrid />
      </Wrapper>,
    );

    const cell = screen.getByLabelText(/Row 1 column x/i);
    await user.type(cell, "abc");
    expect(await screen.findByText("Not a number")).toBeInTheDocument();
    expect(cell).toHaveAttribute("aria-invalid", "true");
  });
});
