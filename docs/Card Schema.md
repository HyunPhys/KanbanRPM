# KanbanRPM Living Document Schema

KanbanRPM v0.2 treats every Project, Subproject, and Big Action as a living Markdown document. Frontmatter is intentionally short; project-management context belongs in readable document sections.

## Minimal Frontmatter

```yaml
kanban_rpm: true
type: big_action
id: example-workstream
status: active
project_state: active
primary_project: "[[TTT]]"
primary_subproject: "[[TTT Experiment]]"
order:
```

Allowed `type` values:

```text
project | subproject | big_action
```

`primary_project` links a Subproject or Big Action to its Project. `primary_subproject` links a Big Action to its Subproject. The create/edit modal provides dropdowns, so users do not need to type these links manually.

KanbanRPM stores hierarchy explicitly. Current levels are `project` and `subproject`; future levels such as `pro_project` or `sub_subproject` should be added as explicit level fields instead of overloading one generic parent field.

`status` uses the global status set from KanbanRPM settings. The default is:

```text
Inbox -> Active -> Waiting -> Blocked -> Someday -> Done
```

`order` is managed by drag/reorder and `Normalize order`.

`project_state` is a Project lifecycle field. It is mainly used on Project documents:

```text
active | closed
```

Closed Projects and cards that only belong to closed Projects are hidden from default KanbanRPM views. Use `Show closed projects` to inspect or reopen them. Closing a Project does not change child card statuses.

## Optional Frontmatter

```yaml
priority: 3
workstream_type: experiment
```

KanbanRPM shows `workstream_type` as `Category`. It is the single broad classification field. The stored value is the Category id; the UI displays the Category label.

Default `Category` values:

```text
research | Research
experiment | Experiment
analysis | Analysis
writing | Writing
setup | Setup
purchase | Purchase
admin | Admin
communication | Communication
```

The active Category set is editable in plugin settings using `id | Label` lines. It is used by create/edit dropdowns, filters, card display, and validation.

## Living Document Sections

New documents use this body shape:

```markdown
> [!kanban-rpm]
> type: Project
> status: active
> project: [[TTT]]
> subproject: [[TTT Experiment]]

# PM Control

## Current Focus

## Waiting

## Blockers

## Flow

Preceded by:

Followed by:

## Timeline

## Timeline Log

## Routine

## References

## PM Metadata

---

# Working Notes

## Overview
%% Write what this note is responsible for and what success roughly means. %%

## Current Thinking
%% Capture the current interpretation, open questions, assumptions, or strategy. %%

## Work Log
%% Add dated progress notes, meeting outcomes, attempts, observations, and follow-up context. %%

## Decisions
%% Record decisions with enough context to understand why they were made. %%

## Notes
%% Put miscellaneous context, links, rough ideas, and material that does not yet fit elsewhere. %%
```

Big Action documents also include:

```markdown
## Small Actions
%% Keep concrete checkbox tasks here; dated tasks can appear in Timeline. %%
```

KanbanRPM reads these sections while keeping the document useful as a normal note:

- `## Current Focus`: the action shown on cards and used for planning/review surfaces.
- `## Waiting`: waiting context.
- `## Blockers`: concrete blockers.
- `## Flow`: `Preceded by` and `Followed by` wikilinks.
- `## Routine`: recurring review/routine checkbox items.
- `## Timeline`: `Start date`, `Scheduled date`, `Next review`, and `Due date` rows.
- Research logs are stored in `KanbanRPM Workspace/Research Logs.md`, not inside Project/Subproject/Big Action documents.
- `## References`: source notes scanned by Action index.
- `## PM Metadata`: compact optional structured notes that are better in the body than in frontmatter.

`# PM Control` is the plugin-readable projection area. `# Working Notes` is the human writing area. The Obsidian note title/file name is the card title, so new documents do not include a duplicate body H1. Project, Subproject, and Big Action templates share the same Research PM heading spine; only Big Action includes `## Small Actions` by default. `%% ... %%` comments are authoring guides that Obsidian hides in preview.

## Flow

Preferred syntax:

```markdown
## Flow

Preceded by:
- [[TTT Data Processing]]

Followed by:
- [[TTT Manuscript]]
```

Board arrows are stored by adding the predecessor link to the follower document's `Preceded by` list.

Arrow state is based on the predecessor card's completion status. KanbanRPM treats status ids or labels containing `Done`, `Complete`, `Completed`, or `?꾨즺` as completion statuses. If a custom status set has no completion status, flow arrows remain in the warning state.

## Routine

Preferred recurring routine syntax:

```markdown
## Routine

- [ ] Weekly TTT Review @weekly
- [ ] TEM Data Backup @monthly
```

KanbanRPM uses `Routine` as the user-facing name. New documents should use `### Routine` and `### Routine Log`.

## Next Review

`Next review` is the reminder layer. On board open or refresh, if `Next review` is today or overdue, KanbanRPM moves non-complete cards to the configured `Next review reminder status` and writes a `### Timeline Log` entry.

`Scheduled date` is the execution date for showing a card on the Timeline. `Due date` remains the deadline/end-date layer and is not used as the primary card marker on Timeline.

## Experiment And Analysis Logs

Logs stay readable Markdown tables in `KanbanRPM Workspace/Research Logs.md`. KanbanRPM parses that global log document for the Research index.

```markdown
### Experiment Log

#### Stacking

| Date | Sample | Conditions | Result | Link |
| --- | --- | --- | --- | --- |
| 2026-05-14 | [[TTT Sample 8]] | PC, 8 wt%, 100C 7m | partial success | [[2026-05-14 Stacking - TTT Sample 8]] |

### Analysis Log

#### DF analysis

| Date | Dataset / Sample | Method | Result | Link |
| --- | --- | --- | --- | --- |
```

Category-based log prompts are controlled in plugin settings. By default, `experiment` triggers an Experiment Log prompt and `analysis` triggers an Analysis Log prompt when a matching Big Action moves to a completion status.

## Checkbox Promotion

Detailed tasks stay as Markdown checkboxes by default. Use `Promote` in the Action index to create a new `big_action` document from an important checkbox/action. The source checkbox is not modified.

## Small Actions

Small actions are checkbox tasks inside Project/Subproject/Big Action documents. KanbanRPM reads ASCII metadata and also tolerates the common Tasks emoji date subset:

```markdown
- [ ] Email vendor @scheduled 2026-05-10 @due 2026-05-15 @priority high
- [x] Submit quote request ✅ 2026-05-07
```

Supported fields:

- scheduled date: `@scheduled YYYY-MM-DD`
- due date: `@due YYYY-MM-DD`
- done date: `✅ YYYY-MM-DD` or `@done YYYY-MM-DD`
- priority: `@priority highest|high|normal|low|lowest`

Small actions are displayed on board cards according to plugin settings. The default is to show due/scheduled actions through one week, including overdue actions. Expanded card rows group small actions by their source heading.

Checking a small action from a card updates the original Markdown line to `[x]` and appends today's `✅ YYYY-MM-DD`. Unchecking it returns the task to `[ ]` and removes the done date.

## Validation

KanbanRPM warns about:

- unknown status values
- invalid priority values
- unknown `Category`
- non-numeric `order`
- broken flow/source links
- circular flow

Invalid or unknown status values fall back to the first configured status for display.

