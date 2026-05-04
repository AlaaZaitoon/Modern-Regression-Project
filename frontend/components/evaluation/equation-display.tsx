"use client";

import { Sigma } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TrainResponse } from "@/lib/types";

interface Props {
  model: TrainResponse;
}

/**
 * Displays the fitted regression equation verbatim from the backend
 * (`equation_str`). No client-side formatting of coefficients happens here —
 * presentation only wraps the backend's canonical string.
 */
export function EquationDisplay({ model }: Props) {
  const { equation_str, model_type, x_cols, y_col } = model;
  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sigma className="size-5" aria-hidden />
          </div>
          <div>
            <CardTitle>Fitted equation</CardTitle>
            <CardDescription>
              {model_type === "simple" ? "Simple linear regression" : "Multiple linear regression"}{" "}
              · {x_cols.length} predictor{x_cols.length === 1 ? "" : "s"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="overflow-x-auto rounded-lg border bg-muted/40 p-5">
          <code className="font-mono text-lg font-medium text-foreground">{equation_str}</code>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="secondary">Target: {y_col}</Badge>
          {x_cols.map((x) => (
            <Badge key={x} variant="outline">
              {x}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
