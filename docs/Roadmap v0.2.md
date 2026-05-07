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
- Board, Table, List, Laminar-style Timeline, Dependency Panel, and eventually Graph view are needed.
- Cards must be living documents, not disposable database rows.

Current uncommitted work:

- Initial code has started for customizable statuses, living-doc section parsing, dependency extraction, metadata compaction, and expanded card types.
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
  - `## Dependencies`
  - `## Perpetual`
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

- “All cards” view still shows ownership clearly.
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
- Keep inline status buttons as fallback.
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
- Move secondary actions under `More`: `Pull Daily`, `Weekly review`, `Import legacy`, `Export arrows`, and `Normalize order`.
- Make `Data warnings` collapsible.
- Move optional card fields into `Advanced metadata` in create/edit modals.
- Rename visible `Group` UI to `Legacy group`.
- Clarify Project terminology around `Project`, `Subproject`, `Big Action`, and `Checkbox task`.
- Remove the unused older Action index render path.

Deferred:

- Deeper TypeScript model split between persisted schema, derived index state, and legacy compatibility fields.
- Full removal of legacy `group` and `rpm_order` aliases, which still need compatibility support.

## Phase 4. Board, Table, And List Views

Goal: support the core Kanban plugin style views while keeping KanbanRPM PM semantics.

Tasks:

- Add toolbar view switcher:
  ```text
  Board | Table | List
  ```
- Board:
  - status lanes
  - project grouping toggle
  - breadcrumb and dependency badges
- Table:
  - sortable/filterable rows
  - columns: title, breadcrumb, type, status, next action, due/review, dependency state, action count
  - inline status change
- List:
  - collapsible tree: Project -> Subproject -> Big Action
  - checkbox count and blocked indicator
  - click opens the living document

Done when:

- Board, Table, and List all show the same indexed data.
- Switching views does not reload or lose filters unexpectedly.
- User can manage projects without opening raw YAML.

## Phase 5. Dependency Panel

Goal: make dependency/arrows actually affect project management.

Tasks:

- Parse `## Dependencies`:
  ```markdown
  Depends on:
  - [[Upstream Work]]

  Blocks:
  - [[Downstream Work]]
  ```
- Build a dependency index.
- Add a Dependency Panel showing:
  - upstream dependencies
  - downstream blocked items
  - status of linked items
  - broken links
  - circular dependencies
- Add `blocked by` indicator when upstream is not `Done`.
- Show dependency counts and blocked badges in Board/Table/List.
- Replace or de-emphasize `Write arrows`; arrow files become optional export, not the main dependency feature.

Done when:

- A user can see why a project is blocked.
- Broken/circular dependencies appear in `Data warnings`.
- Dependency relationships are visible without opening generated arrow files.

## Phase 6. Perpetual And Timeline Strip

Goal: bring Laminar-like rhythm and time-awareness into KanbanRPM.

Tasks:

- Parse `## Perpetual` items:
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
  - recurring/perpetual markers
  - project/subproject rows
- v0.2 does not support dragging timeline markers to change dates.

Done when:

- User can see this week’s review/deadline/recurring rhythm.
- Timeline feels Laminar-inspired: horizontal, temporal, project-aware.

## Phase 7. Laminar-Style Graph View

Goal: add a visual node/arrow graph using the dependency index.

Tasks:

- Add view switcher entry:
  ```text
  Graph
  ```
- Use Project/Subproject/Big Action documents as nodes.
- Use dependency index as edges.
- Implement MVP graph:
  - automatic layout
  - pan/zoom
  - node click opens document
  - status-based node colors
  - project filter
  - broken edge warning
- Do not store manual node positions in v0.2.

Done when:

- Dependency Panel and Graph show consistent relationships.
- Graph helps inspect project structure rather than just looking decorative.

## Phase 8. Documentation, Migration Guide, And Release

Goal: prepare v0.2 as a usable upgrade from v0.1.0.

Tasks:

- Update English and Korean manuals.
- Add v0.1 -> v0.2 migration guide.
- Update schema docs.
- Update release notes.
- Add v0.2 release QA checklist.
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
  - Dependency Panel
  - Timeline
  - Graph
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
