# KanbanRPM Release Notes

## v0.2.0

KanbanRPM v0.2 is the living-document redesign. It turns the plugin from a frontmatter-heavy card board into a research project manager built around `Project -> Subproject -> Big Action -> checkbox task`, with Board/Table/List/Timeline views and Laminar-inspired flow/routine/timeline concepts.

### Highlights

- Living document templates for `Project`, `Subproject`, and `Big Action`.
- Explicit hierarchy fields with primary and additional Project/Subproject links.
- Project documents shown in a dedicated `Project notes` strip instead of status lanes.
- Configurable global status set and configurable Category set.
- Board, Table, List, and Laminar-style Timeline views.
- Timeline date Memo cards stored lazily under `KanbanRPM Workspace/timeline/`.
- Small-action parsing, display, and check/uncheck editing from cards.
- Small-action completion logging to each document's `### Timeline Log`.
- Recurring `Routine` items with `@start`, `@daily`, `@weekly`, `@monthly`, and custom `@every` intervals.
- Routine completion logging to `### Routine Log` as a Markdown table.
- Board-integrated flow arrows using `Preceded by` and `Followed by`.
- Drag-to-connect Board arrows from a right connector dot to another card's left connector area.
- Click-to-remove Board arrows.
- Completion-aware flow styling for `Done`, `Completed`, `Complete`, and `?꾨즺` statuses.
- Generated `KanbanRPM Management Brief.md` for human review and LLM-assisted planning.
- `Action index`, `Command center`, and `Data warnings` behind toggle buttons.
- English/Korean manuals, card schema docs, release QA, and v0.1 -> v0.2 migration guide.

### Breaking Workflow Changes

- Daily-note planning commands are no longer part of the active workflow. Use Timeline Memo cards for lightweight day notes.
- `Group`, `Project kind`, `Area`, `importance`, and `stage` are no longer primary user-facing concepts.
- New documents should use `### Flow` with `Preceded by` and `Followed by`; legacy dependency sections remain readable for compatibility.

### Verification

Validated with:

```text
npm run check
npm run package
npm run smoke
```

Manual Obsidian QA is still required before tagging the release.

## v0.1.0

Initial MVP baseline for KanbanRPM as a Kanban-based research project manager for Obsidian.

### Highlights

- TypeScript Obsidian plugin with id `kanban-rpm`.
- Board view with lanes: `Inbox -> Active -> Waiting -> Blocked -> Someday -> Done`.
- Markdown card storage under `KanbanRPM Workspace/cards/`.
- Workstream card schema for research, lab setup, equipment, teaching, admin, and communication workflows.
- Card create, edit, duplicate, archive, delete, drag/drop status move, and manual `rpm_order`.
- Search and filters for `Group`, `Project kind`, and `Workstream type`.
- `Command center` for review, waiting, blocked, and flow-heavy cards.
- `Action index` that reads unchecked checkbox actions and `#todo` lines from linked notes without editing originals.
- Legacy project note import with preview, selected card seeding, and duplicate prevention through `legacy_links`.
- Daily integration with single-card send, batch Daily pull, duplicate prevention, and configurable `Daily section`.
- Weekly review note creation/opening under the configured weekly review folder.
- Laminar-inspired support folders: `groups`, `arrows`, `routine`, `attachments`, and `archive`.
- Flow arrow note export from predecessor/follower links.
- Data warnings and schema reference note.
- English and Korean manuals.

### Verification

Validated with:

```text
npm run check
npm run package
npm run smoke
```

which runs:

```text
npm run typecheck
npm run build
```

### Known Limits

- Long-running Obsidian UI QA is still manual.
- Full calendar scheduling, Tasks plugin integration, automatic legacy migration, and advanced board-arrow clutter controls are not included.
- Daily notes are never created automatically; they must already exist.
- Weekly review notes are created automatically because they are KanbanRPM-owned routine notes.

### License And Attribution

KanbanRPM keeps upstream `obsidian-community/obsidian-kanban` source and license material for reference and attribution. This derivative implementation is treated as GPL-3.0-or-later compatible unless upstream clarifies the package/license mismatch.

## v0.2 Development Notes

### Phase 3.5 Cleanup

- Simplified the board toolbar around primary actions and moved secondary actions under `More`.
- Made `Data warnings` collapsible.
- Folded optional card fields under `Advanced metadata`.
- Clarified terminology: `Project`, `Subproject`, `Big Action`, and `Checkbox task`.
- Renamed visible dependency export language from `Write arrows` to `Export arrows` / `Export dependency arrows`.
- Replaced manual `Parent` text entry with a dropdown of existing Project/Subproject documents.
- Removed card-level inline status buttons.
- Consolidated overlapping `area`, `project_kind`, and `workstream_type` UI into `Category`.
- Removed visible `importance` and `stage` fields from the editing flow.
- Updated new living document templates so prose fields live in Markdown body sections.

### Phase 3.7 Schema Cleanup

- Removed legacy import, group-note creation, and metadata compaction commands from the active plugin surface.
- Removed legacy card compatibility fields from the active TypeScript model.
- Standardized ordering on `order`.
- Kept `Category` as the only broad classification field.
- Changed Action index source scanning to use `## References`.
- Updated English/Korean manuals, schema docs, README, and smoke checks for the living-document model.

### Phase 3.8 Card Display And Small Actions

- Added plugin settings for selecting which fields appear on board cards.
- Added small-action parsing for checkbox tasks inside living documents.
- Supported Tasks-style scheduled, due, done, and priority emoji metadata.
- Added collapsible `Small actions` rows on cards.
- Added settings for small-action source filtering and date-window filtering.

### Phase 3.9 Small Action Editing And Templates

- Added card-level small-action check/uncheck support that updates the original Markdown checkbox.
- Grouped expanded small actions by their source heading.
- Reworked new document templates around `PM Control`, a horizontal rule, and `Working Notes`.
- Added separate Project, Subproject, and Big Action working-note templates.
- Updated section parsing so KanbanRPM reads both older `##` sections and newer nested `###` control sections.

### Phase 3.10 Category Settings And Project Strip

- Added a configurable `Category set` in plugin settings.
- Updated card create/edit dropdowns, Category filter, and validation to use configured categories.
- Removed Project documents from board lanes and rendered them in a dedicated `Project notes` strip above the board.
- Made grouped board behavior depend on the Project filter: all projects group by Project, one Project groups by Subproject.

### Phase 3.11 Explicit Hierarchy Fields

- Replaced new-document hierarchy storage with explicit `project` and `subproject` fields.
- Updated Subproject create/edit to choose `Project`.
- Updated Big Action create/edit to choose `Project` first, then a Subproject within that Project.
- Kept legacy `parent` as a read fallback only.
- Added warnings for missing or inconsistent Project/Subproject links.

### Phase 3.12 Board Panel Toggles

- Moved `Data warnings`, `Command center`, and `Action index` behind filter-row toggle buttons.
- Removed hidden panels from the board area entirely instead of leaving collapsed panel headers.
- Added a `Project notes` collapse control while keeping Project documents separate from status lanes.

### Phase 4.1 Table And List Views

- Added a toolbar view switcher for `Board`, `Table`, and `List`.
- Added sortable `Table` view with status editing from each row.
- Added collapsible `List` view for the `Project -> Subproject -> Big Action` hierarchy.
- Kept Project documents out of board lanes while making them openable from the tree and Project notes strip.

### Phase 4.2 Timeline Strip

- Added `Timeline` to the toolbar view switcher.
- Added a horizontal timeline window from one week ago through five weeks ahead.
- Rendered markers for card due dates, review dates, dated unchecked small actions, and `Routine` items.
- Grouped timeline rows by Project/Subproject context and made markers open their living documents.

### Phase 4.3 Multi-Link Hierarchy And Subproject Filter

- Added `projects`, `subprojects`, `primary_project`, and `primary_subproject` schema support.
- Kept legacy `project` and `subproject` as read fallback fields.
- Added a `Subproject` board filter that narrows with the selected Project.
- Updated Board/Table/List/Timeline filtering to recognize cards linked to multiple Projects/Subprojects.

### Phase 4.4 Hierarchy Folder Placement

- New Project, Subproject, and Big Action documents are created under primary hierarchy folders.
- Cards with additional hierarchy links keep their primary folder placement.
- Existing flat files under `cards/` continue to load.
- Duplicated cards stay next to their source file.

### Phase 4.5 Laminar-Style Timeline Layout

- Reworked `Timeline` into a Laminar-style layout with a `Routine` sidebar and horizontal date grid.
- Added `Today`, previous/next week, timeline search, and marker-kind display controls.
- Added a `Memo` row and day-cell `+` buttons that create/open date notes in `KanbanRPM Workspace/timeline/`.
- Kept due, review, small-action, and recurring markers in the new layout.

### Phase 4.6 Timeline Memo And Completion Log

- Changed Timeline Memo from open-note buttons to inline date-cell textareas with show/hide controls.
- Made Timeline markers more card-like and less table-like.
- Added `### Timeline Log` to new living document templates.
- Checking a small action now prepends a completed entry with a `[[card]]` link to `### Timeline Log`; unchecking does not remove log history.
- Deferred deeper `Action index` redesign to a later phase.

### Phase 4.7 Timeline Memo Workflow

- Removed the active Daily Pull workflow from commands, board toolbar actions, card actions, modals, settings, and current manuals.
- Kept KanbanRPM planning inside the Laminar-style `Timeline` view with per-date `Memo` cells stored under `KanbanRPM Workspace/timeline/`.
- Preserved `Weekly review` as the KanbanRPM-owned routine note workflow under `KanbanRPM Workspace/routines/`.
- Updated smoke checks so the current release criteria track `Timeline`, `Weekly review`, and `Action index` instead of Daily integration.

### Phase 4.8 Kanban-Like Timeline Memo Cards

- Reworked Timeline from a table-like row grid into horizontal date columns with sectioned card stacks.
- Rendered `Memo` entries as Timeline cards instead of a raw textarea.
- Added `+ todo` and `+ text` controls for date memo cells.
- Made checkbox memo entries clickable from the Timeline while preserving the Markdown source under `KanbanRPM Workspace/timeline/`.
- Renamed the Timeline `Scope` control to `Show` to clarify that it filters marker kinds rather than card metadata.

### Phase 4.9 Timeline Usability And Card Density

- Simplified board card actions: card titles open documents, `Edit` is compact, and `Duplicate` / `Archive` / `Delete` live under a `...` menu.
- Kept Timeline controls fixed while the date columns scroll horizontally.
- Changed Timeline's default window to base date -7 through base date +7.
- Added base-date and explicit `YYYY.MM.DD` range controls.
- Made `Today` reset the base date and scroll today's column next to the `Routine` sidebar.
- Added Timeline status checkboxes, defaulting to `Active`.
- Added status dropdowns and compact small-action controls to Timeline markers.
- Expanded recurring `Routine` display across visible days for `@daily`, `@weekly`, and `@monthly`.

### Phase 4.10 Inline Memo Editing And Card Layout

- Replaced prompt-based Timeline Memo add/edit with inline multi-line editing and save toggles.
- Rendered simple Markdown headings, bullet lists, paragraphs, and clickable checkboxes in Timeline Memo preview.
- Stopped creating date memo files when Timeline ranges are only viewed; files are created when a memo is saved.
- Added strikethrough styling for checked Timeline Memo checkboxes.
- Kept Timeline `Statuses` collapsed by default.
- Made today's Timeline column visually distinct.
- Restored the previous board card visual tone while keeping the requested right-side icon action rail.
- Switched card edit and overflow actions to icons while keeping existing visual tone.
- Moved status, type, flow, and source details behind the card `Details` toggle.

### Phase 4.11 Card Type Visual Hierarchy

- Reserved card color for Project identity only.
- Added Project/Subproject/Big Action visual hierarchy across Board and Timeline surfaces through stripe thickness.
- Replaced variable left borders with fixed-width stripe gutters so different card types keep the same text start position.
- Updated breadcrumb display so Subproject cards show Project only, while Big Action cards show `Project` and `> Subproject`.

### Phase 4.12 Phase 4 Finish And Memo Modal

- Replaced fragile inline Timeline Memo editing with a date Memo modal.
- Kept date memo files lazy: Timeline only creates `KanbanRPM Workspace/timeline/YYYY-MM-DD.md` when a memo is saved.
- Preserved Timeline memo Markdown preview and clickable checkbox toggles.
- Replaced regex-based Memo section parsing with line-based Markdown section parsing so multi-line memos with blank lines remain visible and editable.
- Tightened board card button height, compacted the small-actions summary, and vertically centered single-line breadcrumbs.

### Phase 5. Flow Index

- Added flow indexing for upstream `Preceded by`, downstream `Followed by`, linked status, broken links, and waiting state.
- Added visible waiting badges on Board cards and List rows.
- Improved flow warnings so unresolved flow links are reported under `Data warnings`.
- Kept `Export arrows` as an optional Laminar-style compatibility export instead of the main flow workflow.

### Phase 6. Routine And Timeline Rhythm

- Added recurring `Routine` items to `Action index` as recurring items.
- Grouped the Timeline `Routine` sidebar by `daily`, `weekly`, and `monthly` cadence.
- Added next-visible occurrence labels for routines inside the current Timeline range.
- Kept recurring marker filtering in the Timeline `Show: Recurring` filter instead of a separate sidebar shortcut.
- Fixed Routine sidebar collapse so it no longer navigates back to Board view.
- Made the Routine sidebar show routines from the current Project/Subproject/Category filter regardless of Timeline status-marker filters.
- Added required `@start YYYY-MM-DD` and custom `@every 3d/2w/1m` recurring schedules.
- Added `Done` logging for routines through `### Routine Log`.
- Switched `### Routine Log` to a Markdown table and hide routines that are already completed inside the active recurrence period.
- Removed placeholder `General` / `+` controls from the Routine sidebar.
- Changed custom routine grouping from a single `custom` bucket to per-frequency groups such as `Every 2D` and `Every 2W`.
- Sorted Routine groups from higher frequency to lower frequency and made groups collapsible with triangle toggles.
- Hid Routine sidebar routines when they have no occurrence inside the current Timeline range.
- Rendered recurring Timeline markers as compact chips instead of full marker cards; completion stays in the `Routine` sidebar.
- Polished Routine card styling.

### Phase 7. Board Flow Arrows

- Replaced user-facing `Depends on` / `Blocks` language with `Flow`, `Preceded by`, and `Followed by`.
- New documents now use a `### Flow` section.
- Legacy `### Dependencies` sections with `Depends on` / `Blocks` are still read for compatibility.
- Removed `Graph` from the toolbar in favor of board-integrated flow.
- Added left/right card connector dots and board arrows from predecessor to follower.
- Warning-colored arrows indicate unfinished preceding work; muted arrows indicate completed preceding work.
- Removed the filter-row `Flow` panel in favor of direct Board arrows.
- Added drag-to-connect from a card's right flow dot to another card's left flow dot.
- Added click-to-remove for existing Board arrows with confirmation.
