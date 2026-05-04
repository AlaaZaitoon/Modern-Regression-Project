import Link from "next/link";
import { Compass, Home } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * 404 boundary. Rendered when the App Router can't match any route
 * (including when `notFound()` is called from a server component).
 * Completing this file silences Next.js 14's dev-time
 * "missing required error components" warning.
 */
export default function NotFound() {
  return (
    <div className="container flex min-h-[70vh] items-center justify-center py-12">
      <Card className="max-w-xl">
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Compass className="size-5" aria-hidden />
          </div>
          <div>
            <CardTitle>Page not found.</CardTitle>
            <p className="text-sm text-muted-foreground">
              The URL you opened doesn&rsquo;t match any route in the dashboard.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/">
              <Home />
              Back to the dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
