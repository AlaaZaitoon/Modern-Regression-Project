"use client";

import * as React from "react";
import { Check, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { cn } from "@/lib/utils";

interface Props {
  /** Columns the user is allowed to choose from (always backend-numeric). */
  available: string[];
  /** Currently selected predictors. */
  value: string[];
  onChange: (next: string[]) => void;
  /** A column to disable (typically the y target). */
  disabledValue?: string | null;
  /** When set, restricts the maximum number of selections. */
  max?: number;
  /** Single-select mode (used for `simple` regression). */
  single?: boolean;
}

/**
 * Pill-style multi-select for predictor variables. Honours backend rules:
 * the y target is always disabled, and `simple` mode enforces exactly one X.
 */
export function VariablePicker({
  available,
  value,
  onChange,
  disabledValue,
  max,
  single,
}: Props) {
  const set = React.useMemo(() => new Set(value), [value]);

  const toggle = (col: string) => {
    if (col === disabledValue) return;
    if (single) {
      onChange(set.has(col) ? [] : [col]);
      return;
    }
    if (set.has(col)) {
      onChange(value.filter((c) => c !== col));
    } else {
      if (max && value.length >= max) return;
      onChange([...value, col]);
    }
  };

  if (available.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No numeric columns available — upload a dataset with at least one numeric column.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {available.map((col) => {
        const active = set.has(col);
        const disabled = col === disabledValue;
        return (
          <Toggle
            key={col}
            pressed={active}
            disabled={disabled}
            onPressedChange={() => toggle(col)}
            variant="outline"
            size="sm"
            className={cn(
              "rounded-full",
              active && "border-primary",
              disabled && "opacity-50",
            )}
            aria-label={`${active ? "Remove" : "Add"} ${col}`}
          >
            {active ? <Check aria-hidden /> : <Plus aria-hidden />}
            <span className="font-medium">{col}</span>
          </Toggle>
        );
      })}
      {value.length > 0 ? (
        <Badge variant="secondary" className="ml-auto">
          {value.length} selected{max ? ` / ${max}` : ""}
        </Badge>
      ) : null}
    </div>
  );
}
