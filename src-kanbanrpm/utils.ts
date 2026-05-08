import { normalizePath } from 'obsidian';
import { LANES } from './constants';
import type { KanbanRPMSettings, ProjectCard, Status, StatusDefinition } from './types';

export function text(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.filter(Boolean).join(', ');
  return String(value);
}

export function yamlScalar(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  const raw = String(value).replace(/\r?\n/g, ' ').trim();
  if (/^[0-9]+$/.test(raw)) return raw;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (/^(true|false)$/i.test(raw)) return raw.toLowerCase();
  return JSON.stringify(raw);
}

export function yamlArray(values: string[]): string {
  if (!values.length) return '[]';
  return values.map((value) => `\n  - ${JSON.stringify(value)}`).join('');
}

export function toStringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(text).map((item) => item.trim()).filter(Boolean);
  const raw = text(value).trim();
  if (!raw) return [];
  return raw
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function textareaToList(value: string): string[] {
  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function sanitizeFileName(name: string): string {
  const sanitized = String(name || 'Untitled Project')
    .replace(/[\\/:*?"<>|#^[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return sanitized || 'Untitled Project';
}

export function isStatus(value: unknown): value is Status {
  return typeof value === 'string' && value.trim().length > 0;
}

export function normalizeStatus(value: unknown, statuses: StatusDefinition[]): Status {
  const raw = text(value).trim().toLowerCase().replace(/\s+/g, '-');
  if (statuses.some((status) => status.id === raw)) return raw;
  return statuses[0]?.id ?? LANES[0].id;
}

export function parseStatuses(value: string): StatusDefinition[] {
  const statuses = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [idPart, labelPart] = line.split('|').map((part) => part.trim());
      const id = (idPart || labelPart || 'status').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
      return {
        id,
        label: labelPart || idPart || id,
      };
    })
    .filter((status) => status.id);

  const seen = new Set<string>();
  return statuses.filter((status) => {
    if (seen.has(status.id)) return false;
    seen.add(status.id);
    return true;
  });
}

export function serializeStatuses(statuses: StatusDefinition[]): string {
  return statuses.map((status) => `${status.id} | ${status.label}`).join('\n');
}

export function parseCategories(value: string): string[] {
  const seen = new Set<string>();
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, ''))
    .filter((category) => {
      if (!category || seen.has(category)) return false;
      seen.add(category);
      return true;
    });
}

export function serializeCategories(categories: string[]): string {
  return categories.join('\n');
}

export function isValidDateString(value: string): boolean {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime()) && value === date.toISOString().slice(0, 10);
}

export function toDateSortValue(card: ProjectCard): string {
  const date = card.dueDate || card.nextReview || '';
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : '9999-99-99';
}

export function compareCards(a: ProjectCard, b: ProjectCard): number {
  const aManual = Number.isFinite(a.order);
  const bManual = Number.isFinite(b.order);

  if (aManual && bManual && a.order !== b.order) {
    return (a.order ?? 0) - (b.order ?? 0);
  }

  if (aManual !== bManual) return aManual ? -1 : 1;

  const priorityDiff = (a.priority || 3) - (b.priority || 3);
  if (priorityDiff !== 0) return priorityDiff;

  const dateDiff = toDateSortValue(a).localeCompare(toDateSortValue(b));
  if (dateDiff !== 0) return dateDiff;

  return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
}

export function parsePriority(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 3;
  return Math.min(5, Math.max(1, Math.round(n)));
}

export function parseOrder(value: unknown): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function getIsoDate(date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getIsoWeek(date = new Date()): { year: number; week: number } {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return { year: target.getUTCFullYear(), week };
}

export function getWeeklyReviewPath(settings: KanbanRPMSettings, date = new Date()): string {
  const { year, week } = getIsoWeek(date);
  return normalizePath(`${settings.weeklyReviewFolder}/${year}-W${String(week).padStart(2, '0')} Weekly Review.md`);
}

export function isPastDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return value < `${yyyy}-${mm}-${dd}`;
}

export function isDueSoon(value: string, days = 7): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${value}T00:00:00`);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);
  return diffDays >= 0 && diffDays <= days;
}

export function splitFrontmatter(content: string): { body: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { body: content };

  return {
    body: content.slice(match[0].length),
  };
}

export function getWikiLinkTarget(value: string): string {
  const match = value.match(/\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/);
  return (match ? match[1] : value).trim();
}
