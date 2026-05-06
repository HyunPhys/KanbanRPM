# KanbanRPM Roadmap

This roadmap tracks KanbanRPM from the current TypeScript MVP toward a practical research project manager for Obsidian.

## Current Status

KanbanRPM is currently through Phase 7 Release Readiness, with Phase 1/2 foundations, Phase 3 Data Model stabilization, Phase 4 Architecture refactor, Phase 5 Legacy Import, and Phase 6 Daily/Weekly Workflow already implemented.

Implemented:

- Plugin id/name: `kanban-rpm` / `KanbanRPM`
- Active source: `src-kanbanrpm/`
- Build output: `.obsidian/plugins/kanban-rpm/`
- npm workflow: `npm install`, `npm run typecheck`, `npm run build`, `npm run check`
- Board commands: `KanbanRPM: Open board`, `KanbanRPM: New project card`, `KanbanRPM: New group note`
- Ribbon icon for opening the board
- Card search/filter from the board toolbar
- Lane-level quick add
- Card loading from `KanbanRPM Workspace/cards/*.md`
- Lanes: `Inbox -> Active -> Waiting -> Blocked -> Someday -> Done`
- Card create and edit modals
- Card duplication
- Card archive/delete
- Visual badges for priority, status, importance, and overdue dates
- Drag/drop updates for `status` and `rpm_order`
- Board auto refresh when card files change
- `Send to Daily`
- Settings for `Workspace folder` and `Daily folder`
- Flexible fields: `group`, `workstream_type`, `project_kind`, `stage`, `related_samples`, `related_phenomena`, `related_people`, `related_notes`, `depends_on`, `blocks`, `source_notes`
- Board filters for `Group`, `Project kind`, and `Workstream type`
- `Data warnings` panel for invalid status, invalid priority, malformed dates, unknown vocabulary values, and broken source links
- `Open schema reference` command that creates/opens `KanbanRPM Workspace/KanbanRPM Card Schema.md`
- Developer schema document at `docs/Card Schema.md`
- Card badges for group/stage/type/kind/dependency metadata
- `Action index` that reads unchecked checkboxes and `#todo` lines from linked source notes without modifying originals
- `Action index` source opening and `Set next` promotion into `next_action`
- Compact card relation rows for `depends_on`, `blocks`, and `source_notes`
- `Command center` panel for review queue, waiting cards, blocked cards, and dependency-heavy cards
- Card-grouped `Action index`
- Inline status buttons for `Active`, `Waiting`, `Blocked`, and `Done`
- Collapse/expand controls for `Command center` and `Action index`
- Batch `Daily review` pull for review queue cards with `next_action`
- `Write arrows` command/button that exports `depends_on` and `blocks` into Laminar-style `arrows/` notes
- `Normalize card order` command/button that rewrites each lane's `rpm_order` values
- Phase 4 module split completed across plugin lifecycle, board view, card repository, Daily integration, modals, settings, schema, shared types, constants, and utilities
- `Import legacy project notes` command/button with preview-only scan, selected card seeding, and duplicate prevention through `legacy_links`
- `Pull cards to Daily` command/button with review/active/waiting/blocked/all-visible batch selection
- Configurable `Daily section` insertion for Daily actions
- `Open weekly review` command/button that creates or opens a KanbanRPM weekly review note
- `versions.json`
- `npm run package` release bundle script
- `npm run smoke` release consistency check
- Install, release notes, release QA, and attribution docs
- English and Korean user manuals

Known limits:

- Long-running Obsidian UI QA is still pending.
- The current UI is functional but still compact and utilitarian.
- The architecture is now modular, but automated UI-level tests are still not in place.

## Phase 0. Baseline

Goal: freeze the current MVP as a stable baseline.

Tasks:

- Keep the current changes reviewable as the `v0.1.0 MVP baseline`.
- Confirm `npm run check` passes.
- Manually test plugin enable, board open, card create/edit/drag/drop, and Daily Pull in Obsidian.
- Confirm KanbanRPM can coexist with existing `Laminar` and `Kanban` plugins.

Done when:

- Build output exists in `.obsidian/plugins/kanban-rpm/`.
- Obsidian loads KanbanRPM without command/view/CSS conflicts.
- README and both manuals describe the current behavior.

## Phase 1. Usability

Goal: make the board comfortable for daily use.

Planned features:

- Better visual badges for `area`.
- Stronger visual emphasis for `Blocked`, `Waiting`, and overdue cards.
- Better display and opening of linked notes from card metadata.
- Add source-line deep links for `Action index` where Obsidian API support allows.
- Add a dedicated dependency/arrows view.

Done when:

- A user can find, create, triage, and clean up cards without editing files directly.
- English and Korean manuals are updated.

## Phase 2. Research PM Views

Goal: turn KanbanRPM from a board into a research project command center.

Implemented foundation:

- Flexible `group`, `workstream_type`, `project_kind`, and `stage` metadata.
- `source_notes` action collection.
- Group notes in `KanbanRPM Workspace/groups/`.

Planned features:

- `next_review` review queue.
- `due_date` upcoming/deadline view.
- Waiting dashboard based on `waiting_for`.
- Blocked dashboard based on `blocker`.
- Filter/group by `area`.
- Better display and opening of `legacy_links`, `source_notes`, and related notes.
- Dependency view from `depends_on`, `blocks`, and future `arrows/` files.

Done when:

- The board can answer what needs review, what is blocked, and what is waiting.

## Phase 3. Data Model

Status: Implemented.

Goal: keep card data reliable as the workspace grows.

Implemented foundation:

- Frontmatter validation.
- Invalid card warnings.
- Missing/unknown `status` handling with display fallback to `Inbox`.
- `rpm_order` normalize command.
- Documented card schema.
- Lane/status customization evaluated and deferred until more real-vault QA because fixed lanes keep validation, Daily review, and Command center behavior predictable.

Done when:

- Bad or incomplete YAML does not break the board.
- Schema behavior is documented in README and manuals.

## Phase 4. Architecture

Status: Implemented.

Goal: split the current single-file implementation into maintainable modules.

Implemented:

- `main.ts` now focuses on plugin lifecycle, commands, settings loading/saving, view registration, and orchestration.
- `board-view.ts` owns the board UI, toolbar, filters, panels, lane rendering, card rendering, and drag/drop interaction.
- `card-repository.ts` owns workspace/card file operations, schema validation, order normalization, group creation, action indexing, dependency arrow export, archive/delete/duplicate, and card updates.
- `daily.ts` owns single-card and batch Daily note integration.
- `modals.ts` owns card, group, and confirmation modals.
- `settings-tab.ts` owns plugin settings UI.
- `types.ts`, `constants.ts`, `utils.ts`, and `schema.ts` hold shared definitions, vocabularies, helpers, and schema reference content.

Possible later step:

- Adopt selected upstream `obsidian-kanban` Preact component patterns when useful.

Done when:

- New features no longer require expanding one large `main.ts`.
- UI and data logic are easier to test and change.

## Phase 5. Legacy Import

Status: Implemented.

Goal: connect existing project notes without damaging the vault.

Implemented:

- Preview-only scan of existing project notes.
- User-selected card seed from legacy notes.
- Duplicate prevention via `legacy_links`.
- Never auto-modify old project notes.
- Import preview/report.
- Candidate detection based on `💼` path/title, `type: project`, `category: project`, `project` tags, and project-like names.
- Already seeded notes are shown but disabled by default.

Done when:

- Existing project notes can become KanbanRPM cards incrementally and safely.

## Phase 6. Daily/Weekly Workflow

Status: Implemented.

Goal: connect project management with daily planning and weekly review.

Implemented:

- Improved `Send to Daily`.
- Optional Daily section target.
- Batch pull cards to Daily.
- Pull due/review, active, waiting, blocked, or all visible cards to Daily.
- Stronger duplicate detection.
- Weekly review command.
- Weekly review note generation under the configured weekly review folder.

Done when:

- KanbanRPM naturally supports daily planning and weekly review.

## Phase 7. Release Readiness

Status: Implemented.

Goal: make KanbanRPM manageable as an independent plugin project.

Implemented:

- Versioning.
- Release notes.
- Install/update docs.
- Release QA checklist.
- Local release bundle script.
- `versions.json`.
- Upstream attribution/license note.

Deferred:

- Screenshots or GIFs.
- Decide whether to publish to a separate GitHub repo.

Done when:

- A fresh vault can install and use KanbanRPM from documentation alone.

## Documentation Rule

Whenever user-facing behavior changes, update both manuals in the same change:

- `docs/KanbanRPM Manual.md`
- `docs/KanbanRPM Manual ko.md`

The Korean manual keeps plugin UI terms in English.
