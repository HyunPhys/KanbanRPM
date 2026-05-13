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

export const DEFAULT_CATEGORIES = ['research', 'experiment', 'analysis', 'writing', 'setup', 'purchase', 'admin', 'communication'];

export const HIERARCHY_LEVELS = [
  { id: 'project', label: 'Project', cardType: 'project' },
  { id: 'subproject', label: 'Subproject', cardType: 'subproject' },
] as const;

export const DEFAULT_SETTINGS: KanbanRPMSettings = {
  workspaceFolder: 'KanbanRPM Workspace',
  weeklyReviewFolder: 'KanbanRPM Workspace/routines',
  statuses: DEFAULT_STATUSES,
  categories: DEFAULT_CATEGORIES,
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

export const WORKSTREAM_TYPES = DEFAULT_CATEGORIES;
