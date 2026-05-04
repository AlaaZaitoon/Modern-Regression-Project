import { describe, expect, it } from "vitest";

import {
  formatInt,
  formatNumber,
  formatPValue,
  formatPercent,
  formatScientific,
  r2Band,
} from "@/lib/formatters";

describe("formatNumber", () => {
  it("renders '—' for null / NaN / Infinity", () => {
    expect(formatNumber(null)).toBe("—");
    expect(formatNumber(undefined)).toBe("—");
    expect(formatNumber(Number.NaN)).toBe("—");
    expect(formatNumber(Number.POSITIVE_INFINITY)).toBe("—");
  });

  it("uses fixed notation for mid-range values", () => {
    expect(formatNumber(42.12345, 2)).toBe("42.12");
  });

  it("switches to scientific notation for very small or very large values", () => {
    expect(formatNumber(1e-5, 2)).toBe("1.00e-5");
    expect(formatNumber(5.1234e8, 2)).toBe("5.12e+8");
  });
});

describe("formatPercent", () => {
  it("multiplies by 100 and appends %", () => {
    expect(formatPercent(0.8732)).toBe("87.32%");
  });
  it("renders '—' for invalid input", () => {
    expect(formatPercent(null)).toBe("—");
  });
});

describe("formatInt", () => {
  it("truncates and renders with thousands separators", () => {
    expect(formatInt(1234567.89)).toBe("1,234,567");
  });
});

describe("formatScientific", () => {
  it("always uses scientific with 4 significant digits", () => {
    expect(formatScientific(1234.5678)).toBe("1.2346e+3");
  });
});

describe("formatPValue", () => {
  it("uses scientific notation below 1e-4", () => {
    expect(formatPValue(1e-6)).toBe("1.00e-6");
  });
  it("uses fixed notation otherwise", () => {
    expect(formatPValue(0.0432)).toBe("0.0432");
  });
});

describe("r2Band", () => {
  it("classifies into no_relation / poor / good / nearly_perfect / perfect", () => {
    expect(r2Band(0.2)).toBe("no_relation");
    expect(r2Band(0.3)).toBe("poor");
    expect(r2Band(0.6)).toBe("good");
    expect(r2Band(0.8)).toBe("nearly_perfect");
    expect(r2Band(1.0)).toBe("perfect");
  });
});
