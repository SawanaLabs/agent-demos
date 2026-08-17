# Minimal Chat Agent

The Minimal Chat Agent is a source-backed tool-calling demo adapted from the open-source [`shadcn-ui/chatbot-template`](https://github.com/shadcn-ui/chatbot-template).

## What it demonstrates

- OpenAI provider-native `web_search` with streamed citations;
- a typed `github_repo` server tool for public repository metadata;
- `ask_user` as a human-in-the-loop tool boundary;
- automatic model continuation after the questionnaire returns structured answers;
- bounded multi-step execution, abort propagation, setup validation, and metered API access.

## Why this is separate from Foundation Chat

Foundation Chat is the minimum streaming transport baseline. Minimal Chat Agent is the smallest complete agent loop in the gallery: the model can choose external capabilities, pause without inventing a preference, and resume from UI-supplied tool output.

## Source decision

The upstream source was inspected at commit `8d3939449dbc26dffa86af3b7776618a08f90bb8` on 2026-08-14. It currently targets AI SDK 7. Agent Demos remains pinned to AI SDK 6, so this slice preserves the Source Core behavior while adapting APIs and existing host primitives rather than forcing a repository-wide framework upgrade.

## Security and reliability boundaries

- `AI_GATEWAY_API_KEY` stays server-only.
- The selected model must have an `openai/` prefix because the hosted search tool is OpenAI-native.
- The GitHub lookup accepts only `owner/name`, calls the public API server-side, and times out after five seconds.
- API errors are normalized before reaching the chat UI.
- The route is covered by the shared site usage gate.
- Agent steps are bounded to prevent unbounded tool loops.

## Registry boundary

The app implementation is canonical. `scripts/registry-sync/minimal-chat-agent.manifest.json` declares the files and shared assets copied into `registry/minimal-chat-agent`, where imports are rewritten for a fresh Next.js consumer.
