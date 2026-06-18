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
      dueDate: extractTaskDate(rawText, '\\u{1F4C5}', 'due'),
      scheduledDate: extractTaskDate(rawText, '\\u{23F3}', 'scheduled'),
      doneDate: extractTaskDate(rawText, '\\u{2705}', 'done'),
      priority: extractTaskPriority(rawText),
      heading,
      lineNumber: index + 1,
      lineText: line,
      raw: line,
    });
  });

  return actions;
}

function extractTaskDate(textValue: string, marker: string, asciiKey: 'scheduled' | 'due' | 'done'): string {
  const emojiMatch = textValue.match(new RegExp(`${marker}\\s*(\\d{4}-\\d{2}-\\d{2})`, 'u'));
  if (emojiMatch?.[1]) return emojiMatch[1];
  const asciiMatch = textValue.match(new RegExp(`@${asciiKey}\\s+(\\d{4}-\\d{2}-\\d{2})`, 'i'));
  return asciiMatch?.[1] ?? '';
}

function extractTaskPriority(textValue: string): SmallActionPriority {
  const ascii = textValue.match(/@priority\s+(highest|high|medium|normal|low|lowest)\b/i)?.[1]?.toLowerCase();
  if (ascii === 'highest' || ascii === 'high' || ascii === 'low' || ascii === 'lowest') return ascii;
  if (ascii === 'medium') return 'medium';
  if (/\u{23EB}/u.test(textValue)) return 'highest';
  if (/\u{1F53C}/u.test(textValue)) return 'high';
  if (/\u{1F53D}/u.test(textValue)) return 'low';
  if (/\u{23EC}/u.test(textValue)) return 'lowest';
  return 'normal';
}

function stripTaskMetadata(textValue: string): string {
  return textValue
    .replace(/[\u{1F4C5}\u{23F3}\u{2705}]\s*\d{4}-\d{2}-\d{2}/gu, '')
    .replace(/@(scheduled|due|done)\s+\d{4}-\d{2}-\d{2}/gi, '')
    .replace(/@priority\s+(highest|high|medium|normal|low|lowest)\b/gi, '')
    .replace(/[\u{23EB}\u{1F53C}\u{1F53D}\u{23EC}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}
