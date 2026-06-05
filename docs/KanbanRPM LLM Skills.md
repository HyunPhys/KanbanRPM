# KanbanRPM LLM Skills

Use these prompts with the generated files under `KanbanRPM Workspace/LLM/`.

## /kanbanrpm-next

Purpose: choose which non-active card should become active next.

Read:

1. `KanbanRPM Workspace/LLM/00 LLM Entry.md`
2. `KanbanRPM Workspace/LLM/01 Next Work Candidates.md`
3. `KanbanRPM Workspace/LLM/03 Recent Changes.md`
4. Relevant `Project Briefs/*.md` only when needed

Prompt:

```text
Use the KanbanRPM LLM context to recommend 3 non-active cards to activate next.
Compare urgency, priority, dependency state, cognitive load, active workload, and research value.
Separate strong recommendations from candidates that need clarification.
Do not rewrite notes unless I explicitly ask.
```

Expected output:

```markdown
## Recommended Next Work

1. [[Card]]
- Why:
- Tradeoff:
- First step:

## Do Not Activate Yet

## Questions
```

## /kanbanrpm-brief

Purpose: brief a Project, Subproject, or Big Action.

Read:

1. `KanbanRPM Workspace/LLM/00 LLM Entry.md`
2. Relevant generated Project Brief
3. `KanbanRPM Workspace/LLM/02 Project Map.md`
4. `KanbanRPM Workspace/LLM/03 Recent Changes.md`
5. Original living document only if the generated brief is insufficient

Prompt:

```text
Brief me on this KanbanRPM item.
Summarize current state, recent progress, waiting/blockers, open loops, and recommended attention.
Clearly state when more source context is needed.
```

Expected output:

```markdown
## Current State
## Recent Progress
## Waiting / Blockers
## Risks
## Recommended Attention
## Source Notes To Open
```

## /kanbanrpm-plan

Purpose: discuss research/content strategy for a specific Project, Subproject, or Big Action.

Read:

1. `KanbanRPM Workspace/LLM/00 LLM Entry.md`
2. The user-specified original living document
3. Its relevant references/source notes
4. Related LLM Wiki pages if available
5. Generated Project Brief only for orientation

Prompt:

```text
Help me plan the research/content direction for this KanbanRPM item.
Do not rely only on generated PM briefs.
Read the original living document and relevant references.
Separate PM state from research interpretation.
Discuss possible paths, what evidence would distinguish them, and concrete next small actions.
```

Expected output:

```markdown
## Current Understanding
## Core Question
## Evidence / Constraints
## Possible Paths
## Recommended Direction
## Deciding Evidence
## Concrete Next Small Actions
```
