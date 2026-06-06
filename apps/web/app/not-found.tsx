import { SearchXIcon } from "lucide-react";
import { SystemStatusPage } from "@/components/system-status-page";

export default function NotFound() {
  return (
    <SystemStatusPage
      badge="404"
      description="The address may be wrong, moved, or no longer available. Use the current navigation to open an available page."
      icon={<SearchXIcon className="size-5" />}
      title="This page does not exist"
    />
  );
}
