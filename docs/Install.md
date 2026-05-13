# KanbanRPM Install Guide

This guide explains how to install KanbanRPM from the local source project or from a prepared release bundle.

## Local Development Install

Use this when developing inside this vault.

```powershell
cd "D:\Obsidian Vaults\Project_Manage_test\KanbanRPM"
$env:Path = 'C:\Program Files\nodejs;' + $env:Path
npm install
npm run check
npm run package
npm run smoke
```

The build writes these files to the live Obsidian plugin folder:

```text
D:\Obsidian Vaults\Project_Manage_test\.obsidian\plugins\kanban-rpm\
  main.js
  manifest.json
  styles.css
```

Then open Obsidian, go to `Settings -> Community plugins`, and enable `KanbanRPM`.

## Release Bundle Install

Prepare a local release bundle:

```powershell
cd "D:\Obsidian Vaults\Project_Manage_test\KanbanRPM"
npm run package
```

This creates:

```text
KanbanRPM/dist/kanban-rpm-0.2.0/
  main.js
  manifest.json
  styles.css
```

Run `npm run smoke` after packaging to confirm the release bundle and live plugin folder contain the expected files and matching versions.

To install in another vault, copy that folder into:

```text
<Other Vault>/.obsidian/plugins/kanban-rpm/
```

Restart Obsidian or reload community plugins, then enable `KanbanRPM`.

## Upgrade

1. Run `npm run check` or `npm run package`.
2. Replace `main.js`, `manifest.json`, and `styles.css` in the target vault plugin folder.
3. Restart Obsidian or disable/enable `KanbanRPM`.

KanbanRPM stores user data as Markdown files under `KanbanRPM Workspace/`. Upgrading plugin files should not modify card files.

## Coexistence

KanbanRPM uses:

- plugin id: `kanban-rpm`
- view type: `kanban-rpm-board`
- CSS namespace: `kanban-rpm-*`

It is intended to coexist with the original `Laminar` plugin and the original `Kanban` plugin.
