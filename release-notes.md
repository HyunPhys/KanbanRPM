# KanbanRPM v0.3.8

KanbanRPM v0.3.8 focuses on hierarchy-safe editing, Timeline refinements, Routine fixes, and a sample workspace for new users.

## Highlights

- Added a general-purpose sample workspace under `examples/sample-workspace/`.
- Project creation now creates the matching Project folder.
- Editing a Subproject or Big Action hierarchy now moves the card file to the matching Project/Subproject folder.
- Moving a Subproject to another Project also moves its child folder and updates child Big Action hierarchy metadata.
- Timeline priority badges are clickable and can update card priority directly.
- Research Log prompts now let you choose an existing experiment/analysis module heading or type a new one.
- Routine sidebar now hides the current occurrence after it is marked done.
- Edit/New document modals now keep priority and planning dates visible outside Advanced metadata.

## Install

Download `main.js`, `manifest.json`, and `styles.css` from the release assets and place them in:

```text
<Your Vault>/.obsidian/plugins/kanban-rpm/
```

Then enable `KanbanRPM` in Obsidian `Settings -> Community plugins`.
