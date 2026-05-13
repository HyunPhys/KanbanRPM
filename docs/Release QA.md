# KanbanRPM Release QA

Use this checklist before calling a KanbanRPM build releasable.

## Static Checks

- [ ] `npm install`
- [ ] `npm run check`
- [ ] `npm run package`
- [ ] `npm run smoke`
- [ ] Confirm `package.json`, `manifest.json`, and `versions.json` agree on the current version.

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

The live plugin folder may also contain Obsidian-generated `data.json`.

## Obsidian Smoke Test

- [ ] Enable `KanbanRPM`.
- [ ] Confirm original `Laminar` can stay enabled.
- [ ] Confirm original `Kanban` can stay enabled.
- [ ] Run `KanbanRPM: Open board`.
- [ ] Confirm `Board`, `Table`, `List`, and `Timeline` views render.
- [ ] Create a `Project` document.
- [ ] Create a `Subproject` under that Project.
- [ ] Create a `Big Action` under that Project/Subproject.
- [ ] Confirm Project documents appear in `Project notes`, not in status lanes.
- [ ] Edit the Big Action.
- [ ] Drag the Big Action to another lane.
- [ ] Drag it within the same lane.
- [ ] Run `Normalize order`.
- [ ] Duplicate the card.
- [ ] Archive the duplicate.
- [ ] Delete a test card.

## Board Flow

- [ ] Drag card A's right connector dot to card B's left connector area.
- [ ] Confirm card B gains card A under `### Flow` -> `Preceded by`.
- [ ] Confirm the Board draws an arrow from A to B.
- [ ] Confirm the target card highlights while dragging.
- [ ] Click an arrow and confirm it can be removed.
- [ ] Set card A to a completion status such as `Done`, `Completed`, or `?꾨즺`.
- [ ] Confirm the arrow changes from warning-colored to muted.
- [ ] Confirm broken flow links appear in `Data warnings`.

## Timeline And Routine

- [ ] Open `Timeline`.
- [ ] Confirm the default range is base date -7 through base date +7.
- [ ] Click `Today` and confirm today's column scrolls next to the `Routine` sidebar.
- [ ] Add a date memo with `+ todo`.
- [ ] Add a date memo with `+ text`.
- [ ] Edit a multi-line memo through the pencil icon.
- [ ] Confirm the memo file is created under `KanbanRPM Workspace/timeline/YYYY-MM-DD.md` only after saving.
- [ ] Toggle a memo checkbox in preview mode.
- [ ] Add a routine such as `- [ ] Weekly Review @weekly @start YYYY-MM-DD` under `### Routine`.
- [ ] Confirm the routine appears in the `Routine` sidebar when it has an occurrence inside the visible range.
- [ ] Add a `@daily @start YYYY-MM-DD` routine and confirm it appears only for today, not every visible date.
- [ ] Click routine `Done`.
- [ ] Confirm `### Routine Log` receives a Markdown table row.
- [ ] Confirm the completed routine hides for its active recurrence period.

## Action Index And Weekly Review

- [ ] Add a source note under `### References`.
- [ ] Confirm `Action index` reads unchecked checkbox actions from that source.
- [ ] Use `Set next` from `Action index`.
- [ ] Promote a non-recurring action to a Big Action.
- [ ] Run `Weekly review`.
- [ ] Confirm the weekly review note opens or is created under the configured folder.
- [ ] Run `Management brief`.
- [ ] Confirm `KanbanRPM Workspace/KanbanRPM Management Brief.md` opens and includes Snapshot, Projects, Upcoming Dates, Waiting, Blocked, Flow Risks, Routines, and Data Warnings.

## Documentation

- [ ] README describes current features.
- [ ] `docs/Install.md` matches the current build process.
- [ ] `docs/Release Notes.md` includes the current version.
- [ ] `docs/Migration v0.1 to v0.2.md` describes the upgrade path.
- [ ] `docs/Card Schema.md` matches the living document schema.
- [ ] English manual is current.
- [ ] Korean manual is current and keeps plugin UI terms in English.

## QA Log Template

```text
Date:
Tester:
KanbanRPM version:
Scope:
Result:
Notes:
```

## QA Log

```text
Date: 2026-05-13
Tester: Codex
KanbanRPM version: 0.2.0
Scope: Static checks, release bundle packaging, smoke checks, documentation release criteria.
Result: Passed.
Notes: npm.cmd run check, npm.cmd run package, and npm.cmd run smoke passed. Manual Obsidian QA remains tracked by the checklist above.
```
