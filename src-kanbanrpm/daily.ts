import { App, Notice, TFile, normalizePath } from 'obsidian';
import type { KanbanRPMSettings, ProjectCard } from './types';
import { getDailyPath, getIsoDate, getIsoWeek, getWeeklyReviewPath } from './utils';

export async function sendCardToDaily(app: App, settings: KanbanRPMSettings, card: ProjectCard): Promise<void> {
  const dailyPath = getDailyPath(settings);
  const dailyFile = app.vault.getAbstractFileByPath(dailyPath);

  if (!(dailyFile instanceof TFile)) {
    new Notice(`Today's Daily does not exist: ${dailyPath}`);
    return;
  }

  const action = card.nextAction || 'next_action';
  const line = `- [ ] [[${card.title}]]: ${action}`;
  const content = await app.vault.read(dailyFile);

  if (content.includes(line)) {
    new Notice('Daily already has this KanbanRPM action.');
    return;
  }

  const nextContent = appendLinesToDailyContent(content, [line], settings.dailySection);
  await app.vault.modify(dailyFile, nextContent);
  new Notice(`Sent to Daily: ${card.title}`);
}

export async function sendCardsToDaily(app: App, settings: KanbanRPMSettings, cards: ProjectCard[]): Promise<void> {
  const dailyPath = getDailyPath(settings);
  const dailyFile = app.vault.getAbstractFileByPath(dailyPath);

  if (!(dailyFile instanceof TFile)) {
    new Notice(`Today's Daily does not exist: ${dailyPath}`);
    return;
  }

  const lines = cards
    .filter((card) => card.nextAction)
    .map((card) => `- [ ] [[${card.title}]]: ${card.nextAction}`);

  if (!lines.length) {
    new Notice('No KanbanRPM review cards have next_action values.');
    return;
  }

  const content = await app.vault.read(dailyFile);
  const newLines = lines.filter((line) => !content.includes(line));

  if (!newLines.length) {
    new Notice('Daily already has these KanbanRPM actions.');
    return;
  }

  const nextContent = appendLinesToDailyContent(content, newLines, settings.dailySection);
  await app.vault.modify(dailyFile, nextContent);
  new Notice(`Sent ${newLines.length} KanbanRPM review actions to Daily.`);
}

export async function openWeeklyReview(app: App, settings: KanbanRPMSettings, cards: ProjectCard[]): Promise<void> {
  const folder = normalizePath(settings.weeklyReviewFolder);
  if (!app.vault.getAbstractFileByPath(folder)) await app.vault.createFolder(folder);

  const weeklyPath = getWeeklyReviewPath(settings);
  let weeklyFile = app.vault.getAbstractFileByPath(weeklyPath);

  if (!(weeklyFile instanceof TFile)) {
    weeklyFile = await app.vault.create(weeklyPath, getWeeklyReviewContent(cards));
    new Notice(`KanbanRPM weekly review created: ${weeklyPath}`);
  }

  if (weeklyFile instanceof TFile) await app.workspace.getLeaf(false).openFile(weeklyFile);
}

function appendLinesToDailyContent(content: string, lines: string[], section: string): string {
  const cleanLines = lines.filter(Boolean);
  if (!cleanLines.length) return content;
  const block = `${cleanLines.join('\n')}\n`;
  const heading = section.trim();

  if (!heading) return content.endsWith('\n') ? `${content}${block}` : `${content}\n${block}`;

  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const headingPattern = new RegExp(`(^|\\n)(#{1,6})\\s+${escaped}\\s*\\n`);
  const match = content.match(headingPattern);

  if (!match || match.index === undefined) {
    const prefix = content.endsWith('\n') ? content : `${content}\n`;
    return `${prefix}\n## ${heading}\n${block}`;
  }

  const insertAt = match.index + match[0].length;
  return `${content.slice(0, insertAt)}${block}${content.slice(insertAt)}`;
}

function getWeeklyReviewContent(cards: ProjectCard[]): string {
  const { year, week } = getIsoWeek();
  const date = getIsoDate();
  const reviewCards = cards
    .filter((card) => card.status !== 'done')
    .sort((a, b) => a.group.localeCompare(b.group) || a.title.localeCompare(b.title));
  const active = reviewCards.filter((card) => card.status === 'active');
  const waiting = reviewCards.filter((card) => card.status === 'waiting' || card.waitingFor);
  const blocked = reviewCards.filter((card) => card.status === 'blocked' || card.blocker);

  return `---\nkanban_rpm: true\ntype: weekly_review\nweek: ${year}-W${String(week).padStart(2, '0')}\ncreated: ${date}\n---\n\n# KanbanRPM Weekly Review ${year}-W${String(week).padStart(2, '0')}\n\n## Review Queue\n\n${renderCardChecklist(reviewCards.slice(0, 20))}\n\n## Active\n\n${renderCardChecklist(active)}\n\n## Waiting\n\n${renderCardChecklist(waiting)}\n\n## Blocked\n\n${renderCardChecklist(blocked)}\n\n## Decisions\n\n## Next Week Focus\n\n`;
}

function renderCardChecklist(cards: ProjectCard[]): string {
  if (!cards.length) return '- No cards.\n';
  return cards
    .map((card) => {
      const context = [card.nextAction, card.waitingFor ? `waiting: ${card.waitingFor}` : '', card.blocker ? `blocker: ${card.blocker}` : '']
        .filter(Boolean)
        .join(' | ');
      return `- [ ] [[${card.title}]]${context ? `: ${context}` : ''}`;
    })
    .join('\n');
}
