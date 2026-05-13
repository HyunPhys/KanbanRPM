import { Notice, TFile, normalizePath, stringifyYaml } from 'obsidian';
import type KanbanRPMPlugin from './main';
import type { ActionItem, CardIssue, CardIssueLevel, NewCardValues, ProjectCard, SmallAction, SmallActionPriority, Status } from './types';
import {
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
    await this.plugin.ensureWorkspace();
    const cards: ProjectCard[] = [];
    const prefix = `${this.plugin.cardsFolder}/`;
    const statuses = this.plugin.settings.statuses;

    for (const file of this.plugin.app.vault.getMarkdownFiles()) {
      if (!file.path.startsWith(prefix)) continue;

      const cache = this.plugin.app.metadataCache.getFileCache(file);
      const fm = cache?.frontmatter ?? {};
      if (fm.kanban_rpm !== true && fm.kanban_rpm !== 'true') continue;
      const content = await this.plugin.app.vault.read(file);
      const sectionData = this.parseLivingDocSections(content);
      const type = this.normalizeCardType(text(fm.type));
      const parent = text(fm.parent);
      const legacyProject = text(fm.project);
      const legacySubproject = text(fm.subproject);
      const projects = this.uniqueLinks([text(fm.primary_project), ...toStringList(fm.projects), legacyProject]);
      const subprojects = this.uniqueLinks([text(fm.primary_subproject), ...toStringList(fm.subprojects), legacySubproject]);
      const project = text(fm.primary_project) || projects[0] || legacyProject;
      const subproject = text(fm.primary_subproject) || subprojects[0] || legacySubproject;
      const order = parseOrder(fm.order);

      cards.push({
        file,
        path: file.path,
        id: text(fm.id) || file.basename,
        title: this.getDocumentTitle(content) || file.basename,
        type,
        status: normalizeStatus(fm.status, statuses),
        parent,
        parentPath: '',
        parentTitle: '',
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
        nextReview: sectionData.nextReview,
        dueDate: sectionData.dueDate,
        precededBy: sectionData.dependsOn,
        followedBy: sectionData.blocks,
        dependsOn: sectionData.dependsOn,
        blocks: sectionData.blocks,
        blockedBy: [],
        sourceNotes: sectionData.sourceNotes,
        routines: sectionData.routines.map((item) => ({
          ...item,
          cardPath: file.path,
          cardTitle: this.getDocumentTitle(content) || file.basename,
        })),
        smallActions: sectionData.smallActions.map((item) => ({
          ...item,
          cardPath: file.path,
          cardTitle: this.getDocumentTitle(content) || file.basename,
        })),
        actionCount: sectionData.actionCount,
        order,
      });
    }

    this.applyHierarchy(cards);
    this.applyBlockedBy(cards);
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

  async updateCardFrontmatter(file: TFile, updates: Record<string, unknown>): Promise<void> {
    await this.plugin.app.fileManager.processFrontMatter(file, (frontmatter) => {
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined) {
          delete frontmatter[key];
        } else {
          frontmatter[key] = value;
        }
      }
    });
    await this.plugin.refreshViews();
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
      project: undefined,
      subproject: undefined,
      parent: undefined,
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

  async normalizeCardOrder(): Promise<void> {
    const cards = await this.loadCards();
    let updated = 0;

    for (const status of this.plugin.settings.statuses) {
      const laneCards = cards.filter((card) => card.status === status.id).sort(compareCards);

      for (const [index, card] of laneCards.entries()) {
        const nextOrder = (index + 1) * 1000;
        if (card.order === nextOrder) continue;

        const file = this.plugin.app.vault.getAbstractFileByPath(card.path);
        if (!(file instanceof TFile)) continue;

        await this.plugin.app.fileManager.processFrontMatter(file, (frontmatter) => {
          frontmatter.order = nextOrder;
        });
        updated += 1;
      }
    }

    await this.plugin.refreshViews();
    new Notice(`KanbanRPM normalized order on ${updated} cards.`);
  }

  async setNextAction(cardPath: string, nextAction: string): Promise<void> {
    const file = this.plugin.app.vault.getAbstractFileByPath(cardPath);
    if (!(file instanceof TFile)) return;

    const content = await this.plugin.app.vault.read(file);
    await this.plugin.app.vault.modify(file, this.replaceSection(content, 'Current Focus', `- ${nextAction.trim()}\n`));
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

    await this.plugin.app.fileManager.processFrontMatter(file, (frontmatter) => {
      frontmatter.archived = true;
      frontmatter.archived_at = new Date().toISOString();
    });

    const archivePath = this.getAvailablePath(this.plugin.archiveFolder, file.basename, file.extension);
    await this.plugin.app.fileManager.renameFile(file, archivePath);
    new Notice(`Archived KanbanRPM card: ${card.title}`);
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

    frontmatter.kanban_rpm = true;
    frontmatter.type = card.type;
    frontmatter.status = card.status;
    frontmatter.priority = card.priority;
    if (card.project) frontmatter.project = card.project;
    else delete frontmatter.project;
    if (card.subproject) frontmatter.subproject = card.subproject;
    else delete frontmatter.subproject;
    delete frontmatter.parent;

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
          text: `${item.text} ${this.routineScheduleLabel(item)}`,
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
      if (category && !this.plugin.settings.categories.includes(category)) {
        add('warning', 'workstream_type', `category is not in the configured vocabulary: ${this.plugin.settings.categories.join(', ')}.`);
      }

      const order = text(fm.order).trim();
      if (order && !Number.isFinite(Number(order))) add('warning', 'order', `order should be numeric; current value is "${order}".`);

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

  async writeDependencyArrows(cards?: ProjectCard[]): Promise<void> {
    await this.plugin.ensureWorkspace();
    const sourceCards = cards ?? (await this.loadCards());
    let created = 0;

    for (const card of sourceCards) {
      const cardLink = `[[${card.file.basename}]]`;

      for (const dependency of card.precededBy) {
        const name = sanitizeFileName(`${dependency} to ${card.title}`);
        const path = normalizePath(`${this.plugin.arrowsFolder}/${name}.md`);
        if (this.plugin.app.vault.getAbstractFileByPath(path)) continue;

        const content = `---\nkanban_rpm: true\ntype: arrow\nrelationship: depends_on\nfrom: ${yamlScalar(dependency)}\nto: ${yamlScalar(cardLink)}\ncard: ${yamlScalar(cardLink)}\n---\n\n# ${dependency} -> ${card.title}\n`;
        await this.plugin.app.vault.create(path, content);
        created += 1;
      }

      for (const blocked of card.followedBy) {
        const name = sanitizeFileName(`${card.title} followed by ${blocked}`);
        const path = normalizePath(`${this.plugin.arrowsFolder}/${name}.md`);
        if (this.plugin.app.vault.getAbstractFileByPath(path)) continue;

        const content = `---\nkanban_rpm: true\ntype: arrow\nrelationship: blocks\nfrom: ${yamlScalar(cardLink)}\nto: ${yamlScalar(blocked)}\ncard: ${yamlScalar(cardLink)}\n---\n\n# ${card.title} -> ${blocked}\n`;
        await this.plugin.app.vault.create(path, content);
        created += 1;
      }
    }

    new Notice(`KanbanRPM wrote ${created} dependency arrow notes.`);
  }

  async writeManagementBrief(cards?: ProjectCard[]): Promise<void> {
    await this.plugin.ensureWorkspace();
    const sourceCards = cards ?? (await this.loadCards());
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
    const today = this.todayIso();
    const soon = this.addDays(today, 14);
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
| Open small actions | ${smallActionCount} |
| Routines | ${routines.length} |
| Data warnings | ${this.validateCards(cards).length} |

## Status Counts

| Status | Count |
| --- | ---: |
${statusCounts}

## Projects

${this.renderBriefProjectSections(sorted)}

## Upcoming Dates

${dueSoon.length ? dueSoon.map((card) => this.renderBriefCardLine(card, true)).join('\n') : '- No due/review dates in the next 14 days.'}

## Waiting

${waiting.length ? waiting.map((card) => this.renderBriefCardLine(card, true)).join('\n') : '- No waiting cards.'}

## Blocked

${blocked.length ? blocked.map((card) => this.renderBriefCardLine(card, true)).join('\n') : '- No blocked cards.'}

## Flow Risks

${this.renderBriefFlowRisks(boardCards)}

## Routines

${routines.length ? routines.map(({ card, routine }) => `- [[${card.file.basename}]]: ${routine.text} (${this.routineScheduleLabel(routine)})`).join('\n') : '- No routines.'}

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
      card.workstreamType ? `category: ${card.workstreamType}` : '',
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

  private statusId(preferredId: string): Status {
    return this.plugin.settings.statuses.find((status) => status.id === preferredId)?.id ?? preferredId;
  }

  private statusLabel(statusId: string): string {
    return this.plugin.settings.statuses.find((status) => status.id === statusId)?.label ?? statusId;
  }

  private todayIso(): string {
    const now = new Date();
    return this.formatDate(now);
  }

  private addDays(day: string, amount: number): string {
    const date = new Date(`${day}T00:00:00`);
    date.setDate(date.getDate() + amount);
    return this.formatDate(date);
  }

  private formatDate(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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
    nextReview: string;
    dueDate: string;
    dependsOn: string[];
    blocks: string[];
    sourceNotes: string[];
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
    const flow = this.getSection(content, 'Flow');
    const dependencies = this.getSection(content, 'Dependencies');
    const currentFocus = this.firstListItem(this.getSection(content, 'Current Focus'));
    const waitingFor = this.firstListItem(this.getSection(content, 'Waiting'));
    const blocker = this.firstListItem(this.getSection(content, 'Blockers'));
    const timeline = this.getSection(content, 'Timeline');
    const routine = this.getSection(content, 'Routine') || this.getSection(content, 'Perpetual');
    const routineLog = this.getSection(content, 'Routine Log') || this.getSection(content, 'Perpetual Log');
    const references = this.getSection(content, 'References');
    const nextReview = this.parseTimelineDate(timeline, 'Next review');
    const dueDate = this.parseTimelineDate(timeline, 'Due date');
    const dependsOn = this.uniqueLinks([
      ...this.parseDependencyList(flow, 'Preceded by'),
      ...this.parseDependencyList(dependencies, 'Depends on'),
    ]);
    const blocks = this.uniqueLinks([
      ...this.parseDependencyList(flow, 'Followed by'),
      ...this.parseDependencyList(dependencies, 'Blocks'),
    ]);
    const routines = routine
      .split(/\r?\n/)
      .map((line, index) => this.parseRoutineLine(line, index + 1))
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .map((item) => ({ ...item, completedDates: this.parseRoutineCompletedDates(routineLog, item.text) }));
    const smallActions = this.parseSmallActions(content);
    const actionCount = smallActions.filter((action) => !action.done).length;
    const sourceNotes = this.parsePlainList(references).filter((item) => item.includes('[['));
    return { currentFocus, waitingFor, blocker, nextReview, dueDate, dependsOn, blocks, sourceNotes, routines, smallActions, actionCount };
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
    next = this.replaceSection(next, 'Current Focus', values.nextAction.trim() ? `- ${values.nextAction.trim()}\n` : '');
    next = this.replaceSection(next, 'Waiting', values.waitingFor.trim() ? `- ${values.waitingFor.trim()}\n` : '');
    next = this.replaceSection(next, 'Blockers', values.blocker.trim() ? `- ${values.blocker.trim()}\n` : '');
    next = this.replaceSection(next, 'Flow', `Preceded by:\n${textareaToList(values.dependsOn).map((item) => `- ${item}`).join('\n')}\n\nFollowed by:\n${textareaToList(values.blocks).map((item) => `- ${item}`).join('\n')}\n`);
    next = this.replaceSection(
      next,
      'Timeline',
      [values.nextReview.trim() ? `- Next review: ${values.nextReview.trim()}` : '', values.dueDate.trim() ? `- Due date: ${values.dueDate.trim()}` : '']
        .filter(Boolean)
        .join('\n')
    );
    next = this.replaceSection(next, 'References', textareaToList(values.sourceNotes).map((item) => `- ${item}`).join('\n'));
    next = this.replaceSection(next, 'PM Metadata', this.renderNonEmptyMetadata(values).trimEnd());
    return next;
  }

  private updateFlowList(content: string, label: 'Preceded by' | 'Followed by', link: string, action: 'add' | 'remove', sourceCard?: ProjectCard): string {
    const flow = this.getSection(content, 'Flow');
    const precededBy = this.parseDependencyList(flow, 'Preceded by');
    const followedBy = this.parseDependencyList(flow, 'Followed by');
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
    return this.replaceSection(content, 'Flow', `Preceded by:\n${nextPrecededBy.map((item) => `- ${item}`).join('\n')}\n\nFollowed by:\n${nextFollowedBy.map((item) => `- ${item}`).join('\n')}\n`);
  }

  private replaceSection(content: string, title: string, body: string): string {
    const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const normalizedBody = body.trimEnd();
    const existing = this.findHeadingSection(content, title);
    const level = existing?.level ?? 3;
    const replacement = `${'#'.repeat(level)} ${title}\n\n${normalizedBody}${normalizedBody ? '\n' : ''}`;
    if (existing) return `${content.slice(0, existing.start)}${replacement}${content.slice(existing.end)}`;
    return `${content.trimEnd()}\n\n${replacement}`;
  }

  private prependTimelineLog(content: string, entry: string): string {
    if (content.includes(entry)) return content;
    const existing = this.findHeadingSection(content, 'Timeline Log');
    if (existing) {
      const body = content.slice(existing.bodyStart, existing.end).trim();
      return this.replaceSection(content, 'Timeline Log', body ? `${entry}\n${body}` : entry);
    }

    const timeline = this.findHeadingSection(content, 'Timeline');
    const section = `### Timeline Log\n\n${entry}\n`;
    if (timeline) return `${content.slice(0, timeline.end).trimEnd()}\n\n${section}${content.slice(timeline.end)}`;
    return `${content.trimEnd()}\n\n${section}`;
  }

  private prependRoutineLog(content: string, entry: string): string {
    const tableHeader = '| Date | Routine |\n| --- | --- |';
    const row = entry;
    if (content.includes(row)) return content;
    const routineLog = this.findHeadingSection(content, 'Routine Log');
    const perpetualLog = this.findHeadingSection(content, 'Perpetual Log');
    const existing = routineLog || perpetualLog;
    if (existing) {
      const body = content.slice(existing.bodyStart, existing.end).trim();
      const normalized = body.includes('| Date | Routine |') ? body : `${tableHeader}\n${body}`;
      const lines = normalized.split(/\r?\n/);
      const insertIndex = lines.findIndex((line) => /^\|\s*---/.test(line));
      if (insertIndex >= 0) lines.splice(insertIndex + 1, 0, row);
      else lines.unshift(row);
      return this.replaceSection(content, routineLog ? 'Routine Log' : 'Perpetual Log', lines.join('\n'));
    }

    const routine = this.findHeadingSection(content, 'Routine') || this.findHeadingSection(content, 'Perpetual');
    const section = `### Routine Log\n\n${tableHeader}\n${row}\n`;
    if (routine) return `${content.slice(0, routine.end).trimEnd()}\n\n${section}${content.slice(routine.end)}`;
    return `${content.trimEnd()}\n\n${section}`;
  }

  private parseRoutineLine(
    line: string,
    lineNumber: number
  ): {
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
  } | null {
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
      cadence: every ? 'custom' : (cadence as 'daily' | 'weekly' | 'monthly'),
      startDate,
      interval: every ? Number(every[1]) : 1,
      unit: every ? (unitChar === 'w' ? 'week' : unitChar === 'm' ? 'month' : 'day') : cadence === 'weekly' ? 'week' : cadence === 'monthly' ? 'month' : 'day',
      lineNumber,
      raw,
      completedDates: [],
    };
  }

  private parseRoutineCompletedDates(section: string, routineText: string): string[] {
    const dates: string[] = [];
    for (const line of section.split(/\r?\n/)) {
      const row = line.match(/^\|\s*(\d{4}-\d{2}-\d{2})\s*\|\s*(.+?)\s*\|?$/);
      if (row && row[2].trim() === routineText) dates.push(row[1]);
      const legacy = line.match(/^-\s+(\d{4}-\d{2}-\d{2})\s+completed:\s+(.+)$/);
      if (legacy && legacy[2].trim() === routineText) dates.push(legacy[1]);
    }
    return Array.from(new Set(dates)).sort();
  }

  private routineScheduleLabel(item: { cadence: 'daily' | 'weekly' | 'monthly' | 'custom'; interval: number; unit: 'day' | 'week' | 'month'; startDate: string }): string {
    const interval = item.cadence === 'custom' ? `@every ${item.interval}${item.unit[0]}` : `@${item.cadence}`;
    return item.startDate ? `${interval} @start ${item.startDate}` : interval;
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

  private getSection(content: string, title: string): string {
    const section = this.findHeadingSection(content, title);
    return section ? content.slice(section.bodyStart, section.end) : '';
  }

  private findHeadingSection(content: string, title: string): { start: number; bodyStart: number; end: number; level: number } | null {
    const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`^(#{2,6})\\s+${escaped}\\s*$`, 'gim');
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

  private parseDependencyList(section: string, label: string): string[] {
    const lines = section.split(/\r?\n/);
    const values: string[] = [];
    let active = false;
    for (const line of lines) {
      if (new RegExp(`^\\s*${label}:\\s*$`, 'i').test(line)) {
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

  private parsePlainList(section: string): string[] {
    return section
      .split(/\r?\n/)
      .map((line) => line.match(/^\s*[-*]\s+(.+)/)?.[1]?.trim() ?? '')
      .filter(Boolean);
  }

  private parseSmallActions(content: string): SmallAction[] {
    const actions: SmallAction[] = [];
    let heading = '';

    content.split(/\r?\n/).forEach((line, index) => {
      const headingMatch = line.match(/^#{1,6}\s+(.+)$/);
      if (headingMatch?.[1]) heading = headingMatch[1].trim();

      const task = line.match(/^\s*[-*]\s+\[([ xX])\]\s+(.+)$/);
      if (!task?.[2]) return;

      const rawText = task[2].trim();
      const dueDate = this.extractTaskDate(rawText, '\\u{1F4C5}');
      const scheduledDate = this.extractTaskDate(rawText, '\\u{23F3}');
      const doneDate = this.extractTaskDate(rawText, '\\u{2705}');
      const priority = this.extractTaskPriority(rawText);

      actions.push({
        cardPath: '',
        cardTitle: '',
        text: this.stripTaskMetadata(rawText),
        done: task[1].toLowerCase() === 'x',
        dueDate,
        scheduledDate,
        doneDate,
        priority,
        heading,
        lineNumber: index + 1,
        lineText: line,
        raw: line,
      });
    });

    return actions;
  }

  private extractTaskDate(textValue: string, marker: string): string {
    const match = textValue.match(new RegExp(`${marker}\\s*(\\d{4}-\\d{2}-\\d{2})`, 'u'));
    return match?.[1] ?? '';
  }

  private extractTaskPriority(textValue: string): SmallActionPriority {
    if (/\u{23EB}/u.test(textValue)) return 'highest';
    if (/\u{1F53C}/u.test(textValue)) return 'high';
    if (/\u{1F53D}/u.test(textValue)) return 'low';
    if (/\u{23EC}/u.test(textValue)) return 'lowest';
    return 'normal';
  }

  private stripTaskMetadata(textValue: string): string {
    return textValue
      .replace(/[\u{1F4C5}\u{23F3}\u{2705}]\s*\d{4}-\d{2}-\d{2}/gu, '')
      .replace(/[\u{23EB}\u{1F53C}\u{1F53D}\u{23EC}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
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
      const parentFile = card.parent ? this.resolveLinkedFile(card.parent, card.path) : null;
      const parentCard = parentFile ? cards.find((item) => item.path === parentFile.path || item.file.basename === parentFile.basename) : undefined;
      const projectTitles = this.resolveHierarchyTitles(card.projects, card.path, cards);
      const subprojectTitles = this.resolveHierarchyTitles(card.subprojects, card.path, cards);
      card.parentPath = subprojectCard?.path ?? projectCard?.path ?? parentCard?.path ?? subprojectFile?.path ?? projectFile?.path ?? parentFile?.path ?? '';
      card.parentTitle = subprojectCard?.title ?? projectCard?.title ?? parentCard?.title ?? subprojectFile?.basename ?? projectFile?.basename ?? parentFile?.basename ?? text(card.subproject || card.project || card.parent);
      if (card.type === 'project') {
        card.projectTitle = card.title;
        card.projectTitles = [card.title];
        card.subprojectTitle = '';
        card.subprojectTitles = [];
      } else if (card.type === 'subproject') {
        card.projectTitle = (projectCard?.title ?? projectFile?.basename ?? parentCard?.title ?? parentFile?.basename ?? text(card.project || card.parent)) || 'No project';
        card.projectTitles = projectTitles.length ? projectTitles : [card.projectTitle];
        card.subprojectTitle = card.title;
        card.subprojectTitles = [card.title];
      } else if (card.type === 'big_action') {
        card.projectTitle = (projectCard?.title ?? projectFile?.basename ?? subprojectCard?.projectTitle ?? parentCard?.projectTitle ?? text(card.project)) || 'No project';
        card.subprojectTitle = subprojectCard?.title ?? subprojectFile?.basename ?? (parentCard?.type === 'subproject' ? parentCard.title : '') ?? text(card.subproject);
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
    return /\b(done|complete|completed)\b/.test(value) || value.includes('?꾨즺');
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
