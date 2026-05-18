import { LANES } from './constants';
import type { CategoryDefinition, ProjectCard, Status, StatusDefinition } from './types';

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

export function parseCategories(value: string): CategoryDefinition[] {
  const seen = new Set<string>();
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [idPart, labelPart] = line.split('|').map((part) => part.trim());
      const id = (idPart || labelPart || 'category').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
      return {
        id,
        label: labelPart || idPart || id,
      };
    })
    .filter((category) => {
      if (!category.id || seen.has(category.id)) return false;
      seen.add(category.id);
      return true;
    });
}

export function normalizeCategoryDefinitions(value: unknown): CategoryDefinition[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value
    .map((item) => {
      if (typeof item === 'string') {
        const id = item.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
        return { id, label: item.trim() || id };
      }
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      const id = text(record.id).trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
      const label = text(record.label).trim() || id;
      return id ? { id, label } : null;
    })
    .filter((category): category is CategoryDefinition => {
      if (!category?.id || seen.has(category.id)) return false;
      seen.add(category.id);
      return true;
    });
}

export function serializeCategories(categories: CategoryDefinition[]): string {
  return categories.map((category) => `${category.id} | ${category.label}`).join('\n');
}

export function categoryIds(categories: CategoryDefinition[]): string[] {
  return categories.map((category) => category.id);
}

export function categoryLabel(categories: CategoryDefinition[], id: string): string {
  return categories.find((category) => category.id === id)?.label ?? id;
}

export function isValidDateString(value: string): boolean {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime()) && value === date.toISOString().slice(0, 10);
}

export function toDateSortValue(card: ProjectCard): string {
  const date = card.scheduledDate || card.dueDate || card.nextReview || '';
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
