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
  modelType: "simple" | "multiple";
}

const BANDS: Record<
  "no_relation" | "poor" | "good" | "nearly_perfect" | "perfect",
  { label: string; color: string; ring: string }
> = {
  no_relation: {
    label: "No relation",
    color: "text-destructive",
    ring: "hsl(0 84% 60%)",
  },
  poor: {
    label: "Poor fit",
    color: "text-warning",
    ring: "hsl(36 94% 50%)",
  },
  good: {
    label: "Good fit",
    color: "text-primary",
    ring: "hsl(217 91% 60%)",
  },
  nearly_perfect: {
    label: "Nearly perfect",
    color: "text-success",
    ring: "hsl(142 71% 45%)",
  },
  perfect: {
    label: "Perfect fit",
    color: "text-success",
    ring: "hsl(187 92% 41%)",
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
export function R2Gauge({ r2, adjR2, modelType }: Props) {
  const shouldReduceMotion = useReducedMotion();
  const visualValue = Math.max(0, Math.min(1, r2));
  const band = r2Band(visualValue);
  const { label, color, ring } = BANDS[band];

  // Motion value for the numeric percentage
  const pctValue = useMotionValue(shouldReduceMotion ? visualValue * 100 : 0);
  const [displayPct, setDisplayPct] = React.useState(
    () => (shouldReduceMotion ? visualValue * 100 : 0),
  );

  // When value updates, animate it
  React.useEffect(() => {
    if (shouldReduceMotion) {
      pctValue.set(visualValue * 100);
      setDisplayPct(visualValue * 100);
      return;
    }

    const controls = animate(pctValue, visualValue * 100, {
      duration: 1.2,
      ease: [0.32, 0.72, 0, 1], // easeOutQuint
      onUpdate: (v) => setDisplayPct(v),
    });
    return () => controls.stop();
  }, [visualValue, pctValue, shouldReduceMotion]);

  // Stroke offset from 100% (empty) down to 0% (full) of VISIBLE_ARC
  const dashOffset = useTransform(pctValue, [0, 100], [VISIBLE_ARC, 0]);

  const size = RADIUS * 2 + STROKE * 2;
  const center = size / 2;

  const isSimple = modelType === "simple";

  return (
    <Card className="flex flex-col">
      <CardHeader className="text-center pb-2">
        <CardTitle>Fit Quality</CardTitle>
        <CardDescription>Variance explained by the model</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col items-center justify-center gap-6">
        <div className="relative flex items-center justify-center pt-4" aria-hidden>
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
          className={`grid w-full max-w-sm gap-3 text-center text-sm ${isSimple ? 'grid-cols-1' : 'grid-cols-2'}`}
        >
          <div className="rounded-md border bg-muted/30 p-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">R²</div>
            <div className="text-lg font-semibold tabular-nums">{(r2 * 100).toFixed(2)}%</div>
          </div>
          {!isSimple && (
            <div className="rounded-md border bg-muted/30 p-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Adjusted R²
              </div>
              <div className="text-lg font-semibold tabular-nums">{(adjR2 * 100).toFixed(2)}%</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
