import type { TFile } from 'obsidian';

export interface KanbanRPMSettings {
  workspaceFolder: string;
  dailyFolder: string;
  dailySection: string;
  weeklyReviewFolder: string;
  statuses: StatusDefinition[];
  categories: string[];
  cardDisplayFields: CardDisplaySettings;
  smallActionDisplay: SmallActionDisplaySettings;
}

export type Status = string;

export type CardType = 'project' | 'subproject' | 'big_action';

export type ViewMode = 'board' | 'table' | 'list' | 'timeline' | 'graph';

export interface StatusDefinition {
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
  priority: number;
  parent: string;
  project: string;
  subproject: string;
  projects: string[];
  subprojects: string[];
  primaryProject: string;
  primarySubproject: string;
  parentPath: string;
  parentTitle: string;
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
  nextReview: string;
  dueDate: string;
  dependsOn: string[];
  blocks: string[];
  blockedBy: string[];
  sourceNotes: string[];
  perpetuals: RecurringItem[];
  smallActions: SmallAction[];
  actionCount: number;
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
  cadence: 'daily' | 'weekly' | 'monthly';
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
  relationship: 'depends_on' | 'blocks';
  raw: string;
  broken: boolean;
}

export type DailyPullMode = 'review' | 'active' | 'waiting' | 'blocked' | 'all-visible';

export type CardIssueLevel = 'warning' | 'error';

export interface CardIssue {
  cardPath: string;
  cardTitle: string;
  level: CardIssueLevel;
  field: string;
  message: string;
}
