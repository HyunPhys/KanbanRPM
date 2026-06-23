import { App, Modal, Notice, Setting } from 'obsidian';
import { COMMUNICATION_TYPES } from './constants';
import type KanbanRPMPlugin from './main';
import type {
  CategoryDefinition,
  CommunicationSourceValues,
  GanttDateValues,
  NewCardValues,
  ParticipantSuggestion,
  ProjectCard,
  ResearchLogKind,
  ResearchLogValues,
  SmallAction,
  SmallActionMetadataValues,
  SmallActionPriority,
  Status,
} from './types';
import { isStatus } from './utils';

type ListFieldKey = keyof Pick<NewCardValues, 'dependsOn' | 'blocks' | 'sourceNotes' | 'projects' | 'subprojects'>;
export interface NewDocumentContext {
  status?: Status;
  projectTitle?: string;
  subprojectTitle?: string;
}

export class TimelineMemoModal extends Modal {
  private day: string;
  private value: string;
  private onSave: (value: string) => Promise<void>;

  constructor(app: App, day: string, initialValue: string, onSave: (value: string) => Promise<void>) {
    super(app);
    this.day = day;
    this.value = initialValue;
    this.onSave = onSave;
  }

  onOpen(): void {
    const { contentEl } = this;
    this.modalEl.addClass('kanban-rpm-memo-modal-shell');
    contentEl.empty();
    contentEl.addClass('kanban-rpm-memo-modal');
    contentEl.createEl('h2', { text: `${this.day} Memo` });
    contentEl.createDiv({
      cls: 'kanban-rpm-modal-help',
      text: 'Write Markdown for this Timeline date. Checkbox lines can be toggled from the Timeline preview.',
    });

    const editor = contentEl.createEl('textarea', {
      cls: 'kanban-rpm-timeline-memo-modal-input',
      attr: { 'aria-label': `${this.day} Timeline memo` },
    });
    editor.value = this.value;
    editor.focus();
    editor.setSelectionRange(editor.value.length, editor.value.length);
    editor.addEventListener('input', () => {
      this.value = editor.value;
    });

    new Setting(contentEl)
      .addButton((button) => {
        button
          .setButtonText('Save memo')
          .setCta()
          .onClick(() => {
            void this.save();
          });
      })
      .addButton((button) => {
        button.setButtonText('Cancel').onClick(() => this.close());
      });
  }

  private async save(): Promise<void> {
    await this.onSave(this.value);
    this.close();
  }
}

export class GanttDateModal extends Modal {
  private values: GanttDateValues;
  private onSave: (values: GanttDateValues) => Promise<void>;

  constructor(app: App, private card: ProjectCard, onSave: (values: GanttDateValues) => Promise<void>) {
    super(app);
    this.values = {
      startDate: card.startDate,
      scheduledDate: card.scheduledDate,
      dueDate: card.dueDate,
      nextReview: card.nextReview,
    };
    this.onSave = onSave;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h2', { text: `Edit Gantt dates` });
    contentEl.createDiv({ cls: 'kanban-rpm-modal-help', text: this.card.title });
    const grid = contentEl.createDiv({ cls: 'kanban-rpm-modal-grid' });
    for (const [key, label] of [
      ['startDate', 'Start date'],
      ['scheduledDate', 'Scheduled date'],
      ['dueDate', 'Due date'],
      ['nextReview', 'Next review'],
    ] as Array<[keyof GanttDateValues, string]>) {
      new Setting(grid).setName(label).addText((input) => {
        input.inputEl.type = 'date';
        input.setPlaceholder('YYYY-MM-DD');
        input.setValue(this.values[key]);
        input.onChange((value) => {
          this.values[key] = value.trim();
        });
      });
    }

    new Setting(contentEl.createDiv({ cls: 'kanban-rpm-modal-footer' }))
      .addButton((button) => {
        button
          .setButtonText('Save dates')
          .setCta()
          .onClick(() => {
            void this.save();
          });
      })
      .addButton((button) => {
        button.setButtonText('Cancel').onClick(() => this.close());
      });
  }

  private async save(): Promise<void> {
    const invalid = Object.values(this.values).find((value) => value && !/^\d{4}-\d{2}-\d{2}$/.test(value));
    if (invalid) {
      new Notice('Dates must use YYYY-MM-DD.');
      return;
    }
    await this.onSave(this.values);
    this.close();
  }
}

export class SmallActionMetadataModal extends Modal {
  private values: SmallActionMetadataValues;
  private onSave: (values: SmallActionMetadataValues) => Promise<void>;

  constructor(app: App, private action: SmallAction, onSave: (values: SmallActionMetadataValues) => Promise<void>) {
    super(app);
    this.values = {
      scheduledDate: action.scheduledDate,
      dueDate: action.dueDate,
      priority: action.priority === 'medium' ? 'normal' : action.priority,
    };
    this.onSave = onSave;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h2', { text: 'Edit small action' });
    contentEl.createDiv({ cls: 'kanban-rpm-modal-help', text: this.action.text });

    new Setting(contentEl)
      .setName('Scheduled date')
      .setDesc('Leave empty to remove the scheduled date.')
      .addText((input) => {
        input.inputEl.type = 'date';
        input.setPlaceholder('YYYY-MM-DD');
        input.setValue(this.values.scheduledDate);
        input.onChange((value) => {
          this.values.scheduledDate = value.trim();
        });
      });

    new Setting(contentEl)
      .setName('Due date')
      .setDesc('Leave empty to remove the due date.')
      .addText((input) => {
        input.inputEl.type = 'date';
        input.setPlaceholder('YYYY-MM-DD');
        input.setValue(this.values.dueDate);
        input.onChange((value) => {
          this.values.dueDate = value.trim();
        });
      });

    new Setting(contentEl)
      .setName('Priority')
      .setDesc('Normal priority is stored by removing the @priority token.')
      .addDropdown((dropdown) => {
        for (const [value, label] of [
          ['highest', 'Highest'],
          ['high', 'High'],
          ['normal', 'Normal'],
          ['low', 'Low'],
          ['lowest', 'Lowest'],
        ] as Array<[SmallActionPriority, string]>) {
          dropdown.addOption(value, label);
        }
        dropdown.setValue(this.values.priority);
        dropdown.onChange((value) => {
          this.values.priority = value as SmallActionPriority;
        });
      });

    new Setting(contentEl.createDiv({ cls: 'kanban-rpm-modal-footer' }))
      .addButton((button) => {
        button
          .setButtonText('Save small action')
          .setCta()
          .onClick(() => {
            void this.save();
          });
      })
      .addButton((button) => {
        button.setButtonText('Cancel').onClick(() => this.close());
      });
  }

  private async save(): Promise<void> {
    const invalid = [this.values.scheduledDate, this.values.dueDate].find((value) => value && !/^\d{4}-\d{2}-\d{2}$/.test(value));
    if (invalid) {
      new Notice('Dates must use YYYY-MM-DD.');
      return;
    }
    await this.onSave(this.values);
    this.close();
  }
}

export class NewCommunicationSourceModal extends Modal {
  private values: CommunicationSourceValues = {
    title: '',
    type: 'meeting_internal',
    date: this.today(),
    participants: '',
    note: '',
  };
  private suggestions: ParticipantSuggestion[] = [];
  private participantsInput?: HTMLTextAreaElement;

  constructor(app: App, private plugin: KanbanRPMPlugin) {
    super(app);
  }

  async onOpen(): Promise<void> {
    this.suggestions = await this.plugin.loadParticipantSuggestions();
    this.renderForm();
  }

  private renderForm(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('kanban-rpm-card-modal');
    contentEl.createEl('h2', { text: 'New communication source note' });
    contentEl.createDiv({
      cls: 'kanban-rpm-modal-help',
      text: 'Create a source note and add it to the yearly Communication Log. Project documents are not modified.',
    });

    this.markRequired(new Setting(contentEl).setName('Title')).addText((input) => {
      input.setPlaceholder('Weekly lab meeting');
      input.setValue(this.values.title);
      input.onChange((value) => {
        this.values.title = value;
      });
    });

    const grid = contentEl.createDiv({ cls: 'kanban-rpm-modal-grid' });
    this.markRequired(new Setting(grid).setName('Type')).addDropdown((dropdown) => {
      for (const type of COMMUNICATION_TYPES) dropdown.addOption(type.id, type.label);
      dropdown.setValue(this.values.type);
      dropdown.onChange((value) => {
        if (COMMUNICATION_TYPES.some((type) => type.id === value)) this.values.type = value as CommunicationSourceValues['type'];
      });
    });

    this.markRequired(new Setting(grid).setName('Date')).addText((input) => {
      input.inputEl.type = 'date';
      input.setValue(this.values.date);
      input.onChange((value) => {
        this.values.date = value.trim();
      });
    });

    new Setting(contentEl).setName('Participants').setDesc('Comma or newline separated. You can also add frequent participants below.').addTextArea((input) => {
      input.setPlaceholder('Prof. Kim, vendor, collaborator');
      input.setValue(this.values.participants);
      this.participantsInput = input.inputEl;
      input.onChange((value) => {
        this.values.participants = value;
      });
    });

    this.renderParticipantSuggestions(contentEl);

    new Setting(contentEl).setName('Note').addTextArea((input) => {
      input.setPlaceholder('Short note for the Communication Log');
      input.setValue(this.values.note);
      input.onChange((value) => {
        this.values.note = value;
      });
    });

    new Setting(contentEl.createDiv({ cls: 'kanban-rpm-modal-footer' }))
      .addButton((button) => {
        button
          .setButtonText('Create source note')
          .setCta()
          .onClick(() => {
            void this.createSourceNote();
          });
      })
      .addButton((button) => {
        button.setButtonText('Cancel').onClick(() => this.close());
      });
  }

  private renderParticipantSuggestions(container: HTMLElement): void {
    const box = container.createDiv({ cls: 'kanban-rpm-participant-suggestions' });
    box.createDiv({ cls: 'kanban-rpm-modal-help', text: this.suggestions.length ? 'Frequent participants' : 'No participant suggestions yet.' });
    const list = box.createDiv({ cls: 'kanban-rpm-participant-suggestion-list' });
    for (const suggestion of this.suggestions.slice(0, 24)) {
      const button = list.createEl('button', {
        cls: 'kanban-rpm-participant-suggestion',
        text: `${suggestion.name} (${suggestion.count})`,
      });
      button.addEventListener('click', () => this.addParticipant(suggestion.name));
    }
  }

  private addParticipant(name: string): void {
    const parts = this.parseParticipants(this.values.participants);
    if (!parts.some((part) => part === name)) parts.push(name);
    this.values.participants = parts.join(', ');
    if (this.participantsInput) this.participantsInput.value = this.values.participants;
  }

  private parseParticipants(value: string): string[] {
    return value.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean);
  }

  private async createSourceNote(): Promise<void> {
    if (!this.values.title.trim()) {
      new Notice('Title is required.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(this.values.date)) {
      new Notice('Date must use YYYY-MM-DD.');
      return;
    }
    await this.plugin.createCommunicationSourceNote(this.values);
    this.close();
  }

  private markRequired(setting: Setting, desc?: string): Setting {
    setting.nameEl.createSpan({ cls: 'kanban-rpm-required', text: ' *' });
    if (desc) setting.setDesc(desc);
    return setting;
  }

  private today(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }
}

export class NewProjectCardModal extends Modal {
  private plugin: KanbanRPMPlugin;
  private context: NewDocumentContext;
  private parentOptions: ProjectCard[] = [];
  private values: NewCardValues = {
    title: '',
    type: 'project',
    project: '',
    subproject: '',
    projects: '',
    subprojects: '',
    status: 'inbox',
    priority: '3',
    workstreamType: '',
    nextAction: '',
    waitingFor: '',
    blocker: '',
    startDate: '',
    scheduledDate: '',
    nextReview: '',
    dueDate: '',
    dependsOn: '',
    blocks: '',
    sourceNotes: '',
  };

  constructor(app: App, plugin: KanbanRPMPlugin, context: Status | NewDocumentContext = 'inbox') {
    super(app);
    this.plugin = plugin;
    this.context = typeof context === 'string' ? { status: context } : context;
    this.values.status = this.context.status ?? 'inbox';
  }

  async onOpen(): Promise<void> {
    this.parentOptions = await this.plugin.loadCards();
    this.applyContextDefaults();
    this.renderForm();
  }

  private applyContextDefaults(): void {
    const project = this.context.projectTitle
      ? this.parentOptions.find((card) => card.type === 'project' && card.title === this.context.projectTitle)
      : undefined;
    const subproject = this.context.subprojectTitle
      ? this.parentOptions.find((card) => card.type === 'subproject' && card.title === this.context.subprojectTitle)
      : undefined;

    if (project) this.values.project = this.parentValue(project);
    if (subproject) {
      this.values.subproject = this.parentValue(subproject);
      if (!this.values.project && subproject.project) this.values.project = subproject.project;
    }

    if (project && subproject) this.values.type = 'big_action';
    else if (project) this.values.type = 'subproject';
    else this.values.type = 'project';
  }

  private renderForm(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('kanban-rpm-card-modal');
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

    new Setting(contentEl.createDiv({ cls: 'kanban-rpm-modal-footer' }))
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
    details.open = this.plugin.settings.newCardAdvancedOpen;
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
    new Setting(dateGrid).setName('Start date').addText((input) => {
      input.inputEl.type = 'date';
      input.setPlaceholder('YYYY-MM-DD');
      input.setValue(this.values.startDate);
      input.onChange((value) => {
        this.values.startDate = value;
      });
    });

    new Setting(dateGrid).setName('Scheduled date').addText((input) => {
      input.inputEl.type = 'date';
      input.setPlaceholder('YYYY-MM-DD');
      input.setValue(this.values.scheduledDate);
      input.onChange((value) => {
        this.values.scheduledDate = value;
      });
    });

    new Setting(dateGrid).setName('Next review').addText((input) => {
      input.inputEl.type = 'date';
      input.setPlaceholder('YYYY-MM-DD');
      input.setValue(this.values.nextReview);
      input.onChange((value) => {
        this.values.nextReview = value;
      });
    });

    new Setting(dateGrid).setName('Due date').addText((input) => {
      input.inputEl.type = 'date';
      input.setPlaceholder('YYYY-MM-DD');
      input.setValue(this.values.dueDate);
      input.onChange((value) => {
        this.values.dueDate = value;
      });
    });

    this.addListField(details, 'Source notes', '[[250506 Lab setup meeting]]', 'sourceNotes');
    this.addListField(details, 'Additional projects', '[[TTT]]\n[[Lab Setup]]', 'projects');
    this.addListField(details, 'Additional subprojects', '[[TTT Experiment]]\n[[Furnace Setup]]', 'subprojects');
    this.addListField(details, 'Preceded by', '[[Drawing]]\n[[Quotation]]', 'dependsOn');
    this.addListField(details, 'Followed by', '[[Purchase review]]', 'blocks');
  }

  private addVocabularyDropdown(
    grid: HTMLElement,
    name: string,
    key: keyof Pick<NewCardValues, 'workstreamType'>,
    values: CategoryDefinition[],
    fallback = ''
  ): void {
    new Setting(grid).setName(name).addDropdown((dropdown) => {
      if (!fallback) dropdown.addOption('', '');
      for (const value of values) dropdown.addOption(value.id, value.label);
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
      .filter((card) => card.type === 'subproject' && card.projectTitles.includes(selectedProject.title))
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
      project: card.project,
      subproject: card.subproject,
      projects: card.projects.filter((link) => link !== card.project).join('\n'),
      subprojects: card.subprojects.filter((link) => link !== card.subproject).join('\n'),
      status: card.status,
      priority: String(card.priority),
      workstreamType: card.workstreamType,
      nextAction: card.nextAction,
      waitingFor: card.waitingFor,
      blocker: card.blocker,
      startDate: card.startDate,
      scheduledDate: card.scheduledDate,
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
    contentEl.addClass('kanban-rpm-card-modal');
    contentEl.createEl('h2', { text: 'Edit KanbanRPM living document' });

    this.markRequired(new Setting(contentEl).setName('Title')).addText((input) => {
      input.setValue(this.values.title);
      input.onChange((value) => {
        this.values.title = value;
      });
    });

    const grid = contentEl.createDiv({ cls: 'kanban-rpm-modal-grid' });
    this.addCoreFields(grid);

    new Setting(contentEl).setName('Current focus').addTextArea((input) => {
      input.setValue(this.values.nextAction);
      input.onChange((value) => {
        this.values.nextAction = value;
      });
    });

    this.addAdvancedFields(contentEl);

    new Setting(contentEl.createDiv({ cls: 'kanban-rpm-modal-footer' }))
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
    new Setting(dateGrid).setName('Start date').addText((input) => {
      input.inputEl.type = 'date';
      input.setPlaceholder('YYYY-MM-DD');
      input.setValue(this.values.startDate);
      input.onChange((value) => {
        this.values.startDate = value;
      });
    });

    new Setting(dateGrid).setName('Scheduled date').addText((input) => {
      input.inputEl.type = 'date';
      input.setPlaceholder('YYYY-MM-DD');
      input.setValue(this.values.scheduledDate);
      input.onChange((value) => {
        this.values.scheduledDate = value;
      });
    });

    new Setting(dateGrid).setName('Next review').addText((input) => {
      input.inputEl.type = 'date';
      input.setPlaceholder('YYYY-MM-DD');
      input.setValue(this.values.nextReview);
      input.onChange((value) => {
        this.values.nextReview = value;
      });
    });

    new Setting(dateGrid).setName('Due date').addText((input) => {
      input.inputEl.type = 'date';
      input.setPlaceholder('YYYY-MM-DD');
      input.setValue(this.values.dueDate);
      input.onChange((value) => {
        this.values.dueDate = value;
      });
    });

    this.addListField(details, 'Source notes', '[[250506 Lab setup meeting]]', 'sourceNotes');
    this.addListField(details, 'Additional projects', '[[TTT]]\n[[Lab Setup]]', 'projects');
    this.addListField(details, 'Additional subprojects', '[[TTT Experiment]]\n[[Furnace Setup]]', 'subprojects');
    this.addListField(details, 'Preceded by', '[[Drawing]]\n[[Quotation]]', 'dependsOn');
    this.addListField(details, 'Followed by', '[[Purchase review]]', 'blocks');
  }

  private addVocabularyDropdown(
    grid: HTMLElement,
    name: string,
    key: keyof Pick<NewCardValues, 'workstreamType'>,
    values: CategoryDefinition[],
    fallback = ''
  ): void {
    new Setting(grid).setName(name).addDropdown((dropdown) => {
      if (!fallback) dropdown.addOption('', '');
      for (const value of values) dropdown.addOption(value.id, value.label);
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
      .filter((card) => card.type === 'subproject' && card.projectTitles.includes(selectedProject.title))
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

export class ResearchLogModal extends Modal {
  private values: ResearchLogValues;
  private onSave: (values: ResearchLogValues) => Promise<void>;

  constructor(app: App, kind: ResearchLogKind, initial: Omit<ResearchLogValues, 'kind'>, onSave: (values: ResearchLogValues) => Promise<void>) {
    super(app);
    this.values = { kind, ...initial };
    this.onSave = onSave;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl('h2', { text: this.values.kind === 'experiment' ? 'Add Experiment Log' : 'Add Analysis Log' });
    contentEl.createDiv({
      cls: 'kanban-rpm-modal-help',
      text: 'Add a compact log row to this Big Action. You can refine the living document afterwards.',
    });

    this.addText('Date', 'YYYY-MM-DD', 'date');
    this.addText('Module heading', this.values.kind === 'experiment' ? 'Stacking' : 'DF analysis', 'module');
    this.addText(this.values.kind === 'experiment' ? 'Sample' : 'Dataset / Sample', '[[Sample]]', 'subject');
    this.addText(this.values.kind === 'experiment' ? 'Conditions' : 'Method', '', 'conditionsOrMethod');
    this.addText('Result', '', 'result');
    this.addText('Link', '[[Current card]]', 'link');

    new Setting(contentEl.createDiv({ cls: 'kanban-rpm-modal-footer' }))
      .addButton((button) => {
        button
          .setButtonText('Add log row')
          .setCta()
          .onClick(() => {
            void this.save();
          });
      })
      .addButton((button) => {
        button.setButtonText('Skip').onClick(() => this.close());
      });
  }

  private addText(label: string, placeholder: string, key: keyof Omit<ResearchLogValues, 'kind'>): void {
    new Setting(this.contentEl).setName(label).addText((input) => {
      input.setPlaceholder(placeholder);
      input.setValue(String(this.values[key] ?? ''));
      input.onChange((value) => {
        this.values[key] = value;
      });
    });
  }

  private async save(): Promise<void> {
    await this.onSave(this.values);
    this.close();
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
