# KanbanRPM Living Document Schema

KanbanRPM v0.2 treats every Project, Subproject, and Big Action as a living Markdown document. Frontmatter is intentionally short; project-management context should live in readable document sections.

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

`status` uses the global status set from KanbanRPM settings. The default status set is:

```text
Inbox -> Active -> Waiting -> Blocked -> Someday -> Done
```

`parent` links a Subproject or Big Action to its parent Project/Subproject. It can be a wikilink such as `[[TTT]]` or a plain title.

`order` is managed by KanbanRPM ordering tools.

In the create/edit modal, required fields are marked with a red `*`: `Title`, `Status`, `Type`, and conditionally `Parent` for Subproject/Big Action documents.

Terminology:

- `Project` is the top-level living document.
- `Subproject` is a workstream under a Project.
- `Big Action` is a trackable chunk of work under a Project/Subproject.
- `Checkbox task` remains inside source notes.
- `group` is legacy compatibility metadata and appears in the UI as `Legacy group`.

KanbanRPM computes a display breadcrumb from `parent` relationships:

```text
Project > Subproject
```

This breadcrumb appears on cards and rows so items remain visually attached to their project context.

## Living Document Sections

New documents use this body shape:

```markdown
# Project Title

> [!kanban-rpm]
> type: Project
> status: active
> project: Project Title

## Current Focus

## Subprojects

## Big Actions

## Dependencies

Depends on:

Blocks:

## Perpetual

## PM Metadata

## Notes

## Decisions

## Timeline

## References
```

KanbanRPM reads these sections for Board/Table/List/Timeline/Graph behavior, while keeping the document readable as a normal note.

## Legacy Metadata

v0.1 cards may still contain frontmatter fields such as:

```yaml
priority:
area:
group:
workstream_type:
project_kind:
stage:
next_action:
waiting_for:
blocker:
next_review:
due_date:
importance:
legacy_links:
related_samples:
related_phenomena:
related_people:
related_notes:
depends_on:
blocks:
source_notes:
rpm_order:
```

KanbanRPM continues to read these fields for compatibility. Legacy `rpm_order` is treated as `order` when loading older cards. Use `KanbanRPM: Compact card metadata` or the card `Compact` action to remove empty legacy fields and move non-empty metadata into `## PM Metadata`.

## Dependencies

Preferred v0.2 dependency syntax:

```markdown
## Dependencies

Depends on:
- [[TTT Data Processing]]

Blocks:
- [[TTT Manuscript]]
```

KanbanRPM also reads legacy `depends_on` and `blocks` frontmatter fields.

## Perpetual

Preferred recurring routine syntax:

```markdown
## Perpetual

- [ ] Weekly TTT Review @weekly
- [ ] TEM Data Backup @monthly
```

KanbanRPM v0.2 displays recurring items in Action index and Timeline-oriented views. It does not automatically generate recurring task copies yet.

## Checkbox Promotion

Detailed tasks stay as Markdown checkboxes by default. Use `Promote` in the Action index to create a new `big_action` document from an important checkbox/action. The source checkbox is not modified.

## Validation

KanbanRPM warns about:

- unknown status values
- malformed dates in legacy fields
- broken dependency/source links
- circular dependencies
- non-numeric `order` / `rpm_order`

Invalid or unknown status values fall back to the first configured status for display.
