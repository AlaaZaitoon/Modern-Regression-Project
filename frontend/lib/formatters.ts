/**
 * Presentation-only formatters. The backend is the single source of truth
 * for numerical values — these functions only decide how to display them.
 */

const SCIENTIFIC_THRESHOLD_HIGH = 1e5;
const SCIENTIFIC_THRESHOLD_LOW = 1e-3;

/** Render a finite number with a sensible default precision. */
export function formatNumber(value: number | null | undefined, digits = 4): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs !== 0 && (abs >= SCIENTIFIC_THRESHOLD_HIGH || abs < SCIENTIFIC_THRESHOLD_LOW)) {
    return value.toExponential(digits);
  }
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

/** Render a 0..1 value as a percent. */
export function formatPercent(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return `${(value * 100).toFixed(digits)}%`;
}

/** Render an integer count. */
export function formatInt(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return Math.trunc(value).toLocaleString();
}

/** Fixed-width scientific representation with 4 significant digits. */
export function formatScientific(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return value.toExponential(4);
}

/** Render a p-value with scientific notation when very small. */
export function formatPValue(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  if (value < 0.0001) return value.toExponential(2);
  return value.toFixed(4);
}

/**
 * Short, human-friendly label for R-squared based on a 5-tier classification
 * aligned with Hair et al. (2011, 2013):
 * "no_relation / poor / good / nearly_perfect / perfect"
 *
 *  R² = 1      → perfect fit (all points lie exactly on the regression line)
 *  R² ≥ 0.75   → nearly perfect  (substantial — Hair et al.)
 *  R² ≥ 0.50   → good            (moderate — Hair et al.)
 *  R² ≥ 0.25   → poor            (weak — Hair et al.)
 *  R² < 0.25   → no relation
 */
export type R2Band = "no_relation" | "poor" | "good" | "nearly_perfect" | "perfect";

export function r2Band(r2: number): R2Band {
  if (!Number.isFinite(r2)) return "no_relation";
  if (r2 >= 1.0) return "perfect";
  if (r2 >= 0.75) return "nearly_perfect";
  if (r2 >= 0.50) return "good";
  if (r2 >= 0.25) return "poor";
  return "no_relation";
}
