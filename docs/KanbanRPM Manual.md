# KanbanRPM Manual

This manual explains how to start using KanbanRPM in an Obsidian vault.

KanbanRPM is a research project manager built around workstream cards. A card should represent something you actually manage over time, such as `TTT Experiment`, `TTT Analysis`, `Glove Box Setup`, `Furnace Purchase`, or `Teaching Admin`, rather than a tiny one-off task.

## 1. Enable the Plugin

1. Open Obsidian `Settings`.
2. Go to `Community plugins`.
3. Find and enable `KanbanRPM`.
4. Open the command palette and run `KanbanRPM: Open board`.

You can also use the KanbanRPM ribbon icon in the left sidebar.

## 2. Workspace Folders

KanbanRPM stores its project data as Markdown files in your vault.

Default workspace:

```text
KanbanRPM Workspace/
```

Main folders:

```text
KanbanRPM Workspace/cards/
KanbanRPM Workspace/groups/
KanbanRPM Workspace/arrows/
KanbanRPM Workspace/perpetual/
KanbanRPM Workspace/attachments/
KanbanRPM Workspace/archive/
```

Active workstream cards live in `cards/`. Archived cards move to `archive/`. Group notes live in `groups/`. `arrows/`, `perpetual/`, and `attachments/` are Laminar-style folders reserved for dependency, routine, and supporting-file workflows.

## 3. Board Lanes

The board uses these lanes:

```text
Inbox -> Active -> Waiting -> Blocked -> Someday -> Done
```

Use them like this:

- `Inbox`: captured but not clarified yet.
- `Active`: currently moving forward.
- `Waiting`: waiting on a person, response, delivery, approval, or external dependency.
- `Blocked`: stopped by a concrete blocker.
- `Someday`: real, but intentionally parked.
- `Done`: completed or closed.

The lane is stored in each card file:

```yaml
status: active
```

`status` is the execution state. `stage` is the procedural position, such as `quotation`, `drawing`, `purchase`, `installation`, or `writing`.

## 4. Create a Card

1. Open the KanbanRPM board.
2. Click `New card`.
3. Fill in at least `Title`.
4. Choose `Status` and `Priority`.
5. Optionally add `Group`, `Workstream type`, `Project kind`, `Stage`, and `Next action`.
6. Click `Create card`.

KanbanRPM creates a Markdown file in:

```text
KanbanRPM Workspace/cards/
```

The card body starts with:

```markdown
## Active Actions

## Waiting

## Decision Log

## Timeline

## References
```

You can also use a lane's `+` button to create a card directly in that lane.

## 5. Flexible Card Schema

Cards use this frontmatter shape:

```yaml
kanban_rpm: true
type: project
status: inbox
priority: 3
area:
group:
workstream_type:
project_kind:
stage:
title:
next_action:
waiting_for:
blocker:
next_review:
due_date:
importance: normal
rpm_order:
legacy_links: []
related_samples: []
related_phenomena: []
related_people: []
related_notes: []
depends_on: []
blocks: []
source_notes: []
```

Main fields:

- `group`: larger project or operating area, such as `TTT` or `Lab Setup`.
- `workstream_type`: `research`, `experiment`, `analysis`, `writing`, `setup`, `purchase`, `admin`, or `communication`.
- `project_kind`: `research`, `lab_setup`, `equipment`, `teaching`, or `admin`.
- `stage`: procedural stage inside the workstream.
- `next_action`: the next concrete action.
- `waiting_for`: who or what you are waiting on.
- `blocker`: the obstacle stopping progress.
- `related_samples`: sample/specimen notes related to the card.
- `related_phenomena`: phenomenon or analysis threads.
- `related_people`: vendors, collaborators, professors, admins, or students.
- `related_notes`: other notes connected to the card.
- `depends_on`: dependency items that should happen first.
- `blocks`: downstream items blocked by this card.
- `source_notes`: notes KanbanRPM scans for unchecked checkbox actions and `#todo` lines.

## 6. Groups

Use `Group` for a large project or operating area, such as `TTT`, `Lab Setup`, or `Teaching`.

Run `KanbanRPM: New group note` or click `New group` on the board. KanbanRPM creates a group note in:

```text
KanbanRPM Workspace/groups/
```

Cards are connected to a group by their `group` field.

## 7. Board Filters

Use `Search cards` to search visible card text and metadata.

Use the filter bar to narrow the board by:

- `Group`
- `Project kind`
- `Workstream type`

Click `Clear filters` to reset the structured filters. Click `Clear` to reset search.

## 8. Import Legacy Project Notes

Run `KanbanRPM: Import legacy project notes` or click `Import legacy` on the board toolbar.

KanbanRPM scans existing Markdown notes for likely project notes. Current candidate signals include:

- a `?뮳` path or title
- `type: project`
- `category: project`
- `project` or `project/...` tags
- project-like file or folder names

The import modal is preview-only. It shows candidates, why each note was detected, whether it was already seeded, and which card already uses it.

Select the notes you want and click `Seed selected cards`. KanbanRPM creates new files in:

```text
KanbanRPM Workspace/cards/
```

Each seeded card gets the detected title, normalized `status`, `priority`, basic group metadata when available, and a `legacy_links` entry pointing back to the original note. The original legacy note is never edited.

Duplicate prevention is based on existing card `legacy_links`. Running the import again marks already seeded notes and leaves them unchecked.

## 9. Data Warnings

If KanbanRPM finds card metadata that should be fixed, it shows a `Data warnings` panel above the board.

Current checks:

- invalid or missing `status`
- `priority` outside `1` to `5`
- `next_review` or `due_date` not using `YYYY-MM-DD`
- unknown `workstream_type` or `project_kind`
- broken wikilinks in `source_notes`, `legacy_links`, or `related_notes`

Click a warning row to open the affected card. KanbanRPM still tries to show imperfect cards instead of hiding them.

Run `KanbanRPM: Open schema reference` to create or open this vault-local note:

```text
KanbanRPM Workspace/KanbanRPM Card Schema.md
```

The project source also keeps the developer-facing schema document at `docs/Card Schema.md`.

## 10. Action Index

Above the board, KanbanRPM also shows a `Command center` panel with four compact queues:

- `Review queue`: cards with overdue or upcoming `next_review` / `due_date`.
- `Waiting`: cards in `Waiting` or cards with `waiting_for`.
- `Blocked`: cards in `Blocked` or cards with `blocker`.
- `Dependencies`: cards with `depends_on` or `blocks`.

Click a row in `Command center` to open that card.

Use `Collapse` / `Expand` to hide or show the panel. Use `Daily review` to send review queue cards with `next_action` values to today's existing Daily note in one batch.

Use `Pull Daily` on the board toolbar, or run `KanbanRPM: Pull cards to Daily`, to choose a Daily batch manually. The modal supports `Review due`, `Active`, `Waiting`, `Blocked`, and `All visible` modes. Only cards with `next_action` can be selected for Daily. Duplicate lines are skipped.

The `Action index` collects unchecked checkbox actions and `#todo` lines from each visible card's `source_notes`, `legacy_links`, and `related_notes`.

Example source note:

```markdown
- [ ] Ask vendor for updated glove box quotation #todo
```

KanbanRPM displays that action under `Action index`, grouped by card, with its source note and line number. It does not modify the original note.

Available action controls:

- Click an action row or `Open source` to open the source note.
- Click `Set next` to copy that action into the card's `next_action`.

This lets meeting notes and communication notes remain as the original record while the card keeps the current next action.

Use `Collapse` / `Expand` to hide or show the `Action index`.

## 11. Edit, Move, and Sort Cards

Click `Edit` to update card metadata. Click `Open` to edit the Markdown body.

Drag a card to another lane to update `status`.

You can also use the inline `Active`, `Waiting`, `Blocked`, and `Done` buttons on a card to change `status` without dragging.

Drag a card within the same lane to set manual order:

```yaml
rpm_order:
```

Click `Normalize order` in the board toolbar, or run `KanbanRPM: Normalize card order`, to rewrite each lane's `rpm_order` values as `1000`, `2000`, `3000`, and so on. This keeps manual ordering stable after many drag/drop operations.

Sorting behavior:

1. Cards with `rpm_order` follow manual order.
2. Cards without manual order are sorted by `priority`.
3. Then by `due_date` or `next_review`.
4. Then by `title`.

Cards also show compact dependency/context rows when available:

- `Depends`: upstream dependency items from `depends_on`.
- `Blocks`: downstream items from `blocks`.
- `Sources`: linked source notes from `source_notes`.

Wikilinks in these relation rows can be clicked to open the linked note.

Click `Write arrows` in the board toolbar, or run `KanbanRPM: Write dependency arrows`, to export `depends_on` and `blocks` metadata into Laminar-style arrow notes under:

```text
KanbanRPM Workspace/arrows/
```

This does not change the card metadata. It creates missing arrow notes and skips ones that already exist.

## 12. Duplicate, Archive, or Delete

Use `Duplicate` to copy a card into `cards/` with `Copy` added to the title. The duplicate keeps the same `Status` and `Priority`, but does not keep manual `rpm_order`.

Use `Archive` to move a card to:

```text
KanbanRPM Workspace/archive/
```

Use `Delete` only when the card is no longer needed. KanbanRPM asks for confirmation and moves the file to the system trash.

## 13. Send to Daily

Click `Send to Daily` on a card.

KanbanRPM appends this line to today's existing Daily note:

```markdown
- [ ] [[Card Title]]: next_action
```

Default Daily folder:

```text
100. 媛쒖씤/110. ?ㅼ씠?대━/111. Daily/
```

Expected filename format:

```text
YYYY-MM-DD (?붿씪).md
```

Example:

```text
2026-05-06 (??.md
```

KanbanRPM does not create a Daily note. If today's Daily note does not exist, it shows a notice with the expected path. Duplicate lines are blocked.

If `Daily section` is set in settings, KanbanRPM inserts actions under that heading. If the heading does not exist, KanbanRPM adds it to the Daily note. Leave `Daily section` blank to append at the end of the file.

## 14. Weekly Review

Click `Weekly review` on the board toolbar or run `KanbanRPM: Open weekly review`.

KanbanRPM creates or opens this week's review note in:

```text
KanbanRPM Workspace/perpetual/
```

The note is named like:

```text
YYYY-Www Weekly Review.md
```

The generated note includes `Review Queue`, `Active`, `Waiting`, `Blocked`, `Decisions`, and `Next Week Focus`. Weekly review notes are KanbanRPM-owned routine notes, so KanbanRPM creates them when missing. This differs from Daily notes, which must already exist.

## 15. Example Structures

TTT research group:

```text
Group: TTT
Cards:
- TTT Background Research
- TTT Experiment
- TTT Data Processing
- TTT Analysis
- TTT Discussion / Writing
- TTT Manuscript
```

Lab setup group:

```text
Group: Lab Setup
Cards:
- Glove Box Setup
- Furnace Setup
- Probe Station Setup
- Gas Line Installation
- Safety Review
```

For sample-driven work, keep samples in `related_samples`. For phenomenon-driven analysis, keep threads in `related_phenomena`. For meeting or communication-derived tasks, link the meeting/communication note in `source_notes`.

## 16. Settings

Open Obsidian `Settings` and find `KanbanRPM`.

Available settings:

- `Workspace folder`: where KanbanRPM card and support files are stored.
- `Daily folder`: where `Send to Daily` looks for today's Daily note.
- `Daily section`: heading where Daily actions are inserted.
- `Weekly review folder`: where weekly review notes are created.

Changing the workspace folder does not move existing cards.

## 17. Troubleshooting

If the board is empty:

- Confirm cards are inside `KanbanRPM Workspace/cards/`.
- Confirm each card has `kanban_rpm: true`.
- Confirm `Search cards` and filters are clear.
- Confirm the card was not archived.

If `Import legacy` misses a note:

- Add a `project` tag, `type: project`, or put the note in a project-like path.
- Confirm the note is not already inside the KanbanRPM workspace or source project.
- Click `Rescan` in the import modal.

If `Data warnings` appears:

- Open the affected card from the warning row.
- Fix frontmatter values such as `status`, `priority`, `next_review`, `due_date`, or broken wikilinks.
- Click `Refresh` on the board.

If the `Action index` is empty:

- Confirm the card has `source_notes`, `legacy_links`, or `related_notes`.
- Confirm the linked notes resolve as Obsidian wikilinks.
- Confirm the source note has unchecked checkbox lines or `#todo`.

If `Send to Daily` does nothing:

- Confirm today's Daily note exists.
- Confirm the `Daily folder` setting matches your vault.
- Confirm the exact line is not already present.
- Confirm the card has `next_action`.

If `Weekly review` creates the note in the wrong place, check `Weekly review folder` in settings.

## 18. Developer Note

Whenever KanbanRPM behavior changes, update this manual and `docs/KanbanRPM Manual ko.md` in the same change.

