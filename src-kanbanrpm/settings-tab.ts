import { App, PluginSettingTab, Setting } from 'obsidian';
import { DEFAULT_SETTINGS } from './constants';
import type KanbanRPMPlugin from './main';
import { categoryIds, parseCategories, parseStatuses, serializeCategories, serializeStatuses } from './utils';

const serializeCategoryIds = (categories: string[]): string => categories.join('\n');

export class KanbanRPMSettingTab extends PluginSettingTab {
  private plugin: KanbanRPMPlugin;

  constructor(app: App, plugin: KanbanRPMPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass('kanban-rpm-settings');
    containerEl.createEl('h2', { text: 'KanbanRPM settings' });
    containerEl.createDiv({
      cls: 'kanban-rpm-settings-intro',
      text: 'Configure the workspace, project taxonomy, research capture, card display, and small-action filters used by KanbanRPM.',
    });

    const workspace = this.createSection(containerEl, 'Workspace', 'Where KanbanRPM stores living documents and generated support files.');
    new Setting(workspace)
      .setName('Workspace folder')
      .setDesc('Folder that stores KanbanRPM cards, timeline memo files, routines, attachments, archive folders, and generated reports.')
      .addText((input) => {
        input
          .setPlaceholder(DEFAULT_SETTINGS.workspaceFolder)
          .setValue(this.plugin.settings.workspaceFolder)
          .onChange(async (value) => {
            this.plugin.settings.workspaceFolder = value.trim() || DEFAULT_SETTINGS.workspaceFolder;
            await this.plugin.saveSettings();
          });
      });

    const taxonomy = this.createSection(containerEl, 'Taxonomy', 'Edit the controlled vocabularies used across Board, Table, Timeline, Gantt, filters, and validation.');
    taxonomy.createDiv({
      cls: 'kanban-rpm-setting-note',
      text: 'Status and Category format is "id | Label". Existing category ids remain stored in card frontmatter.',
    });

    new Setting(taxonomy)
      .setName('Global status set')
      .setDesc('One status per line. Format: id | Label. Used by Board, Table, Timeline, and Gantt.')
      .addTextArea((input) => {
        input
          .setPlaceholder(serializeStatuses(DEFAULT_SETTINGS.statuses))
          .setValue(serializeStatuses(this.plugin.settings.statuses))
          .onChange(async (value) => {
            const statuses = parseStatuses(value);
            this.plugin.settings.statuses = statuses.length ? statuses : DEFAULT_SETTINGS.statuses;
            await this.plugin.saveSettings();
            await this.plugin.refreshViews();
          });
        input.inputEl.rows = 8;
      });

    new Setting(taxonomy)
      .setName('Category set')
      .setDesc('One category per line. Format: id | Label. Used by card create/edit, filters, board display, and validation.')
      .addTextArea((input) => {
        input
          .setPlaceholder(serializeCategories(DEFAULT_SETTINGS.categories))
          .setValue(serializeCategories(this.plugin.settings.categories))
          .onChange(async (value) => {
            const categories = parseCategories(value);
            this.plugin.settings.categories = categories.length ? categories : DEFAULT_SETTINGS.categories;
            await this.plugin.saveSettings();
            await this.plugin.refreshViews();
          });
        input.inputEl.rows = 8;
      });

    const research = this.createSection(containerEl, 'Research Logs And Reminders', 'Control assisted Experiment/Analysis Log capture and Next review reminders.');

    new Setting(research)
      .setName('Experiment log categories')
      .setDesc('Categories that trigger an Experiment Log prompt when a Big Action moves to a completion status.')
      .addTextArea((input) => {
        input
          .setPlaceholder(serializeCategoryIds(DEFAULT_SETTINGS.experimentLogCategories))
          .setValue(serializeCategoryIds(this.plugin.settings.experimentLogCategories))
          .onChange(async (value) => {
            const categories = parseCategories(value);
            this.plugin.settings.experimentLogCategories = categories.length ? categoryIds(categories) : DEFAULT_SETTINGS.experimentLogCategories;
            await this.plugin.saveSettings();
          });
        input.inputEl.rows = 3;
      });

    new Setting(research)
      .setName('Analysis log categories')
      .setDesc('Categories that trigger an Analysis Log prompt when a Big Action moves to a completion status.')
      .addTextArea((input) => {
        input
          .setPlaceholder(serializeCategoryIds(DEFAULT_SETTINGS.analysisLogCategories))
          .setValue(serializeCategoryIds(this.plugin.settings.analysisLogCategories))
          .onChange(async (value) => {
            const categories = parseCategories(value);
            this.plugin.settings.analysisLogCategories = categories.length ? categoryIds(categories) : DEFAULT_SETTINGS.analysisLogCategories;
            await this.plugin.saveSettings();
          });
        input.inputEl.rows = 3;
      });

    new Setting(research)
      .setName('Prompt for log when moving matching Big Action to Done')
      .setDesc('When enabled, KanbanRPM asks for an Experiment/Analysis Log row after a matching Big Action moves to a completion status.')
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.promptForLogOnDone)
          .onChange(async (value) => {
            this.plugin.settings.promptForLogOnDone = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(research)
      .setName('Next review reminder status')
      .setDesc('When Next review is today or overdue, Refresh moves non-complete cards to this status.')
      .addDropdown((dropdown) => {
        for (const status of this.plugin.settings.statuses) dropdown.addOption(status.id, status.label);
        dropdown
          .setValue(this.plugin.settings.reviewReminderStatus)
          .onChange(async (value) => {
            this.plugin.settings.reviewReminderStatus = value || DEFAULT_SETTINGS.reviewReminderStatus;
            await this.plugin.saveSettings();
          });
      });

    const display = this.createSection(containerEl, 'Card Display', 'Choose which fields appear on compact cards in the Board and Timeline surfaces.');
    display.createDiv({
      cls: 'kanban-rpm-setting-note',
      text: 'Choose which frontmatter and body-section fields appear on board cards.',
    });

    new Setting(display)
      .setName('Open Advanced metadata by default in new card modal')
      .setDesc('When enabled, the Advanced metadata section starts expanded while creating a new living document.')
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.newCardAdvancedOpen)
          .onChange(async (value) => {
            this.plugin.settings.newCardAdvancedOpen = value;
            await this.plugin.saveSettings();
          });
      });

    const displayGrid = display.createDiv({ cls: 'kanban-rpm-settings-toggle-grid' });
    for (const [key, label] of [
      ['breadcrumb', 'Project breadcrumb'],
      ['type', 'Type'],
      ['status', 'Status'],
      ['priority', 'Priority'],
      ['category', 'Category'],
      ['currentFocus', 'Current Focus'],
      ['waiting', 'Waiting'],
      ['blockers', 'Blockers'],
      ['dates', 'Due / review dates'],
      ['dependencies', 'Flow'],
      ['sources', 'Source note count'],
      ['smallActionSummary', 'Small action summary'],
    ] as const) {
      new Setting(displayGrid)
        .setName(label)
        .addToggle((toggle) => {
          toggle
            .setValue(this.plugin.settings.cardDisplayFields[key])
            .onChange(async (value) => {
              this.plugin.settings.cardDisplayFields[key] = value;
              await this.plugin.saveSettings();
              await this.plugin.refreshViews();
            });
        });
    }

    const smallActions = this.createSection(containerEl, 'Small Actions', 'Decide which checkbox tasks are summarized inside cards.');

    new Setting(smallActions)
      .setName('Small actions collapsed by default')
      .setDesc('When enabled, cards show a collapsed small-action row that can be expanded with the arrow.')
      .addToggle((toggle) => {
        toggle
          .setValue(this.plugin.settings.smallActionDisplay.collapsedByDefault)
          .onChange(async (value) => {
            this.plugin.settings.smallActionDisplay.collapsedByDefault = value;
            await this.plugin.saveSettings();
            await this.plugin.refreshViews();
          });
      });

    new Setting(smallActions)
      .setName('Small action source')
      .setDesc('Choose which checkbox actions can appear inside board cards.')
      .addDropdown((dropdown) => {
        dropdown
          .addOption('dated', 'Due or scheduled only')
          .addOption('done', 'Done only')
          .addOption('all', 'All small actions')
          .setValue(this.plugin.settings.smallActionDisplay.sourceFilter)
          .onChange(async (value) => {
            this.plugin.settings.smallActionDisplay.sourceFilter = value as typeof this.plugin.settings.smallActionDisplay.sourceFilter;
            await this.plugin.saveSettings();
            await this.plugin.refreshViews();
          });
      });

    new Setting(smallActions)
      .setName('Small action date window')
      .setDesc('Relative windows include today and overdue actions. Default is one week.')
      .addDropdown((dropdown) => {
        dropdown
          .addOption('all', 'Any date')
          .addOption('overdue', 'Overdue only')
          .addOption('today', 'Today only')
          .addOption('tomorrow', 'Through tomorrow')
          .addOption('week', 'Through one week')
          .addOption('month', 'Through one month')
          .setValue(this.plugin.settings.smallActionDisplay.dateWindow)
          .onChange(async (value) => {
            this.plugin.settings.smallActionDisplay.dateWindow = value as typeof this.plugin.settings.smallActionDisplay.dateWindow;
            await this.plugin.saveSettings();
            await this.plugin.refreshViews();
          });
      });
  }

  private createSection(container: HTMLElement, title: string, description: string): HTMLElement {
    const section = container.createEl('details', { cls: 'kanban-rpm-settings-section' });
    section.open = true;
    const summary = section.createEl('summary', { cls: 'kanban-rpm-settings-section-summary' });
    summary.createSpan({ cls: 'kanban-rpm-settings-section-title', text: title });
    summary.createSpan({ cls: 'kanban-rpm-settings-section-desc', text: description });
    return section.createDiv({ cls: 'kanban-rpm-settings-section-body' });
  }
}
