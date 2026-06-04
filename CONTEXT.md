# Agent Demos

This context defines the product language for a demo collection that showcases full-stack agent patterns and keeps each example portable for reuse in compatible projects.

## Project Wish

This repository should feel like a place where builders and agents can do serious work with unusually low friction.

We are building Agent Demos so that a developer, a future PR author, or a developer-directed coding agent can read the repository, understand the project language, install or copy an **Agent Demo**, and keep moving without guessing which stack, files, or setup steps matter.

The experience we are aiming for is ambitious: a developer should be able to hand our registry guide to their own coding agent, let it research, scaffold, install, verify, and guide the few human-only setup steps, then end with a production-capable AI starter that can be deployed under their domain and extended with new business modules or additional **Agent Demos**.

That means this codebase should be pleasant for both humans and agents: coherent modules, obvious copy boundaries, explicit contracts, visible runtime state, useful errors, and docs that help experienced developers move faster while giving first-time builders a path their agent can safely lead.

When tradeoffs are unclear, favor the path that makes the next competent agent more autonomous and the next developer more confident to invest in this codebase.

## Language

**Agent Demo**:
A standalone example that combines an interactive agent experience, its supporting runtime behavior, a clear copy boundary, and a short explanation of the agent pattern it demonstrates.
_Avoid_: Agent, example, page

**Reusable Agent Module**:
A reusable implementation slice extracted from or used by an **Agent Demo** so the same pattern can be copied into another compatible project.
_Avoid_: Component library item, package

**Copy Boundary**:
The smallest coherent set of files and concepts required to install or move an **Agent Demo** into another compatible project without untangling unrelated demos.
_Avoid_: Folder, route

**Demo Catalog Entry**:
The product-facing listing that presents an **Agent Demo** in the project catalog and documentation surfaces.
_Avoid_: Metadata, route config, card data

**Demo Gallery**:
The homepage presentation surface that shows **Agent Demos** as designed cards with titles and concise visual summaries of their agent patterns.
_Avoid_: Landing page, docs index

**Gallery Visual**:
A stylized product-metaphor asset that helps a **Technical Evaluator** quickly grasp the agent behavior behind a **Demo Catalog Entry**.
_Avoid_: Decorative illustration, generic thumbnail

**Demo Workspace**:
The primary interactive surface of an **Agent Demo**, where the evaluator operates the agent rather than reading static explanation.
_Avoid_: Documentation page, playground copy

**Empty State Explanation**:
The lightweight explanatory content shown inside a **Demo Workspace** before the evaluator starts interacting, then replaced by live messages or results.
_Avoid_: Header documentation, onboarding page

**Agent Pattern**:
The reusable agent behavior category demonstrated by an **Agent Demo**.
_Avoid_: Tag, topic

**Agent Scenario Coverage**:
The product-facing grouping that shows how the demo set spans practical agent application scenarios through multiple **Agent Patterns** and concrete **Agent Demos**.
_Avoid_: Exhaustive agent taxonomy, feature checklist

**Technical Evaluator**:
A developer, technical reviewer, or future collaborator who understands the surrounding stack well enough to judge agent quality and reuse potential.
_Avoid_: Visitor, end user, customer

**Registry Consumer**:
A developer, developer-directed coding agent, or beginner evaluator who wants to install an **Agent Demo** into a compatible project through its **Copy Boundary**.
_Avoid_: End user, app customer, casual visitor

**Registry Guide Page**:
A public-facing documentation surface for **Registry Consumers** that explains how to install **Agent Demos** into compatible projects from an already published registry.
_Avoid_: Internal registry docs, author maintenance guide, blog-only announcement

**Registry Install Hint**:
A compact install prompt that links to the **Registry Guide Page** and shows a demo-specific registry command when the **Agent Demo** is registry-backed.
_Avoid_: Full tutorial, duplicated registry guide, author setup notes

**Registry Export**:
The public shadcn registry surface that exposes only **Agent Demos** whose **Copy Boundary** is ready for **Registry Consumers**.
_Avoid_: Every registry source file, generated JSON dump

**Registry Availability**:
The joined classification that says whether a ready **Agent Demo** is in the **Registry Export**, kept as private registry source, or explicitly omitted with a reason.
_Avoid_: Implicit omission, catalog drift, install badge guess

**Demo Quality Bar**:
The internal standard that an **Agent Demo** must meet by making its pattern clear, its full-stack behavior complete, and its reuse potential credible through use and code structure.
_Avoid_: Marketing checklist, feature list

**Resource Abuse and Privacy Review**:
A focused readiness review for an **Agent Demo** that asks whether public operation can burn provider or infrastructure resources, expose private demo data, or gain unintended write control over project code or workspace state.
_Avoid_: Full security audit, penetration test, compliance audit

**Private Demo Data**:
Visitor-scoped **Agent Demo** data that should not be visible to another visitor, including messages, uploaded files, memories, votes, generated artifacts, and sandbox artifacts.
_Avoid_: Sensitive data by default, regulated data, account data

**Demo Data Retention Window**:
The short-lived period after which visitor-scoped **Private Demo Data** should be removed from demo storage; the default target for this repository is seven days.
_Avoid_: Permanent history, archive, backup policy

**Production-Ready Demo**:
An **Agent Demo** whose copy boundary can be used in a compatible real project after required configuration is provided.
_Avoid_: Toy demo, throwaway example

**Roadmap**:
The product-facing view of planned **Agent Demos** that shows direction without implying those demos are already interactive or complete.
_Avoid_: Planned demo catalog, backlog

**Canonical Source Example**:
An AI SDK Recipes, guide, or documentation example selected as the starting point for an **Agent Demo**.
_Avoid_: Inspiration, reference

**Manual Review Gate**:
The human audit step that decides whether and how a **Canonical Source Example** becomes an **Agent Demo**.
_Avoid_: Batch import, auto-conversion

**Source Core**:
The essential official code path or snippet that proves the agent behavior in a **Canonical Source Example** and should be preserved with minimal backend customization.
_Avoid_: Starter code, rough inspiration

**Ultra Chatbot Agent**:
An **Agent Demo** that models a production-style AI SDK chatbot application by porting the `vercel/chatbot` application shape into one coherent, copyable demo experience.
_Avoid_: Ultra Agent, Ultra Vercel Agent, OpenAI Agents SDK demo

**Session Sandbox Capability**:
A chat-scoped execution capability in the **Ultra Chatbot Agent** that a **Technical Evaluator** can enable for one conversation when the task requires sandbox-backed filesystem or command work.
_Avoid_: Global sandbox mode, site-wide sandbox access

**Application Shape Port**:
A port that preserves the product capabilities and architectural intent of a reference application while reorganizing the copy boundary around this repository's **Agent Demo** structure.
_Avoid_: Fork, clone, line-by-line copy

**Completeness-First Port**:
An **Application Shape Port** that keeps every compatible reference capability in scope and changes only the parts that conflict with this repository's product, identity, or architecture boundaries.
_Avoid_: Partial port by default, lightweight rewrite

**Owner**:
The identity that owns private chatbot data inside an **Agent Demo**, such as chats, messages, attachments, artifacts, and feedback.
_Avoid_: User when no authentication exists, visitor scattered through business language

**Visitor Owner**:
An **Owner** represented by a browser-scoped HTTP-only cookie instead of a login session.
_Avoid_: Anonymous user, temporary user

**Site Visitor Owner**:
A **Visitor Owner** scoped to the published demo website as a whole, used for ownership decisions that apply across multiple **Agent Demos**.
_Avoid_: Per-demo visitor, registry consumer, authenticated user

**Hosted LangGraph Service Key**:
A server-only shared secret that lets the LangGraph Agent Demo's frontend route call the separately deployed Python LangGraph backend through `x-api-key`.
_Avoid_: User API key, model provider key, public token

## Relationships

- An **Agent Demo** may use one or more **Reusable Agent Modules**.
- A **Reusable Agent Module** can be shared by multiple **Agent Demos**.
- A **Copy Boundary** belongs to exactly one **Agent Demo** unless the boundary is explicitly shared through a **Reusable Agent Module**.
- An **Agent Demo** has exactly one **Demo Catalog Entry**.
- A **Demo Gallery** presents multiple **Demo Catalog Entries**.
- A **Demo Catalog Entry** may use one **Gallery Visual**.
- An **Agent Demo** has one primary **Demo Workspace**.
- A **Demo Workspace** may show an **Empty State Explanation** before interaction begins.
- An **Agent Demo** demonstrates exactly one primary **Agent Pattern**.
- **Agent Scenario Coverage** groups multiple **Agent Patterns** through representative **Agent Demos**.
- A **Demo Catalog Entry** is written primarily for a **Technical Evaluator**.
- A **Registry Consumer** installs an **Agent Demo** by following its **Copy Boundary** into a compatible project.
- A **Registry Guide Page** is written for **Registry Consumers** and should refer author maintenance details back to durable internal docs instead of duplicating them.
- A **Registry Install Hint** may appear in the **Demo Gallery** or near an **Agent Demo**'s operational sidebar, and should stay shorter than the **Registry Guide Page**.
- A **Registry Export** contains zero or more **Agent Demos** and may exclude registry source work that has not yet met the **Demo Quality Bar**.
- **Registry Availability** must classify every ready **Agent Demo** so the **Demo Catalog Entry** and **Registry Export** cannot drift silently.
- An **Agent Demo** is evaluated against the **Demo Quality Bar**.
- A **Resource Abuse and Privacy Review** evaluates an **Agent Demo** before it is treated as a **Production-Ready Demo**.
- **Private Demo Data** is scoped to one **Visitor Owner** and should expire through the **Demo Data Retention Window**.
- An **Agent Demo** is expected to become a **Production-Ready Demo** before it is treated as ready.
- The **Roadmap** may include planned **Agent Demos** before they become interactive.
- An **Agent Demo** may originate from a **Canonical Source Example**.
- A **Canonical Source Example** must pass the **Manual Review Gate** before becoming an **Agent Demo**.
- A **Canonical Source Example** provides the **Source Core** for an official-docs-derived **Agent Demo**.
- The **Ultra Chatbot Agent** is a distinct **Agent Demo** from the OpenAI Agents SDK demo.
- A **Session Sandbox Capability** belongs to exactly one **Ultra Chatbot Agent** conversation.
- The **Ultra Chatbot Agent** should be an **Application Shape Port** of `vercel/chatbot`, not a line-by-line fork.
- The **Ultra Chatbot Agent** should use a **Completeness-First Port** boundary for `vercel/chatbot`.
- The first **Ultra Chatbot Agent** release should use a **Visitor Owner** while keeping the **Owner** concept clear enough to support authenticated ownership later.
- A **Site Visitor Owner** may interact with multiple **Agent Demos** on the published demo website.
- A **Site Visitor Owner** stays outside any **Agent Demo** **Copy Boundary** and should not be distributed through the registry.
- The **Hosted LangGraph Service Key** protects the service-to-service boundary between the LangGraph Agent Demo's frontend route and its hosted Python backend.

## RAG Chatbot Direction

The `rag-chatbot` **Agent Demo** should model a production-ready document support agent for an independent website chatbot. Its business workflow starts with a curated or uploaded document set, such as product docs, policy pages, FAQs, or design guideline PDFs, then answers visitor questions from retrieved document evidence.

The implementation should preserve the AI SDK RAG guide's **Source Core**: durable Postgres storage with vector search, document/resource ingestion, embeddings, retrieval, tool calling, and a bounded multi-step loop. Productization should add a credible **Demo Workspace** for document ingestion, grounded answers, visible retrieval/tool state, citations or source snippets, and explicit refusal when the indexed documents do not contain enough evidence.

The first seed document should be a well-known public design-guide PDF, with the NASA Graphics Standards Manual as the preferred initial candidate. The demo may explain what the indexed manual says, but it must not imply trademark, logo, or commercial usage permission beyond the source document's own claims.

## Example Dialogue

> **Dev:** "If we add a Loop Agent, should its backend code live beside the RAG Agent code?"
> **Domain Expert:** "Only shared modules should cross the **Copy Boundary**. The **Agent Demo** should stay portable as a unit, and its **Demo Catalog Entry** should explain why it exists."

## Flagged Ambiguities

- "agent" can mean an **Agent Demo**, a runtime implementation, or a reusable module. Resolved: use **Agent Demo** for the product-level unit and **Reusable Agent Module** for reusable implementation slices.
- "pattern" should not be free-form. Resolved: use **Agent Pattern** as the controlled business category for cataloging demos.
- "scenario coverage" is product framing for showing breadth across practical agent use cases. It is not a claim that the project exhaustively covers every possible agent architecture.
- The **Demo Quality Bar** is an internal evaluation standard, not required visible copy on demo pages.
- "demo" does not mean toy or disposable. Resolved: ready demos must be production-ready enough to copy into real compatible projects after configuration.
- Initial demo selection prioritizes AI SDK Recipes, guide, and documentation examples through the **Manual Review Gate** before original batches are planned.
- "productized" means improving routes, copy boundaries, UI experience, and integration shape while preserving the **Source Core**, especially on backend agent logic.
- "security audit" can mean dependency scanning, penetration testing, compliance, or infrastructure review. Resolved: use **Resource Abuse and Privacy Review** when the goal is protecting provider spend, Vercel resources, sandbox capacity, private demo data, and project code integrity for this demo collection.
- "privacy" for this demo collection means visitor-to-visitor isolation and short-lived demo storage. It does not imply a regulated-data or long-term account privacy program unless the product boundary is explicitly expanded.
- "API key" can mean a provider credential, a user credential, or a service-to-service secret. Resolved: for the LangGraph backend access boundary, use **Hosted LangGraph Service Key** and keep provider credentials such as `AI_GATEWAY_API_KEY` separate and server-only.
