# KanbanRPM v0.3.7

KanbanRPM v0.3.7 adds communication source notes and small Timeline/terminology refinements.

## Highlights

- Added `New communication source note` for `Meeting (Internal)`, `Meeting (External)`, `Call`, `Chat`, and `Email`.
- Communication source notes are stored under `KanbanRPM Workspace/communications/YYYY/<Type>/`.
- Added yearly `Communication Log (YYYY).md` files with type-grouped Markdown tables.
- Added participant suggestions sorted by prior usage frequency.
- Removed the experimental `Capture communication` command and More-menu action.
- Standardized user-facing `Next action` wording to `Current focus`.
- Timeline card markers now show each card's `Current focus`.
- Timeline view now preserves both horizontal and vertical scroll positions.

## Install

Download `main.js`, `manifest.json`, and `styles.css` from the release assets and place them in:

```text
<Your Vault>/.obsidian/plugins/kanban-rpm/
```

Then enable `KanbanRPM` in Obsidian `Settings -> Community plugins`.
