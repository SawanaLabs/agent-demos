# AI SDK 6 AI Elements Demos

This context defines the product language for a demo collection that showcases full-stack agent patterns and keeps each example portable for reuse in compatible projects.

## Language

**Agent Demo**:
A standalone example that combines an interactive agent experience, its supporting runtime behavior, a clear copy boundary, and a short explanation of the agent pattern it demonstrates.
_Avoid_: Agent, example, page

**Reusable Agent Module**:
A reusable implementation slice extracted from or used by an **Agent Demo** so the same pattern can be copied into another compatible project.
_Avoid_: Component library item, package

**Copy Boundary**:
The smallest coherent set of files and concepts required to move an **Agent Demo** into another compatible project without untangling unrelated demos.
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

**Technical Evaluator**:
A developer, technical reviewer, or future collaborator who understands the surrounding stack well enough to judge agent quality and reuse potential.
_Avoid_: Visitor, end user, customer

**Demo Quality Bar**:
The internal standard that an **Agent Demo** must meet by making its pattern clear, its full-stack behavior complete, and its reuse potential credible through use and code structure.
_Avoid_: Marketing checklist, feature list

**Roadmap**:
The product-facing view of planned **Agent Demos** that shows direction without implying those demos are already interactive or complete.
_Avoid_: Planned demo catalog, backlog

**Canonical Source Example**:
An AI SDK cookbook, guide, or documentation example selected as the starting point for an **Agent Demo**.
_Avoid_: Inspiration, reference

**Manual Review Gate**:
The human audit step that decides whether and how a **Canonical Source Example** becomes an **Agent Demo**.
_Avoid_: Batch import, auto-conversion

**Source Core**:
The essential official code path or snippet that proves the agent behavior in a **Canonical Source Example** and should be preserved with minimal backend customization.
_Avoid_: Starter code, rough inspiration

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
- A **Demo Catalog Entry** is written primarily for a **Technical Evaluator**.
- An **Agent Demo** is evaluated against the **Demo Quality Bar**.
- The **Roadmap** may include planned **Agent Demos** before they become interactive.
- An **Agent Demo** may originate from a **Canonical Source Example**.
- A **Canonical Source Example** must pass the **Manual Review Gate** before becoming an **Agent Demo**.
- A **Canonical Source Example** provides the **Source Core** for an official-docs-derived **Agent Demo**.

## Example Dialogue

> **Dev:** "If we add a Loop Agent, should its backend code live beside the RAG Agent code?"
> **Domain Expert:** "Only shared modules should cross the **Copy Boundary**. The **Agent Demo** should stay portable as a unit, and its **Demo Catalog Entry** should explain why it exists."

## Flagged Ambiguities

- "agent" can mean an **Agent Demo**, a runtime implementation, or a reusable module. Resolved: use **Agent Demo** for the product-level unit and **Reusable Agent Module** for reusable implementation slices.
- "pattern" should not be free-form. Resolved: use **Agent Pattern** as the controlled business category for cataloging demos.
- The **Demo Quality Bar** is an internal evaluation standard, not required visible copy on demo pages.
- Initial demo selection prioritizes AI SDK cookbook, guide, and documentation examples through the **Manual Review Gate** before original batches are planned.
- "productized" means improving routes, copy boundaries, UI experience, and integration shape while preserving the **Source Core**, especially on backend agent logic.
