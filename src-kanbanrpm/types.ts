import type { TFile } from 'obsidian';

export interface KanbanRPMSettings {
  workspaceFolder: string;
  dailyFolder: string;
  dailySection: string;
  weeklyReviewFolder: string;
}

export type Status = 'inbox' | 'active' | 'waiting' | 'blocked' | 'someday' | 'done';

export interface Lane {
  id: Status;
  label: string;
}

export interface ProjectCard {
  file: TFile;
  path: string;
  title: string;
  status: Status;
  priority: number;
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
  sourceNotes: string[];
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
