import type { KanbanRPMSettings, Lane, StatusDefinition } from './types';

export const VIEW_TYPE = 'kanban-rpm-board';

export const DEFAULT_STATUSES: StatusDefinition[] = [
  { id: 'inbox', label: 'Inbox' },
  { id: 'active', label: 'Active' },
  { id: 'waiting', label: 'Waiting' },
  { id: 'blocked', label: 'Blocked' },
  { id: 'someday', label: 'Someday' },
  { id: 'done', label: 'Done' },
];

export const DEFAULT_SETTINGS: KanbanRPMSettings = {
  workspaceFolder: 'KanbanRPM Workspace',
  dailyFolder: '100. \uAC1C\uC778/110. \uB2E4\uC774\uC5B4\uB9AC/111. Daily',
  dailySection: 'KanbanRPM',
  weeklyReviewFolder: 'KanbanRPM Workspace/perpetual',
  statuses: DEFAULT_STATUSES,
  cardDisplayFields: {
    breadcrumb: true,
    type: true,
    status: true,
    priority: true,
    category: true,
    currentFocus: true,
    waiting: true,
    blockers: true,
    dates: true,
    dependencies: true,
    sources: true,
    smallActionSummary: true,
  },
  smallActionDisplay: {
    collapsedByDefault: true,
    sourceFilter: 'dated',
    dateWindow: 'week',
  },
};

export const LANES: Lane[] = DEFAULT_STATUSES;

export const WORKSTREAM_TYPES = ['research', 'experiment', 'analysis', 'writing', 'setup', 'purchase', 'admin', 'communication'];
export const WEEKDAYS_KO = ['\uC77C', '\uC6D4', '\uD654', '\uC218', '\uBAA9', '\uAE08', '\uD1A0'];
