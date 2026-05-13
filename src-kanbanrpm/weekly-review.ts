import { App, Notice, TFile, normalizePath } from 'obsidian';
import type { KanbanRPMSettings, ProjectCard } from './types';
import { getIsoDate, getIsoWeek, getWeeklyReviewPath } from './utils';

export async function openWeeklyReview(app: App, settings: KanbanRPMSettings, cards: ProjectCard[]): Promise<void> {
  const folder = normalizePath(settings.weeklyReviewFolder);
  if (!app.vault.getAbstractFileByPath(folder)) await app.vault.createFolder(folder);

  const weeklyPath = getWeeklyReviewPath(settings);
  let weeklyFile = app.vault.getAbstractFileByPath(weeklyPath);

  if (!(weeklyFile instanceof TFile)) {
    weeklyFile = await app.vault.create(weeklyPath, getWeeklyReviewContent(cards, settings));
    new Notice(`KanbanRPM weekly review created: ${weeklyPath}`);
  }

  if (weeklyFile instanceof TFile) await app.workspace.getLeaf(false).openFile(weeklyFile);
}

function getWeeklyReviewContent(cards: ProjectCard[], settings: KanbanRPMSettings): string {
  const { year, week } = getIsoWeek();
  const date = getIsoDate();
  const doneStatus = settings.statuses.find((status) => status.id === 'done')?.id ?? 'done';
  const activeStatus = settings.statuses.find((status) => status.id === 'active')?.id ?? 'active';
  const waitingStatus = settings.statuses.find((status) => status.id === 'waiting')?.id ?? 'waiting';
  const blockedStatus = settings.statuses.find((status) => status.id === 'blocked')?.id ?? 'blocked';
  const reviewCards = cards
    .filter((card) => card.status !== doneStatus)
    .sort((a, b) => a.projectTitle.localeCompare(b.projectTitle) || a.title.localeCompare(b.title));
  const active = reviewCards.filter((card) => card.status === activeStatus);
  const waiting = reviewCards.filter((card) => card.status === waitingStatus || card.waitingFor);
  const blocked = reviewCards.filter((card) => card.status === blockedStatus || card.blocker || card.blockedBy.length);

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
