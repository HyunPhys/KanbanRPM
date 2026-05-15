export function todayIso(): string {
  return formatDate(new Date());
}

export function formatDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function addDays(day: string, days: number): string {
  const date = new Date(`${day}T00:00:00`);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

export function addMonths(day: string, months: number): string {
  const date = new Date(`${day}T00:00:00`);
  date.setMonth(date.getMonth() + months);
  return formatDate(date);
}

export function startOfMonth(day: string): string {
  return `${day.slice(0, 7)}-01`;
}

export function endOfMonth(day: string): string {
  const date = new Date(`${day.slice(0, 7)}-01T00:00:00`);
  date.setMonth(date.getMonth() + 1);
  date.setDate(0);
  return formatDate(date);
}

export function daysBetween(start: string, end: string): number {
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  return Math.round((endDate.getTime() - startDate.getTime()) / 86400000);
}

export function dateRange(start: string, end: string, fallback = todayIso()): string[] {
  const days: string[] = [];
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate > endDate) return [fallback];
  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    days.push(formatDate(date));
    if (days.length > 180) break;
  }
  return days;
}

export function monthRange(start: string, end: string, fallback = todayIso().slice(0, 7)): string[] {
  const months: string[] = [];
  const startDate = new Date(`${start.slice(0, 7)}-01T00:00:00`);
  const endDate = new Date(`${end.slice(0, 7)}-01T00:00:00`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || startDate > endDate) return [fallback];
  for (let date = new Date(startDate); date <= endDate; date.setMonth(date.getMonth() + 1)) {
    months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    if (months.length > 60) break;
  }
  return months;
}

export function monthOverlapsRange(month: string, start: string, end: string): boolean {
  const monthStart = `${month}-01`;
  const date = new Date(`${monthStart}T00:00:00`);
  date.setMonth(date.getMonth() + 1);
  date.setDate(0);
  const monthEnd = formatDate(date);
  return monthStart <= end && monthEnd >= start;
}

export function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}
