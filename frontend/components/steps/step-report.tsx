"use client";

import { ArrowLeft, Database, Download, ExternalLink, FileText, Printer } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/lib/api";
import { useWorkflowStore } from "@/store/workflow-store";

/**
 * Step 5 — Report & Export. Offers two routes to a polished artifact:
 *   1. `/report` — a print-optimized page that consolidates Steps 3 + 4
 *      for on-screen review or browser "Print → Save as PDF".
 *   2. Direct backend-streamed PDF via `/models/:id/report.pdf`.
 */
export function StepReport() {
  const model = useWorkflowStore((s) => s.lastTrainResponse);
  const setStep = useWorkflowStore((s) => s.setStep);

  if (!model) {
    return (
      <section className="space-y-4 animate-fade-in">
        <Alert variant="info">
          <Database className="size-4" aria-hidden />
          <AlertTitle>No trained model.</AlertTitle>
          <AlertDescription>
            Finish Steps 1 – 4 first. The report consolidates results from the trained model.
          </AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => setStep(2)}>
          <ArrowLeft />
          Back to model configuration
        </Button>
      </section>
    );
  }

  const pdfUrl = api.exportPdfUrl(model.model_id);

  return (
    <section className="space-y-6 animate-fade-in">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <FileText className="size-5" aria-hidden />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-gradient">Report &amp; export</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Share a polished, ready-to-submit artifact.
          </p>
        </div>
        <Button variant="outline" onClick={() => setStep(4)}>
          <ArrowLeft />
          Back to results
        </Button>
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Printer className="size-5" aria-hidden />
              </div>
              <div>
                <CardTitle>Print-friendly report</CardTitle>
                <CardDescription>
                  Steps 3 and 4 consolidated on one scrollable page.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between gap-4">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5 font-mono">
                  A4
                </Badge>
                <span>Optimized margins, headings, and page breaks.</span>
              </li>
              <li className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5 font-mono">
                  SSR
                </Badge>
                <span>Renders on the client with the current in-memory model.</span>
              </li>
              <li className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5 font-mono">
                  ⌘P
                </Badge>
                <span>Use your browser&rsquo;s &ldquo;Save as PDF&rdquo; from the print dialog.</span>
              </li>
            </ul>
            <Button asChild className="w-full">
              <a
                href={`/report?model=${encodeURIComponent(model.model_id)}`}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink />
                Open report in new tab
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-accent/15 text-accent-foreground">
                <Download className="size-5" aria-hidden />
              </div>
              <div>
                <CardTitle>Backend PDF</CardTitle>
                <CardDescription>
                  Streaming download rendered by ReportLab on the server.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col justify-between gap-4">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5 font-mono">
                  GET
                </Badge>
                <span className="break-all">
                  /api/v1/models/<span className="font-mono">{model.model_id}</span>/report.pdf
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5 font-mono">
                  PDF
                </Badge>
                <span>Embedded equation, tables, metrics, and ANOVA.</span>
              </li>
              <li className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5 font-mono">
                  ⚠
                </Badge>
                <span>Backend must still have the model — retrain if restarted.</span>
              </li>
            </ul>
            <Button asChild variant="accent" className="w-full">
              <a href={pdfUrl} target="_blank" rel="noreferrer" download>
                <Download />
                Download PDF
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
