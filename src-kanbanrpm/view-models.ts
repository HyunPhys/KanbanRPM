import type { ProjectCard } from './types';
import type { SmallAction } from './types';

export interface PointerDragState {
  cardPath: string;
  pointerId: number;
  startX: number;
  startY: number;
  dragging: boolean;
  cardEl: HTMLElement;
  activeLaneEl?: HTMLElement;
}

export interface FlowConnectState {
  pointerId: number;
  sourcePath: string;
  preview: SVGPathElement;
  startX: number;
  startY: number;
  previewOverlay?: SVGSVGElement;
}

export type TableSortKey = 'title' | 'project' | 'type' | 'status' | 'priority' | 'date' | 'dependencies' | 'actions';

export const TABLE_COLUMNS: Array<{ key: TableSortKey; label: string; width: number }> = [
  { key: 'title', label: 'Title', width: 240 },
  { key: 'project', label: 'Project', width: 220 },
  { key: 'type', label: 'Type', width: 120 },
  { key: 'status', label: 'Status', width: 120 },
  { key: 'priority', label: 'Priority', width: 90 },
  { key: 'date', label: 'Due / Review', width: 150 },
  { key: 'dependencies', label: 'Flow', width: 120 },
  { key: 'actions', label: 'Actions', width: 130 },
];

export type GanttScale = 'month-week' | 'quarter-month';

export interface TimelineMarker {
  date: string;
  label: string;
  kind: 'scheduled' | 'review' | 'task' | 'recurring';
  card: ProjectCard;
  action?: SmallAction;
}

export interface TimelineMemoItem {
  content: string;
}

export interface GanttPeriod {
  start: string;
  end: string;
}

export interface GanttRow {
  key: string;
  kind: 'project' | 'subproject' | 'big_action';
  title: string;
  projectTitle: string;
  subprojectTitle: string;
  card?: ProjectCard;
  period?: GanttPeriod;
  childCount: number;
}

export interface GanttSegment {
  key: string;
  label: string;
  start: string;
  end: string;
}

export interface GanttRowMetric {
  top: number;
  height: number;
}
