import { App, PluginSettingTab, Setting } from 'obsidian';
import { DEFAULT_SETTINGS } from './constants';
import type KanbanRPMPlugin from './main';
import { parseCategories, parseStatuses, serializeCategories, serializeStatuses } from './utils';

export class KanbanRPMSettingTab extends PluginSettingTab {
  private plugin: KanbanRPMPlugin;

  constructor(app: App, plugin: KanbanRPMPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl('h2', { text: 'KanbanRPM settings' });

    new Setting(containerEl)
      .setName('Workspace folder')
      .setDesc('Folder that stores KanbanRPM cards and Laminar-style support folders.')
      .addText((input) => {
        input
          .setPlaceholder(DEFAULT_SETTINGS.workspaceFolder)
          .setValue(this.plugin.settings.workspaceFolder)
          .onChange(async (value) => {
            this.plugin.settings.workspaceFolder = value.trim() || DEFAULT_SETTINGS.workspaceFolder;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName('Weekly review folder')
      .setDesc('Folder where KanbanRPM creates weekly review notes.')
      .addText((input) => {
        input
          .setPlaceholder(DEFAULT_SETTINGS.weeklyReviewFolder)
          .setValue(this.plugin.settings.weeklyReviewFolder)
          .onChange(async (value) => {
            this.plugin.settings.weeklyReviewFolder = value.trim() || DEFAULT_SETTINGS.weeklyReviewFolder;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName('Global status set')
      .setDesc('One status per line. Format: id | Label. Used by Board, Table, List, Timeline, and Graph.')
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

    new Setting(containerEl)
      .setName('Category set')
      .setDesc('One category per line. Used by card create/edit, filters, board display, and validation.')
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

    containerEl.createEl('h3', { text: 'Card display fields' });
    containerEl.createDiv({
      cls: 'kanban-rpm-setting-note',
      text: 'Choose which frontmatter and body-section fields appear on board cards.',
    });

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
      ['dependencies', 'Dependencies'],
      ['sources', 'Source note count'],
      ['smallActionSummary', 'Small action summary'],
    ] as const) {
      new Setting(containerEl)
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

    containerEl.createEl('h3', { text: 'Small actions' });

    new Setting(containerEl)
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

    new Setting(containerEl)
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

    new Setting(containerEl)
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
}
