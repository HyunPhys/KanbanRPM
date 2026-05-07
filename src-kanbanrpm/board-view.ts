import { ItemView, WorkspaceLeaf } from 'obsidian';
import { VIEW_TYPE } from './constants';
import { ConfirmCardActionModal, DailyPullModal, EditProjectCardModal, NewProjectCardModal } from './modals';
import type KanbanRPMPlugin from './main';
import type { ActionItem, CardIssue, Lane, ProjectCard, SmallAction, Status } from './types';
import { compareCards, isDueSoon, isPastDate, toDateSortValue } from './utils';

interface PointerDragState {
  cardPath: string;
  pointerId: number;
  startX: number;
  startY: number;
  dragging: boolean;
  cardEl: HTMLElement;
  activeLaneEl?: HTMLElement;
}

export class KanbanRPMView extends ItemView {
  private plugin: KanbanRPMPlugin;
  private cards: ProjectCard[] = [];
  private actions: ActionItem[] = [];
  private issues: CardIssue[] = [];
  private searchQuery = '';
  private projectFilter = '';
  private workstreamTypeFilter = '';
  private groupByProject = true;
  private toolbarExpanded = false;
  private dataWarningsCollapsed = true;
  private commandCenterCollapsed = false;
  private actionIndexCollapsed = false;
  private expandedSmallActions = new Set<string>();
  private collapsedSmallActions = new Set<string>();
  private pointerDrag?: PointerDragState;

  constructor(leaf: WorkspaceLeaf, plugin: KanbanRPMPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return VIEW_TYPE;
  }

  getDisplayText(): string {
    return 'KanbanRPM';
  }

  getIcon(): string {
    return 'layout-dashboard';
  }

  async onOpen(): Promise<void> {
    await this.refresh();
  }

  async refresh(): Promise<void> {
    this.cards = await this.plugin.loadCards();
    this.actions = await this.plugin.collectActionIndex(this.cards);
    this.issues = this.plugin.validateCards(this.cards);
    this.render();
  }

  private render(): void {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass('kanban-rpm-view');

    const visibleCards = this.filterCards(this.cards);
    const visibleBoardCards = visibleCards.filter((card) => card.type !== 'project');

    const toolbar = container.createDiv({ cls: 'kanban-rpm-toolbar' });
    const title = toolbar.createDiv({ cls: 'kanban-rpm-title' });
    title.createEl('h2', { text: 'KanbanRPM' });
    title.createSpan({
      cls: 'kanban-rpm-count',
      text: this.searchQuery ? `${visibleBoardCards.length} of ${this.cards.length} cards` : `${visibleBoardCards.length} cards`,
    });

    const actions = toolbar.createDiv({ cls: 'kanban-rpm-actions' });
    const search = actions.createEl('input', {
      cls: 'kanban-rpm-search',
      attr: {
        type: 'search',
        placeholder: 'Search cards',
        value: this.searchQuery,
        'aria-label': 'Search KanbanRPM cards',
      },
    });
    search.addEventListener('input', () => {
      this.searchQuery = search.value;
      this.render();
    });

    if (this.searchQuery) {
      actions.createEl('button', { text: 'Clear' }).addEventListener('click', () => {
        this.searchQuery = '';
        this.render();
      });
    }

    actions.createEl('button', { text: 'New document' }).addEventListener('click', () => {
      new NewProjectCardModal(this.app, this.plugin).open();
    });
    actions
      .createEl('button', { text: this.groupByProject ? 'Flat board' : this.getGroupingLabel() })
      .addEventListener('click', () => {
        this.groupByProject = !this.groupByProject;
        this.render();
      });
    actions.createEl('button', { text: 'Refresh' }).addEventListener('click', () => {
      void this.refresh();
    });
    actions
      .createEl('button', { text: this.toolbarExpanded ? 'Less' : 'More' })
      .addEventListener('click', () => {
        this.toolbarExpanded = !this.toolbarExpanded;
        this.render();
      });

    if (this.toolbarExpanded) {
      const secondary = container.createDiv({ cls: 'kanban-rpm-toolbar-secondary' });
      secondary.createEl('button', { text: 'Pull Daily' }).addEventListener('click', () => {
        new DailyPullModal(this.app, this.plugin, visibleBoardCards).open();
      });
      secondary.createEl('button', { text: 'Weekly review' }).addEventListener('click', () => {
        void this.plugin.openWeeklyReview(visibleBoardCards);
      });
      secondary.createEl('button', { text: 'Export arrows' }).addEventListener('click', () => {
        void this.plugin.writeDependencyArrows(visibleBoardCards);
      });
      secondary.createEl('button', { text: 'Normalize order' }).addEventListener('click', () => {
        void this.plugin.normalizeCardOrder();
      });
    }

    this.renderFilters(container);

    this.renderDataWarnings(container, visibleCards);
    this.renderCommandCenter(container, visibleBoardCards);
    this.renderActionIndexGrouped(container, visibleBoardCards);
    this.renderProjectNotes(container);

    const board = container.createDiv({ cls: 'kanban-rpm-board' });
    for (const lane of this.plugin.settings.statuses) {
      this.renderLane(board, lane, visibleBoardCards.filter((card) => card.status === lane.id).sort(compareCards));
    }
  }

  private getGroupingLabel(): string {
    return this.projectFilter ? 'Group by Subproject' : 'Group by Project';
  }

  private filterCards(cards: ProjectCard[]): ProjectCard[] {
    const query = this.searchQuery.trim().toLowerCase();
    return cards.filter((card) => {
      if (this.projectFilter && card.projectTitle !== this.projectFilter) return false;
      if (this.workstreamTypeFilter && card.workstreamType !== this.workstreamTypeFilter) return false;
      if (!query) return true;

      return this.getSearchText(card).includes(query);
    });
  }

  private getSearchText(card: ProjectCard): string {
    return [
      card.title,
      card.breadcrumb,
      card.projectTitle,
      card.subprojectTitle,
      card.status,
      `p${card.priority}`,
      String(card.priority),
      card.workstreamType,
      card.nextAction,
      card.waitingFor,
      card.blocker,
      card.nextReview,
      card.dueDate,
      ...card.dependsOn,
      ...card.blocks,
      ...card.sourceNotes,
    ]
      .join(' ')
      .toLowerCase();
  }

  private renderFilters(container: HTMLElement): void {
    const filters = container.createDiv({ cls: 'kanban-rpm-filters' });
    this.renderSelectFilter(filters, 'Project', this.projectFilter, this.uniqueValues('projectTitle'), (value) => {
      this.projectFilter = value;
      this.render();
    });
    this.renderSelectFilter(filters, 'Category', this.workstreamTypeFilter, this.uniqueValues('workstreamType'), (value) => {
      this.workstreamTypeFilter = value;
      this.render();
    });

    if (this.projectFilter || this.workstreamTypeFilter) {
      filters.createEl('button', { text: 'Clear filters' }).addEventListener('click', () => {
        this.projectFilter = '';
        this.workstreamTypeFilter = '';
        this.render();
      });
    }
  }

  private renderSelectFilter(
    container: HTMLElement,
    label: string,
    currentValue: string,
    values: string[],
    onChange: (value: string) => void
  ): void {
    const wrap = container.createDiv({ cls: 'kanban-rpm-filter' });
    wrap.createSpan({ text: label });
    const select = wrap.createEl('select');
    select.createEl('option', { text: 'All', value: '' });
    for (const value of values) select.createEl('option', { text: value, value });
    select.value = currentValue;
    select.addEventListener('change', () => onChange(select.value));
  }

  private uniqueValues(field: 'projectTitle' | 'workstreamType'): string[] {
    return Array.from(new Set(this.cards.map((card) => card[field]).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b)
    );
  }

  private renderProjectNotes(container: HTMLElement): void {
    const projects = this.cards
      .filter((card) => card.type === 'project')
      .filter((card) => !this.projectFilter || card.title === this.projectFilter || card.projectTitle === this.projectFilter)
      .sort((a, b) => a.title.localeCompare(b.title));

    const panel = container.createDiv({ cls: 'kanban-rpm-project-strip' });
    const header = panel.createDiv({ cls: 'kanban-rpm-project-strip-header' });
    header.createEl('h3', { text: this.projectFilter ? 'Project note' : 'Project notes' });
    header.createSpan({ text: `${projects.length} project${projects.length === 1 ? '' : 's'}` });

    if (!projects.length) {
      panel.createDiv({ cls: 'kanban-rpm-empty', text: 'No project notes match the current Project filter.' });
      return;
    }

    const list = panel.createDiv({ cls: 'kanban-rpm-project-note-list' });
    for (const project of projects) {
      const note = list.createDiv({ cls: 'kanban-rpm-project-note' });
      note.style.setProperty('--rpm-project-color', this.projectColor(project.colorKey));
      this.addProjectToken(note, project.colorKey);
      const title = note.createEl('button', { cls: 'kanban-rpm-project-note-title', text: project.title });
      title.addEventListener('click', () => {
        void this.plugin.openCard(project);
      });
      const meta = note.createDiv({ cls: 'kanban-rpm-project-note-meta' });
      if (project.status) meta.createSpan({ text: project.status });
      if (project.workstreamType) meta.createSpan({ text: project.workstreamType });
      if (project.nextAction) note.createDiv({ cls: 'kanban-rpm-project-note-focus', text: project.nextAction });
    }
  }

  private renderDataWarnings(container: HTMLElement, visibleCards: ProjectCard[]): void {
    const visiblePaths = new Set(visibleCards.map((card) => card.path));
    const issues = this.issues.filter((issue) => visiblePaths.has(issue.cardPath));
    if (!issues.length) return;

    const errors = issues.filter((issue) => issue.level === 'error').length;
    const warnings = issues.length - errors;
    const panel = container.createDiv({ cls: 'kanban-rpm-data-warnings' });
    const header = panel.createDiv({ cls: 'kanban-rpm-data-warnings-header' });
    header.createEl('h3', { text: 'Data warnings' });
    const headerActions = header.createDiv({ cls: 'kanban-rpm-panel-actions' });
    headerActions.createSpan({ text: `${errors} errors - ${warnings} warnings` });
    headerActions
      .createEl('button', { text: this.dataWarningsCollapsed ? 'Expand' : 'Collapse' })
      .addEventListener('click', () => {
        this.dataWarningsCollapsed = !this.dataWarningsCollapsed;
        this.render();
      });

    if (this.dataWarningsCollapsed) return;

    for (const issue of issues.slice(0, 8)) {
      const row = panel.createDiv({ cls: `kanban-rpm-issue kanban-rpm-issue-${issue.level}` });
      row.createSpan({ cls: 'kanban-rpm-issue-card', text: issue.cardTitle });
      row.createSpan({ cls: 'kanban-rpm-issue-field', text: issue.field });
      row.createSpan({ cls: 'kanban-rpm-issue-message', text: issue.message });
      row.addEventListener('click', () => {
        const card = this.cards.find((item) => item.path === issue.cardPath);
        if (card) void this.plugin.openCard(card);
      });
    }

    if (issues.length > 8) {
      panel.createDiv({ cls: 'kanban-rpm-issue-more', text: `+${issues.length - 8} more warnings` });
    }
  }

  private renderCommandCenter(container: HTMLElement, visibleCards: ProjectCard[]): void {
    const panel = container.createDiv({ cls: 'kanban-rpm-command-center' });
    const header = panel.createDiv({ cls: 'kanban-rpm-command-center-header' });
    header.createEl('h3', { text: 'Command center' });
    const headerActions = header.createDiv({ cls: 'kanban-rpm-panel-actions' });

    const reviewCards = visibleCards
      .filter((card) => isPastDate(card.nextReview) || isDueSoon(card.nextReview) || isPastDate(card.dueDate) || isDueSoon(card.dueDate))
      .sort((a, b) => toDateSortValue(a).localeCompare(toDateSortValue(b)))
      .slice(0, 6);
    headerActions.createSpan({ text: 'review, waiting, blockers, dependencies' });
    headerActions.createEl('button', { text: 'Daily review' }).addEventListener('click', () => {
      void this.plugin.sendCardsToDaily(reviewCards);
    });
    headerActions
      .createEl('button', { text: this.commandCenterCollapsed ? 'Expand' : 'Collapse' })
      .addEventListener('click', () => {
        this.commandCenterCollapsed = !this.commandCenterCollapsed;
        this.render();
      });

    if (this.commandCenterCollapsed) return;

    const grid = panel.createDiv({ cls: 'kanban-rpm-command-grid' });
    const waitingStatus = this.getConfiguredStatusId('waiting');
    const blockedStatus = this.getConfiguredStatusId('blocked');
    const waitingCards = visibleCards
      .filter((card) => card.status === waitingStatus || Boolean(card.waitingFor))
      .sort(compareCards)
      .slice(0, 6);
    const blockedCards = visibleCards
      .filter((card) => card.status === blockedStatus || Boolean(card.blocker) || card.blockedBy.length)
      .sort(compareCards)
      .slice(0, 6);
    const dependencyCards = visibleCards
      .filter((card) => card.dependsOn.length || card.blocks.length)
      .sort((a, b) => b.dependsOn.length + b.blocks.length - (a.dependsOn.length + a.blocks.length))
      .slice(0, 6);

    this.renderCommandSection(grid, 'Review queue', reviewCards, (card) => {
      const date = card.dueDate || card.nextReview || 'no date';
      return `${date} - ${card.nextAction || card.workstreamType || card.status}`;
    });
    this.renderCommandSection(grid, 'Waiting', waitingCards, (card) => card.waitingFor || card.nextAction || card.status);
    this.renderCommandSection(grid, 'Blocked', blockedCards, (card) => card.blocker || card.nextAction || card.status);
    this.renderCommandSection(grid, 'Dependencies', dependencyCards, (card) => {
      const counts = [];
      if (card.dependsOn.length) counts.push(`${card.dependsOn.length} depends`);
      if (card.blocks.length) counts.push(`${card.blocks.length} blocks`);
      return counts.join(' - ') || card.workstreamType || card.status;
    });
  }

  private renderCommandSection(
    container: HTMLElement,
    title: string,
    cards: ProjectCard[],
    subtitle: (card: ProjectCard) => string
  ): void {
    const section = container.createDiv({ cls: 'kanban-rpm-command-section' });
    const header = section.createDiv({ cls: 'kanban-rpm-command-section-header' });
    header.createSpan({ text: title });
    header.createSpan({ text: String(cards.length) });

    if (!cards.length) {
      section.createDiv({ cls: 'kanban-rpm-command-empty', text: 'Clear' });
      return;
    }

    for (const card of cards) {
      const row = section.createDiv({ cls: 'kanban-rpm-command-card' });
      row.createDiv({ cls: 'kanban-rpm-command-card-title', text: card.title });
      row.createDiv({ cls: 'kanban-rpm-command-card-subtitle', text: subtitle(card) });
      row.addEventListener('click', () => {
        void this.plugin.openCard(card);
      });
    }
  }

  private renderActionIndexGrouped(container: HTMLElement, visibleCards: ProjectCard[]): void {
    const visiblePaths = new Set(visibleCards.map((card) => card.path));
    const actions = this.actions.filter((action) => visiblePaths.has(action.cardPath));
    const grouped = this.groupActionsByCard(actions);
    const visibleGroups = grouped.slice(0, 12);
    const panel = container.createDiv({ cls: 'kanban-rpm-action-index' });
    const header = panel.createDiv({ cls: 'kanban-rpm-action-index-header' });
    header.createEl('h3', { text: 'Action index' });
    const headerActions = header.createDiv({ cls: 'kanban-rpm-panel-actions' });
    headerActions.createSpan({ text: `${actions.length} actions - ${grouped.length} cards` });
    headerActions
      .createEl('button', { text: this.actionIndexCollapsed ? 'Expand' : 'Collapse' })
      .addEventListener('click', () => {
        this.actionIndexCollapsed = !this.actionIndexCollapsed;
        this.render();
      });

    if (!actions.length) {
      panel.createDiv({ cls: 'kanban-rpm-empty', text: 'No linked unchecked actions found.' });
      return;
    }

    if (this.actionIndexCollapsed) return;

    for (const group of visibleGroups) {
      const groupEl = panel.createDiv({ cls: 'kanban-rpm-action-group' });
      const groupHeader = groupEl.createDiv({ cls: 'kanban-rpm-action-group-header' });
      groupHeader.createSpan({ text: group.cardTitle });
      groupHeader.createSpan({ text: `${group.actions.length} actions` });

      for (const action of group.actions.slice(0, 6)) {
        this.renderActionRow(groupEl, action);
      }

      if (group.actions.length > 6) {
        groupEl.createDiv({ cls: 'kanban-rpm-action-more', text: `+${group.actions.length - 6} more actions` });
      }
    }

    if (grouped.length > visibleGroups.length) {
      panel.createDiv({ cls: 'kanban-rpm-action-more', text: `+${grouped.length - visibleGroups.length} more cards` });
    }
  }

  private groupActionsByCard(actions: ActionItem[]): Array<{ cardPath: string; cardTitle: string; actions: ActionItem[] }> {
    const map = new Map<string, { cardPath: string; cardTitle: string; actions: ActionItem[] }>();
    for (const action of actions) {
      const existing = map.get(action.cardPath) ?? {
        cardPath: action.cardPath,
        cardTitle: action.cardTitle,
        actions: [],
      };
      existing.actions.push(action);
      map.set(action.cardPath, existing);
    }

    return Array.from(map.values()).sort((a, b) => b.actions.length - a.actions.length || a.cardTitle.localeCompare(b.cardTitle));
  }

  private renderActionRow(container: HTMLElement, action: ActionItem): void {
    const row = container.createDiv({ cls: 'kanban-rpm-action-row is-clickable' });
    row.createDiv({ cls: 'kanban-rpm-action-text', text: action.text });
    row.createDiv({
      cls: 'kanban-rpm-action-source',
      text: `${action.sourceLabel}:${action.lineNumber}`,
    });
    const rowActions = row.createDiv({ cls: 'kanban-rpm-action-buttons' });
    rowActions.createEl('button', { text: 'Open source' }).addEventListener('click', (event) => {
      event.stopPropagation();
      void this.plugin.openFilePath(action.sourcePath);
    });
    rowActions.createEl('button', { text: 'Set next' }).addEventListener('click', (event) => {
      event.stopPropagation();
      void this.plugin.setNextAction(action.cardPath, action.text);
    });
    rowActions.createEl('button', { text: 'Promote' }).addEventListener('click', (event) => {
      event.stopPropagation();
      void this.plugin.promoteActionToBigAction(action);
    });
    row.addEventListener('click', () => {
      void this.plugin.openFilePath(action.sourcePath);
    });
    row.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') void this.plugin.openFilePath(action.sourcePath);
    });
    row.setAttr('role', 'button');
    row.setAttr('tabindex', '0');
  }

  private renderLane(board: HTMLElement, lane: Lane, cards: ProjectCard[]): void {
    const laneEl = board.createDiv({ cls: 'kanban-rpm-lane' });
    laneEl.dataset.status = lane.id;

    const header = laneEl.createDiv({ cls: 'kanban-rpm-lane-header' });
    header.createSpan({ cls: 'kanban-rpm-lane-title', text: lane.label });
    const laneActions = header.createDiv({ cls: 'kanban-rpm-lane-actions' });
    laneActions.createSpan({ cls: 'kanban-rpm-lane-count', text: String(cards.length) });
    laneActions
      .createEl('button', {
        cls: 'kanban-rpm-lane-add',
        text: '+',
        attr: { 'aria-label': `Add card to ${lane.label}` },
      })
      .addEventListener('click', () => {
        new NewProjectCardModal(this.app, this.plugin, lane.id).open();
      });

    const list = laneEl.createDiv({ cls: 'kanban-rpm-card-list' });
    if (!cards.length) {
      list.createDiv({ cls: 'kanban-rpm-empty', text: 'No cards' });
      return;
    }

    if (!this.groupByProject) {
      for (const card of cards) this.renderCard(list, card);
      return;
    }

    for (const group of this.groupCardsForCurrentFilter(cards)) {
      const groupEl = list.createDiv({ cls: 'kanban-rpm-project-group' });
      const header = groupEl.createDiv({ cls: 'kanban-rpm-project-group-header' });
      this.addProjectToken(header, group.project);
      header.createSpan({ text: group.project });
      header.createSpan({ cls: 'kanban-rpm-project-group-count', text: String(group.cards.length) });
      for (const card of group.cards) this.renderCard(groupEl, card);
    }
  }

  private renderCard(list: HTMLElement, card: ProjectCard): void {
    const cardClasses = [
      'kanban-rpm-card',
      `kanban-rpm-card-status-${card.status}`,
      isPastDate(card.dueDate) || isPastDate(card.nextReview) ? 'kanban-rpm-card-overdue' : '',
    ]
      .filter(Boolean)
      .join(' ');
    const cardEl = list.createDiv({ cls: cardClasses });
    cardEl.dataset.path = card.path;
    cardEl.style.setProperty('--rpm-project-color', this.projectColor(card.colorKey));
    this.attachPointerDrag(cardEl, card);

    const titleRow = cardEl.createDiv({ cls: 'kanban-rpm-card-title-row' });
    const titleWrap = titleRow.createDiv({ cls: 'kanban-rpm-card-title-wrap' });
    if (this.plugin.settings.cardDisplayFields.breadcrumb) {
      const context = titleWrap.createDiv({ cls: 'kanban-rpm-card-context' });
      this.addProjectToken(context, card.colorKey);
      context.createSpan({ text: card.breadcrumb || card.projectTitle || 'No project' });
    }
    titleWrap.createDiv({ cls: 'kanban-rpm-card-title', text: card.title }).addEventListener('click', () => {
      void this.plugin.openCard(card);
    });
    if (this.plugin.settings.cardDisplayFields.priority) {
      titleRow.createSpan({
        cls: `kanban-rpm-pill kanban-rpm-priority kanban-rpm-priority-${card.priority}`,
        text: `P${card.priority}`,
      });
    }

    const meta = cardEl.createDiv({ cls: 'kanban-rpm-meta' });
    const fields = this.plugin.settings.cardDisplayFields;
    if (fields.status) this.addMeta(meta, card.status, 'status', `kanban-rpm-status-${card.status}`);
    if (fields.type) this.addMeta(meta, card.type, 'type', 'kanban-rpm-meta-kind');
    if (fields.category) this.addMeta(meta, card.workstreamType, 'category', 'kanban-rpm-meta-kind');
    if (fields.dates) {
      this.addMeta(meta, card.dueDate, 'due', isPastDate(card.dueDate) ? 'kanban-rpm-overdue' : 'kanban-rpm-meta-date');
      this.addMeta(meta, card.nextReview, 'review', isPastDate(card.nextReview) ? 'kanban-rpm-overdue' : 'kanban-rpm-meta-date');
    }
    if (fields.dependencies) {
      this.addCountMeta(meta, card.dependsOn.length, 'depends', 'kanban-rpm-meta-dependency');
      this.addCountMeta(meta, card.blocks.length, 'blocks', 'kanban-rpm-meta-dependency');
      this.addCountMeta(meta, card.blockedBy.length, 'blocked by', 'kanban-rpm-meta-dependency');
    }
    if (fields.sources) this.addCountMeta(meta, card.sourceNotes.length, 'sources', 'kanban-rpm-meta-source');
    if (fields.smallActionSummary) this.addCountMeta(meta, card.actionCount, 'tasks', 'kanban-rpm-meta-source');
    if (!meta.childElementCount) meta.remove();

    if (fields.currentFocus && card.nextAction) cardEl.createDiv({ cls: 'kanban-rpm-next', text: card.nextAction });
    if (fields.waiting && card.waitingFor) {
      cardEl.createDiv({ cls: 'kanban-rpm-next kanban-rpm-waiting', text: `Waiting: ${card.waitingFor}` });
    }
    if (fields.blockers && card.blocker) {
      cardEl.createDiv({ cls: 'kanban-rpm-next kanban-rpm-blocker', text: `Blocked: ${card.blocker}` });
    }
    if (fields.dependencies || fields.sources) this.renderCardRelations(cardEl, card);
    if (fields.smallActionSummary) this.renderSmallActions(cardEl, card);

    const actions = cardEl.createDiv({ cls: 'kanban-rpm-card-actions' });
    actions.createEl('button', { text: 'Open' }).addEventListener('click', () => {
      void this.plugin.openCard(card);
    });
    actions.createEl('button', { text: 'Edit' }).addEventListener('click', () => {
      new EditProjectCardModal(this.app, this.plugin, card).open();
    });
    actions.createEl('button', { text: 'Duplicate' }).addEventListener('click', () => {
      void this.plugin.duplicateCard(card);
    });
    actions.createEl('button', { text: 'Send to Daily' }).addEventListener('click', () => {
      void this.plugin.sendToDaily(card);
    });
    actions.createEl('button', { text: 'Archive' }).addEventListener('click', () => {
      new ConfirmCardActionModal(this.app, {
        title: 'Archive card',
        message: `Move "${card.title}" to KanbanRPM archive?`,
        confirmText: 'Archive',
        onConfirm: () => this.plugin.archiveCard(card),
      }).open();
    });
    actions.createEl('button', { cls: 'mod-warning', text: 'Delete' }).addEventListener('click', () => {
      new ConfirmCardActionModal(this.app, {
        title: 'Delete card',
        message: `Move "${card.title}" to the system trash?`,
        confirmText: 'Delete',
        onConfirm: () => this.plugin.deleteCard(card),
      }).open();
    });
  }

  private addMeta(container: HTMLElement, value: string, label: string, cls?: string): void {
    if (value) container.createSpan({ cls, text: `${label}: ${value}` });
  }

  private addCountMeta(container: HTMLElement, count: number, label: string, cls?: string): void {
    if (count > 0) container.createSpan({ cls, text: `${label}: ${count}` });
  }

  private renderSmallActions(cardEl: HTMLElement, card: ProjectCard): void {
    const visibleActions = this.getVisibleSmallActions(card);
    if (!card.smallActions.length && !visibleActions.length) return;

    const open = card.smallActions.filter((action) => !action.done).length;
    const overdue = card.smallActions.filter((action) => !action.done && this.isSmallActionOverdue(action)).length;
    const dueSoon = card.smallActions.filter((action) => !action.done && this.isSmallActionInWindow(action, 'week')).length;
    const expanded = this.isSmallActionsExpanded(card);

    const panel = cardEl.createDiv({ cls: 'kanban-rpm-small-actions' });
    const header = panel.createEl('button', {
      cls: 'kanban-rpm-small-actions-toggle',
      text: `${expanded ? '▼' : '▶'} Small actions: ${open} open${overdue ? ` - ${overdue} overdue` : ''}${dueSoon ? ` - ${dueSoon} due soon` : ''}`,
    });
    header.addEventListener('click', (event) => {
      event.stopPropagation();
      this.toggleSmallActions(card);
      this.render();
    });

    if (!expanded) return;

    if (!visibleActions.length) {
      panel.createDiv({ cls: 'kanban-rpm-small-action-empty', text: 'No small actions match the display rule.' });
      return;
    }

    const list = panel.createDiv({ cls: 'kanban-rpm-small-action-list' });
    const shown = visibleActions.slice(0, 8);
    for (const group of this.groupSmallActionsByHeading(shown)) {
      const groupEl = list.createDiv({ cls: 'kanban-rpm-small-action-group' });
      groupEl.createDiv({ cls: 'kanban-rpm-small-action-heading', text: group.heading });
      for (const action of group.actions) this.renderSmallActionRow(groupEl, action);
    }

    if (visibleActions.length > shown.length) {
      panel.createDiv({ cls: 'kanban-rpm-small-action-more', text: `+${visibleActions.length - shown.length} more` });
    }
  }

  private renderSmallActionRow(container: HTMLElement, action: SmallAction): void {
    const row = container.createDiv({ cls: `kanban-rpm-small-action${action.done ? ' is-done' : ''}` });
    const checkbox = row.createEl('input', {
      attr: {
        type: 'checkbox',
        'aria-label': `Toggle ${action.text}`,
      },
    });
    checkbox.checked = action.done;
    checkbox.addEventListener('click', (event) => {
      event.stopPropagation();
    });
    checkbox.addEventListener('change', () => {
      void this.plugin.toggleSmallAction(action);
    });

    const body = row.createDiv({ cls: 'kanban-rpm-small-action-body' });
    body.createDiv({ cls: 'kanban-rpm-small-action-text', text: action.text });
    const meta = body.createDiv({ cls: 'kanban-rpm-small-action-meta' });
    if (action.scheduledDate) meta.createSpan({ text: `scheduled ${action.scheduledDate}` });
    if (action.dueDate) meta.createSpan({ text: `due ${action.dueDate}` });
    if (action.doneDate) meta.createSpan({ text: `done ${action.doneDate}` });
    if (action.priority !== 'normal') meta.createSpan({ text: action.priority });
  }

  private groupSmallActionsByHeading(actions: SmallAction[]): Array<{ heading: string; actions: SmallAction[] }> {
    const map = new Map<string, SmallAction[]>();
    for (const action of actions) {
      const heading = action.heading || 'Small Actions';
      const existing = map.get(heading) ?? [];
      existing.push(action);
      map.set(heading, existing);
    }
    return Array.from(map.entries()).map(([heading, groupActions]) => ({ heading, actions: groupActions }));
  }

  private isSmallActionsExpanded(card: ProjectCard): boolean {
    if (this.plugin.settings.smallActionDisplay.collapsedByDefault) return this.expandedSmallActions.has(card.path);
    return !this.collapsedSmallActions.has(card.path);
  }

  private toggleSmallActions(card: ProjectCard): void {
    if (this.plugin.settings.smallActionDisplay.collapsedByDefault) {
      if (this.expandedSmallActions.has(card.path)) this.expandedSmallActions.delete(card.path);
      else this.expandedSmallActions.add(card.path);
      return;
    }

    if (this.collapsedSmallActions.has(card.path)) this.collapsedSmallActions.delete(card.path);
    else this.collapsedSmallActions.add(card.path);
  }

  private getVisibleSmallActions(card: ProjectCard): SmallAction[] {
    const { sourceFilter, dateWindow } = this.plugin.settings.smallActionDisplay;
    return card.smallActions
      .filter((action) => {
        if (sourceFilter === 'dated' && !action.dueDate && !action.scheduledDate) return false;
        if (sourceFilter === 'done' && !action.done) return false;
        return this.isSmallActionInWindow(action, dateWindow);
      })
      .sort((a, b) => this.smallActionSortValue(a).localeCompare(this.smallActionSortValue(b)) || a.lineNumber - b.lineNumber);
  }

  private smallActionSortValue(action: SmallAction): string {
    return action.scheduledDate || action.dueDate || action.doneDate || '9999-99-99';
  }

  private isSmallActionOverdue(action: SmallAction): boolean {
    const date = action.scheduledDate || action.dueDate;
    return Boolean(date && isPastDate(date));
  }

  private isSmallActionInWindow(action: SmallAction, window: string): boolean {
    if (window === 'all') return true;
    const date = action.scheduledDate || action.dueDate || action.doneDate;
    if (!date) return false;
    if (window === 'overdue') return isPastDate(date);
    if (window === 'today') return date === this.todayIso();
    if (isPastDate(date) || date === this.todayIso()) return true;
    if (window === 'tomorrow') return isDueSoon(date, 1);
    if (window === 'week') return isDueSoon(date, 7);
    if (window === 'month') return isDueSoon(date, 31);
    return true;
  }

  private todayIso(): string {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }

  private attachPointerDrag(cardEl: HTMLElement, card: ProjectCard): void {
    cardEl.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 || this.isInteractiveTarget(event.target)) return;
      this.pointerDrag = {
        cardPath: card.path,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        dragging: false,
        cardEl,
      };
      cardEl.setPointerCapture(event.pointerId);
    });

    cardEl.addEventListener('pointermove', (event) => {
      if (!this.pointerDrag || this.pointerDrag.pointerId !== event.pointerId) return;
      const distance = Math.hypot(event.clientX - this.pointerDrag.startX, event.clientY - this.pointerDrag.startY);
      if (!this.pointerDrag.dragging && distance < 6) return;

      this.pointerDrag.dragging = true;
      this.pointerDrag.cardEl.addClass('is-dragging');
      this.setActiveDragLane(this.findLaneAtPoint(event.clientX, event.clientY));
    });

    cardEl.addEventListener('pointerup', (event) => {
      if (!this.pointerDrag || this.pointerDrag.pointerId !== event.pointerId) return;
      const drag = this.pointerDrag;
      const laneEl = this.findLaneAtPoint(event.clientX, event.clientY) ?? drag.activeLaneEl;
      this.clearPointerDrag();

      if (!drag.dragging || !laneEl) return;
      const status = laneEl.dataset.status;
      if (!status) return;
      const beforePath = this.findDropBeforePath(laneEl, event.clientY, drag.cardPath);
      void this.plugin.moveCard(drag.cardPath, status, beforePath);
    });

    cardEl.addEventListener('pointercancel', () => this.clearPointerDrag());
    cardEl.addEventListener('lostpointercapture', () => {
      if (this.pointerDrag?.cardEl === cardEl) this.clearPointerDrag();
    });
  }

  private isInteractiveTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    return Boolean(target.closest('button, input, textarea, select, a, .is-link'));
  }

  private findLaneAtPoint(clientX: number, clientY: number): HTMLElement | undefined {
    for (const element of document.elementsFromPoint(clientX, clientY)) {
      if (!(element instanceof HTMLElement)) continue;
      const laneEl = element.closest<HTMLElement>('.kanban-rpm-lane');
      if (laneEl) return laneEl;
    }
    return undefined;
  }

  private setActiveDragLane(laneEl?: HTMLElement): void {
    if (this.pointerDrag?.activeLaneEl === laneEl) return;
    this.pointerDrag?.activeLaneEl?.removeClass('is-drag-over');
    if (this.pointerDrag) this.pointerDrag.activeLaneEl = laneEl;
    laneEl?.addClass('is-drag-over');
  }

  private clearPointerDrag(): void {
    if (!this.pointerDrag) return;
    this.pointerDrag.cardEl.removeClass('is-dragging');
    this.pointerDrag.activeLaneEl?.removeClass('is-drag-over');
    this.pointerDrag = undefined;
  }

  private renderCardRelations(cardEl: HTMLElement, card: ProjectCard): void {
    const fields = this.plugin.settings.cardDisplayFields;
    const rows: Array<[string, string[], string]> = [];
    if (fields.dependencies) {
      rows.push(['Blocked by', card.blockedBy, 'kanban-rpm-relation-blocks']);
      rows.push(['Depends', card.dependsOn, 'kanban-rpm-relation-depends']);
      rows.push(['Blocks', card.blocks, 'kanban-rpm-relation-blocks']);
    }
    if (fields.sources) rows.push(['Sources', card.sourceNotes.slice(0, 3), 'kanban-rpm-relation-sources']);
    const visibleRows = rows.filter(([, values]) => values.length > 0);
    if (!visibleRows.length) return;

    const relations = cardEl.createDiv({ cls: 'kanban-rpm-card-relations' });
    for (const [label, values, cls] of visibleRows) {
      const row = relations.createDiv({ cls: `kanban-rpm-relation-row ${cls}` });
      row.createSpan({ cls: 'kanban-rpm-relation-label', text: `${label}:` });
      const list = row.createSpan({ cls: 'kanban-rpm-relation-values' });
      for (const value of values.slice(0, 4)) {
        const item = list.createSpan({ text: value });
        if (value.includes('[[')) {
          item.addClass('is-link');
          item.setAttr('role', 'button');
          item.setAttr('tabindex', '0');
          item.addEventListener('click', (event) => {
            event.stopPropagation();
            void this.plugin.openLinkedReference(value, card.path);
          });
          item.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') void this.plugin.openLinkedReference(value, card.path);
          });
        }
      }
      if (values.length > 4) list.createSpan({ text: `+${values.length - 4}` });
    }
  }

  private findDropBeforePath(laneEl: HTMLElement, clientY: number, draggingPath: string): string | undefined {
    const cards = Array.from(laneEl.querySelectorAll<HTMLElement>('.kanban-rpm-card')).filter(
      (el) => el.dataset.path !== draggingPath
    );

    for (const cardEl of cards) {
      const rect = cardEl.getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) return cardEl.dataset.path;
    }

    return undefined;
  }

  private groupCardsForCurrentFilter(cards: ProjectCard[]): Array<{ project: string; cards: ProjectCard[] }> {
    const map = new Map<string, ProjectCard[]>();
    for (const card of cards) {
      const project = this.projectFilter ? card.subprojectTitle || 'No subproject' : card.projectTitle || 'No project';
      const existing = map.get(project) ?? [];
      existing.push(card);
      map.set(project, existing);
    }
    return Array.from(map.entries())
      .map(([project, groupCards]) => ({ project, cards: groupCards.sort(compareCards) }))
      .sort((a, b) => a.project.localeCompare(b.project));
  }

  private addProjectToken(container: HTMLElement, key: string): void {
    const token = container.createSpan({ cls: 'kanban-rpm-project-token' });
    token.style.setProperty('--rpm-project-color', this.projectColor(key));
  }

  private getConfiguredStatusId(preferredId: string): Status {
    return this.plugin.settings.statuses.find((status) => status.id === preferredId)?.id ?? preferredId;
  }

  private projectColor(key: string): string {
    let hash = 0;
    for (const char of (key || 'project')) hash = (hash * 31 + char.charCodeAt(0)) % 360;
    return `hsl(${hash} 62% 48%)`;
  }
}


