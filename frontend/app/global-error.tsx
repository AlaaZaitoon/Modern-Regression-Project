"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary. `global-error.tsx` replaces the entire
 * `<html>` tree when an error bubbles up from the root layout itself
 * (e.g. a provider crashes). Keep it minimal and dependency-free so
 * it still renders when half the app is broken.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[srs.ui] fatal root-layout error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          background: "#ffffff",
          color: "#1a1a1a",
        }}
      >
        <div style={{ maxWidth: 520 }}>
          <h1 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>
            Dashboard failed to load.
          </h1>
          <p style={{ fontSize: "0.9rem", color: "#555", marginBottom: "1rem" }}>
            An unexpected error broke the root layout before the normal UI could render.
          </p>
          <pre
            style={{
              maxHeight: "10rem",
              overflow: "auto",
              background: "#f4f4f4",
              padding: "0.75rem",
              borderRadius: "0.5rem",
              fontSize: "0.75rem",
              marginBottom: "1rem",
            }}
          >
            {error.message}
            {error.digest ? `\n\ndigest: ${error.digest}` : ""}
          </pre>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              border: "1px solid #1B2A5E",
              background: "#1B2A5E",
              color: "#ffffff",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
