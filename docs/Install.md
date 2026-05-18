# KanbanRPM Install Guide

This guide explains how to install KanbanRPM from GitHub, from release files, or from source.

## Manual Install From GitHub Release

1. Open the latest GitHub Release for KanbanRPM.
2. Download:
   - `main.js`
   - `manifest.json`
   - `styles.css`
3. Create this folder in your target Obsidian vault:

```text
<Your Vault>/.obsidian/plugins/kanban-rpm/
```

4. Copy the three files into that folder.
5. Restart Obsidian or reload community plugins.
6. Enable `KanbanRPM` in `Settings` -> `Community plugins`.
7. Run `KanbanRPM: Open board`.

## Install From Repository Root

The repository root contains release-ready files:

```text
main.js
manifest.json
styles.css
```

Copy those files into:

```text
<Your Vault>/.obsidian/plugins/kanban-rpm/
```

Then enable `KanbanRPM`.

## Build From Source

```powershell
git clone https://github.com/HyunPhys/KanbanRPM.git
cd KanbanRPM
npm install
npm run check
npm run package
npm run smoke
```

`npm run package` creates:

```text
dist/kanban-rpm-0.3.1/
  main.js
  manifest.json
  styles.css
```

It also updates the repository root release files:

```text
main.js
manifest.json
styles.css
```

## Local Development Install

When developing inside the original test vault, `npm run build` writes the live plugin files to:

```text
D:\Obsidian Vaults\Project_Manage_test\.obsidian\plugins\kanban-rpm\
  main.js
  manifest.json
  styles.css
```

Then open Obsidian and enable `KanbanRPM`.

## Upgrade

1. Download or build the new `main.js`, `manifest.json`, and `styles.css`.
2. Replace those files in:

```text
<Your Vault>/.obsidian/plugins/kanban-rpm/
```

3. Restart Obsidian or disable/enable `KanbanRPM`.

KanbanRPM stores user data as Markdown files under `KanbanRPM Workspace/`. Updating plugin files should not modify your card documents.

## Coexistence

KanbanRPM uses:

- plugin id: `kanban-rpm`
- view type: `kanban-rpm-board`
- CSS namespace: `kanban-rpm-*`

It is intended to coexist with the original `Laminar` plugin and the original `Kanban` plugin.
