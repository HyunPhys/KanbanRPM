# KanbanRPM Attribution

KanbanRPM was developed as a new Obsidian plugin for research project management while keeping the original `obsidian-community/obsidian-kanban` source tree in this project for reference and attribution.

## Upstream Reference

- Upstream project: `obsidian-community/obsidian-kanban`
- Upstream URL: `https://github.com/obsidian-community/obsidian-kanban`
- Preserved source/reference folder: `src/`
- Preserved upstream license material: `LICENSE.md`

## Active Implementation

The active KanbanRPM implementation lives in:

```text
src-kanbanrpm/
```

The current implementation is TypeScript and uses Obsidian plugin APIs directly. It does not modify the installed upstream `obsidian-kanban` plugin in the vault.

## License Note

The upstream repository metadata has historically shown a mismatch between package metadata and included license text. KanbanRPM keeps the upstream material and treats this derivative implementation as GPL-3.0-or-later compatible unless the upstream project clarifies otherwise.

## Non-Interference

KanbanRPM uses distinct identifiers:

- plugin id: `kanban-rpm`
- display name: `KanbanRPM`
- view type: `kanban-rpm-board`
- CSS namespace: `kanban-rpm-*`
- workspace folder: `KanbanRPM Workspace/`

It should not modify:

- `.obsidian/plugins/laminar`
- `.obsidian/plugins/obsidian-kanban`
- existing legacy project notes, except when the user manually edits them outside KanbanRPM
