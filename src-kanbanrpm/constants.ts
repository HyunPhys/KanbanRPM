import type { CategoryDefinition, CommunicationType, KanbanRPMSettings, Lane, StatusDefinition } from './types';

export const VIEW_TYPE = 'kanban-rpm-board';

export const DEFAULT_STATUSES: StatusDefinition[] = [
  { id: 'inbox', label: 'Inbox' },
  { id: 'active', label: 'Active' },
  { id: 'waiting', label: 'Waiting' },
  { id: 'blocked', label: 'Blocked' },
  { id: 'someday', label: 'Someday' },
  { id: 'done', label: 'Done' },
];

export const DEFAULT_CATEGORIES: CategoryDefinition[] = [
  { id: 'research', label: 'Research' },
  { id: 'experiment', label: 'Experiment' },
  { id: 'analysis', label: 'Analysis' },
  { id: 'writing', label: 'Writing' },
  { id: 'setup', label: 'Setup' },
  { id: 'purchase', label: 'Purchase' },
  { id: 'admin', label: 'Admin' },
  { id: 'communication', label: 'Communication' },
];

export const HIERARCHY_LEVELS = [
  { id: 'project', label: 'Project', cardType: 'project' },
  { id: 'subproject', label: 'Subproject', cardType: 'subproject' },
] as const;

export const COMMUNICATION_TYPES: Array<{ id: CommunicationType; label: string; folder: string }> = [
  { id: 'meeting_internal', label: 'Meeting (Internal)', folder: 'Meeting (Internal)' },
  { id: 'meeting_external', label: 'Meeting (External)', folder: 'Meeting (External)' },
  { id: 'call', label: 'Call', folder: 'Call' },
  { id: 'chat', label: 'Chat', folder: 'Chat' },
  { id: 'email', label: 'Email', folder: 'Email' },
];

export const DEFAULT_SETTINGS: KanbanRPMSettings = {
  workspaceFolder: 'KanbanRPM Workspace',
  statuses: DEFAULT_STATUSES,
  categories: DEFAULT_CATEGORIES,
  experimentLogCategories: ['experiment'],
  analysisLogCategories: ['analysis'],
  promptForLogOnDone: true,
  reviewReminderStatus: 'active',
  boardStatusFilter: DEFAULT_STATUSES.map((status) => status.id),
  boardStatusOrder: DEFAULT_STATUSES.map((status) => status.id),
  boardProjectFilter: '',
  boardSubprojectFilter: '',
  boardCategoryFilter: '',
  viewFilters: {
    board: { project: '', subproject: '', category: '' },
    table: { project: '', subproject: '', category: '' },
    timeline: { project: '', subproject: '', category: '' },
    gantt: { project: '', subproject: '', category: '' },
    archive: { project: '', subproject: '', category: '' },
  },
  showBoardConnectors: true,
  showBoardSubprojects: true,
  showBoardBigActions: true,
  showGanttSubprojects: true,
  showGanttBigActions: true,
  boardZoom: 1,
  timelineZoom: 1,
  timelineScrollLeft: null,
  timelineScrollTop: null,
  ganttZoom: 1,
  newCardAdvancedOpen: false,
  timelineStatusFilter: ['active'],
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
