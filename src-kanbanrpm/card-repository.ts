import { Notice, TFile, normalizePath, stringifyYaml } from 'obsidian';
import { WORKSTREAM_TYPES } from './constants';
import type KanbanRPMPlugin from './main';
import type { ActionItem, CardIssue, CardIssueLevel, NewCardValues, ProjectCard, Status } from './types';
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
        projectTitle: '',
        subprojectTitle: '',
        breadcrumb: '',
        colorKey: '',
        priority: parsePriority(fm.priority),
        workstreamType: text(fm.workstream_type),
        nextAction: sectionData.currentFocus,
        waitingFor: sectionData.waitingFor,
        blocker: sectionData.blocker,
        nextReview: sectionData.nextReview,
        dueDate: sectionData.dueDate,
        dependsOn: sectionData.dependsOn,
        blocks: sectionData.blocks,
        blockedBy: [],
        sourceNotes: sectionData.sourceNotes,
        perpetuals: sectionData.perpetuals.map((item) => ({
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
    let path = normalizePath(`${this.plugin.cardsFolder}/${baseName}.md`);
    let index = 2;
    while (this.plugin.app.vault.getAbstractFileByPath(path)) {
      path = normalizePath(`${this.plugin.cardsFolder}/${baseName} ${index}.md`);
      index += 1;
    }

    const parent = values.parent.trim();
    const parentLine = parent ? `\nparent: ${yamlScalar(parent)}` : '';
    const content = this.getLivingDocTemplate(values, title, baseName, parentLine);

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
      parent: values.parent.trim(),
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

  async promoteActionToBigAction(action: ActionItem): Promise<TFile> {
    const parentCard = (await this.loadCards()).find((card) => card.path === action.cardPath);
    const title = action.text.replace(/#todo\b/g, '').trim() || 'Promoted Big Action';
    const file = await this.createCard({
      title,
      type: 'big_action',
      parent: parentCard ? `[[${parentCard.file.basename}]]` : '',
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
    frontmatter.type = 'project';
    frontmatter.status = card.status;
    frontmatter.priority = card.priority;

    const copyPath = this.getAvailablePath(this.plugin.cardsFolder, sanitizeFileName(copyTitle), file.extension);
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
      if (!this.plugin.settings.statuses.some((status) => status.id === text(fm.status))) {
        add('error', 'status', `Unknown status "${text(fm.status) || '(empty)'}"; card is shown in ${this.plugin.settings.statuses[0]?.label ?? 'Inbox'}.`);
      }

      const rawPriority = Number(fm.priority);
      if (!Number.isFinite(rawPriority) || rawPriority < 1 || rawPriority > 5 || Math.round(rawPriority) !== rawPriority) {
        add('warning', 'priority', `Priority should be an integer from 1 to 5; current value is "${text(fm.priority) || '(empty)'}".`);
      }

      const category = text(fm.workstream_type).trim();
      if (category && !WORKSTREAM_TYPES.includes(category)) {
        add('warning', 'workstream_type', `category is not in the suggested vocabulary: ${WORKSTREAM_TYPES.join(', ')}.`);
      }

      const order = text(fm.order).trim();
      if (order && !Number.isFinite(Number(order))) add('warning', 'order', `order should be numeric; current value is "${order}".`);

      const refs = [...card.sourceNotes, ...card.dependsOn, ...card.blocks];
      for (const ref of refs) {
        if (ref.includes('[[') && !this.resolveLinkedFile(ref, card.path)) {
          add('warning', 'links', `Could not resolve linked note ${ref}.`);
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

      for (const dependency of card.dependsOn) {
        const name = sanitizeFileName(`${dependency} to ${card.title}`);
        const path = normalizePath(`${this.plugin.arrowsFolder}/${name}.md`);
        if (this.plugin.app.vault.getAbstractFileByPath(path)) continue;

        const content = `---\nkanban_rpm: true\ntype: arrow\nrelationship: depends_on\nfrom: ${yamlScalar(dependency)}\nto: ${yamlScalar(cardLink)}\ncard: ${yamlScalar(cardLink)}\n---\n\n# ${dependency} -> ${card.title}\n`;
        await this.plugin.app.vault.create(path, content);
        created += 1;
      }

      for (const blocked of card.blocks) {
        const name = sanitizeFileName(`${card.title} blocks ${blocked}`);
        const path = normalizePath(`${this.plugin.arrowsFolder}/${name}.md`);
        if (this.plugin.app.vault.getAbstractFileByPath(path)) continue;

        const content = `---\nkanban_rpm: true\ntype: arrow\nrelationship: blocks\nfrom: ${yamlScalar(cardLink)}\nto: ${yamlScalar(blocked)}\ncard: ${yamlScalar(cardLink)}\n---\n\n# ${card.title} -> ${blocked}\n`;
        await this.plugin.app.vault.create(path, content);
        created += 1;
      }
    }

    new Notice(`KanbanRPM wrote ${created} dependency arrow notes.`);
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

  private getLivingDocTemplate(values: NewCardValues, title: string, baseName: string, parentLine: string): string {
    const currentFocus = values.nextAction.trim() ? `- ${values.nextAction.trim()}\n` : '';
    const bigAction = values.nextAction.trim() ? `### ${values.nextAction.trim()}\n\n- [ ] ${values.nextAction.trim()}\n\n` : '';
    const waiting = values.waitingFor.trim() ? `- ${values.waitingFor.trim()}\n` : '';
    const blocker = values.blocker.trim() ? `- ${values.blocker.trim()}\n` : '';
    const timelineRows = [
      values.nextReview.trim() ? `- Next review: ${values.nextReview.trim()}` : '',
      values.dueDate.trim() ? `- Due date: ${values.dueDate.trim()}` : '',
    ].filter(Boolean).join('\n');
    const depends = textareaToList(values.dependsOn).map((item) => `- ${item}`).join('\n');
    const blocks = textareaToList(values.blocks).map((item) => `- ${item}`).join('\n');
    const references = textareaToList(values.sourceNotes).map((item) => `- ${item}`).join('\n');
    const typeLabel = values.type === 'big_action' ? 'Big Action' : values.type === 'subproject' ? 'Subproject' : 'Project';
    const parentDisplay = values.parent.trim() || title;

    return `---\nkanban_rpm: true\ntype: ${yamlScalar(values.type)}\nid: ${yamlScalar(baseName)}\nstatus: ${yamlScalar(values.status)}${parentLine}\norder: \n---\n\n# ${title}\n\n> [!kanban-rpm]\n> type: ${typeLabel}\n> status: ${values.status}\n> project: ${parentDisplay}\n\n## Current Focus\n\n${currentFocus}\n## Subprojects\n\n## Big Actions\n\n${bigAction}## Waiting\n\n${waiting}## Blockers\n\n${blocker}## Dependencies\n\nDepends on:\n${depends}\n\nBlocks:\n${blocks}\n\n## Perpetual\n\n## Notes\n\n## Decisions\n\n## Timeline\n\n${timelineRows}\n\n## References\n\n${references}\n\n## PM Metadata\n\n${this.renderNonEmptyMetadata(values)}`;
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
    perpetuals: Array<{ cardPath: string; cardTitle: string; text: string; cadence: 'daily' | 'weekly' | 'monthly' }>;
    actionCount: number;
  } {
    const dependencies = this.getSection(content, 'Dependencies');
    const currentFocus = this.firstListItem(this.getSection(content, 'Current Focus'));
    const waitingFor = this.firstListItem(this.getSection(content, 'Waiting'));
    const blocker = this.firstListItem(this.getSection(content, 'Blockers'));
    const timeline = this.getSection(content, 'Timeline');
    const perpetual = this.getSection(content, 'Perpetual');
    const references = this.getSection(content, 'References');
    const nextReview = this.parseTimelineDate(timeline, 'Next review');
    const dueDate = this.parseTimelineDate(timeline, 'Due date');
    const dependsOn = this.parseDependencyList(dependencies, 'Depends on');
    const blocks = this.parseDependencyList(dependencies, 'Blocks');
    const perpetuals = perpetual
      .split(/\r?\n/)
      .map((line) => line.match(/^\s*[-*]\s+\[[ xX-]\]\s+(.+?)\s+@(daily|weekly|monthly)\b/))
      .filter((match): match is RegExpMatchArray => Boolean(match))
      .map((match) => ({
        cardPath: '',
        cardTitle: '',
        text: match[1].trim(),
        cadence: match[2] as 'daily' | 'weekly' | 'monthly',
      }));
    const actionCount = content.split(/\r?\n/).filter((line) => /^\s*[-*]\s+\[ \]\s+/.test(line)).length;
    const sourceNotes = this.parsePlainList(references).filter((item) => item.includes('[['));
    return { currentFocus, waitingFor, blocker, nextReview, dueDate, dependsOn, blocks, sourceNotes, perpetuals, actionCount };
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
    next = this.replaceSection(next, 'Dependencies', `Depends on:\n${textareaToList(values.dependsOn).map((item) => `- ${item}`).join('\n')}\n\nBlocks:\n${textareaToList(values.blocks).map((item) => `- ${item}`).join('\n')}\n`);
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

  private replaceSection(content: string, title: string, body: string): string {
    const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const normalizedBody = body.trimEnd();
    const replacement = `## ${title}\n\n${normalizedBody}${normalizedBody ? '\n' : ''}`;
    const pattern = new RegExp(`^##\\s+${escaped}\\s*$[\\s\\S]*?(?=^##\\s+|$)`, 'im');
    if (pattern.test(content)) return content.replace(pattern, replacement);
    return `${content.trimEnd()}\n\n${replacement}`;
  }

  private parseTimelineDate(section: string, label: string): string {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = section.match(new RegExp(`${escaped}:\\s*(\\d{4}-\\d{2}-\\d{2})`, 'i'));
    return match?.[1] ?? '';
  }

  private getSection(content: string, title: string): string {
    const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = content.match(new RegExp(`^##\\s+${escaped}\\s*$([\\s\\S]*?)(?=^##\\s+|$)`, 'im'));
    return match?.[1] ?? '';
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

  private normalizeCardType(value: string): ProjectCard['type'] {
    if (value === 'subproject' || value === 'big_action' || value === 'project') return value;
    return 'project';
  }

  private applyHierarchy(cards: ProjectCard[]): void {
    for (const card of cards) {
      const parentFile = card.parent ? this.resolveLinkedFile(card.parent, card.path) : null;
      const parentCard = parentFile ? cards.find((item) => item.path === parentFile.path || item.file.basename === parentFile.basename) : undefined;
      card.parentPath = parentCard?.path ?? parentFile?.path ?? '';
      card.parentTitle = parentCard?.title ?? parentFile?.basename ?? text(card.parent);
      if (card.type === 'project' || !card.parentTitle) {
        card.projectTitle = card.title;
        card.subprojectTitle = '';
      } else if (parentCard?.type === 'project') {
        card.projectTitle = parentCard.title;
        card.subprojectTitle = card.type === 'subproject' ? card.title : '';
      } else {
        card.projectTitle = parentCard?.projectTitle || card.parentTitle || card.title;
        card.subprojectTitle = parentCard?.type === 'subproject' ? parentCard.title : parentCard?.subprojectTitle || '';
      }
      card.breadcrumb = [card.projectTitle, card.subprojectTitle && card.subprojectTitle !== card.title ? card.subprojectTitle : '']
        .filter(Boolean)
        .join(' > ');
      card.colorKey = card.projectTitle || card.title;
    }
  }

  private applyBlockedBy(cards: ProjectCard[]): void {
    const doneStatus = this.plugin.settings.statuses.find((status) => status.id === 'done')?.id ?? 'done';
    for (const card of cards) card.blockedBy = [];
    for (const card of cards) {
      for (const dependency of card.dependsOn) {
        const dependencyFile = this.resolveLinkedFile(dependency, card.path);
        const dependencyCard = dependencyFile ? cards.find((item) => item.path === dependencyFile.path) : undefined;
        if (dependencyCard && dependencyCard.status !== doneStatus) card.blockedBy.push(dependencyCard.title);
      }
      for (const blocked of card.blocks) {
        const blockedFile = this.resolveLinkedFile(blocked, card.path);
        const blockedCard = blockedFile ? cards.find((item) => item.path === blockedFile.path) : undefined;
        if (blockedCard && card.status !== doneStatus) blockedCard.blockedBy.push(card.title);
      }
    }
  }

  private hasCircularDependency(card: ProjectCard, cards: ProjectCard[]): boolean {
    const visited = new Set<string>();
    const visit = (current: ProjectCard): boolean => {
      if (visited.has(current.path)) return false;
      visited.add(current.path);
      for (const dependency of current.dependsOn) {
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
