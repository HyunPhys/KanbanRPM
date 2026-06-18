# KanbanRPM

KanbanRPM is a Kanban-based research project manager for Obsidian. It is built for research and lab-operation workflows where a simple task board is not enough: manuscripts, experiments, analysis pipelines, equipment setup, purchasing, teaching, administration, waiting states, blockers, routines, and long-term planning.

KanbanRPM treats every managed item as a living Markdown document. The board is a view over your project documents, not a place where disposable cards replace your notes.

KanbanRPM supports Obsidian desktop and mobile from the same plugin bundle. Phone layouts are optimized for review/check workflows, while tablet landscape keeps a desktop-like planning surface.

## Install

### Option 1. Manual Install From GitHub Release

1. Open the latest GitHub Release for this repository.
2. Download these three files:
   - `main.js`
   - `manifest.json`
   - `styles.css`
3. In your Obsidian vault, create this folder:

```text
<Your Vault>/.obsidian/plugins/kanban-rpm/
```

4. Put the three downloaded files into that folder.
5. Restart Obsidian, or reload community plugins.
6. Go to `Settings` -> `Community plugins`.
7. Enable `KanbanRPM`.
8. Run `KanbanRPM: Open board` from the command palette.

### Option 2. Install From The Repository Root

The repository root contains the release-ready plugin files:

```text
main.js
manifest.json
styles.css
```

Copy those three files into:

```text
<Your Vault>/.obsidian/plugins/kanban-rpm/
```

Then enable `KanbanRPM` in Obsidian.

### Option 3. Build From Source

```bash
git clone https://github.com/HyunPhys/KanbanRPM.git
cd KanbanRPM
npm install
npm run check
npm run package
```

`npm run package` updates the root release files and prepares:

```text
dist/kanban-rpm-0.3.6/
  main.js
  manifest.json
  styles.css
```

## Quick Start

1. Enable `KanbanRPM`.
2. Run `KanbanRPM: Open board`.
3. Click `New document`.
4. Create a `Project`.
5. Create `Subproject` documents under that Project.
6. Create `Big Action` documents under a Project/Subproject.
7. Move cards across Board lanes to manage execution status.
8. Use the Markdown document body for context, notes, decisions, logs, and checkbox tasks.

Good first structure:

```text
Project: TTT Manuscript
Subprojects:
- TTT Experiment
- TTT Data Processing
- TTT Analysis
- TTT Writing
Big Actions:
- Stack sample 8
- Process sample 8 Kerr data
- Draft figure 2 discussion
```

## Core Philosophy

KanbanRPM uses this hierarchy:

```text
Project -> Subproject -> Big Action -> Checkbox task
```

- `Project`: long-lived goal or operating area.
- `Subproject`: parallel workstream inside a Project.
- `Big Action`: meaningful execution unit worth tracking on a board.
- `Checkbox task`: small task that stays inside the relevant Markdown note.

The plugin intentionally avoids turning every checkbox into a card. Small actions should remain close to the context where they were created. Only work that needs visible status tracking should become a `Big Action`.

KanbanRPM is inspired by Laminar's file-based card philosophy, flow arrows, recurring routines, and timeline rhythm, while using Markdown documents as the source of truth.

## Main Features

- `Board` view with customizable, reorderable status lanes and remembered filters.
- `Table` view with sortable and resizable columns.
- `Timeline` view with horizontal date columns, `Memo`, `Routine`, and inline small-action schedule editing.
- `Gantt` view with Project/Subproject/Big Action hierarchy and date-proportional bars.
- `Archive` view with per-Project archive folders and `Unarchive`.
- `Project notes` strip for top-level Project documents.
- Flow connectors using `Preceded by` / `Followed by`.
- Board and Gantt flow-dot drag to create dependencies.
- Small action indexing from checkboxes and `#todo` lines.
- Routine scheduling with `@daily`, `@weekly`, `@monthly`, and custom `@every` intervals.
- Assisted Experiment/Analysis Log capture into `Research Logs.md`.
- `Management brief` generation for LLM-assisted project review.
- Project close/reopen lifecycle independent of card status.
- Settings for statuses, categories, visible card fields, small-action display, and log prompts.

## Workspace Structure

KanbanRPM creates this folder in your vault:

```text
KanbanRPM Workspace/
  cards/
  routines/
  timeline/
  attachments/
  Research Logs.md
  KanbanRPM Management Brief.md
```

Cards are Markdown files under `cards/`.

```text
cards/Project.md
cards/Project/Subproject.md
cards/Project/Subproject/Big Action.md
```

Archived cards are stored under the owning Project:

```text
cards/Project/archive/Archived Big Action.md
```

## Documentation

User manuals:

- [English Manual](docs/KanbanRPM%20Manual.md)
- [Korean Manual](docs/KanbanRPM%20Manual%20ko.md)

Additional docs:

- [Install Guide](docs/Install.md)
- [Card Schema](docs/Card%20Schema.md)
- [Release Notes](docs/Release%20Notes.md)
- [Release QA](docs/Release%20QA.md)
- [LLM Skills](docs/KanbanRPM%20LLM%20Skills.md)
- [Attribution](docs/Attribution.md)

Path reference: `docs/Release Notes.md`

## LLM-Assisted Management

KanbanRPM can generate a layered LLM context so an LLM does not need to read every living document first:

```text
More -> Generate LLM context
```

This writes:

```text
KanbanRPM Workspace/LLM/
  00 LLM Entry.md
  01 Next Work Candidates.md
  02 Project Map.md
  03 Recent Changes.md
  04 Open Loops.md
  Project Briefs/
```

Use this for:

- choosing which non-active work to activate next
- getting a compact Project briefing
- orienting before opening original living documents for research/content planning

For research planning, read the original Project/Subproject/Big Action notes and relevant references. The generated LLM files are orientation, not a substitute for source context.

Prompt templates are in [KanbanRPM LLM Skills](docs/KanbanRPM%20LLM%20Skills.md):

- `/kanbanrpm-next`
- `/kanbanrpm-brief`
- `/kanbanrpm-plan`

KanbanRPM can also generate the older single-file management brief:

```text
More -> Management brief
```

This writes:

```text
KanbanRPM Workspace/KanbanRPM Management Brief.md
```

Suggested prompt:

```text
Read KanbanRPM Workspace/KanbanRPM Management Brief.md and the linked Project/Subproject/Big Action notes.
Tell me:
1. What needs attention this week.
2. Which Projects are blocked or stale.
3. Which Big Actions should be split, archived, closed, or promoted.
4. Which next actions should be pulled into today.
5. Which metadata or hierarchy links look unclear.
Do not rewrite my notes unless I explicitly ask.
```

KanbanRPM remains the source of truth. The LLM acts as reviewer, summarizer, and planning assistant.

## Build And Release

Development scripts:

```bash
npm run typecheck
npm run build
npm run check
npm run smoke
npm run package
```

Release checklist:

1. Update `manifest.json`, `versions.json`, and `package.json` version if needed.
2. Run `npm run check`.
3. Run `npm run package`.
4. Run `npm run smoke`.
5. Commit the root release files:
   - `main.js`
   - `manifest.json`
   - `styles.css`
6. Tag the release, for example `v0.3.5`.
7. Push the tag to create the GitHub Release.

## Repository Layout

```text
main.js                         Release build output for Obsidian install
manifest.json                   Obsidian plugin manifest
styles.css                      Release stylesheet
versions.json                   Obsidian version map
src-kanbanrpm/                  Active KanbanRPM TypeScript source
scripts/                        Build, package, smoke, and typecheck scripts
docs/                           User and release documentation
src/                            Upstream obsidian-kanban source kept for attribution/reference
LICENSE.md                      GPL-3.0 license text
```

The active implementation is in `src-kanbanrpm/`. The upstream `src/` tree is preserved for attribution/reference because KanbanRPM started from the public `obsidian-community/obsidian-kanban` project.

## Compatibility

KanbanRPM uses:

- plugin id: `kanban-rpm`
- view type: `kanban-rpm-board`
- CSS namespace: `kanban-rpm-*`

It is designed to coexist with the original `Laminar` plugin and the original `Kanban` plugin.

## Acknowledgements

KanbanRPM exists because of prior work and generous ideas from the Obsidian plugin community.

- Thank you to the creators and maintainers of [Obsidian Kanban](https://github.com/obsidian-community/obsidian-kanban). KanbanRPM started from the public Kanban source tree and keeps the upstream source and license material for attribution/reference.
- Special thanks to [F1rstPenguin](https://github.com/F1rstPenguin), creator of [Laminar](https://github.com/F1rstPenguin/Laminar), for the inspiration behind Laminar's file-based cards, temporal workspace, routines, and flow-oriented project management. KanbanRPM also benefited from Laminar's ideas and from the creator's advice while shaping this plugin's research-management direction.

## License

KanbanRPM is distributed under `GPL-3.0-or-later`.

This project was started from the public `obsidian-community/obsidian-kanban` source tree. Upstream attribution and license material are preserved. See [Attribution](docs/Attribution.md).
