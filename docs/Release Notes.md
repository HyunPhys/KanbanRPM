# KanbanRPM Release Notes

## v0.1.0

Initial MVP baseline for KanbanRPM as a Kanban-based research project manager for Obsidian.

### Highlights

- TypeScript Obsidian plugin with id `kanban-rpm`.
- Board view with lanes: `Inbox -> Active -> Waiting -> Blocked -> Someday -> Done`.
- Markdown card storage under `KanbanRPM Workspace/cards/`.
- Workstream card schema for research, lab setup, equipment, teaching, admin, and communication workflows.
- Card create, edit, duplicate, archive, delete, drag/drop status move, and manual `rpm_order`.
- Search and filters for `Group`, `Project kind`, and `Workstream type`.
- `Command center` for review, waiting, blocked, and dependency-heavy cards.
- `Action index` that reads unchecked checkbox actions and `#todo` lines from linked notes without editing originals.
- Legacy project note import with preview, selected card seeding, and duplicate prevention through `legacy_links`.
- Daily integration with single-card send, batch Daily pull, duplicate prevention, and configurable `Daily section`.
- Weekly review note creation/opening under the configured weekly review folder.
- Laminar-inspired support folders: `groups`, `arrows`, `perpetual`, `attachments`, and `archive`.
- Dependency arrow note export from `depends_on` and `blocks`.
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
- Calendar view, dependency graph view, Tasks plugin integration, and automatic legacy migration are not included.
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
- Rendered markers for card due dates, review dates, dated unchecked small actions, and `Perpetual` routines.
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
