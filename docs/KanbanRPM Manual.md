# KanbanRPM Manual

KanbanRPM is an Obsidian project manager for research and lab operations. It treats every managed item as a living Markdown document, not as a disposable card.

## Core Model

```text
Project -> Subproject -> Big Action -> Checkbox task
```

- `Project`: a top-level living document, such as `TTT` or `Lab Setup`.
- `Subproject`: a workstream inside a Project, such as `TTT Experiment` or `Glove Box Setup`.
- `Big Action`: a trackable chunk of work under a Project/Subproject.
- `Checkbox task`: a small task that stays inside meeting notes, source notes, or the living document body.

## Open The Board

1. Enable `KanbanRPM` in Obsidian `Community plugins`.
2. Run `KanbanRPM: Open board`, or click the ribbon icon.

KanbanRPM creates its workspace when needed:

```text
KanbanRPM Workspace/
  cards/
  arrows/
  perpetual/
  attachments/
  archive/
```

Active living documents are stored in `cards/`.

## Status Lanes

Default lanes:

```text
Inbox -> Active -> Waiting -> Blocked -> Someday -> Done
```

`status` is the execution state. Procedure details such as quotation, drawing, deposition, analysis, or writing belong in the Markdown body, not in a separate `stage` field.

Statuses are globally editable in KanbanRPM settings. Unknown statuses appear in `Data warnings` and fall back to the first configured status for display.

## Create A Document

Click `New document`, or click the `+` button in a lane.

Required fields are marked with a red `*`:

- `Title`
- `Status`
- `Type`
- `Project`, when `Type` is `Subproject` or `Big Action`
- `Subproject`, when `Type` is `Big Action`

`Project` and `Subproject` are selected from existing documents. You do not need to type links manually. For a `Big Action`, choose `Project` first, then choose one of that Project's Subprojects.

Optional fields are under `Advanced metadata`:

- `Priority`
- `Category`
- `Current Focus`
- `Waiting for`
- `Blocker`
- `Next review`
- `Due date`
- `Source notes`
- `Depends on`
- `Blocks`

`Category` is stored as `workstream_type`. It is the only broad classification field; KanbanRPM no longer uses separate `area`, `project_kind`, `importance`, or `stage` fields.

Edit the global `Category set` in plugin settings. The Category dropdown, Category filter, card display, and validation all use that configured list.

## Living Document Template

New documents keep frontmatter short:

```yaml
kanban_rpm: true
type: big_action
id: example-big-action
status: active
project: "[[TTT]]"
subproject: "[[TTT Experiment]]"
order:
```

Hierarchy is stored explicitly. A `Subproject` stores its `project`; a `Big Action` stores both `project` and `subproject`. This keeps the document readable and leaves room for future explicit levels such as `pro_project` or `sub_subproject`.

New documents split plugin-readable control data from the free writing area:

```markdown
# Project Title

> [!kanban-rpm]
> type: Project
> status: active
> project: [[TTT]]
> subproject: [[TTT Experiment]]

## PM Control

### Current Focus

### Waiting

### Blockers

### Dependencies

### Timeline

### Perpetual

### References

### PM Metadata

---

## Working Notes

### Project Brief

### Desired Outcomes

### Decisions
```

`PM Control` is the projection layer KanbanRPM reads for board fields. `Working Notes` is where you write decisions, meeting summaries, analysis notes, quotes, sample context, and next reasoning. Project, Subproject, and Big Action documents use different `Working Notes` sections suited to their role.

## Board Use

Cards show a `Project > Subproject` breadcrumb and a project color token, so the board stays readable even when many projects are visible.

Project documents are not shown inside status lanes. They appear in a `Project notes` strip directly above the board. Click a project name to open the living Project document. When the `Project` filter is `All`, the strip shows all Project notes. When one Project is selected, it shows only that Project note. Use the strip's `Collapse` button when you want the board to use more vertical space.

Toolbar:

- `Board`, `Table`, `List`, `Timeline`
- `New document`
- `Group by Project`, `Group by Subproject`, or `Flat board`
- `Refresh`
- `More`

Secondary actions under `More`:

- `Pull Daily`
- `Weekly review`
- `Export arrows`
- `Normalize order`

Use `Search cards`, `Project`, and `Category` filters to narrow the board.

Next to the filter controls, use the panel buttons to show or hide `Data warnings`, `Command center`, and `Action index`. When a panel is off, it is removed from the board area entirely.

The default grouped board adapts to the Project filter:

- `Project: All`: lanes group cards by Project.
- one selected Project: lanes group cards by Subproject.

Drag a card to another lane to update `status`. Drag within a lane to update `order`. Card buttons do not start drag.

`Table` view shows the same filtered card set in sortable rows. Click a column header to sort by title, project, type, status, priority, date, dependency count, or action count. Use the `Status` dropdown in a row to move that document without returning to the board.

`List` view shows a collapsible `Project -> Subproject -> Big Action` tree. Project and Subproject names open their living documents, and Big Action rows show status, date, and task count.

`Timeline` view shows a horizontal strip from one week ago through five weeks ahead. It places markers for `Due date`, `Next review`, dated unchecked small actions, and `Perpetual` routines. Click a marker to open its living document.

Use `Card display fields` in settings to choose which card fields appear on the board. These settings can show or hide frontmatter fields such as `Type`, `Status`, `Priority`, and `Category`, and body-backed fields such as `Current Focus`, `Waiting`, `Blockers`, `Dependencies`, dates, sources, and small-action summaries.

## Small Actions

Small actions are checkbox tasks inside the living document. They stay in the Markdown body instead of becoming separate cards.

KanbanRPM reads Tasks-style emoji metadata:

```markdown
- [ ] Stack TTT sample ⏳ 2026-05-10 📅 2026-05-14 🔼
- [x] Confirm mask design ✅ 2026-05-07
```

Supported metadata:

- `scheduled`: `⏳ YYYY-MM-DD`
- `due`: `📅 YYYY-MM-DD`
- `done`: `✅ YYYY-MM-DD`
- priority: `⏫`, `🔼`, `🔽`, `⏬`

Board cards show a collapsible small-action row. Click `▶ Small actions` to expand and `▼ Small actions` to collapse. Expanded small actions are grouped by the heading they came from.

You can check or uncheck a small action directly from the card. Checking a task updates the original Markdown line from `[ ]` to `[x]` and adds today's `✅ YYYY-MM-DD` done date. Unchecking changes `[x]` back to `[ ]` and removes the done date.

Small-action settings:

- `Small actions collapsed by default`
- `Small action source`: `Due or scheduled only`, `Done only`, or `All small actions`
- `Small action date window`: `Any date`, `Overdue only`, `Today only`, `Through tomorrow`, `Through one week`, or `Through one month`

Default behavior is `Due or scheduled only` and `Through one week`. Relative windows include overdue actions, today, and the future period. `Today only` and `Overdue only` are exact filters.

## Action Index

`Action index` reads unchecked checkboxes and `#todo` lines from notes listed in a card's `## References` section. It does not modify the source notes.

Use:

- `Open source`: open the source note.
- `Set next`: copy the action into `## Current Focus`.
- `Promote`: create a new `Big Action` document from the action.

## Dependencies

Write dependencies in the document body:

```markdown
## Dependencies

Depends on:
- [[TTT Data Processing]]

Blocks:
- [[TTT Manuscript]]
```

KanbanRPM shows dependency counts, blocked-by badges, broken link warnings, and circular dependency warnings. `Export arrows` writes Laminar-style arrow notes under `KanbanRPM Workspace/arrows/`.

## Daily And Weekly

`Send to Daily` appends this line to today's existing Daily note:

```markdown
- [ ] [[Card Title]]: Current Focus
```

KanbanRPM does not create Daily notes. If today's Daily note does not exist, it shows the expected path.

`Weekly review` creates or opens a KanbanRPM-owned weekly review note under `KanbanRPM Workspace/perpetual/`.

## Data Warnings

Open `Data warnings` from the panel buttons next to the filters. It warns about:

- unknown `status`
- invalid `priority`
- unknown `Category`
- non-numeric `order`
- broken wikilinks in `## References` or `## Dependencies`
- circular dependency

Click a warning row to open the affected document.

## Settings

Available settings:

- `Workspace folder`
- `Daily folder`
- `Daily section`
- `Weekly review folder`
- `Statuses`

## Troubleshooting

If the board is empty, confirm the document is in `KanbanRPM Workspace/cards/`, has `kanban_rpm: true`, and is not archived.

If `Action index` is empty, confirm `## References` contains resolvable wikilinks to notes with unchecked checkboxes or `#todo` lines.

If `Send to Daily` does nothing, confirm today's Daily note exists and the card has `## Current Focus`.

## Developer Note

Update this manual and `docs/KanbanRPM Manual ko.md` together whenever user-facing behavior changes.
