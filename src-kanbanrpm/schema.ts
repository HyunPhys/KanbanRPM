import { DEFAULT_STATUSES, WORKSTREAM_TYPES } from './constants';

export function getSchemaReferenceContent(): string {
  return `# KanbanRPM Card Schema

This note is a local reference for KanbanRPM card frontmatter. It is created by the plugin and can be regenerated manually from the plugin source/docs if needed.

## Required Identity

\`\`\`yaml
kanban_rpm: true
type: big_action
id: example-workstream
status: active
project_state: active
primary_project: "[[TTT]]"
primary_subproject: "[[TTT Experiment]]"
projects:
  - "[[TTT]]"
subprojects:
  - "[[TTT Experiment]]"
\`\`\`

New living documents keep frontmatter intentionally short. The plugin treats \`Title\`, \`Type\`, and \`Status\` as required in the create/edit modal. \`Project\` is required for Subproject and Big Action documents. \`Subproject\` is also required for Big Action documents.

## Execution Fields

\`\`\`yaml
status: inbox
project_state: active
primary_project:
primary_subproject:
projects: []
subprojects: []
order:
\`\`\`

Default \`status\` values:

\`\`\`text
${DEFAULT_STATUSES.map((status) => status.id).join(' | ')}
\`\`\`

The active status set is global and editable in KanbanRPM settings. Every Board/Table/Timeline/Gantt surface should read the same status set.

\`project_state\` is mainly used on Project documents. \`active\` is the default. \`closed\` hides the Project and cards that only belong to that closed Project from default KanbanRPM views. Use \`Show closed projects\` to inspect or reopen them. Closing a Project does not change child card statuses.

\`order\` is managed by drag/reorder and \`Normalize order\`. It should be numeric.

\`projects\` and \`subprojects\` are multi-link hierarchy arrays. \`primary_project\` and \`primary_subproject\` define the default breadcrumb and future hierarchy folder placement. Legacy \`project\` and \`subproject\` fields are read as fallback only.

Optional planning fields stay in the document body under \`## PM Control\` subsections such as \`### Current Focus\`, \`### Flow\`, \`### Timeline\`, and \`### PM Metadata\`.

## Body-Backed Planning Fields

\`\`\`yaml
workstream_type:
\`\`\`

KanbanRPM shows \`workstream_type\` as \`Category\` in the UI. Use it as the single broad project/workstream classification field. The stored value is the Category id; the displayed text is the Category label. The active Category set is editable in plugin settings with one \`id | Label\` definition per line.

Rich planning data belongs in the document body:

- \`### Current Focus\` for the next visible action.
- \`### Waiting\` for people or responses you are waiting on.
- \`### Blockers\` for concrete blockers.
- \`### Flow\` for \`Preceded by\` and \`Followed by\` wikilinks.
- \`### Timeline\` for \`Next review\` and \`Due date\`.
- \`### Routine\` for recurring review/checkup routines.
- \`### References\` for source notes that feed the Action index.

\`## PM Control\` is the plugin-readable area. \`## Working Notes\` is the human writing area. New Project/Subproject/Big Action documents use different working-note sections.

## Small Actions

Small actions are checkbox tasks inside the living document. KanbanRPM reads a Tasks-compatible emoji subset:

\`\`\`markdown
- [ ] Email vendor ⏳ 2026-05-10 📅 2026-05-15 🔼
- [x] Submit quote request ✅ 2026-05-07
\`\`\`

Supported metadata:

- scheduled date: \`⏳ YYYY-MM-DD\`
- due date: \`📅 YYYY-MM-DD\`
- done date: \`✅ YYYY-MM-DD\`
- priority: \`⏫\`, \`🔼\`, \`🔽\`, \`⏬\`

Small-action card display is controlled from plugin settings. The default is due/scheduled actions through one week, including overdue actions. Expanded card rows group small actions by their source heading.

Checking a small action from a card updates the original Markdown line to \`[x]\` and appends today's done date. Unchecking returns it to \`[ ]\` and removes the done date.

Default \`Category\` values:

\`\`\`text
${WORKSTREAM_TYPES.map((category) => `${category.id} | ${category.label}`).join('\n')}
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

Edit categories from plugin settings using the same format:

\`\`\`text
id | Label
\`\`\`

Changing the status set does not rewrite existing cards. Unknown status values are shown as data warnings and fall back to the first configured status for display.

## Validation

The board shows \`Data warnings\` for:

- invalid or missing \`status\`
- invalid \`priority\`
- unknown \`workstream_type\` / \`Category\`
- non-numeric \`order\`
- broken wikilinks in \`## References\` or \`## Flow\`

KanbanRPM tries to display imperfect cards rather than hiding them. Invalid \`status\` falls back to \`Inbox\` for display.
`;
}
