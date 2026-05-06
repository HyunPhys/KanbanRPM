import { Notice, TFile, normalizePath, stringifyYaml } from 'obsidian';
import { IMPORTANCE_VALUES, LANES, PROJECT_KINDS, WORKSTREAM_TYPES } from './constants';
import type KanbanRPMPlugin from './main';
import type { ActionItem, CardIssue, CardIssueLevel, LegacyProjectCandidate, NewCardValues, ProjectCard, Status } from './types';
import {
  compareCards,
  getWikiLinkTarget,
  isStatus,
  isValidDateString,
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

    for (const file of this.plugin.app.vault.getMarkdownFiles()) {
      if (!file.path.startsWith(prefix)) continue;

      const cache = this.plugin.app.metadataCache.getFileCache(file);
      const fm = cache?.frontmatter ?? {};
      if (fm.kanban_rpm !== true && fm.kanban_rpm !== 'true') continue;

      const status = isStatus(fm.status) ? fm.status : 'inbox';
      cards.push({
        file,
        path: file.path,
        title: text(fm.title) || file.basename,
        status,
        priority: parsePriority(fm.priority),
        area: text(fm.area),
        group: text(fm.group),
        workstreamType: text(fm.workstream_type),
        projectKind: text(fm.project_kind),
        stage: text(fm.stage),
        nextAction: text(fm.next_action),
        waitingFor: text(fm.waiting_for),
        blocker: text(fm.blocker),
        nextReview: text(fm.next_review),
        dueDate: text(fm.due_date),
        importance: text(fm.importance) || 'normal',
        legacyLinks: Array.isArray(fm.legacy_links)
          ? fm.legacy_links.map(text).filter(Boolean)
          : text(fm.legacy_links)
            ? [text(fm.legacy_links)]
            : [],
        relatedSamples: toStringList(fm.related_samples),
        relatedPhenomena: toStringList(fm.related_phenomena),
        relatedPeople: toStringList(fm.related_people),
        relatedNotes: toStringList(fm.related_notes),
        dependsOn: toStringList(fm.depends_on),
        blocks: toStringList(fm.blocks),
        sourceNotes: toStringList(fm.source_notes),
        rpmOrder: parseOrder(fm.rpm_order),
      });
    }

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

    const content = `---\nkanban_rpm: true\ntype: project\nstatus: ${yamlScalar(values.status)}\npriority: ${yamlScalar(values.priority || 3)}\narea: ${yamlScalar(values.area)}\ngroup: ${yamlScalar(values.group)}\nworkstream_type: ${yamlScalar(values.workstreamType)}\nproject_kind: ${yamlScalar(values.projectKind)}\nstage: ${yamlScalar(values.stage)}\ntitle: ${yamlScalar(title)}\nnext_action: ${yamlScalar(values.nextAction)}\nwaiting_for: ${yamlScalar(values.waitingFor)}\nblocker: ${yamlScalar(values.blocker)}\nnext_review: ${yamlScalar(values.nextReview)}\ndue_date: ${yamlScalar(values.dueDate)}\nimportance: ${yamlScalar(values.importance || 'normal')}\nrpm_order: \nlegacy_links: ${yamlArray(textareaToList(values.legacyLinks))}\nrelated_samples: ${yamlArray(textareaToList(values.relatedSamples))}\nrelated_phenomena: ${yamlArray(textareaToList(values.relatedPhenomena))}\nrelated_people: ${yamlArray(textareaToList(values.relatedPeople))}\nrelated_notes: ${yamlArray(textareaToList(values.relatedNotes))}\ndepends_on: ${yamlArray(textareaToList(values.dependsOn))}\nblocks: ${yamlArray(textareaToList(values.blocks))}\nsource_notes: ${yamlArray(textareaToList(values.sourceNotes))}\n---\n\n## Active Actions\n\n## Waiting\n\n## Decision Log\n\n## Timeline\n\n## References\n`;

    const file = await this.plugin.app.vault.create(path, content);
    new Notice(`KanbanRPM card created: ${title}`);
    await this.plugin.refreshViews();
    return file;
  }

  async scanLegacyProjectNotes(): Promise<LegacyProjectCandidate[]> {
    await this.plugin.ensureWorkspace();
    const cards = await this.loadCards();
    const seeded = new Map<string, string>();

    for (const card of cards) {
      for (const link of card.legacyLinks) {
        const linked = this.resolveLinkedFile(link, card.path);
        if (linked instanceof TFile) seeded.set(linked.path, card.title);

        const target = getWikiLinkTarget(link);
        if (target) {
          seeded.set(normalizePath(target.endsWith('.md') ? target : `${target}.md`), card.title);
        }
      }
    }

    const candidates: LegacyProjectCandidate[] = [];

    for (const file of this.plugin.app.vault.getMarkdownFiles()) {
      if (this.shouldSkipLegacyScanPath(file.path)) continue;

      const cache = this.plugin.app.metadataCache.getFileCache(file);
      const fm = cache?.frontmatter ?? {};
      const reasons = this.getLegacyCandidateReasons(file, fm);
      if (!reasons.length) continue;

      const status = isStatus(fm.status) ? fm.status : 'inbox';
      const title = text(fm.title) || file.basename;
      const legacyLink = `[[${file.basename}]]`;
      const existingCardTitle = seeded.get(file.path) ?? seeded.get(normalizePath(file.path)) ?? seeded.get(normalizePath(file.basename + '.md')) ?? '';

      candidates.push({
        file,
        path: file.path,
        title,
        status,
        priority: parsePriority(fm.priority),
        area: text(fm.area),
        group: text(fm.group) || this.inferGroupFromPath(file.path),
        projectKind: text(fm.project_kind) || text(fm.projectKind),
        workstreamType: text(fm.workstream_type) || text(fm.workstreamType),
        stage: text(fm.stage),
        reasons,
        legacyLink,
        alreadySeeded: Boolean(existingCardTitle),
        existingCardTitle,
      });
    }

    return candidates.sort((a, b) => {
      if (a.alreadySeeded !== b.alreadySeeded) return a.alreadySeeded ? 1 : -1;
      return a.title.localeCompare(b.title);
    });
  }

  async seedLegacyProjectCards(candidates: LegacyProjectCandidate[]): Promise<TFile[]> {
    await this.plugin.ensureWorkspace();
    const freshCandidates = (await this.scanLegacyProjectNotes()).filter((candidate) => !candidate.alreadySeeded);
    const freshPaths = new Set(freshCandidates.map((candidate) => candidate.path));
    const created: TFile[] = [];

    for (const candidate of candidates) {
      if (!freshPaths.has(candidate.path)) continue;

      const file = this.plugin.app.vault.getAbstractFileByPath(candidate.path);
      if (!(file instanceof TFile)) continue;

      const baseName = sanitizeFileName(candidate.title);
      const path = this.getAvailablePath(this.plugin.cardsFolder, baseName, 'md');
      const content = `---\nkanban_rpm: true\ntype: project\nstatus: ${yamlScalar(candidate.status)}\npriority: ${yamlScalar(candidate.priority || 3)}\narea: ${yamlScalar(candidate.area)}\ngroup: ${yamlScalar(candidate.group)}\nworkstream_type: ${yamlScalar(candidate.workstreamType)}\nproject_kind: ${yamlScalar(candidate.projectKind)}\nstage: ${yamlScalar(candidate.stage)}\ntitle: ${yamlScalar(candidate.title)}\nnext_action: \nwaiting_for: \nblocker: \nnext_review: \ndue_date: \nimportance: normal\nrpm_order: \nlegacy_links: ${yamlArray([candidate.legacyLink])}\nrelated_samples: []\nrelated_phenomena: []\nrelated_people: []\nrelated_notes: []\ndepends_on: []\nblocks: []\nsource_notes: []\n---\n\n## Active Actions\n\n## Waiting\n\n## Decision Log\n\n## Timeline\n\n## References\n\n## Legacy Context\n\n- ${candidate.legacyLink}\n`;;

      created.push(await this.plugin.app.vault.create(path, content));
    }

    await this.plugin.refreshViews();
    new Notice(`KanbanRPM seeded ${created.length} legacy project cards.`);
    return created;
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
      title: values.title.trim() || card.title,
      status: values.status,
      priority: parsePriority(values.priority),
      area: values.area.trim(),
      group: values.group.trim(),
      workstream_type: values.workstreamType.trim(),
      project_kind: values.projectKind.trim(),
      stage: values.stage.trim(),
      next_action: values.nextAction.trim(),
      waiting_for: values.waitingFor.trim(),
      blocker: values.blocker.trim(),
      next_review: values.nextReview.trim(),
      due_date: values.dueDate.trim(),
      importance: values.importance.trim() || 'normal',
      legacy_links: textareaToList(values.legacyLinks),
      related_samples: textareaToList(values.relatedSamples),
      related_phenomena: textareaToList(values.relatedPhenomena),
      related_people: textareaToList(values.relatedPeople),
      related_notes: textareaToList(values.relatedNotes),
      depends_on: textareaToList(values.dependsOn),
      blocks: textareaToList(values.blocks),
      source_notes: textareaToList(values.sourceNotes),
    });

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
      rpm_order: newOrder,
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

    for (const lane of LANES) {
      const laneCards = cards.filter((card) => card.status === lane.id).sort(compareCards);

      for (const [index, card] of laneCards.entries()) {
        const nextOrder = (index + 1) * 1000;
        if (card.rpmOrder === nextOrder) continue;

        const file = this.plugin.app.vault.getAbstractFileByPath(card.path);
        if (!(file instanceof TFile)) continue;

        await this.plugin.app.fileManager.processFrontMatter(file, (frontmatter) => {
          frontmatter.rpm_order = nextOrder;
        });
        updated += 1;
      }
    }

    await this.plugin.refreshViews();
    new Notice(`KanbanRPM normalized rpm_order on ${updated} cards.`);
  }

  async setNextAction(cardPath: string, nextAction: string): Promise<void> {
    const file = this.plugin.app.vault.getAbstractFileByPath(cardPath);
    if (!(file instanceof TFile)) return;

    await this.updateCardFrontmatter(file, {
      next_action: nextAction.trim(),
    });
    new Notice('KanbanRPM next_action updated from Action index.');
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
    delete frontmatter.rpm_order;
    delete frontmatter.archived;
    delete frontmatter.archived_at;

    frontmatter.kanban_rpm = true;
    frontmatter.type = 'project';
    frontmatter.title = copyTitle;
    frontmatter.status = card.status;
    frontmatter.priority = card.priority;

    const copyPath = this.getAvailablePath(this.plugin.cardsFolder, sanitizeFileName(copyTitle), file.extension);
    const copyContent = `---\n${stringifyYaml(frontmatter)}---\n${body}`;
    const newFile = await this.plugin.app.vault.create(copyPath, copyContent);

    new Notice(`Duplicated KanbanRPM card: ${copyTitle}`);
    await this.plugin.refreshViews();
    return newFile;
  }

  async createGroup(name: string): Promise<TFile> {
    await this.plugin.ensureWorkspace();
    const title = name.trim();
    const path = this.getAvailablePath(this.plugin.groupsFolder, sanitizeFileName(title), 'md');
    const content = `---\nkanban_rpm: true\ntype: group\ntitle: ${yamlScalar(title)}\n---\n\n# ${title}\n\n## Purpose\n\n## Workstreams\n\n## People\n\n## Timeline\n`;
    const file = await this.plugin.app.vault.create(path, content);
    new Notice(`KanbanRPM group created: ${title}`);
    return file;
  }

  async collectActionIndex(cards: ProjectCard[]): Promise<ActionItem[]> {
    const items: ActionItem[] = [];
    const seen = new Set<string>();

    for (const card of cards) {
      const refs = [...card.sourceNotes, ...card.legacyLinks, ...card.relatedNotes];

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

      if (fm.type && text(fm.type) !== 'project') add('warning', 'type', `Expected type "project"; current value is "${text(fm.type)}".`);
      if (!text(fm.title).trim()) add('warning', 'title', 'Missing title; file basename is being used.');
      if (!isStatus(fm.status)) add('error', 'status', `Invalid status "${text(fm.status) || '(empty)'}"; card is shown in Inbox.`);

      const rawPriority = Number(fm.priority);
      if (!Number.isFinite(rawPriority) || rawPriority < 1 || rawPriority > 5 || Math.round(rawPriority) !== rawPriority) {
        add('warning', 'priority', `Priority should be an integer from 1 to 5; current value is "${text(fm.priority) || '(empty)'}".`);
      }

      for (const field of ['next_review', 'due_date']) {
        const value = text(fm[field]).trim();
        if (value && !isValidDateString(value)) add('warning', field, `${field} should use YYYY-MM-DD; current value is "${value}".`);
      }

      for (const [field, allowed] of [
        ['workstream_type', WORKSTREAM_TYPES],
        ['project_kind', PROJECT_KINDS],
        ['importance', IMPORTANCE_VALUES],
      ] as Array<[string, string[]]>) {
        const value = text(fm[field]).trim();
        if (value && !allowed.includes(value)) {
          add('warning', field, `${field} is not in the suggested vocabulary: ${allowed.join(', ')}.`);
        }
      }

      if (fm.rpm_order !== null && fm.rpm_order !== undefined && text(fm.rpm_order).trim()) {
        const order = Number(fm.rpm_order);
        if (!Number.isFinite(order)) add('warning', 'rpm_order', `rpm_order should be numeric; current value is "${text(fm.rpm_order)}".`);
      }

      const refs = [
        ...toStringList(fm.source_notes),
        ...toStringList(fm.legacy_links),
        ...toStringList(fm.related_notes),
      ];
      for (const ref of refs) {
        if (ref.includes('[[') && !this.resolveLinkedFile(ref, card.path)) {
          add('warning', 'links', `Could not resolve linked note ${ref}.`);
        }
      }
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
    const prevOrder = previous?.rpmOrder ?? insertIndex * 1000;
    const nextOrder = next?.rpmOrder ?? (insertIndex + 2) * 1000;

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

  private shouldSkipLegacyScanPath(path: string): boolean {
    const normalized = normalizePath(path);
    return (
      normalized.startsWith(`${this.plugin.workspaceFolder}/`) ||
      normalized.startsWith('.obsidian/') ||
      normalized.startsWith('.trash/') ||
      normalized.startsWith('KanbanRPM/') ||
      normalized.startsWith('Laminar PM/') ||
      normalized.startsWith('reorganize/')
    );
  }

  private getLegacyCandidateReasons(file: TFile, fm: Record<string, unknown>): string[] {
    const reasons: string[] = [];
    const tags = this.extractTags(fm.tags);
    const lowerPath = file.path.toLowerCase();
    const lowerBase = file.basename.toLowerCase();

    if (file.path.includes('💼') || file.basename.includes('💼')) reasons.push('💼 path/title');
    if (text(fm.type).toLowerCase() === 'project') reasons.push('type: project');
    if (text(fm.category).toLowerCase() === 'project') reasons.push('category: project');
    if (tags.some((tag) => tag === 'project' || tag.startsWith('project/'))) reasons.push('project tag');
    if (lowerBase.includes('project') || lowerBase.includes('프로젝트')) reasons.push('project title');
    if (lowerPath.includes('/project/') || lowerPath.includes('/projects/')) reasons.push('project folder');

    return [...new Set(reasons)];
  }

  private extractTags(value: unknown): string[] {
    return toStringList(value)
      .flatMap((tag) => tag.split(/[,\s]+/))
      .map((tag) => tag.trim().replace(/^#/, '').toLowerCase())
      .filter(Boolean);
  }

  private inferGroupFromPath(path: string): string {
    const parts = normalizePath(path).split('/');
    const meaningful = parts.find((part) => part.includes('💼'));
    if (meaningful) return meaningful.replace('💼', '').trim();
    return '';
  }
}
