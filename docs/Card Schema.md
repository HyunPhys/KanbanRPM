# KanbanRPM Card Schema

KanbanRPM cards are Markdown files in `KanbanRPM Workspace/cards/`. Each card is a workstream, not a single task.

## Required Identity

```yaml
kanban_rpm: true
type: project
title: Example Workstream
```

## Execution Fields

```yaml
status: inbox
priority: 3
next_action:
waiting_for:
blocker:
next_review:
due_date:
rpm_order:
```

Allowed `status` values:

```text
inbox | active | waiting | blocked | someday | done
```

`priority` should be an integer from `1` to `5`, where `1` is highest.

Dates should use `YYYY-MM-DD`.

`rpm_order` is managed by drag/drop and `Normalize order`.

## Flexible Architecture Fields

```yaml
area:
group:
workstream_type:
project_kind:
stage:
importance: normal
legacy_links: []
related_samples: []
related_phenomena: []
related_people: []
related_notes: []
depends_on: []
blocks: []
source_notes: []
```

Suggested `workstream_type` values:

```text
research | experiment | analysis | writing | setup | purchase | admin | communication
```

Suggested `project_kind` values:

```text
research | lab_setup | equipment | teaching | admin
```

Suggested `importance` values:

```text
normal | planned | future | urgent | purchase | article
```

## Lane Customization Decision

KanbanRPM currently keeps lanes fixed:

```text
Inbox -> Active -> Waiting -> Blocked -> Someday -> Done
```

This is intentional for the current data-model phase. Fixed lanes keep `status`, validation, Daily review, and Command center behavior predictable. Custom lanes should be reconsidered after more real-vault QA.

## Validation

The board shows `Data warnings` for:

- invalid or missing `status`
- invalid `priority`
- malformed `next_review` or `due_date`
- unknown `workstream_type`, `project_kind`, or `importance`
- non-numeric `rpm_order`
- broken wikilinks in `source_notes`, `legacy_links`, or `related_notes`

KanbanRPM tries to display imperfect cards rather than hiding them. Invalid `status` falls back to `Inbox` for display.
