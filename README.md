# KanbanRPM

KanbanRPM is a Kanban-based research project manager for Obsidian. It is designed for research and operations workstreams such as manuscripts, equipment setup, teaching/admin work, and waiting/blocker tracking.

This project was started from the public `obsidian-community/obsidian-kanban` repository so the original Kanban source tree, attribution, and license material are preserved in this folder. The active KanbanRPM implementation lives in `src-kanbanrpm/` and builds directly to the vault plugin folder.

## Project Layout

KanbanRPM keeps the upstream Kanban source tree for reference and attribution, but the active implementation is separate:

```text
src-kanbanrpm/main.ts             Plugin lifecycle and command orchestration
src-kanbanrpm/board-view.ts       Board UI, toolbar, lanes, cards, and drag/drop
src-kanbanrpm/card-repository.ts  Card files, schema validation, ordering, hierarchy, and action indexing
src-kanbanrpm/daily.ts            Daily note integration
src-kanbanrpm/types.ts            Shared TypeScript interfaces
src-kanbanrpm/constants.ts        Shared constants and vocabularies
src-kanbanrpm/utils.ts            Pure helper functions
src-kanbanrpm/modals.ts           Document, Daily Pull, and confirmation modals
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
dist/kanban-rpm-0.1.0/
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

Each card is a research workstream, not a task. The board reads card frontmatter and maps `status` to lanes:

```text
Inbox -> Active -> Waiting -> Blocked -> Someday -> Done
```

Card files use this frontmatter shape:

```yaml
kanban_rpm: true
type: project
id: example-project
status: inbox
parent:
order:
```

Readable planning context lives in Markdown sections such as `Current Focus`, `Waiting`, `Blockers`, `Dependencies`, `Timeline`, `References`, and `PM Metadata`.

Flexible architecture terms:

- `Project`: the top-level living document, such as `TTT` or `Lab Setup`.
- `Subproject`: a workstream under a Project, such as `TTT Analysis` or `Glove Box Setup`.
- `Big Action`: a trackable chunk of work under a Project/Subproject.
- `Checkbox task`: a detailed action that stays inside source notes.
- `Depends on` and `Blocks`: lightweight dependency sections inspired by Laminar arrows.
- `References`: notes to scan for unchecked checkbox actions and `#todo` lines.
- `Category`: one optional classification value stored as `workstream_type`.

The workspace also keeps Laminar-style support folders:

```text
KanbanRPM Workspace/arrows/
KanbanRPM Workspace/perpetual/
KanbanRPM Workspace/attachments/
KanbanRPM Workspace/archive/
```

## MVP Features

- Open the KanbanRPM board from the command palette or ribbon.
- Search/filter cards from the board toolbar.
- Filter cards by `Project` and `Category`.
- Show collapsible `Data warnings` for invalid status, invalid priority values, unknown category values, non-numeric order, broken source links, and dependency cycles.
- Open or create a local schema reference note with `KanbanRPM: Open schema reference`.
- Create living documents from a simplified modal with optional fields folded under `Advanced metadata`.
- Select `Parent` from existing Project/Subproject documents instead of typing it manually.
- Create cards directly in a lane with the lane `+` quick add button.
- Edit card metadata from the board.
- Duplicate existing cards.
- Archive cards to `KanbanRPM Workspace/archive/`.
- Delete cards through a confirmation modal.
- Show visual badges for status, type, category, dependencies, priority, and overdue dates.
- Show an `Action index` that collects unchecked checkboxes and `#todo` lines from notes linked in `## References` without modifying the original notes.
- Open source notes from the `Action index`.
- Promote an indexed action into a card's `## Current Focus` with `Set next`.
- Group `Action index` entries by card.
- Show a `Command center` panel for review queue, waiting cards, blocked cards, and dependency-heavy cards.
- Collapse or expand `Data warnings`, `Command center`, and `Action index`.
- Keep secondary board actions under `More`, including `Pull Daily`, `Weekly review`, `Export arrows`, and `Normalize order`.
- Select review/active/waiting/blocked/all-visible cards with `Pull Daily`.
- Append Daily actions under a configurable `Daily section`.
- Create or open a KanbanRPM weekly review note with `Weekly review`.
- Show compact card relation rows for `Depends on`, `Blocks`, and `References`.
- Export dependency sections to Laminar-style `arrows/` notes with `Export arrows`.
- Configure which board-card fields are visible from plugin settings.
- Parse Tasks-style small action checkboxes inside living documents and show them in collapsible card rows.
- Check or uncheck small actions from board cards while updating the original Markdown line.
- Create Project, Subproject, and Big Action documents with role-specific `PM Control` / `Working Notes` templates.
- Drag cards between lanes to update `status`.
- Drag cards within a lane to set `order`.
- Normalize lane order values with `Normalize order` or `KanbanRPM: Normalize card order`.
- Refresh automatically when card files change.
- Send a card's `next_action` to today's existing Daily note.

## License Note

The upstream repository metadata currently reports `MIT` in `package.json`, while the included `LICENSE.md` is GPL-3.0 text. KanbanRPM keeps upstream attribution and treats this derivative implementation as GPL-3.0-or-later compatible unless the upstream project clarifies otherwise.

See `docs/Attribution.md` for the current attribution and non-interference notes.
