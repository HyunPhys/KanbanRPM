import { App, Modal, Notice, Setting } from 'obsidian';
import type KanbanRPMPlugin from './main';
import type { DailyPullMode, NewCardValues, ProjectCard, Status } from './types';
import { isDueSoon, isPastDate, isStatus } from './utils';

type ListFieldKey = keyof Pick<NewCardValues, 'dependsOn' | 'blocks' | 'sourceNotes'>;

export class NewProjectCardModal extends Modal {
  private plugin: KanbanRPMPlugin;
  private parentOptions: ProjectCard[] = [];
  private values: NewCardValues = {
    title: '',
    type: 'project',
    project: '',
    subproject: '',
    status: 'inbox',
    priority: '3',
    workstreamType: '',
    nextAction: '',
    waitingFor: '',
    blocker: '',
    nextReview: '',
    dueDate: '',
    dependsOn: '',
    blocks: '',
    sourceNotes: '',
  };

  constructor(app: App, plugin: KanbanRPMPlugin, defaultStatus: Status = 'inbox') {
    super(app);
    this.plugin = plugin;
    this.values.status = defaultStatus;
  }

  async onOpen(): Promise<void> {
    this.parentOptions = await this.plugin.loadCards();
    this.renderForm();
  }

  private renderForm(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h2', { text: 'New KanbanRPM living document' });

    this.markRequired(new Setting(contentEl).setName('Title')).addText((input) => {
      input.setPlaceholder('TTT Manuscript');
      input.setValue(this.values.title);
      input.onChange((value) => {
        this.values.title = value;
      });
    });

    const grid = contentEl.createDiv({ cls: 'kanban-rpm-modal-grid' });
    this.addCoreFields(grid);

    new Setting(contentEl).setName('Current focus').addTextArea((input) => {
      input.setPlaceholder('Write the current focus or first big action');
      input.setValue(this.values.nextAction);
      input.onChange((value) => {
        this.values.nextAction = value;
      });
    });

    this.addAdvancedFields(contentEl);

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
    this.markRequired(new Setting(grid).setName('Status')).addDropdown((dropdown) => {
      for (const lane of this.plugin.settings.statuses) dropdown.addOption(lane.id, lane.label);
      dropdown.setValue(this.values.status);
      dropdown.onChange((value) => {
        if (isStatus(value)) this.values.status = value;
      });
    });

    this.markRequired(new Setting(grid).setName('Type')).addDropdown((dropdown) => {
      dropdown.addOption('project', 'Project');
      dropdown.addOption('subproject', 'Subproject');
      dropdown.addOption('big_action', 'Big Action');
      dropdown.setValue(this.values.type);
      dropdown.onChange((value) => {
        if (value === 'project' || value === 'subproject' || value === 'big_action') {
          this.values.type = value;
          this.values.project = '';
          this.values.subproject = '';
          this.renderForm();
        }
      });
    });

    this.addHierarchyDropdowns(grid);

  }

  private addAdvancedFields(container: HTMLElement): void {
    const details = container.createEl('details', { cls: 'kanban-rpm-modal-advanced' });
    details.createEl('summary', { text: 'Advanced metadata' });
    details.createDiv({
      cls: 'kanban-rpm-modal-help',
      text: 'Optional structured hints. Prefer writing rich context in the document body.',
    });
    const grid = details.createDiv({ cls: 'kanban-rpm-modal-grid' });

    new Setting(grid).setName('Priority').addDropdown((dropdown) => {
      for (const value of ['1', '2', '3', '4', '5']) dropdown.addOption(value, `P${value}`);
      dropdown.setValue(this.values.priority);
      dropdown.onChange((value) => {
        this.values.priority = value;
      });
    });

    this.addVocabularyDropdown(grid, 'Category', 'workstreamType', this.plugin.settings.categories);

    new Setting(details).setName('Waiting for').addText((input) => {
      input.setValue(this.values.waitingFor);
      input.onChange((value) => {
        this.values.waitingFor = value;
      });
    });

    new Setting(details).setName('Blocker').addText((input) => {
      input.setValue(this.values.blocker);
      input.onChange((value) => {
        this.values.blocker = value;
      });
    });

    const dateGrid = details.createDiv({ cls: 'kanban-rpm-modal-grid' });
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

    this.addListField(details, 'Source notes', '[[250506 Lab setup meeting]]', 'sourceNotes');
    this.addListField(details, 'Depends on', 'drawing\nquotation', 'dependsOn');
    this.addListField(details, 'Blocks', 'missing quote', 'blocks');
  }

  private addVocabularyDropdown(
    grid: HTMLElement,
    name: string,
    key: keyof Pick<NewCardValues, 'workstreamType'>,
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

  private addHierarchyDropdowns(grid: HTMLElement): void {
    if (this.values.type === 'project') {
      new Setting(grid).setName('Project scope').addDropdown((dropdown) => {
        dropdown.addOption('', 'Top-level Project');
        dropdown.setDisabled(true);
      });
      return;
    }

    this.markRequired(new Setting(grid).setName('Project'), 'Required for Subproject and Big Action').addDropdown((dropdown) => {
      dropdown.addOption('', 'Choose project');
      for (const project of this.getProjectOptions()) dropdown.addOption(this.parentValue(project), project.title);
      dropdown.setValue(this.values.project);
      dropdown.onChange((value) => {
        this.values.project = value;
        this.values.subproject = '';
        this.renderForm();
      });
    });

    if (this.values.type === 'big_action') {
      this.markRequired(new Setting(grid).setName('Subproject'), 'Required for Big Action').addDropdown((dropdown) => {
        dropdown.addOption('', this.values.project ? 'Choose subproject' : 'Choose project first');
        for (const subproject of this.getSubprojectOptions()) {
          dropdown.addOption(this.parentValue(subproject), subproject.title);
        }
        dropdown.setValue(this.values.subproject);
        dropdown.onChange((value) => {
          this.values.subproject = value;
        });
        dropdown.setDisabled(!this.values.project);
      });
    }
  }

  private getProjectOptions(): ProjectCard[] {
    return this.parentOptions.filter((card) => card.type === 'project').sort((a, b) => a.title.localeCompare(b.title));
  }

  private getSubprojectOptions(): ProjectCard[] {
    if (!this.values.project) return [];
    const selectedProject = this.findCardByValue(this.values.project);
    if (!selectedProject) return [];
    return this.parentOptions
      .filter((card) => card.type === 'subproject' && card.projectTitle === selectedProject.title)
      .sort((a, b) => a.title.localeCompare(b.title));
  }

  private findCardByValue(value: string): ProjectCard | undefined {
    return this.parentOptions.find((card) => this.parentValue(card) === value);
  }

  private parentValue(card: ProjectCard): string {
    return `[[${card.file.basename}]]`;
  }

  private async createCard(): Promise<void> {
    if (!this.values.title.trim()) {
      new Notice('KanbanRPM card needs a title.');
      return;
    }
    if (this.values.type !== 'project' && !this.values.project.trim()) {
      new Notice('Subproject and Big Action documents need a Project.');
      return;
    }
    if (this.values.type === 'big_action' && this.findCardByValue(this.values.subproject)?.type !== 'subproject') {
      new Notice('Big Action documents need a Subproject.');
      return;
    }

    await this.plugin.createCard(this.values);
    this.close();
  }

  private markRequired(setting: Setting, desc?: string): Setting {
    setting.nameEl.createSpan({ cls: 'kanban-rpm-required', text: ' *' });
    if (desc) setting.setDesc(desc);
    return setting;
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

export class EditProjectCardModal extends Modal {
  private plugin: KanbanRPMPlugin;
  private card: ProjectCard;
  private values: NewCardValues;
  private parentOptions: ProjectCard[] = [];

  constructor(app: App, plugin: KanbanRPMPlugin, card: ProjectCard) {
    super(app);
    this.plugin = plugin;
    this.card = card;
    this.values = {
      title: card.title,
      type: card.type,
      project: card.project || (card.type === 'subproject' ? card.parent : ''),
      subproject: card.subproject || (card.type === 'big_action' ? card.parent : ''),
      status: card.status,
      priority: String(card.priority),
      workstreamType: card.workstreamType,
      nextAction: card.nextAction,
      waitingFor: card.waitingFor,
      blocker: card.blocker,
      nextReview: card.nextReview,
      dueDate: card.dueDate,
      dependsOn: card.dependsOn.join('\n'),
      blocks: card.blocks.join('\n'),
      sourceNotes: card.sourceNotes.join('\n'),
    };
  }

  async onOpen(): Promise<void> {
    this.parentOptions = (await this.plugin.loadCards()).filter((card) => card.path !== this.card.path);
    this.inferMissingHierarchy();
    this.renderForm();
  }

  private inferMissingHierarchy(): void {
    if (this.values.type !== 'big_action' || this.values.project || !this.values.subproject) return;
    const subproject = this.parentOptions.find((card) => this.parentValue(card) === this.values.subproject);
    if (subproject?.project) this.values.project = subproject.project;
  }

  private renderForm(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h2', { text: 'Edit KanbanRPM living document' });

    this.markRequired(new Setting(contentEl).setName('Title')).addText((input) => {
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

    this.addAdvancedFields(contentEl);

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
    this.markRequired(new Setting(grid).setName('Status')).addDropdown((dropdown) => {
      for (const lane of this.plugin.settings.statuses) dropdown.addOption(lane.id, lane.label);
      dropdown.setValue(this.values.status);
      dropdown.onChange((value) => {
        if (isStatus(value)) this.values.status = value;
      });
    });

    this.markRequired(new Setting(grid).setName('Type')).addDropdown((dropdown) => {
      dropdown.addOption('project', 'Project');
      dropdown.addOption('subproject', 'Subproject');
      dropdown.addOption('big_action', 'Big Action');
      dropdown.setValue(this.values.type);
      dropdown.onChange((value) => {
        if (value === 'project' || value === 'subproject' || value === 'big_action') {
          this.values.type = value;
          this.values.project = '';
          this.values.subproject = '';
          this.renderForm();
        }
      });
    });

    this.addHierarchyDropdowns(grid);

  }

  private addAdvancedFields(container: HTMLElement): void {
    const details = container.createEl('details', { cls: 'kanban-rpm-modal-advanced' });
    details.createEl('summary', { text: 'Advanced metadata' });
    details.createDiv({
      cls: 'kanban-rpm-modal-help',
      text: 'Optional structured hints. Prefer writing rich context in the document body.',
    });
    const grid = details.createDiv({ cls: 'kanban-rpm-modal-grid' });

    new Setting(grid).setName('Priority').addDropdown((dropdown) => {
      for (const value of ['1', '2', '3', '4', '5']) dropdown.addOption(value, `P${value}`);
      dropdown.setValue(this.values.priority);
      dropdown.onChange((value) => {
        this.values.priority = value;
      });
    });

    this.addVocabularyDropdown(grid, 'Category', 'workstreamType', this.plugin.settings.categories);

    new Setting(details).setName('Waiting for').addText((input) => {
      input.setValue(this.values.waitingFor);
      input.onChange((value) => {
        this.values.waitingFor = value;
      });
    });

    new Setting(details).setName('Blocker').addText((input) => {
      input.setValue(this.values.blocker);
      input.onChange((value) => {
        this.values.blocker = value;
      });
    });

    const dateGrid = details.createDiv({ cls: 'kanban-rpm-modal-grid' });
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

    this.addListField(details, 'Source notes', '[[250506 Lab setup meeting]]', 'sourceNotes');
    this.addListField(details, 'Depends on', 'drawing\nquotation', 'dependsOn');
    this.addListField(details, 'Blocks', 'missing quote', 'blocks');
  }

  private addVocabularyDropdown(
    grid: HTMLElement,
    name: string,
    key: keyof Pick<NewCardValues, 'workstreamType'>,
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

  private addHierarchyDropdowns(grid: HTMLElement): void {
    if (this.values.type === 'project') {
      new Setting(grid).setName('Project scope').addDropdown((dropdown) => {
        dropdown.addOption('', 'Top-level Project');
        dropdown.setDisabled(true);
      });
      return;
    }

    this.markRequired(new Setting(grid).setName('Project'), 'Required for Subproject and Big Action').addDropdown((dropdown) => {
      dropdown.addOption('', 'Choose project');
      for (const project of this.getProjectOptions()) dropdown.addOption(this.parentValue(project), project.title);
      if (this.values.project && !this.getProjectOptions().some((card) => this.parentValue(card) === this.values.project)) {
        dropdown.addOption(this.values.project, this.values.project);
      }
      dropdown.setValue(this.values.project);
      dropdown.onChange((value) => {
        this.values.project = value;
        this.values.subproject = '';
        this.renderForm();
      });
    });

    if (this.values.type === 'big_action') {
      this.markRequired(new Setting(grid).setName('Subproject'), 'Required for Big Action').addDropdown((dropdown) => {
        dropdown.addOption('', this.values.project ? 'Choose subproject' : 'Choose project first');
        for (const subproject of this.getSubprojectOptions()) dropdown.addOption(this.parentValue(subproject), subproject.title);
        if (this.values.subproject && !this.getSubprojectOptions().some((card) => this.parentValue(card) === this.values.subproject)) {
          dropdown.addOption(this.values.subproject, this.values.subproject);
        }
        dropdown.setValue(this.values.subproject);
        dropdown.onChange((value) => {
          this.values.subproject = value;
        });
        dropdown.setDisabled(!this.values.project);
      });
    }
  }

  private getProjectOptions(): ProjectCard[] {
    return this.parentOptions.filter((card) => card.type === 'project').sort((a, b) => a.title.localeCompare(b.title));
  }

  private getSubprojectOptions(): ProjectCard[] {
    if (!this.values.project) return [];
    const selectedProject = this.findCardByValue(this.values.project);
    if (!selectedProject) return [];
    return this.parentOptions
      .filter((card) => card.type === 'subproject' && card.projectTitle === selectedProject.title)
      .sort((a, b) => a.title.localeCompare(b.title));
  }

  private findCardByValue(value: string): ProjectCard | undefined {
    return this.parentOptions.find((card) => this.parentValue(card) === value);
  }

  private parentValue(card: ProjectCard): string {
    return `[[${card.file.basename}]]`;
  }

  private async saveChanges(): Promise<void> {
    if (!this.values.title.trim()) {
      new Notice('KanbanRPM card needs a title.');
      return;
    }
    if (this.values.type !== 'project' && !this.values.project.trim()) {
      new Notice('Subproject and Big Action documents need a Project.');
      return;
    }
    if (this.values.type === 'big_action' && this.findCardByValue(this.values.subproject)?.type !== 'subproject') {
      new Notice('Big Action documents need a Subproject.');
      return;
    }

    await this.plugin.updateCard(this.card, this.values);
    this.close();
  }

  private markRequired(setting: Setting, desc?: string): Setting {
    setting.nameEl.createSpan({ cls: 'kanban-rpm-required', text: ' *' });
    if (desc) setting.setDesc(desc);
    return setting;
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
      cls: 'kanban-rpm-daily-card-summary',
      text: `${candidates.length} candidates - ${withNext.length} with Current Focus - ${this.selected.size} selected`,
    });

    const controls = contentEl.createDiv({ cls: 'kanban-rpm-daily-card-controls' });
    controls.createEl('button', { text: 'Select all with Current Focus' }).addEventListener('click', () => {
      this.selected = new Set(withNext.map((card) => card.path));
      this.render();
    });
    controls.createEl('button', { text: 'Clear selection' }).addEventListener('click', () => {
      this.selected.clear();
      this.render();
    });

    const list = contentEl.createDiv({ cls: 'kanban-rpm-daily-card-list' });
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
    const activeStatus = this.getConfiguredStatusId('active');
    const waitingStatus = this.getConfiguredStatusId('waiting');
    const blockedStatus = this.getConfiguredStatusId('blocked');
    const doneStatus = this.getConfiguredStatusId('done');

    switch (this.mode) {
      case 'active':
        return this.cards.filter((card) => card.status === activeStatus);
      case 'waiting':
        return this.cards.filter((card) => card.status === waitingStatus || Boolean(card.waitingFor));
      case 'blocked':
        return this.cards.filter((card) => card.status === blockedStatus || Boolean(card.blocker) || card.blockedBy.length);
      case 'all-visible':
        return this.cards.filter((card) => card.status !== doneStatus);
      case 'review':
      default:
        return this.cards.filter((card) => isPastDate(card.nextReview) || isDueSoon(card.nextReview) || isPastDate(card.dueDate) || isDueSoon(card.dueDate));
    }
  }

  private getConfiguredStatusId(preferredId: string): Status {
    return this.plugin.settings.statuses.find((status) => status.id === preferredId)?.id ?? preferredId;
  }

  private renderCardOption(container: HTMLElement, card: ProjectCard): void {
    const row = container.createDiv({ cls: `kanban-rpm-daily-card-row${card.nextAction ? '' : ' is-disabled'}` });
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

    const body = row.createDiv({ cls: 'kanban-rpm-daily-card-body' });
    body.createDiv({ cls: 'kanban-rpm-daily-card-title', text: card.title });
    body.createDiv({
      cls: 'kanban-rpm-daily-card-meta',
      text: [
        card.projectTitle ? `project: ${card.projectTitle}` : '',
        card.subprojectTitle ? `subproject: ${card.subprojectTitle}` : '',
        `status: ${card.status}`,
        `P${card.priority}`,
        card.nextReview ? `review: ${card.nextReview}` : '',
        card.dueDate ? `due: ${card.dueDate}` : '',
      ]
        .filter(Boolean)
        .join(' - '),
    });
    body.createDiv({ cls: 'kanban-rpm-daily-card-path', text: card.nextAction || 'No Current Focus; cannot send to Daily.' });

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
