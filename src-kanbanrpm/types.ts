import type { TFile } from 'obsidian';

export interface KanbanRPMSettings {
  workspaceFolder: string;
  statuses: StatusDefinition[];
  categories: CategoryDefinition[];
  experimentLogCategories: string[];
  analysisLogCategories: string[];
  promptForLogOnDone: boolean;
  reviewReminderStatus: string;
  boardStatusFilter: string[];
  timelineStatusFilter: string[];
  cardDisplayFields: CardDisplaySettings;
  smallActionDisplay: SmallActionDisplaySettings;
}

export type Status = string;

export type CardType = 'project' | 'subproject' | 'big_action';
export type ProjectState = 'active' | 'closed';

export type ViewMode = 'board' | 'table' | 'timeline' | 'gantt' | 'archive';

export interface StatusDefinition {
  id: string;
  label: string;
}

export interface CategoryDefinition {
  id: string;
  label: string;
}

export interface Lane {
  id: Status;
  label: string;
}

export interface ProjectCard {
  file: TFile;
  path: string;
  id: string;
  title: string;
  type: CardType;
  status: Status;
  projectState: ProjectState;
  priority: number;
  project: string;
  subproject: string;
  projects: string[];
  subprojects: string[];
  primaryProject: string;
  primarySubproject: string;
  projectTitles: string[];
  subprojectTitles: string[];
  projectTitle: string;
  subprojectTitle: string;
  breadcrumb: string;
  colorKey: string;
  workstreamType: string;
  nextAction: string;
  waitingFor: string;
  blocker: string;
  startDate: string;
  nextReview: string;
  dueDate: string;
  precededBy: string[];
  followedBy: string[];
  dependsOn: string[];
  blocks: string[];
  blockedBy: string[];
  sourceNotes: string[];
  routines: RecurringItem[];
  researchLogs: ResearchLogEntry[];
  smallActions: SmallAction[];
  actionCount: number;
  archived: boolean;
  archivedAt: string;
  archiveOriginalPath: string;
  archiveOwnerProject: string;
  order?: number;
}

export interface NewCardValues {
  title: string;
  type: CardType;
  project: string;
  subproject: string;
  projects: string;
  subprojects: string;
  status: Status;
  priority: string;
  workstreamType: string;
  nextAction: string;
  waitingFor: string;
  blocker: string;
  startDate: string;
  nextReview: string;
  dueDate: string;
  dependsOn: string;
  blocks: string;
  sourceNotes: string;
}

export interface ActionItem {
  cardPath: string;
  cardTitle: string;
  sourcePath: string;
  sourceLabel: string;
  lineNumber: number;
  text: string;
  recurring?: boolean;
}

export interface RecurringItem {
  cardPath: string;
  cardTitle: string;
  text: string;
  cadence: 'daily' | 'weekly' | 'monthly' | 'custom';
  startDate: string;
  interval: number;
  unit: 'day' | 'week' | 'month';
  lineNumber: number;
  raw: string;
  completedDates: string[];
}

export type ResearchLogKind = 'experiment' | 'analysis';

export interface ResearchLogEntry {
  cardPath: string;
  cardTitle: string;
  kind: ResearchLogKind;
  module: string;
  date: string;
  subject: string;
  conditionsOrMethod: string;
  result: string;
  link: string;
  lineNumber: number;
}

export interface ResearchLogValues {
  kind: ResearchLogKind;
  module: string;
  date: string;
  subject: string;
  conditionsOrMethod: string;
  result: string;
  link: string;
}

export interface GanttDateValues {
  startDate: string;
  dueDate: string;
  nextReview: string;
}

export type TimelineScope = 'all' | 'review' | 'due' | 'tasks' | 'recurring';

export type SmallActionPriority = 'highest' | 'high' | 'medium' | 'normal' | 'low' | 'lowest';

export interface SmallAction {
  cardPath: string;
  cardTitle: string;
  text: string;
  done: boolean;
  dueDate: string;
  scheduledDate: string;
  doneDate: string;
  priority: SmallActionPriority;
  heading: string;
  lineNumber: number;
  lineText: string;
  raw: string;
}

export interface CardDisplaySettings {
  breadcrumb: boolean;
  type: boolean;
  status: boolean;
  priority: boolean;
  category: boolean;
  currentFocus: boolean;
  waiting: boolean;
  blockers: boolean;
  dates: boolean;
  dependencies: boolean;
  sources: boolean;
  smallActionSummary: boolean;
}

export type SmallActionSourceFilter = 'dated' | 'done' | 'all';
export type SmallActionDateWindow = 'all' | 'overdue' | 'today' | 'tomorrow' | 'week' | 'month';

export interface SmallActionDisplaySettings {
  collapsedByDefault: boolean;
  sourceFilter: SmallActionSourceFilter;
  dateWindow: SmallActionDateWindow;
}

export interface DependencyEdge {
  fromPath: string;
  fromTitle: string;
  toPath: string;
  toTitle: string;
  relationship: 'preceded_by' | 'followed_by';
  raw: string;
  broken: boolean;
}

export type CardIssueLevel = 'warning' | 'error';

export interface CardIssue {
  cardPath: string;
  cardTitle: string;
  level: CardIssueLevel;
  field: string;
  message: string;
}
