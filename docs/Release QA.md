# KanbanRPM Release QA

Use this checklist before calling a KanbanRPM build releasable.

## Static Checks

- [ ] `npm install`
- [ ] `npm run check`
- [ ] `npm run package`
- [ ] `npm run smoke`
- [ ] Confirm `versions.json` maps the current `manifest.json` version to `minAppVersion`.

## Bundle Contents

Confirm the release bundle contains only:

```text
main.js
manifest.json
styles.css
```

Confirm the live plugin folder contains only:

```text
.obsidian/plugins/kanban-rpm/main.js
.obsidian/plugins/kanban-rpm/manifest.json
.obsidian/plugins/kanban-rpm/styles.css
```

## Obsidian Smoke Test

- [ ] Enable `KanbanRPM`.
- [ ] Confirm original `Laminar` can stay enabled.
- [ ] Confirm original `Kanban` can stay enabled.
- [ ] Run `KanbanRPM: Open board`.
- [ ] Confirm lanes render.
- [ ] Create a card.
- [ ] Edit the card.
- [ ] Drag it to another lane.
- [ ] Drag it within the same lane.
- [ ] Run `Normalize order`.
- [ ] Duplicate the card.
- [ ] Archive the duplicate.
- [ ] Delete a test card.

## Data Workflow

- [ ] Create or open a group note.
- [ ] Add `source_notes` to a card and confirm `Action index` reads unchecked actions.
- [ ] Use `Set next` from `Action index`.
- [ ] Run `Write arrows` and confirm arrow notes are created under `arrows/`.
- [ ] Run `Import legacy` and confirm preview appears without editing legacy notes.
- [ ] Seed one legacy card and confirm duplicate prevention on rescan.

## Daily/Weekly Workflow

- [ ] Confirm today's Daily note exists.
- [ ] Use `Send to Daily`.
- [ ] Use `Pull Daily`.
- [ ] Confirm duplicate Daily lines are skipped.
- [ ] Confirm `Daily section` insertion works.
- [ ] Run `Weekly review`.
- [ ] Confirm weekly review note opens or is created under the configured folder.

## Documentation

- [ ] README describes current features.
- [ ] `docs/Install.md` matches the current build process.
- [ ] `docs/Release Notes.md` includes the current version.
- [ ] English manual is current.
- [ ] Korean manual is current and keeps plugin UI terms in English.

## QA Log

```text
Date: 2026-05-07 08:33 +09:00
Tester: Byunghyun Kim
KanbanRPM version: 0.1.0
Scope: Static checks, release bundle, Obsidian plugin enable/open, board workflow, card create/edit/drag/drop/order, legacy import, Daily/Weekly workflow.
Result: Passed. User confirmed all checked items worked without issues.
Notes: This is the first manually confirmed release-readiness checkpoint after Phase 7.
```
