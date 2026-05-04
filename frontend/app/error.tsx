"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Next.js App Router Error:", error);
  }, [error]);

  return (
    <main className="container max-w-2xl py-12">
      <Alert variant="destructive">
        <AlertTriangle className="size-5" />
        <AlertTitle>Something went wrong!</AlertTitle>
        <AlertDescription className="mt-2 space-y-4">
          <p className="text-sm">
            {error.message || "An unexpected rendering error occurred."}
          </p>
          <Button onClick={() => reset()} variant="outline">
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    </main>
  );
}
