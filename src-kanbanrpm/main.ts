import {
  App,
  Notice,
  Plugin,
  TFile,
  normalizePath,
} from 'obsidian';
import { KanbanRPMView } from './board-view';
import { CardRepository } from './card-repository';
import { DEFAULT_SETTINGS, VIEW_TYPE } from './constants';
import { openWeeklyReview, sendCardToDaily, sendCardsToDaily as sendCardBatchToDaily } from './daily';
import { DailyPullModal, NewProjectCardModal } from './modals';
import { getSchemaReferenceContent } from './schema';
import { KanbanRPMSettingTab } from './settings-tab';
import type { ActionItem, CardIssue, KanbanRPMSettings, NewCardValues, ProjectCard, SmallAction, Status } from './types';

export default class KanbanRPMPlugin extends Plugin {
  settings: KanbanRPMSettings = { ...DEFAULT_SETTINGS };
  private repository!: CardRepository;

  async onload(): Promise<void> {
    this.settings = this.normalizeSettings(await this.loadData());
    this.repository = new CardRepository(this);

    this.registerView(VIEW_TYPE, (leaf) => new KanbanRPMView(leaf, this));
    this.registerCardRefreshEvents();

    this.addRibbonIcon('layout-dashboard', 'Open KanbanRPM board', () => {
      void this.openBoard();
    });

    this.addCommand({
      id: 'open-board',
      name: 'Open board',
      callback: () => void this.openBoard(),
    });

    this.addCommand({
      id: 'new-project-card',
      name: 'New document',
      callback: () => new NewProjectCardModal(this.app, this).open(),
    });

    this.addCommand({
      id: 'write-dependency-arrows',
      name: 'Export dependency arrows',
      callback: () => void this.writeDependencyArrows(),
    });

    this.addCommand({
      id: 'normalize-rpm-order',
      name: 'Normalize card order',
      callback: () => void this.normalizeCardOrder(),
    });

    this.addCommand({
      id: 'open-schema-reference',
      name: 'Open schema reference',
      callback: () => void this.openSchemaReference(),
    });

    this.addCommand({
      id: 'pull-cards-to-daily',
      name: 'Pull cards to Daily',
      callback: () => void this.openDailyPullModal(),
    });

    this.addCommand({
      id: 'open-weekly-review',
      name: 'Open weekly review',
      callback: () => void this.openWeeklyReview(),
    });

    this.addSettingTab(new KanbanRPMSettingTab(this.app, this));
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  private normalizeSettings(data: Partial<KanbanRPMSettings> | null): KanbanRPMSettings {
    const saved = data ?? {};
    return {
      ...DEFAULT_SETTINGS,
      ...saved,
      statuses: saved.statuses?.length ? saved.statuses : DEFAULT_SETTINGS.statuses,
      categories: saved.categories?.length ? saved.categories : DEFAULT_SETTINGS.categories,
      cardDisplayFields: {
        ...DEFAULT_SETTINGS.cardDisplayFields,
        ...(saved.cardDisplayFields ?? {}),
      },
      smallActionDisplay: {
        ...DEFAULT_SETTINGS.smallActionDisplay,
        ...(saved.smallActionDisplay ?? {}),
      },
    };
  }

  private registerCardRefreshEvents(): void {
    this.registerEvent(
      this.app.metadataCache.on('changed', (file) => {
        if (this.isCardFile(file)) void this.refreshViews();
      })
    );

    this.registerEvent(
      this.app.vault.on('create', (file) => {
        if (this.isCardFile(file)) void this.refreshViews();
      })
    );

    this.registerEvent(
      this.app.vault.on('delete', (file) => {
        if (this.isCardPath(file.path)) void this.refreshViews();
      })
    );

    this.registerEvent(
      this.app.vault.on('rename', (file, oldPath) => {
        if (this.isCardPath(file.path) || this.isCardPath(oldPath)) void this.refreshViews();
      })
    );
  }

  get workspaceFolder(): string {
    return normalizePath(this.settings.workspaceFolder || DEFAULT_SETTINGS.workspaceFolder);
  }

  get cardsFolder(): string {
    return normalizePath(`${this.workspaceFolder}/cards`);
  }

  get archiveFolder(): string {
    return normalizePath(`${this.workspaceFolder}/archive`);
  }

  get arrowsFolder(): string {
    return normalizePath(`${this.workspaceFolder}/arrows`);
  }

  get schemaReferencePath(): string {
    return normalizePath(`${this.workspaceFolder}/KanbanRPM Card Schema.md`);
  }

  isCardPath(path: string): boolean {
    return normalizePath(path).startsWith(`${this.cardsFolder}/`);
  }

  isCardFile(file: unknown): file is TFile {
    return file instanceof TFile && this.isCardPath(file.path) && file.extension === 'md';
  }

  async ensureWorkspace(): Promise<void> {
    const folders = [
      this.workspaceFolder,
      this.cardsFolder,
      this.archiveFolder,
      this.arrowsFolder,
      `${this.workspaceFolder}/perpetual`,
      `${this.workspaceFolder}/timeline`,
      `${this.workspaceFolder}/attachments`,
    ].map(normalizePath);

    for (const folder of folders) {
      if (!this.app.vault.getAbstractFileByPath(folder)) {
        await this.app.vault.createFolder(folder);
      }
    }
  }

  async openBoard(): Promise<void> {
    await this.ensureWorkspace();
    const leaf = this.app.workspace.getLeaf(false);
    await leaf.setViewState({ type: VIEW_TYPE, active: true });
    this.app.workspace.revealLeaf(leaf);
  }

  async loadCards(): Promise<ProjectCard[]> {
    return this.repository.loadCards();
  }

  async createCard(values: NewCardValues): Promise<TFile> {
    return this.repository.createCard(values);
  }

  async updateCardFrontmatter(file: TFile, updates: Record<string, unknown>): Promise<void> {
    await this.repository.updateCardFrontmatter(file, updates);
  }

  async updateCard(card: ProjectCard, values: NewCardValues): Promise<void> {
    await this.repository.updateCard(card, values);
  }

  async moveCard(cardPath: string, targetStatus: Status, beforePath?: string): Promise<void> {
    await this.repository.moveCard(cardPath, targetStatus, beforePath);
  }

  async setCardStatus(card: ProjectCard, status: Status): Promise<void> {
    await this.repository.setCardStatus(card, status);
  }

  async normalizeCardOrder(): Promise<void> {
    await this.repository.normalizeCardOrder();
  }

  async openSchemaReference(): Promise<void> {
    await this.ensureWorkspace();
    let file = this.app.vault.getAbstractFileByPath(this.schemaReferencePath);

    if (!(file instanceof TFile)) {
      file = await this.app.vault.create(this.schemaReferencePath, getSchemaReferenceContent());
      new Notice('KanbanRPM schema reference created.');
    }

    if (file instanceof TFile) await this.app.workspace.getLeaf(false).openFile(file);
  }

  async setNextAction(cardPath: string, nextAction: string): Promise<void> {
    await this.repository.setNextAction(cardPath, nextAction);
  }

  async promoteActionToBigAction(action: ActionItem): Promise<TFile> {
    return this.repository.promoteActionToBigAction(action);
  }

  async toggleSmallAction(action: SmallAction): Promise<void> {
    await this.repository.toggleSmallAction(action);
  }

  async archiveCard(card: ProjectCard): Promise<void> {
    await this.repository.archiveCard(card);
  }

  async deleteCard(card: ProjectCard): Promise<void> {
    await this.repository.deleteCard(card);
  }

  async duplicateCard(card: ProjectCard): Promise<TFile | undefined> {
    return this.repository.duplicateCard(card);
  }

  async collectActionIndex(cards: ProjectCard[]): Promise<ActionItem[]> {
    return this.repository.collectActionIndex(cards);
  }

  validateCards(cards: ProjectCard[]): CardIssue[] {
    return this.repository.validateCards(cards);
  }

  async writeDependencyArrows(cards?: ProjectCard[]): Promise<void> {
    await this.repository.writeDependencyArrows(cards);
  }

  resolveLinkedFile(link: string, sourcePath: string): TFile | null {
    return this.repository.resolveLinkedFile(link, sourcePath);
  }

  computeOrder(laneCards: ProjectCard[], insertIndex: number): number {
    return this.repository.computeOrder(laneCards, insertIndex);
  }
  async sendToDaily(card: ProjectCard): Promise<void> {
    await sendCardToDaily(this.app, this.settings, card);
  }

  async sendCardsToDaily(cards: ProjectCard[]): Promise<void> {
    await sendCardBatchToDaily(this.app, this.settings, cards);
  }

  async openDailyPullModal(cards?: ProjectCard[]): Promise<void> {
    new DailyPullModal(this.app, this, cards ?? (await this.loadCards())).open();
  }

  async openWeeklyReview(cards?: ProjectCard[]): Promise<void> {
    await openWeeklyReview(this.app, this.settings, cards ?? (await this.loadCards()));
  }

  async openCard(card: ProjectCard): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(card.path);
    if (file instanceof TFile) {
      await this.app.workspace.getLeaf(false).openFile(file);
    }
  }

  async openFilePath(path: string): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) {
      await this.app.workspace.getLeaf(false).openFile(file);
    }
  }

  async openLinkedReference(link: string, sourcePath: string): Promise<void> {
    const file = this.resolveLinkedFile(link, sourcePath);
    if (file instanceof TFile) {
      await this.app.workspace.getLeaf(false).openFile(file);
    } else {
      new Notice(`KanbanRPM could not resolve link: ${link}`);
    }
  }

  async refreshViews(): Promise<void> {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE)) {
      const view = leaf.view;
      if (view instanceof KanbanRPMView) await view.refresh();
    }
  }
}


