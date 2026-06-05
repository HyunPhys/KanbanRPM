# KanbanRPM Release Notes

## Unreleased

## v0.3.5

KanbanRPM v0.3.5 adds the layered LLM context read model for project-management discussions.

- Added `Generate LLM context`, which writes layered read-model files under `KanbanRPM Workspace/LLM/` for next-work recommendations and PM briefings.
- LLM guidance now separates generated PM context from research/content planning, where the LLM should read the original living documents and references directly.
- Added `docs/KanbanRPM LLM Skills.md` with `/kanbanrpm-next`, `/kanbanrpm-brief`, and `/kanbanrpm-plan` prompt templates.
- Improved LLM candidate scoring with dormant cards, active parent context, active sibling load, clear next actions, dates, and research categories.
- Project Briefs now include recommended attention, stale waiting, unresolved blockers, recently completed work, and active workload.
- `Recent Changes` now includes daily timeline `Completed Log` rows as well as card `Timeline Log` rows.

## v0.3.4

KanbanRPM v0.3.4 is a polish release for Timeline/Routine behavior, hierarchy folder renames, and Gantt/Board display controls.

- Timeline scheduled/review card markers now omit the internal breadcrumb line for denser date columns.
- Timeline group labels and card title spacing are tighter.
- Board, Timeline, and Gantt surfaces now have saved zoom controls.
- Project/Subproject/Category filters are now saved separately per view.
- New document `Working Notes` templates now use a simpler shared Research PM heading spine with Obsidian comment guidance; only Big Action includes `Small Actions` by default.
- Small action examples document ASCII `@scheduled`, `@due`, and `@priority` metadata while keeping emoji done dates; the parser reads both ASCII and the common Tasks emoji subset.
- Checking a small action from a card now appends the done date as `✅ YYYY-MM-DD`; ASCII `@done YYYY-MM-DD` remains readable.
- Renaming a Project or Subproject living document now also renames its matching child folder when there is no target folder conflict.
- Routine `Done` now logs the actual completion date instead of the scheduled occurrence date.
- Board and Gantt now include saved Subproject visibility toggles.
- Gantt now expands short date ranges to fill the available width while preserving minimum week/month widths for long ranges.
- Short Gantt bars now show an additional title label below the bar.
- Added responsive mobile layouts: phone defaults to Timeline, Board uses lane tabs, Gantt uses a planning list, and Table uses compact card rows.

## v0.3.3

KanbanRPM v0.3.3 is a usability patch for saved Board state, denser Timeline cards, and small creation/display fixes.

### Highlights

- Added persistent Board lane ordering with small lane arrow controls.
- Board `Project`, `Subproject`, and `Category` filters are now saved and restored when KanbanRPM is reopened.
- Saved Board filters are cleared automatically if their target Project/Subproject/Category no longer exists.
- `New document` now uses the current Board filters to preselect document type and hierarchy parents.
- Board view can now show/hide flow arrows.
- Board and Gantt views can now show/hide Big Action rows/cards independently.
- Card `Timeline Log` now uses a `Date | Type | Change` Markdown table and records status changes.
- Gantt view now supports a custom date range with `Apply range` and `Auto range`.
- Card edit, Timeline, and Gantt date fields now use native calendar date inputs.
- Added card-level `Scheduled date`; Timeline card markers now use `Scheduled date` instead of `Due date`.
- Added a setting to open Advanced metadata by default in the new document modal.
- New/edit document modals now keep the action footer accessible while the form body scrolls.
- Timeline markers are denser: status changes moved to clickable status badges, marker kind prefixes became icons, and task/recurring markers render as lightweight chips.
- Timeline small-action chips now show their source document, and clickable status badges share the same visual sizing/color system as other status badges.
- Timeline hides standalone small-action chips when the parent card is already scheduled on the same date.
- Card small actions now split into collapsible `Open` and `Done` sections; `Open` starts expanded and `Done` starts collapsed.
- Card small-action toggles now use text-style controls instead of button-like controls.
- New documents now write selected Category to frontmatter immediately, so Board/Table/Timeline/Gantt show it without reopening the edit modal.
- README now includes acknowledgements for Obsidian Kanban and Laminar.

### Verification

Validated with:

```text
npm run check
npm run package
npm run smoke
```

## v0.3.2

KanbanRPM v0.3.2 is a patch release for title synchronization and cleaner living-document templates.

### Highlights

- Board titles now follow the Obsidian note title/file name, so manual note renames are reflected in Board and Project/Subproject pickers.
- Editing a card title from the modal now renames the Markdown file instead of only changing the body heading.
- New document templates no longer create a duplicate card-name H1 in the body.
- New document body headings now start at `# PM Control` and `# Working Notes`, with child sections promoted one level.
- Existing documents remain readable.

### Verification

Validated with:

```text
npm run check
npm run package
npm run smoke
```

## v0.3.1

KanbanRPM v0.3.1 is a patch release for taxonomy polish and LLM Wiki integration notes.

### Highlights

- Category settings now support `id | Label`, matching the global status set format.
- Card frontmatter still stores Category ids in `workstream_type`, while UI dropdowns, filters, cards, and validation use configured labels.
- Existing string-based Category settings are migrated automatically.
- Added compact and full LLM Wiki agent protocol documents for using KanbanRPM in the same vault as an LLM Wiki.
- Updated manuals and schema docs for Category id/label behavior.
- New document templates now use the Obsidian note title as the card title and start body headings at `# PM Control` / `# Working Notes` without a duplicate card-name H1.

### Verification

Validated with:

```text
npm run check
npm run package
npm run smoke
```

## v0.3.0

KanbanRPM v0.3 adds operations and long-range planning features on top of the v0.2 living-document model.

### Highlights

- Project-owned archive folders under `cards/<Project>/archive/`.
- `Archive` view with archived-card listing and `Unarchive`.
- Redesigned `Gantt` planning surface with `Month+Week` / `Quarter+Month` scale, proportional date bars, Subproject summary rows, collapse controls, and dependency badges.
- Global `Research Logs.md` document plus `Research index` for Markdown-table `Experiment Log` and `Analysis Log` rows.
- Category-based Experiment/Analysis Log prompt when matching Big Actions move to a completion status.
- Settings for Experiment/Analysis log category mapping and log prompt enable/disable.
- `Next review` reminder support with Open/Refresh status changes and `Timeline Log` entries.
- Expanded `Management brief` for LLM-assisted planning with Executive Attention, Project Health, Next Actions, dated/high-priority small actions, and Recent Research Logs.
- Project lifecycle support with `project_state: closed`, `Close project`, `Reopen project`, and `Show closed projects`.
- Removed the active `List` view switcher entry so the plugin focuses on Board, Table, Timeline, Gantt, and Archive.
- Removed `Weekly review` and `Export arrows` from the active UI and command set.
- Standardized colored status badges across Board details, Project notes, Table rows, and Timeline cards.
- Made Table row actions read as text-style controls while preserving click actions.
- Removed active parser support for legacy `parent`, legacy `project/subproject`, `Dependencies`, `Depends on/Blocks`, and `Perpetual` aliases.

### Verification

Validated with:

```text
npm run typecheck
```

Manual Obsidian QA is still required for Archive, Gantt, Research Log prompts, and Next review reminders.

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
- Category definitions now support `id | Label`, matching the global status set format.
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
