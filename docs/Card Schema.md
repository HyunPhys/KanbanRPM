# KanbanRPM Living Document Schema

KanbanRPM v0.2 treats every Project, Subproject, and Big Action as a living Markdown document. Frontmatter is intentionally short; project-management context belongs in readable document sections.

## Minimal Frontmatter

```yaml
kanban_rpm: true
type: project
id: example-workstream
status: active
parent:
order:
```

Allowed `type` values:

```text
project | subproject | big_action
```

`parent` links a Subproject or Big Action to an existing Project/Subproject. The create/edit modal provides a dropdown, so users do not need to type the parent manually.

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
> parent: Project Title

## PM Control

### Current Focus

### Waiting

### Blockers

### Dependencies

Depends on:

Blocks:

### Timeline

### Perpetual

### References

### PM Metadata

---

## Working Notes

### Project Brief

### Desired Outcomes

### Decisions
```

KanbanRPM reads these sections while keeping the document useful as a normal note:

- `### Current Focus`: the action shown on cards and used by Daily Pull.
- `### Waiting`: waiting context.
- `### Blockers`: concrete blockers.
- `### Dependencies`: `Depends on` and `Blocks` wikilinks.
- `### Perpetual`: recurring review/routine checkbox items.
- `### Timeline`: `Next review` and `Due date` rows.
- `### References`: source notes scanned by Action index.
- `### PM Metadata`: compact optional structured notes that are better in the body than in frontmatter.

`## PM Control` is the plugin-readable projection area. `## Working Notes` is the human writing area. Project, Subproject, and Big Action templates have different `Working Notes` sections.

## Dependencies

Preferred syntax:

```markdown
## Dependencies

Depends on:
- [[TTT Data Processing]]

Blocks:
- [[TTT Manuscript]]
```

## Perpetual

Preferred recurring routine syntax:

```markdown
## Perpetual

- [ ] Weekly TTT Review @weekly
- [ ] TEM Data Backup @monthly
```

## Checkbox Promotion

Detailed tasks stay as Markdown checkboxes by default. Use `Promote` in the Action index to create a new `big_action` document from an important checkbox/action. The source checkbox is not modified.

## Small Actions

Small actions are checkbox tasks inside Project/Subproject/Big Action documents. KanbanRPM reads a Tasks-compatible emoji subset:

```markdown
- [ ] Email vendor ⏳ 2026-05-10 📅 2026-05-15 🔼
- [x] Submit quote request ✅ 2026-05-07
```

Supported fields:

- scheduled date: `⏳ YYYY-MM-DD`
- due date: `📅 YYYY-MM-DD`
- done date: `✅ YYYY-MM-DD`
- priority: `⏫`, `🔼`, `🔽`, `⏬`

Small actions are displayed on board cards according to plugin settings. The default is to show due/scheduled actions through one week, including overdue actions. Expanded card rows group small actions by their source heading.

Checking a small action from a card updates the original Markdown line to `[x]` and appends today's done date. Unchecking it returns the task to `[ ]` and removes the done date.

## Validation

KanbanRPM warns about:

- unknown status values
- invalid priority values
- unknown `Category`
- non-numeric `order`
- broken dependency/source links
- circular dependencies

Invalid or unknown status values fall back to the first configured status for display.
