import { DemoLoadingShell } from "@/components/demo-loading-screen";

export default function DemosLoading() {
  return (
    <DemoLoadingShell
      badges={["Agent Demo", "Loading"]}
      summary="The demo workspace is loading. This can take a little longer on slow mobile networks."
      title="Opening demo"
    />
  );
}
