# KanbanRPM Living Document Schema

KanbanRPM v0.2 treats every Project, Subproject, and Big Action as a living Markdown document. Frontmatter is intentionally short; project-management context belongs in readable document sections.

## Minimal Frontmatter

```yaml
kanban_rpm: true
type: big_action
id: example-workstream
status: active
project: "[[TTT]]"
subproject: "[[TTT Experiment]]"
order:
```

Allowed `type` values:

```text
project | subproject | big_action
```

`project` links a Subproject or Big Action to its Project. `subproject` links a Big Action to its Subproject. The create/edit modal provides dropdowns, so users do not need to type these links manually.

KanbanRPM stores hierarchy explicitly. Current levels are `project` and `subproject`; future levels such as `pro_project` or `sub_subproject` should be added as explicit level fields instead of overloading one generic parent field.

`status` uses the global status set from KanbanRPM settings. The default is:

```text
Inbox -> Active -> Waiting -> Blocked -> Someday -> Done
```

`order` is managed by drag/reorder and `Normalize order`.

## Optional Frontmatter

```yaml
priority: 3
workstream_type: experiment
```

KanbanRPM shows `workstream_type` as `Category`. It is the single broad classification field.

Default `Category` values:

```text
research | experiment | analysis | writing | setup | purchase | admin | communication
```

The active Category set is editable in plugin settings and is used by create/edit dropdowns, filters, card display, and validation.

## Living Document Sections

New documents use this body shape:

```markdown
# Project Title

> [!kanban-rpm]
> type: Project
> status: active
> project: [[TTT]]
> subproject: [[TTT Experiment]]

## PM Control

### Current Focus

### Waiting

### Blockers

### Flow

Preceded by:

Followed by:

### Timeline

### Routine

### References

### PM Metadata

---

## Working Notes

### Project Brief

### Desired Outcomes

### Decisions
```

KanbanRPM reads these sections while keeping the document useful as a normal note:

- `### Current Focus`: the action shown on cards and used for planning/review surfaces.
- `### Waiting`: waiting context.
- `### Blockers`: concrete blockers.
- `### Flow`: `Preceded by` and `Followed by` wikilinks.
- `### Routine`: recurring review/routine checkbox items.
- `### Timeline`: `Next review` and `Due date` rows.
- `### References`: source notes scanned by Action index.
- `### PM Metadata`: compact optional structured notes that are better in the body than in frontmatter.

`## PM Control` is the plugin-readable projection area. `## Working Notes` is the human writing area. Project, Subproject, and Big Action templates have different `Working Notes` sections.

## Flow

Preferred syntax:

```markdown
## Flow

Preceded by:
- [[TTT Data Processing]]

Followed by:
- [[TTT Manuscript]]
```

Legacy `## Dependencies` sections with `Depends on` and `Blocks` are still read for compatibility, but new documents should use `## Flow`. Board arrows are stored by adding the predecessor link to the follower document's `Preceded by` list.

Arrow state is based on the predecessor card's completion status. KanbanRPM treats status ids or labels containing `Done`, `Complete`, `Completed`, or `?꾨즺` as completion statuses. If a custom status set has no completion status, flow arrows remain in the warning state.

## Routine

Preferred recurring routine syntax:

```markdown
## Routine

- [ ] Weekly TTT Review @weekly
- [ ] TEM Data Backup @monthly
```

KanbanRPM v0.2.0 and later use `Routine` as the user-facing name. Older `## Perpetual` and `## Perpetual Log` sections are still read as legacy aliases, but new documents should use `## Routine` and `## Routine Log`.

## Checkbox Promotion

Detailed tasks stay as Markdown checkboxes by default. Use `Promote` in the Action index to create a new `big_action` document from an important checkbox/action. The source checkbox is not modified.

## Small Actions

Small actions are checkbox tasks inside Project/Subproject/Big Action documents. KanbanRPM reads a Tasks-compatible emoji subset:

```markdown
- [ ] Email vendor ??2026-05-10 ?뱟 2026-05-15 ?뵾
- [x] Submit quote request ??2026-05-07
```

Supported fields:

- scheduled date: `??YYYY-MM-DD`
- due date: `?뱟 YYYY-MM-DD`
- done date: `??YYYY-MM-DD`
- priority: `??, `?뵾`, `?뵿`, `??

Small actions are displayed on board cards according to plugin settings. The default is to show due/scheduled actions through one week, including overdue actions. Expanded card rows group small actions by their source heading.

Checking a small action from a card updates the original Markdown line to `[x]` and appends today's done date. Unchecking it returns the task to `[ ]` and removes the done date.

## Validation

KanbanRPM warns about:

- unknown status values
- invalid priority values
- unknown `Category`
- non-numeric `order`
- broken flow/source links
- circular flow

Invalid or unknown status values fall back to the first configured status for display.
