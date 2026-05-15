import type { RecurringItem } from './types';

export function parseRoutineLine(line: string, lineNumber: number): RecurringItem | null {
  const match = line.match(/^\s*[-*]\s+\[[ xX-]\]\s+(.+)$/);
  if (!match) return null;
  const raw = match[1].trim();
  const cadence = raw.match(/@(daily|weekly|monthly)\b/i)?.[1]?.toLowerCase();
  const every = raw.match(/@every\s+(\d+)\s*([dDwWmM])\b/);
  if (!cadence && !every) return null;
  const startDate = raw.match(/@start\s+(\d{4}-\d{2}-\d{2})\b/i)?.[1] ?? '';
  const text = raw
    .replace(/@(daily|weekly|monthly)\b/gi, '')
    .replace(/@every\s+\d+\s*[dDwWmM]\b/gi, '')
    .replace(/@start\s+\d{4}-\d{2}-\d{2}\b/gi, '')
    .trim();
  const unitChar = every?.[2]?.toLowerCase();
  return {
    cardPath: '',
    cardTitle: '',
    text,
    cadence: every ? 'custom' : (cadence as RecurringItem['cadence']),
    startDate,
    interval: every ? Number(every[1]) : 1,
    unit: every ? (unitChar === 'w' ? 'week' : unitChar === 'm' ? 'month' : 'day') : cadence === 'weekly' ? 'week' : cadence === 'monthly' ? 'month' : 'day',
    lineNumber,
    raw,
    completedDates: [],
  };
}

export function parseRoutineCompletedDates(section: string, routineText: string): string[] {
  const dates: string[] = [];
  for (const line of section.split(/\r?\n/)) {
    const row = line.match(/^\|\s*(\d{4}-\d{2}-\d{2})\s*\|\s*(.+?)\s*\|?$/);
    if (row && row[2].trim() === routineText) dates.push(row[1]);
    const legacy = line.match(/^-\s+(\d{4}-\d{2}-\d{2})\s+completed:\s+(.+)$/);
    if (legacy && legacy[2].trim() === routineText) dates.push(legacy[1]);
  }
  return Array.from(new Set(dates)).sort();
}

export function routineScheduleLabel(item: Pick<RecurringItem, 'cadence' | 'interval' | 'unit' | 'startDate'>): string {
  const interval = item.cadence === 'custom' ? `@every ${item.interval}${item.unit[0]}` : `@${item.cadence}`;
  return item.startDate ? `${interval} @start ${item.startDate}` : interval;
}
