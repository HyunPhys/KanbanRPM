import type { TFile } from 'obsidian';

export interface KanbanRPMSettings {
  workspaceFolder: string;
  dailyFolder: string;
  dailySection: string;
  weeklyReviewFolder: string;
  statuses: StatusDefinition[];
}

export type Status = string;

export type CardType = 'project' | 'subproject' | 'big_action' | 'legacy';

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
  parentPath: string;
  parentTitle: string;
  projectTitle: string;
  subprojectTitle: string;
  breadcrumb: string;
  colorKey: string;
  area: string;
  group: string;
  workstreamType: string;
  projectKind: string;
  stage: string;
  nextAction: string;
  waitingFor: string;
  blocker: string;
  nextReview: string;
  dueDate: string;
  importance: string;
  legacyLinks: string[];
  relatedSamples: string[];
  relatedPhenomena: string[];
  relatedPeople: string[];
  relatedNotes: string[];
  dependsOn: string[];
  blocks: string[];
  blockedBy: string[];
  sourceNotes: string[];
  perpetuals: RecurringItem[];
  actionCount: number;
  rpmOrder?: number;
}

export interface NewCardValues {
  title: string;
  status: Status;
  priority: string;
  area: string;
  group: string;
  workstreamType: string;
  projectKind: string;
  stage: string;
  nextAction: string;
  waitingFor: string;
  blocker: string;
  nextReview: string;
  dueDate: string;
  importance: string;
  legacyLinks: string;
  relatedSamples: string;
  relatedPhenomena: string;
  relatedPeople: string;
  relatedNotes: string;
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

export interface DependencyEdge {
  fromPath: string;
  fromTitle: string;
  toPath: string;
  toTitle: string;
  relationship: 'depends_on' | 'blocks';
  raw: string;
  broken: boolean;
}

export interface LegacyProjectCandidate {
  file: TFile;
  path: string;
  title: string;
  status: Status;
  priority: number;
  area: string;
  group: string;
  projectKind: string;
  workstreamType: string;
  stage: string;
  reasons: string[];
  legacyLink: string;
  alreadySeeded: boolean;
  existingCardTitle: string;
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
