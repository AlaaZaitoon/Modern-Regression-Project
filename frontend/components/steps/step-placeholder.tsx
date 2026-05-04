"use client";

import { Construction } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  step: 3 | 4 | 5;
  title: string;
  description: string;
  milestone: "M3" | "M4" | "M5";
  details: string[];
}

/** Placeholder for steps not yet shipped (M3 / M4 / M5). */
export function StepPlaceholder({ step, title, description, milestone, details }: Props) {
  return (
    <section className="animate-fade-in">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
              <Construction className="size-5" aria-hidden />
            </div>
            <div>
              <CardTitle>
                Step {step} — {title}
              </CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Ships in <span className="font-semibold text-foreground">milestone {milestone}</span>.
            The backend already returns every field needed for this step — only the rendering UI is
            pending.
          </p>
          <ul className="ml-5 list-disc space-y-1 text-sm text-muted-foreground">
            {details.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}
