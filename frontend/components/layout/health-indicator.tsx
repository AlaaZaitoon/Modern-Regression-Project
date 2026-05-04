"use client";

import { CircleCheck, CircleX, Loader2 } from "lucide-react";

import { useHealth } from "@/hooks/use-health";
import { Badge } from "@/components/ui/badge";

/**
 * Tiny status pill that reflects the state of the backend health endpoint.
 * Refreshes every 30 seconds via TanStack Query.
 */
export function HealthIndicator() {
  const { data, isPending, isError } = useHealth();

  if (isPending) {
    return (
      <Badge variant="secondary" className="gap-1.5" aria-live="polite">
        <Loader2 className="size-3 animate-spin" aria-hidden />
        <span>Checking API…</span>
      </Badge>
    );
  }

  if (isError || !data) {
    return (
      <Badge variant="destructive" className="gap-1.5" aria-live="polite">
        <CircleX className="size-3" aria-hidden />
        <span>API offline</span>
      </Badge>
    );
  }

  return (
    <Badge variant="success" className="gap-1.5" aria-live="polite">
      <CircleCheck className="size-3" aria-hidden />
      <span>
        API online · v{data.version}
      </span>
    </Badge>
  );
}
