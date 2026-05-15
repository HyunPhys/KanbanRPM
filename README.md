# KanbanRPM

KanbanRPM is a Kanban-based research project manager for Obsidian. It is designed for research and operations workstreams such as manuscripts, equipment setup, teaching/admin work, and waiting/blocker tracking.

This project was started from the public `obsidian-community/obsidian-kanban` repository so the original Kanban source tree, attribution, and license material are preserved in this folder. The active KanbanRPM implementation lives in `src-kanbanrpm/` and builds directly to the vault plugin folder.

## Project Layout

KanbanRPM keeps the upstream Kanban source tree for reference and attribution, but the active implementation is separate:

```text
src-kanbanrpm/main.ts             Plugin lifecycle and command orchestration
src-kanbanrpm/board-view.ts       Board UI, toolbar, lanes, cards, and drag/drop
src-kanbanrpm/card-repository.ts  Card files, schema validation, ordering, hierarchy, and action indexing
src-kanbanrpm/types.ts            Shared TypeScript interfaces
src-kanbanrpm/constants.ts        Shared constants and vocabularies
src-kanbanrpm/utils.ts            Pure helper functions
src-kanbanrpm/modals.ts           Document and confirmation modals
src-kanbanrpm/schema.ts           Schema reference content
src-kanbanrpm/settings-tab.ts     Settings tab
src-kanbanrpm/styles.css          Board and modal styles
scripts/                          KanbanRPM build and typecheck scripts
docs/KanbanRPM*.md                KanbanRPM user manuals
src/                              Upstream obsidian-kanban source kept for reference
LICENSE.md                        Upstream license material
```

Build output is written outside this source project:

```text
../.obsidian/plugins/kanban-rpm/
```

## Manual

The roadmap, baseline checklist, and user manuals are maintained at:

```text
docs/Roadmap.md
docs/Roadmap v0.2.md
docs/Install.md
docs/Baseline QA.md
docs/Release QA.md
docs/Release Notes.md
docs/Migration v0.1 to v0.2.md
docs/Card Schema.md
docs/Attribution.md
docs/KanbanRPM Manual.md
docs/KanbanRPM Manual ko.md
```

Update both manuals whenever user-facing KanbanRPM behavior changes. Keep plugin UI terms in English in the Korean manual.

## Build

```bash
npm install
npm run typecheck
npm run build
npm run package
npm run smoke
```

If PowerShell resolves a blocked or wrong Node executable, prepend the installed Node path for the current session:

```powershell
$env:Path = 'C:\Program Files\nodejs;' + $env:Path
```

The build can also be run directly:

```bash
node scripts/build.mjs
```

`npm run package` prepares a local release bundle under:

```text
dist/kanban-rpm-0.2.0/
```

`npm run smoke` checks the live plugin folder, release bundle, manifest/version mapping, and release documentation for consistency.

The build bundles/copies:

- `src-kanbanrpm/main.ts` -> `main.js`
- `src-kanbanrpm/styles.css`
- `manifest.json`

to:

```text
../.obsidian/plugins/kanban-rpm/
```

## Data Model

KanbanRPM stores project cards as individual Markdown files under:

```text
KanbanRPM Workspace/cards/
```

New documents are placed by primary hierarchy:

```text
cards/Project.md
cards/Project/Subproject.md
cards/Project/Subproject/Big Action.md
```

Cards with additional Project/Subproject links stay in the primary folder chosen at creation time. Existing flat files under `cards/` are still loaded.

Each card is a research workstream, not a task. The board reads card frontmatter and maps `status` to lanes:

```text
Inbox -> Active -> Waiting -> Blocked -> Someday -> Done
```

Card files use this frontmatter shape:

```yaml
kanban_rpm: true
type: big_action
id: example-big-action
status: inbox
project_state: active
primary_project: "[[TTT]]"
primary_subproject: "[[TTT Experiment]]"
projects:
  - "[[TTT]]"
subprojects:
  - "[[TTT Experiment]]"
order:
```

Readable planning context lives in Markdown sections such as `Current Focus`, `Waiting`, `Blockers`, `Flow`, `Timeline`, `References`, and `PM Metadata`.

Flexible architecture terms:

- `Project`: the top-level living document, such as `TTT` or `Lab Setup`.
- `project_state`: Project lifecycle, where `closed` hides completed Projects from default views without changing child card statuses.
- `Subproject`: a workstream under a Project, such as `TTT Analysis` or `Glove Box Setup`.
- `Big Action`: a trackable chunk of work under a Project/Subproject.
- `projects` / `subprojects`: multi-link hierarchy arrays stored in frontmatter.
- `primary_project` / `primary_subproject`: the default breadcrumb and future folder placement anchors.
- `Checkbox task`: a detailed action that stays inside source notes.
- `Preceded by` and `Followed by`: lightweight flow sections inspired by Laminar arrows.
- `References`: notes to scan for unchecked checkbox actions and `#todo` lines.
- `Category`: one optional classification value stored as `workstream_type`.

The workspace also keeps support folders:

```text
KanbanRPM Workspace/routines/
KanbanRPM Workspace/timeline/
KanbanRPM Workspace/attachments/
```

## MVP Features

- Open the KanbanRPM board from the command palette or ribbon.
- Switch between `Board`, `Table`, `Timeline`, `Gantt`, and `Archive` views from the toolbar.
- Search/filter cards from the board toolbar.
- Filter cards by `Project`, `Subproject`, and `Category`.
- Close and reopen Projects from the `Project notes` strip; use `Show closed projects` to inspect closed Project trees.
- Show optional `Data warnings` for invalid status, invalid priority values, unknown category values, non-numeric order, broken source links, and flow cycles.
- Open or create a local schema reference note with `KanbanRPM: Open schema reference`.
- Create living documents from a simplified modal with optional fields folded under `Advanced metadata`.
- Select primary `Project` and, for Big Actions, primary `Subproject` from existing documents, with optional additional Project/Subproject links.
- Create cards directly in a lane with the lane `+` quick add button.
- Edit card metadata from the board.
- Duplicate existing cards.
- Archive cards to the owning Project folder, such as `KanbanRPM Workspace/cards/<Project>/archive/`.
- Delete cards through a confirmation modal.
- Show visual badges for status, type, category, dependencies, priority, and overdue dates.
- Show an `Action index` that collects unchecked checkboxes, `#todo` lines from notes linked in `## References`, and recurring `Routine` items without modifying the original notes.
- Open source notes from the `Action index`.
- Promote an indexed action into a card's `## Current Focus` with `Set next`.
- Group `Action index` entries by card.
- Show a `Command center` panel for review queue, waiting cards, blocked cards, and flow-heavy cards.
- Toggle `Data warnings`, `Command center`, and `Action index` from the filter row; closed panels are removed from the board area.
- Keep secondary board actions under `More`, including `Management brief` and `Normalize order`.
- Use the Laminar-style `Timeline` view and date `Memo` row for lightweight daily notes instead of writing to external Daily notes.
- Generate an LLM-friendly `KanbanRPM Management Brief.md` with `Management brief`.
- Show compact card relation rows for `Preceded by`, `Followed by`, and `References`.
- Configure which board-card fields are visible from plugin settings.
- Configure Category values from plugin settings.
- Show Project documents in a collapsible `Project notes` strip above the board instead of inside status lanes.
- Group lanes by Project when all projects are visible, and by Subproject when one Project is selected.
- Sort cards in `Table` view with text-style clickable rows.
- Inspect and edit flow directly on the Board with card connector dots and arrows; unfinished preceding work is shown with warning-colored arrows.
- Drag a card's right flow dot to another card's left connector area to add a `Preceded by` link.
- Click an existing board arrow to remove that flow link after confirmation.
- Inspect a Laminar-style kanban-like `Timeline` view with a grouped/collapsible `Routine` sidebar, start-date and custom-interval recurring routines, next visible routine dates, completion logs, base-date/range controls, persistent status filters, marker-kind display filters, date columns, editable date Memo cards, status dropdowns, and compact small-action controls.
- Parse Tasks-style small action checkboxes inside living documents and show them in collapsible card rows.
- Check or uncheck small actions from board cards while updating the original Markdown line.
- Create Project, Subproject, and Big Action documents with role-specific `PM Control` / `Working Notes` templates.
- Use compact board cards with title-to-open behavior, icon edit actions, overflow menus, and collapsed details.
- Drag cards between lanes to update `status`.
- Drag cards within a lane to set `order`.
- Normalize lane order values with `Normalize order` or `KanbanRPM: Normalize card order`.
- Refresh automatically when card files change.

## License Note

The upstream repository metadata currently reports `MIT` in `package.json`, while the included `LICENSE.md` is GPL-3.0 text. KanbanRPM keeps upstream attribution and treats this derivative implementation as GPL-3.0-or-later compatible unless the upstream project clarifies otherwise.

See `docs/Attribution.md` for the current attribution and non-interference notes.
