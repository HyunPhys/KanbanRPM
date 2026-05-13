# KanbanRPM v0.1 to v0.2 Migration Guide

KanbanRPM v0.2 changes the center of gravity from frontmatter-heavy cards to living Markdown documents. Existing v0.1 files are not migrated automatically. Keep them as references, then create new v0.2 Project, Subproject, and Big Action documents when you are ready.

## What Changed

- Daily note planning was replaced by the Laminar-style `Timeline` view and date `Memo` cards.
- `Group`, `Project kind`, `Area`, `Workstream type`, `importance`, and `stage` were simplified into:
  - `Project`
  - `Subproject`
  - `Big Action`
  - `Category`
  - `status`
  - `priority`
- Large prose fields should live in Markdown sections, not frontmatter.
- Dependency language changed to `Flow`, `Preceded by`, and `Followed by`.
- Board flow arrows are edited directly on the Board by dragging from a right connector dot to another card's left connector area.
- `Routine` routines now use `@start YYYY-MM-DD` plus `@daily`, `@weekly`, `@monthly`, or `@every 3d/2w/1m`.

## Recommended Migration Path

1. Keep v0.1 cards untouched.
2. Create one new v0.2 `Project` document for each active research or operations project.
3. Create `Subproject` documents for the major workstreams under that project.
4. Create `Big Action` documents only for trackable chunks of work, not every checkbox task.
5. Move important planning context from old frontmatter into readable sections:
   - `### Current Focus`
   - `### Waiting`
   - `### Blockers`
   - `### Timeline`
   - `### References`
   - `### PM Metadata`
6. Keep detailed tasks as normal Markdown checkboxes inside the relevant living document or source note.
7. Add source notes under `### References` when you want `Action index` to collect checkboxes from them.
8. Rebuild old `depends_on` / `blocks` relationships as Board flow arrows or as `### Flow` links.

## v0.1 Field Mapping

| v0.1 concept | v0.2 destination |
| --- | --- |
| `group` | Project document or Project filter |
| `area`, `project_kind`, `workstream_type` | `Category` |
| `importance` | `priority` |
| `stage` | Usually `status`; otherwise body text under `### PM Metadata` |
| `next_action` | `### Current Focus` |
| `waiting_for` | `### Waiting` |
| `blocker` | `### Blockers` |
| `next_review`, `due_date` | `### Timeline` |
| `depends_on` | `### Flow` -> `Preceded by` |
| `blocks` | `### Flow` -> `Followed by` |
| `source_notes`, `legacy_links` | `### References` |

## Completion Statuses

KanbanRPM v0.2 does not require the status id to be exactly `done`. It treats status ids or labels containing `Done`, `Complete`, `Completed`, or `?꾨즺` as completion statuses. Flow arrows from completed predecessors are muted; arrows from unfinished predecessors are warning-colored.

If you remove or rename every completion status, KanbanRPM cannot know what "finished" means, so all flow arrows remain warning-colored.

## Timeline Memo Migration

External Daily-note planning is no longer the main workflow. For lightweight day notes, use the `Timeline` view:

- `+ todo` creates a checkbox memo for that date.
- `+ text` creates a text memo for that date.
- the pencil icon edits the date memo file.

Date memo files are created lazily under:

```text
KanbanRPM Workspace/timeline/YYYY-MM-DD.md
```

## Routine Migration

Old recurring notes should be rewritten in a living document's `### Routine` section:

```markdown
### Routine

- [ ] Weekly TTT Review @weekly @start 2026-05-13
- [ ] TEM Data Backup @every 2w @start 2026-05-13
```

Routine completion is logged to `### Routine Log` as a Markdown table. The routine checkbox itself is not permanently checked off.

## Manual QA After Migration

- Open `KanbanRPM: Open board`.
- Confirm Project documents appear in the `Project notes` strip, not in status lanes.
- Confirm Subproject and Big Action cards show the expected Project/Subproject breadcrumb.
- Drag a Big Action between statuses.
- Drag a card's right flow dot to another card's left connector area.
- Confirm the target card gains the source under `### Flow` -> `Preceded by`.
- Open `Timeline` and confirm due/review/small-action markers appear.
- Add a Timeline Memo and confirm `KanbanRPM Workspace/timeline/YYYY-MM-DD.md` is created only after saving.
