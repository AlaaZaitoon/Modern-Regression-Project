/**
 * Gap 2 — Recommendations Button gating.
 *
 * Asserts that:
 *   1. On first render, the recommendations content is HIDDEN (the
 *      button card is shown instead).
 *   2. Clicking "Generate recommendations" reveals the panel.
 *   3. The reveal exposes a "Hide recommendations" affordance.
 *
 * This guarantees the spec wording "Recommendations Button — After
 * training the model, the system provides intelligent insights" is
 * satisfied: the user has to opt-in.
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { RecommendationsTrigger } from "@/components/recommendations/recommendations-trigger";
import { trainResponseFixture } from "../msw/fixtures";

describe("RecommendationsTrigger", () => {
  it("hides the recommendations content until the button is clicked", () => {
    render(<RecommendationsTrigger model={trainResponseFixture} />);

    // The collapsed entry-point card is visible. shadcn CardTitle renders
    // a styled <div>, not an <h*>, so we assert via plain text.
    expect(screen.getByText(/get intelligent recommendations/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^generate recommendations$/i }),
    ).toBeInTheDocument();

    // The expanded panel hasn't been rendered yet, so its individual
    // recommendation titles (e.g. "Nearly perfect fit") are absent.
    expect(screen.queryByText(/nearly perfect fit/i)).not.toBeInTheDocument();
    // And no "Hide recommendations" affordance is offered.
    expect(
      screen.queryByRole("button", { name: /hide recommendations/i }),
    ).not.toBeInTheDocument();
  });

  it("reveals the panel after the button is clicked", async () => {
    const user = userEvent.setup();
    render(<RecommendationsTrigger model={trainResponseFixture} />);

    await user.click(
      screen.getByRole("button", { name: /^generate recommendations$/i }),
    );

    // The fixture has R² ≈ 0.957, so the first recommendation is
    // "Nearly perfect fit — R² = 95.7…%".
    expect(await screen.findByText(/nearly perfect fit/i)).toBeInTheDocument();
    // And the toggle now offers a "Hide recommendations" link.
    expect(
      screen.getByRole("button", { name: /hide recommendations/i }),
    ).toBeInTheDocument();
  });
});
