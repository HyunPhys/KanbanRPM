import { DEFAULT_STATUSES, WORKSTREAM_TYPES } from './constants';

export function getSchemaReferenceContent(): string {
  return `# KanbanRPM Card Schema

This note is a local reference for KanbanRPM card frontmatter. It is created by the plugin and can be regenerated manually from the plugin source/docs if needed.

## Required Identity

\`\`\`yaml
kanban_rpm: true
type: project
id: example-workstream
status: active
\`\`\`

New living documents keep frontmatter intentionally short. The plugin treats \`Title\`, \`Type\`, and \`Status\` as required in the create/edit modal. \`Parent\` is required for \`subproject\` and \`big_action\` documents.

## Execution Fields

\`\`\`yaml
status: inbox
parent:
order:
\`\`\`

Default \`status\` values:

\`\`\`text
${DEFAULT_STATUSES.map((status) => status.id).join(' | ')}
\`\`\`

The active status set is global and editable in KanbanRPM settings. Every Board/List/Table/Timeline/Graph surface should read the same status set.

\`order\` is managed by drag/reorder and \`Normalize order\`. It should be numeric.

Optional planning fields can stay in the document body under sections such as \`## Current Focus\`, \`## Dependencies\`, \`## Timeline\`, and \`## PM Metadata\`.

## Optional Compatibility Fields

\`\`\`yaml
group:
workstream_type:
legacy_links: []
related_samples: []
related_phenomena: []
related_people: []
related_notes: []
depends_on: []
blocks: []
source_notes: []
\`\`\`

KanbanRPM shows \`workstream_type\` as \`Category\` in the UI. It replaces the older overlapping \`area\`, \`project_kind\`, and \`workstream_type\` trio.

Suggested \`Category\` values:

\`\`\`text
${WORKSTREAM_TYPES.join(' | ')}
\`\`\`

## Lane Customization Decision

KanbanRPM uses a global customizable status set. The default is:

\`\`\`text
${DEFAULT_STATUSES.map((status) => status.label).join(' -> ')}
\`\`\`

Edit statuses from plugin settings using one line per status:

\`\`\`text
id | Label
\`\`\`

Changing the status set does not rewrite existing cards. Unknown status values are shown as data warnings and fall back to the first configured status for display.

## Validation

The board shows \`Data warnings\` for:

- invalid or missing \`status\`
- invalid \`priority\`
- malformed frontmatter dates on legacy cards
- unknown \`workstream_type\` / \`Category\`
- non-numeric \`order\`
- broken wikilinks in \`source_notes\`, \`legacy_links\`, or \`related_notes\`

KanbanRPM tries to display imperfect cards rather than hiding them. Invalid \`status\` falls back to \`Inbox\` for display.
`;
}
