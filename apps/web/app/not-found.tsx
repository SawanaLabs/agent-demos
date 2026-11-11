import { SearchXIcon } from "lucide-react";
import { SystemStatusPage } from "@/components/system-status-page";
import { env } from "@/env";
import { PlausibleNotFound } from "@/features/site-analytics/ui/plausible-not-found";

export default function NotFound() {
  return (
    <>
      <PlausibleNotFound
        enabled={
          env.VERCEL === "1" &&
          env.VERCEL_ENV === "production" &&
          Boolean(env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT_URL)
        }
      />
      <SystemStatusPage
        badge="404"
        description="The address may be wrong, moved, or no longer available. Use the current navigation to open an available page."
        icon={<SearchXIcon className="size-5" />}
        title="This page does not exist"
      />
    </>
  );
}
