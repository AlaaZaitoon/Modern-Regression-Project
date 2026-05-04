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
 * Short, human-friendly label for R-squared based on the standard
 * "weak / moderate / excellent" brackets used in the R2 gauge.
 */
export function r2Band(r2: number): "weak" | "moderate" | "excellent" {
  if (!Number.isFinite(r2)) return "weak";
  if (r2 < 0.5) return "weak";
  if (r2 < 0.8) return "moderate";
  return "excellent";
}
