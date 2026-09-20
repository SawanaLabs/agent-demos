import type { Metadata } from "next";

import { DepthVideoTool } from "@/features/depth-video-tool/ui/depth-video-tool";

export const metadata: Metadata = {
  description:
    "Convert a video up to 15 seconds into a local, stabilized grayscale depth reference for AI video motion control.",
  title: "Depth Video Processor",
};

export default function DepthVideoPage() {
  return <DepthVideoTool />;
}
