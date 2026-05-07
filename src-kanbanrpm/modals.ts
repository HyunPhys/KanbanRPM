import { App, Modal, Notice, Setting } from 'obsidian';
import { IMPORTANCE_VALUES, PROJECT_KINDS, WORKSTREAM_TYPES } from './constants';
import type KanbanRPMPlugin from './main';
import type { DailyPullMode, LegacyProjectCandidate, NewCardValues, ProjectCard, Status } from './types';
import { isDueSoon, isPastDate, isStatus } from './utils';

type ListFieldKey = keyof Pick<
  NewCardValues,
  'relatedSamples' | 'relatedPhenomena' | 'relatedPeople' | 'relatedNotes' | 'dependsOn' | 'blocks' | 'sourceNotes'
>;

export class NewProjectCardModal extends Modal {
  private plugin: KanbanRPMPlugin;
  private values: NewCardValues = {
    title: '',
    type: 'project',
    parent: '',
    status: 'inbox',
    priority: '3',
    area: '',
    group: '',
    workstreamType: '',
    projectKind: '',
    stage: '',
    nextAction: '',
    waitingFor: '',
    blocker: '',
    nextReview: '',
    dueDate: '',
    importance: 'normal',
    legacyLinks: '',
    relatedSamples: '',
    relatedPhenomena: '',
    relatedPeople: '',
    relatedNotes: '',
    dependsOn: '',
    blocks: '',
    sourceNotes: '',
  };

  constructor(app: App, plugin: KanbanRPMPlugin, defaultStatus: Status = 'inbox') {
    super(app);
    this.plugin = plugin;
    this.values.status = defaultStatus;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h2', { text: 'New KanbanRPM living document' });

    new Setting(contentEl).setName('Title').addText((input) => {
      input.setPlaceholder('TTT Manuscript');
      input.onChange((value) => {
        this.values.title = value;
      });
    });

    const grid = contentEl.createDiv({ cls: 'kanban-rpm-modal-grid' });
    this.addCoreFields(grid);

    new Setting(contentEl).setName('Current focus').addTextArea((input) => {
      input.setPlaceholder('Write the current focus or first big action');
      input.onChange((value) => {
        this.values.nextAction = value;
      });
    });

    new Setting(contentEl).setName('Waiting for').addText((input) => {
      input.onChange((value) => {
        this.values.waitingFor = value;
      });
    });

    new Setting(contentEl).setName('Blocker').addText((input) => {
      input.onChange((value) => {
        this.values.blocker = value;
      });
    });

    const dateGrid = contentEl.createDiv({ cls: 'kanban-rpm-modal-grid' });
    new Setting(dateGrid).setName('Next review').addText((input) => {
      input.setPlaceholder('YYYY-MM-DD');
      input.onChange((value) => {
        this.values.nextReview = value;
      });
    });

    new Setting(dateGrid).setName('Due date').addText((input) => {
      input.setPlaceholder('YYYY-MM-DD');
      input.onChange((value) => {
        this.values.dueDate = value;
      });
    });

    new Setting(contentEl)
      .setName('Legacy links')
      .setDesc('Comma or newline separated wikilinks')
      .addTextArea((input) => {
        input.setPlaceholder('[[old project note]]');
        input.onChange((value) => {
          this.values.legacyLinks = value;
        });
      });

    this.addListField(contentEl, 'Related people', 'vendor\nprofessor\ndepartment admin', 'relatedPeople');
    this.addListField(contentEl, 'Source notes', '[[250506 Lab setup meeting]]', 'sourceNotes');
    this.addListField(contentEl, 'Related samples', '[[(24.09.11) TTT Sample 4]]', 'relatedSamples');
    this.addListField(contentEl, 'Related phenomena', 'asymmetry\nsaturation', 'relatedPhenomena');
    this.addListField(contentEl, 'Related notes', '[[TTT Analysis]]', 'relatedNotes');
    this.addListField(contentEl, 'Depends on', 'drawing\nquotation', 'dependsOn');
    this.addListField(contentEl, 'Blocks', 'missing quote', 'blocks');

    new Setting(contentEl)
      .addButton((button) => {
        button
          .setButtonText('Create document')
          .setCta()
          .onClick(() => {
            void this.createCard();
          });
      })
      .addButton((button) => {
        button.setButtonText('Cancel').onClick(() => this.close());
      });
  }

  private addCoreFields(grid: HTMLElement): void {
    new Setting(grid).setName('Status').addDropdown((dropdown) => {
      for (const lane of this.plugin.settings.statuses) dropdown.addOption(lane.id, lane.label);
      dropdown.setValue(this.values.status);
      dropdown.onChange((value) => {
        if (isStatus(value)) this.values.status = value;
      });
    });

    new Setting(grid).setName('Type').addDropdown((dropdown) => {
      dropdown.addOption('project', 'Project');
      dropdown.addOption('subproject', 'Subproject');
      dropdown.addOption('big_action', 'Big Action');
      dropdown.setValue(this.values.type);
      dropdown.onChange((value) => {
        if (value === 'project' || value === 'subproject' || value === 'big_action') this.values.type = value;
      });
    });

    new Setting(grid).setName('Parent').addText((input) => {
      input.setPlaceholder('[[TTT]]');
      input.onChange((value) => {
        this.values.parent = value;
      });
    });

    new Setting(grid).setName('Priority').addDropdown((dropdown) => {
      for (const value of ['1', '2', '3', '4', '5']) dropdown.addOption(value, `P${value}`);
      dropdown.setValue(this.values.priority);
      dropdown.onChange((value) => {
        this.values.priority = value;
      });
    });

    new Setting(grid).setName('Area').addText((input) => {
      input.setPlaceholder('research');
      input.onChange((value) => {
        this.values.area = value;
      });
    });

    new Setting(grid).setName('Group').addText((input) => {
      input.setPlaceholder('TTT');
      input.onChange((value) => {
        this.values.group = value;
      });
    });

    this.addVocabularyDropdown(grid, 'Workstream type', 'workstreamType', WORKSTREAM_TYPES);
    this.addVocabularyDropdown(grid, 'Project kind', 'projectKind', PROJECT_KINDS);

    new Setting(grid).setName('Stage').addText((input) => {
      input.setPlaceholder('quotation');
      input.onChange((value) => {
        this.values.stage = value;
      });
    });

    this.addVocabularyDropdown(grid, 'Importance', 'importance', IMPORTANCE_VALUES, 'normal');
  }

  private addVocabularyDropdown(
    grid: HTMLElement,
    name: string,
    key: keyof Pick<NewCardValues, 'workstreamType' | 'projectKind' | 'importance'>,
    values: string[],
    fallback = ''
  ): void {
    new Setting(grid).setName(name).addDropdown((dropdown) => {
      if (!fallback) dropdown.addOption('', '');
      for (const value of values) dropdown.addOption(value, value);
      dropdown.setValue(this.values[key] || fallback);
      dropdown.onChange((value) => {
        this.values[key] = value;
      });
    });
  }

  private async createCard(): Promise<void> {
    if (!this.values.title.trim()) {
      new Notice('KanbanRPM card needs a title.');
      return;
    }

    await this.plugin.createCard(this.values);
    this.close();
  }

  private addListField(container: HTMLElement, name: string, placeholder: string, key: ListFieldKey): void {
    new Setting(container)
      .setName(name)
      .setDesc('Comma or newline separated values')
      .addTextArea((input) => {
        input.setPlaceholder(placeholder);
        input.onChange((value) => {
          this.values[key] = value;
        });
      });
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

export class EditProjectCardModal extends Modal {
  private plugin: KanbanRPMPlugin;
  private card: ProjectCard;
  private values: NewCardValues;

  constructor(app: App, plugin: KanbanRPMPlugin, card: ProjectCard) {
    super(app);
    this.plugin = plugin;
    this.card = card;
    this.values = {
      title: card.title,
      type: card.type === 'legacy' ? 'project' : card.type,
      parent: card.parent,
      status: card.status,
      priority: String(card.priority),
      area: card.area,
      group: card.group,
      workstreamType: card.workstreamType,
      projectKind: card.projectKind,
      stage: card.stage,
      nextAction: card.nextAction,
      waitingFor: card.waitingFor,
      blocker: card.blocker,
      nextReview: card.nextReview,
      dueDate: card.dueDate,
      importance: card.importance,
      legacyLinks: card.legacyLinks.join('\n'),
      relatedSamples: card.relatedSamples.join('\n'),
      relatedPhenomena: card.relatedPhenomena.join('\n'),
      relatedPeople: card.relatedPeople.join('\n'),
      relatedNotes: card.relatedNotes.join('\n'),
      dependsOn: card.dependsOn.join('\n'),
      blocks: card.blocks.join('\n'),
      sourceNotes: card.sourceNotes.join('\n'),
    };
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h2', { text: 'Edit KanbanRPM living document' });

    new Setting(contentEl).setName('Title').addText((input) => {
      input.setValue(this.values.title);
      input.onChange((value) => {
        this.values.title = value;
      });
    });

    const grid = contentEl.createDiv({ cls: 'kanban-rpm-modal-grid' });
    this.addCoreFields(grid);

    new Setting(contentEl).setName('Next action').addTextArea((input) => {
      input.setValue(this.values.nextAction);
      input.onChange((value) => {
        this.values.nextAction = value;
      });
    });

    new Setting(contentEl).setName('Waiting for').addText((input) => {
      input.setValue(this.values.waitingFor);
      input.onChange((value) => {
        this.values.waitingFor = value;
      });
    });

    new Setting(contentEl).setName('Blocker').addText((input) => {
      input.setValue(this.values.blocker);
      input.onChange((value) => {
        this.values.blocker = value;
      });
    });

    const dateGrid = contentEl.createDiv({ cls: 'kanban-rpm-modal-grid' });
    new Setting(dateGrid).setName('Next review').addText((input) => {
      input.setPlaceholder('YYYY-MM-DD');
      input.setValue(this.values.nextReview);
      input.onChange((value) => {
        this.values.nextReview = value;
      });
    });

    new Setting(dateGrid).setName('Due date').addText((input) => {
      input.setPlaceholder('YYYY-MM-DD');
      input.setValue(this.values.dueDate);
      input.onChange((value) => {
        this.values.dueDate = value;
      });
    });

    new Setting(contentEl)
      .setName('Legacy links')
      .setDesc('Comma or newline separated wikilinks')
      .addTextArea((input) => {
        input.setValue(this.values.legacyLinks);
        input.onChange((value) => {
          this.values.legacyLinks = value;
        });
      });

    this.addListField(contentEl, 'Related people', 'vendor\nprofessor\ndepartment admin', 'relatedPeople');
    this.addListField(contentEl, 'Source notes', '[[250506 Lab setup meeting]]', 'sourceNotes');
    this.addListField(contentEl, 'Related samples', '[[(24.09.11) TTT Sample 4]]', 'relatedSamples');
    this.addListField(contentEl, 'Related phenomena', 'asymmetry\nsaturation', 'relatedPhenomena');
    this.addListField(contentEl, 'Related notes', '[[TTT Analysis]]', 'relatedNotes');
    this.addListField(contentEl, 'Depends on', 'drawing\nquotation', 'dependsOn');
    this.addListField(contentEl, 'Blocks', 'missing quote', 'blocks');

    new Setting(contentEl)
      .addButton((button) => {
        button
          .setButtonText('Save changes')
          .setCta()
          .onClick(() => {
            void this.saveChanges();
          });
      })
      .addButton((button) => {
        button.setButtonText('Cancel').onClick(() => this.close());
      });
  }

  private addCoreFields(grid: HTMLElement): void {
    new Setting(grid).setName('Status').addDropdown((dropdown) => {
      for (const lane of this.plugin.settings.statuses) dropdown.addOption(lane.id, lane.label);
      dropdown.setValue(this.values.status);
      dropdown.onChange((value) => {
        if (isStatus(value)) this.values.status = value;
      });
    });

    new Setting(grid).setName('Type').addDropdown((dropdown) => {
      dropdown.addOption('project', 'Project');
      dropdown.addOption('subproject', 'Subproject');
      dropdown.addOption('big_action', 'Big Action');
      dropdown.setValue(this.values.type);
      dropdown.onChange((value) => {
        if (value === 'project' || value === 'subproject' || value === 'big_action') this.values.type = value;
      });
    });

    new Setting(grid).setName('Parent').addText((input) => {
      input.setPlaceholder('[[TTT]]');
      input.setValue(this.values.parent);
      input.onChange((value) => {
        this.values.parent = value;
      });
    });

    new Setting(grid).setName('Priority').addDropdown((dropdown) => {
      for (const value of ['1', '2', '3', '4', '5']) dropdown.addOption(value, `P${value}`);
      dropdown.setValue(this.values.priority);
      dropdown.onChange((value) => {
        this.values.priority = value;
      });
    });

    new Setting(grid).setName('Area').addText((input) => {
      input.setValue(this.values.area);
      input.onChange((value) => {
        this.values.area = value;
      });
    });

    new Setting(grid).setName('Group').addText((input) => {
      input.setPlaceholder('TTT');
      input.setValue(this.values.group);
      input.onChange((value) => {
        this.values.group = value;
      });
    });

    this.addVocabularyDropdown(grid, 'Workstream type', 'workstreamType', WORKSTREAM_TYPES);
    this.addVocabularyDropdown(grid, 'Project kind', 'projectKind', PROJECT_KINDS);

    new Setting(grid).setName('Stage').addText((input) => {
      input.setPlaceholder('quotation');
      input.setValue(this.values.stage);
      input.onChange((value) => {
        this.values.stage = value;
      });
    });

    this.addVocabularyDropdown(grid, 'Importance', 'importance', IMPORTANCE_VALUES, 'normal');
  }

  private addVocabularyDropdown(
    grid: HTMLElement,
    name: string,
    key: keyof Pick<NewCardValues, 'workstreamType' | 'projectKind' | 'importance'>,
    values: string[],
    fallback = ''
  ): void {
    new Setting(grid).setName(name).addDropdown((dropdown) => {
      if (!fallback) dropdown.addOption('', '');
      for (const value of values) dropdown.addOption(value, value);
      dropdown.setValue(this.values[key] || fallback);
      dropdown.onChange((value) => {
        this.values[key] = value;
      });
    });
  }

  private async saveChanges(): Promise<void> {
    if (!this.values.title.trim()) {
      new Notice('KanbanRPM card needs a title.');
      return;
    }

    await this.plugin.updateCard(this.card, this.values);
    this.close();
  }

  private addListField(container: HTMLElement, name: string, placeholder: string, key: ListFieldKey): void {
    new Setting(container)
      .setName(name)
      .setDesc('Comma or newline separated values')
      .addTextArea((input) => {
        input.setPlaceholder(placeholder);
        input.setValue(this.values[key]);
        input.onChange((value) => {
          this.values[key] = value;
        });
      });
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

export interface ConfirmCardActionOptions {
  title: string;
  message: string;
  confirmText: string;
  onConfirm: () => Promise<void>;
}

export class NewGroupModal extends Modal {
  private plugin: KanbanRPMPlugin;
  private groupName = '';

  constructor(app: App, plugin: KanbanRPMPlugin) {
    super(app);
    this.plugin = plugin;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h2', { text: 'New KanbanRPM group' });

    new Setting(contentEl).setName('Group name').addText((input) => {
      input.setPlaceholder('TTT');
      input.onChange((value) => {
        this.groupName = value;
      });
    });

    new Setting(contentEl)
      .addButton((button) => {
        button
          .setButtonText('Create group')
          .setCta()
          .onClick(() => {
            void this.createGroup();
          });
      })
      .addButton((button) => {
        button.setButtonText('Cancel').onClick(() => this.close());
      });
  }

  private async createGroup(): Promise<void> {
    if (!this.groupName.trim()) {
      new Notice('KanbanRPM group needs a name.');
      return;
    }

    await this.plugin.createGroup(this.groupName);
    await this.plugin.refreshViews();
    this.close();
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

export class ConfirmCardActionModal extends Modal {
  private options: ConfirmCardActionOptions;

  constructor(app: App, options: ConfirmCardActionOptions) {
    super(app);
    this.options = options;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h2', { text: this.options.title });
    contentEl.createEl('p', { text: this.options.message });

    new Setting(contentEl)
      .addButton((button) => {
        button
          .setButtonText(this.options.confirmText)
          .setWarning()
          .onClick(async () => {
            await this.options.onConfirm();
            this.close();
          });
      })
      .addButton((button) => {
        button.setButtonText('Cancel').onClick(() => this.close());
      });
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

export class LegacyImportModal extends Modal {
  private plugin: KanbanRPMPlugin;
  private candidates: LegacyProjectCandidate[] = [];
  private selected = new Set<string>();
  private loading = true;

  constructor(app: App, plugin: KanbanRPMPlugin) {
    super(app);
    this.plugin = plugin;
  }

  async onOpen(): Promise<void> {
    await this.loadCandidates();
  }

  private async loadCandidates(): Promise<void> {
    this.loading = true;
    this.render();
    this.candidates = await this.plugin.scanLegacyProjectNotes();
    this.selected = new Set(this.candidates.filter((candidate) => !candidate.alreadySeeded).map((candidate) => candidate.path));
    this.loading = false;
    this.render();
  }

  private render(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('kanban-rpm-legacy-modal');
    contentEl.createEl('h2', { text: 'Import legacy project notes' });
    contentEl.createEl('p', {
      cls: 'kanban-rpm-modal-help',
      text: 'Preview-only scan. KanbanRPM creates new cards with legacy_links and never edits the original notes.',
    });

    if (this.loading) {
      contentEl.createDiv({ cls: 'kanban-rpm-empty', text: 'Scanning legacy project notes...' });
      return;
    }

    const available = this.candidates.filter((candidate) => !candidate.alreadySeeded);
    const seeded = this.candidates.length - available.length;
    contentEl.createDiv({
      cls: 'kanban-rpm-legacy-summary',
      text: `${this.candidates.length} candidates - ${available.length} available - ${seeded} already seeded`,
    });

    if (!this.candidates.length) {
      contentEl.createDiv({ cls: 'kanban-rpm-empty', text: 'No legacy project candidates found.' });
    } else {
      const controls = contentEl.createDiv({ cls: 'kanban-rpm-legacy-controls' });
      controls.createEl('button', { text: 'Select all available' }).addEventListener('click', () => {
        this.selected = new Set(available.map((candidate) => candidate.path));
        this.render();
      });
      controls.createEl('button', { text: 'Clear selection' }).addEventListener('click', () => {
        this.selected.clear();
        this.render();
      });

      const list = contentEl.createDiv({ cls: 'kanban-rpm-legacy-list' });
      for (const candidate of this.candidates) this.renderCandidate(list, candidate);
    }

    new Setting(contentEl)
      .addButton((button) => {
        button
          .setButtonText(`Seed ${this.selected.size} cards`)
          .setCta()
          .onClick(() => {
            void this.seedSelected();
          });
      })
      .addButton((button) => {
        button.setButtonText('Rescan').onClick(() => {
          void this.loadCandidates();
        });
      })
      .addButton((button) => {
        button.setButtonText('Close').onClick(() => this.close());
      });
  }

  private renderCandidate(container: HTMLElement, candidate: LegacyProjectCandidate): void {
    const row = container.createDiv({
      cls: `kanban-rpm-legacy-row${candidate.alreadySeeded ? ' is-seeded' : ''}`,
    });

    const checkbox = row.createEl('input', {
      attr: {
        type: 'checkbox',
        'aria-label': `Select ${candidate.title}`,
      },
    });
    checkbox.checked = this.selected.has(candidate.path);
    checkbox.disabled = candidate.alreadySeeded;
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) this.selected.add(candidate.path);
      else this.selected.delete(candidate.path);
    });

    const body = row.createDiv({ cls: 'kanban-rpm-legacy-body' });
    const title = body.createDiv({ cls: 'kanban-rpm-legacy-title' });
    title.createSpan({ text: candidate.title });
    if (candidate.alreadySeeded) {
      title.createSpan({ cls: 'kanban-rpm-legacy-seeded', text: `already seeded: ${candidate.existingCardTitle}` });
    }

    body.createDiv({ cls: 'kanban-rpm-legacy-path', text: candidate.path });
    body.createDiv({
      cls: 'kanban-rpm-legacy-meta',
      text: [
        `status: ${candidate.status}`,
        `priority: P${candidate.priority}`,
        candidate.group ? `group: ${candidate.group}` : '',
        candidate.reasons.join(', '),
      ]
        .filter(Boolean)
        .join(' - '),
    });

    row.createEl('button', { text: 'Open' }).addEventListener('click', () => {
      void this.plugin.openFilePath(candidate.path);
    });
  }

  private async seedSelected(): Promise<void> {
    const candidates = this.candidates.filter((candidate) => this.selected.has(candidate.path) && !candidate.alreadySeeded);
    if (!candidates.length) {
      new Notice('No legacy project notes selected.');
      return;
    }

    await this.plugin.seedLegacyProjectCards(candidates);
    await this.loadCandidates();
  }
}

export class DailyPullModal extends Modal {
  private plugin: KanbanRPMPlugin;
  private cards: ProjectCard[];
  private mode: DailyPullMode = 'review';
  private selected = new Set<string>();

  constructor(app: App, plugin: KanbanRPMPlugin, cards: ProjectCard[]) {
    super(app);
    this.plugin = plugin;
    this.cards = cards;
    this.resetSelection();
  }

  onOpen(): void {
    this.render();
  }

  private render(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('kanban-rpm-daily-modal');
    contentEl.createEl('h2', { text: 'Pull cards to Daily' });
    contentEl.createEl('p', {
      cls: 'kanban-rpm-modal-help',
      text: 'Select workstream cards to append to today\'s existing Daily note. Duplicate lines are skipped.',
    });

    const modeRow = contentEl.createDiv({ cls: 'kanban-rpm-daily-modes' });
    for (const [mode, label] of [
      ['review', 'Review due'],
      ['active', 'Active'],
      ['waiting', 'Waiting'],
      ['blocked', 'Blocked'],
      ['all-visible', 'All visible'],
    ] as Array<[DailyPullMode, string]>) {
      modeRow
        .createEl('button', { cls: this.mode === mode ? 'mod-cta' : '', text: label })
        .addEventListener('click', () => {
          this.mode = mode;
          this.resetSelection();
          this.render();
        });
    }

    const candidates = this.getCandidates();
    const withNext = candidates.filter((card) => card.nextAction);
    contentEl.createDiv({
      cls: 'kanban-rpm-legacy-summary',
      text: `${candidates.length} candidates - ${withNext.length} with next_action - ${this.selected.size} selected`,
    });

    const controls = contentEl.createDiv({ cls: 'kanban-rpm-legacy-controls' });
    controls.createEl('button', { text: 'Select all with next_action' }).addEventListener('click', () => {
      this.selected = new Set(withNext.map((card) => card.path));
      this.render();
    });
    controls.createEl('button', { text: 'Clear selection' }).addEventListener('click', () => {
      this.selected.clear();
      this.render();
    });

    const list = contentEl.createDiv({ cls: 'kanban-rpm-legacy-list' });
    if (!candidates.length) {
      list.createDiv({ cls: 'kanban-rpm-empty', text: 'No cards match this pull mode.' });
    } else {
      for (const card of candidates) this.renderCardOption(list, card);
    }

    new Setting(contentEl)
      .addButton((button) => {
        button
          .setButtonText(`Send ${this.selected.size} to Daily`)
          .setCta()
          .onClick(() => {
            void this.sendSelected();
          });
      })
      .addButton((button) => {
        button.setButtonText('Close').onClick(() => this.close());
      });
  }

  private resetSelection(): void {
    this.selected = new Set(this.getCandidates().filter((card) => card.nextAction).map((card) => card.path));
  }

  private getCandidates(): ProjectCard[] {
    switch (this.mode) {
      case 'active':
        return this.cards.filter((card) => card.status === 'active');
      case 'waiting':
        return this.cards.filter((card) => card.status === 'waiting' || Boolean(card.waitingFor));
      case 'blocked':
        return this.cards.filter((card) => card.status === 'blocked' || Boolean(card.blocker));
      case 'all-visible':
        return this.cards.filter((card) => card.status !== 'done');
      case 'review':
      default:
        return this.cards.filter((card) => isPastDate(card.nextReview) || isDueSoon(card.nextReview) || isPastDate(card.dueDate) || isDueSoon(card.dueDate));
    }
  }

  private renderCardOption(container: HTMLElement, card: ProjectCard): void {
    const row = container.createDiv({ cls: `kanban-rpm-legacy-row${card.nextAction ? '' : ' is-seeded'}` });
    const checkbox = row.createEl('input', {
      attr: {
        type: 'checkbox',
        'aria-label': `Select ${card.title}`,
      },
    });
    checkbox.checked = this.selected.has(card.path);
    checkbox.disabled = !card.nextAction;
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) this.selected.add(card.path);
      else this.selected.delete(card.path);
    });

    const body = row.createDiv({ cls: 'kanban-rpm-legacy-body' });
    body.createDiv({ cls: 'kanban-rpm-legacy-title', text: card.title });
    body.createDiv({
      cls: 'kanban-rpm-legacy-meta',
      text: [
        card.group ? `group: ${card.group}` : '',
        `status: ${card.status}`,
        `P${card.priority}`,
        card.nextReview ? `review: ${card.nextReview}` : '',
        card.dueDate ? `due: ${card.dueDate}` : '',
      ]
        .filter(Boolean)
        .join(' - '),
    });
    body.createDiv({ cls: 'kanban-rpm-legacy-path', text: card.nextAction || 'No next_action; cannot send to Daily.' });

    row.createEl('button', { text: 'Open' }).addEventListener('click', () => {
      void this.plugin.openCard(card);
    });
  }

  private async sendSelected(): Promise<void> {
    const selectedCards = this.cards.filter((card) => this.selected.has(card.path));
    if (!selectedCards.length) {
      new Notice('No KanbanRPM cards selected for Daily.');
      return;
    }

    await this.plugin.sendCardsToDaily(selectedCards);
    this.close();
  }
}
