import type { SmallAction, SmallActionPriority } from './types';

export function parseSmallActions(content: string): SmallAction[] {
  const actions: SmallAction[] = [];
  let heading = '';

  content.split(/\r?\n/).forEach((line, index) => {
    const headingMatch = line.match(/^#{1,6}\s+(.+)$/);
    if (headingMatch?.[1]) heading = headingMatch[1].trim();

    const task = line.match(/^\s*[-*]\s+\[([ xX])\]\s+(.+)$/);
    if (!task?.[2]) return;

    const rawText = task[2].trim();
    actions.push({
      cardPath: '',
      cardTitle: '',
      text: stripTaskMetadata(rawText),
      done: task[1].toLowerCase() === 'x',
      dueDate: extractTaskDate(rawText, '\\u{1F4C5}'),
      scheduledDate: extractTaskDate(rawText, '\\u{23F3}'),
      doneDate: extractTaskDate(rawText, '\\u{2705}'),
      priority: extractTaskPriority(rawText),
      heading,
      lineNumber: index + 1,
      lineText: line,
      raw: line,
    });
  });

  return actions;
}

function extractTaskDate(textValue: string, marker: string): string {
  const match = textValue.match(new RegExp(`${marker}\\s*(\\d{4}-\\d{2}-\\d{2})`, 'u'));
  return match?.[1] ?? '';
}

function extractTaskPriority(textValue: string): SmallActionPriority {
  if (/\u{23EB}/u.test(textValue)) return 'highest';
  if (/\u{1F53C}/u.test(textValue)) return 'high';
  if (/\u{1F53D}/u.test(textValue)) return 'low';
  if (/\u{23EC}/u.test(textValue)) return 'lowest';
  return 'normal';
}

function stripTaskMetadata(textValue: string): string {
  return textValue
    .replace(/[\u{1F4C5}\u{23F3}\u{2705}]\s*\d{4}-\d{2}-\d{2}/gu, '')
    .replace(/[\u{23EB}\u{1F53C}\u{1F53D}\u{23EC}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}
