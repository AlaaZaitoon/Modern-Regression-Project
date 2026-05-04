/**
 * Theme-aware color constants for ECharts. We can't feed ECharts raw CSS
 * variables, so this module exposes a `useChartTheme()` hook that picks
 * concrete color strings based on the resolved next-themes value.
 *
 * Palette is intentionally aligned with `tailwind.config.ts`:
 *  - primary  → HUE navy
 *  - accent   → HUE gold
 *  - success  → emerald
 *  - destructive → coral red
 */

"use client";

import { useTheme } from "next-themes";
import * as React from "react";

export interface ChartTheme {
  isDark: boolean;
  /** Brand navy (used for primary series). */
  primary: string;
  /** Brand gold (used for accent/positive series). */
  accent: string;
  success: string;
  warning: string;
  destructive: string;
  /** Neutral ink for labels, axes. */
  ink: string;
  inkMuted: string;
  /** Grid + separators. */
  grid: string;
  /** Card surface + tooltip background. */
  surface: string;
  /** Semi-transparent overlay for thresholds. */
  threshold: string;
}

const LIGHT: ChartTheme = {
  isDark: false,
  primary: "#1e3a8a",
  accent: "#d97706",
  success: "#059669",
  warning: "#b45309",
  destructive: "#dc2626",
  ink: "rgba(15, 23, 42, 0.88)",
  inkMuted: "rgba(71, 85, 105, 0.80)",
  grid: "rgba(148, 163, 184, 0.30)",
  surface: "#ffffff",
  threshold: "rgba(220, 38, 38, 0.65)",
};

const DARK: ChartTheme = {
  isDark: true,
  primary: "#93c5fd",
  accent: "#fbbf24",
  success: "#34d399",
  warning: "#fbbf24",
  destructive: "#f87171",
  ink: "rgba(226, 232, 240, 0.92)",
  inkMuted: "rgba(148, 163, 184, 0.80)",
  grid: "rgba(148, 163, 184, 0.22)",
  surface: "#0f172a",
  threshold: "rgba(248, 113, 113, 0.72)",
};

/** Returns the ECharts-ready palette for the current theme. */
export function useChartTheme(): ChartTheme {
  const { resolvedTheme } = useTheme();
  return React.useMemo(() => (resolvedTheme === "dark" ? DARK : LIGHT), [resolvedTheme]);
}

/** Shared tooltip styling used across every chart. */
export function tooltipStyle(theme: ChartTheme) {
  return {
    backgroundColor: theme.surface,
    borderColor: theme.grid,
    borderWidth: 1,
    textStyle: { color: theme.ink, fontSize: 12 },
    padding: [8, 12] as const,
  };
}
