Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

Imported source: https://github.com/forrestchang/andrej-karpathy-skills/blob/main/CLAUDE.md

---

# KanbanRPM Agent Guide

This file is for coding agents working on KanbanRPM. Read it before making changes.

## Project Context

KanbanRPM is an Obsidian plugin for research project management. It is not a generic task board. The core product idea is a living-document PM system inspired by Obsidian Kanban and Laminar:

- `Project`: top-level living document.
- `Subproject`: workstream under a Project.
- `Big Action`: trackable chunk of work under Project/Subproject.
- `Small action`: checkbox task that stays inside a Markdown document.
- `Timeline`: Laminar-style horizontal date columns with memo/todo cards and project markers.
- `Perpetual`: recurring routines such as weekly reviews or backups.
- `Dependencies`: lightweight `Depends on` / `Blocks` relations.

The current active implementation is TypeScript in:

```text
src-kanbanrpm/
```

The upstream `obsidian-community/obsidian-kanban` source is preserved under:

```text
src/
```

Treat upstream files as reference/attribution material unless the user explicitly asks otherwise.

## Non-Negotiables

- Do not modify `.obsidian/plugins/laminar`.
- Do not modify `.obsidian/plugins/obsidian-kanban`.
- Do not use the old `laminar-pm` plugin as the active direction.
- Do not make Daily note integration the primary workflow again. KanbanRPM now uses Timeline Memo for lightweight daily notes.
- Do not add heavy frontmatter by default. New documents should be readable living documents first.
- Do not automatically rewrite or migrate the user's existing vault notes unless explicitly requested.
- When user-facing behavior changes, update both manuals:
  - `docs/KanbanRPM Manual.md`
  - `docs/KanbanRPM Manual ko.md`
- In the Korean manual, keep plugin UI terms in English.

## Active Source Layout

```text
src-kanbanrpm/main.ts             Plugin lifecycle and command orchestration
src-kanbanrpm/board-view.ts       Board/Table/List/Timeline UI and interactions
src-kanbanrpm/card-repository.ts  Card files, schema, hierarchy, dependencies, actions
src-kanbanrpm/modals.ts           Document and confirmation modals
src-kanbanrpm/settings-tab.ts     Plugin settings
src-kanbanrpm/weekly-review.ts    Weekly review note integration
src-kanbanrpm/schema.ts           Schema reference note content
src-kanbanrpm/types.ts            Shared TypeScript interfaces
src-kanbanrpm/constants.ts        Defaults and vocabularies
src-kanbanrpm/utils.ts            Pure helpers
src-kanbanrpm/styles.css          Plugin CSS
```

Build output goes to the live Obsidian plugin folder:

```text
D:\Obsidian Vaults\Project_Manage_test\.obsidian\plugins\kanban-rpm
```

The release bundle is generated under:

```text
dist/kanban-rpm-0.1.0/
```

## Data Model Direction

Use a hierarchy that can grow later. Current explicit hierarchy fields are:

```yaml
primary_project:
primary_subproject:
projects: []
subprojects: []
```

Do not collapse hierarchy storage into one opaque `parent` field. Keep the design friendly to future levels such as a project parent above Project or a sub-subproject below Subproject.

The broad classification field is `Category`, stored as `workstream_type`. Avoid reintroducing overlapping concepts like `area`, `project_kind`, `importance`, or `stage` unless the user deliberately reopens that design.

`status` is execution state and is globally configurable in settings.

## Timeline Direction

Timeline should feel closer to Laminar than a spreadsheet:

- horizontal date columns
- kanban-like card stacks inside each date
- toggleable `Memo` section per date
- clickable memo checkbox cards
- project/subproject marker sections
- `Perpetual` sidebar

The Timeline `Show` dropdown is a marker-kind display filter, not card metadata:

- `Show: All markers`
- `Show: Review`
- `Show: Due`
- `Show: Tasks`
- `Show: Recurring`

Timeline Memo files live under:

```text
KanbanRPM Workspace/timeline/YYYY-MM-DD.md
```

## Development Commands

On this Windows workspace, prefer `npm.cmd`:

```powershell
npm.cmd run typecheck
npm.cmd run build
npm.cmd run check
npm.cmd run package
npm.cmd run smoke
```

Expected verification before finishing substantial changes:

```powershell
npm.cmd run check
npm.cmd run smoke
```

Run `npm.cmd run package` when build output or release bundle consistency matters.

## Git Hygiene

- Work on the current branch unless the user asks for a new branch.
- Keep commits scoped and meaningful.
- Do not revert user changes.
- If the worktree is dirty, inspect before editing.
- Build output in the live plugin folder is generated; source changes belong in this repo.

## Documentation Rules

Update these when behavior changes:

- `README.md`
- `docs/KanbanRPM Manual.md`
- `docs/KanbanRPM Manual ko.md`
- `docs/Release Notes.md`

Historical planning docs can mention older behavior, but current manuals and README should match the actual plugin.

## Product Taste

Prefer practical PM flows over feature sprawl. The plugin should help answer:

- What is active?
- What is blocked?
- What is waiting?
- What needs review soon?
- Which project/subproject does this belong to?
- What small actions exist inside the living document?
- What happened recently, and where is that recorded?

When in doubt, keep Markdown documents useful on their own, and make the plugin a control surface over those documents.
