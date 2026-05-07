# KanbanRPM v0.1.0 Baseline QA

Use this checklist before treating the current MVP as a stable baseline.

## Build Verification

- [ ] Run `npm install`.
- [ ] Run `npm run check`.
- [ ] Confirm build output exists:

```text
.obsidian/plugins/kanban-rpm/main.js
.obsidian/plugins/kanban-rpm/manifest.json
.obsidian/plugins/kanban-rpm/styles.css
```

## Plugin Load

- [ ] Restart Obsidian or reload plugins.
- [ ] Enable `KanbanRPM` in `Community plugins`.
- [ ] Confirm existing `Laminar` still loads.
- [ ] Confirm existing `Kanban` still loads.
- [ ] Confirm no duplicate command/view id warnings appear.

## Board Open

- [ ] Run `KanbanRPM: Open board`.
- [ ] Confirm the board opens.
- [ ] Confirm lanes appear:

```text
Inbox -> Active -> Waiting -> Blocked -> Someday -> Done
```

- [ ] Confirm `KanbanRPM Workspace/` is created if missing.
- [ ] Confirm `KanbanRPM Workspace/cards/` is created if missing.

## Card Create/Edit

- [ ] Click `New document`.
- [ ] Create a test Project with title, status, type, priority, category, and Current Focus.
- [ ] Create a test Subproject and choose the Project from the `Parent` dropdown.
- [ ] Confirm the card appears on the board.
- [ ] Confirm the card file exists in `KanbanRPM Workspace/cards/`.
- [ ] Click `Edit`.
- [ ] Change status, priority, Current Focus, waiting, blocker, review date, and due date.
- [ ] Confirm short frontmatter and body sections update correctly.

## Drag/Drop

- [ ] Drag the test card to another lane.
- [ ] Confirm `status` changes in frontmatter.
- [ ] Drag within the same lane.
- [ ] Confirm `order` is written.
- [ ] Confirm the board auto-refreshes after file changes.

## Daily Pull

- [ ] Confirm today's Daily note exists in the configured `Daily folder`.
- [ ] Click `Send to Daily`.
- [ ] Confirm this line is appended:

```markdown
- [ ] [[Card Title]]: next_action
```

- [ ] Click `Send to Daily` again.
- [ ] Confirm the line is not duplicated.
- [ ] Test behavior when today's Daily note does not exist.

## Documentation

- [ ] Confirm README points to both manuals.
- [ ] Confirm English manual describes current features.
- [ ] Confirm Korean manual describes current features and keeps plugin UI terms in English.

## Baseline Result

Record the result here before moving to Phase 1:

```text
Date: 2026-05-07 08:33 +09:00
Tester: Byunghyun Kim
Obsidian version: Not recorded
KanbanRPM version: 0.1.0
Result: Passed
Notes: User confirmed plugin load, board workflow, card workflow, and Daily/Weekly workflow worked without issues.
```
