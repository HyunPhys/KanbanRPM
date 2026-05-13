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
  routine/
  timeline/
  attachments/
  archive/
```

Active living documents are stored in `cards/`. New documents use primary hierarchy folders:

```text
cards/Project.md
cards/Project/Subproject.md
cards/Project/Subproject/Big Action.md
```

If a document has additional Project/Subproject links, the file remains in the primary folder chosen at creation time. Older flat files in `cards/` still load normally.

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
- `Preceded by`
- `Followed by`

`Category` is stored as `workstream_type`. It is the only broad classification field; KanbanRPM no longer uses separate `area`, `project_kind`, `importance`, or `stage` fields.

Edit the global `Category set` in plugin settings. The Category dropdown, Category filter, card display, and validation all use that configured list.

## Living Document Template

New documents keep frontmatter short:

```yaml
kanban_rpm: true
type: big_action
id: example-big-action
status: active
primary_project: "[[TTT]]"
primary_subproject: "[[TTT Experiment]]"
projects:
  - "[[TTT]]"
subprojects:
  - "[[TTT Experiment]]"
order:
```

Hierarchy is stored as multi-link arrays. `projects` and `subprojects` can contain more than one linked document. `primary_project` and `primary_subproject` define the default breadcrumb and future folder placement. Legacy `project` and `subproject` fields are read as fallback only.

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

### Flow

### Timeline

### Routine

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

Cards use color only for Project identity. Project/Subproject/Big Action roles are shown with different stripe thicknesses inside a fixed-width left gutter, so card text starts at the same position across types.

Subproject cards show only the owning `Project` in the breadcrumb. Big Action cards show the primary hierarchy as two compact lines: `Project`, then `> Subproject`.

Project documents are not shown inside status lanes. They appear in a `Project notes` strip directly above the board. Click a project name to open the living Project document. When the `Project` filter is `All`, the strip shows all Project notes. When one Project is selected, it shows only that Project note. Use the strip's `Collapse` button when you want the board to use more vertical space.

Toolbar:

- `Board`, `Table`, `List`, `Timeline`
- `New document`
- `Group by Project`, `Group by Subproject`, or `Flat board`
- `Refresh`
- `More`

Secondary actions under `More`:

- `Weekly review`
- `Export arrows`
- `Normalize order`

Use `Search cards`, `Project`, `Subproject filter`, and `Category` filters to narrow the board.

Next to the filter controls, use the panel buttons to show or hide `Data warnings`, `Command center`, and `Action index`. When a panel is off, it is removed from the board area entirely.

The default grouped board adapts to the Project filter:

- `Project: All`: lanes group cards by Project.
- one selected Project: lanes group cards by Subproject.

Cards with multiple Project/Subproject links can appear under each matching filter. The visible breadcrumb still uses the primary hierarchy.

Drag a card to another lane to update `status`. Drag within a lane to update `order`. Card buttons do not start drag.

`Table` view shows the same filtered card set in sortable rows. Click a column header to sort by title, project, type, status, priority, date, flow count, or action count. Use the `Status` dropdown in a row to move that document without returning to the board.

`List` view shows a collapsible `Project -> Subproject -> Big Action` tree. Project and Subproject names open their living documents, and Big Action rows show status, date, and task count.

Board cards include small left/right flow dots. The left dot represents incoming `Preceded by` flow, and the right dot represents outgoing `Followed by` flow. Drag a card's right dot toward another card's left connector area to create a flow arrow; the drop target is intentionally wider than the visible dot and highlights while dragging. KanbanRPM stores that arrow by adding the source card to the target card's `Preceded by` list. Existing flow links are drawn directly on the board as curved arrows from predecessor to follower. Click an arrow to remove the link after confirmation. Grey arrows mean the predecessor is in a completion status such as `Done`, `Completed`, or `?꾨즺`; warning-colored arrows mean the follower is still waiting on unfinished preceding work. If your custom status set has no completion status, flow arrows stay in the warning state until one is added or renamed.

`Timeline` view uses a Laminar-style kanban-like layout: a left `Routine` sidebar, top range/search/display controls, and horizontal date columns. By default it shows 7 days before through 7 days after the base date, which starts as today. Use `Today`, `-7`, `+7`, the base date field, or the explicit `YYYY.MM.DD` to `YYYY.MM.DD` range fields to change the window. Each date column contains a toggleable `Memo` section plus project/subproject marker sections. It places markers for `Due date`, `Next review`, dated unchecked small actions, and `Routine` items.

Timeline only shows cards whose status is enabled in the collapsed Timeline `Statuses` filter. The default is `Active`. Cards without a timeline marker date do not appear in the date columns. Due, review, and dated small-action markers show the card breadcrumb, status, priority, status dropdown, and a compact small-action list when available. Recurring `Routine` items appear as compact chips instead of full cards; use the `Routine` sidebar for routine completion. Click a marker title or recurring chip to open its living document.

The Timeline `Show` dropdown is a display filter for marker kinds, not a card-level field. `Show: Review` only shows review markers, `Show: Due` only shows due markers, `Show: Tasks` shows dated small actions, and `Show: Recurring` shows compact recurring chips for routines.

Timeline Memo entries are stored in `KanbanRPM Workspace/timeline/YYYY-MM-DD.md` only after you save a memo for that date. Timeline does not create date memo files just by viewing a range. Use `+ todo`, `+ text`, or the pencil icon to open the date Memo modal. The modal edits the date file's `## Memo` section as normal multi-line Markdown. The Timeline preview renders simple Markdown headings, bullet lists, paragraphs, and checkboxes. Checked checkbox lines render with a strikethrough and can be toggled directly from preview mode.

`Routine` reads checkbox lines in a card's `### Routine` or `## Routine` section. Every routine should include a start date:

```markdown
- [ ] Daily Lab Note Check @daily @start 2026-05-13
- [ ] Weekly TTT Review @weekly @start 2026-05-13
- [ ] TEM Data Backup @monthly @start 2026-05-13
- [ ] Change glovebox purifier @every 10d @start 2026-05-13
- [ ] Safety form audit @every 2w @start 2026-05-13
```

Older documents that still use `### Perpetual` or `### Perpetual Log` continue to load as legacy aliases. New documents use `### Routine` and `### Routine Log`.

Daily routines appear only for today in the Timeline and Routine sidebar, even when the visible range includes other dates. Weekly routines repeat on the same weekday as the start date. Monthly routines repeat on the same day-of-month as the start date. Custom `@every` routines support `d`, `w`, and `m` units.

The `Routine` sidebar groups routines by frequency, from most frequent to least frequent. Custom intervals are grouped separately, such as `Every 2D` and `Every 2W`, and groups can be collapsed with the triangle toggle. The sidebar shows routines from the current Project/Subproject/Category filter even if their card status is hidden from Timeline markers. Routines must include `@start YYYY-MM-DD` to appear on the Timeline, and routines with no occurrence inside the current Timeline range are hidden from the sidebar. Use the Timeline `Show: Recurring` filter when you want the date columns to show only recurring markers. Clicking `Done` logs completion to the owning card's `### Routine Log` as a Markdown table row without permanently checking off the routine. A completed routine is hidden for that active recurrence period. Recurring routines also appear in `Action index` as recurring items; they can be opened or copied into `Current Focus`, but they are not promoted into new Big Action documents.

Routine log format:

```markdown
### Routine Log

| Date | Routine |
| --- | --- |
| 2026-05-13 | Weekly TTT Review |
```

Use `Card display fields` in settings to choose which card fields appear on the board. These settings can show or hide frontmatter fields such as `Type`, `Status`, `Priority`, and `Category`, and body-backed fields such as `Current Focus`, `Waiting`, `Blockers`, `Flow`, dates, sources, and small-action summaries.

## Small Actions

Small actions are checkbox tasks inside the living document. They stay in the Markdown body instead of becoming separate cards.

KanbanRPM reads Tasks-style emoji metadata:

```markdown
- [ ] Stack TTT sample ??2026-05-10 ?뱟 2026-05-14 ?뵾
- [x] Confirm mask design ??2026-05-07
```

Supported metadata:

- `scheduled`: `??YYYY-MM-DD`
- `due`: `?뱟 YYYY-MM-DD`
- `done`: `??YYYY-MM-DD`
- priority: `??, `?뵾`, `?뵿`, `??

Board cards show a collapsible small-action row. Click `??Small actions` to expand and `??Small actions` to collapse. Expanded small actions are grouped by the heading they came from.

You can check or uncheck a small action directly from the card. Checking a task updates the original Markdown line from `[ ]` to `[x]`, adds today's `??YYYY-MM-DD` done date, and prepends a reverse-chronological list item to `### Timeline Log` with an Obsidian link back to the card document. Unchecking changes `[x]` back to `[ ]` and removes the done date, but does not remove the Timeline Log entry.

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

## Flow

Write flow links in the document body:

```markdown
## Flow

Preceded by:
- [[TTT Data Processing]]

Followed by:
- [[TTT Manuscript]]
```

KanbanRPM shows flow directly on the Board with connector dots and arrows. Drag from a right dot to another card's left connector area to create a link; click an arrow to remove it. Flow counts and waiting badges also appear on Board/Table/List surfaces. Broken flow links and circular flow appear in `Data warnings`. `Export arrows` is optional: it writes Laminar-style arrow notes under `KanbanRPM Workspace/arrows/` for compatibility/reference. Existing legacy `## Dependencies` sections with `Depends on` / `Blocks` are still read as compatibility input.

## Timeline Memo And Weekly

KanbanRPM no longer writes planning lines to external Daily notes. Use the `Timeline` view's toggleable `Memo` section for lightweight day notes, quick checkbox tasks, and small reminders that do not need their own living document.

Each memo cell is stored in:

```text
KanbanRPM Workspace/timeline/YYYY-MM-DD.md
```

`Weekly review` creates or opens a KanbanRPM-owned weekly review note under `KanbanRPM Workspace/routines/`.

`Management brief` creates or updates `KanbanRPM Workspace/KanbanRPM Management Brief.md` and opens it. The brief is a generated project-management snapshot for human review and LLM-assisted planning. It includes status counts, Project sections, upcoming due/review dates, Waiting, Blocked, Flow risks, Routines, and Data warnings. It is safe to regenerate; edit living documents rather than editing the generated brief as source data.

## Data Warnings

Open `Data warnings` from the panel buttons next to the filters. It warns about:

- unknown `status`
- invalid `priority`
- unknown `Category`
- non-numeric `order`
- broken wikilinks in `## References` or `## Flow`
- circular flow

Click a warning row to open the affected document.

## Settings

Available settings:

- `Workspace folder`
- `Weekly review folder`
- `Statuses`

## Troubleshooting

If the board is empty, confirm the document is in `KanbanRPM Workspace/cards/`, has `kanban_rpm: true`, and is not archived.

If `Action index` is empty, confirm `## References` contains resolvable wikilinks to notes with unchecked checkboxes or `#todo` lines.

## Developer Note

Update this manual and `docs/KanbanRPM Manual ko.md` together whenever user-facing behavior changes.
