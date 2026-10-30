import type { Metadata } from "next";
import { ShipwordsVideoTool } from "@/features/shipwords-video/ui/shipwords-video-tool";

export const metadata: Metadata = {
  description:
    "A standalone Tiny Desk video tool UI adapted from the open-source ShipWords project, with photo casting and generation state previews.",
  title: "ShipWords Video UI Slice",
};

export default function ShipwordsVideoPage() {
  return <ShipwordsVideoTool />;
}
