"use client";

import { Button } from "@workspace/ui/components/button";
import { RefreshCcwIcon, TriangleAlertIcon } from "lucide-react";
import { useEffect } from "react";
import { SystemStatusPage } from "@/components/system-status-page";
import { reportClientException } from "@/features/shared/client-error-reporting/client";

export default function RouteErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  function retryRoute() {
    reset();
    window.location.reload();
  }

  useEffect(() => {
    reportClientException({
      error,
      kind: "route_error",
      source: "app-error-boundary",
    });
  }, [error]);

  return (
    <SystemStatusPage
      actions={
        <Button className="w-full sm:w-auto" onClick={retryRoute} type="button">
          <RefreshCcwIcon className="size-3.5" />
          Retry
        </Button>
      }
      badge="Runtime error"
      description="The current page failed while loading. Retry will reload this page; if it keeps failing, return home and open it again."
      icon={<TriangleAlertIcon className="size-5" />}
      reference={error.digest}
      title="Something went wrong"
      tone="destructive"
    />
  );
}
