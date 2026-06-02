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
- Ultra sandbox API path passed locally after sandbox capability was enabled; the UI approve-click flow was not completed because the browser session failed before that point.

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

### QA-LOCAL-004 - P2 - Full UI approval path for Ultra sandbox was not completed in this run

Repro attempted:

1. POST to `/api/demos/ultra-chatbot-agent` asking to enable sandbox and run `pwd`.
2. The stream produced a `tool-approval-request` for `enableSandbox`.
3. Browser UI approval could not be clicked after the browser session failed during Multimodal navigation.

Actual API evidence:

- First turn approval request works.
- API-level capability enablement works:
  - PATCH `/api/demos/ultra-chatbot-agent/{chatId}/capabilities` with `{"sandboxEnabled":true}` returned `{"sandboxEnabled":true}`.
- Second turn with the same chat and cookie exposed the `bash` tool and succeeded:
  - Command: `pwd && echo local sandbox ok`
  - Tool output: `/vercel/sandbox/project` and `local sandbox ok`

Repro value:

- Local API layer passed. The user's reported production issue, "Ultra sandbox cannot be used after approval", still needs a real UI click/reload repro once the browser harness can stay attached or a normal browser is used.

### QA-LOCAL-005 - P2 - In-app Browser input automation is unreliable for this app

Repro:

1. Use in-app Browser automation to fill a demo textarea.

Actual:

- `locator.fill`, `locator.type`, and `tab.cua.type` failed with `Browser Use virtual clipboard is not installed`.
- Character-by-character keyboard `press` worked and was used for manual follow-up messages.

Repro value:

- This is likely a QA harness limitation, not an app bug. It matters because it slowed local E2E and prevented clean multi-turn UI coverage after the browser session broke.

### QA-LOCAL-006 - P3 - Object Generation "Replay generation" creates a new record

Repro:

1. Open `http://localhost:3000/demos/object-generation`.
2. Click suggestion: `Generate a launch-risk object for this pricing page draft and flag unsupported claims.`
3. Click `Replay generation`.

Expected:

- If "Replay" means audit replay, it should restore or rerender the same recorded output.
- If "Replay" means rerun, the label should make that clear.

Actual:

- First output had record id `f52d95ee`.
- Replay produced a new output with record id `7fb1a572` and changed score/content.

Repro value:

- Low-priority wording/behavior ambiguity. Functional structured output worked.

### QA-LOCAL-007 - P2 - LangGraph answers are functional but under-grounded in this repo's local setup

Repro:

1. Start paired services: `pnpm dev:langgraph-agent`.
2. Open `http://localhost:3000/demos/langgraph-agent`.
3. Click suggestion: `Validate the minimum environment setup for running this LangGraph demo locally.`
4. Send follow-up: `continue with one implementation gotcha`.

Expected:

- The setup answer should name this repo's actual local command and env contract:
  - `pnpm dev:langgraph-agent`
  - `LANGGRAPH_AGENT_API_URL=http://localhost:2024`
  - `LANGGRAPH_AGENT_ASSISTANT_ID=agent`
  - `apps/langgraph-agent-api/langgraph.json`
- Follow-up should stay grounded in the LangGraph Agent Server / Next.js adapter context unless the user clearly asks for a generic software gotcha.

Actual:

- First answer streamed successfully but used generic names such as `AGENT_SERVER_URL`, `AGENT_SERVER_API_KEY`, `ASSISTANT_ID`, and `THREAD_ID`.
- It suggested generic `npm install` / `npm run dev` style setup rather than this repo's paired `pnpm dev:langgraph-agent`.
- Follow-up streamed successfully but answered with a generic mutable-state race-condition gotcha. The graph routed the second turn as `general`.

Repro value:

- Functional UI pass, content-quality fail. The agent graph works, but the prompt/knowledge grounding should better anchor local setup answers to the repo's actual command and env names.

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
| Object Generation | UI | Pass with P3 note | Structured object generated; replay wording/behavior is ambiguous. |
| Trace Eval Agent | UI | Pass | Trace, deterministic gate, and LLM judge all ran; one live LLM factual judgment is out of scope for this local QA mechanism check. |
| Multimodal Chatbot | HTTP page plus API | Pass | Cold Next.js dev cache rebuild restored the page; page GET returned `200` and text API answered. See `docs/frontend/multimodal-chatbot.md`. |
| Customer Memory Agent | API | Pass | Thread creation returned `201`; message call used `manageCustomerMemory` for `Brightfield wants launch updates every Friday.` |
| OpenAI Agents SDK Demo | API | Pass | Route streamed and used MCP tool `mcp_openai_agents_demo_docs__read_demo_doc`; response completed. |
| LangGraph Agent | UI | Pass with content note | Third Browser retry passed suggestion plus follow-up in one thread after `pnpm dev:langgraph-agent`; answer grounding needs work. See QA-LOCAL-007. |
| Skills Agent | API | Pass | `grill-with-docs` skill tool selected and streamed successfully. |
| Sandbox Agent | API plus preview GET | Pass | Wrote `index.html`, started preview, returned `https://sb-5uqy6wbewrlq.vercel.run/index.html`; GET returned `sandbox preview ok`. |
| Ultra Chatbot Agent | API | Partial UI gap, API pass | Approval request generated; manual capability patch enabled sandbox; `bash` returned `/vercel/sandbox/project` and `local sandbox ok`. |

## Notes For Next Fix Pass

- For Ultra, use a normal browser or repaired browser harness to retest the actual approve button. The API route and sandbox tools currently pass locally after capability enablement.
- LangGraph UI is locally usable through `pnpm dev:langgraph-agent`; improve prompt grounding so setup answers use this repo's real env names and paired command.
