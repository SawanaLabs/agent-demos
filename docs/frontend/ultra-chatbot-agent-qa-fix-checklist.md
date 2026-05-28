---
title: Ultra Chatbot Agent QA Fix Checklist
description: Temporary second-round QA checklist for the Ultra Chatbot Agent manual acceptance pass.
updateAt: 2026-05-28
---

# Ultra Chatbot Agent QA Fix Checklist

Temporary working checklist for the second QA pass. Delete this file after the fixes are implemented and browser-verified.

## Route Under Test

- `http://localhost:3000/demos/ultra-chatbot-agent/a4f2bccc-7030-4c31-8c5f-178122dae7af`

## Global UX

- [x] Light mode icon contrast: history delete button currently shows a blank white square until hover; make icon/button states theme-flexible.

## Use Case 1: Project Docs

- [x] `project__search_project_docs` is visible and called.

## Use Case 2: Web Search + Research Report

- [x] Research report renders.
- [x] Research report resource links need theme-flexible hover/active contrast.
- [x] Check whether research report resource URLs are model hallucinations or a code mapping bug. Implementation now lets `createResearchReport` preserve exact `web_search` sources passed by the agent.
- [x] Web search source UI emits duplicate React key warnings when many sources are shown.

## Use Case 3: Preindexed RAG

- [x] Ultra RAG retrieval still fails to find content; compare with the working RAG demo and verify embedding/index wiring. Implementation now retries broad queries with source-aware NASA manual terms when the first retrieval returns no snippets.

## Use Case 4: Document Creation

- [x] Document creation works when explicitly requested.

## Use Case 5: Code Artifact

- [x] Code preview should use the AI Elements code block component pattern.

## Use Case 6: Sandbox HITL

- [ ] Sandbox flow is currently unusable: repeated enable approvals keep appearing after sandbox is enabled.
- [ ] Disabling from the side panel and then approving inline produces confusing capability state.
- [ ] When sandbox is enabled from the side panel, sending a message can become ineffective.
- [ ] Sandbox failure/refresh can interrupt the task without a resume or thinking state.
- [ ] Treat sandbox as a separate focused fix after stabilizing the rest of this pass.

## Use Case 7: Attachments

- [x] Long attachment preview titles can stretch the conversation width.
- [x] Editing a message with attachments should show the existing attachment previews.
- [x] Attachment previews need per-attachment delete controls.

## Use Case 8: Delete Chat

- [x] Delete chat flow passes after the first-round fix.
