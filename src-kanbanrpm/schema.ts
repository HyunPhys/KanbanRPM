import { IMPORTANCE_VALUES, LANES, PROJECT_KINDS, WORKSTREAM_TYPES } from './constants';

export function getSchemaReferenceContent(): string {
  return `# KanbanRPM Card Schema

This note is a local reference for KanbanRPM card frontmatter. It is created by the plugin and can be regenerated manually from the plugin source/docs if needed.

## Required Identity

\`\`\`yaml
kanban_rpm: true
type: project
title: Example Workstream
\`\`\`

## Execution Fields

\`\`\`yaml
status: inbox
priority: 3
next_action:
waiting_for:
blocker:
next_review:
due_date:
rpm_order:
\`\`\`

Allowed \`status\` values:

\`\`\`text
${LANES.map((lane) => lane.id).join(' | ')}
\`\`\`

\`priority\` should be an integer from \`1\` to \`5\`, where \`1\` is highest.

Dates should use \`YYYY-MM-DD\`.

\`rpm_order\` is managed by drag/drop and \`Normalize order\`. It should be numeric.

## Flexible Architecture Fields

\`\`\`yaml
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
\`\`\`

Suggested \`workstream_type\` values:

\`\`\`text
${WORKSTREAM_TYPES.join(' | ')}
\`\`\`

Suggested \`project_kind\` values:

\`\`\`text
${PROJECT_KINDS.join(' | ')}
\`\`\`

Suggested \`importance\` values:

\`\`\`text
${IMPORTANCE_VALUES.join(' | ')}
\`\`\`

## Lane Customization Decision

KanbanRPM currently keeps lanes fixed:

\`\`\`text
${LANES.map((lane) => lane.label).join(' -> ')}
\`\`\`

This is intentional for the current data-model phase. Fixed lanes keep \`status\`, validation, Daily review, and Command center behavior predictable. Custom lanes should be reconsidered after more real-vault QA.

## Validation

The board shows \`Data warnings\` for:

- invalid or missing \`status\`
- invalid \`priority\`
- malformed \`next_review\` or \`due_date\`
- unknown \`workstream_type\`, \`project_kind\`, or \`importance\`
- non-numeric \`rpm_order\`
- broken wikilinks in \`source_notes\`, \`legacy_links\`, or \`related_notes\`

KanbanRPM tries to display imperfect cards rather than hiding them. Invalid \`status\` falls back to \`Inbox\` for display.
`;
}
