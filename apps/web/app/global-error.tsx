"use client";

import "@workspace/ui/globals.css";

import { Button } from "@workspace/ui/components/button";
import { RefreshCcwIcon, TriangleAlertIcon } from "lucide-react";
import { useEffect } from "react";
import { SystemStatusPage } from "@/components/system-status-page";
import { reportClientException } from "@/features/shared/client-error-reporting/client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  function retryApplication() {
    reset();
    window.location.reload();
  }

  useEffect(() => {
    reportClientException({
      error,
      kind: "global_error",
      source: "app-global-error-boundary",
    });
  }, [error]);

  return (
    <html lang="en">
      <body>
        <SystemStatusPage
          actions={
            <Button
              className="w-full sm:w-auto"
              onClick={retryApplication}
              type="button"
            >
              <RefreshCcwIcon className="size-3.5" />
              Retry
            </Button>
          }
          badge="Application error"
          description="The application failed while loading. Retry will reload the page state; if it keeps failing, return to the home page."
          icon={<TriangleAlertIcon className="size-5" />}
          reference={error.digest}
          title="Something went wrong"
          tone="destructive"
        />
      </body>
    </html>
  );
}
