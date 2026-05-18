export interface MarkdownSection {
  start: number;
  bodyStart: number;
  end: number;
  level: number;
}

export function getSection(content: string, title: string): string {
  const section = findHeadingSection(content, title);
  return section ? content.slice(section.bodyStart, section.end) : '';
}

export function findHeadingSection(content: string, title: string): MarkdownSection | null {
  const escaped = escapeRegex(title);
  const pattern = new RegExp(`^(#{1,6})\\s+${escaped}\\s*$`, 'gim');
  const match = pattern.exec(content);
  if (!match || match.index === undefined) return null;

  const level = match[1].length;
  const bodyStart = match.index + match[0].length;
  const rest = content.slice(bodyStart);
  const nextPattern = new RegExp(`^#{1,${level}}\\s+`, 'm');
  const next = rest.match(nextPattern);
  return {
    start: match.index,
    bodyStart,
    end: next?.index === undefined ? content.length : bodyStart + next.index,
    level,
  };
}

export function findNestedHeadingSection(content: string, parentTitle: string, childTitle: string): MarkdownSection | null {
  const parent = findHeadingSection(content, parentTitle);
  if (!parent) return null;
  const parentBody = content.slice(parent.bodyStart, parent.end);
  const child = findHeadingSection(parentBody, childTitle);
  if (!child) return null;
  return {
    start: parent.bodyStart + child.start,
    bodyStart: parent.bodyStart + child.bodyStart,
    end: parent.bodyStart + child.end,
    level: child.level,
  };
}

export function replaceSection(content: string, title: string, body: string): string {
  const normalizedBody = body.trimEnd();
  const existing = findHeadingSection(content, title);
  const level = existing?.level ?? 2;
  const replacement = `${'#'.repeat(level)} ${title}\n\n${normalizedBody}${normalizedBody ? '\n' : ''}`;
  if (existing) return `${content.slice(0, existing.start)}${replacement}${content.slice(existing.end)}`;
  return `${content.trimEnd()}\n\n${replacement}`;
}

export function parseDependencyList(section: string, label: string): string[] {
  const lines = section.split(/\r?\n/);
  const values: string[] = [];
  let active = false;
  for (const line of lines) {
    if (new RegExp(`^\\s*${escapeRegex(label)}:\\s*$`, 'i').test(line)) {
      active = true;
      continue;
    }
    if (/^\s*[A-Za-z].*:\s*$/.test(line)) active = false;
    if (!active) continue;
    const item = line.match(/^\s*[-*]\s+(.+)/);
    if (item?.[1]) values.push(item[1].trim());
  }
  return values;
}

export function parsePlainList(section: string): string[] {
  return section
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*[-*]\s+(.+)/)?.[1]?.trim() ?? '')
    .filter(Boolean);
}

export function parseMarkdownTableRow(line: string): string[] | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) return null;
  return trimmed
    .slice(1, -1)
    .split('|')
    .map((cell) => cell.trim());
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
