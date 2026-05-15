# KanbanRPM Manual

KanbanRPM is an Obsidian plugin for managing research projects, lab setup, equipment purchases, writing, teaching, and administrative work. It is not only a Kanban board. Its core idea is that each managed item should remain a living Markdown document that can hold context, notes, decisions, logs, and small tasks.

## Installation

### Install From This Vault

KanbanRPM is built into the vault plugin folder:

```text
D:\Obsidian Vaults\Project_Manage_test\.obsidian\plugins\kanban-rpm
```

To use it in Obsidian:

1. Open this vault in Obsidian.
2. Go to `Settings` -> `Community plugins`.
3. Enable `KanbanRPM`.
4. Run `KanbanRPM: Open board` from the command palette, or click the KanbanRPM ribbon icon.

The original `Laminar` and original `Kanban` plugins can remain installed. KanbanRPM uses its own plugin id, view type, commands, CSS classes, and workspace folders.

### Build From Source

The source project is:

```text
D:\Obsidian Vaults\Project_Manage_test\KanbanRPM
```

Use npm:

```bash
npm install
npm run check
npm run smoke
npm run package
```

`npm run check` runs typecheck and build. The build writes:

```text
.obsidian/plugins/kanban-rpm/main.js
.obsidian/plugins/kanban-rpm/manifest.json
.obsidian/plugins/kanban-rpm/styles.css
```

`npm run package` creates a release bundle under:

```text
KanbanRPM/dist/kanban-rpm-0.3.0
```

## Philosophy

KanbanRPM follows a living-docs-first project management model.

```text
Project -> Subproject -> Big Action -> Checkbox task
```

- `Project`: the top-level goal or operating area. Examples: `TTT Manuscript`, `Lab Setup`, `Optical Contrast of h-BN`.
- `Subproject`: a workstream inside a Project. Examples: `TTT Experiment`, `TTT Analysis`, `Glove Box Setup`, `Furnace Purchase`.
- `Big Action`: a meaningful chunk of work worth tracking on the board. Examples: `Stack sample 8`, `Process Kerr data`, `Send revised quotation request`.
- `Checkbox task`: a small action inside a Markdown document or meeting note. It stays where it was written unless you promote it manually.

The plugin avoids turning every small task into a card. Cards should represent workstreams or meaningful action units. Small tasks can remain as checkboxes inside the relevant document.

KanbanRPM borrows the useful parts of Laminar's philosophy:

- cards are files, not disposable UI objects
- groups/projects matter
- arrows/flow matter
- recurring routines matter
- timeline rhythm matters

But KanbanRPM stores these concepts in Markdown documents and renders them through Board, Table, Timeline, Gantt, Archive, and panel views.

## Workspace Structure

KanbanRPM creates this workspace when needed:

```text
KanbanRPM Workspace/
  cards/
  routines/
  timeline/
  attachments/
  Research Logs.md
  KanbanRPM Management Brief.md
```

Living documents are stored under `cards/` according to their primary hierarchy:

```text
cards/Project.md
cards/Project/Subproject.md
cards/Project/Subproject/Big Action.md
```

Archived documents are stored inside the owning Project folder:

```text
cards/Project/archive/Archived Big Action.md
```

If a document is linked to multiple Projects or Subprojects, its file remains under the primary hierarchy chosen at creation time. Additional hierarchy links are still indexed and displayed.

## First Use

1. Open `KanbanRPM: Open board`.
2. Click `New document`.
3. Create a `Project`.
4. Create one or more `Subproject` documents under that Project.
5. Create `Big Action` documents under a Project/Subproject.
6. Use Board lanes to track execution status.
7. Use the Markdown body for context, notes, decisions, logs, and small checkbox tasks.

A good starting structure for a research manuscript might be:

```text
Project: TTT Manuscript
Subprojects:
- TTT Background Research
- TTT Experiment
- TTT Data Processing
- TTT Analysis
- TTT Discussion / Writing
Big Actions:
- Stack sample 8
- Process sample 8 Kerr data
- Draft figure 2 discussion
```

A lab setup project might be:

```text
Project: Lab Setup
Subprojects:
- Glove Box Setup
- Furnace Setup
- Probe Station Setup
Big Actions:
- Request glove box revised quotation
- Finish gas line drawing
- Submit equipment purchase review
```

## Views

Use the top view switcher to move between:

- `Board`: status lane execution view.
- `Table`: sortable, resizable overview.
- `Timeline`: Laminar-style horizontal date view with `Memo` and `Routine`.
- `Gantt`: month/quarter planning view with date-proportional bars and flow connectors.
- `Archive`: archived card view with `Unarchive`.

The filter row supports:

- `Project`
- `Subproject` / `Subproject filter`
- `Category`
- `Show closed projects`
- `Panels`

`Panels` opens toggles for:

- `Data warnings`
- `Command center`
- `Action index`
- `Research index`

## Board

`Board` is the main execution surface. It shows status lanes such as:

```text
Inbox -> Active -> Waiting -> Blocked -> Someday -> Done
```

Statuses are customizable in plugin settings. Board lanes can be shown or hidden through the `Statuses` checkbox filter.

Project documents do not appear inside status lanes. They appear in the `Project notes` strip above the board. Status lanes mainly show `Subproject` and `Big Action` documents.

Board card basics:

- Click the title to open the original Markdown document.
- Click the pencil icon to edit metadata.
- Use the `...` menu for actions such as `Duplicate`, `Archive`, and `Delete`.
- Drag a card between lanes to update `status`.
- Drag a card within a lane to update `order`.
- Use `Details` for lower-priority metadata.
- Use `Small actions` to expand or collapse checkbox tasks found inside the document.

## Table

`Table` gives a dense overview. It is useful when you want to sort and compare many items.

Common actions:

- Click a column header to sort.
- The black triangle indicates sort direction.
- Drag column edges to resize columns.
- Click a title to open the living document.
- Use status and priority badges to scan execution state quickly.

## Timeline

`Timeline` is a horizontal, date-centered planning surface inspired by Laminar.

It shows:

- due markers
- review markers
- scheduled/due small actions
- recurring `Routine` items
- date `Memo` cards

The default range is from 7 days before today through 7 days after today. You can change the base date or apply a custom date range.

### Memo

`Memo` is for lightweight day notes. It is useful for quick one-off items that do not deserve a living document.

KanbanRPM creates a date memo file only after you edit and save a memo:

```text
KanbanRPM Workspace/timeline/YYYY-MM-DD.md
```

Memo content is rendered as Markdown preview. Checkbox items can be toggled from preview mode.

### Routine

`Routine` is for recurring work:

```markdown
### Routine

- [ ] Weekly TTT Review @weekly @start 2026-05-13
- [ ] TEM Data Backup @monthly @start 2026-05-01
- [ ] Lab cleanup @every 2w @start 2026-05-15
```

Supported schedules:

- `@daily`
- `@weekly`
- `@monthly`
- `@every 2d`
- `@every 2w`
- `@every 2m`

Routine completion is written to `### Routine Log` as a Markdown table. Once completed for the active recurrence period, the routine is hidden from the sidebar until the next occurrence.

## Gantt

`Gantt` is for medium-term planning. It uses `Start date`, `Due date`, and `Next review`.

Scales:

- `Month+Week`
- `Quarter+Month`

Behavior:

- Project, Subproject, and Big Action rows preserve hierarchy.
- Items at the same hierarchy level sort by earliest start date.
- Project/Subproject rows can be collapsed.
- Bars use status colors.
- Click a bar to edit `Start date`, `Due date`, and `Next review`.
- Flow badges and connectors show relationships between cards.
- Drag from a right-side flow dot to another row's left-side flow dot to create a `Preceded by` relation.
- Click a connector arrow to remove the relation after confirmation.

## Archive

Use `Archive` when a card should disappear from active work but remain available.

Archive behavior:

- Archive from a card's `...` menu.
- Archived files move to the owning Project's `archive/` folder.
- `Archive` view shows archived cards only.
- Use `Unarchive` to restore the file to its original path when possible.

## Project Lifecycle

Project lifecycle is separate from card `status`.

Use `Close project` from the `Project notes` strip when a whole Project is no longer active. A closed Project and cards that only belong to that closed Project are hidden from default views. Cards also linked to an active Project remain visible.

Use `Show closed projects` to inspect closed Projects, then `Reopen project` to make one active again.

Closing a Project does not automatically change child card statuses.

## Action Index

`Action index` collects small tasks without modifying the original notes.

It can read:

- unchecked checkboxes inside living documents
- unchecked checkboxes from notes linked under `### References`
- lines with `#todo`
- recurring `Routine` items

Small actions are not automatically converted into cards. You can:

- leave them as checkboxes
- check/uncheck them from the card UI
- promote an important action to `Current Focus`
- create a new Big Action manually if the task becomes large enough

Tasks-style metadata supported in checkbox text:

```markdown
- [ ] Process data 📅 2026-05-20 ⏳ 2026-05-18 🔼
```

KanbanRPM reads:

- due date: `📅 YYYY-MM-DD`
- scheduled date: `⏳ YYYY-MM-DD`
- done date: `✅ YYYY-MM-DD`
- priority markers such as `🔼`, `🔽`, `⏫`, `⏬`

## Flow

Flow is KanbanRPM's dependency model.

Use:

```markdown
### Flow

Preceded by:
- [[Sample fabrication]]

Followed by:
- [[Figure 2 analysis]]
```

Meaning:

- `Preceded by`: this card needs another card before it.
- `Followed by`: this card is followed by another card.

The UI primarily writes `Preceded by`. If you drag A's right dot to B's left dot, B receives A under `Preceded by`.

Flow appears as:

- board arrows
- Gantt connectors
- badges such as `Preceded`, `Followed`, and `Blocked`
- `Data warnings` for broken or circular flow

## Research Logs

KanbanRPM supports assisted Experiment/Analysis logging without creating a separate `record` card type.

When a `Big Action` with a matching `Category` is moved to a completion status, KanbanRPM can prompt for a log row. The row is written to:

```text
KanbanRPM Workspace/Research Logs.md
```

Default mappings:

- `experiment` Category -> `Experiment Log`
- `analysis` Category -> `Analysis Log`

The setting `Prompt for log when moving matching Big Action to Done` controls whether the prompt appears.

Example:

```markdown
### Experiment Log

#### Stacking

| Date | Sample | Conditions | Result | Link |
| --- | --- | --- | --- | --- |
| 2026-05-14 | [[TTT Sample 8]] | PC, 8 wt%, 100C 7m | partial success | [[Stack sample 8]] |
```

`Research index` reads these logs and shows them in the board panel.

## Metadata Reference

KanbanRPM keeps frontmatter intentionally small. Long text belongs in the Markdown body.

Core frontmatter:

```yaml
kanban_rpm: true
type: project | subproject | big_action
id: stable-id
status: inbox
order:
```

Hierarchy:

```yaml
primary_project: "[[TTT Manuscript]]"
primary_subproject: "[[TTT Experiment]]"
projects:
  - "[[TTT Manuscript]]"
subprojects:
  - "[[TTT Experiment]]"
```

Lifecycle/archive:

```yaml
project_state: active | closed
archived: true
archived_at: 2026-05-15
archive_original_path:
archive_owner_project:
```

Classification:

```yaml
workstream_type: experiment
priority: 3
```

User-facing meaning:

- `kanban_rpm`: marks the file as managed by KanbanRPM.
- `type`: document role: `Project`, `Subproject`, or `Big Action`.
- `id`: stable identity for internal tracking.
- `status`: execution state shown on Board/Table/Timeline/Gantt.
- `order`: manual order within a status lane.
- `primary_project`: default Project for breadcrumb and folder placement.
- `primary_subproject`: default Subproject for Big Action breadcrumb and folder placement.
- `projects`: all linked Projects.
- `subprojects`: all linked Subprojects.
- `project_state`: Project lifecycle; `closed` hides completed Projects from default views.
- `workstream_type`: shown as `Category`; customizable in settings.
- `priority`: displayed as a priority badge.
- `archived`: marks a card as archived.

Body sections:

- `### Current Focus`: the next meaningful focus.
- `### Waiting`: what or who you are waiting for.
- `### Blockers`: what blocks progress.
- `### Flow`: `Preceded by` / `Followed by` relations.
- `### Timeline`: `Start date`, `Next review`, `Due date`.
- `### Timeline Log`: completion and reminder log.
- `### Routine`: recurring work.
- `### Routine Log`: recurring completion log.
- `### References`: notes scanned by `Action index`.
- `### PM Metadata`: optional readable metadata.
- `## Working Notes`: free writing area.

## Settings

Important settings:

- `Workspace folder`: root folder for KanbanRPM data.
- `Statuses`: global status list used by all views.
- `Categories`: editable vocabulary for `Category`.
- `Board status filter`: which status lanes are visible.
- `Timeline status filter`: which statuses appear in Timeline.
- `Card display fields`: choose which card details appear on Board cards.
- `Small action display`: choose which small actions are shown.
- `Experiment log categories`: Categories that trigger Experiment Log prompt.
- `Analysis log categories`: Categories that trigger Analysis Log prompt.
- `Prompt for log when moving matching Big Action to Done`: enable/disable assisted capture.
- `Next review reminder status`: status applied when `Next review` is due.
- `Show closed projects`: reveal closed Project trees.

## LLM-Based Management

KanbanRPM is designed so an LLM can read the project system as Markdown instead of reverse-engineering a UI.

### Generate A Management Brief

Use:

```text
More -> Management brief
```

or the command:

```text
KanbanRPM: Write management brief
```

KanbanRPM writes:

```text
KanbanRPM Workspace/KanbanRPM Management Brief.md
```

The brief summarizes:

- snapshot
- executive attention
- project health
- project sections
- upcoming dates
- next actions
- open small actions
- waiting/blocking state
- flow risks
- routines
- recent research logs
- data warnings

### Suggested LLM Prompt

Use a prompt like:

```text
Read KanbanRPM Workspace/KanbanRPM Management Brief.md and the linked Project/Subproject/Big Action notes.
Give me:
1. What needs attention this week.
2. Which Projects are blocked or stale.
3. Which Big Actions should be converted, split, archived, or closed.
4. Which next actions should be pulled into today.
5. Any missing metadata or unclear hierarchy.
Do not rewrite my notes unless I explicitly ask.
```

### Good LLM Workflow

1. Run `Management brief`.
2. Ask the LLM to review the brief.
3. Open the suggested living documents.
4. Decide manually whether to edit `Current Focus`, `Timeline`, `Flow`, or `status`.
5. Use KanbanRPM views to verify the board still reflects your intent.

The important rule is that KanbanRPM remains the source of truth, while the LLM acts as a reviewer, summarizer, and planning assistant.

## Practical Recommendations

- Use `Project` for long-lived goals.
- Use `Subproject` for parallel workstreams.
- Use `Big Action` for work that deserves status tracking.
- Keep small tasks as checkboxes unless they become substantial.
- Put long explanations in `Working Notes`, not frontmatter.
- Use `Current Focus` for the next meaningful step.
- Use `Waiting` for people, vendors, approvals, or data you are waiting on.
- Use `Blockers` for real obstacles.
- Use `Flow` when order matters.
- Use `Routine` for repeating review/maintenance work.
- Use `Research Logs.md` for completed experiment/analysis summaries.
- Close Projects when they are truly inactive or complete.
- Archive cards that are no longer active but should remain searchable.

## Troubleshooting

- If a card does not appear, check that it is under `KanbanRPM Workspace/cards/` and has `kanban_rpm: true`.
- If a status looks wrong, check `Settings` -> `Statuses`.
- If a Category warning appears, add the Category in settings or change `workstream_type`.
- If a flow arrow is broken, check the wikilink under `### Flow`.
- If Timeline is empty, check `Due date`, `Next review`, scheduled small actions, and visible status filters.
- If Gantt is empty, add `Start date` and `Due date` under `### Timeline`.
- If a closed Project is missing, enable `Show closed projects`.
