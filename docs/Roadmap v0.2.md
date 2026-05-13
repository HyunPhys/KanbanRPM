# KanbanRPM v0.2 Development Roadmap

KanbanRPM v0.2 is a structural redesign. The goal is to move from a frontmatter-heavy card board to a living-document research project manager built around:

```text
Project -> Subproject -> Big Action -> checkbox task
```

The v0.2 work should proceed phase by phase. Each phase should end with `npm run check`, `npm run package`, `npm run smoke`, manual Obsidian QA for the changed workflow, and a Git commit.

## Current v0.2 Starting State

Baseline:

- `v0.1.0` is committed and tagged.
- GitHub remote is connected at `https://github.com/HyunPhys/KanbanRPM`.
- v0.1.0 supports Board, card creation/editing, legacy import, Daily/Weekly workflows, release packaging, and smoke checks.

Important user feedback:

- Drag/drop is unreliable.
- Card documents are overloaded by frontmatter.
- Arrow writing creates files but does not feel applied in the PM workflow.
- Status lanes must be user-customizable.
- The current model does not naturally express `Project -> Subproject -> Big Action -> checkbox task`.
- Cards must visually show their Project/Subproject ownership.
- Board, Table, List, Laminar-style Timeline, and board-integrated flow arrows are needed.
- Cards must be living documents, not disposable database rows.

Current uncommitted work:

- Initial code has started for customizable statuses, living-doc section parsing, flow extraction, metadata compaction, and expanded card types.
- Treat this as Phase 1 draft work, not a stable checkpoint yet.

## Phase 0. Stabilize v0.2 Branch

Goal: make a clean development branch and stabilize the partially started v0.2 code.

Tasks:

- Create/use a dedicated branch: `v0.2-living-docs`.
- Review current uncommitted changes.
- Fix any TypeScript errors introduced by the early v0.2 edits.
- Confirm the plugin still loads after the partial schema changes.
- Commit the branch start as `Start v0.2 living docs redesign` only after `npm run check` passes.

Done when:

- Working tree is clean.
- `npm run check` passes.
- v0.1.0 remains available through tag `v0.1.0`.

## Phase 1. Living Document Core

Goal: make Project/Subproject/Big Action documents useful as real notes first and PM data second.

Tasks:

- Replace heavy new-card frontmatter with minimal frontmatter:
  ```yaml
  kanban_rpm: true
  type: project | subproject | big_action
  id:
  status:
  parent:
  order:
  ```
- Create living document templates for Project, Subproject, and Big Action.
- Parse body sections:
  - `## Current Focus`
  - `## Subprojects`
  - `## Big Actions`
  - `## Flow`
  - `## Routine`
  - `## PM Metadata`
- Keep old v0.1 cards readable as legacy cards.
- Add `KanbanRPM: Compact card metadata`.
- Move non-empty legacy metadata into `## PM Metadata`; remove empty frontmatter fields.

Done when:

- New documents open with short frontmatter and useful body sections.
- Old cards still appear on the board.
- Compacting a legacy card does not lose non-empty metadata.

## Phase 2. Hierarchy And Visual Identity

Status: Implemented.

Goal: make every item visibly belong to a Project/Subproject context.

Implemented:

- Build a hierarchy index from `parent`, wikilinks, and parsed sections.
- Compute `Project > Subproject` breadcrumb for every Project/Subproject/Big Action.
- Add project color tokens/stripes derived from project identity.
- Add project grouping toggle.
- Show breadcrumb and project color in Board.
- Add checkbox task counts from living documents.
- Add checkbox-to-Big-Action promotion command/action.

Deferred to Phase 4:

- Show breadcrumb and project color in Table and List.

Done when:

- ?쏛ll cards??view still shows ownership clearly.
- Project/Subproject/Big Action tree is visible in List view.
- Detailed checkbox tasks remain in source documents unless explicitly promoted.

## Phase 3. Status Customization And Reliable Drag/Drop

Status: Implemented.

Goal: make statuses editable and card movement reliable.

Implemented:

- Add global status editor in settings.
- Store statuses as ordered `id | Label` definitions.
- Replace hardcoded lanes with settings-driven lanes.
- Unknown status gets a warning and falls back to the first status.
- Replace native HTML5 drag/drop with pointer-based drag/reorder.
- Prevent button/input clicks inside cards from starting drag.
- Lane movement changes only `status`.
- Same-lane reorder changes only `order`.
- Remove inline status buttons from cards; drag/drop is the primary status-change flow.
- Mark required create/edit modal fields with a red `*`.

Deferred:

- Manual Obsidian pane QA for long drag sessions and custom status edge cases.
- Table/List status rendering, because those views start in Phase 4.

Done when:

- User can add/rename/reorder statuses.
- Board/Table/List use the same status set.
- Drag/drop works reliably in Obsidian panes.

## Phase 3.5. Model Pruning And UI Cleanup

Status: Implemented.

Goal: reduce terminology confusion and keep Phase 4 from building on noisy v0.1/v0.2 transition UI.

Implemented:

- Keep the board toolbar focused on primary actions.
- Move secondary actions under `More`: `Pull Daily`, `Weekly review`, `Export arrows`, and `Normalize order`.
- Make `Data warnings` collapsible.
- Move optional card fields into `Advanced metadata` in create/edit modals.
- Clarify Project terminology around `Project`, `Subproject`, `Big Action`, and `Checkbox task`.
- Remove the unused older Action index render path.
- Make `Parent` a dropdown sourced from existing Project/Subproject documents.
- Remove duplicated visible fields: `importance`, `stage`, `area`, and `project_kind`.
- Collapse `area` / `project_kind` / `workstream_type` into one visible `Category` field.
- Move prose-like planning fields into body sections in new living document templates.

Phase 3.7 cleanup:

- Removed legacy import, group-note creation, and metadata compaction commands from the active plugin surface.
- Removed legacy compatibility fields from the active TypeScript model.
- Standardized manual order on `order`.
- Updated user manuals, schema docs, README, and smoke checks to match the living-document model.

## Phase 4. Board, Table, And List Views

Status: Implemented.

Goal: support the core Kanban plugin style views while keeping KanbanRPM PM semantics.

Implemented:

- Added toolbar view switcher:
  ```text
  Board | Table | List | Timeline
  ```
- Board:
  - status lanes
  - adaptive Project/Subproject grouping
  - project color stripes and compact breadcrumbs
  - compact card actions and small-action summaries
- Table:
  - sortable/filterable rows
  - columns: title, breadcrumb, type, status, next action, due/review, flow state, action count
  - inline status change
- List:
  - collapsible tree: Project -> Subproject -> Big Action
  - checkbox count and blocked indicator
  - click opens the living document
- Timeline:
  - Laminar-style horizontal date columns
  - fixed controls, today navigation, range controls, and status filters
  - date Memo cards backed by lazy-created Markdown files
  - Memo modal editing with Markdown preview and clickable checkbox toggles
  - due/review/small-action/routine markers

Done when:

- Board, Table, and List all show the same indexed data.
- Switching views does not reload or lose filters unexpectedly.
- User can manage projects without opening raw YAML.
- Timeline Memo no longer depends on fragile inline textarea editing.

## Phase 5. Flow Index

Status: Implemented.

Goal: make flow/arrows actually affect project management.

Implemented:

- Parse `## Flow`:
  ```markdown
  Preceded by:
  - [[Upstream Work]]

  Followed by:
  - [[Downstream Work]]
  ```
- Build a flow index.
- Add flow indexing for:
  - upstream predecessor items
  - downstream follower items
  - status of linked items
  - broken links
  - circular dependencies
- Add waiting indicator when preceding work is not `Done`.
- Show flow counts and waiting badges in Board/Table/List.
- Replace or de-emphasize `Write arrows`; arrow files become optional export, not the main flow feature.

Done when:

- A user can see what preceding work is holding a project.
- Broken/circular dependencies appear in `Data warnings`.
- Flow relationships are visible without opening generated arrow files.

## Phase 6. Routine And Timeline Strip

Status: Implemented.

Goal: bring Laminar-like rhythm and time-awareness into KanbanRPM.

Implemented:

- Parse `## Routine` items:
  ```markdown
  - [ ] Weekly TTT Review @weekly
  - [ ] TEM Data Backup @monthly
  ```
- Add recurring items to Action index and Timeline.
- Add view switcher entries:
  ```text
  Timeline
  ```
- Implement horizontal scroll Timeline Strip.
- Show:
  - today marker
  - due date markers
  - next review markers
  - recurring/routine markers
  - project/subproject rows
- Group the `Routine` sidebar by cadence and show the next visible occurrence in the current Timeline range.
- Use the Timeline `Show: Recurring` filter for recurring marker-only display.
- Support `@start YYYY-MM-DD` and custom `@every 3d/2w/1m` schedules.
- Log routine completion to `### Routine Log` without permanently checking off the recurring routine.
- Store `### Routine Log` as a Markdown table.
- Hide routines that are already completed inside the active recurrence period.
- Sort routine groups from higher frequency to lower frequency and make groups collapsible.
- v0.2 does not support dragging timeline markers to change dates.

Done when:

- User can see this week?셲 review/deadline/recurring rhythm.
- Timeline feels Laminar-inspired: horizontal, temporal, project-aware.

## Phase 7. Board Flow Arrows

Status: Implemented.

Goal: add Laminar-style arrows directly on the Board.

Implemented:

- Replaced user-facing `Depends on` / `Blocks` with `Flow`, `Preceded by`, and `Followed by`.
- New documents use `### Flow` while legacy `### Dependencies` remains readable.
- Removed `Graph` from the main toolbar.
- Added left/right connector dots to Board cards.
- Added read-only Board arrows from predecessor to follower.
- Warning-colored arrows mean the predecessor is not `Done`; muted arrows mean the predecessor is complete.

Done when:

- Board arrows show the same relationships stored in `### Flow`.
- Flow arrows help inspect and edit project structure without leaving the Board.

## Phase 8. Documentation, Migration Guide, And Release

Status: Implemented; awaiting final manual Obsidian QA and optional git tag.

Goal: prepare v0.2 as a usable upgrade from v0.1.0.

Implemented:

- Update English and Korean manuals.
- Add v0.1 -> v0.2 migration guide.
- Update schema docs.
- Update release notes.
- Add v0.2 release QA checklist.
- Bump package, manifest, and versions metadata to `0.2.0`.
- Run:
  ```text
  npm run check
  npm run package
  npm run smoke
  ```
- Manual QA in Obsidian:
  - new living docs
  - compact metadata
  - custom statuses
  - drag/drop
  - Board/Table/List
  - Board flow arrows
  - Timeline
  - Board flow arrows
- Commit and tag `v0.2.0`.

Done when:

- v0.2 is installable from release bundle.
- Existing v0.1 data remains readable.
- User can start a new project as a living document and manage it through views.

## Development Rule

Do not start the next phase until the current phase has:

- working implementation
- updated docs if user-facing behavior changed
- `npm run check` passing
- manual smoke test in Obsidian for changed behavior
- Git commit
