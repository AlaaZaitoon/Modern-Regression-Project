"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RecommendationsPanel } from "@/components/recommendations/recommendations-panel";
import type { DatasetUploadResponse, TrainResponse } from "@/lib/types";

interface Props {
  model: TrainResponse;
  dataset?: DatasetUploadResponse | null;
}

/**
 * Gap-2 UX: keep the analytical recommendations behind an explicit
 * trigger so the user opts into seeing them (matches the original
 * spec wording: "Recommendations Button — After training the model,
 * the system provides intelligent insights").
 *
 * Local `useState` only — the workflow store is not touched. Animation
 * respects `prefers-reduced-motion`.
 */
export function RecommendationsTrigger({ model, dataset }: Props) {
  const [open, setOpen] = React.useState(false);
  const reduceMotion = useReducedMotion();

  if (open) {
    return (
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="space-y-2"
      >
        <RecommendationsPanel model={model} dataset={dataset} />
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Hide recommendations
        </button>
      </motion.div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-accent/15 text-accent-foreground">
            <Sparkles className="size-5" aria-hidden />
          </div>
          <div className="flex-1">
            <CardTitle>Get intelligent recommendations</CardTitle>
            <CardDescription>
              Plain-language interpretation of fit quality, predictor importance,
              influential observations, and data-quality concerns — all derived
              from the backend&rsquo;s statistical output.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Button onClick={() => setOpen(true)}>
          <Sparkles />
          Generate recommendations
        </Button>
      </CardContent>
    </Card>
  );
}
