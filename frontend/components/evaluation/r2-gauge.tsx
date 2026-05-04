"use client";

import * as React from "react";
import { motion, useMotionValue, useReducedMotion, useTransform, animate } from "framer-motion";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { r2Band } from "@/lib/formatters";

interface Props {
  r2: number;
  adjR2: number;
}

const BANDS: Record<
  "weak" | "moderate" | "excellent",
  { label: string; color: string; ring: string }
> = {
  weak: {
    label: "Weak fit",
    color: "text-destructive",
    ring: "hsl(0 84% 60%)",
  },
  moderate: {
    label: "Moderate fit",
    color: "text-warning",
    ring: "hsl(36 94% 50%)",
  },
  excellent: {
    label: "Excellent fit",
    color: "text-success",
    ring: "hsl(142 71% 45%)",
  },
};

const RADIUS = 78;
const STROKE = 14;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
// Expose only ~75% of the arc (270 degrees, from -225° to +45°).
const ARC_FRACTION = 0.75;
const VISIBLE_ARC = CIRCUMFERENCE * ARC_FRACTION;

/**
 * Circular gauge for R². Uses Framer Motion to animate the stroke length
 * and the numeric readout in tandem. Skips animation for users with
 * reduced-motion preferences.
 */
export function R2Gauge({ r2, adjR2 }: Props) {
  const reduceMotion = useReducedMotion();
  const clamped = Math.max(0, Math.min(1, r2));
  const band = r2Band(clamped);
  const { label, color, ring } = BANDS[band];

  // Animated motion value drives both stroke and displayed percent.
  const progress = useMotionValue(reduceMotion ? clamped : 0);
  const dashOffset = useTransform(progress, (v) => VISIBLE_ARC * (1 - v));
  const [displayPct, setDisplayPct] = React.useState(
    () => (reduceMotion ? clamped * 100 : 0),
  );

  React.useEffect(() => {
    if (reduceMotion) {
      progress.set(clamped);
      setDisplayPct(clamped * 100);
      return;
    }
    const controls = animate(progress, clamped, {
      duration: 1.1,
      ease: [0.22, 1, 0.36, 1],
    });
    const unsubscribe = progress.on("change", (v) => setDisplayPct(v * 100));
    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [clamped, progress, reduceMotion]);

  const size = RADIUS * 2 + STROKE * 2;
  const center = size / 2;

  return (
    <Card>
      <CardHeader>
        <CardTitle>R² gauge</CardTitle>
        <CardDescription>
          Proportion of variance in the target explained by the model.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="relative" aria-hidden>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* Rotate so the arc opens at the bottom. */}
            <g transform={`rotate(135 ${center} ${center})`}>
              <circle
                cx={center}
                cy={center}
                r={RADIUS}
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={`${VISIBLE_ARC} ${CIRCUMFERENCE}`}
              />
              <motion.circle
                cx={center}
                cy={center}
                r={RADIUS}
                fill="none"
                stroke={ring}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={`${VISIBLE_ARC} ${CIRCUMFERENCE}`}
                style={{ strokeDashoffset: dashOffset }}
              />
            </g>
          </svg>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-semibold tabular-nums tracking-tight">
              {displayPct.toFixed(1)}
              <span className="text-xl text-muted-foreground">%</span>
            </span>
            <span className={`text-xs font-medium uppercase tracking-wider ${color}`}>
              {label}
            </span>
          </div>
        </div>

        <div
          role="group"
          aria-label="R-squared details"
          className="grid w-full max-w-sm grid-cols-2 gap-3 text-center text-sm"
        >
          <div className="rounded-md border bg-muted/30 p-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">R²</div>
            <div className="text-lg font-semibold tabular-nums">{(r2 * 100).toFixed(2)}%</div>
          </div>
          <div className="rounded-md border bg-muted/30 p-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Adjusted R²
            </div>
            <div className="text-lg font-semibold tabular-nums">{(adjR2 * 100).toFixed(2)}%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
