# Local E2E QA - Agent Demos

Date: 2026-06-02

Scope: read-only local QA run against `pnpm --dir apps/web dev` on `http://localhost:3000`. No product code was changed. This file is the temporary QA record.

## Environment

- App: `ai-sdk-6-ai-elements-demos`
- Server: Next.js dev server, `http://localhost:3000`
- Runtime shown by app: Node `v24.14.0`
- Browser harness: Codex in-app Browser first, HTTP/API smoke after the browser control session became unstable.
- Existing dirty worktree before this QA included `docs/planning/work-roadmap.md` and `agent-e2e-qa-2026-06-02.md`.

## Summary

- Covered all 15 ready demos.
- UI/browser covered: homepage, Foundation Chat, RAG Chatbot, Persistent & Resume Agent, Streaming Chat Shell, Loop Agent, MCP Agent, Object Generation, Trace Eval Agent.
- API/local route covered after browser failure: Customer Memory Agent, OpenAI Agents SDK Demo, LangGraph Agent, Skills Agent, Sandbox Agent, Ultra Chatbot Agent.
- Multimodal Chatbot was retested after a cold Next.js dev cache rebuild; page GET and text API both pass locally.
- Ultra sandbox UI approval path was retested in normal Chrome; inline approval persisted the chat capability and the next same-chat turn executed sandbox `bash`.

## Retest Addendum - LangGraph Agent

Date: 2026-06-02

The original LangGraph result was incomplete because the paired LangGraph Agent Server was not running. Correct local command:

```bash
pnpm dev:langgraph-agent
```

Observed startup:

- LangGraph Agent Server: `http://127.0.0.1:2024`
- Next.js web: `http://localhost:3000`
- Web script injected `LANGGRAPH_AGENT_API_URL=http://localhost:2024` and `LANGGRAPH_AGENT_ASSISTANT_ID=agent`.
- `langgraph.json` graph id: `agent`.
- Startup warning: `langgraph-api 0.8.7` is in Critical support and `0.9.0` is available. This QA run did not upgrade dependencies.

Retest evidence:

- Page GET `http://localhost:3000/demos/langgraph-agent` returned `200` in `6.163s`, response size `102412`.
- Correct adapter API request to `/api/demos/langgraph-agent` returned `200` in `18.830s`.
- Thread id used: `e2e0db2d-96b7-4a82-9059-cfb847d22ec4`.
- Stream contained graph-progress data parts for `route`, `plan`, `tool`, `synthesize`, and `answer`.
- Final answer streamed through `langgraph-answer` text chunks.

Revised result: LangGraph Agent passes locally when the paired Python Agent Server is started through `pnpm dev:langgraph-agent`. The setup caveat remains: `pnpm --dir apps/web dev` alone is insufficient for this demo.

Browser note: in-app Browser control still failed to attach after the earlier Multimodal hang, so this retest used HTTP/API evidence rather than UI clicks.

Second in-app Browser retry:

- Time: 2026-06-02 13:10:40 CST.
- Restarted paired services with `pnpm dev:langgraph-agent`; both services became ready.
- Browser discovery succeeded and listed Codex In-app Browser.
- Tab operations still failed at the webview attach layer:
  - `browser.tabs.list()` / `browser.tabs.selected()` timed out with `Timed out waiting for the Browser webview to attach for this browser-use page`.
  - `browser.tabs.new()` also timed out with the same error.
  - Showing/activating the in-app Browser before `browser.tabs.new()` did not change the result.
- Page health during the same run remained good: `GET /demos/langgraph-agent` returned `200` in `3.612s`, response size `102409`.
- Revised browser note: UI click coverage is still blocked by the in-app Browser tab attach layer, not by the LangGraph local app or paired Agent Server.

Third in-app Browser retry:

- Time: 2026-06-02 13:14:32 CST.
- Restarted paired services with `pnpm dev:langgraph-agent`; both services became ready.
- Browser discovery succeeded, `browser.tabs.new()` succeeded, and navigation to `http://localhost:3000/demos/langgraph-agent` succeeded.
- Initial UI state:
  - Status: `Ready`.
  - Model: `openai/gpt-5-mini`.
  - Assistant: `agent`.
  - Remote API: `http://localhost:2024`.
- Clicked suggestion: `Validate the minimum environment setup for running this LangGraph demo locally.`
- Suggestion result:
  - The message streamed and completed.
  - Thread id: `6ad19f5f-c081-4fd8-9f97-69a341905fd6`.
  - Graph progress showed `route`, `plan`, `tool`, `synthesize`, and `answer`.
  - Composer and Submit returned to enabled state after completion.
- Sent follow-up in the same thread: `continue with one implementation gotcha`.
- Follow-up result:
  - The message streamed and completed.
  - Same thread id remained visible: `6ad19f5f-c081-4fd8-9f97-69a341905fd6`.
  - Graph progress updated for the second turn and showed `route: general`.
  - Composer and Submit returned to enabled state.
- Screenshot: `/tmp/langgraph-ui-retest-2026-06-02.png`.
- Revised browser note: LangGraph UI E2E now passes locally. The earlier attach failures are still useful as browser-harness instability evidence, but they did not reproduce on the third attempt.

## Issues

### QA-LOCAL-008 - P3 - LangGraph API dependency is one minor version behind

Repro:

1. Run `pnpm dev:langgraph-agent`.
2. Watch the `api` process startup logs.

Actual:

- Startup log warned that `langgraph-api 0.8.7` is in Critical support.
- Startup log also reported a newer `0.9.0` version is available.

Repro value:

- Not a functional blocker in this QA run. Keep as a maintenance item before production hardening or if Agent Server behavior changes during deploy.

## Demo Coverage Matrix

| Demo | Method | Result | Notes |
| --- | --- | --- | --- |
| Homepage | UI | Pass | Shows `15` ready demos and `0` roadmap demos. |
| Foundation Chat | UI | Pass | Suggestion answered; manual follow-up answered; input stayed enabled. |
| RAG Chatbot | UI | Pass | NASA logotype suggestion answered with 4 sources; follow-up completed after a long wait. |
| Persistent & Resume Agent | UI | Pass | Suggestion plus follow-up persisted under chat URL after reload. Chat id: `fd3cb984-31df-4103-97ab-ed10aca9d64f`. |
| Streaming Chat Shell | UI | Pass | Suggestion answered; trace drawer opened; replay produced 110 events and reconstructed text. |
| Loop Agent | UI | Pass | HITL checkpoint appeared; approve continued to completed escalation answer. |
| MCP Agent | UI | Pass | Used `project__list_demos` and `project__read_demo_docs`; answer cited project docs. |
| Object Generation | UI | Pass | Structured object generated; regenerate action now explicitly reruns the same input and records a new output. |
| Trace Eval Agent | UI | Pass | Trace, deterministic gate, and LLM judge all ran; one live LLM factual judgment is out of scope for this local QA mechanism check. |
| Multimodal Chatbot | HTTP page plus API | Pass | Cold Next.js dev cache rebuild restored the page; page GET returned `200` and text API answered. See `docs/frontend/multimodal-chatbot.md`. |
| Customer Memory Agent | API | Pass | Thread creation returned `201`; message call used `manageCustomerMemory` for `Brightfield wants launch updates every Friday.` |
| OpenAI Agents SDK Demo | API | Pass | Route streamed and used MCP tool `mcp_openai_agents_demo_docs__read_demo_doc`; response completed. |
| LangGraph Agent | UI | Pass | Setup answer now names `pnpm dev:langgraph-agent`, the real env keys, and `apps/langgraph-agent-api/langgraph.json`; follow-up stayed on the integration route in the same thread. |
| Skills Agent | API | Pass | `grill-with-docs` skill tool selected and streamed successfully. |
| Sandbox Agent | API plus preview GET | Pass | Wrote `index.html`, started preview, returned `https://sb-5uqy6wbewrlq.vercel.run/index.html`; GET returned `sandbox preview ok`. |
| Ultra Chatbot Agent | UI approval plus API stream | Pass | Normal Chrome retest clicked inline `enableSandbox` approval, page showed `Sandbox enabled`, and the next same-chat turn used `bash` with `/vercel/sandbox/project ultra-ui-approval-ok`. |
