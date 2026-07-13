import { Notice, TFile, normalizePath, parseYaml, stringifyYaml } from 'obsidian';
import type KanbanRPMPlugin from './main';
import { TFolder } from 'obsidian';
import { COMMUNICATION_TYPES } from './constants';
import { addDays, daysBetween, formatDate, todayIso } from './date-utils';
import {
  findHeadingSection,
  findNestedHeadingSection,
  getSection,
  parseDependencyList,
  parseMarkdownTableRow,
  parsePlainList,
  replaceSection,
} from './markdown-utils';
import type {
  ActionItem,
  CardIssue,
  CardIssueLevel,
  CommunicationSourceValues,
  GanttDateValues,
  NewCardValues,
  ParticipantSuggestion,
  ProjectCard,
  ResearchLogKind,
  ResearchLogEntry,
  ResearchLogValues,
  SmallAction,
  Status,
} from './types';
import { parseSmallActions } from './task-parser';
import { parseRoutineCompletedDates, parseRoutineLine, routineScheduleLabel } from './routine-utils';
import {
  categoryIds,
  categoryLabel,
  compareCards,
  getWikiLinkTarget,
  normalizeStatus,
  parseOrder,
  parsePriority,
  sanitizeFileName,
  splitFrontmatter,
  text,
  textareaToList,
  toStringList,
  yamlArray,
  yamlScalar,
} from './utils';

interface LLMRecentChange {
  date: string;
  type: string;
  card?: ProjectCard;
  item: string;
  context: string;
  change: string;
  source: 'card' | 'daily';
}

export class CardRepository {
  constructor(private plugin: KanbanRPMPlugin) {}

  async loadCards(): Promise<ProjectCard[]> {
    return this.loadCardsInternal(false);
  }

  async loadArchivedCards(): Promise<ProjectCard[]> {
    return this.loadCardsInternal(true);
  }

  async loadResearchLogs(): Promise<ResearchLogEntry[]> {
    await this.plugin.ensureWorkspace();
    const file = await this.getResearchLogFile();
    const content = await this.plugin.app.vault.read(file);
    return [
      ...this.parseResearchLog(content, 'experiment'),
      ...this.parseResearchLog(content, 'analysis'),
    ].map((entry) => ({
      ...entry,
      cardPath: file.path,
      cardTitle: file.basename,
    }));
  }

  async loadResearchLogModules(kind: ResearchLogKind): Promise<string[]> {
    await this.plugin.ensureWorkspace();
    const file = await this.getResearchLogFile();
    const content = await this.plugin.app.vault.read(file);
    return this.parseResearchLogModules(content, kind);
  }

  private async loadCardsInternal(archived: boolean): Promise<ProjectCard[]> {
    await this.plugin.ensureWorkspace();
    const cards: ProjectCard[] = [];
    const prefix = `${this.plugin.cardsFolder}/`;
    const statuses = this.plugin.settings.statuses;

    for (const file of this.plugin.app.vault.getMarkdownFiles()) {
      if (!file.path.startsWith(prefix)) continue;

      const content = await this.plugin.app.vault.read(file);
      const fm = this.getEffectiveFrontmatter(content);
      if (fm.kanban_rpm !== true && fm.kanban_rpm !== 'true') continue;
      const isArchived = fm.archived === true || fm.archived === 'true' || file.path.split('/').includes('archive');
      if (isArchived !== archived) continue;
      const sectionData = this.parseLivingDocSections(content);
      const type = this.normalizeCardType(text(fm.type));
      const projects = this.uniqueLinks([text(fm.primary_project), ...toStringList(fm.projects)]);
      const subprojects = this.uniqueLinks([text(fm.primary_subproject), ...toStringList(fm.subprojects)]);
      const project = text(fm.primary_project) || projects[0] || '';
      const subproject = text(fm.primary_subproject) || subprojects[0] || '';
      const order = parseOrder(fm.order);
      const title = file.basename;

      cards.push({
        file,
        path: file.path,
        id: text(fm.id) || file.basename,
        title,
        type,
        status: normalizeStatus(fm.status, statuses),
        projectState: this.normalizeProjectState(fm.project_state),
        projectTitles: [],
        subprojectTitles: [],
        projectTitle: '',
        subprojectTitle: '',
        breadcrumb: '',
        colorKey: '',
        priority: parsePriority(fm.priority),
        project,
        subproject,
        projects,
        subprojects,
        primaryProject: project,
        primarySubproject: subproject,
        workstreamType: text(fm.workstream_type),
        nextAction: sectionData.currentFocus,
        waitingFor: sectionData.waitingFor,
        blocker: sectionData.blocker,
        startDate: sectionData.startDate,
        scheduledDate: sectionData.scheduledDate,
        nextReview: sectionData.nextReview,
        dueDate: sectionData.dueDate,
        precededBy: sectionData.precededBy,
        followedBy: sectionData.followedBy,
        dependsOn: sectionData.precededBy,
        blocks: sectionData.followedBy,
        blockedBy: [],
        sourceNotes: sectionData.sourceNotes,
        routines: sectionData.routines.map((item) => ({
          ...item,
          cardPath: file.path,
          cardTitle: title,
        })),
        researchLogs: sectionData.researchLogs.map((item) => ({ ...item, cardPath: file.path, cardTitle: title })),
        smallActions: sectionData.smallActions.map((item) => ({
          ...item,
          cardPath: file.path,
          cardTitle: title,
        })),
        actionCount: sectionData.actionCount,
        archived: isArchived,
        archivedAt: text(fm.archived_at),
        archiveOriginalPath: text(fm.archive_original_path),
        archiveOwnerProject: text(fm.archive_owner_project),
        order,
      });
    }

    if (archived) {
      const activeCards = await this.loadCardsInternal(false);
      const combinedCards = [...activeCards, ...cards];
      this.applyHierarchy(combinedCards);
      this.applyBlockedBy(combinedCards);
    } else {
      this.applyHierarchy(cards);
      this.applyBlockedBy(cards);
    }
    return cards.sort(compareCards);
  }

  async createCard(values: NewCardValues): Promise<TFile> {
    await this.plugin.ensureWorkspace();

    const title = values.title.trim();
    const baseName = sanitizeFileName(title);
    const folder = await this.getCreationFolder(values);
    const path = this.getAvailablePath(folder, baseName, 'md');

    const content = this.getLivingDocTemplate(values, title, baseName);

    const file = await this.plugin.app.vault.create(path, content);
    if (values.type === 'project') {
      await this.ensureFolder(normalizePath(`${this.plugin.cardsFolder}/${baseName}`));
    }
    new Notice(`KanbanRPM card created: ${title}`);
    await this.plugin.refreshViews();
    return file;
  }

  async createCommunicationSourceNote(values: CommunicationSourceValues): Promise<TFile> {
    await this.plugin.ensureWorkspace();

    const title = values.title.trim();
    const baseName = sanitizeFileName(title);
    const year = this.communicationYear(values.date);
    const type = this.communicationTypeDefinition(values.type);
    const folder = normalizePath(`${this.plugin.communicationsFolder}/${year}/${type.folder}`);
    await this.ensureFolder(folder);

    const path = this.getAvailablePath(folder, baseName, 'md');
    const participants = textareaToList(values.participants);
    const file = await this.plugin.app.vault.create(path, this.getCommunicationSourceTemplate(values, participants));
    await this.prependCommunicationLogRow(file, values, participants);
    new Notice(`KanbanRPM communication note created: ${title}`);
    await this.plugin.app.workspace.getLeaf(false).openFile(file);
    return file;
  }

  async loadParticipantSuggestions(): Promise<ParticipantSuggestion[]> {
    const root = `${this.plugin.communicationsFolder}/`;
    const counts = new Map<string, number>();
    for (const file of this.plugin.app.vault.getMarkdownFiles()) {
      if (!normalizePath(file.path).startsWith(root)) continue;
      const content = await this.plugin.app.vault.cachedRead(file);
      const frontmatter = this.parseFirstFrontmatter(content);
      if (text(frontmatter.type) !== 'communication') continue;
      for (const participant of toStringList(frontmatter.participants)) {
        counts.set(participant, (counts.get(participant) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }

  async updateCardFrontmatter(file: TFile, updates: Record<string, unknown>, refresh = true): Promise<void> {
    await this.rewriteCardFrontmatter(file, (frontmatter) => {
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined) {
          delete frontmatter[key];
        } else {
          frontmatter[key] = value;
        }
      }
    });
    if (refresh) await this.plugin.refreshViews();
  }

  async updateCard(card: ProjectCard, values: NewCardValues): Promise<void> {
    const file = this.plugin.app.vault.getAbstractFileByPath(card.path);
    if (!(file instanceof TFile)) return;

    const statusChanged = card.status !== values.status;
    const originalPath = file.path;
    const originalBaseName = file.basename;
    const title = values.title.trim() || file.basename;
    const targetFolder = await this.getCreationFolder(values);
    const targetPath = this.getAvailablePathForExistingFile(file.path, targetFolder, sanitizeFileName(title), file.extension);
    const cardsBeforeUpdate = values.type === 'subproject' ? await this.loadCards() : [];

    await this.updateCardFrontmatter(file, {
      type: values.type,
      primary_project: values.project.trim() || undefined,
      primary_subproject: values.subproject.trim() || undefined,
      projects: this.uniqueLinks([values.project, ...textareaToList(values.projects)]),
      subprojects: this.uniqueLinks([values.subproject, ...textareaToList(values.subprojects)]),
      status: values.status,
      priority: parsePriority(values.priority),
      workstream_type: values.workstreamType.trim(),
    }, false);

    const content = await this.plugin.app.vault.read(file);
    let nextContent = this.updateLivingDocBody(content, title, values);
    if (statusChanged) nextContent = this.prependTimelineLog(nextContent, 'Status', `${this.statusLabel(card.status)} -> ${this.statusLabel(values.status)}`);
    nextContent = this.applyCompletionDueDateUpdate(nextContent, card, values.status);
    await this.plugin.app.vault.modify(file, nextContent);
    if (statusChanged) await this.logCardCompletionSideEffects(card, values.status, title);

    if (normalizePath(file.path) !== normalizePath(targetPath)) {
      await this.plugin.app.fileManager.renameFile(file, targetPath);
    }
    await this.syncHierarchyAfterCardUpdate(card, values, cardsBeforeUpdate, originalPath, file.path, originalBaseName, file.basename);

    new Notice(`KanbanRPM card updated: ${title}`);
    await this.plugin.refreshViews();
  }

  async syncHierarchyFolderRename(file: TFile, oldPath: string): Promise<void> {
    if (!this.plugin.isCardPath(file.path) && !this.plugin.isCardPath(oldPath)) return;
    if (file.extension !== 'md') return;
    if (this.pathParts(oldPath).includes('archive') || this.pathParts(file.path).includes('archive')) return;

    const oldBase = this.fileBaseNameFromPath(oldPath);
    const newBase = file.basename;
    if (!oldBase || !newBase || oldBase === newBase) return;

    const content = await this.plugin.app.vault.read(file);
    const frontmatter = this.parseFirstFrontmatter(content);
    const type = this.normalizeCardType(text(frontmatter.type));
    if (type !== 'project' && type !== 'subproject') return;

    const oldFolder = type === 'project'
      ? normalizePath(`${this.plugin.cardsFolder}/${sanitizeFileName(oldBase)}`)
      : normalizePath(`${this.folderPathFromFilePath(oldPath)}/${sanitizeFileName(oldBase)}`);
    const newFolder = type === 'project'
      ? normalizePath(`${this.plugin.cardsFolder}/${sanitizeFileName(newBase)}`)
      : normalizePath(`${this.folderPathFromFilePath(file.path)}/${sanitizeFileName(newBase)}`);

    if (oldFolder === newFolder) return;
    const folder = this.plugin.app.vault.getAbstractFileByPath(oldFolder);
    if (!(folder instanceof TFolder)) return;

    const existing = this.plugin.app.vault.getAbstractFileByPath(newFolder);
    if (existing) {
      new Notice(`KanbanRPM skipped folder rename because target already exists: ${newFolder}`);
      return;
    }

    await this.ensureFolder(this.folderPathFromFilePath(newFolder));
    await this.plugin.app.fileManager.renameFile(folder, newFolder);
    new Notice(`KanbanRPM folder renamed: ${oldFolder} -> ${newFolder}`);
  }

  async moveCard(cardPath: string, targetStatus: Status, beforePath?: string): Promise<void> {
    const file = this.plugin.app.vault.getAbstractFileByPath(cardPath);
    if (!(file instanceof TFile)) return;

    const cards = await this.loadCards();
    const movedCard = cards.find((item) => item.path === cardPath);
    const laneCards = cards
      .filter((card) => card.status === targetStatus && card.path !== cardPath)
      .sort(compareCards);

    const foundIndex = beforePath ? laneCards.findIndex((card) => card.path === beforePath) : -1;
    const insertIndex = beforePath && foundIndex >= 0 ? foundIndex : laneCards.length;
    const newOrder = this.computeOrder(laneCards, insertIndex);

    await this.updateCardFrontmatter(file, {
      status: targetStatus,
      order: newOrder,
    }, false);
    if (movedCard && movedCard.status !== targetStatus) {
      const content = await this.plugin.app.vault.read(file);
      let next = this.prependTimelineLog(content, 'Status', `${this.statusLabel(movedCard.status)} -> ${this.statusLabel(targetStatus)}`);
      next = this.applyCompletionDueDateUpdate(next, movedCard, targetStatus);
      await this.plugin.app.vault.modify(file, next);
      await this.logCardCompletionSideEffects(movedCard, targetStatus, file.basename, cards);
    }
    await this.plugin.refreshViews();
  }

  async setCardStatus(card: ProjectCard, status: Status): Promise<void> {
    const file = this.plugin.app.vault.getAbstractFileByPath(card.path);
    if (!(file instanceof TFile)) return;

    await this.updateCardFrontmatter(file, { status }, false);
    if (card.status !== status) {
      const content = await this.plugin.app.vault.read(file);
      let next = this.prependTimelineLog(content, 'Status', `${this.statusLabel(card.status)} -> ${this.statusLabel(status)}`);
      next = this.applyCompletionDueDateUpdate(next, card, status);
      await this.plugin.app.vault.modify(file, next);
      await this.logCardCompletionSideEffects(card, status, file.basename);
    }
    await this.plugin.refreshViews();
    new Notice(`KanbanRPM card moved to ${status}: ${card.title}`);
  }

  async setCardPriority(card: ProjectCard, priority: number): Promise<void> {
    const file = this.plugin.app.vault.getAbstractFileByPath(card.path);
    if (!(file instanceof TFile)) return;
    const normalized = Math.min(5, Math.max(1, Math.round(priority)));

    await this.updateCardFrontmatter(file, { priority: normalized }, false);
    if (card.priority !== normalized) {
      const content = await this.plugin.app.vault.read(file);
      const next = this.prependTimelineLog(content, 'Priority', `P${card.priority} -> P${normalized}`);
      await this.plugin.app.vault.modify(file, next);
    }
    await this.plugin.refreshViews();
    new Notice(`KanbanRPM priority updated to P${normalized}: ${card.title}`);
  }

  async updateProjectState(card: ProjectCard, projectState: 'active' | 'closed'): Promise<void> {
    const file = this.plugin.app.vault.getAbstractFileByPath(card.path);
    if (!(file instanceof TFile)) return;
    if (card.type !== 'project') {
      new Notice('KanbanRPM project lifecycle is only available for Project documents.');
      return;
    }

    await this.updateCardFrontmatter(file, { project_state: projectState });
    new Notice(`${projectState === 'closed' ? 'Closed' : 'Reopened'} project: ${card.title}`);
  }

  async updateGanttDates(card: ProjectCard, values: GanttDateValues): Promise<void> {
    const file = this.plugin.app.vault.getAbstractFileByPath(card.path);
    if (!(file instanceof TFile)) return;
    const content = await this.plugin.app.vault.read(file);
    const next = replaceSection(
      content,
      'Timeline',
      [
        values.startDate.trim() ? `- Start date: ${values.startDate.trim()}` : '',
        values.scheduledDate.trim() ? `- Scheduled date: ${values.scheduledDate.trim()}` : '',
        values.nextReview.trim() ? `- Next review: ${values.nextReview.trim()}` : '',
        values.dueDate.trim() ? `- Due date: ${values.dueDate.trim()}` : '',
      ].filter(Boolean).join('\n')
    );
    await this.plugin.app.vault.modify(file, next);
    await this.plugin.refreshViews();
    new Notice(`KanbanRPM Gantt dates updated: ${card.title}`);
  }

  async addResearchLogRow(_card: ProjectCard, values: ResearchLogValues): Promise<void> {
    const file = await this.getResearchLogFile();
    const content = await this.plugin.app.vault.read(file);
    const next = this.prependResearchLog(content, values);
    await this.plugin.app.vault.modify(file, next);
    await this.plugin.refreshViews();
    new Notice(`Added ${values.kind} log row to Research Logs.`);
  }

  async applyDueReviews(): Promise<number> {
    await this.plugin.ensureWorkspace();
    const today = todayIso();
    const targetStatus = this.plugin.settings.statuses.some((status) => status.id === this.plugin.settings.reviewReminderStatus)
      ? this.plugin.settings.reviewReminderStatus
      : this.plugin.settings.statuses[0]?.id ?? 'active';
    let applied = 0;

    for (const card of await this.loadCards()) {
      if (!card.nextReview || card.nextReview > today) continue;
      if (card.status === targetStatus || this.isCompletionStatus(card.status)) continue;
      const file = this.plugin.app.vault.getAbstractFileByPath(card.path);
      if (!(file instanceof TFile)) continue;
      await this.updateCardFrontmatter(file, { status: targetStatus }, false);
      const content = await this.plugin.app.vault.read(file);
      const next = this.prependTimelineLog(content, 'Review', `Next review reached; status changed ${this.statusLabel(card.status)} -> ${this.statusLabel(targetStatus)}`, today);
      await this.plugin.app.vault.modify(file, next);
      applied += 1;
    }

    return applied;
  }

  async normalizeCardOrder(): Promise<void> {
    const cards = await this.loadCards();
    let updated = 0;
    let repaired = 0;

    for (const status of this.plugin.settings.statuses) {
      const laneCards = cards.filter((card) => card.status === status.id).sort(compareCards);

      for (const [index, card] of laneCards.entries()) {
        const nextOrder = (index + 1) * 1000;

        const file = this.plugin.app.vault.getAbstractFileByPath(card.path);
        if (!(file instanceof TFile)) continue;

        await this.updateCardFrontmatter(file, { order: nextOrder }, false);
        if (card.order !== nextOrder) updated += 1;
        repaired += 1;
      }
    }

    await this.plugin.refreshViews();
    new Notice(`KanbanRPM normalized order on ${updated} cards and repaired metadata on ${repaired} cards.`);
  }

  async setNextAction(cardPath: string, nextAction: string): Promise<void> {
    const file = this.plugin.app.vault.getAbstractFileByPath(cardPath);
    if (!(file instanceof TFile)) return;

    const content = await this.plugin.app.vault.read(file);
    await this.plugin.app.vault.modify(file, replaceSection(content, 'Current Focus', `- ${nextAction.trim()}\n`));
    await this.plugin.refreshViews();
    new Notice('KanbanRPM Current Focus updated from Action index.');
  }

  async updateSmallActionMetadata(action: SmallAction, values: { scheduledDate: string; dueDate: string; priority: SmallAction['priority'] }): Promise<void> {
    const file = this.plugin.app.vault.getAbstractFileByPath(action.cardPath);
    if (!(file instanceof TFile)) return;

    const content = await this.plugin.app.vault.read(file);
    const lines = content.split(/\r?\n/);
    const index = action.lineNumber - 1;
    const line = lines[index];
    if (!line || line !== action.lineText) {
      new Notice('KanbanRPM could not safely update this small action. Refresh and try again.');
      return;
    }

    const scheduledDate = values.scheduledDate.trim();
    const dueDate = values.dueDate.trim();
    const priority = values.priority === 'medium' ? 'normal' : values.priority;
    const cleaned = line
      .replace(/\s*(?:\u{23F3}|@scheduled)\s*\d{4}-\d{2}-\d{2}/gu, '')
      .replace(/\s*(?:\u{1F4C5}|@due)\s*\d{4}-\d{2}-\d{2}/gu, '')
      .replace(/\s*@priority\s+(highest|high|medium|normal|low|lowest)\b/gi, '')
      .replace(/\s*[\u{23EB}\u{1F53C}\u{1F53D}\u{23EC}]/gu, '')
      .trimEnd();
    const priorityToken = this.smallActionPriorityToken(priority);
    const tokens = [
      scheduledDate ? `\u{23F3} ${scheduledDate}` : '',
      dueDate ? `\u{1F4C5} ${dueDate}` : '',
      priorityToken,
    ].filter(Boolean);
    lines[index] = tokens.length ? `${cleaned} ${tokens.join(' ')}` : cleaned;
    await this.plugin.app.vault.modify(file, lines.join('\n'));
    await this.plugin.refreshViews();
    new Notice('Small action metadata updated.');
  }

  private smallActionPriorityToken(priority: SmallAction['priority']): string {
    if (priority === 'highest') return '\u{23EB}';
    if (priority === 'high') return '\u{1F53C}';
    if (priority === 'low') return '\u{1F53D}';
    if (priority === 'lowest') return '\u{23EC}';
    return '';
  }

  async toggleSmallAction(action: SmallAction): Promise<void> {
    const file = this.plugin.app.vault.getAbstractFileByPath(action.cardPath);
    if (!(file instanceof TFile)) return;

    const content = await this.plugin.app.vault.read(file);
    const lines = content.split(/\r?\n/);
    const index = action.lineNumber - 1;
    const line = lines[index];
    if (!line || line !== action.lineText) {
      new Notice('KanbanRPM could not safely update this small action. Refresh and try again.');
      return;
    }

    const today = new Date();
    const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const nextLine = action.done
      ? line.replace(/^(\s*[-*]\s+)\[[xX]\]/, '$1[ ]').replace(/\s*(?:\u{2705}|\?\?|@done)\s*\d{4}-\d{2}-\d{2}/u, '')
      : line.replace(/^(\s*[-*]\s+)\[ \]/, '$1[x]') + (action.doneDate ? '' : ` \u2705 ${todayIso}`);

    lines[index] = nextLine;
    const nextContent = action.done ? lines.join('\n') : this.prependTimelineLog(lines.join('\n'), 'Small action', this.smallActionTimelineLog(action, file), todayIso);
    await this.plugin.app.vault.modify(file, nextContent);
    if (!action.done) {
      await this.appendDailyCompletedLog('small action', action.text, `Completed<br>Source: [[${file.basename}]]`);
    }
    await this.plugin.refreshViews();
  }

  async completeRoutine(cardPath: string, routineText: string, date: string): Promise<void> {
    const file = this.plugin.app.vault.getAbstractFileByPath(cardPath);
    if (!(file instanceof TFile)) return;
    const content = await this.plugin.app.vault.read(file);
    const entry = `| ${date} | ${routineText} |`;
    const next = this.prependRoutineLog(content, entry);
    if (next !== content) await this.plugin.app.vault.modify(file, next);
    await this.appendDailyCompletedLog('routine', routineText, `Completed<br>Source: [[${file.basename}]]`, date);
    new Notice(`Logged routine: ${routineText}`);
    await this.plugin.refreshViews();
  }

  async addPrecededBy(targetPath: string, sourceCard: ProjectCard): Promise<void> {
    const file = this.plugin.app.vault.getAbstractFileByPath(targetPath);
    if (!(file instanceof TFile)) return;
    if (targetPath === sourceCard.path) {
      new Notice('KanbanRPM cannot create a flow arrow to the same card.');
      return;
    }

    const content = await this.plugin.app.vault.read(file);
    const link = `[[${sourceCard.file.basename}]]`;
    const next = this.updateFlowList(content, 'Preceded by', link, 'add');
    if (next === content) {
      new Notice('KanbanRPM flow link already exists.');
      return;
    }

    await this.plugin.app.vault.modify(file, next);
    await this.plugin.refreshViews();
    new Notice(`KanbanRPM flow added: ${sourceCard.title} -> ${file.basename}`);
  }

  async removePrecededBy(targetPath: string, sourceCard: ProjectCard): Promise<void> {
    const file = this.plugin.app.vault.getAbstractFileByPath(targetPath);
    if (!(file instanceof TFile)) return;

    const content = await this.plugin.app.vault.read(file);
    const next = this.updateFlowList(content, 'Preceded by', `[[${sourceCard.file.basename}]]`, 'remove', sourceCard);
    if (next === content) {
      new Notice('KanbanRPM could not find that flow link.');
      return;
    }

    await this.plugin.app.vault.modify(file, next);
    await this.plugin.refreshViews();
    new Notice(`KanbanRPM flow removed: ${sourceCard.title} -> ${file.basename}`);
  }

  async promoteActionToBigAction(action: ActionItem): Promise<TFile> {
    const parentCard = (await this.loadCards()).find((card) => card.path === action.cardPath);
    const title = action.text.replace(/#todo\b/g, '').trim() || 'Promoted Big Action';
    const file = await this.createCard({
      title,
      type: 'big_action',
      project: parentCard?.primaryProject || (parentCard?.type === 'project' ? `[[${parentCard.file.basename}]]` : ''),
      subproject: parentCard?.primarySubproject || (parentCard?.type === 'subproject' ? `[[${parentCard.file.basename}]]` : ''),
      projects: parentCard?.projects.join('\n') ?? '',
      subprojects: parentCard?.subprojects.join('\n') ?? '',
      status: this.plugin.settings.statuses[0]?.id ?? 'inbox',
      priority: parentCard ? String(parentCard.priority) : '3',
      workstreamType: parentCard?.workstreamType ?? '',
      nextAction: title,
      waitingFor: '',
      blocker: '',
      startDate: '',
      scheduledDate: '',
      nextReview: '',
      dueDate: '',
      dependsOn: '',
      blocks: '',
      sourceNotes: `[[${action.sourceLabel}]]`,
    });
    new Notice(`Promoted action to Big Action: ${title}`);
    return file;
  }

  async archiveCard(card: ProjectCard): Promise<void> {
    await this.plugin.ensureWorkspace();
    const file = this.plugin.app.vault.getAbstractFileByPath(card.path);
    if (!(file instanceof TFile)) return;

    const archiveFolder = await this.getProjectArchiveFolder(card);
    await this.rewriteCardFrontmatter(file, (frontmatter) => {
      frontmatter.archived = true;
      frontmatter.archived_at = new Date().toISOString();
      frontmatter.archive_original_path = file.path;
      frontmatter.archive_owner_project = card.projectTitle || card.archiveOwnerProject || 'Unassigned';
    });

    const archivePath = this.getAvailablePath(archiveFolder, file.basename, file.extension);
    await this.plugin.app.fileManager.renameFile(file, archivePath);
    new Notice(`Archived KanbanRPM card: ${card.title}`);
    await this.plugin.refreshViews();
  }

  async unarchiveCard(card: ProjectCard): Promise<void> {
    await this.plugin.ensureWorkspace();
    const file = this.plugin.app.vault.getAbstractFileByPath(card.path);
    if (!(file instanceof TFile)) return;

    const targetPath = await this.getUnarchiveTargetPath(card, file);
    await this.ensureFolder(targetPath.split('/').slice(0, -1).join('/'));

    await this.rewriteCardFrontmatter(file, (frontmatter) => {
      delete frontmatter.archived;
      delete frontmatter.archived_at;
      delete frontmatter.archive_original_path;
      delete frontmatter.archive_owner_project;
    });

    await this.plugin.app.fileManager.renameFile(file, targetPath);
    new Notice(`Unarchived KanbanRPM card: ${card.title}`);
    await this.plugin.refreshViews();
  }

  async deleteCard(card: ProjectCard): Promise<void> {
    const file = this.plugin.app.vault.getAbstractFileByPath(card.path);
    if (!(file instanceof TFile)) return;

    await this.plugin.app.vault.trash(file, true);
    new Notice(`Deleted KanbanRPM card: ${card.title}`);
    await this.plugin.refreshViews();
  }

  async duplicateCard(card: ProjectCard): Promise<TFile | undefined> {
    const file = this.plugin.app.vault.getAbstractFileByPath(card.path);
    if (!(file instanceof TFile)) return undefined;

    const content = await this.plugin.app.vault.read(file);
    const { body } = splitFrontmatter(content);
    const cache = this.plugin.app.metadataCache.getFileCache(file);
    const frontmatter: Record<string, unknown> = { ...(cache?.frontmatter ?? {}) };
    const copyTitle = `${card.title} Copy`;

    delete frontmatter.position;
    delete frontmatter.order;
    delete frontmatter.archived;
    delete frontmatter.archived_at;
    delete frontmatter.archive_original_path;
    delete frontmatter.archive_owner_project;

    frontmatter.kanban_rpm = true;
    frontmatter.type = card.type;
    frontmatter.status = card.status;
    frontmatter.priority = card.priority;
    if (card.primaryProject) frontmatter.primary_project = card.primaryProject;
    else delete frontmatter.primary_project;
    if (card.primarySubproject) frontmatter.primary_subproject = card.primarySubproject;
    else delete frontmatter.primary_subproject;

    const copyFolder = file.parent?.path && file.parent.path.startsWith(this.plugin.cardsFolder) ? file.parent.path : this.plugin.cardsFolder;
    const copyPath = this.getAvailablePath(copyFolder, sanitizeFileName(copyTitle), file.extension);
    const copyContent = `---\n${stringifyYaml(frontmatter)}---\n${body.replace(/^#\s+.+$/m, `# ${copyTitle}`)}`;
    const newFile = await this.plugin.app.vault.create(copyPath, copyContent);

    new Notice(`Duplicated KanbanRPM card: ${copyTitle}`);
    await this.plugin.refreshViews();
    return newFile;
  }

  async collectActionIndex(cards: ProjectCard[]): Promise<ActionItem[]> {
    const items: ActionItem[] = [];
    const seen = new Set<string>();

    for (const card of cards) {
      const refs = [...card.sourceNotes];

      for (const ref of refs) {
        const source = this.resolveLinkedFile(ref, card.path);
        if (!(source instanceof TFile)) continue;

        const content = await this.plugin.app.vault.read(source);
        const lines = content.split(/\r?\n/);

        lines.forEach((line, index) => {
          if (/\[[xX-]\]/.test(line)) return;
          const checkbox = line.match(/^\s*[-*]\s+\[ \]\s+(.+)/);
          const todo = line.includes('#todo') ? line.trim().replace(/^\s*[-*]\s*/, '') : '';
          const raw = checkbox?.[1] ?? todo;
          if (!raw) return;

          const key = `${card.path}|${source.path}|${index}|${raw}`;
          if (seen.has(key)) return;
          seen.add(key);

          items.push({
            cardPath: card.path,
            cardTitle: card.title,
            sourcePath: source.path,
            sourceLabel: source.basename,
            lineNumber: index + 1,
            text: raw,
          });
        });
      }

      for (const item of card.routines) {
        const key = `${card.path}|routine|${item.cadence}|${item.text}`;
        if (seen.has(key)) continue;
        seen.add(key);
        items.push({
          cardPath: card.path,
          cardTitle: card.title,
          sourcePath: card.path,
          sourceLabel: card.file.basename,
          lineNumber: 0,
          text: `${item.text} ${routineScheduleLabel(item)}`,
          recurring: true,
        });
      }
    }

    return items;
  }

  validateCards(cards: ProjectCard[]): CardIssue[] {
    const issues: CardIssue[] = [];

    for (const card of cards) {
      const cache = this.plugin.app.metadataCache.getFileCache(card.file);
      const fm = cache?.frontmatter ?? {};
      const add = (level: CardIssueLevel, field: string, message: string) => {
        issues.push({
          cardPath: card.path,
          cardTitle: card.title,
          level,
          field,
          message,
        });
      };

      const cardType = text(fm.type);
      if (cardType && !['project', 'subproject', 'big_action'].includes(cardType)) {
        add('warning', 'type', `Expected project, subproject, or big_action; current value is "${cardType}".`);
      }
      const rawProjectState = text(fm.project_state).trim();
      if (rawProjectState && !['active', 'closed'].includes(rawProjectState.toLowerCase())) {
        add('warning', 'project_state', `project_state should be active or closed; current value is "${rawProjectState}".`);
      }
      if (card.type === 'subproject' && !card.projects.length) {
        add('warning', 'projects', 'Subproject documents should declare at least one project link.');
      }
      if (card.type === 'big_action') {
        if (!card.projects.length) add('warning', 'projects', 'Big Action documents should declare at least one project link.');
        if (!card.subprojects.length) add('warning', 'subprojects', 'Big Action documents should declare at least one subproject link.');
        if (card.primaryProject && card.primarySubproject) {
          const projectFile = this.resolveLinkedFile(card.primaryProject, card.path);
          const subprojectFile = this.resolveLinkedFile(card.primarySubproject, card.path);
          const projectCard = projectFile ? cards.find((item) => item.path === projectFile.path) : undefined;
          const subprojectCard = subprojectFile ? cards.find((item) => item.path === subprojectFile.path) : undefined;
          if (projectCard && subprojectCard && !subprojectCard.projectTitles.includes(projectCard.title)) {
            add('warning', 'hierarchy', `Subproject "${subprojectCard.title}" does not belong to Project "${projectCard.title}".`);
          }
        }
      }
      if (!this.plugin.settings.statuses.some((status) => status.id === text(fm.status))) {
        add('error', 'status', `Unknown status "${text(fm.status) || '(empty)'}"; card is shown in ${this.plugin.settings.statuses[0]?.label ?? 'Inbox'}.`);
      }

      const rawPriority = Number(fm.priority);
      if (!Number.isFinite(rawPriority) || rawPriority < 1 || rawPriority > 5 || Math.round(rawPriority) !== rawPriority) {
        add('warning', 'priority', `Priority should be an integer from 1 to 5; current value is "${text(fm.priority) || '(empty)'}".`);
      }

      const category = text(fm.workstream_type).trim();
      const configuredCategories = categoryIds(this.plugin.settings.categories);
      if (category && !configuredCategories.includes(category)) {
        add('warning', 'workstream_type', `category is not in the configured vocabulary: ${configuredCategories.join(', ')}.`);
      }

      const order = text(fm.order).trim();
      if (order && !Number.isFinite(Number(order))) add('warning', 'order', `order should be numeric; current value is "${order}".`);

      for (const [label, value] of [
        ['Start date', card.startDate],
        ['Scheduled date', card.scheduledDate],
        ['Next review', card.nextReview],
        ['Due date', card.dueDate],
      ]) {
        if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) add('warning', 'timeline', `${label} should use YYYY-MM-DD; current value is "${value}".`);
      }

      for (const routine of card.routines) {
        if (!routine.startDate) add('warning', 'routine', `Routine "${routine.text}" must include @start YYYY-MM-DD to appear on the Timeline.`);
        if (routine.cadence === 'custom' && (!Number.isFinite(routine.interval) || routine.interval < 1)) {
          add('warning', 'routine', `Routine "${routine.text}" has an invalid @every interval.`);
        }
      }

      const refs = [card.primaryProject, card.primarySubproject, ...card.projects, ...card.subprojects, ...card.sourceNotes].filter(Boolean);
      for (const ref of refs) {
        if (ref.includes('[[') && !this.resolveLinkedFile(ref, card.path)) {
          add('warning', 'links', `Could not resolve linked note ${ref}.`);
        }
      }

      for (const dependency of card.precededBy) {
        if (dependency.includes('[[') && !this.resolveLinkedFile(dependency, card.path)) {
          add('warning', 'dependencies', `Preceded by unresolved note ${dependency}.`);
        }
      }

      for (const blocked of card.followedBy) {
        if (blocked.includes('[[') && !this.resolveLinkedFile(blocked, card.path)) {
          add('warning', 'dependencies', `Followed by unresolved note ${blocked}.`);
        }
      }

      if (this.hasCircularDependency(card, cards)) add('warning', 'dependencies', 'Circular dependency detected.');
    }

    return issues.sort((a, b) => {
      if (a.level !== b.level) return a.level === 'error' ? -1 : 1;
      return a.cardTitle.localeCompare(b.cardTitle) || a.field.localeCompare(b.field);
    });
  }

  async writeManagementBrief(cards?: ProjectCard[]): Promise<void> {
    await this.plugin.ensureWorkspace();
    const sourceCards = cards ?? this.excludeClosedProjectCards(await this.loadCards());
    const content = this.renderManagementBrief(sourceCards);
    const existing = this.plugin.app.vault.getAbstractFileByPath(this.plugin.managementBriefPath);
    let file: TFile;
    if (existing instanceof TFile) {
      await this.plugin.app.vault.modify(existing, content);
      file = existing;
    } else {
      file = await this.plugin.app.vault.create(this.plugin.managementBriefPath, content);
    }
    new Notice('KanbanRPM management brief updated.');
    await this.plugin.app.workspace.getLeaf(false).openFile(file);
  }

  async writeLLMContext(cards?: ProjectCard[]): Promise<void> {
    await this.plugin.ensureWorkspace();
    await this.ensureFolder(this.plugin.llmFolder);
    await this.ensureFolder(this.plugin.llmProjectBriefsFolder);

    const sourceCards = cards ?? this.excludeClosedProjectCards(await this.loadCards());
    const sorted = [...sourceCards].sort(compareCards);
    const recentChanges = await this.collectRecentChanges(sorted, 14);
    const files = [
      await this.writeGeneratedFile(`${this.plugin.llmFolder}/00 LLM Entry.md`, this.renderLLMEntry()),
      await this.writeGeneratedFile(`${this.plugin.llmFolder}/01 Next Work Candidates.md`, this.renderLLMNextWorkCandidates(sorted)),
      await this.writeGeneratedFile(`${this.plugin.llmFolder}/02 Project Map.md`, this.renderLLMProjectMap(sorted)),
      await this.writeGeneratedFile(`${this.plugin.llmFolder}/03 Recent Changes.md`, this.renderLLMRecentChanges(recentChanges)),
      await this.writeGeneratedFile(`${this.plugin.llmFolder}/04 Open Loops.md`, this.renderLLMOpenLoops(sorted)),
    ];

    for (const project of sorted.filter((card) => card.type === 'project')) {
      const path = `${this.plugin.llmProjectBriefsFolder}/${sanitizeFileName(project.title)} Brief.md`;
      files.push(await this.writeGeneratedFile(path, this.renderLLMProjectBrief(project, sorted, recentChanges)));
    }

    new Notice(`KanbanRPM LLM context updated (${files.length} files).`);
    await this.plugin.app.workspace.getLeaf(false).openFile(files[0]);
  }

  private async writeGeneratedFile(path: string, content: string): Promise<TFile> {
    const normalized = normalizePath(path);
    await this.ensureFolder(normalized.split('/').slice(0, -1).join('/'));
    const existing = this.plugin.app.vault.getAbstractFileByPath(normalized);
    if (existing instanceof TFile) {
      await this.plugin.app.vault.modify(existing, content);
      return existing;
    }
    return this.plugin.app.vault.create(normalized, content);
  }

  private renderLLMEntry(): string {
    const today = todayIso();
    return `# KanbanRPM LLM Entry

Generated: ${today}

> [!kanban-rpm]
> Generated read model. Do not edit manually. KanbanRPM living documents remain the source of truth.

## Read Order

### Next work recommendation

1. [[01 Next Work Candidates]]
2. [[03 Recent Changes]]
3. Relevant files under [[Project Briefs]]
4. Open original living documents only when a recommendation needs more detail.

### Project/Subproject/Big Action briefing

1. Relevant Project Brief.
2. [[02 Project Map]]
3. [[03 Recent Changes]]
4. Original living document only if the brief is insufficient.

### Research or content planning

Do not rely on generated briefs alone. Read the user-specified living document and relevant references/wiki pages. Use generated files only for orientation.

## Output Rules For LLMs

- Separate PM state from research interpretation.
- Do not invent missing facts.
- When recommending next work, discuss urgency, dependency, cognitive load, and research value.
- When planning research content, cite which original note or wiki page supports the reasoning.
`;
  }

  private renderLLMNextWorkCandidates(cards: ProjectCard[]): string {
    const today = todayIso();
    const soon = addDays(today, 14);
    const candidates = cards
      .filter((card) => card.type !== 'project')
      .filter((card) => !card.archived && !this.isCompletionStatus(card.status) && card.status !== this.statusId('active'))
      .map((card) => ({ card, score: this.llmCandidateScore(card, cards, today, soon), reasons: this.llmCandidateReasons(card, cards, today, soon) }))
      .sort((a, b) => b.score - a.score || compareCards(a.card, b.card));

    const rows = candidates
      .map(({ card, score, reasons }) =>
        `| [[${card.file.basename}]] | ${this.cardTypeLogLabel(card.type)} | ${this.escapeTableCell(card.projectTitle || 'No project')} | ${this.escapeTableCell(card.subprojectTitle)} | ${this.statusLabel(card.status)} | P${card.priority} | ${score} | ${this.escapeTableCell(reasons.join('; ') || 'candidate for review')} | ${this.escapeTableCell(card.nextAction || '')} | ${this.escapeTableCell(this.cardDateSummary(card))} |`
      )
      .join('\n');

    return `# Next Work Candidates

Generated: ${today}

Use this file to discuss which non-active card should become active next. Excludes completed, closed, archived, and currently active cards.

Suggested prompt:

\`\`\`text
Read this candidate list and recommend 3 cards to activate next. Explain tradeoffs: urgency, importance, dependency state, cognitive load, and research value. Ask questions if the best choice depends on missing context.
\`\`\`

| Candidate | Type | Project | Subproject | Status | Priority | Score | Why candidate | Current focus | Dates |
| --- | --- | --- | --- | --- | ---: | ---: | --- | --- | --- |
${rows || '| No candidates |  |  |  |  |  |  |  |  |  |'}
`;
  }

  private renderLLMProjectMap(cards: ProjectCard[]): string {
    const today = todayIso();
    const projects = cards.filter((card) => card.type === 'project').sort(compareCards);
    const sections = projects.map((project) => {
      const children = cards.filter((card) => card.type !== 'project' && card.projectTitles.includes(project.title)).sort(compareCards);
      const subprojects = children.filter((card) => card.type === 'subproject');
      const actions = children.filter((card) => card.type === 'big_action');
      return `## [[${project.file.basename}]]

- Status: ${this.statusLabel(project.status)}
- State: ${project.projectState}
- Active subprojects: ${subprojects.filter((card) => card.status === this.statusId('active')).length}/${subprojects.length}
- Active big actions: ${actions.filter((card) => card.status === this.statusId('active')).length}/${actions.length}
- Waiting/blocking: ${children.filter((card) => card.waitingFor || card.blocker || card.blockedBy.length).length}

${children.length ? children.map((card) => `- [[${card.file.basename}]] (${this.cardTypeLogLabel(card.type)}, ${this.statusLabel(card.status)}, P${card.priority})${card.nextAction ? ` - ${card.nextAction}` : ''}`).join('\n') : '- No child cards.'}`;
    });

    return `# Project Map

Generated: ${today}

Compact hierarchy map for orientation. Use Project Briefs for richer PM context.

${sections.join('\n\n') || '- No projects.'}
`;
  }

  private renderLLMRecentChanges(changes: LLMRecentChange[]): string {
    const rows = changes
      .map((item) => `| ${item.date} | ${this.escapeTableCell(item.type)} | ${this.escapeTableCell(item.item)} | ${this.escapeTableCell(item.context)} | ${this.escapeTableCell(item.change)} | ${item.source} |`)
      .join('\n');
    return `# Recent Changes

Generated: ${todayIso()}

Recent completion/status/change log extracted from card Timeline Logs and daily timeline Completed Logs. Use this to avoid rereading every note.

| Date | Type | Item | Context | Change | Source |
| --- | --- | --- | --- | --- | --- |
${rows || '| No recent changes found |  |  |  |  |  |'}
`;
  }

  private renderLLMOpenLoops(cards: ProjectCard[]): string {
    const today = todayIso();
    const rows = cards
      .filter((card) => !this.isCompletionStatus(card.status))
      .filter((card) => card.waitingFor || card.blocker || card.blockedBy.length || !card.nextAction)
      .sort((a, b) => this.llmOpenLoopRank(b) - this.llmOpenLoopRank(a) || compareCards(a, b))
      .map((card) => `| [[${card.file.basename}]] | ${this.cardTypeLogLabel(card.type)} | ${this.statusLabel(card.status)} | P${card.priority} | ${this.escapeTableCell(card.waitingFor || '')} | ${this.escapeTableCell(card.blocker || card.blockedBy.join(', '))} | ${this.escapeTableCell(card.nextAction || '(missing)')} |`)
      .join('\n');

    return `# Open Loops

Generated: ${today}

Waiting, blocker, blocked-by, and missing-current-focus items for PM review.

| Card | Type | Status | Priority | Waiting | Blocker / blocked by | Current focus |
| --- | --- | --- | ---: | --- | --- | --- |
${rows || '| No open loops found |  |  |  |  |  |  |'}
`;
  }

  private renderLLMProjectBrief(project: ProjectCard, cards: ProjectCard[], changes: LLMRecentChange[]): string {
    const today = todayIso();
    const children = cards.filter((card) => card.type !== 'project' && card.projectTitles.includes(project.title)).sort(compareCards);
    const active = children.filter((card) => card.status === this.statusId('active'));
    const waiting = children.filter((card) => card.waitingFor || card.status === this.statusId('waiting'));
    const blocked = children.filter((card) => card.blocker || card.blockedBy.length || card.status === this.statusId('blocked'));
    const recent = changes.filter((item) => item.card && (item.card.path === project.path || item.card.projectTitles.includes(project.title))).slice(0, 20);
    const recentCompleted = recent.filter((item) => /complete|done|small action|routine|big action|subproject/i.test(`${item.type} ${item.change}`)).slice(0, 10);
    const staleWaiting = waiting.filter((card) => this.cardDormantDays(card, today) >= 14);
    const unresolvedBlockers = blocked
      .map((card) => ({ card, age: this.cardDormantDays(card, today) }))
      .sort((a, b) => b.age - a.age || compareCards(a.card, b.card));
    const attention = this.briefAttentionCards(children, today, addDays(today, 14)).slice(0, 8);
    const highPriorityActions = children.flatMap((card) =>
      card.smallActions
        .filter((action) => !action.done && ['highest', 'high'].includes(action.priority))
        .map((action) => `- [[${card.file.basename}]]: ${action.text}${action.dueDate || action.scheduledDate ? ` (${action.dueDate || action.scheduledDate})` : ''}`)
    );

    return `# ${project.title} Brief

Generated: ${todayIso()}

> [!kanban-rpm]
> Generated PM brief. Use for briefing and PM discussion. For research/content planning, open [[${project.file.basename}]] and relevant source/wiki notes.

## Identity

- Project: [[${project.file.basename}]]
- Status: ${this.statusLabel(project.status)}
- Project state: ${project.projectState}
- Current focus: ${project.nextAction || '(none)'}
- Dates: ${this.cardDateSummary(project) || '(none)'}

## Current Surface

| Metric | Count |
| --- | ---: |
| Child cards | ${children.length} |
| Active | ${active.length} |
| Waiting | ${waiting.length} |
| Blocked | ${blocked.length} |
| Open small actions | ${children.reduce((sum, card) => sum + card.smallActions.filter((action) => !action.done).length, 0)} |
| Active workload | ${active.length} |
| Stale waiting | ${staleWaiting.length} |
| Unresolved blockers | ${unresolvedBlockers.length} |

## Active Work

${active.length ? active.map((card) => this.renderBriefCardLine(card, true)).join('\n') : '- No active child cards.'}

## Recommended Attention

${attention.length ? attention.map((card) => this.renderBriefCardLine(card, true)).join('\n') : '- No immediate attention items.'}

## Waiting / Blocked

${[...waiting, ...blocked].length ? Array.from(new Map([...waiting, ...blocked].map((card) => [card.path, card])).values()).map((card) => this.renderBriefCardLine(card, true)).join('\n') : '- No waiting or blocked child cards.'}

## Stale Waiting

${staleWaiting.length ? staleWaiting.map((card) => `- [[${card.file.basename}]]: ${card.waitingFor || this.statusLabel(card.status)} (${this.cardDormantDays(card, today)}d since last modified)`).join('\n') : '- No stale waiting items.'}

## Unresolved Blockers

${unresolvedBlockers.length ? unresolvedBlockers.map(({ card, age }) => `- [[${card.file.basename}]]: ${card.blocker || card.blockedBy.join(', ')} (${age}d since last modified)`).join('\n') : '- No unresolved blockers.'}

## High-Priority Small Actions

${highPriorityActions.slice(0, 20).join('\n') || '- No high-priority small actions.'}

## Recently Completed

${recentCompleted.length ? recentCompleted.map((item) => `- ${item.date} ${item.item}: ${item.change}`).join('\n') : '- No recent completions found.'}

## Recent Changes

${recent.length ? recent.map((item) => `- ${item.date} ${item.item} (${item.type}): ${item.change}`).join('\n') : '- No recent changes found.'}

## Original Notes For Deep Planning

- Project living document: [[${project.file.basename}]]
- For research/content planning, read the relevant Subproject/Big Action living document directly instead of relying only on this generated brief.
`;
  }

  private llmCandidateScore(card: ProjectCard, cards: ProjectCard[], today: string, soon: string): number {
    let score = 0;
    score += Math.max(0, 6 - card.priority) * 10;
    if (card.status === this.statusId('inbox')) score += 8;
    if (card.status === this.statusId('waiting')) score += card.waitingFor ? 6 : 2;
    if (card.status === this.statusId('blocked') || card.blocker || card.blockedBy.length) score -= 20;
    if (card.scheduledDate && card.scheduledDate < today) score += 35;
    else if (card.scheduledDate && card.scheduledDate <= soon) score += 22;
    if (card.dueDate && card.dueDate < today) score += 30;
    else if (card.dueDate && card.dueDate <= soon) score += 18;
    if (card.nextReview && card.nextReview <= today) score += 16;
    if (card.nextAction) score += 12;
    if (!card.nextAction) score -= 8;
    if (card.projectTitle) score += 4;
    if (this.hasActiveParent(card, cards)) score += 10;
    const activeSiblings = this.activeSiblingCount(card, cards);
    if (activeSiblings === 0 && card.projectTitle) score += 8;
    if (activeSiblings >= 3) score -= (activeSiblings - 2) * 8;
    const dormantDays = this.cardDormantDays(card, today);
    if (dormantDays >= 30) score += 12;
    else if (dormantDays >= 14) score += 6;
    if (['research', 'experiment', 'analysis', 'writing'].includes(card.workstreamType)) score += 4;
    return score;
  }

  private llmCandidateReasons(card: ProjectCard, cards: ProjectCard[], today: string, soon: string): string[] {
    const reasons: string[] = [];
    if (card.priority <= 2) reasons.push('high priority');
    if (card.scheduledDate && card.scheduledDate < today) reasons.push('scheduled overdue');
    else if (card.scheduledDate && card.scheduledDate <= soon) reasons.push('scheduled soon');
    if (card.dueDate && card.dueDate < today) reasons.push('due overdue');
    else if (card.dueDate && card.dueDate <= soon) reasons.push('due soon');
    if (card.nextReview && card.nextReview <= today) reasons.push('review due');
    if (card.nextAction) reasons.push('clear current focus');
    else reasons.push('needs current focus clarification');
    if (card.waitingFor) reasons.push(`waiting: ${card.waitingFor}`);
    if (card.blocker || card.blockedBy.length) reasons.push('blocked; discuss before activation');
    if (this.hasActiveParent(card, cards)) reasons.push('parent is active');
    const activeSiblings = this.activeSiblingCount(card, cards);
    if (activeSiblings === 0 && card.projectTitle) reasons.push('no active sibling in project');
    if (activeSiblings >= 3) reasons.push(`project already has ${activeSiblings} active siblings`);
    const dormantDays = this.cardDormantDays(card, today);
    if (dormantDays >= 14) reasons.push(`dormant ${dormantDays}d`);
    if (['research', 'experiment', 'analysis', 'writing'].includes(card.workstreamType)) reasons.push(`research category: ${card.workstreamType}`);
    return reasons;
  }

  private hasActiveParent(card: ProjectCard, cards: ProjectCard[]): boolean {
    if (card.type === 'subproject') {
      return this.parentActive(card.projectTitle, 'project', cards);
    }
    if (card.type === 'big_action') {
      return this.parentActive(card.subprojectTitle, 'subproject', cards) || this.parentActive(card.projectTitle, 'project', cards);
    }
    return false;
  }

  private parentActive(title: string, type: ProjectCard['type'], cards: ProjectCard[]): boolean {
    if (!title) return false;
    const card = cards.find((item) => item.type === type && item.title === title);
    return Boolean(card && card.status === this.statusId('active'));
  }

  private activeSiblingCount(card: ProjectCard, cards: ProjectCard[]): number {
    return cards.filter((item) => {
      if (item.path === card.path || item.type === 'project' || item.status !== this.statusId('active')) return false;
      if (card.type === 'big_action' && card.subprojectTitle) return item.subprojectTitles.includes(card.subprojectTitle);
      if (card.projectTitle) return item.projectTitles.includes(card.projectTitle);
      return false;
    }).length;
  }

  private cardDormantDays(card: ProjectCard, today: string): number {
    const modified = formatDate(new Date(card.file.stat.mtime));
    return Math.max(0, daysBetween(modified, today));
  }

  private llmOpenLoopRank(card: ProjectCard): number {
    let rank = 0;
    if (card.blocker || card.blockedBy.length) rank += 30;
    if (card.waitingFor) rank += 20;
    if (!card.nextAction) rank += 10;
    rank += Math.max(0, 6 - card.priority);
    return rank;
  }

  private cardDateSummary(card: ProjectCard): string {
    return [
      card.startDate ? `start ${card.startDate}` : '',
      card.scheduledDate ? `scheduled ${card.scheduledDate}` : '',
      card.dueDate ? `due ${card.dueDate}` : '',
      card.nextReview ? `review ${card.nextReview}` : '',
    ].filter(Boolean).join(', ');
  }

  private async collectRecentChanges(cards: ProjectCard[], days: number): Promise<LLMRecentChange[]> {
    const minDate = addDays(todayIso(), -days);
    const changes: LLMRecentChange[] = [];
    for (const card of cards) {
      const file = this.plugin.app.vault.getAbstractFileByPath(card.path);
      if (!(file instanceof TFile)) continue;
      const content = await this.plugin.app.vault.read(file);
      const section = findHeadingSection(content, 'Timeline Log');
      if (!section) continue;
      const body = content.slice(section.bodyStart, section.end);
      for (const line of body.split(/\r?\n/)) {
        const cells = parseMarkdownTableRow(line);
        if (!cells || cells.length < 3 || cells[0].toLowerCase() === 'date' || cells[0].startsWith('---')) continue;
        if (cells[0] < minDate) continue;
        changes.push({
          date: cells[0],
          type: cells[1] ?? '',
          card,
          item: `[[${card.file.basename}]]`,
          context: card.breadcrumb || card.title,
          change: cells[2] ?? '',
          source: 'card',
        });
      }
    }
    changes.push(...await this.collectDailyCompletedLogs(cards, minDate));
    return changes.sort((a, b) => b.date.localeCompare(a.date) || a.item.localeCompare(b.item)).slice(0, 120);
  }

  private async collectDailyCompletedLogs(cards: ProjectCard[], minDate: string): Promise<LLMRecentChange[]> {
    const folder = normalizePath(`${this.plugin.workspaceFolder}/timeline`);
    const byTitle = new Map(cards.map((card) => [card.file.basename, card]));
    const changes: LLMRecentChange[] = [];
    for (const file of this.plugin.app.vault.getMarkdownFiles()) {
      if (!file.path.startsWith(`${folder}/`)) continue;
      const date = file.basename;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < minDate) continue;
      const content = await this.plugin.app.vault.read(file);
      const section = findHeadingSection(content, 'Completed Log');
      if (!section) continue;
      const body = content.slice(section.bodyStart, section.end);
      for (const line of body.split(/\r?\n/)) {
        const cells = parseMarkdownTableRow(line);
        if (!cells || cells.length < 4 || cells[0].toLowerCase() === 'time' || cells[0].startsWith('---')) continue;
        const item = cells[2] ?? '';
        const linkedTitle = getWikiLinkTarget(item);
        const card = linkedTitle ? byTitle.get(linkedTitle) : undefined;
        changes.push({
          date: `${date} ${cells[0]}`,
          type: cells[1] ?? '',
          card,
          item,
          context: card?.breadcrumb || card?.title || '',
          change: cells[3] ?? '',
          source: 'daily',
        });
      }
    }
    return changes;
  }

  resolveLinkedFile(link: string, sourcePath: string): TFile | null {
    const target = getWikiLinkTarget(link);
    if (!target) return null;

    const linked = this.plugin.app.metadataCache.getFirstLinkpathDest(target, sourcePath);
    if (linked instanceof TFile) return linked;

    const normalized = normalizePath(target.endsWith('.md') ? target : `${target}.md`);
    const direct = this.plugin.app.vault.getAbstractFileByPath(normalized);
    return direct instanceof TFile ? direct : null;
  }

  private renderManagementBrief(cards: ProjectCard[]): string {
    const sorted = [...cards].sort(compareCards);
    const today = todayIso();
    const soon = addDays(today, 14);
    const boardCards = sorted.filter((card) => card.type !== 'project');
    const projectCards = sorted.filter((card) => card.type === 'project');
    const statusCounts = this.plugin.settings.statuses
      .map((status) => `| ${status.label} | ${cards.filter((card) => card.status === status.id).length} |`)
      .join('\n');
    const warningRows = this.validateCards(cards)
      .slice(0, 30)
      .map((issue) => `- ${issue.level.toUpperCase()} [[${issue.cardTitle}]]: ${issue.message}`)
      .join('\n');
    const dueSoon = boardCards
      .filter((card) => (card.scheduledDate && card.scheduledDate <= soon) || (card.dueDate && card.dueDate <= soon) || (card.nextReview && card.nextReview <= soon))
      .sort((a, b) => (a.scheduledDate || a.dueDate || a.nextReview || '').localeCompare(b.scheduledDate || b.dueDate || b.nextReview || '') || a.title.localeCompare(b.title));
    const waiting = boardCards.filter((card) => card.waitingFor || card.status === this.statusId('waiting')).sort(compareCards);
    const blocked = boardCards.filter((card) => card.blocker || card.blockedBy.length || card.status === this.statusId('blocked')).sort(compareCards);
    const routines = boardCards.flatMap((card) => card.routines.map((routine) => ({ card, routine })));
    const smallActionCount = boardCards.reduce((sum, card) => sum + card.smallActions.filter((action) => !action.done).length, 0);
    const attentionCards = this.briefAttentionCards(boardCards, today, soon);
    const projectHealthRows = this.renderBriefProjectHealthRows(projectCards, boardCards);
    const nextActionRows = this.renderBriefNextActionRows(boardCards);
    const openSmallActions = this.renderBriefSmallActionRows(boardCards, today, soon);
    const recentResearchLogs = this.renderBriefResearchLogRows(boardCards);

    return `# KanbanRPM Management Brief

Generated: ${today}

> [!kanban-rpm]
> This file is generated by KanbanRPM. It is designed as a compact project-management brief for human review and LLM-assisted planning.

## How To Use With An LLM

Ask for advice against this brief first. If more detail is needed, open the linked living documents.

Suggested prompt:

\`\`\`text
Read this KanbanRPM Management Brief as my research project-management context.
Identify the highest-risk blockers, stale waiting items, upcoming deadlines/reviews, and the next 3-5 actions I should focus on.
Do not invent missing facts; point to the linked cards that need more information.
\`\`\`

## Snapshot

| Metric | Count |
| --- | ---: |
| Projects | ${projectCards.length} |
| Subprojects | ${cards.filter((card) => card.type === 'subproject').length} |
| Big Actions | ${cards.filter((card) => card.type === 'big_action').length} |
| Attention cards | ${attentionCards.length} |
| Open small actions | ${smallActionCount} |
| Routines | ${routines.length} |
| Data warnings | ${this.validateCards(cards).length} |

## Executive Attention

${attentionCards.length ? attentionCards.slice(0, 12).map((card) => this.renderBriefCardLine(card, true)).join('\n') : '- No urgent attention cards.'}

## Project Health

| Project | Active | Waiting | Blocked | Done | Open actions | Next date |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
${projectHealthRows || '| No project | 0 | 0 | 0 | 0 | 0 | |'}

## Status Counts

| Status | Count |
| --- | ---: |
${statusCounts}

## Projects

${this.renderBriefProjectSections(sorted)}

## Upcoming Dates

${dueSoon.length ? dueSoon.map((card) => this.renderBriefCardLine(card, true)).join('\n') : '- No due/review dates in the next 14 days.'}

## Current Focus

${nextActionRows || '- No explicit current focus items.'}

## Open Small Actions

${openSmallActions || '- No dated or high-priority small actions.'}

## Waiting

${waiting.length ? waiting.map((card) => this.renderBriefCardLine(card, true)).join('\n') : '- No waiting cards.'}

## Blocked

${blocked.length ? blocked.map((card) => this.renderBriefCardLine(card, true)).join('\n') : '- No blocked cards.'}

## Flow Risks

${this.renderBriefFlowRisks(boardCards)}

## Routines

${routines.length ? routines.map(({ card, routine }) => `- [[${card.file.basename}]]: ${routine.text} (${routineScheduleLabel(routine)})`).join('\n') : '- No routines.'}

## Recent Research Logs

${recentResearchLogs || '- No research log rows found.'}

## Data Warnings

${warningRows || '- No data warnings.'}
`;
  }

  private renderBriefProjectSections(cards: ProjectCard[]): string {
    const projects = cards.filter((card) => card.type === 'project').sort(compareCards);
    const loose = cards.filter((card) => card.type !== 'project' && !card.projectTitle);
    const sections = projects.map((project) => {
      const children = cards
        .filter((card) => card.type !== 'project' && card.projectTitles.includes(project.title))
        .sort(compareCards);
      return `### ${project.title}

- Document: [[${project.file.basename}]]
- Status: ${this.statusLabel(project.status)}
- Current focus: ${project.nextAction || '(none)'}

${children.length ? children.map((card) => this.renderBriefCardLine(card, true)).join('\n') : '- No active child cards.'}`;
    });
    if (loose.length) {
      sections.push(`### No Project

${loose.map((card) => this.renderBriefCardLine(card, true)).join('\n')}`);
    }
    return sections.join('\n\n') || '- No projects.';
  }

  private renderBriefCardLine(card: ProjectCard, includeContext: boolean): string {
    const context = includeContext ? ` ${card.breadcrumb ? `(${card.breadcrumb})` : ''}` : '';
    const bits = [
      this.statusLabel(card.status),
      `P${card.priority}`,
      card.workstreamType ? `category: ${categoryLabel(this.plugin.settings.categories, card.workstreamType)}` : '',
      card.scheduledDate ? `scheduled: ${card.scheduledDate}` : '',
      card.dueDate ? `due: ${card.dueDate}` : '',
      card.nextReview ? `review: ${card.nextReview}` : '',
      card.blockedBy.length ? `blocked by: ${card.blockedBy.join(', ')}` : '',
    ].filter(Boolean);
    const focus = card.nextAction ? ` - ${card.nextAction}` : '';
    return `- [[${card.file.basename}]]${context}: ${bits.join(', ')}${focus}`;
  }

  private renderBriefFlowRisks(cards: ProjectCard[]): string {
    const risks = cards
      .filter((card) => card.blockedBy.length || card.precededBy.length)
      .sort((a, b) => b.blockedBy.length - a.blockedBy.length || a.title.localeCompare(b.title))
      .slice(0, 30);
    if (!risks.length) return '- No flow risks.';
    return risks.map((card) => this.renderBriefCardLine(card, true)).join('\n');
  }

  private briefAttentionCards(cards: ProjectCard[], today: string, soon: string): ProjectCard[] {
    return cards
      .filter((card) => {
        if (this.isCompletionStatus(card.status)) return false;
        if (card.status === this.statusId('blocked') || card.blocker || card.blockedBy.length) return true;
        if (card.status === this.statusId('waiting') || card.waitingFor) return true;
        if (card.scheduledDate && card.scheduledDate <= soon) return true;
        if (card.dueDate && card.dueDate <= soon) return true;
        if (card.nextReview && card.nextReview <= today) return true;
        if (card.priority <= 2 && card.nextAction) return true;
        return false;
      })
      .sort((a, b) => this.briefAttentionScore(b, today, soon) - this.briefAttentionScore(a, today, soon) || compareCards(a, b));
  }

  private briefAttentionScore(card: ProjectCard, today: string, soon: string): number {
    let score = 0;
    if (card.status === this.statusId('blocked') || card.blocker) score += 50;
    score += card.blockedBy.length * 12;
    if (card.status === this.statusId('waiting') || card.waitingFor) score += 24;
    if (card.scheduledDate && card.scheduledDate < today) score += 42;
    else if (card.scheduledDate && card.scheduledDate <= soon) score += 24;
    if (card.dueDate && card.dueDate < today) score += 40;
    else if (card.dueDate && card.dueDate <= soon) score += 22;
    if (card.nextReview && card.nextReview <= today) score += 18;
    score += Math.max(0, 6 - card.priority) * 4;
    if (!card.nextAction && !this.isCompletionStatus(card.status)) score += 8;
    return score;
  }

  private renderBriefProjectHealthRows(projects: ProjectCard[], boardCards: ProjectCard[]): string {
    const projectTitles = new Set<string>(projects.map((project) => project.title));
    for (const card of boardCards) {
      if (!card.projectTitles.length) projectTitles.add('No Project');
      for (const title of card.projectTitles) projectTitles.add(title);
    }

    return Array.from(projectTitles)
      .sort((a, b) => a.localeCompare(b))
      .map((title) => {
        const children = title === 'No Project' ? boardCards.filter((card) => !card.projectTitles.length) : boardCards.filter((card) => card.projectTitles.includes(title));
        const active = children.filter((card) => card.status === this.statusId('active')).length;
        const waiting = children.filter((card) => card.status === this.statusId('waiting') || card.waitingFor).length;
        const blocked = children.filter((card) => card.status === this.statusId('blocked') || card.blocker || card.blockedBy.length).length;
        const done = children.filter((card) => this.isCompletionStatus(card.status)).length;
        const openActions = children.reduce((sum, card) => sum + card.smallActions.filter((action) => !action.done).length, 0);
        const nextDate = children
          .flatMap((card) => [card.scheduledDate, card.dueDate, card.nextReview].filter(Boolean))
          .sort()[0] ?? '';
        const project = projects.find((card) => card.title === title);
        const label = project ? `[[${project.file.basename}]]` : title;
        return `| ${label} | ${active} | ${waiting} | ${blocked} | ${done} | ${openActions} | ${nextDate} |`;
      })
      .join('\n');
  }

  private renderBriefNextActionRows(cards: ProjectCard[]): string {
    const rows = cards
      .filter((card) => !this.isCompletionStatus(card.status) && card.nextAction)
      .sort((a, b) => a.priority - b.priority || compareCards(a, b))
      .slice(0, 20)
      .map((card) => this.renderBriefCardLine(card, true));
    return rows.join('\n');
  }

  private renderBriefSmallActionRows(cards: ProjectCard[], today: string, soon: string): string {
    const actions = cards
      .flatMap((card) =>
        card.smallActions
          .filter((action) => !action.done)
          .filter((action) => action.dueDate || action.scheduledDate || ['highest', 'high'].includes(action.priority))
          .map((action) => ({ card, action }))
      )
      .sort((a, b) => this.briefActionDate(a.action).localeCompare(this.briefActionDate(b.action)) || a.card.title.localeCompare(b.card.title))
      .slice(0, 25);
    if (!actions.length) return '';
    return actions
      .map(({ card, action }) => {
        const date = this.briefActionDate(action);
        const timing = date && date < today ? 'overdue' : date && date <= soon ? 'soon' : date || 'undated';
        return `- [[${card.file.basename}]] (${card.breadcrumb || card.title}): ${action.text}${date ? ` - ${date}` : ''} ${timing !== 'undated' ? `(${timing})` : ''}`;
      })
      .join('\n');
  }

  private briefActionDate(action: SmallAction): string {
    return action.dueDate || action.scheduledDate || '9999-99-99';
  }

  private renderBriefResearchLogRows(cards: ProjectCard[]): string {
    const logs = cards
      .flatMap((card) => card.researchLogs.map((log) => ({ card, log })))
      .sort((a, b) => b.log.date.localeCompare(a.log.date) || a.log.module.localeCompare(b.log.module))
      .slice(0, 12);
    if (!logs.length) return '';
    return logs
      .map(({ card, log }) => `- ${log.date} [[${card.file.basename}]]: ${log.kind}, ${log.module || '(module)'}, ${log.subject || '(subject)'} - ${log.result || '(no result)'}`)
      .join('\n');
  }

  private statusId(preferredId: string): Status {
    return this.plugin.settings.statuses.find((status) => status.id === preferredId)?.id ?? preferredId;
  }

  private normalizeProjectState(value: unknown): 'active' | 'closed' {
    return text(value).trim().toLowerCase() === 'closed' ? 'closed' : 'active';
  }

  private excludeClosedProjectCards(cards: ProjectCard[]): ProjectCard[] {
    const closedProjects = new Set(cards.filter((card) => card.type === 'project' && card.projectState === 'closed').map((card) => card.title));
    return cards.filter((card) => {
      if (card.type === 'project') return card.projectState !== 'closed';
      if (!card.projectTitles.length) return true;
      return !card.projectTitles.some((title) => closedProjects.has(title)) || !card.projectTitles.every((title) => closedProjects.has(title));
    });
  }

  private statusLabel(statusId: string): string {
    return this.plugin.settings.statuses.find((status) => status.id === statusId)?.label ?? statusId;
  }

  computeOrder(laneCards: ProjectCard[], insertIndex: number): number {
    const previous = laneCards[insertIndex - 1];
    const next = laneCards[insertIndex];
    const prevOrder = previous?.order ?? insertIndex * 1000;
    const nextOrder = next?.order ?? (insertIndex + 2) * 1000;

    if (previous && next && prevOrder < nextOrder) return Math.round((prevOrder + nextOrder) / 2);
    if (!previous && next && nextOrder > 1) return Math.round(nextOrder / 2);
    return prevOrder + 1000;
  }

  private getAvailablePath(folder: string, baseName: string, extension: string): string {
    let index = 1;
    let path = normalizePath(`${folder}/${baseName}.${extension}`);

    while (this.plugin.app.vault.getAbstractFileByPath(path)) {
      index += 1;
      path = normalizePath(`${folder}/${baseName} ${index}.${extension}`);
    }

    return path;
  }

  private getAvailablePathForExistingFile(currentPath: string, folder: string, baseName: string, extension: string): string {
    let index = 1;
    let path = normalizePath(`${folder}/${baseName}.${extension}`);
    const normalizedCurrent = normalizePath(currentPath);

    while (true) {
      const existing = this.plugin.app.vault.getAbstractFileByPath(path);
      if (!existing || normalizePath(existing.path) === normalizedCurrent) return path;
      index += 1;
      path = normalizePath(`${folder}/${baseName} ${index}.${extension}`);
    }
  }

  private async syncHierarchyAfterCardUpdate(
    card: ProjectCard,
    values: NewCardValues,
    cardsBeforeUpdate: ProjectCard[],
    oldPath: string,
    newPath: string,
    oldBaseName: string,
    newBaseName: string,
  ): Promise<void> {
    if (this.pathParts(oldPath).includes('archive') || this.pathParts(newPath).includes('archive')) return;
    if (values.type !== 'project' && values.type !== 'subproject') return;

    const oldFolder = card.type === 'project'
      ? normalizePath(`${this.plugin.cardsFolder}/${sanitizeFileName(oldBaseName)}`)
      : normalizePath(`${this.folderPathFromFilePath(oldPath)}/${sanitizeFileName(oldBaseName)}`);
    const newFolder = values.type === 'project'
      ? normalizePath(`${this.plugin.cardsFolder}/${sanitizeFileName(newBaseName)}`)
      : normalizePath(`${this.folderPathFromFilePath(newPath)}/${sanitizeFileName(newBaseName)}`);

    await this.moveHierarchyFolderIfNeeded(oldFolder, newFolder);

    if (values.type === 'subproject') {
      await this.updateSubprojectChildrenHierarchy(card, values, cardsBeforeUpdate, oldPath, oldFolder, newFolder, newBaseName);
    }
  }

  private async moveHierarchyFolderIfNeeded(oldFolder: string, newFolder: string): Promise<void> {
    if (oldFolder === newFolder) {
      await this.ensureFolder(newFolder);
      return;
    }

    const folder = this.plugin.app.vault.getAbstractFileByPath(oldFolder);
    if (!(folder instanceof TFolder)) {
      await this.ensureFolder(newFolder);
      return;
    }

    const existing = this.plugin.app.vault.getAbstractFileByPath(newFolder);
    if (existing) {
      new Notice(`KanbanRPM skipped folder move because target already exists: ${newFolder}`);
      return;
    }

    await this.ensureFolder(this.folderPathFromFilePath(newFolder));
    await this.plugin.app.fileManager.renameFile(folder, newFolder);
  }

  private async updateSubprojectChildrenHierarchy(
    card: ProjectCard,
    values: NewCardValues,
    cardsBeforeUpdate: ProjectCard[],
    oldPath: string,
    oldFolder: string,
    newFolder: string,
    newBaseName: string,
  ): Promise<void> {
    const newProject = values.project.trim();
    if (!newProject) return;

    const oldProjectCandidates = this.linkMatchCandidates([card.primaryProject, card.project, ...card.projects]);
    const oldSubprojectCandidates = this.linkMatchCandidates([
      `[[${this.fileBaseNameFromPath(oldPath)}]]`,
      `[[${card.title}]]`,
      oldPath,
      card.title,
    ]);
    const newSubproject = `[[${newBaseName}]]`;
    const oldFolderPrefix = `${normalizePath(oldFolder)}/`;
    const newFolderPrefix = `${normalizePath(newFolder)}/`;

    const children = cardsBeforeUpdate.filter((item) => {
      if (item.type !== 'big_action') return false;
      if (normalizePath(item.path).startsWith(oldFolderPrefix)) return true;
      return [item.primarySubproject, item.subproject, ...item.subprojects].some((link) => this.linkMatchesAny(link, oldSubprojectCandidates));
    });

    for (const child of children) {
      const normalizedPath = normalizePath(child.path);
      const expectedPath = normalizedPath.startsWith(oldFolderPrefix)
        ? normalizePath(`${newFolderPrefix}${normalizedPath.slice(oldFolderPrefix.length)}`)
        : normalizedPath;
      const target = this.plugin.app.vault.getAbstractFileByPath(expectedPath)
        ?? this.plugin.app.vault.getAbstractFileByPath(normalizedPath);
      if (!(target instanceof TFile)) continue;

      await this.updateCardFrontmatter(target, {
        primary_project: newProject,
        primary_subproject: newSubproject,
        projects: this.replaceHierarchyLink(child.projects, oldProjectCandidates, newProject),
        subprojects: this.replaceHierarchyLink(child.subprojects, oldSubprojectCandidates, newSubproject),
      }, false);
    }
  }

  private replaceHierarchyLink(links: string[], oldCandidates: Set<string>, replacement: string): string[] {
    return this.uniqueLinks([replacement, ...links.filter((link) => !this.linkMatchesAny(link, oldCandidates))]);
  }

  private linkMatchesAny(link: string, candidates: Set<string>): boolean {
    if (!link) return false;
    return Array.from(this.linkMatchCandidates([link])).some((candidate) => candidates.has(candidate));
  }

  private linkMatchCandidates(links: string[]): Set<string> {
    const candidates = new Set<string>();
    for (const link of links.map((item) => item.trim()).filter(Boolean)) {
      const target = getWikiLinkTarget(link) || link;
      const normalizedTarget = normalizePath(target).replace(/\.md$/i, '');
      const base = normalizedTarget.split('/').pop() || normalizedTarget;
      candidates.add(link);
      candidates.add(target);
      candidates.add(normalizedTarget);
      candidates.add(base);
      candidates.add(sanitizeFileName(base));
    }
    return candidates;
  }

  private getEffectiveFrontmatter(content: string): Record<string, unknown> {
    const parsed = this.collectLeadingFrontmatter(content);
    return parsed.frontmatters.reduce<Record<string, unknown>>((merged, frontmatter) => ({ ...merged, ...frontmatter }), {});
  }

  private async rewriteCardFrontmatter(file: TFile, update: (frontmatter: Record<string, unknown>) => void): Promise<void> {
    const content = await this.plugin.app.vault.read(file);
    const parsed = this.collectLeadingFrontmatter(content);
    const frontmatter = parsed.frontmatters.reduce<Record<string, unknown>>((merged, item) => ({ ...merged, ...item }), {});
    update(frontmatter);
    const body = content.slice(parsed.bodyStart).replace(/^\uFEFF?/, '');
    await this.plugin.app.vault.modify(file, `---\n${stringifyYaml(frontmatter)}---\n${body}`);
  }

  private collectLeadingFrontmatter(content: string): { frontmatters: Record<string, unknown>[]; bodyStart: number } {
    const frontmatters: Record<string, unknown>[] = [];
    let cursor = 0;

    while (cursor < content.length) {
      const remaining = content.slice(cursor).replace(/^\s+/, '');
      const skipped = content.slice(cursor).length - remaining.length;
      const match = remaining.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
      if (!match) break;

      try {
        const parsed = parseYaml(match[1]) ?? {};
        if (parsed && typeof parsed === 'object') frontmatters.push(parsed);
      } catch {
        break;
      }
      cursor += skipped + match[0].length;
    }

    return { frontmatters, bodyStart: cursor };
  }

  private getCommunicationSourceTemplate(values: CommunicationSourceValues, participants: string[]): string {
    return `---\nkanban_rpm: true\ntype: communication\ncommunication_type: ${yamlScalar(values.type)}\ndate: ${yamlScalar(values.date)}\nparticipants: ${yamlArray(participants)}\nnote: ${yamlScalar(values.note.trim())}\n---\n\n# Summary\n%% What was discussed in 3-5 bullets. %%\n\n# Decisions\n%% Record concrete decisions and why they were made. %%\n\n# Follow-up Actions\n%% Keep action items as checkboxes. Link or copy important ones into KanbanRPM cards manually. %%\n\n- [ ] \n\n# Context\n%% Add background, links, email/thread references, or meeting context. %%\n\n# Raw Notes\n%% Paste or write raw notes here. %%\n`;
  }

  private async prependCommunicationLogRow(file: TFile, values: CommunicationSourceValues, participants: string[]): Promise<void> {
    const logFile = await this.getCommunicationLogFile(this.communicationYear(values.date));
    const content = await this.plugin.app.vault.read(logFile);
    const type = this.communicationTypeDefinition(values.type);
    const row = `| ${this.escapeTableCell(values.date)} | [[${this.escapeTableCell(file.basename)}]] | ${this.escapeTableCell(participants.join(', '))} | ${this.escapeTableCell(values.note)} |`;
    const next = this.prependCommunicationRow(content, type.label, row);
    await this.plugin.app.vault.modify(logFile, next);
  }

  private async getCommunicationLogFile(year: string): Promise<TFile> {
    const path = normalizePath(`${this.plugin.communicationsFolder}/Communication Log (${year}).md`);
    const existing = this.plugin.app.vault.getAbstractFileByPath(path);
    if (existing instanceof TFile) return existing;
    await this.ensureFolder(this.plugin.communicationsFolder);
    return this.plugin.app.vault.create(path, this.getCommunicationLogTemplate(year));
  }

  private getCommunicationLogTemplate(year: string): string {
    const sections = COMMUNICATION_TYPES
      .map((type) => `## ${type.label}\n\n| Date | Source Note | Participants | Note |\n| --- | --- | --- | --- |`)
      .join('\n\n');
    return `# Communication Log (${year})\n\n${sections}\n`;
  }

  private prependCommunicationRow(content: string, sectionTitle: string, row: string): string {
    const tableHeader = '| Date | Source Note | Participants | Note |\n| --- | --- | --- | --- |';
    const existing = findHeadingSection(content, sectionTitle);
    if (!existing) return replaceSection(content, sectionTitle, `${tableHeader}\n${row}`);

    const body = content.slice(existing.bodyStart, existing.end).trim();
    const normalized = body.includes('| Date | Source Note | Participants | Note |') ? body : `${tableHeader}\n${body}`;
    const lines = normalized.split(/\r?\n/);
    const insertIndex = lines.findIndex((line) => /^\|\s*---/.test(line));
    if (insertIndex >= 0) lines.splice(insertIndex + 1, 0, row);
    else lines.unshift(row);
    return `${content.slice(0, existing.bodyStart)}\n\n${lines.join('\n')}\n${content.slice(existing.end)}`;
  }

  private communicationYear(date: string): string {
    return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date.slice(0, 4) : todayIso().slice(0, 4);
  }

  private communicationTypeDefinition(id: CommunicationSourceValues['type']): typeof COMMUNICATION_TYPES[number] {
    return COMMUNICATION_TYPES.find((type) => type.id === id) ?? COMMUNICATION_TYPES[0];
  }

  private async getCreationFolder(values: NewCardValues): Promise<string> {
    const parts = [this.plugin.cardsFolder];
    if (values.type === 'subproject' || values.type === 'big_action') {
      parts.push(this.folderNameFromLink(values.project));
    }
    if (values.type === 'big_action') {
      parts.push(this.folderNameFromLink(values.subproject));
    }

    const folder = normalizePath(parts.filter(Boolean).join('/'));
    await this.ensureFolder(folder);
    return folder;
  }

  private async getProjectArchiveFolder(card: ProjectCard): Promise<string> {
    const owner = sanitizeFileName(card.projectTitle || getWikiLinkTarget(card.primaryProject) || card.archiveOwnerProject || 'Unassigned');
    const folder = normalizePath(`${this.plugin.cardsFolder}/${owner}/archive`);
    await this.ensureFolder(folder);
    return folder;
  }

  private async getUnarchiveTargetPath(card: ProjectCard, file: TFile): Promise<string> {
    if (card.archiveOriginalPath) {
      const originalPath = normalizePath(card.archiveOriginalPath);
      const folder = originalPath.split('/').slice(0, -1).join('/');
      const basename = originalPath.split('/').pop()?.replace(/\.md$/i, '') || file.basename;
      if (!this.plugin.app.vault.getAbstractFileByPath(originalPath)) return originalPath;
      return this.getAvailablePath(folder, basename, file.extension);
    }

    const owner = sanitizeFileName(card.archiveOwnerProject || card.projectTitle || getWikiLinkTarget(card.primaryProject) || 'Unassigned');
    const folderParts = [this.plugin.cardsFolder, owner];
    if (card.type === 'big_action' && card.primarySubproject) {
      folderParts.push(this.folderNameFromLink(card.primarySubproject));
    }
    const folder = normalizePath(folderParts.join('/'));
    await this.ensureFolder(folder);
    return this.getAvailablePath(folder, file.basename, file.extension);
  }

  private async getResearchLogFile(): Promise<TFile> {
    const path = this.plugin.researchLogsPath;
    const existing = this.plugin.app.vault.getAbstractFileByPath(path);
    if (existing instanceof TFile) return existing;
    await this.ensureFolder(path.split('/').slice(0, -1).join('/'));
    return this.plugin.app.vault.create(path, '# Research Logs\n\n### Experiment Log\n\n### Analysis Log\n');
  }

  private folderNameFromLink(link: string): string {
    const target = getWikiLinkTarget(link);
    return sanitizeFileName(target.split('/').pop() || target || 'Unassigned');
  }

  private parseFirstFrontmatter(content: string): Record<string, unknown> {
    const match = content.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
    if (!match) return {};
    try {
      const parsed = parseYaml(match[1]) ?? {};
      return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {};
    } catch {
      return {};
    }
  }

  private fileBaseNameFromPath(path: string): string {
    const fileName = normalizePath(path).split('/').pop() ?? '';
    return fileName.replace(/\.[^/.]+$/, '');
  }

  private folderPathFromFilePath(path: string): string {
    return normalizePath(path).split('/').slice(0, -1).join('/');
  }

  private pathParts(path: string): string[] {
    return normalizePath(path).split('/').filter(Boolean);
  }

  private async ensureFolder(folder: string): Promise<void> {
    const normalized = normalizePath(folder);
    if (this.plugin.app.vault.getAbstractFileByPath(normalized)) return;

    const parts = normalized.split('/');
    let current = '';
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      if (!this.plugin.app.vault.getAbstractFileByPath(current)) {
        await this.plugin.app.vault.createFolder(current);
      }
    }
  }

  private uniqueLinks(values: string[]): string[] {
    const seen = new Set<string>();
    const links: string[] = [];
    for (const value of values.map((item) => item.trim()).filter(Boolean)) {
      const key = getWikiLinkTarget(value) || value;
      if (seen.has(key)) continue;
      seen.add(key);
      links.push(value);
    }
    return links;
  }

  private renderNonEmptyMetadata(values: NewCardValues): string {
    const rows: string[] = [];
    for (const [label, value] of [
      ['priority', values.priority === '3' ? '' : values.priority],
      ['workstream_type', values.workstreamType],
    ]) {
      if (String(value || '').trim()) rows.push(`- ${label}: ${String(value).trim()}`);
    }
    for (const [label, raw] of [
      ['source_notes', values.sourceNotes],
    ]) {
      const list = textareaToList(raw);
      if (list.length) rows.push(`- ${label}: ${list.join(', ')}`);
    }
    return rows.length ? `${rows.join('\n')}\n\n` : '';
  }

  private getLivingDocTemplate(values: NewCardValues, _title: string, baseName: string): string {
    const currentFocus = values.nextAction.trim() ? `- ${values.nextAction.trim()}\n` : '';
    const seededSmallAction = values.nextAction.trim() ? `- [ ] ${values.nextAction.trim()}\n` : '';
    const waiting = values.waitingFor.trim() ? `- ${values.waitingFor.trim()}\n` : '';
    const blocker = values.blocker.trim() ? `- ${values.blocker.trim()}\n` : '';
    const timelineRows = [
      values.startDate.trim() ? `- Start date: ${values.startDate.trim()}` : '',
      values.scheduledDate.trim() ? `- Scheduled date: ${values.scheduledDate.trim()}` : '',
      values.nextReview.trim() ? `- Next review: ${values.nextReview.trim()}` : '',
      values.dueDate.trim() ? `- Due date: ${values.dueDate.trim()}` : '',
    ].filter(Boolean).join('\n');
    const precededBy = textareaToList(values.dependsOn).map((item) => `- ${item}`).join('\n');
    const followedBy = textareaToList(values.blocks).map((item) => `- ${item}`).join('\n');
    const references = textareaToList(values.sourceNotes).map((item) => `- ${item}`).join('\n');
    const typeLabel = values.type === 'big_action' ? 'Big Action' : values.type === 'subproject' ? 'Subproject' : 'Project';
    const projects = this.uniqueLinks([values.project, ...textareaToList(values.projects)]);
    const subprojects = this.uniqueLinks([values.subproject, ...textareaToList(values.subprojects)]);
    const projectLine = values.project.trim() ? `\nprimary_project: ${yamlScalar(values.project.trim())}` : '';
    const subprojectLine = values.subproject.trim() ? `\nprimary_subproject: ${yamlScalar(values.subproject.trim())}` : '';
    const projectsLine = projects.length ? `\nprojects:${yamlArray(projects)}` : '';
    const subprojectsLine = subprojects.length ? `\nsubprojects:${yamlArray(subprojects)}` : '';
    const priorityLine = values.priority.trim() && values.priority.trim() !== '3' ? `\npriority: ${yamlScalar(values.priority.trim())}` : '';
    const categoryLine = values.workstreamType.trim() ? `\nworkstream_type: ${yamlScalar(values.workstreamType.trim())}` : '';
    const hierarchyRows = [
      values.project.trim() ? `> project: ${values.project.trim()}` : '',
      values.subproject.trim() ? `> subproject: ${values.subproject.trim()}` : '',
    ].filter(Boolean).join('\n');
    const workingSections = this.getWorkingSections(values.type, seededSmallAction);

    return `---\nkanban_rpm: true\ntype: ${yamlScalar(values.type)}\nid: ${yamlScalar(baseName)}\nstatus: ${yamlScalar(values.status)}${projectLine}${subprojectLine}${projectsLine}${subprojectsLine}${priorityLine}${categoryLine}\norder: \n---\n\n> [!kanban-rpm]\n> type: ${typeLabel}\n> status: ${values.status}${hierarchyRows ? `\n${hierarchyRows}` : ''}\n\n# PM Control\n\n## Current Focus\n\n${currentFocus}## Waiting\n\n${waiting}## Blockers\n\n${blocker}## Flow\n\nPreceded by:\n${precededBy}\n\nFollowed by:\n${followedBy}\n\n## Timeline\n\n${timelineRows}\n\n## Timeline Log\n\n## Routine\n\n## References\n\n${references}\n\n## PM Metadata\n\n${this.renderNonEmptyMetadata(values)}---\n\n# Working Notes\n\n${workingSections}`;
  }

  private getWorkingSections(type: NewCardValues['type'], seededSmallAction: string): string {
    const smallActions = type === 'big_action'
      ? `## Small Actions\n%% Keep concrete checkbox tasks here; dated tasks can appear in Timeline. %%\n\n${seededSmallAction}`
      : '';
    return `## Overview\n%% Write what this note is responsible for and what success roughly means. %%\n\n## Current Thinking\n%% Capture the current interpretation, open questions, assumptions, or strategy. %%\n\n${smallActions}## Work Log\n%% Add dated progress notes, meeting outcomes, attempts, observations, and follow-up context. %%\n\n## Decisions\n%% Record decisions with enough context to understand why they were made. %%\n\n## Notes\n%% Put miscellaneous context, links, rough ideas, and material that does not yet fit elsewhere. %%\n`;
  }

  private parseLivingDocSections(content: string): {
    currentFocus: string;
    waitingFor: string;
    blocker: string;
    startDate: string;
    scheduledDate: string;
    nextReview: string;
    dueDate: string;
    precededBy: string[];
    followedBy: string[];
    sourceNotes: string[];
      researchLogs: ResearchLogEntry[];
    routines: Array<{
      cardPath: string;
      cardTitle: string;
      text: string;
      cadence: 'daily' | 'weekly' | 'monthly' | 'custom';
      startDate: string;
      interval: number;
      unit: 'day' | 'week' | 'month';
      lineNumber: number;
      raw: string;
      completedDates: string[];
    }>;
    smallActions: SmallAction[];
    actionCount: number;
  } {
    const flow = getSection(content, 'Flow');
    const currentFocus = this.firstListItem(getSection(content, 'Current Focus'));
    const waitingFor = this.firstListItem(getSection(content, 'Waiting'));
    const blocker = this.firstListItem(getSection(content, 'Blockers'));
    const timeline = getSection(content, 'Timeline');
    const routine = getSection(content, 'Routine');
    const routineLog = getSection(content, 'Routine Log');
    const references = getSection(content, 'References');
    const startDate = this.parseTimelineDate(timeline, 'Start date');
    const scheduledDate = this.parseTimelineDate(timeline, 'Scheduled date');
    const nextReview = this.parseTimelineDate(timeline, 'Next review');
    const dueDate = this.parseTimelineDate(timeline, 'Due date');
    const precededBy = this.uniqueLinks(parseDependencyList(flow, 'Preceded by'));
    const followedBy = this.uniqueLinks(parseDependencyList(flow, 'Followed by'));
    const routines = routine
      .split(/\r?\n/)
      .map((line, index) => parseRoutineLine(line, index + 1))
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .map((item) => ({ ...item, completedDates: parseRoutineCompletedDates(routineLog, item.text) }));
    const smallActions = parseSmallActions(content);
    const actionCount = smallActions.filter((action) => !action.done).length;
    const sourceNotes = parsePlainList(references).filter((item) => item.includes('[['));
    const researchLogs = [
      ...this.parseResearchLog(content, 'experiment'),
      ...this.parseResearchLog(content, 'analysis'),
    ];
    return { currentFocus, waitingFor, blocker, startDate, scheduledDate, nextReview, dueDate, precededBy, followedBy, sourceNotes, researchLogs, routines, smallActions, actionCount };
  }

  private firstListItem(section: string): string {
    const match = section.match(/^\s*[-*]\s+(?:\[[ xX-]\]\s*)?(.+)$/m);
    return match?.[1]?.trim() ?? '';
  }

  private updateLivingDocBody(content: string, title: string, values: NewCardValues): string {
    let next = this.removeLegacyTitleHeading(content, title);
    next = replaceSection(next, 'Current Focus', values.nextAction.trim() ? `- ${values.nextAction.trim()}\n` : '');
    next = replaceSection(next, 'Waiting', values.waitingFor.trim() ? `- ${values.waitingFor.trim()}\n` : '');
    next = replaceSection(next, 'Blockers', values.blocker.trim() ? `- ${values.blocker.trim()}\n` : '');
    next = replaceSection(next, 'Flow', `Preceded by:\n${textareaToList(values.dependsOn).map((item) => `- ${item}`).join('\n')}\n\nFollowed by:\n${textareaToList(values.blocks).map((item) => `- ${item}`).join('\n')}\n`);
    next = replaceSection(
      next,
      'Timeline',
      [
        values.startDate.trim() ? `- Start date: ${values.startDate.trim()}` : '',
        values.scheduledDate.trim() ? `- Scheduled date: ${values.scheduledDate.trim()}` : '',
        values.nextReview.trim() ? `- Next review: ${values.nextReview.trim()}` : '',
        values.dueDate.trim() ? `- Due date: ${values.dueDate.trim()}` : '',
      ]
        .filter(Boolean)
        .join('\n')
    );
    next = replaceSection(next, 'References', textareaToList(values.sourceNotes).map((item) => `- ${item}`).join('\n'));
    next = replaceSection(next, 'PM Metadata', this.renderNonEmptyMetadata(values).trimEnd());
    return next;
  }

  private applyCompletionDueDateUpdate(content: string, card: ProjectCard, targetStatus: Status): string {
    if (this.isCompletionStatus(card.status) || !this.isCompletionStatus(targetStatus)) return content;
    const doneDate = todayIso();
    const currentDueDate = this.parseTimelineDate(getSection(content, 'Timeline'), 'Due date');
    if (currentDueDate === doneDate) return content;
    let next = this.upsertTimelineDate(content, 'Due date', doneDate);
    next = this.prependTimelineLog(next, 'Due date', `${currentDueDate || '(none)'} -> ${doneDate}`, doneDate);
    return next;
  }

  private upsertTimelineDate(content: string, label: string, value: string): string {
    const timeline = getSection(content, 'Timeline');
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`^\\s*[-*]\\s+${escaped}:\\s*\\d{4}-\\d{2}-\\d{2}\\s*$`, 'im');
    if (pattern.test(timeline)) {
      return replaceSection(content, 'Timeline', timeline.replace(pattern, `- ${label}: ${value}`));
    }
    const body = [timeline.trimEnd(), `- ${label}: ${value}`].filter(Boolean).join('\n');
    return replaceSection(content, 'Timeline', body);
  }

  private removeLegacyTitleHeading(content: string, title: string): string {
    const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return content.replace(new RegExp(`^#\\s+${escaped}\\s*\\r?\\n{1,2}`, 'm'), '');
  }

  private updateFlowList(content: string, label: 'Preceded by' | 'Followed by', link: string, action: 'add' | 'remove', sourceCard?: ProjectCard): string {
    const flow = getSection(content, 'Flow');
    const precededBy = parseDependencyList(flow, 'Preceded by');
    const followedBy = parseDependencyList(flow, 'Followed by');
    const list = label === 'Preceded by' ? precededBy : followedBy;
    const matchesSource = (value: string): boolean => {
      if (!sourceCard) return value === link;
      const target = getWikiLinkTarget(value) || value.replace(/^\[\[/, '').replace(/\]\]$/, '');
      return value === link || target === sourceCard.file.basename || target === sourceCard.path || target === sourceCard.title;
    };

    let nextList = [...list];
    if (action === 'add') {
      if (nextList.some((value) => matchesSource(value))) return content;
      nextList.push(link);
    } else {
      nextList = nextList.filter((value) => !matchesSource(value));
      if (nextList.length === list.length) return content;
    }

    const nextPrecededBy = label === 'Preceded by' ? nextList : precededBy;
    const nextFollowedBy = label === 'Followed by' ? nextList : followedBy;
    return replaceSection(content, 'Flow', `Preceded by:\n${nextPrecededBy.map((item) => `- ${item}`).join('\n')}\n\nFollowed by:\n${nextFollowedBy.map((item) => `- ${item}`).join('\n')}\n`);
  }

  private prependTimelineLog(content: string, type: string, change: string, date = todayIso()): string {
    const tableHeader = '| Date | Type | Change |\n| --- | --- | --- |';
    const row = `| ${this.escapeTableCell(date)} | ${this.escapeTableCell(type)} | ${this.escapeTableCell(change)} |`;
    if (content.includes(row)) return content;
    const existing = findHeadingSection(content, 'Timeline Log');
    if (existing) {
      const body = content.slice(existing.bodyStart, existing.end).trim();
      const normalized = body.includes('| Date | Type | Change |') ? body : body ? `${tableHeader}\n\n${body}` : tableHeader;
      const lines = normalized.split(/\r?\n/);
      const insertIndex = lines.findIndex((line) => /^\|\s*---\s*\|\s*---\s*\|\s*---\s*\|/.test(line));
      if (insertIndex >= 0) lines.splice(insertIndex + 1, 0, row);
      else lines.unshift(row);
      return replaceSection(content, 'Timeline Log', lines.join('\n'));
    }

    const timeline = findHeadingSection(content, 'Timeline');
    const section = `### Timeline Log\n\n${tableHeader}\n${row}\n`;
    if (timeline) return `${content.slice(0, timeline.end).trimEnd()}\n\n${section}${content.slice(timeline.end)}`;
    return `${content.trimEnd()}\n\n${section}`;
  }

  private async logCardCompletionSideEffects(card: ProjectCard, targetStatus: Status, completedTitle: string, cards?: ProjectCard[]): Promise<void> {
    if (this.isCompletionStatus(card.status) || !this.isCompletionStatus(targetStatus)) return;

    const type = this.cardTypeLogLabel(card.type);
    const change = `${this.statusLabel(card.status)} -> ${this.statusLabel(targetStatus)}`;
    await this.appendDailyCompletedLog(type, `[[${completedTitle}]]`, change);
    await this.appendParentCompletionLog(card, completedTitle, cards);
  }

  private async appendParentCompletionLog(card: ProjectCard, completedTitle: string, cards?: ProjectCard[]): Promise<void> {
    const allCards = cards ?? (await this.loadCards());
    const parent = this.findImmediateParentCard(card, allCards);
    if (!parent) return;

    const file = this.plugin.app.vault.getAbstractFileByPath(parent.path);
    if (!(file instanceof TFile)) return;

    const content = await this.plugin.app.vault.read(file);
    const type = this.cardTypeLogLabel(card.type);
    const next = this.prependTimelineLog(content, type, `Completed [[${completedTitle}]]`);
    if (next !== content) await this.plugin.app.vault.modify(file, next);
  }

  private findImmediateParentCard(card: ProjectCard, cards: ProjectCard[]): ProjectCard | undefined {
    if (card.type === 'subproject') {
      const projectTitle = card.projectTitle || card.primaryProject || card.project || card.projects[0] || '';
      return cards.find((candidate) => candidate.type === 'project' && candidate.title === projectTitle);
    }

    if (card.type === 'big_action') {
      const subprojectTitle = card.subprojectTitle || card.primarySubproject || card.subproject || card.subprojects[0] || '';
      const projectTitle = card.projectTitle || card.primaryProject || card.project || card.projects[0] || '';
      return cards.find((candidate) => {
        if (candidate.type !== 'subproject' || candidate.title !== subprojectTitle) return false;
        if (!projectTitle) return true;
        return candidate.projectTitles.includes(projectTitle) || candidate.primaryProject === projectTitle || candidate.project === projectTitle;
      }) ?? cards.find((candidate) => candidate.type === 'subproject' && candidate.title === subprojectTitle);
    }

    return undefined;
  }

  private cardTypeLogLabel(type: ProjectCard['type']): string {
    if (type === 'big_action') return 'big action';
    return type;
  }

  private async appendDailyCompletedLog(type: string, item: string, change: string, date = todayIso()): Promise<void> {
    const file = await this.ensureDailyTimelineFile(date);
    if (!file) return;

    const content = await this.plugin.app.vault.read(file);
    const next = this.prependDailyCompletedLog(content, type, item, change);
    if (next !== content) await this.plugin.app.vault.modify(file, next);
  }

  private async ensureDailyTimelineFile(date: string): Promise<TFile | null> {
    await this.plugin.ensureWorkspace();
    const folder = normalizePath(`${this.plugin.workspaceFolder}/timeline`);
    if (!this.plugin.app.vault.getAbstractFileByPath(folder)) await this.plugin.app.vault.createFolder(folder);

    const path = normalizePath(`${folder}/${date}.md`);
    const existing = this.plugin.app.vault.getAbstractFileByPath(path);
    if (existing instanceof TFile) return existing;
    return this.plugin.app.vault.create(path, `# ${date} Timeline Memo\n\n## Memo\n\n## Completed Log\n\n## Notes\n`);
  }

  private prependDailyCompletedLog(content: string, type: string, item: string, change: string): string {
    const tableHeader = '| Time | Type | Item | Change |\n| --- | --- | --- | --- |';
    const row = `| ${this.currentClockTime()} | ${this.escapeTableCell(type)} | ${this.escapeTableCell(item)} | ${this.escapeTableCell(change)} |`;
    if (content.includes(row)) return content;

    const existing = findHeadingSection(content, 'Completed Log');
    if (existing) {
      const body = content.slice(existing.bodyStart, existing.end).trim();
      const normalized = body.includes('| Time | Type | Item | Change |') ? body : body ? `${tableHeader}\n${body}` : tableHeader;
      const lines = normalized.split(/\r?\n/);
      const insertIndex = lines.findIndex((line) => /^\|\s*---\s*\|\s*---\s*\|\s*---\s*\|\s*---\s*\|/.test(line));
      if (insertIndex >= 0) lines.splice(insertIndex + 1, 0, row);
      else lines.unshift(row);
      return replaceSection(content, 'Completed Log', lines.join('\n'));
    }

    const memo = findHeadingSection(content, 'Memo');
    const section = `## Completed Log\n\n${tableHeader}\n${row}\n`;
    if (memo) return `${content.slice(0, memo.end).trimEnd()}\n\n${section}${content.slice(memo.end)}`;
    return `${content.trimEnd()}\n\n${section}`;
  }

  private currentClockTime(): string {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  private prependRoutineLog(content: string, entry: string): string {
    const tableHeader = '| Date | Routine |\n| --- | --- |';
    const row = entry;
    if (content.includes(row)) return content;
    const routineLog = findHeadingSection(content, 'Routine Log');
    const existing = routineLog;
    if (existing) {
      const body = content.slice(existing.bodyStart, existing.end).trim();
      const normalized = body.includes('| Date | Routine |') ? body : `${tableHeader}\n${body}`;
      const lines = normalized.split(/\r?\n/);
      const insertIndex = lines.findIndex((line) => /^\|\s*---/.test(line));
      if (insertIndex >= 0) lines.splice(insertIndex + 1, 0, row);
      else lines.unshift(row);
      return replaceSection(content, 'Routine Log', lines.join('\n'));
    }

    const routine = findHeadingSection(content, 'Routine');
    const section = `### Routine Log\n\n${tableHeader}\n${row}\n`;
    if (routine) return `${content.slice(0, routine.end).trimEnd()}\n\n${section}${content.slice(routine.end)}`;
    return `${content.trimEnd()}\n\n${section}`;
  }

  private prependResearchLog(content: string, values: ResearchLogValues): string {
    const sectionTitle = values.kind === 'experiment' ? 'Experiment Log' : 'Analysis Log';
    const tableHeader =
      values.kind === 'experiment'
        ? '| Date | Sample | Conditions | Result | Link |\n| --- | --- | --- | --- | --- |'
        : '| Date | Dataset / Sample | Method | Result | Link |\n| --- | --- | --- | --- | --- |';
    const row = `| ${this.escapeTableCell(values.date)} | ${this.escapeTableCell(values.subject)} | ${this.escapeTableCell(values.conditionsOrMethod)} | ${this.escapeTableCell(values.result)} | ${this.escapeTableCell(values.link)} |`;
    if (content.includes(row)) return content;

    const module = values.module.trim() || (values.kind === 'experiment' ? 'General Experiment' : 'General Analysis');
    let next = content;
    if (!findHeadingSection(next, sectionTitle)) {
      next = `${next.trimEnd()}\n\n### ${sectionTitle}\n\n#### ${module}\n\n${tableHeader}\n${row}\n`;
      return next;
    }

    const moduleSection = findNestedHeadingSection(next, sectionTitle, module);
    if (!moduleSection) {
      const parent = findHeadingSection(next, sectionTitle);
      if (!parent) return next;
      const addition = `\n\n#### ${module}\n\n${tableHeader}\n${row}\n`;
      return `${next.slice(0, parent.end).trimEnd()}${addition}${next.slice(parent.end)}`;
    }

    const body = next.slice(moduleSection.bodyStart, moduleSection.end).trim();
    const normalized = body.includes('| Date |') ? body : `${tableHeader}\n${body}`;
    const lines = normalized.split(/\r?\n/);
    const insertIndex = lines.findIndex((line) => /^\|\s*---/.test(line));
    if (insertIndex >= 0) lines.splice(insertIndex + 1, 0, row);
    else lines.unshift(row);
    return `${next.slice(0, moduleSection.bodyStart)}${lines.join('\n')}\n${next.slice(moduleSection.end)}`;
  }

  private escapeTableCell(value: string): string {
    return String(value || '').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();
  }

  private smallActionTimelineLog(action: SmallAction, file: TFile): string {
    const heading = action.heading && action.heading !== 'Timeline Log' ? ` (${action.heading})` : '';
    return `Completed [[${file.basename}]] - ${action.text}${heading}`;
  }

  private parseTimelineDate(section: string, label: string): string {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = section.match(new RegExp(`${escaped}:\\s*(\\d{4}-\\d{2}-\\d{2})`, 'i'));
    return match?.[1] ?? '';
  }

  private parseResearchLog(content: string, kind: 'experiment' | 'analysis'): ResearchLogEntry[] {
    const sectionTitle = kind === 'experiment' ? 'Experiment Log' : 'Analysis Log';
    const section = findHeadingSection(content, sectionTitle);
    if (!section) return [];
    const body = content.slice(section.bodyStart, section.end);
    const entries: ResearchLogEntry[] = [];
    let module = '';
    body.split(/\r?\n/).forEach((line, index) => {
      const heading = line.match(/^#{4,6}\s+(.+)$/);
      if (heading?.[1]) {
        module = heading[1].trim();
        return;
      }
      const cells = parseMarkdownTableRow(line);
      if (!cells || cells[0].toLowerCase() === 'date' || cells.every((cell) => /^-+$/.test(cell))) return;
      entries.push({
        cardPath: '',
        cardTitle: '',
        kind,
        module,
        date: cells[0] ?? '',
        subject: cells[1] ?? '',
        conditionsOrMethod: cells[2] ?? '',
        result: cells[3] ?? '',
        link: cells[4] ?? '',
        lineNumber: index + 1,
      });
    });
    return entries;
  }

  private parseResearchLogModules(content: string, kind: ResearchLogKind): string[] {
    const sectionTitle = kind === 'experiment' ? 'Experiment Log' : 'Analysis Log';
    const section = findHeadingSection(content, sectionTitle);
    if (!section) return [];
    const body = content.slice(section.bodyStart, section.end);
    const modules: string[] = [];
    for (const line of body.split(/\r?\n/)) {
      const heading = line.match(/^#{4,6}\s+(.+)$/);
      if (heading?.[1]) modules.push(heading[1].trim());
    }
    return this.uniqueLinks(modules).sort((a, b) => a.localeCompare(b));
  }

  private normalizeCardType(value: string): ProjectCard['type'] {
    if (value === 'subproject' || value === 'big_action' || value === 'project') return value;
    return 'project';
  }

  private applyHierarchy(cards: ProjectCard[]): void {
    for (const card of cards) {
      const projectFile = card.primaryProject ? this.resolveLinkedFile(card.primaryProject, card.path) : null;
      const subprojectFile = card.primarySubproject ? this.resolveLinkedFile(card.primarySubproject, card.path) : null;
      const projectCard = projectFile ? cards.find((item) => item.path === projectFile.path || item.file.basename === projectFile.basename) : undefined;
      const subprojectCard = subprojectFile ? cards.find((item) => item.path === subprojectFile.path || item.file.basename === subprojectFile.basename) : undefined;
      const projectTitles = this.resolveHierarchyTitles(card.projects, card.path, cards);
      const subprojectTitles = this.resolveHierarchyTitles(card.subprojects, card.path, cards);
      if (card.type === 'project') {
        card.projectTitle = card.title;
        card.projectTitles = [card.title];
        card.subprojectTitle = '';
        card.subprojectTitles = [];
      } else if (card.type === 'subproject') {
        card.projectTitle = (projectCard?.title ?? projectFile?.basename ?? text(card.project)) || 'No project';
        card.projectTitles = projectTitles.length ? projectTitles : [card.projectTitle];
        card.subprojectTitle = card.title;
        card.subprojectTitles = [card.title];
      } else if (card.type === 'big_action') {
        card.projectTitle = (projectCard?.title ?? projectFile?.basename ?? subprojectCard?.projectTitle ?? text(card.project)) || 'No project';
        card.subprojectTitle = subprojectCard?.title ?? subprojectFile?.basename ?? text(card.subproject);
        card.projectTitles = projectTitles.length ? projectTitles : [card.projectTitle].filter(Boolean);
        card.subprojectTitles = subprojectTitles.length ? subprojectTitles : [card.subprojectTitle].filter(Boolean);
      } else {
        card.projectTitle = (projectCard?.title ?? text(card.project)) || card.title;
        card.subprojectTitle = subprojectCard?.title ?? text(card.subproject);
        card.projectTitles = projectTitles.length ? projectTitles : [card.projectTitle].filter(Boolean);
        card.subprojectTitles = subprojectTitles.length ? subprojectTitles : [card.subprojectTitle].filter(Boolean);
      }
      card.breadcrumb = [card.projectTitle, card.subprojectTitle && card.subprojectTitle !== card.title ? card.subprojectTitle : '']
        .filter(Boolean)
        .join(' > ');
      card.colorKey = card.projectTitle || card.title;
    }
  }

  private resolveHierarchyTitles(links: string[], sourcePath: string, cards: ProjectCard[]): string[] {
    const titles: string[] = [];
    for (const link of links) {
      const file = this.resolveLinkedFile(link, sourcePath);
      const card = file ? cards.find((item) => item.path === file.path || item.file.basename === file.basename) : undefined;
      titles.push(card?.title ?? file?.basename ?? getWikiLinkTarget(link) ?? link);
    }
    return this.uniqueLinks(titles);
  }

  private applyBlockedBy(cards: ProjectCard[]): void {
    for (const card of cards) card.blockedBy = [];
    for (const card of cards) {
      for (const dependency of card.precededBy) {
        const dependencyFile = this.resolveLinkedFile(dependency, card.path);
        const dependencyCard = dependencyFile ? cards.find((item) => item.path === dependencyFile.path) : undefined;
        if (dependencyCard && !this.isCompletionStatus(dependencyCard.status)) card.blockedBy.push(dependencyCard.title);
      }
      for (const blocked of card.followedBy) {
        const blockedFile = this.resolveLinkedFile(blocked, card.path);
        const blockedCard = blockedFile ? cards.find((item) => item.path === blockedFile.path) : undefined;
        if (blockedCard && !this.isCompletionStatus(card.status)) blockedCard.blockedBy.push(card.title);
      }
    }
  }

  private isCompletionStatus(statusId: string): boolean {
    const status = this.plugin.settings.statuses.find((item) => item.id === statusId);
    const value = `${status?.id ?? statusId} ${status?.label ?? ''}`.toLowerCase();
    return /\b(done|complete|completed)\b/.test(value) || value.includes('?袁⑥┷');
  }

  private hasCircularDependency(card: ProjectCard, cards: ProjectCard[]): boolean {
    const visited = new Set<string>();
    const visit = (current: ProjectCard): boolean => {
      if (visited.has(current.path)) return false;
      visited.add(current.path);
      for (const dependency of current.precededBy) {
        const dependencyFile = this.resolveLinkedFile(dependency, current.path);
        const dependencyCard = dependencyFile ? cards.find((item) => item.path === dependencyFile.path) : undefined;
        if (!dependencyCard) continue;
        if (dependencyCard.path === card.path || visit(dependencyCard)) return true;
      }
      return false;
    };
    return visit(card);
  }
}


