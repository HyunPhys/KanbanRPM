# KanbanRPM Agent Guide

Read this before changing KanbanRPM. Keep this file short; it is loaded as agent context.

## Product North Star

KanbanRPM is an Obsidian research/lab project manager, not a generic task app.

Core model:

```text
Project -> Subproject -> Big Action -> Small action checkbox
```

- Project/Subproject/Big Action are living Markdown documents.
- Small actions stay as checkbox tasks inside those documents.
- The plugin is a control surface over useful notes, not a replacement for notes.
- Timeline should feel Laminar-like: horizontal date columns, Memo cards, Routines, and project-aware markers.

## Hard Rules

- Active source is `src-kanbanrpm/`; upstream `src/` is reference/attribution only.
- Do not modify `.obsidian/plugins/laminar` or `.obsidian/plugins/obsidian-kanban`.
- Do not revive `laminar-pm` as the active direction.
- Do not make Daily notes the primary workflow again; use Timeline Memo for lightweight daily planning.
- Do not add heavy default frontmatter. New documents must remain readable.
- Do not auto-migrate or rewrite user vault notes unless explicitly requested.
- If behavior is ambiguous or product intent matters, ask before coding.
- If user-facing behavior changes, update both manuals:
  - `docs/KanbanRPM Manual.md`
  - `docs/KanbanRPM Manual ko.md`
- In Korean docs, keep plugin UI terms in English.

## Current Architecture

Important files:

```text
src-kanbanrpm/main.ts             Plugin lifecycle and commands
src-kanbanrpm/board-view.ts       Board/Table/List/Timeline UI
src-kanbanrpm/card-repository.ts  Card files, schema, hierarchy, dependencies, actions
src-kanbanrpm/modals.ts           Create/edit/confirm modals
src-kanbanrpm/settings-tab.ts     Plugin settings
src-kanbanrpm/types.ts            Shared types
src-kanbanrpm/styles.css          Plugin CSS
```

Generated Obsidian plugin output:

```text
D:\Obsidian Vaults\Project_Manage_test\.obsidian\plugins\kanban-rpm
```

## Data Conventions

Hierarchy is explicit and future-expandable:

```yaml
primary_project:
primary_subproject:
projects: []
subprojects: []
```

- Do not collapse hierarchy into one opaque `parent`.
- `status` is execution state and is configurable in settings.
- `Category` is the broad classification field, stored as `workstream_type`.
- Avoid reintroducing overlapping fields like `area`, `project_kind`, `importance`, or `stage`.
- Project color means Project identity only; card type is shown by structure/stripe, not color.

## Verification

On this Windows workspace, use `npm.cmd`:

```powershell
npm.cmd run typecheck
npm.cmd run build
npm.cmd run check
npm.cmd run smoke
npm.cmd run package
```

Before finishing substantial code changes, run:

```powershell
npm.cmd run check
npm.cmd run smoke
```

Use `npm.cmd run package` when release output matters.

## Git And Docs

- Work on the current branch unless asked otherwise.
- Inspect dirty worktrees before editing; never revert user changes.
- Keep commits scoped if the user asks for commits.
- Generated build output is not source.
- Update `README.md`, manuals, schema docs, or release notes when the visible product changes.

## Product Taste

Optimize for answering:

- What is active, blocked, waiting, or due for review?
- Which Project/Subproject owns this item?
- What small actions exist in the living document?
- What happened recently, and where is it recorded?

Prefer clear PM workflows over feature sprawl.
