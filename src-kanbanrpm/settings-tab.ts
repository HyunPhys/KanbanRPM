import { App, PluginSettingTab, Setting } from 'obsidian';
import { DEFAULT_SETTINGS } from './constants';
import type KanbanRPMPlugin from './main';
import { parseStatuses, serializeStatuses } from './utils';

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
      .setName('Daily folder')
      .setDesc('KanbanRPM only appends to an existing daily note in this folder.')
      .addText((input) => {
        input
          .setPlaceholder(DEFAULT_SETTINGS.dailyFolder)
          .setValue(this.plugin.settings.dailyFolder)
          .onChange(async (value) => {
            this.plugin.settings.dailyFolder = value.trim() || DEFAULT_SETTINGS.dailyFolder;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName('Daily section')
      .setDesc('Heading where KanbanRPM appends Daily actions. Leave blank to append at the end.')
      .addText((input) => {
        input
          .setPlaceholder(DEFAULT_SETTINGS.dailySection)
          .setValue(this.plugin.settings.dailySection)
          .onChange(async (value) => {
            this.plugin.settings.dailySection = value.trim();
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
  }
}
