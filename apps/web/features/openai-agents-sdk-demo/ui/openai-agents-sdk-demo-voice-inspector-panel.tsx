import type { OpenAiAgentsSdkDemoVoiceProfile } from "../server/voice";
import {
  InspectorBadge,
  InspectorCollapsible,
  InspectorRow,
} from "./openai-agents-sdk-demo-inspector-common";

export function OpenAiAgentsSdkDemoVoiceInspectorPanel({
  voiceProfile,
}: {
  voiceProfile: OpenAiAgentsSdkDemoVoiceProfile;
}) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground uppercase tracking-[0.2em]">
        Voice Agents
      </p>
      <div className="mt-2 space-y-2 border border-foreground/10 px-3 py-3 text-sm">
        <OpenAiAgentsSdkDemoVoiceSummary voiceProfile={voiceProfile} />
        <OpenAiAgentsSdkDemoBrowserLane voiceProfile={voiceProfile} />
        <OpenAiAgentsSdkDemoServerLanes voiceProfile={voiceProfile} />
        <OpenAiAgentsSdkDemoProviderBridges voiceProfile={voiceProfile} />
        <OpenAiAgentsSdkDemoVoiceContracts voiceProfile={voiceProfile} />
      </div>
    </div>
  );
}

function OpenAiAgentsSdkDemoVoiceSummary({
  voiceProfile,
}: {
  voiceProfile: OpenAiAgentsSdkDemoVoiceProfile;
}) {
  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        <InspectorBadge>{voiceProfile.agentPrimitive}</InspectorBadge>
        <InspectorBadge>{voiceProfile.sessionPrimitive}</InspectorBadge>
        <InspectorBadge>
          {voiceProfile.browserTransport.transport}
        </InspectorBadge>
        <InspectorBadge className="capitalize">
          {voiceProfile.browserTransport.status}
        </InspectorBadge>
      </div>

      <div className="space-y-2">
        <InspectorRow
          label="Browser model"
          value={voiceProfile.browserTransport.sessionModel}
        />
        <InspectorRow
          label="Voice"
          value={voiceProfile.browserTransport.sessionVoice}
        />
        <InspectorRow
          label="Tools"
          value={`${voiceProfile.lane.toolNames.length} total / ${voiceProfile.lane.approvalToolNames.length} gated`}
        />
        <InspectorRow
          label="Handoffs"
          value={String(voiceProfile.lane.handoffAgentNames.length)}
        />
        <InspectorRow
          label="Provider lanes"
          value={String(voiceProfile.providerExtensions.length)}
        />
        <InspectorRow
          label="Workspace"
          value={
            voiceProfile.supportedInsideCurrentWorkspace
              ? "supported"
              : "blocked"
          }
        />
      </div>
    </>
  );
}

function OpenAiAgentsSdkDemoBrowserLane({
  voiceProfile,
}: {
  voiceProfile: OpenAiAgentsSdkDemoVoiceProfile;
}) {
  return (
    <InspectorCollapsible
      defaultOpen={false}
      summary="Route, key contract, events, and browser-only hooks."
      title="Browser lane"
    >
      <InspectorRow
        label="Route"
        value={voiceProfile.browserTransport.routePath}
      />
      <InspectorRow
        label="Credential"
        value={voiceProfile.browserTransport.credentialContract}
      />
      <InspectorRow
        label="Workspace support"
        value={
          voiceProfile.supportedInsideCurrentWorkspace ? "supported" : "blocked"
        }
      />
      <InspectorRow
        label="Chat route"
        value={
          voiceProfile.supportedInsideCurrentChatRoute ? "supported" : "blocked"
        }
      />
      <OpenAiAgentsSdkDemoBadgeGroup
        label="Session events"
        values={voiceProfile.lane.emittedSessionEvents}
      />
      <OpenAiAgentsSdkDemoBadgeGroup
        label="Transport hook"
        values={[voiceProfile.lane.transportEscapeHatch]}
      />
    </InspectorCollapsible>
  );
}

function OpenAiAgentsSdkDemoServerLanes({
  voiceProfile,
}: {
  voiceProfile: OpenAiAgentsSdkDemoVoiceProfile;
}) {
  return (
    <InspectorCollapsible
      defaultOpen={false}
      summary="Server WebSocket, raw audio loop, and SIP runtime contracts."
      title="Server lanes"
    >
      <InspectorRow
        label="Server transport"
        value={voiceProfile.serverTransport.transport}
      />
      <InspectorRow
        label="Server model"
        value={voiceProfile.serverTransport.model}
      />
      <InspectorRow
        label="Server voice"
        value={voiceProfile.serverTransport.sessionVoice}
      />
      <InspectorRow
        label="Server key"
        value={voiceProfile.serverTransport.openAiApiKeyEnvVar}
      />
      <InspectorRow
        label="Server status"
        value={
          <InspectorBadge>{voiceProfile.serverTransport.status}</InspectorBadge>
        }
      />
      <InspectorRow
        label="Audio input"
        value={voiceProfile.serverAudioLane.inputPrimitive}
      />
      <InspectorRow
        label="Audio response"
        value={voiceProfile.serverAudioLane.requestResponsePrimitive}
      />
      <InspectorRow
        label="Audio status"
        value={
          <InspectorBadge>{voiceProfile.serverAudioLane.status}</InspectorBadge>
        }
      />
      <InspectorRow
        label="SIP transport"
        value={voiceProfile.sipTransport.transport}
      />
      <InspectorRow
        label="SIP route"
        value={voiceProfile.sipTransport.routePath}
      />
      <InspectorRow
        label="SIP key"
        value={voiceProfile.sipTransport.openAiApiKeyEnvVar}
      />
      <InspectorRow
        label="SIP status"
        value={
          <InspectorBadge>{voiceProfile.sipTransport.status}</InspectorBadge>
        }
      />
      <OpenAiAgentsSdkDemoBadgeGroup
        label="Server primitives"
        values={[
          ...voiceProfile.serverTransport.sdkPrimitives,
          voiceProfile.serverAudioLane.interruptPrimitive,
          voiceProfile.serverAudioLane.outputAudioEvent,
          voiceProfile.serverAudioLane.outputTranscriptEvent,
          voiceProfile.sipTransport.connectPrimitive,
          voiceProfile.sipTransport.initialConfigPrimitive,
          voiceProfile.sipTransport.callControlContract,
        ]}
      />
    </InspectorCollapsible>
  );
}

function OpenAiAgentsSdkDemoProviderBridges({
  voiceProfile,
}: {
  voiceProfile: OpenAiAgentsSdkDemoVoiceProfile;
}) {
  return (
    <InspectorCollapsible
      defaultOpen={false}
      summary="Twilio and Cloudflare wrappers, routes, and hosting contracts."
      title="Provider bridges"
    >
      <InspectorRow
        label="Twilio route"
        value={voiceProfile.twilioCallControl.routePath}
      />
      <InspectorRow
        label="Twilio stream env"
        value={voiceProfile.twilioCallControl.mediaStreamUrlEnvVar}
      />
      <InspectorRow
        label="Twilio status"
        value={
          <InspectorBadge>
            {voiceProfile.twilioCallControl.status}
          </InspectorBadge>
        }
      />
      <InspectorRow
        label="Twilio bridge"
        value={
          <InspectorBadge>
            {voiceProfile.twilioMediaStreamBridge.status}
          </InspectorBadge>
        }
      />
      <InspectorRow
        label="Twilio app"
        value={
          <InspectorBadge>
            {voiceProfile.twilioMediaStreamServer.status}
          </InspectorBadge>
        }
      />
      <InspectorRow
        label="Cloudflare route"
        value={voiceProfile.cloudflareWorkerApp.connectRoutePath}
      />
      <InspectorRow
        label="Cloudflare app"
        value={
          <InspectorBadge>
            {voiceProfile.cloudflareWorkerApp.status}
          </InspectorBadge>
        }
      />
      <InspectorRow
        label="Cloudflare module"
        value={
          <InspectorBadge>
            {voiceProfile.cloudflareWorkerModule.status}
          </InspectorBadge>
        }
      />
      <InspectorRow
        label="Cloudflare worker"
        value={
          <InspectorBadge>
            {voiceProfile.cloudflareWorkerRuntime.status}
          </InspectorBadge>
        }
      />
      <div className="space-y-2">
        {voiceProfile.providerExtensions.map((extension) => (
          <div
            className="space-y-2 border border-foreground/10 px-2 py-2"
            key={extension.id}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="min-w-0 text-sm">{extension.label}</span>
              <InspectorBadge>{extension.status}</InspectorBadge>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <InspectorBadge>{extension.sdkPrimitive}</InspectorBadge>
              <InspectorBadge>{extension.runtimeContract}</InspectorBadge>
              <InspectorBadge>{extension.workflowName}</InspectorBadge>
            </div>
          </div>
        ))}
      </div>
    </InspectorCollapsible>
  );
}

function OpenAiAgentsSdkDemoVoiceContracts({
  voiceProfile,
}: {
  voiceProfile: OpenAiAgentsSdkDemoVoiceProfile;
}) {
  return (
    <InspectorCollapsible
      defaultOpen={false}
      summary="Long-form transport notes and deployment contracts."
      title="Contracts"
    >
      <OpenAiAgentsSdkDemoBadgeGroup
        label="Twilio"
        values={[
          voiceProfile.twilioCallControl.transportContract,
          voiceProfile.twilioCallControl.sdkPrimitive,
          voiceProfile.twilioCallControl.requiredMediaStreamProtocol,
          voiceProfile.twilioMediaStreamBridge.sdkPrimitive,
          voiceProfile.twilioMediaStreamBridge.hostingContract,
          voiceProfile.twilioMediaStreamBridge.closeBehavior,
          voiceProfile.twilioMediaStreamServer.serverPrimitive,
          voiceProfile.twilioMediaStreamServer.publicTransportContract,
          voiceProfile.twilioMediaStreamServer.websocketProtocol,
        ]}
      />
      <OpenAiAgentsSdkDemoBadgeGroup
        label="Cloudflare"
        values={[
          voiceProfile.cloudflareWorkerModule.modulePrimitive,
          voiceProfile.cloudflareWorkerModule.runtimeContract,
          voiceProfile.cloudflareWorkerApp.serverPrimitive,
          voiceProfile.cloudflareWorkerApp.publicTransportContract,
          voiceProfile.cloudflareWorkerApp.websocketUpgradePrimitive,
          voiceProfile.cloudflareWorkerRuntime.sdkPrimitive,
          voiceProfile.cloudflareWorkerRuntime.websocketUpgradePrimitive,
          voiceProfile.cloudflareWorkerRuntime.openEventBehavior,
          voiceProfile.cloudflareWorkerRuntime.workerCompatibilityFlag,
          voiceProfile.cloudflareWorkerRuntime.runtimeEntryPoint,
        ]}
      />
      <p className="text-muted-foreground text-xs/relaxed">
        {voiceProfile.notes}
      </p>
    </InspectorCollapsible>
  );
}

function OpenAiAgentsSdkDemoBadgeGroup({
  label,
  values,
}: {
  label: string;
  values: readonly string[];
}) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {values.map((value) => (
          <InspectorBadge key={value}>{value}</InspectorBadge>
        ))}
      </div>
    </div>
  );
}
