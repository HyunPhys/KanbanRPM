# KanbanRPM v0.3.1

KanbanRPM v0.3.1 is a patch release focused on taxonomy polish and documentation.

## Highlights

- Category settings now support `id | Label`, matching the global status set format.
- Category ids remain stored in card frontmatter while labels are displayed in UI dropdowns, filters, and cards.
- Existing string-based category settings are migrated automatically.
- Added LLM Wiki agent protocol documents for using KanbanRPM and an LLM Wiki in the same vault.
- Living-docs-first `Project -> Subproject -> Big Action -> Checkbox task` model.
- Board, Table, Timeline, Gantt, and Archive views.
- Project notes strip with close/reopen lifecycle.
- Custom status and category settings.
- Flow connectors with `Preceded by` / `Followed by`.
- Board and Gantt connector-dot drag.
- Timeline `Memo` and recurring `Routine` support.
- Gantt planning with month/week and quarter/month scales.
- Per-Project archive folders and Archive view.
- Assisted Experiment/Analysis Log capture into `Research Logs.md`.
- LLM-friendly `Management brief` generation.
- English and Korean manuals.

## Install

Download `main.js`, `manifest.json`, and `styles.css` from the release assets and place them in:

```text
<Your Vault>/.obsidian/plugins/kanban-rpm/
```

Then enable `KanbanRPM` in Obsidian `Settings -> Community plugins`.
