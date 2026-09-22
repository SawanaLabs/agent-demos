import { DemoWorkspaceShell } from "@/components/demo-workspace-shell";
import { feedbackEnv } from "@/features/feedback-agent/server/env";
import { FeedbackWorkspace } from "@/features/feedback-agent/ui/workspace";

export const dynamic = "force-dynamic";
export default function FeedbackAgentPage() {
  const config = feedbackEnv();
  return (
    <DemoWorkspaceShell
      badges={["Make This Better · MIT", "Screenshots + AI triage"]}
      breadcrumbTitle="Feedback Agent"
      summary="Select an element, capture the page, and turn your feedback into an actionable issue."
      title="Show exactly what needs to change"
    >
      <FeedbackWorkspace
        aiAvailable={Boolean(config.AI_GATEWAY_API_KEY)}
        available={Boolean(config.REDIS_URL)}
      />
    </DemoWorkspaceShell>
  );
}
