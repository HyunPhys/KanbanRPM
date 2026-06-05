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
- [ ] Confirm `Board`, `Table`, `Timeline`, `Gantt`, and `Archive` views render.
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
- [ ] Confirm the duplicate moves to `cards/<Project>/archive/`.
- [ ] Open `Archive` view and unarchive the duplicate.
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

## Gantt, Research Logs, And Next Review

- [ ] Add `Start date`, `Due date`, and `Next review` to a Big Action under `### Timeline`.
- [ ] Confirm `Gantt` shows `Month+Week` by default and can switch to `Quarter+Month`.
- [ ] Confirm a `Start date: 2026-05-15` / `Due date: 2026-06-10` Big Action bar starts around the middle of May and ends in early June.
- [ ] Confirm Subproject summary bars use direct Subproject dates when present, otherwise child Big Action date bounds.
- [ ] Confirm Projects, Subprojects within a Project, and Big Actions within a Subproject are sorted by earliest Start date without flattening the hierarchy.
- [ ] Confirm Project/Subproject collapse behavior follows the current Project filter.
- [ ] Confirm row title click opens the original living document.
- [ ] Confirm Gantt bar click opens the date edit modal and saves `Start date`, `Due date`, and `Next review`.
- [ ] Confirm `Next review` and today markers appear on the time grid.
- [ ] Confirm status badges show status labels such as `Active`, `Inbox`, and `Done`.
- [ ] Confirm flow badges show `Preceded`, `Followed`, and `Blocked` counts.
- [ ] Confirm visible `Preceded by` relations draw Gantt connector lines between bars.
- [ ] Confirm connector lines use warning color when the preceding card is not complete.
- [ ] Confirm `Connectors: On/Off` hides and shows Gantt connector lines without changing stored Flow data.
- [ ] Drag a Gantt bar's right dot to another bar's left connector area and confirm the target card gains the source under `### Flow` -> `Preceded by`.
- [ ] Confirm Gantt connector dot drag does not open the Gantt date edit modal, while clicking the bar body still does.
- [ ] Set a Big Action `Category` to `experiment`.
- [ ] Move it to a completion status and confirm the Experiment Log prompt appears when enabled.
- [ ] Confirm canceling the prompt keeps the status change without adding a log row.
- [ ] Move another matching Big Action to completion and add a log row.
- [ ] Confirm `### Experiment Log` is written to `KanbanRPM Workspace/Research Logs.md`, not to the completed Big Action document.
- [ ] Confirm the log row includes the completed Big Action card link.
- [ ] Confirm `Research index` shows the new log row.
- [ ] Set `Next review` to today or earlier on a non-complete card.
- [ ] Refresh the board and confirm the card moves to `Next review reminder status`.
- [ ] Confirm `### Timeline Log` receives a next review entry.
- [ ] Confirm completed cards are not moved by overdue `Next review`.

## Project Lifecycle

- [ ] Use `Close project` from a Project note and confirm `project_state: closed` is written.
- [ ] Confirm the closed Project and cards that only belong to it disappear from default filters/views.
- [ ] Confirm a card linked to both a closed Project and an active Project remains visible.
- [ ] Turn on `Show closed projects` and confirm the closed Project is visible again.
- [ ] Use `Reopen project` and confirm the Project returns to default views.

## Action Index And Weekly Review

- [ ] Add a source note under `### References`.
- [ ] Confirm `Action index` reads unchecked checkbox actions from that source.
- [ ] Use `Set next` from `Action index`.
- [ ] Promote a non-recurring action to a Big Action.
- [ ] Run `Management brief`.
- [ ] Confirm `KanbanRPM Workspace/KanbanRPM Management Brief.md` opens and includes Snapshot, Executive Attention, Project Health, Projects, Upcoming Dates, Next Actions, Open Small Actions, Waiting, Blocked, Flow Risks, Routines, Recent Research Logs, and Data Warnings.
- [ ] Run `Generate LLM context`.
- [ ] Confirm `KanbanRPM Workspace/LLM/00 LLM Entry.md` opens.
- [ ] Confirm `01 Next Work Candidates.md` lists non-active, non-complete candidates with score and reason columns.
- [ ] Confirm `03 Recent Changes.md` includes card `Timeline Log` rows and daily timeline `Completed Log` rows when they exist.
- [ ] Confirm `Project Briefs/*.md` includes Recommended Attention, Stale Waiting, Unresolved Blockers, Recently Completed, and original-note guidance.

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

```text
Date: 2026-05-14
Tester: Codex
KanbanRPM version: 0.3.0
Scope: Static checks and v0.3 feature build.
Result: Pending manual Obsidian QA.
Notes: v0.3 adds Project archive folders, Archive view, month-scale Gantt view, Research index, assisted Experiment/Analysis Log prompt, Next review reminders, and legacy parser cleanup.
```
