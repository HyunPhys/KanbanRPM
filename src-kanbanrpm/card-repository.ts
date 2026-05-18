import { Notice, TFile, normalizePath, parseYaml, stringifyYaml } from 'obsidian';
import type KanbanRPMPlugin from './main';
import { addDays, formatDate, todayIso } from './date-utils';
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
  GanttDateValues,
  NewCardValues,
  ProjectCard,
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
      const title = this.getDocumentTitle(content) || file.basename;

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
    new Notice(`KanbanRPM card created: ${title}`);
    await this.plugin.refreshViews();
    return file;
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

    await this.updateCardFrontmatter(file, {
      type: values.type,
      primary_project: values.project.trim() || undefined,
      primary_subproject: values.subproject.trim() || undefined,
      projects: this.uniqueLinks([values.project, ...textareaToList(values.projects)]),
      subprojects: this.uniqueLinks([values.subproject, ...textareaToList(values.subprojects)]),
      status: values.status,
      priority: parsePriority(values.priority),
      workstream_type: values.workstreamType.trim(),
    });

    const content = await this.plugin.app.vault.read(file);
    const nextContent = this.updateLivingDocBody(content, values.title.trim() || card.title, values);
    await this.plugin.app.vault.modify(file, nextContent);

    new Notice(`KanbanRPM card updated: ${values.title.trim() || card.title}`);
  }

  async moveCard(cardPath: string, targetStatus: Status, beforePath?: string): Promise<void> {
    const file = this.plugin.app.vault.getAbstractFileByPath(cardPath);
    if (!(file instanceof TFile)) return;

    const cards = await this.loadCards();
    const laneCards = cards
      .filter((card) => card.status === targetStatus && card.path !== cardPath)
      .sort(compareCards);

    const foundIndex = beforePath ? laneCards.findIndex((card) => card.path === beforePath) : -1;
    const insertIndex = beforePath && foundIndex >= 0 ? foundIndex : laneCards.length;
    const newOrder = this.computeOrder(laneCards, insertIndex);

    await this.updateCardFrontmatter(file, {
      status: targetStatus,
      order: newOrder,
    });
  }

  async setCardStatus(card: ProjectCard, status: Status): Promise<void> {
    const file = this.plugin.app.vault.getAbstractFileByPath(card.path);
    if (!(file instanceof TFile)) return;

    await this.updateCardFrontmatter(file, { status });
    new Notice(`KanbanRPM card moved to ${status}: ${card.title}`);
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
      const next = this.prependTimelineLog(content, `- ${today}: next review reached; status changed to ${targetStatus}`);
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
      ? line.replace(/^(\s*[-*]\s+)\[[xX]\]/, '$1[ ]').replace(/\s*\u{2705}\s*\d{4}-\d{2}-\d{2}/u, '')
      : line.replace(/^(\s*[-*]\s+)\[ \]/, '$1[x]') + (action.doneDate ? '' : ` ??${todayIso}`);

    lines[index] = nextLine;
    const nextContent = action.done ? lines.join('\n') : this.prependTimelineLog(lines.join('\n'), this.smallActionTimelineLog(action, todayIso, file));
    await this.plugin.app.vault.modify(file, nextContent);
    await this.plugin.refreshViews();
  }

  async completeRoutine(cardPath: string, routineText: string, date: string): Promise<void> {
    const file = this.plugin.app.vault.getAbstractFileByPath(cardPath);
    if (!(file instanceof TFile)) return;
    const content = await this.plugin.app.vault.read(file);
    const entry = `| ${date} | ${routineText} |`;
    const next = this.prependRoutineLog(content, entry);
    if (next !== content) await this.plugin.app.vault.modify(file, next);
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
      .filter((card) => (card.dueDate && card.dueDate <= soon) || (card.nextReview && card.nextReview <= soon))
      .sort((a, b) => (a.dueDate || a.nextReview || '').localeCompare(b.dueDate || b.nextReview || '') || a.title.localeCompare(b.title));
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

## Next Actions

${nextActionRows || '- No explicit next actions.'}

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
          .flatMap((card) => [card.dueDate, card.nextReview].filter(Boolean))
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

  private getLivingDocTemplate(values: NewCardValues, title: string, baseName: string): string {
    const currentFocus = values.nextAction.trim() ? `- ${values.nextAction.trim()}\n` : '';
    const seededSmallAction = values.nextAction.trim() ? `- [ ] ${values.nextAction.trim()}\n` : '';
    const waiting = values.waitingFor.trim() ? `- ${values.waitingFor.trim()}\n` : '';
    const blocker = values.blocker.trim() ? `- ${values.blocker.trim()}\n` : '';
    const timelineRows = [
      values.startDate.trim() ? `- Start date: ${values.startDate.trim()}` : '',
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
    const hierarchyRows = [
      values.project.trim() ? `> project: ${values.project.trim()}` : '',
      values.subproject.trim() ? `> subproject: ${values.subproject.trim()}` : '',
    ].filter(Boolean).join('\n');
    const workingSections = this.getWorkingSections(values.type, seededSmallAction);

    return `---\nkanban_rpm: true\ntype: ${yamlScalar(values.type)}\nid: ${yamlScalar(baseName)}\nstatus: ${yamlScalar(values.status)}${projectLine}${subprojectLine}${projectsLine}${subprojectsLine}\norder: \n---\n\n# ${title}\n\n> [!kanban-rpm]\n> type: ${typeLabel}\n> status: ${values.status}${hierarchyRows ? `\n${hierarchyRows}` : ''}\n\n## PM Control\n\n### Current Focus\n\n${currentFocus}### Waiting\n\n${waiting}### Blockers\n\n${blocker}### Flow\n\nPreceded by:\n${precededBy}\n\nFollowed by:\n${followedBy}\n\n### Timeline\n\n${timelineRows}\n\n### Timeline Log\n\n### Routine\n\n### References\n\n${references}\n\n### PM Metadata\n\n${this.renderNonEmptyMetadata(values)}---\n\n## Working Notes\n\n${workingSections}`;
  }

  private getWorkingSections(type: NewCardValues['type'], seededSmallAction: string): string {
    if (type === 'project') {
      return `### Project Brief\n\n### Desired Outcomes\n\n### Subprojects\n\n### Big Actions\n\n${seededSmallAction}### Decisions\n\n### Meetings And Communication\n\n### Notes\n`;
    }

    if (type === 'subproject') {
      return `### Objective\n\n### Work Plan\n\n### Big Actions\n\n${seededSmallAction}### Progress Notes\n\n### Decisions\n\n### Related Materials\n`;
    }

    return `### Definition Of Done\n\n### Small Actions\n\n${seededSmallAction}### Progress Notes\n\n### Evidence And Links\n\n### Decisions\n\n### Related Materials\n`;
  }

  private parseLivingDocSections(content: string): {
    currentFocus: string;
    waitingFor: string;
    blocker: string;
    startDate: string;
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
    return { currentFocus, waitingFor, blocker, startDate, nextReview, dueDate, precededBy, followedBy, sourceNotes, researchLogs, routines, smallActions, actionCount };
  }

  private firstListItem(section: string): string {
    const match = section.match(/^\s*[-*]\s+(?:\[[ xX-]\]\s*)?(.+)$/m);
    return match?.[1]?.trim() ?? '';
  }

  private getDocumentTitle(content: string): string {
    return content.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? '';
  }

  private updateLivingDocBody(content: string, title: string, values: NewCardValues): string {
    let next = content.match(/^#\s+.+$/m) ? content.replace(/^#\s+.+$/m, `# ${title}`) : `${content.trimEnd()}\n\n# ${title}\n`;
    next = replaceSection(next, 'Current Focus', values.nextAction.trim() ? `- ${values.nextAction.trim()}\n` : '');
    next = replaceSection(next, 'Waiting', values.waitingFor.trim() ? `- ${values.waitingFor.trim()}\n` : '');
    next = replaceSection(next, 'Blockers', values.blocker.trim() ? `- ${values.blocker.trim()}\n` : '');
    next = replaceSection(next, 'Flow', `Preceded by:\n${textareaToList(values.dependsOn).map((item) => `- ${item}`).join('\n')}\n\nFollowed by:\n${textareaToList(values.blocks).map((item) => `- ${item}`).join('\n')}\n`);
    next = replaceSection(
      next,
      'Timeline',
      [
        values.startDate.trim() ? `- Start date: ${values.startDate.trim()}` : '',
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

  private prependTimelineLog(content: string, entry: string): string {
    if (content.includes(entry)) return content;
    const existing = findHeadingSection(content, 'Timeline Log');
    if (existing) {
      const body = content.slice(existing.bodyStart, existing.end).trim();
      return replaceSection(content, 'Timeline Log', body ? `${entry}\n${body}` : entry);
    }

    const timeline = findHeadingSection(content, 'Timeline');
    const section = `### Timeline Log\n\n${entry}\n`;
    if (timeline) return `${content.slice(0, timeline.end).trimEnd()}\n\n${section}${content.slice(timeline.end)}`;
    return `${content.trimEnd()}\n\n${section}`;
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

  private smallActionTimelineLog(action: SmallAction, date: string, file: TFile): string {
    const heading = action.heading && action.heading !== 'Timeline Log' ? ` (${action.heading})` : '';
    return `- ${date} completed: [[${file.basename}]] - ${action.text}${heading}`;
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


